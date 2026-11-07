<script setup>
import { computed, ref } from 'vue'
import GameCard from '../components/GameCard.vue'
import ChronosIcon from '../components/ChronosIcon.vue'
import CardPicker from '../components/CardPicker.vue'
import ListDialog from '../components/ListDialog.vue'
import { auctions, buyListing, cancelListing, collectSale } from '../lib/auctions.js'
import { collectionList, freeCount, player, session } from '../lib/player.js'
import { route, go } from '../lib/router.js'

const tab = computed(() => (route.name === 'auction-mine' ? 'mine' : 'live'))
const search = ref('')
const notice = ref('')
const error = ref('')
const busyId = ref(null)

const online = computed(() => session.mode === 'cloud')

const live = computed(() => {
  const q = search.value.trim().toLowerCase()
  return auctions.live.filter(a => !q || a.card.name.toLowerCase().includes(q) || a.card.tier.name.toLowerCase().includes(q))
})
const active = computed(() => auctions.mine.filter(a => a.status === 'active'))
const sold = computed(() => auctions.mine.filter(a => a.status === 'sold'))
const toCollect = computed(() => sold.value.reduce((s, a) => s + a.price, 0))

async function run(a, fn, success) {
  error.value = ''
  notice.value = ''
  busyId.value = a.id
  try {
    await fn(a)
    notice.value = success
  } catch (e) {
    error.value = e.message || 'Something went wrong.'
  } finally {
    busyId.value = null
  }
}
const buy = a => run(a, buyListing, `Bought ${a.qty}× ${a.card.name}. It's in your collection.`)
const cancel = a => run(a, cancelListing, `Listing cancelled. ${a.card.name} is back in your collection.`)
const collect = a => run(a, collectSale, `Collected ${a.price.toLocaleString()} Chronos.`)

const choosing = ref(false)
const listing = ref(null)
const listable = computed(() => collectionList.value.filter(c => freeCount(c.uid) > 0))
function picked(card) {
  choosing.value = false
  listing.value = card
}
function listed(msg) {
  listing.value = null
  notice.value = msg
  go('auction-mine')
}
</script>

