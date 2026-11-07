<script setup>
import { computed, ref } from 'vue'
import CardPicker from '../../components/CardPicker.vue'
import { GEAR_SLOTS, collectionList, equip, freeCount, gearStats, player } from '../../lib/player.js'
import { decodeCard } from '../../lib/cards.js'
import baseStats from '../../data/stats.json'

const emit = defineEmits(['notice'])
const picking = ref(null)
const error = ref('')

const equipped = computed(() =>
  Object.fromEntries(GEAR_SLOTS.map(s => [s.id, player.profile.gear[s.id] ? decodeCard(player.profile.gear[s.id]) : null])),
)

const options = computed(() => {
  if (!picking.value) return []
  return collectionList.value.filter(c => picking.value.accepts(c) && freeCount(c.uid) > 0)
})

const fitsAnything = slot => collectionList.value.some(c => slot.accepts(c))

function pick(card) {
  try {
    equip(picking.value.id, card.uid)
    emit('notice', `Equipped ${card.name} (${picking.value.label}).`)
    picking.value = null
  } catch (e) {
    error.value = e.message
  }
}

function label(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
const flatBase = computed(() => {
  const out = []
  for (const [k, v] of Object.entries(baseStats.base)) {
    if (v && typeof v === 'object') for (const [k2, v2] of Object.entries(v)) out.push([label(k2), v2])
    else out.push([label(k), v])
  }
  return out
})
</script>

<template>
  <div>
    <h2>Gear</h2>
    <p class="muted">Equip cards from your collection. Equipped copies can't be sold or auctioned.</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div class="layout">
      <div class="slots">
        <div v-for="slot in GEAR_SLOTS" :key="slot.id" class="slot" :class="{ filled: equipped[slot.id] }">
          <p class="slot-label">{{ slot.label }}</p>
          <template v-if="equipped[slot.id]">
            <p class="item-name" :style="{ fontFamily: equipped[slot.id].tier.font }">{{ equipped[slot.id].name }}</p>
            <p class="muted tiny">{{ equipped[slot.id].tier.name }}</p>
            <div class="row">
              <button class="secondary" @click="picking = slot">Swap</button>
              <button class="secondary" @click="equip(slot.id, null)">Remove</button>
            </div>
          </template>
          <template v-else>
            <button class="add" :disabled="!fitsAnything(slot)" :aria-label="`Equip ${slot.label}`" @click="picking = slot">+</button>
            <p class="muted tiny">{{ fitsAnything(slot) ? 'Empty' : 'No cards for this slot yet' }}</p>
          </template>
        </div>
      </div>

      <aside class="stats">
        <h3>Gear bonuses</h3>
        <p v-if="!Object.keys(gearStats).length" class="muted tiny">Nothing equipped yet.</p>
        <dl>
          <template v-for="(v, k) in gearStats" :key="k">
            <dt>{{ k }}</dt>
            <dd :class="{ neg: v < 0 }">{{ v > 0 ? '+' : '' }}{{ v.toLocaleString() }}</dd>
          </template>
        </dl>
        <h3>Base stats</h3>
        <dl>
          <template v-for="[k, v] in flatBase" :key="k">
            <dt>{{ k }}</dt>
            <dd>{{ v }}</dd>
          </template>
        </dl>
      </aside>
    </div>

    <CardPicker
      v-if="picking"
      :title="`Equip: ${picking.label}`"
      eyebrow="Gear"
      :cards="options"
      :count-of="c => freeCount(c.uid)"
      empty="You don't have a free card for this slot."
      label="Equip"
      @close="picking = null"
      @pick="pick"
    />
  </div>
</template>

<style scoped>
h2 {
  margin: 0;
}
.layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  margin-top: 18px;
}
@media (max-width: 820px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
}
.slot {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  padding: 14px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
}
.slot.filled {
  border-style: solid;
  border-color: rgba(201, 162, 74, 0.5);
  background: rgba(201, 162, 74, 0.07);
}
.slot p {
  margin: 0;
}
.slot-label {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  color: var(--gold);
}
.item-name {
  font-weight: 700;
  font-size: 1.05rem;
}
.tiny {
  font-size: 0.78rem;
}
.add {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 1.5rem;
}
.add:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.row {
  display: flex;
  gap: 6px;
}
.row button {
  padding: 5px 10px;
  font-size: 0.8rem;
}
.stats {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 16px;
}
h3 {
  margin: 0 0 8px;
  font-size: 0.95rem;
}
h3 + p {
  margin: 0 0 12px;
}
dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  margin: 0 0 18px;
  font-size: 0.88rem;
}
dt {
  opacity: 0.75;
}
dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
dd.neg {
  color: #ff8a8a;
}
</style>
