<template>
  <main>
    <div id="stats">
      <div id="player" class="character-display">
        <div id="your-char" class="character">
          <img :src="yourChar.image" alt="" />
          {{ yourChar.name }}
        </div>
        <div id="action-display">
          <div id="action" v-if="selectedEntity">
            <div
              v-if="selectedEntity.uid[0] === 'A'"
              class="actions"
              id="your-actions"
            >
              <button id="move" @click="move()">Move</button>
              <div id="spells">
                <div
                  class="spell"
                  v-for="(action, index) in selectedEntity.actions"
                  :key="index"
                >
                  <div class="action-image">
                    <img :src="action.image" alt="" />
                  </div>
                  .
                  <div id="action-description">
                    <span class="action-name">
                      {{ action.name }}
                    </span>
                    <span
                      v-for="(cost, costIndex) in action.cost"
                      :key="costIndex"
                    >
                      <span
                        v-for="(value, type) in cost"
                        :key="type"
                        class="action-cost"
                        :style="{
                          color:
                            type === 'Mana'
                              ? 'blue'
                              : type === 'Energy'
                                ? 'green'
                                : type === 'AP'
                                  ? 'gold'
                                  : '',
                        }"
                      >
                        {{ value }} {{ type }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedEntity.uid[0] === 'B'">
              <p>Opponent: {{ selectedEntity.name }}</p>
            </div>

            <div v-if="showMovement && selectedEntity">
              <p>Moving: {{ selectedEntity.name }}</p>
              <p>Speed: {{ selectedEntity.speed }}</p>
            </div>
          </div>
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
      <div
        id="board"
        :style="{
          gridTemplateColumns: `repeat(${columns}, ${100 / columns}%)`,
          gridTemplateRows: `repeat(${rows}, ${100 / rows}%)`,
        }"
      >
        <div
          v-for="colIndex in columns"
          :key="`col-${colIndex}`"
          class="column"
        >
          <div
            v-for="rowIndex in rows"
            :key="`row-${rowIndex}`"
            class="square"
            :data-row="rowIndex"
            :data-col="colIndex"
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
                <img :src="entity.image" :alt="entity.name" />
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
          <div class="minion-avatar">
            <img :src="minion.image" alt="" />
          </div>
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
        <div id="action-points">
          <div class="bar" style="--background: gray">
            <div
              :style="{
                height: `${yourChar.currentAP}`,
              }"
              class="inner-bar"
              style="--background: black"
            ></div>
          </div>
          <div class="numbers">{{ yourChar.currentAP }}</div>
        </div>
        <div id="timer">
          <h1>{{ timer }}</h1>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import character from '../assets/characters.json'

