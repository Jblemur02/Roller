// Battle engine: rounds, action points, actions, formations, minions and a weak enemy AI.
// Pure game logic; the screen (views/BattleView.vue) calls these and renders `state`.
// Numbers live in data/battle.json.
import data from '../data/battle.json'

export const RULES = data.rules
export const BASIC_ATTACK = data.basicAttack
export const REST = data.rest
export const ENEMIES = data.enemies

export function actionData(card) {
  const a = data.actions[card.number]
  if (!a) return null
  return { ...a, tierPower: data.tierPower[card.tier.value] ?? 1 }
}

export function minionData(card) {
  const m = data.minions[card.number]
  if (!m) return null
  const mult = data.minionTierMult[card.tier.value] ?? 1
  return { ...m, mult, health: Math.round((card.stats?.Health || 300) * mult), damage: Math.round(m.damage * mult) }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ---------- setup ----------

/**
 * setup = {
 *   hero: { name, image, sheetFor(formationUid) -> final stats },
 *   minions: [card], actions: [card],
 *   formations: [{ uid, card, stats, side }], startFormation: uid | null,
 *   enemy: id in battle.json
 * }
 */
export function createBattle(setup, rng = Math.random) {
  const enemyDef = data.enemies[setup.enemy]
  const sheet = setup.hero.sheetFor(setup.startFormation)
  const state = {
    rng,
    setup,
    enemyDef,
    round: 0,
    phase: 'player', // player | over
    result: null, // win | lose
    ap: 0,
    apRate: sheet['AP rate'] || 1,
    maxMana: sheet.Mana || 0,
    maxEnergy: sheet.Energy || 0,
    mana: sheet.Mana || 0,
    energy: sheet.Energy || 0,
    exhaustion: 0,
    exhaustionRate: sheet['Exhaustion rate'] || 100,
    formation: setup.startFormation,
    enemyAP: 0,
    target: null,
    units: [],
    log: [],
    events: [],
  }

  state.units.push(unitFromSheet('hero', setup.hero.name, setup.hero.image, sheet))
  setup.minions.forEach((card, i) => {
    const m = minionData(card)
    if (!m) return
    state.units.push({
      id: `p-m${i}`, side: 'player', kind: 'minion', name: card.name, image: card.image, tier: card.tier.name,
      baseHealth: m.health, maxHp: m.health, hp: m.health,
      damage: m.damage, armour: m.armour, evasion: m.evasion, grip: m.grip, perforation: 0,
      lethalChance: m.lethalChance, lethal: m.lethal, lethalProtection: 0, statuses: [], alive: true,
    })
  })
  for (const u of enemyDef.units) {
    state.units.push({
      ...u, side: 'enemy', baseHealth: u.health, maxHp: u.health, hp: u.health, statuses: [], alive: true,
    })
  }
  recomputeMaxHp(state, true)
  state.target = state.units.find(u => u.side === 'enemy' && u.alive)?.id || null
  log(state, `The battle against ${enemyDef.name} begins.`, 'info')
  startRound(state)
  return state
}

function unitFromSheet(id, name, image, sheet) {
  return {
    id, side: 'player', kind: 'hero', name, image,
    baseHealth: sheet.Health, maxHp: sheet.Health, hp: sheet.Health,
    damage: sheet.Damage, armour: sheet.Armour, evasion: sheet.Evasion, grip: sheet.Grip, perforation: sheet.Perforation,
    lethalChance: sheet['Lethal chance'], lethal: sheet.Lethal, lethalProtection: sheet['Lethal protection'],
    statuses: [], alive: true,
  }
}

// ---------- formations ----------

export function currentFormation(state) {
  return state.setup.formations.find(f => f.uid === state.formation) || null
}

function fstat(state, key) {
  return currentFormation(state)?.stats?.[key] || 0
}

// Inner Peace of minions and enemies (the hero's is already inside its stat sheet).
function peaceOf(state, unit) {
  if (unit.kind === 'hero' && unit.side === 'player') return 100
  return Math.max(50, 100 + (unit.side === 'player' ? fstat(state, 'Team Inner Peace') : fstat(state, 'Enemy Inner Peace')))
}

// Max Health depends on the formation (Team Health) and Inner Peace; keep each unit's Health % when it changes.
function recomputeMaxHp(state, fresh = false) {
  for (const u of state.units) {
    let base = u.baseHealth
    if (u.side === 'player') base *= 1 + fstat(state, 'Team Health') / 100
    if (u.kind !== 'hero' || u.side === 'enemy') base *= peaceOf(state, u) / 100
    const max = Math.max(1, Math.round(base))
    const ratio = fresh ? 1 : u.hp / u.maxHp
    u.maxHp = max
    u.hp = u.alive ? Math.max(1, Math.round(max * ratio)) : 0
  }
}

// ---------- effective stats ----------

export function effective(state, unit) {
  const e = {
    damage: unit.damage, armour: unit.armour, evasion: unit.evasion, grip: unit.grip, perforation: unit.perforation,
    lethalChance: unit.lethalChance, lethal: unit.lethal, lethalProtection: unit.lethalProtection, missChance: 0,
  }
  let dmgPct = 0
  if (unit.side === 'player') {
    dmgPct += fstat(state, 'Team Damage')
    e.armour += fstat(state, 'Team Armour')
    e.evasion += fstat(state, 'Team Evasion')
    if (unit.kind === 'hero') {
      dmgPct += fstat(state, 'Hero Damage')
      e.lethalChance += fstat(state, 'Hero Lethal chance')
    }
  } else {
    e.armour += fstat(state, 'Enemy Armour')
    e.evasion += fstat(state, 'Enemy Evasion')
  }
  for (const s of unit.statuses) {
    if (s.type === 'windward') e.evasion += s.evasion
    if (s.type === 'fear') dmgPct += s.damagePct
    if (s.type === 'blind') e.missChance = Math.max(e.missChance, s.missChance)
  }
  e.damage *= 1 + dmgPct / 100
  if (unit.kind !== 'hero' || unit.side === 'enemy') e.damage *= peaceOf(state, unit) / 100
  if (unit.kind === 'hero' && unit.side === 'player') e.damage *= 1 - exhaustionLoss(state) / 100
  e.damage = Math.max(0, e.damage)
  e.armour = clamp(e.armour, 0, 90)
  e.evasion = clamp(e.evasion, 0, 95)
  return e
}

export function exhaustionLoss(state) {
  const x = RULES.exhaustion
  return Math.min(x.maxDamageLoss, state.exhaustion * x.damageLossPerPoint)
}

// ---------- combat ----------

function log(state, text, kind = 'info') {
  state.log.push({ text, kind, round: state.round })
  if (state.log.length > 200) state.log.shift()
}

function event(state, unitId, type, amount = 0) {
  state.events.push({ unitId, type, amount, n: state.events.length })
}

export function unit(state, id) {
  return state.units.find(u => u.id === id)
}

function alive(state, side) {
  return state.units.filter(u => u.side === side && u.alive)
}

// One attack: dodge, lethal, armour. Returns the damage dealt.
function attack(state, attacker, target, power, verb = 'hits') {
  const a = effective(state, attacker)
  const d = effective(state, target)
  const rng = state.rng
  const who = attacker.side === 'player' ? 'player' : 'enemy'
  if (a.missChance && rng() * 100 < a.missChance) {
    log(state, `${attacker.name} is blinded and misses ${target.name}.`, 'miss')
    event(state, target.id, 'miss')
    return 0
  }
  const dodge = clamp(d.evasion - a.grip, 0, 95)
  if (rng() * 100 < dodge) {
    log(state, `${target.name} dodges ${attacker.name}'s attack.`, 'miss')
    event(state, target.id, 'dodge')
    return 0
  }
  let dmg = a.damage * power * (1 + (rng() * 2 - 1) * RULES.spread)
  let lethal = false
  if (rng() * 100 < a.lethalChance) {
    const mult = clamp(1 + (a.lethal / 100) * (1 - d.lethalProtection / 100), 1, RULES.lethalMax)
    if (mult > 1) {
      dmg *= mult
      lethal = true
    }
  }
  const armour = clamp(d.armour - a.perforation, 0, 90)
  dmg = Math.max(1, Math.round(dmg * (1 - armour / 100)))
  damage(state, target, dmg)
  log(state, `${attacker.name} ${verb} ${target.name} for ${dmg}${lethal ? ' — a LETHAL hit!' : ''}`, lethal ? 'lethal' : who)
  event(state, target.id, lethal ? 'lethal' : 'hit', dmg)
  return dmg
}

function damage(state, target, amount) {
  target.hp = Math.max(0, target.hp - amount)
  if (target.hp === 0 && target.alive) {
    target.alive = false
    target.statuses = []
    log(state, `${target.name} is defeated.`, target.side === 'enemy' ? 'good' : 'bad')
    if (state.target === target.id) state.target = alive(state, 'enemy')[0]?.id || null
  }
}

function checkEnd(state) {
  if (state.result) return true
  if (!alive(state, 'enemy').length) {
    state.result = 'win'
    state.phase = 'over'
    log(state, 'Victory!', 'good')
    return true
  }
  if (!unit(state, 'hero').alive) {
    state.result = 'lose'
    state.phase = 'over'
    log(state, 'Your hero has fallen. Defeat.', 'bad')
    return true
  }
  return false
}

// ---------- the player's turn ----------

function startRound(state) {
  state.round += 1
  if (state.round === 1) {
    state.ap = Math.min(RULES.maxAP, RULES.startAP)
  } else {
    state.ap = Math.min(RULES.maxAP, state.ap + state.apRate)
    const regen = p => Math.max(5, Math.round((p * RULES.resourceRegenPct) / 100))
    state.mana = Math.min(state.maxMana, state.mana + (state.maxMana ? regen(state.maxMana) : 0))
    state.energy = Math.min(state.maxEnergy, state.energy + (state.maxEnergy ? regen(state.maxEnergy) : 0))
    state.exhaustion = Math.max(0, state.exhaustion - RULES.exhaustion.recoverPerRound)
  }
  state.phase = 'player'
  log(state, `Round ${state.round}: you have ${state.ap} AP.`, 'round')
}

export function setTarget(state, id) {
  const u = unit(state, id)
  if (u && u.side === 'enemy' && u.alive) state.target = id
}

// Can the player use this right now? Returns null if yes, or the reason.
export function cannotUse(state, kind, card) {
  if (state.phase !== 'player') return 'Not your turn.'
  if (kind === 'attack') return state.ap < BASIC_ATTACK.ap ? `Needs ${BASIC_ATTACK.ap} AP.` : null
  if (kind === 'switch') return state.ap < RULES.formationSwitchAP ? `Needs ${RULES.formationSwitchAP} AP.` : null
  if (kind === 'action') {
    const a = actionData(card)
    if (!a) return 'This card has no battle effect yet.'
    if (state.ap < a.ap) return `Needs ${a.ap} AP.`
    for (const [res, n] of Object.entries(a.cost || {})) {
      const have = res === 'Mana' ? state.mana : state.energy
      if (have < n) return `Needs ${n} ${res}.`
    }
  }
  return null
}

export function useBasicAttack(state) {
  const why = cannotUse(state, 'attack')
  if (why) throw new Error(why)
  const target = unit(state, state.target)
  if (!target?.alive) throw new Error('Pick an enemy to attack.')
  state.ap -= BASIC_ATTACK.ap
  attack(state, unit(state, 'hero'), target, BASIC_ATTACK.power, 'strikes')
  checkEnd(state)
}

export function useAction(state, card) {
  const why = cannotUse(state, 'action', card)
  if (why) throw new Error(why)
  const a = actionData(card)
  const hero = unit(state, 'hero')
  if (a.target === 'enemy' && !unit(state, state.target)?.alive) throw new Error('Pick an enemy first.')
  state.ap -= a.ap
  for (const [res, n] of Object.entries(a.cost || {})) {
    if (res === 'Mana') state.mana -= n
    else state.energy -= n
    if (a.magic) state.exhaustion = Math.min(100, state.exhaustion + Math.round((n * state.exhaustionRate) / 100))
  }
  log(state, `You use ${card.name}${a.tierPower !== 1 ? ` (${card.tier.name}, ×${a.tierPower})` : ''}.`, 'player')

  const targets =
    a.target === 'all-enemies' ? alive(state, 'enemy') :
    a.target === 'enemy' ? [unit(state, state.target)] :
    alive(state, 'player')

  for (const t of targets) {
    if (a.power > 0) attack(state, hero, t, a.power * a.tierPower, 'scorches')
    if (a.healPct) {
      const heal = Math.round((t.maxHp * a.healPct * a.tierPower) / 100)
      t.hp = Math.min(t.maxHp, t.hp + heal)
      event(state, t.id, 'heal', heal)
    }
    if (a.status && t.alive) {
      const s = { ...a.status }
      if (s.type === 'burn') s.value = Math.max(1, Math.round((effective(state, hero).damage * s.pctOfDamage * a.tierPower) / 100))
      if (s.evasion) s.evasion = Math.round(s.evasion * a.tierPower)
      if (s.damagePct) s.damagePct = Math.round(s.damagePct * a.tierPower)
      if (s.missChance) s.missChance = Math.min(90, Math.round(s.missChance * a.tierPower))
      t.statuses = t.statuses.filter(x => x.type !== s.type).concat(s)
    }
  }
  if (a.healPct) log(state, `Your team is healed ${Math.round(a.healPct * a.tierPower)}% and the wind makes them harder to hit.`, 'good')
  if (a.status?.type === 'blind') log(state, `${targets[0].name} is blinded.`, 'player')
  if (a.status?.type === 'fear') log(state, 'The enemy cowers: they deal less damage.', 'player')
  checkEnd(state)
}

export function switchFormation(state, uid) {
  const why = cannotUse(state, 'switch')
  if (why) throw new Error(why)
  const f = state.setup.formations.find(x => x.uid === uid)
  if (!f || uid === state.formation) throw new Error('Pick one of your reserve formations.')
  state.ap -= RULES.formationSwitchAP
  state.formation = uid
  // The hero's stat sheet (Inner Peace) follows the formation's alignment.
  const sheet = state.setup.hero.sheetFor(uid)
  const hero = unit(state, 'hero')
  Object.assign(hero, {
    baseHealth: sheet.Health, damage: sheet.Damage, armour: sheet.Armour, evasion: sheet.Evasion, grip: sheet.Grip,
    perforation: sheet.Perforation, lethalChance: sheet['Lethal chance'], lethal: sheet.Lethal, lethalProtection: sheet['Lethal protection'],
  })
  recomputeMaxHp(state)
  log(state, `Your army shifts into ${f.card.name}.`, 'player')
}

// ---------- end of turn: minions, then the enemy ----------

export function endTurn(state, rest = false) {
  if (state.phase !== 'player') return
  if (rest) {
    state.exhaustion = Math.max(0, state.exhaustion - RULES.exhaustion.restRecover)
    log(state, 'You rest and catch your breath.', 'player')
  }
  // Your minions attack your target, or the weakest enemy.
  for (const m of state.units.filter(u => u.side === 'player' && u.kind === 'minion' && u.alive)) {
    const t = unit(state, state.target)?.alive ? unit(state, state.target) : weakest(alive(state, 'enemy'))
    if (!t) break
    attack(state, m, t, 1)
    if (checkEnd(state)) return
  }
  enemyTurn(state)
  if (checkEnd(state)) return
  // Statuses wear off at the end of the round.
  for (const u of state.units) {
    for (const s of u.statuses) s.rounds -= 1
    u.statuses = u.statuses.filter(s => s.rounds > 0)
  }
  startRound(state)
}

function weakest(list) {
  return list.slice().sort((a, b) => a.hp - b.hp)[0] || null
}

// The weak AI: basic attacks at random targets, and sometimes hesitates.
function enemyTurn(state) {
  const ai = state.enemyDef.ai
  const rng = state.rng
  // Burns tick first.
  for (const u of alive(state, 'enemy')) {
    const burn = u.statuses.find(s => s.type === 'burn')
    if (burn) {
      damage(state, u, burn.value)
      log(state, `${u.name} burns for ${burn.value}.`, 'player')
      event(state, u.id, 'burn', burn.value)
    }
  }
  if (checkEnd(state)) return

  const pickTarget = () => {
    const minions = alive(state, 'player').filter(u => u.kind === 'minion')
    if (minions.length && rng() * 100 < ai.targetMinionChance) return minions[Math.floor(rng() * minions.length)]
    return unit(state, 'hero').alive ? unit(state, 'hero') : minions[0]
  }

  const boss = state.units.find(u => u.side === 'enemy' && u.kind === 'hero')
  if (boss?.alive) {
    state.enemyAP = Math.min(RULES.maxAP, state.enemyAP + (state.round === 1 ? boss.startAP : boss.apRate))
    let acted = false
    while (state.enemyAP >= BASIC_ATTACK.ap && !state.result) {
      if (rng() * 100 < ai.hesitateChance) {
        log(state, `${boss.name} hesitates.`, 'miss')
        break
      }
      state.enemyAP -= BASIC_ATTACK.ap
      attack(state, boss, pickTarget(), 1)
      acted = true
      if (checkEnd(state)) return
    }
    if (!acted && state.enemyAP < BASIC_ATTACK.ap) log(state, `${boss.name} gathers strength.`, 'enemy')
  }
  for (const m of state.units.filter(u => u.side === 'enemy' && u.kind === 'minion' && u.alive)) {
    attack(state, m, pickTarget(), 1)
    if (checkEnd(state)) return
  }
}
