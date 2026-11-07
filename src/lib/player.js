// The signed-in player's save: currencies, cards, gear, deck and class.
import { reactive, computed } from 'vue'
import { decodeCard, rarityRank } from './cards.js'

export const STARTING_SHARDS = 500
const LOCAL_KEY = 'roller.player.v1'
const OLD_WALLET_KEY = 'roller.wallet.v1'

export const GEAR_SLOTS = [
  { id: 'head', label: 'Head', accepts: c => c.type === 'Head' },
  { id: 'neck', label: 'Neck', accepts: c => c.type === 'Jewelry' && ['Amulet', 'Necklace'].includes(c.subtype) },
  { id: 'body', label: 'Body', accepts: c => c.type === 'Body' },
  { id: 'back', label: 'Back', accepts: c => ['Cape', 'Backpack'].includes(c.subtype) },
  { id: 'leftHand', label: 'Left hand', accepts: c => c.type === 'Arms' },
  { id: 'rightHand', label: 'Right hand', accepts: c => c.type === 'Arms' },
  { id: 'waist', label: 'Waist', accepts: c => c.subtype === 'Belt' },
  { id: 'feet', label: 'Feet', accepts: c => c.type === 'Feet' },
]

export const session = reactive({
  status: 'connecting', // connecting | onboarding | ready | error
  mode: null, // cloud | local
  reason: null,
  isOwner: false,
  uid: null,
  saving: false,
  saveError: '',
  loadError: '',
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
  return {
    ...newProfileDefaults(),
    ...p,
    collection: { ...(p.collection || {}) },
    gear: { ...(p.gear || {}) },
    deck: { ...(p.deck || {}) },
  }
}
function newProfileDefaults() {
  return { level: 1, shards: 0, chronos: 0, collection: {}, gear: {}, deck: {}, side: null, className: null, packsOpened: 0, recentPulls: [], sales: [] }
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
    async load() {
      const snap = await Promise.race([
        ref.get(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ])
      return snap.exists ? snap.data() : null
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

export async function start(platform) {
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
    session.loadError = 'Your save could not be reached. Check your connection and reload the page.'
    session.status = 'error'
  }
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

// ---------- cards ----------

export function ownedCount(uid) {
  return player.profile?.collection[uid] || 0
}

// Copies that are equipped or in the deck can't be sold or auctioned.
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

export function equip(slotId, uid) {
  const p = player.profile
  if (uid) {
    const slot = GEAR_SLOTS.find(s => s.id === slotId)
    const card = decodeCard(uid)
    if (!slot || !card || !slot.accepts(card)) throw new Error('That card doesn\'t fit this slot.')
    if (p.gear[slotId] !== uid && freeCount(uid) < 1) throw new Error('All your copies of that card are already in use.')
    p.gear[slotId] = uid
  } else {
    delete p.gear[slotId]
  }
  save()
}

export const gearStats = computed(() => {
  const totals = {}
  for (const uid of Object.values(player.profile?.gear || {})) {
    const card = decodeCard(uid)
    for (const [k, v] of Object.entries(card?.stats || {})) totals[k] = (totals[k] || 0) + v
  }
  return totals
})

// ---------- deck ----------

export function deckAdd(uid) {
  if (freeCount(uid) < 1) throw new Error('No free copies of that card left.')
  const p = player.profile
  p.deck[uid] = (p.deck[uid] || 0) + 1
  save()
}

export function deckRemove(uid) {
  const p = player.profile
  if (!p.deck[uid]) return
  p.deck[uid] -= 1
  if (p.deck[uid] <= 0) delete p.deck[uid]
  save()
}

export const deckSize = computed(() => Object.values(player.profile?.deck || {}).reduce((a, b) => a + b, 0))

// ---------- class ----------

export function chooseClass(side, className) {
  player.profile.side = side
  player.profile.className = className
  save()
}
