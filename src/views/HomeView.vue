<script setup>
import { computed } from 'vue'
import GameCard from '../components/GameCard.vue'
import ShardIcon from '../components/ShardIcon.vue'
import ChronosIcon from '../components/ChronosIcon.vue'
import { player, collectionList } from '../lib/player.js'
import { auctions } from '../lib/auctions.js'
import { decodeCard } from '../lib/cards.js'
import { go } from '../lib/router.js'

const p = computed(() => player.profile)
const recent = computed(() => p.value.recentPulls.map(r => ({ ...r, card: decodeCard(r.uid) })).filter(r => r.card))
const soldWaiting = computed(() => auctions.mine.filter(a => a.status === 'sold').length)

const tiles = computed(() => [
  { id: 'shop', title: 'Card Shop', text: 'Open packs with Time Shards.', stat: `${p.value.shards.toLocaleString()} shards` },
  { id: 'collection', title: 'Collection', text: 'Sort, sell and auction your cards.', stat: `${collectionList.value.length} unique cards` },
  {
    id: soldWaiting.value ? 'auction-mine' : 'auction',
    title: 'Auction House',
    text: 'Buy and sell with other players.',
    stat: soldWaiting.value ? `${soldWaiting.value} sold, Chronos to collect` : `${auctions.live.length} live listings`,
  },
  { id: 'play', title: 'Play', text: 'Pick your side and class.', stat: p.value.className || 'No class yet' },
  { id: 'gear', title: 'Gear', text: 'Equip gear and build Inner Peace.', stat: `${Object.keys(p.value.gear).length} of 9 slots filled` },
  { id: 'deck', title: 'Deck', text: 'Build the deck you\'ll battle with.', stat: `${Object.values(p.value.deck).reduce((a, b) => a + b, 0)} cards` },
])
</script>

<template>
  <section class="home">
    <div class="hero">
      <p class="eyebrow">Welcome back</p>
      <h1>{{ p.username }}</h1>
      <div class="balances">
        <span><ShardIcon size="1.3em" /> {{ p.shards.toLocaleString() }} Time Shards</span>
        <span><ChronosIcon size="1.3em" /> {{ p.chronos.toLocaleString() }} Chronos</span>
      </div>
    </div>

    <div class="tiles">
      <button v-for="t in tiles" :key="t.title" class="tile" @click="go(t.id)">
        <span class="t-title">{{ t.title }}</span>
        <span class="t-text">{{ t.text }}</span>
        <span class="t-stat">{{ t.stat }}</span>
      </button>
    </div>

    <h2>Your latest best pulls</h2>
    <p v-if="!recent.length" class="muted">Nothing yet. <a href="#shop">Open a pack</a> and your best card from each one shows up here.</p>
    <div class="recent">
      <div v-for="(r, i) in recent" :key="i" class="pull">
        <GameCard :card="r.card" small />
        <p class="muted">{{ r.pack }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}
.hero {
  text-align: center;
  margin: 10px 0 30px;
}
.hero h1 {
  margin: 6px 0 14px;
  font-family: 'Cinzel', serif;
  font-size: clamp(2rem, 5vw, 3.2rem);
}
.balances {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}
.balances span {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  padding: 8px 16px;
  font-weight: 600;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.tile {
  text-align: left;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.2s, border-color 0.2s;
}
.tile:hover {
  transform: translateY(-3px);
  border-color: rgba(201, 162, 74, 0.6);
}
.t-title {
  font-weight: 800;
  font-size: 1.15rem;
}
.t-text {
  opacity: 0.7;
  font-size: 0.9rem;
}
.t-stat {
  color: var(--gold);
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 4px;
}
h2 {
  margin: 40px 0 12px;
  font-size: 1.2rem;
}
a {
  color: var(--gold);
}
.recent {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 8px 4px 16px;
}
.pull p {
  margin: 6px 0 0;
  text-align: center;
  font-size: 0.8rem;
}
</style>
