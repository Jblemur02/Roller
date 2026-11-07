<script setup>
// Owner-only testing tools: give yourself any amount of either currency.
import { ref } from 'vue'
import ShardIcon from './ShardIcon.vue'
import ChronosIcon from './ChronosIcon.vue'
import { changeBalance, MAX_BALANCE } from '../lib/player.js'

const rows = [
  { id: 'shards', label: 'Time Shards', icon: ShardIcon },
  { id: 'chronos', label: 'Chronos', icon: ChronosIcon },
]
const amounts = ref({ shards: '', chronos: '' })
const message = ref('')
const isError = ref(false)

function apply(row, mode) {
  const raw = String(amounts.value[row.id]).replace(/[,\s_]/g, '')
  if (raw === '' || !/^-?\d+$/.test(raw)) {
    isError.value = true
    message.value = `Type a whole number for ${row.label}.`
    return
  }
  const result = changeBalance(row.id, raw, mode)
  isError.value = false
  message.value =
    mode === 'set'
      ? `${row.label} set to ${result.toLocaleString()}.`
      : `${Number(raw) < 0 ? 'Removed' : 'Added'} ${Math.abs(Number(raw)).toLocaleString()} ${row.label}. You now have ${result.toLocaleString()}.`
  amounts.value[row.id] = ''
}
</script>

<template>
  <section class="testing" aria-label="Testing tools">
    <p class="title">Testing tools <span>(only you can see this)</span></p>
    <div class="rows">
      <form v-for="row in rows" :key="row.id" class="row" @submit.prevent="apply(row, 'add')">
        <label :for="'amt-' + row.id"><component :is="row.icon" /> {{ row.label }}</label>
        <input
          :id="'amt-' + row.id"
          v-model="amounts[row.id]"
          inputmode="numeric"
          placeholder="Amount"
          autocomplete="off"
        />
        <button type="submit">Add</button>
        <button type="button" @click="apply(row, 'set')">Set</button>
      </form>
    </div>
    <p v-if="message" class="msg" :class="{ error: isError }" role="status">{{ message }}</p>
    <p class="hint">Add a negative number to take some away. Balances stay between 0 and {{ MAX_BALANCE.toLocaleString() }}.</p>
  </section>
</template>

<style scoped>
.testing {
  max-width: 720px;
  margin: 0 auto;
  padding: 14px 18px;
  border: 1px dashed rgba(201, 162, 74, 0.45);
  border-radius: 14px;
  background: rgba(201, 162, 74, 0.05);
}
.title {
  margin: 0 0 10px;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--gold);
}
.title span {
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.6;
}
.rows {
  display: flex;
  gap: 10px 24px;
  flex-wrap: wrap;
}
.row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 290px;
}
label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 108px;
  font-size: 0.85rem;
  font-weight: 600;
}
input {
  flex: 1;
  min-width: 0;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #0e0c18;
  color: #fff;
  font: inherit;
  font-size: 0.9rem;
  padding: 0 10px;
}
button {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
}
button[type='submit'] {
  background: var(--gold);
  border-color: var(--gold);
  color: #1a1408;
}
.msg {
  margin: 10px 0 0;
  font-size: 0.85rem;
  color: #8ff0da;
}
.msg.error {
  color: #ff8a8a;
}
.hint {
  margin: 6px 0 0;
  font-size: 0.75rem;
  opacity: 0.5;
}
</style>
