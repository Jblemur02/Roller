// Formation stats: team-wide effects that grow with rank and level, like gear.
// Numbers live in data/formations.json; ranks, max levels and costs are the gear tiers in data/gear.json.
import data from '../data/formations.json'
import gearData from '../data/gear.json'
import { gearTierFor } from './gear.js'

export const FORMATION_STATS = data.stats
const DEF = Object.fromEntries(FORMATION_STATS.map(s => [s.key, s]))

export function isFormationNumber(number) {
  return Object.prototype.hasOwnProperty.call(data.items, number)
}

export function formationItem(number) {
  return data.items[number] || null
}

// Is this value good for you? Enemy stats are good when negative.
export function isBenefit(key, value) {
  return DEF[key]?.enemy ? value < 0 : value > 0
}

function capped(key, v) {
  const cap = DEF[key]?.cap
  if (cap === undefined) return v
  return cap < 0 ? Math.max(cap, v) : Math.min(cap, v)
}

// Bonuses scale with rank (same multipliers as gear) and level (formations' own, gentler levelBonus).
// Drawbacks stay as written.
export function formationStatsAt(number, tierCode, level = 1) {
  const item = formationItem(number)
  const tier = gearTierFor(tierCode)
  if (!item || !tier) return {}
  const scale = tier.statMult * (1 + (data.levelBonus ?? gearData.levelBonus) * (level - 1))
  const out = {}
  // One decimal, so every level visibly adds something even to small bonuses.
  for (const [k, v] of Object.entries(item.stats)) out[k] = Math.round(v * scale * 10) / 10
  for (const [k, v] of Object.entries(item.drawbacks || {})) out[k] = (out[k] || 0) + v
  for (const k of Object.keys(out)) out[k] = capped(k, out[k])
  return out
}

export function formationUnit(key) {
  return DEF[key]?.unit || ''
}
