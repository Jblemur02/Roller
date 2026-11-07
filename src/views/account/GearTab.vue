<script setup>
import { computed, ref } from 'vue'
import BaseDialog from '../../components/BaseDialog.vue'
import ChronosIcon from '../../components/ChronosIcon.vue'
import {
  GEAR_SLOTS,
  currentLoadout,
  equip,
  equipBest,
  freeCount,
  gearInfo,
  ownedGear,
  player,
  scoreDelta,
  upgradeGear,
} from '../../lib/player.js'
import { STAT_DEFS } from '../../lib/gear.js'
import { go } from '../../lib/router.js'
import classes from '../../data/classes.json'

const emit = defineEmits(['notice'])
const error = ref('')

const SIDES = Object.fromEntries(classes.sides.map(s => [s.id, { name: s.name, color: s.colors[0] }]))
const sideName = side => (side ? SIDES[side].name : 'Neutral')
const sideColor = side => (side ? SIDES[side].color : '#6b6b78')
const mySide = computed(() => player.profile.side)

const DEF = Object.fromEntries(STAT_DEFS.map(s => [s.key, s]))
function fmt(key, v, signed = true) {
  const unit = DEF[key]?.unit || ''
  const sign = signed && v > 0 ? '+' : ''
  return `${sign}${Math.round(v).toLocaleString()}${unit}`
}
const statLines = stats =>
  Object.entries(stats)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ key: k, text: `${fmt(k, v)} ${k}`, neg: v < 0 }))

const L = currentLoadout
const equipped = computed(() => Object.fromEntries(GEAR_SLOTS.map(s => [s.id, player.profile.gear[s.id] ? gearInfo(player.profile.gear[s.id]) : null])))
const optionsFor = slot => ownedGear.value.filter(g => g.card.gear.kind === slot.kind)

function run(fn, msg) {
  error.value = ''
  try {
    const r = fn()
    if (msg) emit('notice', typeof msg === 'function' ? msg(r) : msg)
  } catch (e) {
    error.value = e.message
  }
}
const doUpgrade = g => run(() => upgradeGear(g.uid), lv => `${g.card.name} is now level ${lv}.`)
const doRemove = slot => run(() => equip(slot.id, null))
function doEquipBest() {
  const before = L.value.score
  run(equipBest)
  emit('notice', L.value.score > before ? `Equipped your best gear. Gear Score ${before} → ${L.value.score}.` : 'You already have your best gear on.')
}

// Peace meter: 50 to 130, with 100 marked.
const peacePct = computed(() => ((L.value.peace.value - 50) / 80) * 100)
const peaceMood = computed(() => (L.value.peace.value > 100 ? 'up' : L.value.peace.value < 100 ? 'down' : 'even'))

const groups = ['Offense', 'Defense', 'Resources'].map(g => ({ name: g, stats: STAT_DEFS.filter(s => s.group === g) }))
const lethalMult = computed(() => (1 + L.value.final['Lethal'] / 100).toFixed(1))

// ---- picker ----
const picking = ref(null)
const candidates = computed(() => {
  if (!picking.value) return []
  const slot = picking.value
  const current = player.profile.gear[slot.id]
  return optionsFor(slot)
    .filter(g => g.uid === current || freeCount(g.uid) > 0)
    .map(g => ({ ...g, current: g.uid === current, delta: g.uid === current ? 0 : scoreDelta(slot.id, g.uid) }))
    .sort((a, b) => b.current - a.current || b.delta - a.delta)
})
const bestDelta = computed(() => Math.max(0, ...candidates.value.filter(c => !c.current).map(c => c.delta)))
function pick(g) {
  const slot = picking.value
  run(() => equip(slot.id, g.uid), `Equipped ${g.card.name} (${slot.label}).`)
  picking.value = null
}

// ---- armory ----
const armory = computed(() => {
  const where = {}
  for (const s of GEAR_SLOTS) {
    const uid = player.profile.gear[s.id]
    if (uid) (where[uid] ||= []).push(s.label)
  }
  return [...ownedGear.value]
    .map(g => ({ ...g, where: where[g.uid] || [] }))
    .sort((a, b) => b.where.length - a.where.length || a.card.gear.kind.localeCompare(b.card.gear.kind) || b.level - a.level)
})
</script>

