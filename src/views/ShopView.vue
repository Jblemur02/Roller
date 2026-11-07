<script setup>
import { computed, ref } from 'vue'
import PackTile from '../components/PackTile.vue'
import PackOpening from '../components/PackOpening.vue'
import OddsDialog from '../components/OddsDialog.vue'
import { categories, featured, items, openPack } from '../lib/packs.js'
import { buyPack, session } from '../lib/player.js'

const tabs = computed(() => [{ id: 'featured', label: 'Featured' }, ...categories.filter(c => !c.ownerOnly || session.isOwner)])
const tab = ref('featured')

const shown = computed(() =>
  tab.value === 'featured' ? featured : items.filter(i => i.category === tab.value),
)

const opening = ref(null) // { item, cards, n }
const oddsFor = ref(null)
const error = ref('')
let openCount = 0

function buy(item) {
  error.value = ''
  let cards
  try {
    cards = openPack(item)
  } catch (e) {
    error.value = e.message
    return
  }
  // Test packs are free and their cards aren't kept.
  if (!item.preview && !buyPack(item, cards)) {
    error.value = `You need ${item.price} Time Shards to open ${item.name}.`
    return
  }
  opening.value = { item, cards, n: ++openCount }
}
</script>

<template>
  <section class="shop">
    <div class="hero">
      <p class="eyebrow">Card Pack Shop</p>
      <h1>Spend your Time Shards. Pull something legendary.</h1>
      <p class="sub">Cards you pull go straight to your <a href="#collection">collection</a>.</p>
    </div>

    <nav class="tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.id"
        role="tab"
        :aria-selected="tab === t.id"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </nav>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div class="grid">
      <PackTile v-for="item in shown" :key="item.id" :item="item" @open="buy" @odds="oddsFor = $event" />
    </div>

    <PackOpening
      v-if="opening"
      :key="opening.n"
      :item="opening.item"
      :cards="opening.cards"
      @close="opening = null"
      @again="buy(opening.item)"
    />
    <OddsDialog v-if="oddsFor" :item="oddsFor" @close="oddsFor = null" />
  </section>
</template>

<style scoped>
.shop {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}
.hero {
  text-align: center;
  margin: 10px 0 26px;
}
.eyebrow {
  margin: 0;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
}
h1 {
  margin: 8px 0 0;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-family: 'Cinzel', serif;
}
.sub {
  margin: 10px 0 0;
  opacity: 0.65;
}
.sub a {
  color: var(--gold);
}
.tabs {
  display: flex;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 5px;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
  margin: 0 auto 30px;
}
@media (max-width: 520px) {
  .tabs {
    border-radius: 18px;
  }
  .tabs button {
    padding: 8px 14px;
  }
}
.tabs button {
  border: none;
  background: none;
  color: #cfcfe0;
  padding: 9px 20px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
}
.tabs button.active {
  background: var(--gold);
  color: #1a1408;
}
.tabs button:not(.active):hover {
  background: rgba(255, 255, 255, 0.08);
}
.error {
  text-align: center;
  color: #ff8a8a;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 26px;
}
</style>
