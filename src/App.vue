<script setup>
import { computed } from 'vue'
import HomeView from './views/HomeView.vue'
import ShopView from './views/ShopView.vue'
import AuctionView from './views/AuctionView.vue'
import PlayView from './views/PlayView.vue'
import AccountView from './views/AccountView.vue'
import OnboardingView from './views/OnboardingView.vue'
import ShardIcon from './components/ShardIcon.vue'
import ChronosIcon from './components/ChronosIcon.vue'
import TestingPanel from './components/TestingPanel.vue'
import { player, session } from './lib/player.js'
import { route, go } from './lib/router.js'

const NAV = [
  { id: 'home', label: 'Home', match: ['home'] },
  { id: 'shop', label: 'Shop', match: ['shop'] },
  { id: 'auction', label: 'Auction', match: ['auction', 'auction-mine'] },
  { id: 'play', label: 'Play', match: ['play', 'play-order', 'play-balance', 'play-chaos'] },
  { id: 'collection', label: 'Account', match: ['account', 'profile', 'collection', 'gear', 'deck'] },
]
const VIEWS = { home: HomeView, shop: ShopView, auction: AuctionView, play: PlayView, collection: AccountView }

// Short form for big balances in the top bar (exact amount on hover).
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const short = n => (n >= 1_000_000 ? compact.format(n) : n.toLocaleString())

const activeNav = computed(() => NAV.find(n => n.match.includes(route.name)) || NAV[0])
const view = computed(() => VIEWS[activeNav.value.id])
</script>

<template>
  <div v-if="session.status === 'connecting'" class="center">
    <p class="loading">Loading your save…</p>
  </div>

  <div v-else-if="session.status === 'error'" class="center">
    <p class="error">{{ session.loadError }}</p>
  </div>

  <OnboardingView v-else-if="session.status === 'onboarding'" />

  <template v-else>
    <header class="topbar">
      <button class="brand" @click="go('home')">ROLLER</button>
      <nav>
        <button v-for="n in NAV" :key="n.id" :class="{ active: activeNav.id === n.id }" @click="go(n.id === 'collection' ? 'profile' : n.id)">
          {{ n.label }}
        </button>
      </nav>
      <div class="balances" aria-live="polite">
        <span :title="`${player.profile.shards.toLocaleString()} Time Shards: open packs`"><ShardIcon /> {{ short(player.profile.shards) }}</span>
        <span :title="`${player.profile.chronos.toLocaleString()} Chronos: from selling cards, spent at auctions`"><ChronosIcon /> {{ short(player.profile.chronos) }}</span>
        <button class="who" title="Your profile" @click="go('profile')">{{ player.profile.username }}</button>
      </div>
    </header>

    <p v-if="session.saveError" class="save-error" role="alert">{{ session.saveError }}</p>

    <main>
      <component :is="view" />
    </main>

    <footer class="dev">
      <TestingPanel v-if="session.isOwner" />
      <p class="save-state">
        <span v-if="session.saving">Saving…</span>
        <span v-else>{{ session.mode === 'cloud' ? 'Saved to your account' : 'Saved in this browser' }}</span>
      </p>
    </footer>
  </template>
</template>

<style scoped>
.center {
  min-height: 80vh;
  display: grid;
  place-items: center;
}
.loading {
  opacity: 0.7;
  letter-spacing: 0.1em;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  /* equal outer columns keep the links at the true centre of the page */
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  padding: 12px 24px;
  background: rgba(14, 12, 24, 0.88);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.topbar > .brand {
  justify-self: start;
}
@media (max-width: 1100px) {
  .topbar {
    grid-template-columns: 1fr auto;
    row-gap: 8px;
  }
  .topbar > nav {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

.brand {
  background: none;
  border: none;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: var(--gold);
  font-size: 1.15rem;
  padding: 0;
}
nav {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}
nav button {
  background: none;
  border: none;
  color: #cfcfe0;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
}
nav button:hover {
  background: rgba(255, 255, 255, 0.06);
}
nav button.active {
  color: var(--gold);
  background: rgba(201, 162, 74, 0.12);
}
.balances {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-self: end;
}
.balances span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 5px 12px;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.who {
  background: rgba(201, 162, 74, 0.15);
  border: 1px solid rgba(201, 162, 74, 0.4);
  color: var(--gold);
  border-radius: 999px;
  padding: 5px 12px;
  font-weight: 700;
}
.save-error {
  margin: 0;
  background: rgba(255, 90, 90, 0.15);
  color: #ffb0b0;
  text-align: center;
  padding: 8px;
}
.dev {
  padding: 20px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.save-state {
  margin: 12px 0 0;
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.55;
}
@media (max-width: 600px) {
  .topbar {
    padding: 10px 12px;
    gap: 10px;
  }
  .brand {
    letter-spacing: 0.2em;
    font-size: 1rem;
  }
  .who {
    display: none;
  }
  .balances span {
    padding: 4px 9px;
  }
  nav {
    flex-wrap: nowrap;
    gap: 2px;
  }
  nav button {
    padding: 7px 10px;
    font-size: 0.92rem;
  }
}
</style>