<template>
  <section class="auction">
    <div class="hero">
      <p class="eyebrow">Auction House</p>
      <h1>Trade cards with other players</h1>
      <p class="muted">
        You have <strong>{{ player.profile.chronos.toLocaleString() }}</strong> <ChronosIcon />. Sell cards from your
        <a href="#collection">collection</a> to earn more.
      </p>
    </div>

    <p v-if="!online" class="banner">
      You're playing offline, so you'll only see your own listings and nobody can buy them. Open the game on claude.ai to trade with other players.
    </p>
    <p v-if="auctions.error" class="banner error-banner">{{ auctions.error }}</p>
    <p v-else-if="auctions.stale" class="banner">Still connecting to the auction house…</p>

    <div class="bar">
      <nav class="tabs" role="tablist">
        <button role="tab" :aria-selected="tab === 'live'" :class="{ active: tab === 'live' }" @click="go('auction')">
          Live auctions <span class="pill">{{ auctions.live.length }}</span>
        </button>
        <button role="tab" :aria-selected="tab === 'mine'" :class="{ active: tab === 'mine' }" @click="go('auction-mine')">
          Your auctions <span v-if="sold.length" class="pill gold">{{ sold.length }} sold</span>
        </button>
      </nav>
      <button class="primary" @click="choosing = true">List a card</button>
    </div>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <!-- Live -->
    <template v-if="tab === 'live'">
      <input v-model="search" class="search" type="search" placeholder="Search by card or tier" aria-label="Search listings" />
      <p v-if="!auctions.ready" class="muted">Loading listings…</p>
      <p v-else-if="!live.length" class="muted empty">No listings right now. Be the first to list a card!</p>
      <div class="grid">
        <div v-for="a in live" :key="a.id" class="listing">
          <div class="card-wrap">
            <GameCard :card="a.card" small />
            <span v-if="a.qty > 1" class="count">×{{ a.qty }}</span>
          </div>
          <p class="seller">by {{ a.sellerId === session.uid ? 'you' : a.sellerName }}</p>
          <p class="price">{{ a.price.toLocaleString() }} <ChronosIcon /></p>
          <button
            class="primary"
            :disabled="!online || a.sellerId === session.uid || player.profile.chronos < a.price || busyId === a.id"
            @click="buy(a)"
          >
            <template v-if="a.sellerId === session.uid">Your listing</template>
            <template v-else-if="player.profile.chronos < a.price">Not enough Chronos</template>
            <template v-else>{{ busyId === a.id ? 'Buying…' : 'Buy now' }}</template>
          </button>
        </div>
      </div>
    </template>

    <!-- Mine -->
    <template v-else>
      <div v-if="sold.length" class="sold-box">
        <h2>Sold · {{ toCollect.toLocaleString() }} <ChronosIcon /> waiting</h2>
        <ul>
          <li v-for="a in sold" :key="a.id">
            <span>{{ a.qty }}× <strong>{{ a.card.tier.name }} {{ a.card.name }}</strong> bought by {{ a.buyerName || 'a player' }}</span>
            <button class="primary" :disabled="busyId === a.id" @click="collect(a)">
              Collect {{ a.price.toLocaleString() }} <ChronosIcon />
            </button>
          </li>
        </ul>
      </div>

      <h2>Active listings</h2>
      <p v-if="!active.length" class="muted">You have nothing listed.</p>
      <div class="grid">
        <div v-for="a in active" :key="a.id" class="listing">
          <div class="card-wrap">
            <GameCard :card="a.card" small />
            <span v-if="a.qty > 1" class="count">×{{ a.qty }}</span>
          </div>
          <p class="price">{{ a.price.toLocaleString() }} <ChronosIcon /></p>
          <button class="secondary" :disabled="busyId === a.id" @click="cancel(a)">
            {{ busyId === a.id ? 'Cancelling…' : 'Cancel listing' }}
          </button>
        </div>
      </div>
    </template>

    <CardPicker
      v-if="choosing"
      title="Pick a card to list"
      eyebrow="Auction house"
      :cards="listable"
      :count-of="c => freeCount(c.uid)"
      empty="You have no free cards to list. Open some packs first."
      label="List this"
      @close="choosing = false"
      @pick="picked"
    />
    <ListDialog v-if="listing" :card="listing" @close="listing = null" @done="listed" />
  </section>
</template>

<style scoped>
.auction {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}
.hero {
  text-align: center;
  margin-bottom: 22px;
}
.hero h1 {
  margin: 8px 0;
  font-family: 'Cinzel', serif;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
}
.hero p {
  margin: 0;
}
a {
  color: var(--gold);
}
.banner {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 14px;
  text-align: center;
}
.error-banner {
  border-color: rgba(255, 120, 120, 0.4);
  color: #ffb0b0;
}
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 20px 0;
}
.tabs {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999px;
  padding: 5px;
}
.tabs button {
  border: none;
  background: none;
  color: #cfcfe0;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
}
.tabs button.active {
  background: var(--gold);
  color: #1a1408;
}
.pill {
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 999px;
  padding: 1px 7px;
  margin-left: 4px;
}
.pill.gold {
  background: #3fa66b;
  color: #fff;
}
.notice {
  background: rgba(80, 200, 120, 0.12);
  border: 1px solid rgba(80, 200, 120, 0.4);
  padding: 10px 14px;
  border-radius: 10px;
}
.search {
  width: min(360px, 100%);
  margin-bottom: 18px;
}
.empty {
  text-align: center;
  padding: 30px 0;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
}
.listing {
  width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.listing p {
  margin: 0;
}
.listing button {
  width: 100%;
  padding: 8px 0;
  font-size: 0.88rem;
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
.seller {
  font-size: 0.8rem;
  opacity: 0.65;
}
.price {
  font-weight: 700;
  color: var(--gold);
}
h2 {
  font-size: 1.15rem;
  margin: 10px 0 14px;
}
.sold-box {
  background: rgba(63, 166, 107, 0.1);
  border: 1px solid rgba(63, 166, 107, 0.4);
  border-radius: 14px;
  padding: 6px 18px 12px;
  margin-bottom: 24px;
}
.sold-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sold-box li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  flex-wrap: wrap;
}
.sold-box button {
  padding: 7px 14px;
}
</style>
