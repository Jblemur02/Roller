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
      <span v-if="isAuthenticated">
        <router-link to="/store">Store</router-link>
        <router-link to="/account">Account</router-link>
      </span>
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

const store = useStore() // Access the Vuex store
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
  justify-content: center;
  align-items: center;
  width: 90%;
  background-color: var(--black);
  box-shadow: var(--shadow);
  margin: 0 auto;
}

a {
  margin: 0 15px;
  font-size: 1.8rem;
  text-decoration: none;
  color: var(--inverse);
  transition: color 0.3s ease;
}

a:hover {
  color: var(--primary);
}

#left {
  margin-right: auto;
}

#middle {
  margin: 0 auto;
}

#right {
  margin-left: auto;
}
</style>
