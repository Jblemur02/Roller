// Formation stats: team-wide effects that grow with rank and level, like gear, plus an alignment
// (Order / Balance / Chaos) that moves Inner Peace. Numbers live in data/formations.json; ranks,
// max levels and costs are the gear tiers in data/gear.json.
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

// Bonuses stop at `cap`, drawbacks at `floor`. Enemy debuffs use a negative cap.
function limit(key, v) {
  const d = DEF[key]
  if (!d) return v
  if (d.enemy) return d.cap !== undefined ? Math.max(d.cap, v) : v
  if (d.cap !== undefined) v = Math.min(d.cap, v)
  if (d.floor !== undefined) v = Math.max(d.floor, v)
  return v
}

// Bonuses and drawbacks both scale with rank (same multipliers as gear) and level
// (formations' own, gentler levelBonus). One decimal, so every level visibly changes something.
export function formationStatsAt(number, tierCode, level = 1) {
  const item = formationItem(number)
  const tier = gearTierFor(tierCode)
  if (!item || !tier) return {}
  const scale = tier.statMult * (1 + (data.levelBonus ?? gearData.levelBonus) * (level - 1))
  const out = {}
  for (const [k, v] of Object.entries({ ...item.stats })) out[k] = v * scale
  for (const [k, v] of Object.entries(item.drawbacks || {})) out[k] = (out[k] || 0) + v * scale
  for (const k of Object.keys(out)) out[k] = limit(k, Math.round(out[k] * 10) / 10)
  return out
}

export function formationUnit(key) {
  return DEF[key]?.unit || ''
}

// How a formation's alignment sits with your side, in Inner Peace.
export function formationPeace(formationSide, playerSide) {
  const p = data.alignmentPeace
  if (!playerSide) return { delta: p.noSide, reason: 'no class chosen' }
  if (!formationSide) return { delta: p.neutral, reason: 'neutral' }
  if (formationSide === playerSide) return { delta: p.sameSide, reason: 'your side' }
  if (formationSide === 'balance' || playerSide === 'balance') return { delta: p.balanceMismatch, reason: 'other side' }
  return { delta: p.opposed, reason: 'opposing side' }
}

export const ALIGNMENT_PEACE = data.alignmentPeace
