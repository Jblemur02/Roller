<template>
  <div id="character">
    <div class="box gear-piece">
      <p>Head</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </div>
    <div class="box gear-piece">
      <p>Body</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </div>
    <div class="box gear-piece">
      <p>Left hand</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </div>
    <div class="box gear-piece">
      <p>Feet</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </div>
    <div id="character-view">
      <img
        src="https://storage.googleapis.com/treasure_roller/packs/images/divinity.jpeg"
        alt=""
      />
    </div>
    <div class="box gear-piece">
      <p>Back</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </div>
    <div class="box gear-piece">
      <p>Right hand</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </div>
    <div class="box gear-piece">
      <p>Waist</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </div>
    <div class="box gear-piece">
      <p>Neck</p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#e8eaed"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
#character {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: repeat(4, 1fr);
  gap: 10px;
  max-width: 800px;
  margin: auto;
  height: 90%;
}

.gear-piece {
  background-color: transparent;
  border: 1px solid #aaa;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gear-piece:nth-child(1) {
  grid-row: 1;
  grid-column: 1;
}
.gear-piece:nth-child(2) {
  grid-row: 2;
  grid-column: 1;
}
.gear-piece:nth-child(3) {
  grid-row: 3;
  grid-column: 1;
}
.gear-piece:nth-child(4) {
  grid-row: 4;
  grid-column: 1;
}

#character-view {
  background-color: transparent;
  grid-row: span 4;
  grid-column: 2;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--primary);
}

#character-view img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gear-piece:nth-child(5) {
  grid-row: 1;
  grid-column: 3;
}
.gear-piece:nth-child(6) {
  grid-row: 2;
  grid-column: 3;
}
.gear-piece:nth-child(7) {
  grid-row: 3;
  grid-column: 3;
}
.gear-piece:nth-child(8) {
  grid-row: 4;
  grid-column: 3;
}
</style>
