<script setup>
import TopBar from './components/TopNavbar.vue'
</script>

<template>
  <TopBar id="nav" />
  <RouterView id="app" />
</template>

<style scoped>
#nav {
  height: 8vh;
}

#app {
  min-height: 92vh;
}
</style>
