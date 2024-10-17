import { decodeUniqueID } from './decode.js'

class CardGenerator {
  constructor() {
    this.randomNumbers = []
  }

  async generateNumbers(packName) {
    try {
      this.randomNumbers = []

      // Load the JSON file for the specified pack
      const response = await fetch(`/src/assets/packs/${packName}.json`)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()

      if (
        !data.cards ||
        !Array.isArray(data.cards) ||
        !data.pulls ||
        !data.pullRates
      ) {
        throw new Error('Invalid cards data')
      }

      const numberOfPulls = data.pulls

      // Create a weighted marble array
      const marbleArray = this.createMarbleArray(data.cards, data.pullRates)

      for (let i = 0; i < numberOfPulls; i++) {
        const card = this.getRandomCard(marbleArray)

        if (!card) {
          console.error('No valid card found for this pull.')
          continue
        }

        // Call the decodeUniqueID function from decode.js
        const decodedCard = decodeUniqueID(card.uniqueID)

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
        })
      }

      return this.randomNumbers
    } catch (error) {
      console.error('Error fetching data:', error)
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
    const randomIndex = Math.floor(Math.random() * marbleArray.length)
    return marbleArray[randomIndex]
  }
}

export default CardGenerator