export default {
  data() {
    return {
      rows: 8,
      columns: 5,
      timer: null,
      board: [],
      turn: null,
      selectedEntity: null,
      showMovement: false,
      yourChar: character.yourChar,
      oppChar: character.oppChar,
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
    this.assignUIDs(this.yourChar, this.oppChar)
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
    highlightValidMoves(entity) {
      const allSquares = document.querySelectorAll('.square')
      allSquares.forEach(square => square.classList.remove('valid-move'))

      console.log('Entity speed:', entity.speed)

      let queue = [
        { row: entity.position.row, col: entity.position.col, steps: 0 },
      ]
      let visited = new Set()
      while (queue.length > 0) {
        let { row, col, steps } = queue.shift()
        console.log('Current square:', row, col, steps)
        let key = `${row}-${col}`

        // Check if the square is occupied or already visited (but allow the starting square)
        const isOccupied = this.board[row - 1][col - 1].occupant !== null
        const isCurrentPosition =
          row === entity.position.row && col === entity.position.col
        if (
          (visited.has(key) || steps > entity.speed || isOccupied) &&
          !isCurrentPosition // Allow the starting square to be processed
        ) {
          console.log(
            'Skipping:',
            row,
            col,
            steps,
            'Visited:',
            visited.has(key),
            'Occupied:',
            isOccupied,
          )
          continue
        }
        visited.add(key)

        const square = document.querySelector(
          `.square[data-row="${row}"][data-col="${col}"]`,
        )
        console.log('Selected square:', square)
        if (square) {
          square.classList.add('valid-move')
          console.log("Added 'valid-move' class to:", square)
        }

        if (row > 1) queue.push({ row: row - 1, col, steps: steps + 1 })
        if (row < this.rows) queue.push({ row: row + 1, col, steps: steps + 1 })
        if (col > 1) queue.push({ row, col: col - 1, steps: steps + 1 })
        if (col < this.columns)
          queue.push({ row, col: col + 1, steps: steps + 1 })

        console.log('Queue:', queue)
      }
      console.log('Final Queue:', queue)
    },

    move() {
      if (this.selectedEntity) {
        this.showMovement = !this.showMovement

        if (this.showMovement) {
          this.highlightValidMoves(this.selectedEntity)
        } else {
          const allSquares = document.querySelectorAll('.square')
          allSquares.forEach(square => square.classList.remove('valid-move'))

          if (this.selectedDestination) {
            // 1. Update entity's position
            this.selectedEntity.position.row = this.selectedDestination.row
            this.selectedEntity.position.col = this.selectedDestination.col

            // 2. Update the board array
            this.placeEntities()

            this.selectedDestination = null
            const allSquares = document.querySelectorAll('.square')
            allSquares.forEach(square => square.classList.remove('valid-move'))
          }
        }
      }
    },

    handleSquareClick(rowIndex, colIndex) {
      const occupant = this.board[rowIndex - 1][colIndex - 1].occupant

      if (occupant) {
        this.selectedEntity = occupant
        console.log('Clicked on square:', rowIndex, colIndex)
        console.log(
          'Occupant:',
          occupant.name,
          'Occupant Unique ID:',
          occupant.uid,
        )
        let type = null
        if (occupant.uid[0] === 'A') {
          this.highlightValidMoves(occupant)
          type = 'Your '
          if (occupant.uid[1] > 1) {
            type += occupant.uid[1] - 1 + ' minion'
          } else {
            type += 'character'
          }
        } else if (occupant.uid[0] === 'B') {
          type = "Opponent's "
          if (occupant.uid[1] > 1) {
            type += occupant.uid[1] - 1 + ' minion'
          } else {
            type += 'character'
          }
        } else {
          console.log('Unknown entity:', occupant.id)
          return
        }

        console.log('Type:', type)
      } else {
        console.log('Clicked on empty square:', rowIndex, colIndex)
      }

      if (this.showMovement && this.selectedEntity) {
        const clickedSquare = document.querySelector(
          `.square[data-row="${rowIndex}"][data-col="${colIndex}"]`,
        )

        if (clickedSquare && clickedSquare.classList.contains('valid-move')) {
          // Store the selected destination
          this.selectedDestination = { row: rowIndex, col: colIndex }
        }
      }
    },

    assignUIDs(yourChar, oppChar) {
      let userCounter = 1
      let enemyCounter = 1

      yourChar.uid = `A${userCounter++}`
      oppChar.uid = `B${enemyCounter++}`

      yourChar.minions.forEach(minion => {
        minion.uid = `A${userCounter++}`
      })

      oppChar.minions.forEach(minion => {
        minion.uid = `B${enemyCounter++}`
      })
    },
    tellMe(entity) {
      console.log(entity)
    },
    initializeBoard() {
      this.board = Array.from({ length: 8 }, () =>
        Array.from({ length: 5 }, () => ({ occupant: null })),
      )
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
          this.timer = 30
          this.yourChar.currentAP += this.yourChar.ap_rate
          this.simulateHealthChanges()
        }
      }, 1000)
    },
    stopTimer() {
      clearInterval(this.timerInterval)
    },

    placeEntities() {
      // 1. Clear the board
      this.board.forEach(row => row.forEach(square => (square.occupant = null)))

      // 2. Place the entities
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
  grid-template-rows: 500px auto;
  gap: 20px;
}

