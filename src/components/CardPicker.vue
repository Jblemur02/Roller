<script setup>
import BaseDialog from './BaseDialog.vue'
import GameCard from './GameCard.vue'

defineProps({
  title: String,
  eyebrow: String,
  cards: { type: Array, required: true },
  empty: { type: String, default: 'No cards to choose from.' },
  label: { type: String, default: 'Choose' },
  countOf: { type: Function, default: c => c.quantity },
})
defineEmits(['close', 'pick'])
</script>

<template>
  <BaseDialog :title="title" :eyebrow="eyebrow" wide @close="$emit('close')">
    <slot />
    <p v-if="!cards.length" class="muted">{{ empty }}</p>
    <div class="grid">
      <div v-for="card in cards" :key="card.uid" class="item">
        <GameCard :card="card" small />
        <p class="muted">×{{ countOf(card) }} available</p>
        <button class="primary" @click="$emit('pick', card)">{{ label }}</button>
      </div>
    </div>
  </BaseDialog>
</template>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  justify-content: center;
  padding: 10px 0;
}
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.item p {
  margin: 0;
  font-size: 0.85rem;
}
.item button {
  width: 100%;
}
</style>
