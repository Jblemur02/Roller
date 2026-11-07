<script setup>
import logo from '../assets/chronos.png'
defineProps({ size: { type: String, default: '1.1em' } })
</script>

<template>
  <img :src="logo" alt="Time Shards" class="shard" :style="{ width: size, height: size }" />
</template>

<style scoped>
.shard {
  display: inline-block;
  vertical-align: -0.18em;
  object-fit: contain;
  mix-blend-mode: screen; /* the logo has a black background */
}
</style>
