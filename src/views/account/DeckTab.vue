<script setup>
import { computed, ref } from 'vue'
import GameCard from '../../components/GameCard.vue'
import CardPicker from '../../components/CardPicker.vue'
import { collectionList, deckAdd, deckRemove, deckSize, freeCount, player } from '../../lib/player.js'
import { decodeCard } from '../../lib/cards.js'

const adding = ref(false)
const error = ref('')

const deck = computed(() =>
  Object.entries(player.profile.deck)
    .map(([uid, count]) => ({ card: decodeCard(uid), count }))
    .filter(e => e.card)
    .sort((a, b) => a.card.type.localeCompare(b.card.type) || a.card.name.localeCompare(b.card.name)),
)

const byType = computed(() => {
  const out = {}
  for (const { card, count } of deck.value) out[card.type] = (out[card.type] || 0) + count
  return out
})

const available = computed(() => collectionList.value.filter(c => freeCount(c.uid) > 0))

function add(card) {
  error.value = ''
  try {
    deckAdd(card.uid)
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div>
    <div class="head">
      <div>
        <h2>Deck</h2>
        <p class="muted">
          {{ deckSize }} cards
          <template v-for="(n, t) in byType" :key="t"> · {{ n }} {{ t }}</template>
        </p>
      </div>
      <button class="primary" @click="adding = true">Add cards</button>
    </div>
    <p class="muted small">
      Deck rules will come with the new battle system. For now you can add any card you own. Cards in your deck can't be sold or auctioned.
    </p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div v-if="!deck.length" class="empty muted">Your deck is empty.</div>
    <div class="grid">
      <div v-for="{ card, count } in deck" :key="card.uid" class="item">
        <div class="card-wrap">
          <GameCard :card="card" small />
          <span class="count">×{{ count }}</span>
        </div>
        <div class="row">
          <button class="secondary" aria-label="Remove one" @click="deckRemove(card.uid)">−</button>
          <button class="secondary" aria-label="Add one" :disabled="freeCount(card.uid) < 1" @click="add(card)">+</button>
        </div>
      </div>
    </div>

    <CardPicker
      v-if="adding"
      title="Add to deck"
      eyebrow="Deck"
      :cards="available"
      :count-of="c => freeCount(c.uid)"
      empty="No free cards left. Open more packs!"
      label="Add"
      @close="adding = false"
      @pick="add"
    >
      <p class="muted">{{ deckSize }} cards in deck. Click Add as many times as you like.</p>
    </CardPicker>
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
.small {
  font-size: 0.82rem;
}
.empty {
  padding: 40px 0;
  text-align: center;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 16px;
}
.item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
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
.row {
  display: flex;
  gap: 6px;
  width: 100%;
}
.row button {
  flex: 1;
  padding: 6px 0;
}
</style>
