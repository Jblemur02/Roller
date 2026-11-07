<script setup>
import { computed } from 'vue'
import BaseDialog from './BaseDialog.vue'
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
  <BaseDialog :title="`${item.name} odds`" eyebrow="Odds" @close="$emit('close')">
      <p class="sub">{{ pool.pulls }} cards per pack · chance per card</p>
      <table>
        <thead>
          <tr><th>Tier</th><th>Cards</th><th>Chance</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.tier.value">
            <td>
              <span :style="{ fontFamily: row.tier.font }">{{ row.tier.name }}</span>
              <small v-if="Number(row.tier.value) >= 20" class="minion"> minion</small>
            </td>
            <td>{{ row.cards }}</td>
            <td>
              <div class="chance">
                <div class="bar"><span :style="{ width: Math.max(row.chance * 100, 0.5) + '%' }"></span></div>
                {{ pct(row.chance) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
  </BaseDialog>
</template>

<style scoped>
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
.chance {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}
th:last-child { text-align: right; }
.minion {
  opacity: 0.55;
  font-size: 0.75rem;
}
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
