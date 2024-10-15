<template>
  <main>
    <div id="changeButton">
      <a id="change" @click="generateNumbers">Roll</a>
    </div>
    <div id="rolls">
      <div
        v-for="(item, index) in randomNumbers"
        :key="index"
        :class="[
          'roll',
          rollClass(item.tier.name),
          { hovered: isHovered[index] },
        ]"
        @mouseover="applyHoverBrightness(index)"
      >
        <p>{{ item.type }}</p>
        <img :src="`../${item.image}`" :alt="item.type" />
        <h1>{{ item.name }}</h1>
        <h2 :class="['tier', tierClass(item.tier.name)]">
          {{ item.tier.name }}
        </h2>
        <p>Base Value: {{ item.value }} Chronos</p>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  data() {
    return {
      randomNumbers: [],
      tiers: [],
      isHovered: [],
    }
  },
  methods: {
    async fetchTiers() {
      try {
        const response = await fetch('/src/assets/packs/tiers.json')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        this.tiers = data.tiers
      } catch (error) {
        console.error('Error fetching tiers:', error)
      }
    },

    async generateNumbers() {
      try {
        await this.fetchTiers()

        this.randomNumbers = []
        this.isHovered = Array(10).fill(false)

        const response = await fetch('/src/assets/packs/BasicPack.json')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()

        for (let i = 0; i < 10; i++) {
          const base = Math.random()
          const skewed = 1 - Math.pow(base, 5)
          const index = Math.floor(skewed * data.cards.length)
          const card = data.cards[index]

          const cardName = card.name ? card.name : 'Unknown'
          const randomTier = this.getRandomTier()
          const cardCost = randomTier.cost
          const cardMultiplier = card.multiplier || 1
          const cardValue = cardCost * cardMultiplier

          this.randomNumbers.push({
            name: cardName,
            tier: randomTier,
            value: cardValue,
            type: card.type || 'Unknown',
            image: card.image || 'Unknown.png',
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    },

    getRandomTier() {
      const base = Math.random()
      const skewedIndex = Math.floor(
        (1 - Math.pow(base, 4)) * this.tiers.length,
      )
      return this.tiers[skewedIndex]
    },
    rollClass(tierName) {
      return `tier-${tierName.toLowerCase().replace(/\s/g, '-')}`
    },
    tierClass(tierName) {
      return `font-${tierName.toLowerCase().replace(/\s/g, '-')}`
    },
    applyHoverBrightness(index) {
      this.isHovered[index] = true
    },
  },
  mounted() {
    this.fetchTiers()
  },
}
</script>

<style scoped>
.hovered {
  filter: brightness(1);
}

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

.roll {
  font-size: 1.5rem;
  margin: 5px;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-direction: column;
  box-shadow:
    rgba(0, 0, 0, 0.4) 0px 2px 4px,
    rgba(0, 0, 0, 0.3) 0px 7px 13px -3px,
    rgba(0, 0, 0, 0.2) 0px -3px 0px inset;
  transition: transform 0.3s ease;
  transition: filter 1s ease;
  filter: brightness(1);
}

.roll:hover {
  transform: scale(1.05);
}

.tier-eternal {
  color: #ffffff;
  background-image: url('../components/images/tier-backgrounds/eternal.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0px 0px 112px 24px rgba(255, 196, 46, 0.9);
}

.tier-heavenly {
  color: white;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url('../components/images/tier-backgrounds/heavenly.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0px 0px 112px 22px rgba(46, 147, 255, 0.9);
}

.tier-crimson-dusk {
  color: red;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url('../components/images/tier-backgrounds/crimson-dusk.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0px 0px 112px 18px rgba(255, 8, 8, 0.9);
}

.tier-abyssal {
  color: white;
  background-image: url('../components/images/tier-backgrounds/abyssal.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0px 0px 112px 12px rgba(156, 8, 255, 0.9);
}

.tier-cosmic {
  color: white;
  background-image: url('../components/images/tier-backgrounds/cosmic.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0px 0px 112px 6px rgba(12, 22, 125, 0.9);
}

.tier-eclipse {
  color: gold;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url('../components/images/tier-backgrounds/eclipse.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid darkorchid;
}

.tier-mythic {
  color: #ffd700;
  background-image: url('../components/images/tier-backgrounds/mythic.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.tier-legendary {
  color: #ffa500;
  background-color: #00008b;
}

.tier-supreme {
  color: gold;
  background-color: #8b0000;
}

.tier-ultra {
  color: white;
  background-color: purple;
}

.tier-epic {
  color: white;
  background-color: #8a2be2;
}

.tier-rare {
  color: white;
  background-color: #000080;
}

.tier-uncommon {
  color: white;
  background-color: #228b22;
}

.tier-common {
  color: #d3d3d3;
  background-color: #808080;
}

.tier-basic {
  color: #000000;
  background-color: #a9a9a9;
}

.font-eternal {
  font-family: 'Cinzel', serif;
}

.font-heavenly {
  font-family: 'Lobster', cursive;
}

.font-crimson-dusk {
  font-family: 'Montserrat', sans-serif;
}

.font-abyssal {
  font-family: 'Raleway', sans-serif;
}

.font-cosmic {
  font-family: 'Oswald', sans-serif;
}

.font-eclipse {
  font-family: 'Pacifico', cursive;
}

.font-mythic {
  font-family: 'Playfair Display', serif;
}

.font-legendary {
  font-family: 'Abril Fatface', serif;
}

.font-supreme {
  font-family: 'Alegreya', serif;
}

.font-ultra,
.font-epic,
.font-rare,
.font-uncommon,
.font-common,
.font-basic {
  font-family: 'YourDefaultFont', sans-serif;
}

.tier-eternal,
.tier-heavenly,
.tier-crimson-dusk,
.tier-abyssal {
  filter: brightness(0) !important;
}

.tier-eternal.hovered,
.tier-heavenly.hovered,
.tier-crimson-dusk.hovered,
.tier-abyssal.hovered {
  filter: brightness(1) !important;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
