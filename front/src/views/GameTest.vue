<template>
  <main>
    <div id="stats">
      <div id="player">
        <div id="your-char"></div>
        <div id="your-minions">
          <div v-for="minion in yourMinions" :key="minion.id" class="minion">
            {{ minion.name }}
          </div>
        </div>
      </div>
      <div id="opp"></div>
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
      yourMinions: [],
      opponentMinions: [],
    }
  },
  methods: {
    handleSquareClick(col, row) {
      console.log(`Clicked square at row ${row}, column ${col + 1}`)
    },
  },
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
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  height: 100%;
  border: 1px solid red;
  grid-area: stats;
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
  border: 1px solid var(--primary);
  background-color: var(--inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0px 0px 5px 15px rgba(24, 46, 242, 0.75) inset;
  -webkit-box-shadow: 0px 0px 5px 15px rgba(24, 46, 242, 0.75) inset;
  -moz-box-shadow: 0px 0px 5px 15px rgba(24, 46, 242, 0.75) inset;
}

#moves {
  margin-bottom: 20px;
  height: 100%;
  grid-area: moves;
}
</style>
