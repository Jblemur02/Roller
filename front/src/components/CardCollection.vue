<template>
  <div class="card-collection">
    <h2>Your Card Collection</h2>
    <div class="grid">
      <RollCard v-for="(card, index) in decodedCards" :key="index">
        <img :src="card.cardImage" :alt="card.cardName" />
        <div class="card-info">
          <h3>{{ card.cardName }}</h3>
          <p>Quantity: {{ card.quantity }}</p>
        </div>
      </RollCard>
    </div>
  </div>
</template>

<script>
import { decodeUniqueID } from '../scripts/decode' // Adjust the path as necessary
import { mapState } from 'vuex'
import RollCard from '../components/DisplayCard.vue'

export default {
  components: { RollCard },
  computed: {
    ...mapState(['userCollection']), // Assuming userCollection holds the user's card data
    decodedCards() {
      return this.userCollection.cards
        .map(card => decodeUniqueID(card.uid))
        .map((decodedCard, index) => ({
          ...decodedCard,
          quantity: this.userCollection.cards[index].quantity, // Attach quantity from the original card data
        }))
    },
  },
}
</script>

<style scoped>
.card-collection {
  padding: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.card img {
  max-width: 100%;
  height: auto;
}

.card-info {
  margin-top: 10px;
}
</style>
