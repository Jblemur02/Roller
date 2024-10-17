<template>
  <main>
    <div id="changeButton">
      <a id="change" @click="rollCards">Roll</a>
    </div>
    <div id="rolls">
      <RollCard
        v-for="(item, index) in randomNumbers"
        :key="index"
        :name="item.name"
        :type="item.type"
        :image="item.image"
        :tier="item.tier"
        :value="item.value"
      />
    </div>
  </main>
</template>

<script>
import CardGenerator from '../scripts/generateCardPulls.js'
import RollCard from '../components/DisplayCard.vue'

export default {
  components: {
    RollCard,
  },
  data() {
    return {
      randomNumbers: [],
      cardGenerator: new CardGenerator(),
    }
  },
  methods: {
    async rollCards() {
      try {
        this.clearBoard()
        this.randomNumbers =
          await this.cardGenerator.generateNumbers('BasicBoosterPack')
      } catch (error) {
        console.error('Error rolling cards:', error)
      }
    },
    clearBoard() {
      this.randomNumbers = []
    },
  },
}
</script>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

#changeButton {
  margin-bottom: 20px;
}

#change {
  font-size: 1.5rem;
  padding: 10px 20px;
  border-radius: 50%;
  border: 1px solid var(--primary);
}

#rolls {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 400px);
  grid-column-gap: 20px;
  grid-row-gap: 10px;
}
</style>
