<template>
  <main>
    <div id="left">
      <img
        id="chronos_logo"
        src="./images/chronos_logo.png"
        alt="Chronos Logo"
      />
    </div>
    <div id="middle">
      <router-link to="/">Home</router-link>
      <router-link to="/test">Hell</router-link>
      <router-link v-if="isAuthenticated" to="/auction">Auction</router-link>
      <router-link v-if="isAuthenticated" to="/play">Play</router-link>
      <router-link v-if="isAuthenticated" to="/store">Store</router-link>
      <router-link v-if="isAuthenticated" to="/account">Account</router-link>
    </div>
    <div id="right">
      <router-link v-if="!isAuthenticated" to="/login"
        >Login/SignUp</router-link
      >
      <a v-if="isAuthenticated" @click.prevent="logout">Logout</a>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex' // Import useStore to access Vuex

const store = useStore()
const router = useRouter()

const isAuthenticated = computed(() => store.state.isAuthenticated)

// Logout function
function logout() {
  store.dispatch('logout')
  router.push('/login')
}
</script>

<style scoped>
main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background-color: var(--dark-gray);
  box-shadow: var(--shadow);
  border-radius: 8px;
  width: 90%;
  margin: 10px auto;
  height: 100%;
}

#chronos_logo {
  height: 20px;
  width: auto;
}

a,
router-link {
  font-size: 1.4rem;
  text-decoration: none;
  color: var(--inverse);
  padding: 5px 15px;
  border-radius: 5px;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

a:hover,
router-link:hover {
  background-color: var(--primaryh);
  color: white;
}

#left {
  margin-right: auto;
}

#middle {
  display: flex;
  gap: 15px;
}

#right {
  margin-left: auto;
}

#right a {
  font-weight: bold;
}

#middle a.router-link-active,
#middle a.router-link-exact-active {
  background-color: var(--primary);
  cursor: pointer;
}
</style>
