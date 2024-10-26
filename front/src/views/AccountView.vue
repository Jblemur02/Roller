<template>
  <main>
    <h2>Your Card Collection</h2>
    <div>
      <button @click="sortCards('quantity')">Sort by Quantity</button>
      <button @click="sortCards('tier')">Sort by Tier</button>
    </div>

    <div id="card-collection">
      <div
        v-for="(card, index) in decodedCards"
        :key="index"
        class="card-item"
        :style="{
          color: card.color,
          boxShadow: card.aura,
          background:
            card.backgroundType === 'image'
              ? `url(${card.background}) no-repeat center center / cover`
              : card.background,
        }"
      >
        <img :src="card.image" alt="" class="card-image" />
        <div class="text">
          <p class="card-name" :style="{ fontFamily: card.font }">
            {{ card.name }}
          </p>
          <p class="card-tier" :style="{ fontFamily: card.font }">
            {{ card.tierName }}
          </p>
          <p class="card-quantity">X{{ card.quantity }}</p>
          <div class="value">
            <p class="card-value">Card value: {{ card.value.toFixed(2) }}</p>
            <p v-if="card.quantity > 1" class="bulk-value">
              Bulk value: {{ (card.value * card.quantity).toFixed(2) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import CardGenerator from '../scripts/displayCard'
import { mapState, useStore } from 'vuex'
import { computed } from 'vue'

export default {
  data() {
    return {
      decodedCards: [],
      userCards: [],
    }
  },
  setup() {
    const store = useStore()
    const user = computed(() => store.state.userData)

    return {
      user,
    }
  },
  methods: {
    async sortCards(sortBy) {
      const cardGenerator = new CardGenerator(this.userCards) // Use this.userCards
      this.decodedCards = await cardGenerator.processUserCollection(sortBy)
    },
  },
  computed: {
    ...mapState(['userData']),
  },
  async created() {
    try {
      const response = await fetch(
        `http://localhost:3000/users/${this.userData.userId}/cards`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch user cards')
      }

      this.userCards = await response.json() // Store fetched cards in userCards

      const cardGenerator = new CardGenerator(this.userCards)
      this.decodedCards = await cardGenerator.processUserCollection('tier')
    } catch (error) {
      console.error('Error fetching cards:', error)
    }
  },
}
</script>

<style scoped>
main {
  color: var(--inverse);
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1%;
}

#card-collection {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  padding: 20px;
}

.card-item {
  aspect-ratio: 3 / 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-radius: 8px;
  background-color: var(--card-bg, #f5f5f5);
  color: var(--text-color, #333);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.card-item:hover {
  transform: translateY(-5px);
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
}

.card-image {
  width: 70%;
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
  box-shadow: var(--shadow);
}

.card-name {
  font-size: 1.2em;
  font-weight: bold;
  margin: 5px 0;
}

.text {
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  background-color: transparent;
  background-image: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.3),
    rgba(0, 0, 0, 0.2)
  );
  width: 100%;
  border-radius: 8px;
}

.card-quantity,
.card-tier {
  font-size: 0.9em;
}

h2 {
  font-size: 1.5em;
  margin-bottom: 20px;
}

.value {
  text-align: center;
  display: flex;
  flex-direction: column; /* Change to column for better stacking */
  justify-content: center;
  margin-top: 10px; /* Add margin for spacing */
}

.card-value {
  font-size: 1em; /* Adjust font size */
  font-weight: bold; /* Make it bold */
  color: #4caf50; /* Use a nice green color for card value */
}

.bulk-value {
  font-size: 0.9em; /* Adjust font size */
  color: #ff5722; /* Use a contrasting color for bulk value */
}
</style>
