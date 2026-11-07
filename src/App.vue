<script setup>
import ShopView from './views/ShopView.vue'
import ShardIcon from './components/ShardIcon.vue'
import { wallet, addShards, resetWallet } from './lib/wallet.js'
</script>

<template>
  <header class="topbar">
    <span class="brand">ROLLER</span>
    <div class="right">
      <span class="balance" aria-live="polite">
        <ShardIcon size="1.3em" /> {{ wallet.shards.toLocaleString() }}
        <small>Time Shards</small>
      </span>
    </div>
  </header>

  <main>
    <ShopView />
  </main>

  <footer class="dev">
    Testing tools:
    <button @click="addShards(100)">+100 shards</button>
    <button @click="resetWallet()">Reset wallet</button>
    <span>{{ wallet.packsOpened }} packs opened · {{ Object.keys(wallet.collection).length }} unique cards</span>
  </footer>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px;
  background: rgba(14, 12, 24, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.brand {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 0.3em;
  color: var(--gold);
  font-size: 1.2rem;
}
.balance {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  background: rgba(201, 162, 74, 0.12);
  border: 1px solid rgba(201, 162, 74, 0.4);
  padding: 6px 14px;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.balance small {
  font-weight: 400;
  opacity: 0.6;
  font-size: 0.75rem;
}
.dev {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 16px;
  font-size: 0.8rem;
  opacity: 0.55;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.dev button {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.8rem;
}
</style>
