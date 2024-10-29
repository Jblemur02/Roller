import tiersData from '../assets/packs/tiers.json'
import variants from '../assets/packs/variants.json'
import cards from '../assets/packs/cards.json'

export function decodeUniqueID(uniqueID) {
  const [baseNumber, variant, tierValue, , setID] = uniqueID.split('-')

  // Find the tier based on the tier value
  const tier = tiersData.find(t => t.value === tierValue)

  // Retrieve card details directly by matching `baseNumber`
  const cardDetails = cards.find(card => card.number === baseNumber)

  // If cardDetails exist, assign type and subtype; otherwise, default to 'Unknown'
  const mainType = cardDetails ? cardDetails.type : 'Unknown'
  const subType = cardDetails ? cardDetails.subtype : 'Unknown'

  // Construct the decoded card object
  return {
    baseNumber,
    cardName: cardDetails ? cardDetails.name : 'Unknown',
    cardMultiplier: cardDetails ? cardDetails.multiplier : 0,
    cardImage: cardDetails ? cardDetails.image : '',
    variant: variants[variant] || 'Unknown',
    tier: {
      name: tier ? tier.name : 'Unknown',
      cost: tier ? tier.cost : 0,
      value: tier ? tier.value : 'Unknown',
      backgroundType: tier.backgroundType,
      background: tier.background,
      font: tier.font,
      color: tier.color,
      aura: tier.aura || 'none',
    },
    type: mainType,
    subTypes: [subType],
    setID,
  }
}
