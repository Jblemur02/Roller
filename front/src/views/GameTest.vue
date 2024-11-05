<template>
  <main>
    <div id="stats">
      <div id="player" class="character-display">
        <div id="action-display">
          <div id="action" v-if="selectedEntity">
            <div v-if="selectedEntity.id === yourChar.id">
              <button @click="move()">Move</button>
              <div
                id="spells"
                v-for="actions in selectedEntity.minions"
                :key="actions.id"
              ></div>
            </div>
            <div v-if="selectedEntity.id === oppChar.id"></div>

            <div v-if="showMovement && selectedEntity">
              <p>Moving: {{ selectedEntity.name }}</p>
              <p>Speed: {{ selectedEntity.speed }}</p>
            </div>
          </div>
        </div>
        <div id="your-char" class="character">
          <img :src="yourChar.image" alt="" />
          {{ yourChar.name }}
        </div>
      </div>

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

    <div id="board-container">
      <div id="board" class="board">
        <div v-for="colIndex in 5" :key="`col-${colIndex}`" class="column">
          <div
            v-for="rowIndex in 8"
            :key="`row-${rowIndex}`"
            class="square"
            @click="handleSquareClick(rowIndex, colIndex)"
          >
            <template v-for="entity in entities" :key="entity.id">
              <div
                v-if="
                  entity.position.row === rowIndex &&
                  entity.position.col === colIndex
                "
                class="entity"
              >
                <p>{{ entity.name }}</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div id="moves">
      <div id="statuses">
        <div
          class="minion-status"
          v-for="minion in yourChar.minions"
          :key="minion.id"
        >
          <div class="status-bars">
            <div class="health status-bar">
              <div class="bar" style="--background: darkRed">
                <div
                  :style="{
                    height: `${(minion.currentHealth / minion.maxHealth) * 100}%`,
                  }"
                  class="inner-bar"
                  style="--background: red"
                ></div>
              </div>
              <div class="numbers">
                {{ minion.currentHealth }}
              </div>
            </div>

            <div class="mana status-bar">
              <div class="bar" style="--background: darkBlue">
                <div
                  :style="{
                    height: `${(minion.currentMana / minion.maxMana) * 100}%`,
                  }"
                  class="inner-bar"
                  style="--background: blue"
                ></div>
              </div>
              <div class="numbers">
                {{ minion.currentMana }}
              </div>
            </div>

            <div class="energy status-bar">
              <div class="bar" style="--background: darkGreen">
                <div
                  :style="{
                    height: `${(minion.currentEnergy / minion.maxEnergy) * 100}%`,
                  }"
                  class="inner-bar"
                  style="--background: lime"
                ></div>
              </div>
              <div class="numbers">
                {{ minion.currentEnergy }}
              </div>
            </div>
            <div class="exhuastion status-bar">
              <div class="bar" style="--background: gray">
                <div
                  :style="{
                    height: `${minion.currentExhaustion}%`,
                  }"
                  class="inner-bar"
                  style="--background: black"
                ></div>
              </div>
              <div class="numbers">{{ minion.currentExhaustion }}%</div>
            </div>
          </div>
        </div>
        <div class="character-status"></div>
      </div>

      <div id="actions">
        <p>
          Action points
          <span>
            {{ yourChar.currentAP }}
          </span>
        </p>
        <div id="timer">
          <h1>{{ timer }}</h1>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  data() {
    return {
      timer: null,
      board: [],
      turn: null,
      selectedEntity: null,
      showMovement: false,
      yourChar: {
        id: 1,
        name: 'Your Character',
        turn: 1,
        image:
          'https://ik.imagekit.io/roller/packs/images/iron_helmet.jpg?updatedAt=1730234852000',
        maxHealth: 200,
        currentHealth: 100,
        ap_rate: 5,
        currentAP: 5,
        speed: 2,
        position: { row: 8, col: 3 },
        minions: [
          {
            id: 1,
            name: 'Minion A',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 500,
            currentHealth: 500,
            position: { row: 6, col: 5 },
            currentEnergy: 100,
            maxEnergy: 200,
            currentMana: 100,
            maxMana: 200,
            currentExhaustion: 0,
            speed: 1,
          },
          {
            id: 2,
            name: 'Minion B',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 500,
            currentHealth: 500,
            position: { row: 6, col: 4 },
            currentEnergy: 100,
            maxEnergy: 200,
            currentMana: 100,
            maxMana: 200,
            currentExhaustion: 0,
            speed: 1,
          },
          {
            id: 3,
            name: 'Minion C',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 500,
            currentHealth: 500,
            position: { row: 6, col: 3 },
            currentEnergy: 100,
            maxEnergy: 200,
            currentMana: 100,
            maxMana: 200,
            currentExhaustion: 0,
            speed: 1,
          },
          {
            id: 4,
            name: 'Minion D',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 500,
            currentHealth: 500,
            position: { row: 6, col: 2 },
            currentEnergy: 100,
            maxEnergy: 200,
            currentMana: 100,
            maxMana: 200,
            currentExhaustion: 20,
            speed1: 1,
          },
          {
            id: 5,
            name: 'Minion E',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 500,
            currentHealth: 500,
            position: { row: 6, col: 1 },
            currentEnergy: 100,
            maxEnergy: 200,
            currentMana: 100,
            maxMana: 200,
            currentExhaustion: 0,
            speed: 1,
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
        turn: 2,
        currentAP: 5,
        ap_rate: 5,
        speed: 2,
        position: { row: 1, col: 3 },
        minions: [
          {
            id: 1,
            name: 'Enemy 1',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
            position: { row: 2, col: 4 },
            speed: 1,
          },
          {
            id: 2,
            name: 'Enemy 2',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
            position: { row: 2, col: 3 },
            speed: 1,
          },
          {
            id: 3,
            name: 'Enemy 3',
            image: 'https://picsum.photos/seed/picsum/200/300',
            maxHealth: 100,
            currentHealth: 90,
            position: { row: 2, col: 2 },
            speed: 1,
          },
        ],
      },
    }
  },
  computed: {
    entities() {
      return [
        this.yourChar,
        this.oppChar,
        ...this.yourChar.minions,
        ...this.oppChar.minions,
      ]
    },
  },
  mounted() {
    this.initializeBoard()
    this.$nextTick(() => {
      this.placeEntities()
    })
    this.startTimer()
  },
  beforeUnmount() {
    this.stopTimer()
  },
  methods: {
    initializeBoard() {
      this.board = Array.from({ length: 8 }, () =>
        Array.from({ length: 5 }, () => ({ occupant: null })),
      )
    },
    handleSquareClick(rowIndex, colIndex) {
      console.log(`Clicked square at row ${rowIndex}, column ${colIndex}`)
      const entity = this.board[rowIndex - 1][colIndex - 1].occupant

      if (entity) {
        console.log(`Selected entity: ${entity.name}`)
        this.selectedEntity = entity
        this.showMovement = true
      } else {
        console.log('No entity selected')
        this.selectedEntity = null
        this.showMovement = false
      }
    },
    showPath(entity) {
      console.log(entity.speed)
    },
    simulateHealthChange(entity) {
      const healthChange = Math.floor(Math.random() * 50) - 25
      entity.currentHealth = Math.max(
        0,
        Math.min(entity.maxHealth, entity.currentHealth + healthChange),
      )

      if (entity.hasOwnProperty('currentMana')) {
        const manaChange = Math.floor(Math.random() * 30) - 15
        entity.currentMana = Math.max(
          0,
          Math.min(entity.maxMana, entity.currentMana + manaChange),
        )

        const energyChange = Math.floor(Math.random() * 40) - 20
        entity.currentEnergy = Math.max(
          0,
          Math.min(entity.maxEnergy, entity.currentEnergy + energyChange),
        )

        const exhaustionChange = Math.floor(Math.random() * 10) - 5
        entity.currentExhaustion = Math.max(
          0,
          entity.currentExhaustion + exhaustionChange,
        )
      }
    },

    simulateHealthChanges() {
      this.simulateHealthChange(this.yourChar)
      this.yourChar.minions.forEach(minion => this.simulateHealthChange(minion))
      this.simulateHealthChange(this.oppChar)
      this.oppChar.minions.forEach(minion => this.simulateHealthChange(minion))
    },
    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.timer > 0) {
          this.timer--
        } else {
          this.timer = 5
          this.yourChar.currentAP += this.yourChar.ap_rate
          this.simulateHealthChanges()
        }
      }, 1000)
    },
    stopTimer() {
      clearInterval(this.timerInterval)
    },

    placeEntities() {
      const entities = [
        this.yourChar,
        this.oppChar,
        ...this.yourChar.minions,
        ...this.oppChar.minions,
      ]

      entities.forEach(entity => {
        if (
          entity.position &&
          entity.position.row > 0 &&
          entity.position.row <= 8 &&
          entity.position.col > 0 &&
          entity.position.col <= 5
        ) {
          // Check if the row in the board array is defined
          if (this.board[entity.position.row - 1]) {
            this.board[entity.position.row - 1][
              entity.position.col - 1
            ].occupant = entity
          } else {
            console.error(
              'Row is undefined in board:',
              entity.position.row - 1,
              entity,
            )
          }
        } else {
          console.error('Invalid entity position:', entity)
        }
      })
    },
  },
}
</script>

