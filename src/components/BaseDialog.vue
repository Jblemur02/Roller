<script setup>
import { onMounted, onUnmounted } from 'vue'
defineProps({ title: String, wide: Boolean, eyebrow: String })
const emit = defineEmits(['close'])
function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <section class="panel" :class="{ wide }" role="dialog" aria-modal="true" :aria-label="title">
      <header>
        <div>
          <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
          <h2>{{ title }}</h2>
        </div>
        <button class="close" aria-label="Close" @click="$emit('close')">×</button>
      </header>
      <slot />
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 4, 12, 0.8);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 20px;
}
.panel {
  width: min(520px, 100%);
  max-height: 100%;
  overflow: auto;
  background: linear-gradient(180deg, #1c1830, #131022);
  border: 1px solid rgba(201, 162, 74, 0.3);
  border-radius: 18px;
  padding: 22px 24px;
}
.panel.wide {
  width: min(1180px, 100%);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.eyebrow {
  margin: 0;
  color: var(--gold);
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.15em;
}
h2 {
  margin: 2px 0 0;
  font-size: 1.4rem;
}
.close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.9rem;
  line-height: 1;
  opacity: 0.7;
}
.close:hover {
  opacity: 1;
}
</style>
