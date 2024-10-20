<template>
  <main>
    <nav id="navbar">
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
      <span v-if="timeShards !== null">
        <span>Time Shards: {{ timeShards }}</span>
      </span>
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

export default {
  components: {
    RollCard,
  },
  data() {
    return {
      selectedTab: 'featured',
      packs: [],
      boosters: [],
      featured: [],
      bundles: [],
      isModalOpen: false,s
      displayedCards: [],
      cardGenerator: new CardGenerator(),
      currentPackName: '',
      timeShards: 0,
    }
  },
  async created() {
    await this.fetchPacks();
    await this.fetchUserTimeShards();
  },
  methods: {
    async fetchUserTimeShards() {
      try {
        const response = await fetch('/userData', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user time_shards');
        }

        const data = await response.json();
        this.timeShards = data.time_shards;
      } catch (error) {
        console.error('Error fetching user time_shards:', error);
      }
    },
    async fetchPacks() {
      try {
        const response = await fetch('/src/assets/packs/packs.json');
        if (!response.ok) throw new Error('Failed to fetch packs');
        const data = await response.json();
        this.packs = data.packs;
        this.boosters = data.boosters;
        this.featured = data.featured;
        this.bundles = data.bundles;
      } catch (error) {
        console.error('Error fetching packs:', error);
      }
    },
    selectTab(tabName) {
      this.selectedTab = tabName;
    },
    async openPack(packName) {
      this.currentPackName = packName;
      this.isModalOpen = true;

      try {
        // Generate cards for the opened pack
        const generatedCards = await this.cardGenerator.generateNumbers(packName);
        this.displayedCards = generatedCards;
      } catch (error) {
        console.error(`Error generating cards for ${packName}:`, error);
      }
    },
    openPackAgain() {
      this.openPack(this.currentPackName); // Reopens the same pack
    },
    closeModal() {
      this.isModalOpen = false;
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
  background-color: #333;
  padding: 10px 0;
  margin: 0 auto;
  width: 100%;
}

#navbar a {
  color: white;
  padding: 14px 20px;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  flex-shrink: 0; /* Prevents flex items from shrinking */
}

#navbar a.active,
#navbar a:hover {
  background-color: #555;
}

.pack-container {
  display: flex;
  overflow-x: auto; /* Enable horizontal scrolling */
  padding: 20px;
  justify-content: center; /* Center packs horizontally */
}

.pack-item {
  flex: 0 0 auto; /* Prevent flex items from shrinking */
  margin: 0 10px; /* Add spacing between pack items */
}

.pack {
  border: 2px solid #fff; /* Add border to the pack */
  border-radius: 10px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  width: 300px; /* Width of the pack */
  height: 400px; /* Height of the pack */
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* Align content to the bottom */
  align-items: center;
  background-size: cover;
  background-position: center;
  padding: 20px;
  position: relative;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  overflow: hidden; /* Hide overflow */
  background-color: rgba(
    0,
    0,
    0,
    0.7
  ); /* Add background color for darker effect */
}

.pack:hover {
  transform: scale(1.05); /* Scale up on hover */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); /* Add shadow on hover */
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5); /* Dark overlay */
  z-index: 1; /* Layer above background image */
}

.pack-name {
  font-size: 24px; /* Larger font for the pack name */
  font-weight: bold;
  margin: 10px 0;
  position: relative;
  z-index: 2; /* Layer above overlay */
}

.pack-price {
  font-size: 18px; /* Larger font for the price */
  position: relative;
  z-index: 2; /* Layer above overlay */
}

.open-pack {
  margin: 20px 0;
  color: white;
  background-color: blue;
  box-shadow: var(--shadow);
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px; /* Larger font size for the button */
  transition:
    background-color 0.3s,
    transform 0.3s;
  position: relative;
  z-index: 2; /* Layer above overlay */
}

.open-pack:hover {
  background-color: darkblue;
  transform: scale(1.05); /* Scale up on hover */
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7); /* Dark overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it appears above other content */
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  position: relative;
  max-width: 800px;
  width: 90%; /* Responsive width */
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
