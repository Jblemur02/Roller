// Loads pack contents and rolls cards out of them.
import shop from '../data/shop.json'
import { decodeCard } from './cards.js'

const packFiles = import.meta.glob('../data/packs/*.json', { eager: true, import: 'default' })
const contentsByName = Object.fromEntries(
  Object.entries(packFiles).map(([path, data]) => [path.split('/').pop().replace('.json', ''), data]),
)

export const categories = shop.categories
export const items = shop.items
export const featured = shop.featured.map(id => items.find(i => i.id === id)).filter(Boolean)

const poolCache = new Map()

// Builds the weighted pool for a pack: one entry per card slot with its pull rate as weight.
// Slots whose ID doesn't decode (missing card/tier data) are left out and logged.
export function getPool(item) {
  if (!item.contents) return null
  if (poolCache.has(item.id)) return poolCache.get(item.id)

  const data = contentsByName[item.contents]
  if (!data) return null

  const entries = []
  const skipped = []
  for (const slot of data.cards) {
    const weight = Number(data.pullRates[String(slot.number)] || 0)
    if (weight <= 0) continue
    const card = decodeCard(slot.uniqueID)
    if (!card) {
      skipped.push(slot.uniqueID)
      continue
    }
    entries.push({ card, weight })
  }
  if (skipped.length) {
    console.warn(`[${item.name}] skipped ${skipped.length} slot(s) with no card data:`, skipped)
  }

  const total = entries.reduce((sum, e) => sum + e.weight, 0)
  const pool = { pulls: data.pulls, entries, total, skipped }
  poolCache.set(item.id, pool)
  return pool
}

export function isOpenable(item) {
  const pool = getPool(item)
  return !!pool && pool.total > 0
}

function pickOne(pool) {
  let roll = Math.random() * pool.total
  for (const entry of pool.entries) {
    roll -= entry.weight
    if (roll < 0) return entry.card
  }
  return pool.entries[pool.entries.length - 1].card
}

export function openPack(item) {
  const pool = getPool(item)
  if (!pool || pool.total <= 0) throw new Error(`${item.name} has no cards to pull yet`)
  return Array.from({ length: pool.pulls }, () => ({ ...pickOne(pool) }))
}

// Chance of each tier per pull, rarest first.
export function tierOdds(item) {
  const pool = getPool(item)
  if (!pool || pool.total <= 0) return []
  const byTier = new Map()
  for (const { card, weight } of pool.entries) {
    const key = card.tier.value
    const row = byTier.get(key) || { tier: card.tier, weight: 0, cards: 0 }
    row.weight += weight
    row.cards += 1
    byTier.set(key, row)
  }
  return [...byTier.values()]
    .map(r => ({ ...r, chance: r.weight / pool.total }))
    .sort((a, b) => Number(a.tier.value) - Number(b.tier.value))
}
