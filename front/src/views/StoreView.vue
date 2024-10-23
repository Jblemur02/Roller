<template>
  <main>
    <nav id="navbar">
      <div id="nav-links">
        <a
          :class="{ active: selectedTab === 'featured' }"
          @click="selectTab('featured')"
          >Featured</a
        >
        <a
          :class="{ active: selectedTab === 'packs' }"
          @click="selectTab('packs')"
          >Packs</a
        >
        <a
          :class="{ active: selectedTab === 'booster' }"
          @click="selectTab('booster')"
          >Booster</a
        >
        <a
          :class="{ active: selectedTab === 'bundles' }"
          @click="selectTab('bundles')"
          >Bundles</a
        >
      </div>
      <div>
        <span v-if="user.time_shards !== null">
          <span>Time Shards: {{ user.time_shards }}</span>
        </span>
      </div>
    </nav>

    <div v-if="selectedTab === 'featured'" id="featured">
      <h2>Featured Content</h2>
      <div class="pack-container">
        <div v-for="(item, index) in featured" :key="index" class="pack-item">
          <div class="pack" :style="{ backgroundImage: `url(${item.image})` }">
            <div class="overlay"></div>
            <h2 class="pack-name">{{ item.name }}</h2>
            <p class="pack-price">
              {{ item.price }}
              <img
                id="chronos_logo"
                src="../components/images/chronos_logo.png"
              />
            </p>
            <a class="open-pack" @click="openPack(item.name)">
              Open
              {{
                item.type === 'pack'
                  ? 'Pack'
                  : item.type === 'booster'
                    ? 'Booster'
                    : 'Bundle'
              }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedTab === 'packs'" id="packs">
      <h2>Packs</h2>
      <div class="pack-container">
        <div v-for="(pack, index) in packs" :key="index" class="pack-item">
          <div class="pack" :style="{ backgroundImage: `url(${pack.image})` }">
            <div class="overlay"></div>
            <h2 class="pack-name">{{ pack.name }}</h2>
            <p class="pack-price">
              {{ pack.price }}
              <img
                id="chronos_logo"
                src="../components/images/chronos_logo.png"
              />
            </p>
            <a class="open-pack" @click="openPack(pack.name)">Open Pack</a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedTab === 'booster'" id="booster">
      <h2>Boosters</h2>
      <div class="pack-container">
        <div
          v-for="(booster, index) in boosters"
          :key="index"
          class="pack-item"
        >
          <div
            class="pack"
            :style="{ backgroundImage: `url(${booster.image})` }"
          >
            <div class="overlay"></div>
            <h2 class="pack-name">{{ booster.name }}</h2>
            <p class="pack-price">
              {{ booster.price }}
              <img
                id="chronos_logo"
                src="../components/images/chronos_logo.png"
              />
            </p>
            <a class="open-pack" @click="openPack(booster.name)">Open Pack</a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedTab === 'bundles'" id="bundles">
      <h2>Bundles</h2>
      <div class="pack-container">
        <div v-for="(bundle, index) in bundles" :key="index" class="pack-item">
          <div
            class="pack"
            :style="{ backgroundImage: `url(${bundle.image})` }"
          >
            <div class="overlay"></div>
            <h2 class="pack-name">{{ bundle.name }}</h2>
            <p class="pack-price">
              {{ bundle.price }}
              <img
                id="chronos_logo"
                src="../components/images/chronos_logo.png"
              />
            </p>
            <a class="open-pack" @click="openPack(bundle.name)">Open Pack</a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2>Opened Pack: {{ currentPackName }}</h2>
        <div class="card-container">
          <RollCard
            v-for="(card, index) in displayedCards"
            :key="index"
            :name="card.name"
            :type="card.type"
            :image="card.image"
            :tier="card.tier"
            :value="card.value"
          />
        </div>
        <button class="open-pack-again" @click="openPackAgain">
          Open Pack Again
        </button>
      </div>
    </div>
  </main>
</template>

<script>
import CardGenerator from '../scripts/generateCardPulls.js'
import RollCard from '../components/DisplayCard.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  components: {
    RollCard,
  },
  setup() {
    const store = useStore()
    const user = computed(() => store.state.userData)

    return {
      user,
    }
  },
  data() {
    return {
      selectedTab: 'featured',
      packs: [],
      boosters: [],
      featured: [],
      bundles: [],
      isModalOpen: false,
      displayedCards: [],
      cardGenerator: new CardGenerator(),
      currentPackName: '',
    }
  },
  async created() {
    await this.fetchPacks()
  },
  methods: {
    async fetchPacks() {
      try {
        const response = await fetch('/src/assets/packs/packs.json')
        if (!response.ok) throw new Error('Failed to fetch packs')
        const data = await response.json()
        this.packs = data.packs
        this.boosters = data.boosters
        this.featured = data.featured
        this.bundles = data.bundles
        console.log(this.user.time_shards)
      } catch (error) {
        console.error('Error fetching packs:', error)
      }
    },
    selectTab(tabName) {
      this.selectedTab = tabName
    },
    async generateCards(selectedPack) {
      try {
        this.displayedCards = await this.cardGenerator.generateNumbers(
          selectedPack.name,
        )
      } catch (error) {
        console.error('Error generating cards:', error)
        throw error
      }
    },
    async openPack(packName) {
      const selectedPack =
        this.featured.find(pack => pack.name === packName) ||
        this.packs.find(pack => pack.name === packName) ||
        this.boosters.find(pack => pack.name === packName) ||
        this.bundles.find(pack => pack.name === packName)

      if (!selectedPack) {
        alert('Pack not found')
        return
      }

      const packPrice = selectedPack.price
      this.currentPackName = packName

      console.log('Current Time Shards:', this.user.time_shards)
      console.log('Pack Price:', packPrice)

      if (this.user.time_shards >= packPrice) {
        console.log('Before Deduction:', this.user.time_shards)
        this.$store.commit('updateTimeShards', -packPrice) // Pass in negative to deduct
        await this.$store.dispatch('updateUserData') // Update in the database
        console.log('After Deduction:', this.user.time_shards)
        this.isModalOpen = true
        try {
          await this.generateCards(selectedPack)
        } catch (error) {
          console.error('Error generating cards:', error)
          alert('There was an error opening the pack. Please try again.')
        }
      } else {
        alert('Not enough time shards to open this pack')
      }
    },
    openPackAgain() {
      this.openPack(this.currentPackName)
    },
    closeModal() {
      this.isModalOpen = false
    },
  },
}
</script>

