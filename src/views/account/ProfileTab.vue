<script setup>
import { computed, ref } from 'vue'
import ShardIcon from '../../components/ShardIcon.vue'
import ChronosIcon from '../../components/ChronosIcon.vue'
import { player, session, collectionList, collectionValue, handSize, deletePlayer } from '../../lib/player.js'
import { decodeCard } from '../../lib/cards.js'
import { go } from '../../lib/router.js'
import classes from '../../data/classes.json'

const p = computed(() => player.profile)
const side = computed(() => classes.sides.find(s => s.id === p.value.side))
const totalCards = computed(() => collectionList.value.reduce((s, c) => s + c.quantity, 0))
const sales = computed(() => p.value.sales.map(s => ({ ...s, card: decodeCard(s.uid) })).filter(s => s.card))
const joined = computed(() => new Date(p.value.createdAt).toLocaleDateString())

const confirmReset = ref(false)
</script>

<template>
  <div>
    <div class="hero">
      <div class="avatar" :style="side ? { background: `linear-gradient(160deg, ${side.colors[0]}, ${side.colors[1]})` } : {}">
        {{ p.username.charAt(0).toUpperCase() }}
      </div>
      <div>
        <h2>{{ p.username }}</h2>
        <p class="muted">
          Level {{ p.level }} ·
          <template v-if="p.className">{{ p.className }} of {{ side?.name }}</template>
          <a v-else href="#play">No class chosen yet</a>
          · Joined {{ joined }}
        </p>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><span>Time Shards</span><strong>{{ p.shards.toLocaleString() }} <ShardIcon /></strong></div>
      <div class="stat"><span>Chronos</span><strong>{{ p.chronos.toLocaleString() }} <ChronosIcon /></strong></div>
      <div class="stat"><span>Packs opened</span><strong>{{ p.packsOpened }}</strong></div>
      <div class="stat"><span>Cards</span><strong>{{ totalCards }}</strong><small>{{ collectionList.length }} unique</small></div>
      <div class="stat"><span>Collection value</span><strong>{{ collectionValue.toLocaleString() }} <ChronosIcon /></strong></div>
      <div class="stat"><span>Hand</span><strong>{{ handSize }}</strong><small>cards</small></div>
    </div>

    <h3>Recent auction sales</h3>
    <p v-if="!sales.length" class="muted">No sales yet. <a href="#auction">Visit the auction house</a>.</p>
    <ul class="sales">
      <li v-for="(s, i) in sales" :key="i">
        <span>{{ s.qty }}× <strong>{{ s.card.tier.name }} {{ s.card.name }}</strong> to {{ s.buyerName || 'a player' }}</span>
        <span>+{{ s.price.toLocaleString() }} <ChronosIcon /></span>
      </li>
    </ul>

    <h3>Your save</h3>
    <p class="muted" v-if="session.mode === 'cloud'">Saved to your claude.ai account, so it follows you to any device.</p>
    <p class="muted" v-else>Saved in this browser only.</p>
    <div v-if="!confirmReset">
      <button class="secondary danger" @click="confirmReset = true">Start over…</button>
    </div>
    <div v-else class="confirm">
      <p>Delete {{ p.username }} and every card, shard and Chronos? Your auction listings stay up. This can't be undone.</p>
      <button class="secondary" @click="confirmReset = false">Keep my player</button>
      <button class="primary danger-fill" @click="deletePlayer().then(() => go('home'))">Delete everything</button>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  gap: 18px;
  align-items: center;
}
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 800;
  font-family: 'Cinzel', serif;
  background: linear-gradient(160deg, #4a3d7a, #1a1530);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
h2 {
  margin: 0;
  font-size: 1.7rem;
}
.hero p {
  margin: 4px 0 0;
}
a {
  color: var(--gold);
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
  margin: 26px 0;
}
.stat {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat span {
  font-size: 0.78rem;
  opacity: 0.65;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.stat strong {
  font-size: 1.4rem;
  font-variant-numeric: tabular-nums;
}
.stat small {
  opacity: 0.6;
}
h3 {
  margin: 26px 0 8px;
}
.sales {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sales li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}
.confirm {
  background: rgba(255, 80, 80, 0.08);
  border: 1px solid rgba(255, 80, 80, 0.3);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.confirm p {
  margin: 0;
  flex-basis: 100%;
}
.danger {
  border-color: rgba(255, 120, 120, 0.5) !important;
  color: #ff9a9a !important;
}
.danger-fill {
  background: #c94a4a !important;
  color: #fff !important;
}
</style>
