<template>
  <main>
    <div>
      <h3>Choose your class</h3>
      <div id="sides">
        <div
          id="order"
          class="class-view"
          @click="viewClasses('order')"
          @mouseenter="currentClass = 'order'"
          @mouseleave="currentClass = null"
        >
          <img
            src="https://ik.imagekit.io/roller/classes/types/order?updatedAt=1730420093693"
            alt=""
            class="class-img"
          />
          <h2>Order</h2>
          <div class="description" v-if="currentClass === 'order'">
            <h1>"Fight with honor"</h1>
            <ul>
              <li>Defeat your enemies with style and honor</li>
              <li>Live by the book</li>
              <li>You'd probably find Lord Shimura here</li>
            </ul>
          </div>
        </div>
        <div
          id="balance"
          class="class-view"
          @click="viewClasses('balance')"
          @mouseenter="currentClass = 'balance'"
          @mouseleave="currentClass = null"
        >
          <img
            src="https://ik.imagekit.io/roller/classes/types/balance.jpg"
            alt=""
            class="class-img"
          />
          <h2>Balance</h2>
          <div class="description" v-if="currentClass === 'balance'">
            <h1>"Balance everything"</h1>
            <ul>
              <li>The hybrid style</li>
              <li>
                Fight with confusion and honor? Wait that doesn't make sense....
              </li>
              <li>Make both sides lose their mind</li>
            </ul>
          </div>
        </div>
        <div
          id="chaos"
          class="class-view"
          @click="viewClasses('chaos')"
          @mouseenter="currentClass = 'chaos'"
          @mouseleave="currentClass = null"
        >
          <img
            src="https://ik.imagekit.io/roller/classes/types/chaos?updatedAt=1730420036248"
            alt=""
            class="class-img"
          />
          <h2>Chaos</h2>
          <div class="description" v-if="currentClass === 'chaos'">
            <h1>"Chaos take the world"</h1>
            <ul>
              <li>Crush your enemies with malice</li>
              <li>Cause confusion and disorder</li>
              <li>Discipline? Never heard of it</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  data() {
    return {
      currentClass: null,
    }
  },
  methods: {
    viewClasses(classType) {
      this.currentClass = classType
      console.log(`Viewing ${classType} classes`)
      this.$router.push({ path: `/class-cards/${classType}` })
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display+SC:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap');

main {
  height: 100%;
  padding: 10px;
}

main div {
  display: flex;
  align-items: center;
  flex-direction: column;
}

#sides {
  display: flex;
  justify-content: space-around;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 100%;
  margin-top: 5%;
}

.class-view {
  margin: 10px;
  transition: all 0.3s ease-in-out;
  width: 27%;
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;
  padding: 20px;
  min-height: 60vh;
}

.class-view h2 {
  font-family: 'Playfair Display SC', serif;
  font-size: 24px;
  margin-bottom: 10px;
}

.class-view:hover {
  transform: scale(1.2);
  cursor: pointer;
}

.class-img {
  border-radius: 50%;
  width: 100%;
  height: auto;
  transition: all 0.3s ease-in-out;
}

#order:hover img {
  -webkit-box-shadow: 0px 0px 69px 0px rgba(248, 186, 24, 0.9);
  -moz-box-shadow: 0px 0px 69px 0px rgba(248, 186, 24, 0.9);
  box-shadow: 0px 0px 69px 0px rgba(248, 186, 24, 0.9);
}

#balance:hover img {
  -webkit-box-shadow: 0px 0px 69px 0px rgba(255, 110, 146, 0.9);
  -moz-box-shadow: 0px 0px 69px 0px rgba(255, 110, 146, 0.9);
  box-shadow: 0px 0px 69px 0px rgba(255, 110, 146, 0.9);
}

#chaos:hover img {
  -webkit-box-shadow: 0px 0px 69px 0px rgba(148, 0, 211, 0.9);
  -moz-box-shadow: 0px 0px 69px 0px rgba(148, 0, 211, 0.9);
  box-shadow: 0px 0px 69px 0px rgba(148, 0, 211, 0.9);
}

#sides:hover .class-view:not(:hover) {
  filter: brightness(0.3);
}

.description {
  background-color: gray;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  margin-top: 5%;
}
</style>
