<template>
  <main>
    <h1>Hello, {{ user.username }}</h1>
    <p>You have {{ user.time_shards }} Time shards</p>
    <p>You are level {{ user.level }}</p>
    <p>You have {{ user.chronos }} Chronos</p>
  </main>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  setup() {
    const store = useStore()
    const user = computed(() => store.state.userData || { username: 'Guest' })

    return {
      user,
    }
  },
}
</script>

<style scoped>
main {
  color: var(--inverse);
  text-align: center;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
