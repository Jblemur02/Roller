<template>
  <main>
    <div id="stats">
      <div id="player" class="character-display">
        <div id="your-char" class="character">
          <img :src="yourChar.image" alt="" />
          {{ yourChar.name }}
        </div>
        <div id="your-minions" class="minion-display">
          <div
            v-for="minion in yourChar.minions"
            :key="minion.id"
            class="minion"
          >
            <img :src="minion.image" :alt="minion.name" />
            <p>{{ minion.name }}</p>
            <div class="minion-health-bar">
              <div
                :style="{
                  width: `${(minion.currentHealth / minion.maxHealth) * 100}%`,
                }"
                class="health-bar"
              ></div>
            </div>
          </div>
        </div>
      </div>
      <button @click="simulateHealthChanges">Simulate Health Changes</button>
      <div id="opp" class="character-display">
        <div id="opp-char" class="character">
          <img :src="oppChar.image" alt="" />
          <p>{{ oppChar.name }}</p>
        </div>
        <div id="opp-minions" class="minion-display">
          <div
            v-for="minion in oppChar.minions"
            :key="minion.id"
            class="minion"
          >
            <img :src="minion.image" :alt="minion.name" />
            <p>{{ minion.name }}</p>
            <div class="minion-health-bar">
              <div
                :style="{
                  width: `${(minion.currentHealth / minion.maxHealth) * 100}%`,
                }"
                class="health-bar"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="board">
      <div v-for="(col, colIndex) in 5" :key="colIndex" class="column">
        <div
          v-for="rowIndex in 8"
          :key="rowIndex"
          class="square"
          @click="handleSquareClick(colIndex, rowIndex)"
        >
          {{ (rowIndex - 1) * 5 + colIndex + 1 }}
        </div>
      </div>
    </div>

    <div id="moves">moves</div>
  </main>
</template>

<script>
export default {
  data() {
    return {
      board: [
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
        [{}, {}, {}, {}, {}],
      ],
      yourChar: {
        id: 1,
        name: 'Your Character',
        image:
          'https://ik.imagekit.io/roller/packs/images/iron_helmet.jpg?updatedAt=1730234852000',
        maxHealth: 200,
        currentHealth: 100,
        minions: [
          {
            id: 1,
            name: 'Minion A',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
          },
          {
            id: 2,
            name: 'Minion B',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
          },
          {
            id: 3,
            name: 'Minion C',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
          },
          {
            id: 4,
            name: 'Minion D',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
          },
          {
            id: 5,
            name: 'Minion E',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
          },
        ],
      },
      oppChar: {
        id: 2,
        name: 'Opponent Character',
        image:
          'https://ik.imagekit.io/roller/packs/images/iron_helmet.jpg?updatedAt=1730234852000',
        maxHealth: 200,
        currentHealth: 150,
        minions: [
          {
            id: 1,
            name: 'Enemy 1',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
          },
          {
            id: 2,
            name: 'Enemy 2',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
          },
          {
            id: 3,
            name: 'Enemy 3',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
          },
        ],
      },
    }
  },
  methods: {
    handleSquareClick(col, row) {
      console.log(`Clicked square at row ${row}, column ${col + 1}`)
    },
    simulateHealthChange(minion) {
      const healthChange = Math.floor(Math.random() * 50) - 25
      minion.currentHealth = Math.max(
        0,
        Math.min(minion.maxHealth, minion.currentHealth + healthChange),
      )
    },
    simulateHealthChanges() {
      this.yourChar.minions.forEach(minion => this.simulateHealthChange(minion))
      this.oppChar.minions.forEach(minion => this.simulateHealthChange(minion))
    },
  },
  computed: {},
}
</script>

<style scoped>
main {
  display: grid;
  grid-template-areas: 'stats board moves';
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid green;
  overflow: hidden;
}

#stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column-reverse;
  height: 100%;
  margin-bottom: 20px;
  height: 100%;
  grid-area: stats;
  padding: 20px;
}

.character-display {
  width: 90%;
  margin: 0 auto;
  box-shadow: var(--shadow);
  border-radius: 19px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  height: 30vh;
  background-color: var(--inverse);
  gap: 10px;
}

.character {
  box-shadow: var(--shadow);
  width: 100%;
  height: 50%;
  border-radius: 19px;
  display: flex;
  padding: 10px;
}

.character img {
  width: 20%;
  aspect-ratio: 1/1;
  border-radius: 50%;
  box-shadow: var(--shadow);
}

.minion-display {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px;
  height: 50%;
  width: 100%;
  border-radius: 10px;
}

.minion {
  box-shadow: var(--shadow);
  height: 100%;
  width: 100%;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 5px;
}

.minion img {
  height: 50%;
  aspect-ratio: 1/1;
  border-radius: 50%;
}

.minion-health-bar {
  height: 10%;
  width: 100%;
  box-shadow: var(--shadow);
  border-radius: 5px;
  background-color: rgb(207, 29, 29);
}

.health-bar {
  height: 100%;
  background-color: red;
  transition: width 0.3s ease;
  box-shadow: 0px 0px 59px 11px rgba(255, 0, 0, 1) inset;
  -webkit-box-shadow: 0px 0px 59px 11px rgba(255, 0, 0, 1) inset;
  -moz-box-shadow: 0px 0px 59px 11px rgba(255, 0, 0, 1) inset;
}

#player {
  flex-direction: column-reverse;
}

#board {
  border: 1px solid blue;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(8, 1fr);
  grid-area: board;
  gap: 0;
  width: 80%;
  overflow: hidden;
  max-height: 93vh;
  padding: 20px;
}

.square {
  width: 100%;
  aspect-ratio: 1/1;
  border: 1px solid black;
  background-color: var(--inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
  -webkit-box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
  -moz-box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
}

.square:hover {
  border: 1px solid var(--primaryh);
}

#moves {
  margin-bottom: 20px;
  height: 100%;
  grid-area: moves;
}
</style>
