// The signed-in player's save: currencies, cards, gear, hand and class.
import { reactive, computed } from 'vue'
import { canonicalId, decodeCard, rarityRank } from './cards.js'
import { GEAR_SLOTS, gearItem, loadout, maxLevel, statsAt, upgradeCost } from './gear.js'
import { canWear, classBuild } from './builds.js'
import handRules from '../data/hand.json'
import { formationItem, formationPeace, formationStatsAt } from './formations.js'
import classData from '../data/classes.json'

export { GEAR_SLOTS }

export const STARTING_SHARDS = 500
const LOCAL_KEY = 'roller.player.v1'
const OLD_WALLET_KEY = 'roller.wallet.v1'


export const session = reactive({
  status: 'connecting', // connecting | onboarding | ready | error
  mode: null, // cloud | local
  reason: null,
  isOwner: false,
  uid: null,
  saving: false,
  saveError: '',
  loadError: '',
  loadDetail: '',
})

export const player = reactive({ profile: null })

let backend = null

function newProfile(username) {
  const p = {
    username,
    level: 1,
    shards: STARTING_SHARDS,
    chronos: 0,
    collection: {},
    gear: {},
    gearLevels: {},
    deck: {},
    side: null,
    className: null,
    packsOpened: 0,
    recentPulls: [],
    sales: [],
    createdAt: Date.now(),
  }
  // Bring over cards from the first version of the shop, if this browser has them.
  try {
    const old = JSON.parse(localStorage.getItem(OLD_WALLET_KEY))
    if (old && typeof old.shards === 'number') {
      p.shards = old.shards
      p.collection = old.collection || {}
      p.packsOpened = old.packsOpened || 0
    }
  } catch {}
  return p
}

function normalise(p) {
  // Merge any old-format card IDs into the current format.
  const merge = obj => {
    const out = {}
    for (const [uid, n] of Object.entries(obj || {})) {
      const id = canonicalId(uid)
      out[id] = (out[id] || 0) + n
    }
    return out
  }
  const collection = merge(p.collection)

  // Gear slots from before the gear rework: hands became main/off hand; back and waist are gone.
  const RENAMED = { leftHand: 'mainHand', rightHand: 'offHand' }
  const gear = {}
  for (const [slot, uid] of Object.entries(p.gear || {})) {
    const id = RENAMED[slot] || slot
    const fits = GEAR_SLOTS.find(s => s.id === id)
    const card = decodeCard(uid)
    if (fits && card?.gear && card.gear.kind === fits.kind) gear[id] = canonicalId(uid)
  }
  // The Hand (stored as `deck`): drop anything that no longer belongs and trim to the rules.
  const deck = trimHand(merge(p.deck), p.className).hand

  const gearLevels = {}
  for (const [uid, lv] of Object.entries(p.gearLevels || {})) gearLevels[canonicalId(uid)] = Math.max(gearLevels[canonicalId(uid)] || 1, lv)

  const out = {
    ...newProfileDefaults(),
    ...p,
    collection,
    gear,
    gearLevels,
    deck,
    startFormation: p.startFormation ? canonicalId(p.startFormation) : null,
  }
  dropUnwearable(out)
  fixStartFormation(out)
  return out
}
function newProfileDefaults() {
  return { level: 1, shards: 0, chronos: 0, collection: {}, gear: {}, gearLevels: {}, deck: {}, startFormation: null, side: null, className: null, packsOpened: 0, recentPulls: [], sales: [] }
}

// ---------- storage backends ----------

function localBackend() {
  return {
    async load() {
      try {
        const raw = localStorage.getItem(LOCAL_KEY)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    async save(profile) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(profile))
    },
    async remove() {
      localStorage.removeItem(LOCAL_KEY)
    },
  }
}

function cloudBackend(db, uid) {
  const ref = db.doc(`data/users/${uid}/profile`)
  return {
    // The store can be briefly unavailable or slow to wake up: retry with a growing wait
    // before giving up. Only errors that can't succeed on retry stop it early.
    async load() {
      let last
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const snap = await Promise.race([
            ref.get(),
            new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timed out'), { code: 'timeout' })), 15000)),
          ])
          // Saves arrive frozen (read-only); copy so the game can update them.
          return snap.exists ? structuredClone(snap.data()) : null
        } catch (e) {
          last = e
          console.warn(`Loading your save failed (attempt ${attempt + 1})`, e)
          if (['invalid_argument', 'revoked', 'not_granted', 'capability_disabled'].includes(e?.code)) break
          if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * 2 ** attempt))
        }
      }
      throw last
    },
    async save(profile) {
      await ref.set(profile)
    },
    async remove() {
      await ref.delete()
    },
  }
}

