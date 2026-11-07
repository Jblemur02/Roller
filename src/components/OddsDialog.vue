<script setup>
import { computed } from 'vue'
import { getPool, tierOdds } from '../lib/packs.js'

const props = defineProps({ item: { type: Object, required: true } })
defineEmits(['close'])

const rows = computed(() => tierOdds(props.item))
const pool = computed(() => getPool(props.item))

function pct(x) {
  if (x >= 0.1) return (x * 100).toFixed(1) + '%'
  if (x >= 0.001) return (x * 100).toFixed(2) + '%'
  return (x * 100).toFixed(3) + '%'
}
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <section class="panel" role="dialog" aria-modal="true" :aria-label="`${item.name} odds`">
      <header>
        <h2>{{ item.name }} odds</h2>
        <button class="close" aria-label="Close" @click="$emit('close')">×</button>
      </header>
      <p class="sub">{{ pool.pulls }} cards per pack · chance per card</p>
      <table>
        <thead>
          <tr><th>Tier</th><th>Cards</th><th>Chance</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.tier.value">
            <td :style="{ fontFamily: row.tier.font }">{{ row.tier.name }}</td>
            <td>{{ row.cards }}</td>
            <td>
              <div class="bar"><span :style="{ width: Math.max(row.chance * 100, 0.5) + '%' }"></span></div>
              {{ pct(row.chance) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 4, 12, 0.75);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 20px;
}
.panel {
  width: min(460px, 100%);
  max-height: 100%;
  overflow: auto;
  background: #1a1729;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 20px 24px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 { margin: 0; font-size: 1.3rem; }
.close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.8rem;
  opacity: 0.7;
}
.sub { margin: 4px 0 14px; opacity: 0.6; font-size: 0.85rem; }
table { width: 100%; border-collapse: collapse; }
th {
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.6;
  padding-bottom: 6px;
}
td {
  padding: 7px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-variant-numeric: tabular-nums;
}
td:last-child {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}
th:last-child { text-align: right; }
.bar {
  width: 110px;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  background: var(--gold);
}
</style>