<template>
  <div class="gear">
    <div class="head">
      <div>
        <h2>Gear</h2>
        <p class="muted">Gear adds to your stats, and what you wear sets your Inner Peace. Level gear up with Chronos.</p>
      </div>
      <button class="primary" :disabled="!ownedGear.length" @click="doEquipBest">Equip best</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <!-- Score + Inner Peace -->
    <div class="summary">
      <div class="score">
        <span class="label">Gear Score</span>
        <strong>{{ L.score.toLocaleString() }}</strong>
        <span class="muted tiny">All your final stats combined. Higher is stronger.</span>
      </div>

      <div class="peace" :class="peaceMood">
        <div class="peace-top">
          <span class="label">Inner Peace</span>
          <strong>{{ L.peace.value }}</strong>
          <span class="peace-note">
            <template v-if="peaceMood === 'up'">You fight at {{ L.peace.value }}% of your stats.</template>
            <template v-else-if="peaceMood === 'down'">You fight at only {{ L.peace.value }}% of your stats.</template>
            <template v-else>You fight at 100% of your stats.</template>
          </span>
        </div>
        <div class="meter" aria-hidden="true">
          <span class="fill" :style="{ width: peacePct + '%' }"></span>
          <span class="mark" style="left: 62.5%"></span>
        </div>
        <p v-if="!mySide" class="muted tiny">
          Gear from your own side raises Inner Peace and gear from the opposing side lowers it.
          <a href="#play">Choose a class</a> to start building it.
        </p>
        <p v-else class="muted tiny">
          You're <strong :style="{ color: sideColor(mySide) }">{{ sideName(mySide) }}</strong>.
          Your side's gear +4 each, Balance/other side −2, opposing side −10, neutral 0.
        </p>
        <div v-if="mySide && L.peace.breakdown.length" class="chips">
          <span v-for="(b, i) in L.peace.breakdown" :key="i" class="chip" :class="{ pos: b.delta > 0, neg: b.delta < 0 }">
            {{ b.name }} {{ b.delta > 0 ? '+' : '' }}{{ b.delta }}
          </span>
          <span v-if="L.peace.fromItems" class="chip pos">Item bonuses +{{ L.peace.fromItems }}</span>
        </div>
      </div>
    </div>

    <div class="layout">
      <!-- Slots -->
      <div class="slots">
        <div v-for="slot in GEAR_SLOTS" :key="slot.id" class="slot" :class="{ filled: equipped[slot.id] }">
          <div class="slot-top">
            <span class="slot-label">{{ slot.label }}</span>
            <span v-if="equipped[slot.id]" class="side" :style="{ background: sideColor(equipped[slot.id].side) }">
              {{ sideName(equipped[slot.id].side) }}
            </span>
          </div>

          <template v-if="equipped[slot.id]">
            <div class="item">
              <img :src="equipped[slot.id].card.image" alt="" />
              <div>
                <p class="name">{{ equipped[slot.id].card.name }}</p>
                <p class="tier" :style="{ color: equipped[slot.id].card.tier.color, fontFamily: equipped[slot.id].card.tier.font }">
                  {{ equipped[slot.id].card.tier.name }} · Lv {{ equipped[slot.id].level }}/{{ equipped[slot.id].maxLevel }}
                </p>
              </div>
            </div>
            <div class="stat-chips">
              <span v-for="l in statLines(equipped[slot.id].stats)" :key="l.key" :class="{ neg: l.neg }">{{ l.text }}</span>
            </div>
            <div class="row">
              <button
                class="secondary up"
                :disabled="equipped[slot.id].upgradeCost === null || player.profile.chronos < equipped[slot.id].upgradeCost"
                :title="equipped[slot.id].upgradeCost === null ? 'Max level' : `Level ${equipped[slot.id].level + 1}`"
                @click="doUpgrade(equipped[slot.id])"
              >
                <template v-if="equipped[slot.id].upgradeCost === null">Max level</template>
                <template v-else>Level up · {{ equipped[slot.id].upgradeCost.toLocaleString() }} <ChronosIcon /></template>
              </button>
              <button class="secondary" @click="picking = slot">Change</button>
              <button class="secondary" aria-label="Remove" title="Remove" @click="doRemove(slot)">✕</button>
            </div>
          </template>

          <template v-else>
            <button class="add" :disabled="!optionsFor(slot).length" @click="picking = slot">
              <span>+</span>
              {{ optionsFor(slot).length ? `Equip (${optionsFor(slot).length} owned)` : 'None owned yet' }}
            </button>
          </template>
        </div>
      </div>

      <!-- Stat sheet -->
      <aside class="sheet">
        <h3>Your stats</h3>
        <p class="muted tiny">(base + gear) × {{ L.peace.value }}% Inner Peace</p>
        <div v-for="g in groups" :key="g.name" class="group">
          <h4>{{ g.name }}</h4>
          <dl>
            <template v-for="s in g.stats" :key="s.key">
              <dt :title="s.about">{{ s.key }}</dt>
              <dd :title="`Base ${fmt(s.key, L.base[s.key], false)} + gear ${fmt(s.key, L.gear[s.key] || 0, false)}${s.noPeace ? '' : ` × ${L.peace.value}%`}${s.cap !== undefined ? ` (max ${s.cap}${s.unit})` : ''}`">
                {{ fmt(s.key, L.final[s.key], false) }}
                <small v-if="L.gear[s.key]" :class="{ neg: L.gear[s.key] < 0 }">{{ fmt(s.key, L.gear[s.key]) }}</small>
              </dd>
            </template>
          </dl>
        </div>
        <p class="muted tiny">
          Lethal hits land {{ lethalMult }}× damage · {{ L.final['Lethal chance'] }}% of attacks are lethal.
          Hover a stat for its breakdown.
        </p>
      </aside>
    </div>

    <!-- Armory -->
    <h3 class="armory-title">Armory</h3>
    <p class="muted tiny">All the gear you own. Levels belong to you, not the card: sell a copy and your level stays.</p>
    <p v-if="!armory.length" class="muted">
      No gear yet. Helmets, armor, boots, weapons, jewels and charms come from packs.
      <button class="linkish" @click="go('shop')">Open a pack</button>
    </p>
    <div class="armory">
      <div v-for="g in armory" :key="g.uid" class="arm-row">
        <img :src="g.card.image" alt="" />
        <div class="arm-main">
          <p class="name">
            {{ g.card.name }} <span class="muted tiny">×{{ g.quantity }}</span>
          </p>
          <p class="tier tiny" :style="{ color: g.card.tier.color, fontFamily: g.card.tier.font }">
            {{ g.card.tier.name }} · Lv {{ g.level }}/{{ g.maxLevel }}
            <span class="side mini" :style="{ background: sideColor(g.side) }">{{ sideName(g.side) }}</span>
          </p>
        </div>
        <div class="stat-chips">
          <span v-for="l in statLines(g.stats)" :key="l.key" :class="{ neg: l.neg }">{{ l.text }}</span>
        </div>
        <span class="where tiny" :class="{ on: g.where.length }">{{ g.where.length ? 'Equipped: ' + g.where.join(', ') : 'Not equipped' }}</span>
        <button
          class="secondary up"
          :disabled="g.upgradeCost === null || player.profile.chronos < g.upgradeCost"
          @click="doUpgrade(g)"
        >
          <template v-if="g.upgradeCost === null">Max level</template>
          <template v-else>Level up · {{ g.upgradeCost.toLocaleString() }} <ChronosIcon /></template>
        </button>
      </div>
    </div>

    <!-- Picker -->
    <BaseDialog v-if="picking" :title="`Equip: ${picking.label}`" eyebrow="Gear" @close="picking = null">
      <p class="muted tiny">Gear Score change includes Inner Peace, so off-side gear can score worse than it looks.</p>
      <p v-if="!candidates.length" class="muted">You don't have a free piece for this slot.</p>
      <div class="picks">
        <div v-for="c in candidates" :key="c.uid" class="pick" :class="{ current: c.current }">
          <img :src="c.card.image" alt="" />
          <div class="pick-main">
            <p class="name">
              {{ c.card.name }}
              <span v-if="!c.current && c.delta > 0 && c.delta === bestDelta" class="best">Best</span>
            </p>
            <p class="tier tiny" :style="{ color: c.card.tier.color, fontFamily: c.card.tier.font }">
              {{ c.card.tier.name }} · Lv {{ c.level }}
              <span class="side mini" :style="{ background: sideColor(c.side) }">{{ sideName(c.side) }}</span>
            </p>
            <div class="stat-chips">
              <span v-for="l in statLines(c.stats)" :key="l.key" :class="{ neg: l.neg }">{{ l.text }}</span>
            </div>
          </div>
          <div class="pick-side">
            <template v-if="c.current"><span class="muted tiny">Equipped</span></template>
            <template v-else>
              <span class="delta" :class="{ pos: c.delta > 0, neg: c.delta < 0 }">{{ c.delta > 0 ? '+' : '' }}{{ c.delta }}</span>
              <button class="primary" @click="pick(c)">Equip</button>
            </template>
          </div>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
