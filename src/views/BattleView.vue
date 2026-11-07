<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import ShardIcon from '../components/ShardIcon.vue'
import ChronosIcon from '../components/ChronosIcon.vue'
import {
  BASIC_ATTACK, ENEMIES, REST, RULES, actionData, cannotUse, createBattle, currentFormation, effective, endTurn,
  exhaustionLoss, setTarget, switchFormation, useAction, useBasicAttack,
} from '../lib/battle.js'
import { battleSetup, grantBattleReward, hand, myBuild, player } from '../lib/player.js'
import { go } from '../lib/router.js'
import classes from '../data/classes.json'

const SIDES = Object.fromEntries(classes.sides.map(s => [s.id, { name: s.name, color: s.colors[0] }]))

// ---------- before the fight ----------
const opponents = Object.entries(ENEMIES).map(([id, e]) => ({ id, ...e }))
const chosen = ref(opponents[0].id)
const preview = computed(() => {
  if (!myBuild.value) return null
  const setup = battleSetup(chosen.value)
  const s = setup.hero.sheetFor(setup.startFormation)
  return { setup, sheet: s }
})

// ---------- the fight ----------
const state = ref(null)
const busy = ref(false)
const error = ref('')
const rewarded = ref(false)
const popups = reactive({}) // unitId -> [{ id, text, kind }]
let seenEvents = 0
let popupId = 0

function start() {
  error.value = ''
  rewarded.value = false
  seenEvents = 0
  state.value = reactive(createBattle(battleSetup(chosen.value)))
}

function act(fn) {
  error.value = ''
  try {
    fn()
  } catch (e) {
    error.value = e.message
  }
}

const S = computed(() => state.value)
const enemies = computed(() => S.value?.units.filter(u => u.side === 'enemy') || [])
const allies = computed(() => S.value?.units.filter(u => u.side === 'player') || [])
const actionCards = computed(() => S.value?.setup.actions || [])
const formation = computed(() => (S.value ? currentFormation(S.value) : null))
const reserves = computed(() => S.value?.setup.formations.filter(f => f.uid !== S.value.formation) || [])

function attackNow() {
  act(() => useBasicAttack(S.value))
}
function useCard(card) {
  act(() => useAction(S.value, card))
}
function doSwitch(f) {
  act(() => switchFormation(S.value, f.uid))
}
async function finishTurn(rest) {
  busy.value = true
  act(() => endTurn(S.value, rest))
  await new Promise(r => setTimeout(r, 450))
  busy.value = false
}

// Floating numbers for hits, dodges, lethal hits and heals.
watch(
  () => S.value?.events.length,
  () => {
    if (!S.value) return
    const fresh = S.value.events.slice(seenEvents)
    seenEvents = S.value.events.length
    fresh.forEach((ev, i) => {
      const text =
        ev.type === 'hit' ? `-${ev.amount}` :
        ev.type === 'lethal' ? `LETHAL -${ev.amount}` :
        ev.type === 'burn' ? `🔥 -${ev.amount}` :
        ev.type === 'heal' ? `+${ev.amount}` :
        ev.type === 'dodge' ? 'Dodged!' : 'Miss'
      const p = { id: ++popupId, text, kind: ev.type }
      setTimeout(() => {
        ;(popups[ev.unitId] ||= []).push(p)
        setTimeout(() => {
          popups[ev.unitId] = (popups[ev.unitId] || []).filter(x => x.id !== p.id)
        }, 1300)
      }, i * 140)
    })
  },
)

// Grant the reward once on a win.
watch(
  () => S.value?.result,
  r => {
    if (r === 'win' && !rewarded.value) {
      grantBattleReward(S.value.enemyDef.reward)
      rewarded.value = true
    }
  },
)

// Keep the log scrolled to the newest line.
const logEl = ref(null)
watch(
  () => S.value?.log.length,
  async () => {
    await nextTick()
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  },
)

const statusLabel = s =>
  s.type === 'burn' ? `🔥 Burn ${s.value}` :
  s.type === 'blind' ? `Blind ${s.missChance}%` :
  s.type === 'fear' ? `Fear ${s.damagePct}%` :
  s.type === 'windward' ? `Windward +${s.evasion}%` : s.type
const costText = a =>
  [`${a.ap} AP`, ...Object.entries(a.cost || {}).map(([k, v]) => `${v} ${k}`)].join(' · ')
const pct = (a, b) => (b ? Math.max(0, Math.min(100, (a / b) * 100)) : 0)
const sideOf = f => (f?.side ? SIDES[f.side] : null)
const unitDamage = u => Math.round(effective(S.value, u).damage)
</script>

