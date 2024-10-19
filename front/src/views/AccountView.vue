<template>
  <main>
    <h1>Hello, {{ user }}</h1>
  </main>
</template>

<script>
export default {
  data() {
    return {
      user: '',
    }
  },
  mounted() {
    // Retrieve the username from localStorage
    this.user = localStorage.getItem('username') || 'Guest'
  },
}
</script>

<style scoped></style>