<style scoped>
main {
  display: grid;
  grid-template-areas: 'stats board moves';
  grid-template-columns: 1fr 1fr 1fr;
  max-height: 100%;
}

#stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column-reverse;
  height: 100%;
  margin-bottom: 20px;
  width: 100%;
  grid-area: stats;
  padding: 10px;
}

.character-display {
  width: 100%;
  margin: 0 auto;
  box-shadow: var(--shadow);
  border-radius: 19px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--inverse);
  gap: 10px;
}

#player {
  height: 60%;
  flex-direction: column;
}

#action-display {
  width: 100%;
  height: 100%;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

#opp {
  height: 30%;
}

.character {
  box-shadow: var(--shadow);
  width: 100%;
  height: 30%;
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
  transition: width 1s ease;
  box-shadow: 0px 0px 59px 11px rgba(255, 0, 0, 1) inset;
  -webkit-box-shadow: 0px 0px 59px 11px rgba(255, 0, 0, 1) inset;
  -moz-box-shadow: 0px 0px 59px 11px rgba(255, 0, 0, 1) inset;
}

#player {
  flex-direction: column-reverse;
}

#board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  grid-area: board;
}

#board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2)),
    url('https://ik.imagekit.io/roller/battle/fields/normal');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.square {
  width: 100%;
  height: 100%;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.5s ease;
}

