import types from '../assets/packs/types.json'
import tiersData from '../assets/packs/tiers.json'
import variants from '../assets/packs/variants.json'
import cards from '../assets/packs/cards.json'

export function decodeUniqueID(uniqueID) {
  const [baseNumber, variant, tierValue, typeID, setID] = uniqueID.split('-')

  // Find the tier based on the tier value
  const tier = tiersData.find(t => t.value === tierValue)

  // Extract main type and subtype
  const mainTypeID = typeID.charAt(0)
  const subTypeCode = typeID.slice(1)

  console.log(
    `Decoding TypeID: ${typeID}, MainTypeID: ${mainTypeID}, SubTypeCode: ${subTypeCode}`,
  )

  let mainType = 'Unknown'
  let subType = 'Unknown'

  // Look up the main type and subtype
  if (types[mainTypeID]) {
    mainType = types[mainTypeID].name || 'Unknown'

    // Find the subtype directly based on the combined `subTypeCode`
    if (types[mainTypeID][subTypeCode]) {
      subType = types[mainTypeID][subTypeCode]
    }
  } else {
    console.warn('Main Type not found for ID:', mainTypeID)
  }

  if (subType === 'Unknown') {
    console.warn('Subtype not found for code:', subTypeCode)
  }

  // Retrieve card details
  const cardDetails = cards.find(card => card.number == baseNumber)

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
