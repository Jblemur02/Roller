// Turns a card's unique ID into everything needed to display it.
//
// IDs come in two shapes in the pack files:
//   base-variant-tier-set          e.g. 00048-00-25-000
//   base-variant-tier-class-set    e.g. 00012-00-05-LA0-000
import cards from '../data/cards.json'
import tiers from '../data/tiers.json'
import variants from '../data/variants.json'

const cardsByNumber = new Map(cards.map(c => [c.number, c]))
const tiersByValue = new Map(tiers.map(t => [t.value, t]))

export function parseId(uniqueID) {
  const parts = uniqueID.split('-')
  const [base, variant, tier] = parts
  const hasClass = parts.length >= 5
  return {
    base,
    variant,
    tier,
    classCode: hasClass ? parts[3] : null,
    setId: hasClass ? parts[4] : parts[3],
  }
}

// The current ID format. Older packs put a class code in the middle (00012-00-05-LA0-000);
// that was dropped from IDs in Oct 2024, so it's stripped here to keep one stack per card.
export function canonicalId(uniqueID) {
  const id = parseId(uniqueID)
  return [id.base, id.variant, id.tier, id.setId].join('-')
}

// Returns null when the ID points at a card or tier that doesn't exist yet.
export function decodeCard(uniqueID) {
  const id = parseId(uniqueID)
  const card = cardsByNumber.get(id.base)
  const tier = tiersByValue.get(id.tier)
  if (!card || !tier) return null

  return {
    uid: canonicalId(uniqueID),
    number: card.number,
    name: card.name,
    type: card.type,
    subtype: card.subtype,
    description: card.description,
    image: card.image,
    stats: card.stats || {},
    variant: variants[id.variant] || 'Unknown',
    classCode: id.classCode,
    setId: id.setId,
    tier: {
      name: tier.name,
      value: tier.value,
      cost: tier.cost,
      background: tier.background,
      backgroundType: tier.backgroundType,
      color: tier.color,
      font: tier.font,
      aura: tier.aura || null,
    },
    // Same formula as the original app: card multiplier x tier cost.
    value: card.multiplier * tier.cost,
  }
}

// Lower tier value = rarer (00 Eternal is the top). Tiers 20+ are the minion tiers.
export function rarityRank(tier) {
  return Number(tier.value) % 20
}