h2 {
  margin: 0;
}
.head p {
  margin: 4px 0 0;
}
.tiny {
  font-size: 0.8rem;
}
.label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.7;
}

/* summary */
.summary {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 14px;
  margin: 18px 0;
}
@media (max-width: 760px) {
  .summary {
    grid-template-columns: 1fr;
  }
}
.score,
.peace {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.score strong {
  font-size: 2.2rem;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.peace-top {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.peace-top strong {
  font-size: 1.8rem;
  font-variant-numeric: tabular-nums;
}
.peace.up .peace-top strong,
.peace.up .peace-note {
  color: #6fe3c9;
}
.peace.down .peace-top strong,
.peace.down .peace-note {
  color: #ff8a8a;
}
.peace p {
  margin: 0;
}
.meter {
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.meter .fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, #c94a4a, #c9a24a 55%, #3fd1b0);
  transition: width 0.4s;
}
.meter .mark {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #fff;
  opacity: 0.7;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
}
.chip.pos {
  background: rgba(63, 209, 176, 0.15);
  color: #8ff0da;
}
.chip.neg {
  background: rgba(255, 90, 90, 0.15);
  color: #ffb0b0;
}

/* layout */
.layout {
  display: grid;
  grid-template-columns: 1fr 270px;
  gap: 20px;
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  align-content: start;
}
.slot {
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 150px;
  background: rgba(255, 255, 255, 0.02);
}
.slot.filled {
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
}
.slot-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.slot-label {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.7rem;
  color: var(--gold);
}
.side {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fff;
}
.side.mini {
  margin-left: 6px;
  font-family: 'Montserrat', sans-serif;
  vertical-align: 1px;
}
.item {
  display: flex;
  gap: 10px;
  align-items: center;
}
.item img,
.arm-row img,
.pick img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  flex: 0 0 auto;
  background: rgba(0, 0, 0, 0.3);
}
.name {
  margin: 0;
  font-weight: 700;
}
.tier {
  margin: 2px 0 0;
  font-size: 0.85rem;
}
.stat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.stat-chips span {
  font-size: 0.74rem;
  background: rgba(255, 255, 255, 0.07);
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
}
.stat-chips span.neg {
  color: #ffa0a0;
}
.row {
  display: flex;
  gap: 6px;
  margin-top: auto;
}
.row button {
  padding: 6px 10px;
  font-size: 0.78rem;
}
.row .up {
  flex: 1;
}
button.up:not(:disabled) {
  border-color: rgba(201, 162, 74, 0.6);
  color: var(--gold);
}
.add {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: none;
  color: #ddd;
  font-size: 0.85rem;
}
.add span {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: grid;
  place-items: center;
  font-size: 1.4rem;
}
.add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* sheet */
.sheet {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 14px 16px;
  align-self: start;
}
.sheet h3 {
  margin: 0;
}
.sheet > p {
  margin: 2px 0 10px;
}
h4 {
  margin: 12px 0 6px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gold);
}
dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 10px;
  margin: 0;
  font-size: 0.88rem;
}
dt {
  opacity: 0.75;
  cursor: help;
}
dd {
  margin: 0;
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: help;
}
dd small {
  font-weight: 400;
  color: #8ff0da;
  margin-left: 4px;
}
dd small.neg {
  color: #ffa0a0;
}