// ---------- saving: one write at a time, coalesced ----------

// Changes are batched for at most a second, so quick clicks don't each cost a network write,
// and anything still pending is written when the page is hidden or closed.
let saveTimer = null
let firstPending = 0
let saveChain = Promise.resolve()

function snapshot() {
  return JSON.parse(JSON.stringify(player.profile))
}

export function save({ now = false } = {}) {
  if (now || session.mode !== 'cloud') {
    clearTimeout(saveTimer)
    saveTimer = null
    return flush()
  }
  const t = Date.now()
  if (!saveTimer) firstPending = t
  clearTimeout(saveTimer)
  saveTimer = setTimeout(flush, Math.max(0, Math.min(400, firstPending + 1000 - t)))
  return saveChain
}

function flushPending() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    flush()
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushPending()
})
window.addEventListener('pagehide', flushPending)

function flush() {
  saveTimer = null
  if (!backend || !player.profile) return saveChain
  const data = snapshot()
  session.saving = true
  saveChain = saveChain
    .then(() => backend.save(data))
    .then(() => {
      session.saveError = ''
    })
    .catch(e => {
      console.error('Save failed', e)
      session.saveError = e?.code === 'quota_exceeded' ? 'Storage is full.' : 'Could not save your progress. Retrying on your next action.'
    })
    .finally(() => {
      session.saving = false
    })
  return saveChain
}

// ---------- start-up ----------

let lastPlatform = null

export async function start(platform) {
  lastPlatform = platform
  session.status = 'connecting'
  session.loadError = ''
  session.mode = platform.mode
  session.reason = platform.reason || null
  session.isOwner = platform.isOwner
  session.uid = platform.uid || 'local'
  backend = platform.mode === 'cloud' ? cloudBackend(platform.db, platform.uid) : localBackend()
  try {
    const saved = await backend.load()
    if (saved && typeof saved.username === 'string') {
      player.profile = normalise(saved)
      session.status = 'ready'
    } else {
      session.status = 'onboarding'
    }
  } catch (e) {
    console.error('Load failed', e)
    session.loadError = 'Your save couldn\'t be loaded right now. It\'s safe; nothing was changed.'
    session.loadDetail = [e?.code, e?.message].filter(Boolean).join(': ') || String(e)
    session.status = 'error'
  }
}

// Try loading again after an error, without reloading the page.
export function retryLoad() {
  if (lastPlatform) return start(lastPlatform)
}

export async function createPlayer(username) {
  player.profile = newProfile(username)
  await save({ now: true })
  if (session.saveError) throw new Error(session.saveError)
  try { localStorage.removeItem(OLD_WALLET_KEY) } catch {}
  session.status = 'ready'
}

export async function deletePlayer() {
  await backend.remove()
  player.profile = null
  session.status = 'onboarding'
}

// ---------- currencies ----------

export function canAfford(price, currency = 'shards') {
  return !!player.profile && player.profile[currency] >= price
}

export function addShards(amount) {
  player.profile.shards += amount
  save()
}

// Testing tools: change a balance to any amount (never below 0).
export const MAX_BALANCE = 1_000_000_000_000
export function changeBalance(currency, amount, mode = 'add') {
  if (!['shards', 'chronos'].includes(currency)) throw new Error('Unknown currency')
  const n = Math.trunc(Number(amount))
  if (!Number.isFinite(n)) throw new Error('Enter a whole number.')
  const next = mode === 'set' ? n : player.profile[currency] + n
  player.profile[currency] = Math.min(MAX_BALANCE, Math.max(0, next))
  save()
  return player.profile[currency]
}

// ---------- cards ----------

export function ownedCount(uid) {
  return player.profile?.collection[uid] || 0
}

// Copies that are equipped or in the Hand can't be sold or auctioned.
export function reservedCount(uid) {
  const p = player.profile
  if (!p) return 0
  const equipped = Object.values(p.gear).filter(g => g === uid).length
  return equipped + (p.deck[uid] || 0)
}

