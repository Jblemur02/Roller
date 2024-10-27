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
          quantity: card.quantity,
          totalValue: card.quantity * (cardMultiplier * tier.cost),
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

  sortDecodedCards(sortBy, descending) {
    if (sortBy === 'quantity') {
      this.decodedCards.sort((a, b) =>
        descending ? a.quantity - b.quantity : b.quantity - a.quantity,
      )
    } else if (sortBy === 'tier') {
      this.decodedCards.sort((a, b) =>
        descending ? b.tierValue - a.tierValue : a.tierValue - b.tierValue,
      )
    } else if (sortBy === 'totalValue') {
      this.decodedCards.sort((a, b) =>
        descending ? a.totalValue - b.totalValue : b.totalValue - a.totalValue,
      )
    } else if (sortBy === 'name') {
      this.decodedCards.sort((a, b) =>
        descending
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name),
      )
    } else if (sortBy === 'type') {
      this.decodedCards.sort((a, b) =>
        descending
          ? b.type.localeCompare(a.type)
          : a.type.localeCompare(b.type),
      )
    } else if (sortBy === 'value') {
      this.decodedCards.sort((a, b) =>
        descending ? a.value - b.value : b.value - a.value,
      )
    }
  }
}

export default CardGenerator