.square:hover {
  outline: 1px solid rgb(195, 2, 2);
  background-color: red;
  box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
  -webkit-box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
  -moz-box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
}

.square div {
  background-color: transparent;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  justify-content: center;
}

.square div img {
  width: 50%;
  aspect-ratio: 1/1;
}

#moves {
  grid-area: moves;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  width: 100%;
  height: 100%;
}

#moves {
  width: 98%;
  margin: 0 auto;
  box-shadow: var(--shadow);
  border-radius: 19px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  height: 100%;
  background-color: var(--inverse);
  gap: 10px;
}

#actions {
  box-shadow: var(--shadow);
  width: 100%;
  height: 30%;
  border-radius: 19px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

#timer {
  height: 100%;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  box-shadow: var(--shadow);
  aspect-ratio: 1/1;
}

#statuses {
  width: 100%;
  border-radius: 19px;
  display: flex;
  flex-direction: column;
  padding: 10px;
  height: 80%;
  border: 1px solid red;
}

#moves img {
  height: 50%;
  aspect-ratio: 1/1;
  border-radius: 50%;
  box-shadow: var(--shadow);
}

.minion-status,
.character-status {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 10px;
  height: 100%;
  box-shadow: var(--shadow);
}

.status-bars {
  display: flex;
  width: 80%;
  height: 100%;
  align-items: center;
  gap: 10px;
}

.status-bar {
  height: 100%;
  width: 10%;
  display: flex;
  flex-direction: column;
  transition: width 1s ease;
  justify-content: center;
  align-items: center;
}

.bar {
  height: 90%;
  width: 80%;
  transition: height 1s ease;
  background-color: var(--background);
  border-radius: 10px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column-reverse;
}

.inner-bar {
  height: 100%;
  background-color: var(--background);
  border-radius: inherit;
  transition: height 1s ease;
}

#timer {
  font-size: 2em;
  box-shadow: 0px 0px 35px 5px var(--primary) inset;
  -webkit-box-shadow: 0px 0px 35px 5px var(--primary) inset;
  -moz-box-shadow: 0px 0px 35px 5px var(--primary) inset;
  background-color: black;
}

#timer h1 {
  color: white;
}
</style>