<style scoped>
main {
  width: 100%;
  padding: 0;
  margin: 0 auto;
}

#navbar {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  background-color: #333;
  padding: 0 0 10px;
  margin: 0 auto;
  width: 100%;
}

#nav-links {
  display: flex;
  justify-content: space-around;
  list-style-type: none;
  margin: 0;
  padding: 14px 0;
}

#navbar a {
  color: white;
  padding: 14px 20px;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  flex-shrink: 0;
}

#navbar a.active,
#navbar a:hover {
  background-color: #555;
}

.pack-container {
  display: flex;
  overflow-x: auto;
  padding: 20px;
  justify-content: center;
}

.pack-item {
  flex: 0 0 auto;
  margin: 0 10px;
}

.pack {
  border: 2px solid #fff;
  border-radius: 10px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  width: 300px;
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  background-size: cover;
  background-position: center;
  padding: 20px;
  position: relative;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.7);
}

.pack:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.pack-name {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
  position: relative;
  z-index: 2;
}

.pack-price {
  font-size: 18px;
  position: relative;
  z-index: 2;
}

.open-pack {
  margin: 20px 0;
  color: white;
  background-color: blue;
  box-shadow: var(--shadow);
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  transition:
    background-color 0.3s,
    transform 0.3s;
  position: relative;
  z-index: 2;
}

.open-pack:hover {
  background-color: darkblue;
  transform: scale(1.05);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  position: relative;
  max-width: 800px;
  width: 90%;
}

.close {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 24px;
  cursor: pointer;
}

.card-container {
  display: flex;
  overflow-x: auto;
  padding: 20px 0;
}

.card {
  min-width: 150px;
  margin: 0 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.open-pack-again {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: blue;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.open-pack-again:hover {
  background-color: darkblue;
}
</style>
