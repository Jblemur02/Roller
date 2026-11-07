<script setup>
import { computed, ref } from 'vue'
import BaseDialog from './BaseDialog.vue'
import GameCard from './GameCard.vue'
import QuantityPicker from './QuantityPicker.vue'
import ChronosIcon from './ChronosIcon.vue'
import { freeCount, sellCards } from '../lib/player.js'

const props = defineProps({ card: { type: Object, required: true } })
const emit = defineEmits(['close', 'done'])

const max = computed(() => freeCount(props.card.uid))
const qty = ref(1)
const confirming = ref(false)
const error = ref('')
const total = computed(() => props.card.value * qty.value)

function sell() {
  try {
    const earned = sellCards(props.card.uid, qty.value)
    emit('done', `Sold ${qty.value}× ${props.card.name} for ${earned.toLocaleString()} Chronos.`)
  } catch (e) {
    error.value = e.message
    confirming.value = false
  }
}
</script>

<template>
  <BaseDialog title="Sell card" eyebrow="Collection" @close="$emit('close')">
    <div class="layout">
      <GameCard :card="card" small />
      <div class="controls">
        <p class="name">{{ card.tier.name }} {{ card.name }}</p>
        <p class="muted">You own {{ card.quantity }}<template v-if="card.reserved"> · {{ card.reserved }} in use (gear or Hand)</template></p>
        <p>Price per card: <strong>{{ card.value.toLocaleString() }}</strong> <ChronosIcon /></p>

        <template v-if="max > 0">
          <QuantityPicker v-model="qty" :max="max" />
          <p class="total">You get <strong>{{ total.toLocaleString() }}</strong> <ChronosIcon /></p>

          <div v-if="!confirming" class="actions">
            <button class="primary" @click="confirming = true">Sell {{ qty }}</button>
          </div>
          <div v-else class="confirm">
            <p>Sell {{ qty }}× {{ card.name }}? This can't be undone.</p>
            <div class="actions">
              <button class="secondary" @click="confirming = false">No</button>
              <button class="primary" @click="sell">Yes, sell</button>
            </div>
          </div>
        </template>
        <p v-else class="muted">Every copy is in use. Unequip it or take it out of your Hand to sell it.</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>
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
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.controls p {
  margin: 0;
}
.name {
  font-weight: 700;
  font-size: 1.1rem;
}
.total {
  font-size: 1.05rem;
}
.confirm {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
