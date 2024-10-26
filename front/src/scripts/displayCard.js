import { decodeUniqueID } from './decode.js'

class CardGenerator {
  constructor(userCards) {
    this.userCollection = { cards: userCards } // Wrap it in an object with a 'cards' property
  }

  async processUserCollection(sortBy = 'quantity') {
    // Accept sortBy parameter
    try {
      this.decodedCards = [] // Reset the array for each call

      // Iterate over each card in the user's collection
      for (const card of this.userCollection.cards) {
        const decodedCard = decodeUniqueID(card.uid)

        // Validate tier data
        const { tier, cardName, cardMultiplier, type, cardImage } = decodedCard

        // Push the decoded card details into the array
        this.decodedCards.push({
          name: cardName || 'Unknown Card',
          background: tier.background,
          backgroundType: tier.backgroundType,
          tierName: tier.name,
          font: tier.font,
          color: tier.color,
          aura: tier.aura || 'none',
          value: cardMultiplier * tier.cost,
          tierValue: tier.value,
          type: type || 'Unknown',
          image: cardImage || 'default-image.png',
          uid: card.uid,
          quantity: card.quantity, // Include quantity for each card
        })
      }

      // Sort the decoded cards based on the sortBy parameter
      this.sortDecodedCards(sortBy)

      console.log('Decoded cards:', this.decodedCards)
      return this.decodedCards // Return the array of decoded cards
    } catch (error) {
      console.error('Error processing user collection:', error)
    }
  }

  sortDecodedCards(sortBy) {
    if (sortBy === 'quantity') {
      this.decodedCards.sort((a, b) => b.quantity - a.quantity) // Sort by quantity descending
    } else if (sortBy === 'tier') {
      this.decodedCards.sort((a, b) => a.tierValue - b.tierValue) // Sort by tier ascending (assuming tierValue is numerical)
    }
    // You can add more sorting options here in the future
  }
}

export default CardGenerator