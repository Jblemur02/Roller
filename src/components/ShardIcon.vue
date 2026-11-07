<script setup>
// Time Shards: the currency for opening packs.
defineProps({ size: { type: String, default: '1.05em' } })
</script>

<template>
  <svg class="shard" :style="{ width: size, height: size }" viewBox="0 0 24 24" role="img" aria-label="Time Shards">
    <defs>
      <linearGradient id="shard-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#a8e8ff" />
        <stop offset="1" stop-color="#4a7dff" />
      </linearGradient>
    </defs>
    <path d="M12 1.5 19 8l-7 14.5L5 8z" fill="url(#shard-g)" />
    <path d="M12 1.5 15 8l-3 14.5L9 8z" fill="#fff" opacity=".35" />
    <path d="M5 8h14" stroke="#fff" stroke-opacity=".5" stroke-width=".8" />
  </svg>
</template>

<style scoped>
.shard {
  display: inline-block;
  vertical-align: -0.16em;
}
</style>
