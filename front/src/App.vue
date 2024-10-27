<script setup>
import TopBar from './components/TopNavbar.vue'
</script>

<template>
  <TopBar id="nav" />
  <RouterView id="app" />
</template>

<script>
import { useStore } from 'vuex'

export default {
  setup() {
    const store = useStore()
    store.dispatch('fetchUserData')
  },
}
</script>

<style scoped>
#nav {
  height: 5vh;
}

#app {
  min-height: 92vh;
}
</style>
