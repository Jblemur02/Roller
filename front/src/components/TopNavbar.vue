<template>
  <main>
    <router-link to="/">Home</router-link>
    <router-link to="/roll">Roll</router-link>
    <router-link to="/store">Store</router-link>
  </main>
</template>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 0 20px;
  width: 100%;
  padding: 20px;
  background-color: var(--black);
  box-shadow: var(--shadow);
  height: 8vh;
}

a {
  margin: 10px;
  font-size: 2rem;
  text-decoration: none;
  color: var(--inverse);
  transition: color 0.3s ease;
}
a:hover {
  color: var(--primary);
}
</style>
