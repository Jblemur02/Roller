<script setup>
import { computed, ref } from 'vue'
import BaseDialog from './BaseDialog.vue'
import GameCard from './GameCard.vue'
import QuantityPicker from './QuantityPicker.vue'
import ChronosIcon from './ChronosIcon.vue'
import { freeCount, session } from '../lib/player.js'
import { listCard } from '../lib/auctions.js'

const props = defineProps({ card: { type: Object, required: true } })
const emit = defineEmits(['close', 'done'])

const max = computed(() => freeCount(props.card.uid))
const qty = ref(1)
const price = ref(Math.max(1, props.card.value))
const busy = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await listCard(props.card.uid, qty.value, price.value)
    emit('done', `Listed ${qty.value}× ${props.card.name} for ${Number(price.value).toLocaleString()} Chronos.`)
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BaseDialog title="List at auction" eyebrow="Auction house" @close="$emit('close')">
    <div class="layout">
      <GameCard :card="card" small />
      <form class="controls" @submit.prevent="submit">
        <p class="name">{{ card.tier.name }} {{ card.name }}</p>
        <p class="muted">Base value {{ card.value.toLocaleString() }} <ChronosIcon /> each</p>

        <template v-if="max > 0">
          <label>Copies</label>
          <QuantityPicker v-model="qty" :max="max" />
          <label for="price">Buy-now price for all {{ qty }} (Chronos)</label>
          <input id="price" v-model.number="price" type="number" min="1" step="1" required />
          <p class="muted small">The cards leave your collection while listed. Cancel any time to get them back.</p>
          <p v-if="session.mode !== 'cloud'" class="muted small">
            You're playing offline, so other players can't see this listing.
          </p>
          <button class="primary" type="submit" :disabled="busy">{{ busy ? 'Listing…' : 'List it' }}</button>
        </template>
        <p v-else class="muted">Every copy is in use. Unequip it or take it out of your Hand first.</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </form>
    </div>
  </BaseDialog>
</template>

<style scoped>
.layout {
  display: flex;
  gap: 22px;
  flex-wrap: wrap;
  justify-content: center;
}
.controls {
  flex: 1;
  min-width: 230px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.controls p {
  margin: 0;
}
.name {
  font-weight: 700;
  font-size: 1.1rem;
}
label {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-top: 4px;
}
input {
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #0e0c18;
  color: #fff;
  font: inherit;
  padding: 0 10px;
}
.small {
  font-size: 0.8rem;
}
</style>