<template>
  <section class="battle-page">
    <!-- No class yet -->
    <div v-if="!myBuild" class="center-card">
      <h1>Battle</h1>
      <p class="muted">Choose a class first. It sets your hero's stats and how many minions you bring.</p>
      <button class="primary" @click="go('play')">Choose a class</button>
    </div>

    <!-- Before the fight -->
    <div v-else-if="!state" class="prep">
      <div class="hero-head">
        <p class="eyebrow">Battle</p>
        <h1>Choose your opponent</h1>
      </div>
      <div class="opponents">
        <button
          v-for="o in opponents"
          :key="o.id"
          class="opponent"
          :class="{ active: chosen === o.id }"
          @click="chosen = o.id"
        >
          <span class="o-name">{{ o.name }}</span>
          <span class="muted">{{ o.about }}</span>
          <span class="o-units">{{ o.units.map(u => u.name).join(', ') }}</span>
          <span class="o-reward">
            Win: +{{ o.reward.shards }} <ShardIcon /> · +{{ o.reward.chronos }} <ChronosIcon />
          </span>
        </button>
      </div>

      <div v-if="preview" class="team">
        <div class="team-col">
          <h3>Your hero</h3>
          <p>
            <strong>{{ player.profile.username }}</strong> · {{ player.profile.className }} ({{ myBuild.name }})
          </p>
          <p class="muted small">
            {{ preview.sheet.Health }} Health · {{ preview.sheet.Damage }} Damage · {{ preview.sheet['AP rate'] }} AP per round ·
            {{ preview.sheet.Armour }}% Armour · {{ preview.sheet.Evasion }}% Evasion · Inner Peace {{ preview.sheet['Inner peace'] }}
          </p>
        </div>
        <div class="team-col">
          <h3>Your Hand</h3>
          <p class="small">
            <strong>Formation:</strong> {{ preview.setup.formations.find(f => f.uid === preview.setup.startFormation)?.card.name || 'none' }}
            <template v-if="preview.setup.formations.length > 1"> (+{{ preview.setup.formations.length - 1 }} reserve)</template>
          </p>
          <p class="small"><strong>Actions:</strong> {{ preview.setup.actions.map(c => c.name).join(', ') || 'Basic Attack only' }}</p>
          <p class="small"><strong>Minions:</strong> {{ preview.setup.minions.map(c => c.name).join(', ') || 'none' }}</p>
          <button class="linkish" @click="go('hand')">Edit your Hand</button>
        </div>
      </div>
      <button class="primary big" @click="start">Fight!</button>
    </div>

    <!-- The fight -->
    <div v-else class="arena">
      <div class="topline">
        <span class="round">Round {{ S.round }}</span>
        <span class="vs">vs {{ S.enemyDef.name }}</span>
        <span v-if="formation" class="form">
          Formation: <strong>{{ formation.card.name }}</strong>
          <i v-if="sideOf(formation)" class="dot" :style="{ background: sideOf(formation).color }"></i>
        </span>
        <button class="secondary small-btn" @click="state = null">Leave battle</button>
      </div>

      <div class="field">
        <div class="row enemies">
          <button
            v-for="u in enemies"
            :key="u.id"
            class="unit"
            :class="{ dead: !u.alive, target: S.target === u.id && u.alive, boss: u.kind === 'hero' }"
            :disabled="!u.alive"
            :aria-label="`Target ${u.name}`"
            @click="setTarget(S, u.id)"
          >
            <span v-if="S.target === u.id && u.alive" class="tag">Target</span>
            <img v-if="u.image" :src="u.image" alt="" />
            <span class="u-name">{{ u.name }}</span>
            <span class="hp"><i :style="{ width: pct(u.hp, u.maxHp) + '%' }"></i></span>
            <span class="hp-text">{{ u.hp }} / {{ u.maxHp }}</span>
            <span class="u-stats">⚔ {{ unitDamage(u) }}</span>
            <span class="statuses"><em v-for="s in u.statuses" :key="s.type" :class="s.type">{{ statusLabel(s) }}</em></span>
            <span class="pops"><b v-for="p in popups[u.id] || []" :key="p.id" :class="p.kind">{{ p.text }}</b></span>
          </button>
        </div>

        <div class="row allies">
          <div v-for="u in allies" :key="u.id" class="unit" :class="{ dead: !u.alive, hero: u.kind === 'hero' }">
            <img v-if="u.image" :src="u.image" alt="" />
            <span v-else class="initial">{{ u.name.charAt(0) }}</span>
            <span class="u-name">{{ u.name }}<small v-if="u.tier"> · {{ u.tier }}</small></span>
            <span class="hp ally"><i :style="{ width: pct(u.hp, u.maxHp) + '%' }"></i></span>
            <span class="hp-text">{{ u.hp }} / {{ u.maxHp }}</span>
            <span class="u-stats">⚔ {{ unitDamage(u) }}</span>
            <span class="statuses"><em v-for="s in u.statuses" :key="s.type" :class="s.type">{{ statusLabel(s) }}</em></span>
            <span class="pops"><b v-for="p in popups[u.id] || []" :key="p.id" :class="p.kind">{{ p.text }}</b></span>
          </div>
        </div>
      </div>

      <div class="console">
        <div class="resources">
          <div class="ap" :aria-label="`${S.ap} of ${RULES.maxAP} action points`">
            <span class="label">AP</span>
            <i v-for="n in RULES.maxAP" :key="n" :class="{ on: n <= S.ap }"></i>
            <span class="muted tiny">+{{ S.apRate }} / round</span>
          </div>
          <div v-if="S.maxMana" class="bar mana"><span class="label">Mana {{ S.mana }}/{{ S.maxMana }}</span><i :style="{ width: pct(S.mana, S.maxMana) + '%' }"></i></div>
          <div v-if="S.maxEnergy" class="bar energy"><span class="label">Energy {{ S.energy }}/{{ S.maxEnergy }}</span><i :style="{ width: pct(S.energy, S.maxEnergy) + '%' }"></i></div>
          <div class="bar exhaust" :title="'Spells tire you out. Rest to recover.'">
            <span class="label">Exhaustion {{ S.exhaustion }}<template v-if="exhaustionLoss(S) > 0"> · −{{ Math.round(exhaustionLoss(S)) }}% damage</template></span>
            <i :style="{ width: S.exhaustion + '%' }"></i>
          </div>
        </div>

        <div class="actions-row">
          <button class="act" :disabled="busy || !!cannotUse(S, 'attack')" :title="cannotUse(S, 'attack') || BASIC_ATTACK.about" @click="attackNow">
            <span class="a-name">{{ BASIC_ATTACK.name }}</span>
            <span class="a-cost">{{ BASIC_ATTACK.ap }} AP</span>
            <span class="a-about">{{ BASIC_ATTACK.about }}</span>
          </button>
          <button
            v-for="(card, i) in actionCards"
            :key="card.uid + i"
            class="act card-act"
            :disabled="busy || !!cannotUse(S, 'action', card)"
            :title="cannotUse(S, 'action', card) || actionData(card)?.about"
            @click="useCard(card)"
          >
            <img :src="card.image" alt="" />
            <span class="a-name">{{ card.name }} <small>{{ card.tier.name }}</small></span>
            <span v-if="actionData(card)" class="a-cost">{{ costText(actionData(card)) }}</span>
            <span class="a-about">{{ actionData(card)?.about || 'No battle effect yet.' }}</span>
          </button>
          <button
            v-for="f in reserves"
            :key="f.uid"
            class="act form-act"
            :disabled="busy || !!cannotUse(S, 'switch')"
            :title="cannotUse(S, 'switch') || 'Switch your army to this formation'"
            @click="doSwitch(f)"
          >
            <span class="a-name">Switch to {{ f.card.name }}</span>
            <span class="a-cost">{{ RULES.formationSwitchAP }} AP</span>
            <span class="a-about"><i v-if="sideOf(f)" class="dot" :style="{ background: sideOf(f).color }"></i> {{ sideOf(f)?.name }} formation</span>
          </button>
        </div>

        <div class="turn-row">
          <p v-if="error" class="error">{{ error }}</p>
          <button class="secondary" :disabled="busy || S.phase !== 'player'" :title="REST.about" @click="finishTurn(true)">Rest</button>
          <button class="primary" :disabled="busy || S.phase !== 'player'" @click="finishTurn(false)">End turn</button>
        </div>
      </div>

      <div ref="logEl" class="log" aria-live="polite">
        <p v-for="(l, i) in S.log" :key="i" :class="l.kind">{{ l.text }}</p>
      </div>

      <!-- Result -->
      <div v-if="S.result" class="result-backdrop">
        <div class="result" :class="S.result">
          <h2>{{ S.result === 'win' ? 'Victory!' : 'Defeat' }}</h2>
          <p v-if="S.result === 'win'">
            You beat {{ S.enemyDef.name }} in {{ S.round }} round{{ S.round === 1 ? '' : 's' }}.
            <br />Reward: +{{ S.enemyDef.reward.shards }} <ShardIcon /> · +{{ S.enemyDef.reward.chronos }} <ChronosIcon />
          </p>
          <p v-else>Your hero fell in round {{ S.round }}. Try better gear, more minions, or a different formation.</p>
          <div class="actions">
            <button class="secondary" @click="state = null">Back</button>
            <button class="primary" @click="start">Fight again</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.battle-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 50px;
}
.center-card {
  text-align: center;
  padding: 60px 0;
}
.small {
  font-size: 0.85rem;
}
.tiny {
  font-size: 0.75rem;
}
.linkish {
  background: none;
  border: none;
  color: var(--gold);
  text-decoration: underline;
  padding: 0;
}

