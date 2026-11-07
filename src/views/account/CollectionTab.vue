<script setup>
import { computed, ref } from 'vue'
import GameCard from '../../components/GameCard.vue'
import ChronosIcon from '../../components/ChronosIcon.vue'
import SellDialog from '../../components/SellDialog.vue'
import ListDialog from '../../components/ListDialog.vue'
import { collectionList, collectionValue } from '../../lib/player.js'
import { go } from '../../lib/router.js'

const emit = defineEmits(['notice'])

const SORTS = [
  { id: 'tier', label: 'Tier' },
  { id: 'value', label: 'Value' },
  { id: 'totalValue', label: 'Total value' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type' },
]
const sortBy = ref('tier')
const descending = ref(false)
const search = ref('')
const typeFilter = ref('')

const types = computed(() => [...new Set(collectionList.value.map(c => c.type))].sort())

function setSort(id) {
  if (sortBy.value === id) descending.value = !descending.value
  else {
    sortBy.value = id
    descending.value = false
  }
}

// "Natural" direction first: rarest tier, highest value, most copies, A→Z.
const compare = {
  tier: (a, b) => Number(a.tier.value) % 20 - Number(b.tier.value) % 20 || b.value - a.value,
  value: (a, b) => b.value - a.value,
  totalValue: (a, b) => b.totalValue - a.totalValue,
  quantity: (a, b) => b.quantity - a.quantity,
  name: (a, b) => a.name.localeCompare(b.name),
  type: (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
}

const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = collectionList.value.filter(
    c => (!typeFilter.value || c.type === typeFilter.value) && (!q || c.name.toLowerCase().includes(q) || c.tier.name.toLowerCase().includes(q)),
  )
  list.sort(compare[sortBy.value])
  return descending.value ? list.reverse() : list
})

const totalCards = computed(() => collectionList.value.reduce((s, c) => s + c.quantity, 0))

const selling = ref(null)
const listing = ref(null)
function done(msg) {
  selling.value = null
  listing.value = null
  emit('notice', msg)
}
</script>

<template>
  <div>
    <div class="head">
      <div>
        <h2>Your collection</h2>
        <p class="muted">
          {{ collectionList.length }} unique · {{ totalCards }} cards · worth {{ collectionValue.toLocaleString() }} <ChronosIcon />
        </p>
      </div>
      <div class="filters">
        <input v-model="search" type="search" placeholder="Search cards" aria-label="Search cards" />
        <select v-model="typeFilter" aria-label="Filter by type">
          <option value="">All types</option>
          <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>

    <div class="sorts" role="group" aria-label="Sort by">
      <span class="muted">Sort:</span>
      <button v-for="s in SORTS" :key="s.id" :class="{ active: sortBy === s.id }" @click="setSort(s.id)">
        {{ s.label }}<span v-if="sortBy === s.id">{{ descending ? ' ↑' : ' ↓' }}</span>
      </button>
    </div>

    <div v-if="!collectionList.length" class="empty">
      <p>No cards yet.</p>
      <button class="primary" @click="go('shop')">Open your first pack</button>
    </div>
    <p v-else-if="!shown.length" class="muted">No cards match.</p>

    <div class="grid">
      <div v-for="card in shown" :key="card.uid" class="item">
        <div class="card-wrap">
          <GameCard :card="card" small />
          <span class="count">×{{ card.quantity }}</span>
        </div>
        <p class="muted small">
          <template v-if="card.quantity > 1">Total {{ card.totalValue.toLocaleString() }} <ChronosIcon /></template>
          <template v-if="card.reserved"><template v-if="card.quantity > 1"> · </template>{{ card.reserved }} in use</template>
          &nbsp;
        </p>
        <div class="actions">
          <button class="secondary" @click="selling = card">Sell</button>
          <button class="secondary" @click="listing = card">Auction</button>
        </div>
      </div>
    </div>

    <SellDialog v-if="selling" :card="selling" @close="selling = null" @done="done" />
    <ListDialog v-if="listing" :card="listing" @close="listing = null" @done="done" />
  </div>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
h2 {
  margin: 0;
}
.head p {
  margin: 4px 0 0;
}
.filters {
  display: flex;
  gap: 8px;
}
.sorts {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin: 16px 0 20px;
}
.sorts button {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ddd;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.85rem;
}
.sorts button.active {
  background: var(--gold);
  color: #1a1408;
  border-color: var(--gold);
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 160px;
}
.card-wrap {
  position: relative;
}
.count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--gold);
  color: #1a1408;
  font-weight: 800;
  border-radius: 999px;
  padding: 2px 9px;
  font-size: 0.85rem;
  z-index: 2;
}
.small {
  margin: 0;
  font-size: 0.78rem;
  text-align: center;
}
.actions {
  display: flex;
  gap: 6px;
  width: 100%;
}
.actions button {
  flex: 1;
  padding: 7px 0;
  font-size: 0.85rem;
}
.empty {
  text-align: center;
  padding: 40px 0;
}
</style>
