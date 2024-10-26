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
      <router-link to="/catalog">Catalog</router-link>
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

// Use Vuex state to determine if the user is authenticated
const isAuthenticated = computed(() => store.state.isAuthenticated)

// Logout function
function logout() {
  store.dispatch('logout') // Dispatch Vuex logout action
  router.push('/login') // Redirect to login page
}
</script>

<style scoped>
main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: var(--dark-gray);
  box-shadow: var(--shadow);
  border-radius: 8px;
  width: 90%;
  margin: 20px auto;
}

#chronos_logo {
  height: 50px;
  width: auto;
}

a,
router-link {
  margin: 0 15px;
  font-size: 1.5rem;
  text-decoration: none;
  color: var(--inverse);
  padding: 10px 15px;
  border-radius: 5px;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

a:hover,
router-link:hover {
  background-color: var(--primary);
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
</style>
