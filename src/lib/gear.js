// Gear rules: tiers, slots, stats by tier and level, Inner Peace, final stats and Gear Score.
// All the numbers live in data/gear.json; base stats come from data/stats.json.
import gear from '../data/gear.json'
import baseFile from '../data/stats.json'

export const STAT_DEFS = gear.stats
export const STAT_KEYS = STAT_DEFS.map(s => s.key)
const DEF = Object.fromEntries(STAT_DEFS.map(s => [s.key, s]))
export const GEAR_TIERS = gear.tiers
export const GEAR_SLOTS = gear.slots

const tierByValue = new Map(GEAR_TIERS.map(t => [t.value, t]))
const tierByCardTier = new Map(GEAR_TIERS.flatMap(t => t.fromCardTiers.map(ct => [ct, t])))
const tierIndex = code => GEAR_TIERS.findIndex(t => t.value === code)

// Base stats, read from stats.json ("resilience.health" etc).
export const BASE_STATS = Object.fromEntries(
  STAT_DEFS.map(s => [s.key, Number(s.from.split('.').reduce((o, k) => o?.[k], baseFile.base)) || 0]),
)

export function isGearNumber(number) {
  return Object.prototype.hasOwnProperty.call(gear.items, number)
}

export function gearItem(number) {
  return gear.items[number] || null
}

// A pack rolls a normal card tier ("09" Ultra); gear converts it to a gear tier ("G3" Tempered).
export function gearTierFor(tierCode) {
  return tierByValue.get(tierCode) || tierByCardTier.get(tierCode) || null
}

export function maxLevel(tier) {
  return gearTierFor(tier.value)?.maxLevel || 1
}

// One piece of gear at a tier and level: base x tier multiplier x (1 + 12% per level above 1),
// plus any fixed bonuses it has at that tier.
export function statsAt(number, tierCode, level = 1) {
  const item = gearItem(number)
  const tier = gearTierFor(tierCode)
  if (!item || !tier) return {}
  const scale = tier.statMult * (1 + gear.levelBonus * (level - 1))
  const out = {}
  for (const [k, v] of Object.entries(item.stats)) out[k] = Math.round(v * scale)
  for (const [k, f] of Object.entries(item.fixed || {})) {
    if (!f.minTier || tierIndex(tier.value) >= tierIndex(f.minTier)) out[k] = (out[k] || 0) + f.value
  }
  return out
}

// Chronos to go from `level` to `level + 1`, or null at max level.
export function upgradeCost(tierCode, level) {
  const tier = gearTierFor(tierCode)
  if (!tier || level >= tier.maxLevel) return null
  return Math.round(gear.levelCostBase * Math.pow(level, 1.5) * tier.levelCostMult)
}

// How one item's side sits with yours.
export function peaceFor(itemSide, playerSide) {
  const p = gear.peace
  if (!playerSide) return { delta: p.noSide, reason: 'no class chosen' }
  if (!itemSide) return { delta: p.neutral, reason: 'neutral' }
  if (itemSide === playerSide) return { delta: p.sameSide, reason: 'your side' }
  if (itemSide === 'balance' || playerSide === 'balance') return { delta: p.balanceMismatch, reason: 'other side' }
  return { delta: p.opposed, reason: 'opposing side' }
}

export function addStats(...sets) {
  const out = Object.fromEntries(STAT_KEYS.map(k => [k, 0]))
  for (const s of sets) for (const [k, v] of Object.entries(s || {})) out[k] = (out[k] || 0) + v
  return out
}

// Turn a set of stats into one number, so loadouts can be compared.
export function score(stats) {
  let total = 0
  for (const s of STAT_DEFS) total += (s.weight || 0) * (stats[s.key] || 0)
  return Math.round(total)
}

/**
 * Everything the gear screen needs for a loadout.
 * pieces: [{ number, tier (code), level, name }]
 */
export function loadout(pieces, playerSide) {
  const gearStats = addStats(...pieces.map(p => statsAt(p.number, p.tier, p.level)))

  // Inner peace: base, then each item's side, then fixed peace bonuses (already in gearStats).
  const ipDef = DEF['Inner peace']
  const breakdown = pieces.map(p => ({ name: p.name, side: gearItem(p.number)?.side || null, ...peaceFor(gearItem(p.number)?.side, playerSide) }))
  const sideDelta = breakdown.reduce((s, b) => s + b.delta, 0)
  const rawPeace = BASE_STATS['Inner peace'] + sideDelta + (gearStats['Inner peace'] || 0)
  const peace = Math.min(ipDef.max, Math.max(ipDef.min, rawPeace))

  const final = {}
  for (const s of STAT_DEFS) {
    if (s.key === 'Inner peace') {
      final[s.key] = peace
      continue
    }
    let v = BASE_STATS[s.key] + (gearStats[s.key] || 0)
    if (!s.noPeace) v = (v * peace) / 100
    if (s.cap !== undefined) v = Math.min(s.cap, v)
    final[s.key] = Math.max(0, Math.round(v))
  }
  return {
    base: BASE_STATS,
    gear: gearStats,
    peace: { value: peace, base: BASE_STATS['Inner peace'], fromSides: sideDelta, fromItems: gearStats['Inner peace'] || 0, breakdown },
    final,
    score: score(final),
  }
}

// Gear rank on the same scale as card tiers (lower = rarer), for sorting and highlights.
export const GEAR_RANK = { G5: 2, G4: 6, G3: 9, G2: 11.5, G1: 13.5 }