export function freeCount(uid) {
  return Math.max(0, ownedCount(uid) - reservedCount(uid))
}

export function addCards(cards) {
  const p = player.profile
  for (const c of cards) p.collection[c.uid] = (p.collection[c.uid] || 0) + (c.qty || 1)
}

export function removeCards(uid, qty) {
  const p = player.profile
  if (freeCount(uid) < qty) throw new Error('You don\'t have enough free copies of that card.')
  p.collection[uid] -= qty
  if (p.collection[uid] <= 0) delete p.collection[uid]
}

export function buyPack(item, cards) {
  const p = player.profile
  if (p.shards < item.price) return false
  p.shards -= item.price
  addCards(cards)
  p.packsOpened += 1
  const best = [...cards].sort((a, b) => rarityRank(a.tier) - rarityRank(b.tier) || b.value - a.value)[0]
  p.recentPulls = [{ uid: best.uid, pack: item.name, at: Date.now() }, ...p.recentPulls].slice(0, 8)
  save()
  return true
}

export function sellCards(uid, qty) {
  const card = decodeCard(uid)
  if (!card) throw new Error('Unknown card')
  removeCards(uid, qty)
  const earned = card.value * qty
  player.profile.chronos += earned
  save()
  return earned
}

// Every card the player owns, decoded, with counts.
export const collectionList = computed(() => {
  const p = player.profile
  if (!p) return []
  return Object.entries(p.collection)
    .map(([uid, quantity]) => {
      const card = decodeCard(uid)
      if (!card || quantity <= 0) return null
      return { ...card, quantity, reserved: reservedCount(uid), totalValue: card.value * quantity }
    })
    .filter(Boolean)
})

export const collectionValue = computed(() => collectionList.value.reduce((s, c) => s + c.totalValue, 0))

// ---------- gear ----------

export function gearLevel(uid) {
  return player.profile?.gearLevels[uid] || 1
}

// Level, stats and upgrade cost for anything ranked (gear or a formation) at its current level.
export function levelInfo(uid) {
  const card = decodeCard(uid)
  if (!card?.ranked) return null
  const level = gearLevel(uid)
  const next = upgradeCost(card.tier.value, level)
  const statsFor = card.gear
    ? l => statsAt(card.number, card.tier.value, l)
    : l => formationStatsAt(card.number, card.tier.value, l)
  return {
    card,
    uid,
    level,
    maxLevel: maxLevel(card.tier),
    stats: statsFor(level),
    nextStats: next === null ? null : statsFor(level + 1),
    upgradeCost: next,
  }
}

// Everything about one owned piece of gear at its current level.
export function gearInfo(uid) {
  const info = levelInfo(uid)
  if (!info?.card.gear) return null
  return { ...info, side: gearItem(info.card.number).side }
}

function piecesOf(gearMap) {
  return Object.values(gearMap)
    .map(gearInfo)
    .filter(Boolean)
    .map(i => ({ number: i.card.number, tier: i.card.tier.value, level: i.level, name: i.card.name }))
}

// Full stat sheet for a set of equipped gear (defaults to what's equipped now).
// The player's class build (base stats + what they can wear), or null with no class.
export const myBuild = computed(() => classBuild(player.profile?.className))

// The starting formation moves Inner Peace through its alignment and any Team Inner Peace it gives.
function formationPeaceSources(uid = player.profile?.startFormation) {
  const p = player.profile
  if (!uid || !p.deck[uid]) return []
  const info = levelInfo(uid)
  if (!info) return []
  const item = formationItem(info.card.number)
  const out = [{ name: `${info.card.name} (formation)`, side: item.side, ...formationPeace(item.side, p.side) }]
  const team = info.stats['Team Inner Peace']
  if (team) out.push({ name: `${info.card.name} effect`, side: null, delta: team, reason: 'Team Inner Peace' })
  return out
}

export function loadoutFor(gearMap = player.profile?.gear || {}) {
  return loadout(piecesOf(gearMap), player.profile?.side || null, myBuild.value?.stats, formationPeaceSources())
}

export function wearable(uid) {
  const card = decodeCard(uid)
  return !!card?.gear && canWear(card.number, myBuild.value)
}

