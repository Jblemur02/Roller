// The player's Time Shards and collection, kept in localStorage until there's a backend.
import { reactive, watch } from 'vue'

const KEY = 'roller.wallet.v1'
export const STARTING_SHARDS = 500

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved && typeof saved.shards === 'number') return saved
  } catch {}
  return { shards: STARTING_SHARDS, collection: {}, packsOpened: 0 }
}

export const wallet = reactive(load())

watch(wallet, value => localStorage.setItem(KEY, JSON.stringify(value)), { deep: true })

export function canAfford(price) {
  return wallet.shards >= price
}

export function spend(price) {
  if (!canAfford(price)) return false
  wallet.shards -= price
  return true
}

export function addCards(cards) {
  for (const card of cards) {
    wallet.collection[card.uid] = (wallet.collection[card.uid] || 0) + 1
  }
  wallet.packsOpened += 1
}

export function addShards(amount) {
  wallet.shards += amount
}

export function resetWallet() {
  Object.assign(wallet, { shards: STARTING_SHARDS, collection: {}, packsOpened: 0 })
}
