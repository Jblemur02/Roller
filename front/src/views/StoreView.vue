<template>
  <main>
    <!-- Navigation Bar -->
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
    </nav>

    <!-- Tab Content -->
    <div v-if="selectedTab === 'featured'" id="featured">
      <h2>Featured Content</h2>
      <div class="pack-container">
        <div
          v-for="(item, index) in featuredItems"
          :key="index"
          class="pack-item"
        >
          <div class="pack" :style="{ backgroundImage: `url(${item.image})` }">
            <div class="overlay"></div>
            <h2 class="pack-name">{{ item.name }}</h2>
            <p class="pack-price">{{ item.price }} Chronos</p>
            <a class="open-pack" @click="openPack(item.name)"
              >Open {{ item.type === 'pack' ? 'Pack' : 'Booster' }}</a
            >
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
            <p class="pack-price">{{ pack.price }} Chronos</p>
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
            <p class="pack-price">{{ booster.price }} Chronos</p>
            <a class="open-pack" @click="openPack(booster.name)">Open Pack</a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedTab === 'bundles'" id="bundles">
      <h2>Bundles</h2>
      <p>Information about bundles goes here.</p>
    </div>

    <!-- Modal for displaying generated cards -->
    <div v-if="isModalOpen" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2>Opened Pack</h2>
        <div class="card-container">
          <div
            v-for="(card, index) in displayedCards"
            :key="index"
            class="card"
          >
            <h3>{{ card.name }}</h3>
            <p>Type: {{ card.type }}</p>
            <p>Value: {{ card.value }}</p>
          </div>
        </div>
        <button class="open-pack-again" @click="openPackAgain">
          Open Pack Again
        </button>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  data() {
    return {
      selectedTab: 'featured',
      packs: [],
      boosters: [],
      featured: [],
      isModalOpen: false,
      displayedCards: [],
    }
  },
  async created() {
    await this.fetchPacks()
  },
  methods: {
    async fetchPacks() {
      try {
        const response = await fetch('/src/assets/packs/packs.json')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        this.packs = data.packs
        this.boosters = data.boosters
        this.featured = data.featured
      } catch (error) {
        console.error('Error fetching packs:', error)
      }
    },
    selectTab(tabName) {
      this.selectedTab = tabName
    },
    openPack(packName) {
      console.log(`Opening pack: ${packName}`)
      this.generateCards(packName) // Generate cards based on the pack
      this.isModalOpen = true // Open modal
    },
    closeModal() {
      this.isModalOpen = false
      this.displayedCards = [] // Clear cards
    },
    openPackAgain() {
      this.closeModal() // Close the modal first
      // You can call the same pack opening logic here again if needed
      this.openPack('your_pack_name') // Replace 'your_pack_name' with actual name if needed
    },
    generateCards(packName) {
      // Placeholder for card generation logic; you can replace this with actual card generation
      const cards = [
        { name: 'Card 1', type: 'Type A', value: 100 },
        { name: 'Card 2', type: 'Type B', value: 200 },
        { name: 'Card 3', type: 'Type A', value: 150 },
        { name: 'Card 4', type: 'Type C', value: 250 },
        { name: 'Card 5', type: 'Type B', value: 300 },
        { name: 'Card 6', type: 'Type A', value: 50 },
      ]
      this.displayedCards = cards // Set displayed cards
    },
  },
  computed: {
    featuredItems() {
      return this.featured
        .map(item => {
          const pack = this.packs.find(pack => pack.name === item.name)
          if (pack) {
            return { ...pack, type: 'pack' }
          }
          const booster = this.boosters.find(
            booster => booster.name === item.name,
          )
          if (booster) {
            return { ...booster, type: 'booster' }
          }
          return null
        })
        .filter(item => item)
    },
  },
}
</script>

<style scoped>
main {
  width: 100%;
  padding: 0;
  margin: 0 auto; /* Center the content */
}

#navbar {
  display: flex;
  justify-content: center;
  background-color: #333;
  padding: 10px 0; /* Adjust padding as needed */
  margin: 0 auto; /* Remove margin */
  width: 100%; /* Ensure it occupies full width */
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
  overflow-x: auto; /* Enable horizontal scrolling */
  padding: 20px 0;
}

.card {
  min-width: 150px; /* Minimum width for card */
  margin: 0 10px; /* Spacing between cards */
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
