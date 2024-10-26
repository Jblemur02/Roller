<template>
  <main>
    <nav>
      <div id="nav-links">
        <a
          :class="{ active: selectedTab === 'user' }"
          @click="selectTab('user')"
          >Your Auctions</a
        >
        <a
          :class="{ active: selectedTab === 'site' }"
          @click="selectTab('site')"
          >Live Auctions</a
        >
      </div>
    </nav>

    <div v-if="selectedTab === 'user'">
      <h1>Your Auctions</h1>
    </div>
    <div v-else-if="selectedTab === 'site'">
      <h1>Live Auctions</h1>
    </div>
  </main>
</template>

<script>
export default {
  data() {
    return {
      selectedTab: 'user',
    }
  },
  methods: {
    selectTab(tab) {
      this.selectedTab = tab
    },
  },
}
</script>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  color: var(--inverse);
}

nav {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  background-color: #333;
  margin: 0 auto 1%;
  width: 80%;
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
}

#nav-links {
  display: flex;
  justify-content: space-around;
  list-style-type: none;
  margin: 0;
  padding: 14px 0;
}

nav a {
  color: white;
  padding: 14px 20px;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  flex-shrink: 0;
}

nav a.active,
nav a:hover {
  background-color: #555;
}
</style>
