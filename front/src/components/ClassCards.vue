<template>
  <main :class="currentClass">
    <router-link id="go-back" to="/play">Go back</router-link>
    <div>
      <h1 class="class-name">{{ formatClass }}</h1>
      <h3
        class="quote"
        v-if="classType === 'order'"
        :style="{ color: 'var(--order)' }"
      >
        "Fight with honor"
      </h3>
      <h3
        class="qoute"
        v-if="classType === 'balance'"
        :style="{ color: 'var(--balance)' }"
      >
        "Balance the forces"
      </h3>
      <h3
        class="qoute"
        v-if="classType === 'chaos'"
        :style="{ color: 'var(--chaos)' }"
      >
        "Seek chaos"
      </h3>
      <div id="classes" v-if="classData">
        <div
          v-for="(classItem, index) in classData"
          :key="index"
          class="class"
          :style="{ width: 90 / classData.length + '%' }"
        >
          <img :src="classItem.image" :alt="classItem.name" />
          <div class="class_description">
            <h3>{{ classItem.name }}</h3>
            <p>{{ classItem.description }}</p>
            <p>Minions: {{ classItem.stats.minions }}</p>
            <p>{{ stats.aggression }}</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import axios from 'axios'

export default {
  props: ['classType'],
  data() {
    return {
      classData: null,
      stats: null,
    }
  },
  computed: {
    currentClass() {
      return this.classType
    },
    formatClass() {
      return this.classType.charAt(0).toUpperCase() + this.classType.slice(1)
    },
  },
  mounted() {
    this.fetchClassData()
    this.fetchStats()
  },
  methods: {
    async fetchClassData() {
      try {
        console.log('Fetching class data for:', this.classType)
        const response = await axios.get(`/site/classes/${this.classType}`)
        this.classData = response.data
      } catch (error) {
        console.error('Error fetching class data:', error)
      }
    },
    async fetchStats() {
      try {
        console.log('Fetching stats for:', this.classType)
        const response = await axios.get(`/site/stats`)
        this.stats = response.data
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    },
  },
}
</script>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--inverse);
  text-align: center;
}

#go-back {
  padding: 10px;
  background-color: var(--primary);
  color: white;
}

#go-back:hover {
  background-color: var(--primaryh);
}

.order {
  background-image: url('https://ik.imagekit.io/roller/classes/types/order?updatedAt=1730420093693');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.balance {
  background-image: url('https://ik.imagekit.io/roller/classes/types/balance.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.chaos {
  background-image: url('https://ik.imagekit.io/roller/classes/types/chaos');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

#classes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  gap: 10px;
  margin: 0 auto;
}

.class {
  border: 1px solid var(--inverse);
  padding: 20px;
  background-color: black;
  box-shadow: var(--shadow);
  border-radius: 20px;
}

.class img {
  width: 100%;
  height: 50%;
  object-fit: cover;
  border-radius: 20px;
  margin-bottom: 10px;
  box-sizing: border-box;
  object-position: 50% 25%;
}

.class_description {
  padding: 20px;
  background-color: var(--primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.class-name {
  font-size: 2em;
  color: white;
  margin-bottom: 20px;
}
</style>
