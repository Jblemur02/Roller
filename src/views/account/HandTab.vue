<script setup>
import { computed, ref } from 'vue'
import GameCard from '../../components/GameCard.vue'
import CardPicker from '../../components/CardPicker.vue'
import { HAND_RULES, collectionList, freeCount, hand, handAdd, handCount, handLimit, handRemove, handSection, player } from '../../lib/player.js'
import { go } from '../../lib/router.js'

const emit = defineEmits(['notice'])
const error = ref('')

const SECTIONS = [
  { id: 'formations', title: 'Formation', about: 'How your army lines up. Buffs or debuffs your whole team.', empty: 'formation' },
  { id: 'actions', title: 'Actions', about: 'Spells and moves you play in battle with your action points.', empty: 'action' },
  { id: 'minions', title: 'Minions', about: 'The fighters at your side. Your class decides how many you bring.', empty: 'minion' },
]

const className = computed(() => player.profile.className)

// Each card in a section as one slot per copy, padded with empty slots up to the limit.
function slotsFor(sec) {
  const filled = []
  for (const e of hand.value[sec]) for (let i = 0; i < e.count; i++) filled.push(e)
  const empties = Math.max(0, handLimit(sec) - filled.length)
  return [...filled.map(e => ({ entry: e })), ...Array.from({ length: empties }, () => ({ entry: null }))]
}

const picking = ref(null)
const options = computed(() => {
  if (!picking.value) return []
  const sec = picking.value
  return collectionList.value.filter(
    c => handSection(c) === sec && freeCount(c.uid) > 0 && (HAND_RULES.duplicates[sec] || !player.profile.deck[c.uid]),
  )
})
const ownedOf = sec => collectionList.value.filter(c => handSection(c) === sec).length

function add(card) {
  error.value = ''
  try {
    handAdd(card.uid)
    if (handCount(picking.value) >= handLimit(picking.value)) picking.value = null
  } catch (e) {
    error.value = e.message
    picking.value = null
  }
}

function statText(stats) {
  // Speed and Range aren't used in battle any more, so they're not shown.
  return Object.entries(stats || {})
    .filter(([k, v]) => v && !['Speed', 'Range'].includes(k))
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`)
    .join(' · ')
}
</script>

<template>
  <div>
    <div class="head">
      <h2>Hand</h2>
      <p class="muted">The cards you take into battle. Cards in your Hand can't be sold or auctioned.</p>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <section v-for="sec in SECTIONS" :key="sec.id" class="section">
      <div class="sec-head">
        <div>
          <h3>
            {{ sec.title }}
            <span class="count" :class="{ full: handLimit(sec.id) && handCount(sec.id) >= handLimit(sec.id) }">
              {{ handCount(sec.id) }} / {{ handLimit(sec.id) }}
            </span>
          </h3>
          <p class="muted small">{{ sec.about }}</p>
        </div>
        <button
          class="primary"
          :disabled="!handLimit(sec.id) || handCount(sec.id) >= handLimit(sec.id)"
          @click="picking = sec.id"
        >
          Add {{ sec.empty }}
        </button>
      </div>

      <p v-if="sec.id === 'minions' && !className" class="muted small">
        <a href="#play">Choose a class</a> to bring minions. Each class brings a different number (2 to 5).
      </p>
      <p v-else-if="sec.id === 'minions'" class="muted small">
        A {{ className }} brings {{ handLimit('minions') }} minions. You can bring more than one of the same minion.
      </p>

      <div class="slots">
        <div v-for="(slot, i) in slotsFor(sec.id)" :key="i" class="slot">
          <template v-if="slot.entry">
            <GameCard :card="slot.entry.card" small />
            <p class="stats">{{ statText(slot.entry.card.stats) }}</p>
            <button class="secondary remove" @click="handRemove(slot.entry.uid)">Remove</button>
          </template>
          <button v-else class="empty" :disabled="!ownedOf(sec.id)" @click="picking = sec.id">
            <span>+</span>
            {{ ownedOf(sec.id) ? `Add ${sec.empty}` : `No ${sec.empty} cards yet` }}
          </button>
        </div>
      </div>
      <p v-if="!ownedOf(sec.id)" class="muted small">
        You don't own any {{ sec.empty }} cards yet. <button class="linkish" @click="go('shop')">Open a pack</button>
      </p>
    </section>

    <p class="muted small note">Augments are passive buffs, so they don't go in your Hand. Gear is equipped in the Gear tab.</p>

    <CardPicker
      v-if="picking"
      :title="`Add to Hand: ${SECTIONS.find(s => s.id === picking).title}`"
      eyebrow="Hand"
      :cards="options"
      :count-of="c => freeCount(c.uid)"
      :empty="`No free ${SECTIONS.find(s => s.id === picking).empty} cards left to add.`"
      label="Add"
      @close="picking = null"
      @pick="add"
    >
      <p class="muted">{{ handCount(picking) }} / {{ handLimit(picking) }} in your Hand.</p>
    </CardPicker>
  </div>
</template>

<style scoped>
.head h2 {
  margin: 0;
}
.head p {
  margin: 4px 0 0;
}
.small {
  font-size: 0.82rem;
}
.section {
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}
.sec-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sec-head p {
  margin: 4px 0 0;
}
.count {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-variant-numeric: tabular-nums;
}
.count.full {
  background: rgba(63, 209, 176, 0.18);
  color: #8ff0da;
}
.slots {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 14px;
}
.slot {
  width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.stats {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.25;
  text-align: center;
  opacity: 0.75;
  min-height: 2.5em;
}
.remove {
  width: 100%;
  padding: 6px 0;
  font-size: 0.82rem;
}
.empty {
  width: 160px;
  height: 232px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.02);
  color: #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.85rem;
}
.empty span {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: grid;
  place-items: center;
  font-size: 1.4rem;
}
.empty:not(:disabled):hover {
  border-color: var(--gold);
  color: var(--gold);
}
.empty:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.note {
  margin-top: 26px;
}
.linkish {
  background: none;
  border: none;
  color: var(--gold);
  text-decoration: underline;
  padding: 0;
  font-size: inherit;
}
</style>
