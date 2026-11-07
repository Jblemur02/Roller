<script setup>
// Chronos: earned by selling cards, spent at the auction house.
import logo from '../assets/chronos.png'
defineProps({ size: { type: String, default: '1.1em' } })
</script>

<template>
  <img :src="logo" alt="Chronos" class="chronos" :style="{ width: size, height: size }" />
</template>

<style scoped>
.chronos {
  display: inline-block;
  vertical-align: -0.18em;
  object-fit: contain;
  mix-blend-mode: screen; /* the logo has a black background */
}
</style>
