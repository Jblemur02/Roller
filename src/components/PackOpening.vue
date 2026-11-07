<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import GameCard from './GameCard.vue'
import TierReveal from './TierReveal.vue'
import { themeFor } from '../lib/tierThemes.js'
import ShardIcon from './ShardIcon.vue'
import ChronosIcon from './ChronosIcon.vue'
import { rarityRank } from '../lib/cards.js'
import { canAfford } from '../lib/player.js'

const props = defineProps({
  item: { type: Object, required: true },
  cards: { type: Array, required: true },
})
const emit = defineEmits(['close', 'again'])

const revealed = ref([])
const allRevealed = computed(() => revealed.value.length === props.cards.length && revealed.value.every(Boolean))
const totalValue = computed(() => props.cards.reduce((sum, c) => sum + c.value, 0))
const best = computed(() =>
  [...props.cards].sort((a, b) => rarityRank(a.tier) - rarityRank(b.tier) || b.value - a.value)[0],
)

revealed.value = props.cards.map(() => false)

// Cards above Legendary get a full-screen themed reveal.
const themes = computed(() => props.cards.map(themeFor))
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const showing = ref(null) // { i, card, theme }
const busy = ref(false)
let finishShow = null

function playReveal(i) {
  return new Promise(resolve => {
    showing.value = { i, card: props.cards[i], theme: themes.value[i] }
    finishShow = resolve
  })
}
function onRevealDone() {
  revealed.value[showing.value.i] = true
  showing.value = null
  finishShow?.()
}
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function reveal(i) {
  if (revealed.value[i] || busy.value) return
  if (themes.value[i] && !reducedMotion) {
    busy.value = true
    await playReveal(i)
    busy.value = false
  } else {
    revealed.value[i] = true
  }
}

// Flip the ordinary cards first, then the big ones, saving the rarest for last.
async function revealAll() {
  if (busy.value) return
  busy.value = true
  const hidden = props.cards.map((_, i) => i).filter(i => !revealed.value[i])
  const plain = hidden.filter(i => !themes.value[i] || reducedMotion)
  const special = hidden.filter(i => themes.value[i] && !reducedMotion).sort((a, b) => themes.value[b].rank - themes.value[a].rank)
  for (const i of plain) {
    revealed.value[i] = true
    await sleep(110)
  }
  if (plain.length && special.length) await sleep(450)
  for (const i of special) await playReveal(i)
  busy.value = false
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <section class="panel" role="dialog" aria-modal="true" :aria-label="`Opened ${item.name}`">
      <header>
        <div>
          <p class="eyebrow">Opened</p>
          <h2>{{ item.name }}</h2>
        </div>
        <button class="close" aria-label="Close" @click="$emit('close')">×</button>
      </header>

      <p class="hint" v-if="!allRevealed">Click a card to flip it. Glowing cards are something special.</p>
      <p class="hint preview" v-if="item.preview">Test pack: these cards aren't added to your collection.</p>

      <div class="cards">
        <GameCard
          v-for="(card, i) in cards"
          :key="i"
          :card="card"
          :revealed="revealed[i]"
          :tease="themes[i]?.glow"
          :style="{ animationDelay: `${i * 70}ms` }"
          class="dealt"
          @reveal="reveal(i)"
        />
      </div>

      <footer>
        <template v-if="allRevealed">
          <p class="summary">
            Best pull: <strong :style="{ fontFamily: best.tier.font }">{{ best.tier.name }} {{ best.name }}</strong>
            · Total value <strong>{{ totalValue.toLocaleString() }}</strong> <ChronosIcon />
          </p>
          <div class="actions">
            <button class="secondary" @click="$emit('close')">Back to shop</button>
            <button class="primary" :disabled="!canAfford(item.price)" @click="$emit('again')">
              Open another · {{ item.price }} <ShardIcon />
            </button>
          </div>
        </template>
        <div v-else class="actions">
          <button class="primary" :disabled="busy" @click="revealAll">Reveal all</button>
        </div>
      </footer>
    </section>
    <TierReveal v-if="showing" :key="showing.i" :card="showing.card" :theme="showing.theme" @done="onRevealDone" />
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 4, 12, 0.82);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 20px;
}
.panel {
  width: min(1180px, 100%);
  max-height: 100%;
  overflow: auto;
  background: linear-gradient(180deg, #1c1830, #120f20);
  border: 1px solid rgba(201, 162, 74, 0.35);
  border-radius: 20px;
  padding: 24px 28px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.eyebrow {
  margin: 0;
  color: var(--gold);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
}
h2 {
  margin: 2px 0 0;
  font-size: 1.8rem;
}
.close {
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  line-height: 1;
  opacity: 0.7;
}
.close:hover { opacity: 1; }
.hint {
  margin: 6px 0 0;
  opacity: 0.6;
  font-size: 0.9rem;
}
.cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 22px;
  padding: 36px 0 28px;
}
.dealt {
  animation: deal 0.45s backwards cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
@keyframes deal {
  from { opacity: 0; transform: translateY(40px) scale(0.85); }
}
footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.summary {
  margin: 0;
  text-align: center;
}
.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
button.primary,
button.secondary {
  padding: 12px 22px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  border: none;
}
.primary {
  background: var(--gold);
  color: #1a1408;
}
.primary:disabled {
  background: #3b3b46;
  color: #9a9aa8;
  cursor: not-allowed;
}
.secondary {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}
.hint.preview {
  color: var(--gold);
  opacity: 0.9;
}
@media (prefers-reduced-motion: reduce) {
  .dealt { animation: none; }
}
</style>