// Take off anything the current class can't wear; returns the names removed.
function dropUnwearable(p) {
  const build = classBuild(p.className)
  const removed = []
  for (const [slot, uid] of Object.entries(p.gear)) {
    const card = decodeCard(uid)
    if (card && !canWear(card.number, build)) {
      removed.push(card.name)
      delete p.gear[slot]
    }
  }
  return removed
}

// ---------- battle ----------

// Everything a battle needs from the save: the hero's stats for any formation, and the Hand.
export function battleSetup(enemy) {
  const p = player.profile
  const h = hand.value
  const minions = h.minions.flatMap(e => Array.from({ length: e.count }, () => e.card))
  const formations = h.formations.map(e => {
    const info = levelInfo(e.uid)
    return { uid: e.uid, card: e.card, stats: info?.stats || {}, side: formationItem(e.card.number)?.side || null }
  })
  return {
    enemy,
    hero: {
      name: p.username,
      image: p.side ? `img/classes/${p.side}.webp` : null,
      sheetFor: uid => loadout(piecesOf(p.gear), p.side || null, myBuild.value?.stats, formationPeaceSources(uid)).final,
    },
    minions,
    actions: h.actions.map(e => e.card),
    formations,
    startFormation: formations.find(f => f.uid === p.startFormation)?.uid || null,
  }
}

export function grantBattleReward(reward) {
  const p = player.profile
  p.shards += reward.shards || 0
  p.chronos += reward.chronos || 0
  p.battlesWon = (p.battlesWon || 0) + 1
  save()
}

export const currentLoadout = computed(() => loadoutFor(player.profile?.gear || {}))

// Score change if `uid` went into `slotId` (null = empty the slot).
export function scoreDelta(slotId, uid) {
  const now = currentLoadout.value.score
  const next = { ...player.profile.gear }
  if (uid) next[slotId] = uid
  else delete next[slotId]
  return loadoutFor(next).score - now
}

export function equip(slotId, uid) {
  const p = player.profile
  if (uid) {
    const slot = GEAR_SLOTS.find(s => s.id === slotId)
    const card = decodeCard(uid)
    if (!slot || !card?.gear || card.gear.kind !== slot.kind) throw new Error('That card doesn\'t fit this slot.')
    if (!canWear(card.number, myBuild.value)) throw new Error(`${card.name} is too ${gearItem(card.number).weight} for a ${myBuild.value.name} build.`)
    if (p.gear[slotId] !== uid && freeCount(uid) < 1) throw new Error('All your copies of that card are already in use.')
    p.gear[slotId] = uid
  } else {
    delete p.gear[slotId]
  }
  save()
}

// Fill the slots with whatever gives the highest final score, Inner Peace included.
// Greedy, two passes so later slots can correct earlier picks.
export function equipBest() {
  const p = player.profile
  const owned = {}
  for (const c of collectionList.value) if (c.gear) owned[c.uid] = c.quantity - (p.deck[c.uid] || 0)
  let best = {}
  for (let pass = 0; pass < 2; pass++) {
    for (const slot of GEAR_SLOTS) {
      const used = {}
      for (const [sid, uid] of Object.entries(best)) if (sid !== slot.id) used[uid] = (used[uid] || 0) + 1
      let pick = best[slot.id] || null
      const without = { ...best }
      delete without[slot.id]
      let pickScore = pick ? loadoutFor(best).score : loadoutFor(without).score
      for (const uid of Object.keys(owned)) {
        if (owned[uid] - (used[uid] || 0) < 1) continue
        if (decodeCard(uid).gear.kind !== slot.kind || !wearable(uid)) continue
        const sc = loadoutFor({ ...without, [slot.id]: uid }).score
        if (sc > pickScore) {
          pick = uid
          pickScore = sc
        }
      }
      if (pick) best[slot.id] = pick
      else delete best[slot.id]
    }
  }
  p.gear = best
  save()
}

// Level up gear or a formation with Chronos.
export function upgradeGear(uid) {
  const p = player.profile
  const info = levelInfo(uid)
  if (!info || ownedCount(uid) < 1) throw new Error('You don\'t own that card.')
  if (info.upgradeCost === null) throw new Error('Already at max level.')
  if (p.chronos < info.upgradeCost) throw new Error(`You need ${info.upgradeCost.toLocaleString()} Chronos.`)
  p.chronos -= info.upgradeCost
  p.gearLevels[uid] = info.level + 1
  save()
  return info.level + 1
}