.valid-move {
  -webkit-box-shadow: 0px 0px 13px 1px rgba(0, 255, 9, 0.9) inset !important;
  -moz-box-shadow: 0px 0px 13px 1px rgba(0, 255, 9, 0.9) inset !important;
  box-shadow: 0px 0px 13px 1px rgba(0, 255, 9, 0.9) inset !important;
}

.valid-move:hover {
  background-color: limegreen !important;
}

#stats {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column-reverse;
  height: 93vh;
  width: 100%;
  grid-area: stats;
  padding: 10px;
}

.character-display {
  width: 100%;
  height: 100%;
  gap: 10px;
  margin: 0 auto;
  box-shadow: var(--shadow);
  border-radius: 19px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--inverse);
}

#player {
  flex-direction: column;
}

#action-display {
  width: 100%;
  height: 100%;
  box-shadow: var(--shadow);
  padding: 5px;
}

#action {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

.actions {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

#spells {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.spell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: space-between;
  text-align: center;
  padding: 10px;
}

.spell:hover {
  cursor: pointer;
}

.spell:hover .action-image img {
  -webkit-box-shadow: 0px 0px 40px 5px rgba(46, 56, 255, 0.9);
  -moz-box-shadow: 0px 0px 40px 5px rgba(46, 56, 255, 0.9);
  box-shadow: 0px 0px 40px 5px rgba(46, 56, 255, 0.9);
}

#action-description {
  width: 100%;
  height: 20%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.action-image {
  width: 100%;
  height: 70%;
  box-shadow: var(--shadow);
  border-radius: 10%;
}

.action-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  transition: 0.3s ease box-shadow;
}

#move {
  background-color: var(--primary);
  width: 50%;
  margin: 0 auto;
  border: none;
  box-shadow: var(--shadow);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  color: white;
  transition: background-color 0.3s ease;
}

#move:hover {
  background-color: var(--primaryh);
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

.minion-avatar {
  height: 100%;
}

.minion-avatar img {
  width: 100%;
  height: 100%;
  aspect-ratio: 1/1;
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
  height: 93vh;
  grid-area: board;
  width: 100%;
}

#board {
  display: grid;
  gap: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2)),
    url('https://ik.imagekit.io/roller/battle/fields/normal?updatedAt=1731027340562');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0px 0px 35px 5px rgb(255, 0, 0) inset;
  -webkit-box-shadow: 0px 0px 35px 5px rgb(255, 0, 0) inset;
  -moz-box-shadow: 0px 0px 35px 5px rgb(255, 0, 0) inset;
  padding: 5%;
}

.square {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.5s ease;
  box-shadow: 0px 0px 20px 1px rgb(255, 111, 0) inset;
  -webkit-box-shadow: 0px 0px 20px 1px rgb(255, 111, 0) inset;
  -moz-box-shadow: 0px 0px 20px 1px rgb(255, 111, 0) inset;
}

.square:hover {
  background-color: red;
  box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
  -webkit-box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
  -moz-box-shadow: 0px 0px 35px 5px rgba(71, 106, 117, 1) inset;
}

.entity {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 5%;
  border-radius: 10px;
}

.entity img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: inherit;
}

#moves {
  grid-area: moves;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  width: 98%;
  height: 93vh;
  margin: 0 auto;
  box-shadow: var(--shadow);
  border-radius: 19px;
  flex-direction: column;
  padding: 20px;
  background-color: var(--inverse);
}

.minion-avatar {
  height: 100%;
  width: 100%;
}

.minion-avatar img {
  height: 100%;
  aspect-ratio: 5;
  border-radius: 20px;
  box-shadow: var(--shadow);
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
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.status-bar {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
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