/* armory */
.armory-title {
  margin: 30px 0 2px;
}
.armory {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.arm-row {
  display: grid;
  grid-template-columns: 48px minmax(150px, 1.2fr) 2fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}
@media (max-width: 760px) {
  .arm-row {
    grid-template-columns: 48px 1fr;
  }
  .arm-row > .stat-chips,
  .arm-row > .where,
  .arm-row > button {
    grid-column: 2;
  }
}
.arm-main p {
  margin: 0;
}
.where {
  opacity: 0.5;
  white-space: nowrap;
}
.where.on {
  opacity: 1;
  color: var(--gold);
}
.arm-row button {
  padding: 6px 12px;
  font-size: 0.8rem;
  white-space: nowrap;
}
.linkish {
  background: none;
  border: none;
  color: var(--gold);
  text-decoration: underline;
  padding: 0;
}

/* picker */
.picks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}
.pick {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}
.pick.current {
  outline: 1px solid rgba(201, 162, 74, 0.5);
}
.pick-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pick-main p {
  margin: 0;
}
.pick-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.pick-side button {
  padding: 6px 14px;
  font-size: 0.85rem;
}
.delta {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.delta.pos {
  color: #6fe3c9;
}
.delta.neg {
  color: #ff8a8a;
}
.best {
  font-size: 0.68rem;
  background: #3fa66b;
  color: #fff;
  padding: 1px 7px;
  border-radius: 999px;
  margin-left: 6px;
  vertical-align: 2px;
}
</style>