export const ownedGear = computed(() =>
  collectionList.value.filter(c => c.gear).map(c => ({ ...gearInfo(c.uid), quantity: c.quantity, reserved: c.reserved })),
)

// ---------- hand ----------
// The cards you take into battle: formations, actions (Talents) and minions. Stored as profile.deck.

export const HAND_RULES = handRules

export function handSection(card) {
  return card ? handRules.sections[card.type] || null : null
}

function classMinions(className) {
  for (const s of classData.sides) for (const c of s.classes) if (c.name === className) return c.minions || 0
  return 0
}

export function handLimit(section, className = player.profile?.className) {
  return section === 'minions' ? classMinions(className) : handRules.limits[section] || 0
}

// Keep only cards that belong in a hand, within each section's limit and duplicate rule.
function trimHand(deck, className) {
  const hand = {}
  const used = { formations: 0, actions: 0, minions: 0 }
  const removed = []
  for (const [uid, count] of Object.entries(deck || {})) {
    const card = decodeCard(uid)
    const sec = handSection(card)
    if (!sec) {
      if (card) removed.push(card.name)
      continue
    }
    let n = handRules.duplicates[sec] ? count : Math.min(1, count)
    n = Math.min(n, handLimit(sec, className) - used[sec])
    if (n > 0) {
      hand[uid] = n
      used[sec] += n
    }
    if (n < count) removed.push(card.name)
  }
  return { hand, removed }
}

// The starting formation must be one of the Hand's formations; fall back to the first one.
function fixStartFormation(p) {
  const formations = Object.keys(p.deck || {}).filter(uid => handSection(decodeCard(uid)) === 'formations').sort()
  if (!formations.includes(p.startFormation)) p.startFormation = formations[0] || null
}

export function setStartFormation(uid) {
  const p = player.profile
  if (!p.deck[uid] || handSection(decodeCard(uid)) !== 'formations') throw new Error('That formation isn\'t in your Hand.')
  p.startFormation = uid
  save()
}

export const hand = computed(() => {
  const out = { formations: [], actions: [], minions: [] }
  for (const [uid, count] of Object.entries(player.profile?.deck || {})) {
    const card = decodeCard(uid)
    const sec = handSection(card)
    if (sec) out[sec].push({ card, uid, count })
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.card.name.localeCompare(b.card.name))
  return out
})

export function handCount(section) {
  return hand.value[section].reduce((s, e) => s + e.count, 0)
}

export function handAdd(uid) {
  const p = player.profile
  const card = decodeCard(uid)
  const sec = handSection(card)
  if (card?.gear) throw new Error('Gear is equipped from the Gear tab, not carried in your Hand.')
  if (card?.type === 'Augment') throw new Error('Augments are passive buffs, so they don\'t go in your Hand.')
  if (!sec) throw new Error('That card can\'t go in your Hand.')
  const limit = handLimit(sec)
  if (sec === 'minions' && !limit) throw new Error('Choose a class first: it decides how many minions you can bring.')
  if (handCount(sec) >= limit) throw new Error(`Your Hand already has ${limit} ${sec === 'formations' && limit === 1 ? 'formation' : sec}.`)
  if (!handRules.duplicates[sec] && p.deck[uid]) throw new Error(`${card.name} is already in your Hand.`)
  if (freeCount(uid) < 1) throw new Error('No free copies of that card left.')
  p.deck[uid] = (p.deck[uid] || 0) + 1
  fixStartFormation(p)
  save()
}

export function handRemove(uid) {
  const p = player.profile
  if (!p.deck[uid]) return
  p.deck[uid] -= 1
  if (p.deck[uid] <= 0) delete p.deck[uid]
  fixStartFormation(p)
  save()
}

export const handSize = computed(() => Object.values(player.profile?.deck || {}).reduce((a, b) => a + b, 0))

// ---------- class ----------

export function chooseClass(side, className) {
  player.profile.side = side
  player.profile.className = className
  const removed = dropUnwearable(player.profile)
  // A new class can mean fewer minion slots.
  const trimmed = trimHand(player.profile.deck, className)
  player.profile.deck = trimmed.hand
  save()
  return [...removed, ...trimmed.removed.map(n => `${n} (Hand)`)]
}
