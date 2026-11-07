<script setup>
import { computed, ref } from 'vue'
import GameCard from '../../components/GameCard.vue'
import CardPicker from '../../components/CardPicker.vue'
import ChronosIcon from '../../components/ChronosIcon.vue'
import { HAND_RULES, collectionList, freeCount, hand, handAdd, handCount, handLimit, handRemove, handSection, levelInfo, player, setStartFormation, upgradeGear } from '../../lib/player.js'
import { ALIGNMENT_PEACE, formationItem, formationPeace, formationUnit, isBenefit } from '../../lib/formations.js'
import classes from '../../data/classes.json'
import { go } from '../../lib/router.js'

const emit = defineEmits(['notice'])
const error = ref('')

const SECTIONS = [
  { id: 'formations', title: 'Formations', about: 'How your army lines up. You start with one, and can switch to a reserve during battle.', empty: 'formation' },
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

// Formations: the starting one, then up to 3 reserves (empty slots padded).
const startEntry = computed(() => hand.value.formations.find(e => e.uid === player.profile.startFormation) || null)
const reserveSlots = computed(() => {
  const reserves = hand.value.formations.filter(e => e.uid !== player.profile.startFormation)
  const total = handLimit('formations') - 1
  return [...reserves, ...Array.from({ length: Math.max(0, total - reserves.length) }, () => null)]
})
// Formation effects at their current rank and level.
const fx = uid => {
  const info = levelInfo(uid)
  const lines = Object.entries(info?.stats || {})
    .filter(([, v]) => v)
    .map(([k, v]) => ({ key: k, text: `${v > 0 ? '+' : ''}${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}${formationUnit(k)} ${k}`, good: isBenefit(k, v) }))
  const side = info ? formationItem(info.card.number).side : null
  const peace = formationPeace(side, player.profile.side)
  return { info, lines, side, peace }
}
const SIDES = Object.fromEntries(classes.sides.map(s => [s.id, { name: s.name, color: s.colors[0] }]))
function levelUp(uid) {
  error.value = ''
  try {
    const lv = upgradeGear(uid)
    emit('notice', `${levelInfo(uid).card.name} is now level ${lv}.`)
  } catch (e) {
    error.value = e.message
  }
}

function makeStart(e) {
  setStartFormation(e.uid)
  emit('notice', `${e.card.name} is now your starting formation.`)
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

      <p v-if="sec.id === 'formations'" class="muted small">
        Drastic formations are <strong style="color: #c23b3b">Chaos</strong>, gentle ones with few debuffs are
        <strong style="color: #2f6fd6">Order</strong>, and the ones in between are <strong style="color: #3fa66b">Balance</strong>.
        Your starting formation changes your Inner Peace: your side +{{ ALIGNMENT_PEACE.sameSide }}, Balance/other side {{ ALIGNMENT_PEACE.balanceMismatch }},
        opposing side {{ ALIGNMENT_PEACE.opposed }}.
        <template v-if="!player.profile.side"><a href="#play">Choose a class</a> to see how each one fits you.</template>
      </p>
      <div v-if="sec.id === 'formations'" class="formations">
        <div class="start-col">
          <p class="slot-tag start">Starting formation</p>
          <div class="slot">
            <template v-if="startEntry">
              <GameCard :card="startEntry.card" small class="starting" />
              <div class="fx-box">
                <p class="lvl">Lv {{ fx(startEntry.uid).info.level }}/{{ fx(startEntry.uid).info.maxLevel }}</p>
                <p class="align">
                  <span class="side" :style="{ background: SIDES[fx(startEntry.uid).side].color }">{{ SIDES[fx(startEntry.uid).side].name }}</span>
                  <span v-if="player.profile.side" :class="fx(startEntry.uid).peace.delta > 0 ? 'good' : fx(startEntry.uid).peace.delta < 0 ? 'bad' : 'even'">
                    {{ fx(startEntry.uid).peace.delta > 0 ? '+' : '' }}{{ fx(startEntry.uid).peace.delta }} Inner Peace
                  </span>
                </p>
                <span v-for="l in fx(startEntry.uid).lines" :key="l.key" :class="l.good ? 'good' : 'bad'">{{ l.text }}</span>
              </div>
              <button
                class="secondary up"
                :disabled="fx(startEntry.uid).info.upgradeCost === null || player.profile.chronos < fx(startEntry.uid).info.upgradeCost"
                @click="levelUp(startEntry.uid)"
              >
                <template v-if="fx(startEntry.uid).info.upgradeCost === null">Max level</template>
                <template v-else>Level up · {{ fx(startEntry.uid).info.upgradeCost.toLocaleString() }} <ChronosIcon /></template>
              </button>
              <button class="secondary remove" @click="handRemove(startEntry.uid)">Remove</button>
            </template>
            <button v-else class="empty" :disabled="!ownedOf('formations')" @click="picking = 'formations'">
              <span>+</span>
              {{ ownedOf('formations') ? 'Add formation' : 'No formation cards yet' }}
            </button>
          </div>
        </div>
        <div class="reserve-col">
          <p class="slot-tag">Reserves · switching to one in battle costs {{ HAND_RULES.formationSwitchAP }} AP</p>
          <div class="slots tight">
            <div v-for="(e, i) in reserveSlots" :key="i" class="slot">
              <template v-if="e">
                <GameCard :card="e.card" small />
                <div class="fx-box">
                  <p class="lvl">Lv {{ fx(e.uid).info.level }}/{{ fx(e.uid).info.maxLevel }}</p>
                  <p class="align">
                    <span class="side" :style="{ background: SIDES[fx(e.uid).side].color }">{{ SIDES[fx(e.uid).side].name }}</span>
                    <span v-if="player.profile.side" class="muted" :title="'Inner Peace if this were your starting formation'">
                      {{ fx(e.uid).peace.delta > 0 ? '+' : '' }}{{ fx(e.uid).peace.delta }} if starting
                    </span>
                  </p>
                  <span v-for="l in fx(e.uid).lines" :key="l.key" :class="l.good ? 'good' : 'bad'">{{ l.text }}</span>
                </div>
                <button
                  class="secondary up"
                  :disabled="fx(e.uid).info.upgradeCost === null || player.profile.chronos < fx(e.uid).info.upgradeCost"
                  @click="levelUp(e.uid)"
                >
                  <template v-if="fx(e.uid).info.upgradeCost === null">Max level</template>
                  <template v-else>Level up · {{ fx(e.uid).info.upgradeCost.toLocaleString() }} <ChronosIcon /></template>
                </button>
                <div class="pair">
                  <button class="secondary" title="Start battles in this formation" @click="makeStart(e)">Make starting</button>
                  <button class="secondary" aria-label="Remove" title="Remove" @click="handRemove(e.uid)">✕</button>
                </div>
              </template>
              <button v-else class="empty" :disabled="!ownedOf('formations') || !startEntry" @click="picking = 'formations'">
                <span>+</span>
                {{ !ownedOf('formations') ? 'No formation cards yet' : startEntry ? 'Add reserve' : 'Add a starting one first' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="slots">
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
.formations {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  margin-top: 14px;
}
.start-col {
  padding-right: 28px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}
@media (max-width: 760px) {
  .start-col {
    border-right: none;
    padding-right: 0;
  }
}
.slot-tag {
  margin: 0 0 10px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
}
.slot-tag.start {
  color: var(--gold);
  opacity: 1;
}
.slots.tight {
  margin-top: 0;
}
.starting {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
  border-radius: 14px;
}
.fx-box {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  min-height: 3.6em;
  align-content: flex-start;
}
.fx-box .lvl {
  width: 100%;
  margin: 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--gold);
}
.align {
  width: 100%;
  margin: 0 0 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
}
.align .side {
  color: #fff;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 999px;
}
.align .good {
  color: #8ff0da;
  background: none;
}
.align .bad {
  color: #ffb0b0;
  background: none;
}
.fx-box span {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 6px;
  white-space: nowrap;
}
.fx-box .good {
  background: rgba(63, 209, 176, 0.14);
  color: #8ff0da;
}
.fx-box .bad {
  background: rgba(255, 90, 90, 0.14);
  color: #ffb0b0;
}
.up {
  width: 100%;
  padding: 6px 0;
  font-size: 0.78rem;
}
button.up:not(:disabled) {
  border-color: rgba(201, 162, 74, 0.6);
  color: var(--gold);
}
.pair {
  display: flex;
  gap: 6px;
  width: 100%;
}
.pair button {
  padding: 6px 8px;
  font-size: 0.78rem;
}
.pair button:first-child {
  flex: 1;
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