/* prep */
.hero-head {
  text-align: center;
}
.hero-head h1 {
  margin: 6px 0 22px;
  font-family: 'Cinzel', serif;
}
.opponents {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}
.opponent {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}
.opponent.active {
  border-color: var(--gold);
  box-shadow: 0 0 0 1px var(--gold);
}
.o-name {
  font-weight: 800;
  font-size: 1.15rem;
}
.o-units {
  font-size: 0.82rem;
  opacity: 0.8;
}
.o-reward {
  color: var(--gold);
  font-weight: 600;
  font-size: 0.85rem;
}
.team {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
  margin: 20px 0;
}
.team-col {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  padding: 14px 18px;
}
.team-col h3 {
  margin: 0 0 6px;
}
.team-col p {
  margin: 4px 0;
}
.big {
  display: block;
  margin: 0 auto;
  padding: 14px 48px !important;
  font-size: 1.15rem !important;
}

/* arena */
.topline {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.round {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--gold);
}
.vs {
  opacity: 0.75;
}
.form {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.small-btn {
  margin-left: auto;
  padding: 6px 12px !important;
  font-size: 0.82rem !important;
}
.field {
  background: radial-gradient(ellipse at 50% 0%, rgba(160, 40, 40, 0.18), transparent 60%),
    radial-gradient(ellipse at 50% 100%, rgba(40, 90, 160, 0.18), transparent 60%), rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.row {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}
.unit {
  position: relative;
  width: 150px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: transform 0.15s, opacity 0.3s, border-color 0.2s;
}
.enemies .unit {
  cursor: crosshair;
}
.enemies .unit:not(:disabled):hover {
  transform: translateY(-3px);
  border-color: rgba(255, 120, 120, 0.6);
}
.unit.target {
  border-color: #ff6a6a;
  box-shadow: 0 0 0 1px #ff6a6a, 0 0 22px rgba(255, 80, 80, 0.35);
}
.unit.hero,
.unit.boss {
  width: 170px;
}
.unit.hero {
  border-color: rgba(201, 162, 74, 0.6);
}
.unit.dead {
  opacity: 0.3;
  filter: grayscale(1);
}
.unit img,
.initial {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.06);
}
.initial {
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-family: 'Cinzel', serif;
}
.tag {
  position: absolute;
  top: -10px;
  background: #ff6a6a;
  color: #1a0505;
  font-weight: 800;
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.05em;
}
.u-name {
  font-weight: 700;
  font-size: 0.9rem;
  text-align: center;
}
.u-name small {
  font-weight: 400;
  opacity: 0.7;
}
.hp {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}
.hp i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #d93838, #ff7a5a);
  transition: width 0.4s;
}
.hp.ally i {
  background: linear-gradient(90deg, #2fae7a, #6fe3c9);
}
.hp-text {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}
.u-stats {
  font-size: 0.72rem;
  opacity: 0.7;
}
.statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
  min-height: 1em;
}
.statuses em {
  font-style: normal;
  font-size: 0.66rem;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
}
.statuses .burn {
  background: rgba(255, 120, 40, 0.25);
}
.statuses .blind,
.statuses .fear {
  background: rgba(160, 90, 255, 0.25);
}
.statuses .windward {
  background: rgba(80, 200, 255, 0.25);
}
.pops {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pops b {
  font-size: 1.2rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 6px #000;
  animation: pop 1.3s ease-out forwards;
}
.pops .hit,
.pops .burn {
  color: #ff8a8a;
}
.pops .lethal {
  color: #ffd25a;
  font-size: 1.45rem;
}
.pops .heal {
  color: #7dffc4;
}
.pops .dodge,
.pops .miss {
  color: #c9d6ff;
  font-size: 1rem;
}
@keyframes pop {
  0% { opacity: 0; transform: translateY(10px) scale(0.7); }
  15% { opacity: 1; transform: translateY(0) scale(1.15); }
  100% { opacity: 0; transform: translateY(-36px) scale(1); }
}

/* console */
.console {
  margin-top: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.resources {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}
.label {
  font-size: 0.75rem;
  font-weight: 700;
}
.ap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ap i {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(201, 162, 74, 0.6);
  background: transparent;
}
.ap i.on {
  background: radial-gradient(circle at 35% 35%, #fff2c4, var(--gold));
  box-shadow: 0 0 8px rgba(201, 162, 74, 0.7);
}
.bar {
  position: relative;
  flex: 1;
  min-width: 150px;
  height: 22px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.bar i {
  position: absolute;
  inset: 0 auto 0 0;
  transition: width 0.4s;
}
.bar .label {
  position: relative;
  z-index: 1;
  padding-left: 8px;
  line-height: 22px;
  text-shadow: 0 1px 2px #000;
}
.mana i {
  background: linear-gradient(90deg, #3a5bd9, #7aa2ff);
}
.energy i {
  background: linear-gradient(90deg, #c98a1a, #ffd25a);
}
.exhaust i {
  background: linear-gradient(90deg, #7a2a8a, #d45aff);
}
.actions-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.act {
  width: 170px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto auto;
  column-gap: 8px;
  text-align: left;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(201, 162, 74, 0.45);
  background: linear-gradient(160deg, rgba(201, 162, 74, 0.14), rgba(0, 0, 0, 0.2));
  color: #fff;
  transition: transform 0.15s;
}
.act > :not(img) {
  grid-column: 1 / -1;
}
.card-act > :not(img) {
  grid-column: 2;
}
.act img {
  grid-row: 1 / 4;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}
.act:not(:disabled):hover {
  transform: translateY(-3px);
  border-color: var(--gold);
}
.act:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.form-act {
  border-color: rgba(120, 160, 255, 0.45);
  background: linear-gradient(160deg, rgba(80, 120, 220, 0.16), rgba(0, 0, 0, 0.2));
}
.a-name {
  font-weight: 800;
  font-size: 0.88rem;
}
.a-name small {
  font-weight: 400;
  opacity: 0.7;
}
.a-cost {
  font-size: 0.75rem;
  color: var(--gold);
  font-weight: 700;
}
.a-about {
  font-size: 0.7rem;
  opacity: 0.75;
  line-height: 1.3;
}
.turn-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
}
.turn-row .error {
  margin: 0 auto 0 0;
}
.log {
  margin-top: 12px;
  height: 170px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.82rem;
}
.log p {
  margin: 2px 0;
}
.log .round {
  font-size: 0.8rem;
  margin-top: 8px;
  opacity: 0.8;
}
.log .enemy,
.log .bad {
  color: #ffb0b0;
}
.log .player {
  color: #dfe7ff;
}
.log .good {
  color: #8ff0da;
  font-weight: 700;
}
.log .lethal {
  color: #ffd25a;
  font-weight: 700;
}
.log .miss {
  opacity: 0.6;
}

/* phones: three units per row, two actions per row */
@media (max-width: 600px) {
  .battle-page {
    padding: 14px 10px 40px;
  }
  .field {
    padding: 12px 8px;
    gap: 16px;
  }
  .row {
    gap: 8px;
  }
  .unit,
  .unit.hero,
  .unit.boss {
    width: calc(33.33% - 6px);
    min-width: 100px;
    padding: 8px 6px;
    gap: 3px;
  }
  .unit img,
  .initial {
    width: 48px;
    height: 48px;
  }
  .u-name {
    font-size: 0.78rem;
  }
  .u-name small {
    display: none;
  }
  .act {
    width: calc(50% - 5px);
  }
  .bar {
    min-width: 120px;
  }
  .log {
    height: 130px;
  }
}

/* result */
.result-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(5, 4, 12, 0.75);
  display: grid;
  place-items: center;
  padding: 20px;
}
.result {
  text-align: center;
  padding: 30px 40px;
  border-radius: 20px;
  background: linear-gradient(180deg, #1c1830, #120f20);
  border: 1px solid rgba(255, 255, 255, 0.15);
  animation: rise 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.result.win {
  border-color: var(--gold);
  box-shadow: 0 0 60px rgba(201, 162, 74, 0.35);
}
.result h2 {
  margin: 0 0 10px;
  font-family: 'Cinzel', serif;
  font-size: 2.4rem;
}
.result.win h2 {
  color: var(--gold);
}
.result.lose h2 {
  color: #ff8a8a;
}
.result .actions {
  justify-content: center;
  margin-top: 16px;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
}
</style>
