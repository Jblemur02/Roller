import { decodeUniqueID } from './decode.js'

class CardGenerator {
  constructor() {
    this.randomNumbers = []
  }

  // Helper function to remove or replace spaces in pack names
  cleanPackName(packName) {
    return packName.replace(/\s/g, '') // Remove spaces (or use '_' to replace spaces)
  }

  async generateNumbers(packName) {
    try {
      this.randomNumbers = []

      // Clean up the pack name to remove spaces
      const cleanedPackName = this.cleanPackName(packName)

      // Load the JSON file for the specified pack
      const response = await fetch(`/src/assets/packs/${cleanedPackName}.json`)
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`)
      }
      const data = await response.json()

      if (
        !data.cards ||
        !Array.isArray(data.cards) ||
        !data.pulls ||
        !data.pullRates
      ) {
        throw new Error('Invalid cards data structure')
      }

      const numberOfPulls = data.pulls

      const marbleArray = this.createMarbleArray(data.cards, data.pullRates)

      for (let i = 0; i < numberOfPulls; i++) {
        const card = this.getRandomCard(marbleArray)

        if (!card) {
          console.error(
            'No valid card found for this pull. Marble array might be empty.',
          )
          continue
        }

        const decodedCard = decodeUniqueID(card.uniqueID)
        console.log('Generated card:', decodedCard)

        if (
          !decodedCard.tier ||
          !decodedCard.tier.name ||
          decodedCard.tier.name === 'Unknown'
        ) {
          console.error('Invalid tier data:', decodedCard.tier)
          continue
        }

        this.randomNumbers.push({
          name: decodedCard.cardName || 'Unknown Card',
          tier: decodedCard.tier,
          background: decodedCard.tier.background,
          backgroundType: decodedCard.tier.backgroundType,
          font: decodedCard.tier.font,
          color: decodedCard.tier.color,
          aura: decodedCard.tier.aura || 'none',
          value: decodedCard.cardMultiplier * decodedCard.tier.cost,
          type: decodedCard.type || 'Unknown',
          image: decodedCard.cardImage || 'default-image.png',
          uid: card.uniqueID,
        })
      }

      return this.randomNumbers
    } catch (error) {
      console.error('Error fetching data or processing cards:', error)
    }
  }

  createMarbleArray(cards, pullRates) {
    const marbleArray = []

    for (const card of cards) {
      const pullRate = pullRates[card.number.toString()] || 0
      const marbleCount = Math.floor(pullRate * 100)

      for (let j = 0; j < marbleCount; j++) {
        marbleArray.push(card)
      }
    }

    return marbleArray
  }

  getRandomCard(marbleArray) {
    if (marbleArray.length === 0) {
      console.error('Marble array is empty.')
      return null
    }
    const randomIndex = Math.floor(Math.random() * marbleArray.length)
    return marbleArray[randomIndex]
  }
}

export default CardGenerator
