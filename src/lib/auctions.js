// Auction house: players list cards for a Chronos price, others buy them.
//
// Cards are held in escrow on the listing. A buyer marks the listing sold and receives
// the cards. The seller's Chronos wait on the listing until the seller collects them,
// because nobody can write into another player's private save.
import { reactive } from 'vue'
import { canonicalId, decodeCard } from './cards.js'
import { player, session, removeCards, addCards, save } from './player.js'

const LOCAL_KEY = 'roller.auctions.v1'
const MAX_PRICE = 1_000_000_000

export const auctions = reactive({
  live: [],
  mine: [],
  ready: false,
  stale: false,
  error: '',
})

let col = null
let unsubs = []

// Shared data is untrusted: only keep well-formed listings for cards that exist.
function clean(id, d) {
  if (!d || typeof d.uid !== 'string') return null
  const card = decodeCard(d.uid)
  const qty = Number(d.qty)
  const price = Number(d.price)
  if (!card || !Number.isInteger(qty) || qty < 1 || !Number.isFinite(price) || price < 1) return null
  return {
    id,
    card,
    uid: card.uid,
    qty,
    price,
    sellerId: String(d.sellerId || ''),
    sellerName: String(d.sellerName || 'Unknown').slice(0, 24),
    buyerName: d.buyerName ? String(d.buyerName).slice(0, 24) : null,
    status: ['active', 'sold'].includes(d.status) ? d.status : 'unknown',
    createdAt: Number(d.createdAt) || 0,
  }
}

// ---------- local (single player) ----------

function localLoad() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []
  } catch {
    return []
  }
}
function localStore(list) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  refreshLocal()
}
function refreshLocal() {
  const list = localLoad().map(d => clean(d.id, d)).filter(Boolean)
  auctions.mine = list.sort((a, b) => b.createdAt - a.createdAt)
  auctions.live = list.filter(a => a.status === 'active')
  auctions.ready = true
}

// ---------- start ----------

export function startAuctions(platform) {
  unsubs.forEach(u => u())
  unsubs = []
  if (platform.mode !== 'cloud') {
    col = null
    refreshLocal()
    return
  }
  col = platform.db.collection('auctions')
  const timer = setTimeout(() => {
    auctions.stale = true
  }, 10000)
  const onError = e => {
    clearTimeout(timer)
    auctions.ready = true
    auctions.error = 'The auction house can\'t be reached right now.'
    console.error('auction listener', e)
  }
  const toList = snap => snap.docs.map(d => clean(d.id, d.data())).filter(Boolean)

  unsubs.push(
    col.where('status', '==', 'active').onSnapshot(snap => {
      auctions.live = toList(snap).sort((a, b) => b.createdAt - a.createdAt)
      auctions.ready = true
      if (!snap.metadata.fromCache) {
        clearTimeout(timer)
        auctions.stale = false
      }
    }, onError),
  )
  unsubs.push(
    col.where('sellerId', '==', platform.uid).onSnapshot(snap => {
      auctions.mine = toList(snap).sort((a, b) => b.createdAt - a.createdAt)
    }, onError),
  )
}

// A short lock on the listing so two players can't buy it at once. Locks can't be released
// early, so they're kept short, and a busy listing is retried until the other lock runs out.
async function withLease(ref, fn) {
  let lease
  for (let attempt = 0; attempt < 3; attempt++) {
    lease = await ref.acquire({ holder: session.uid, ttlMs: 4000 })
    if (lease.acquired) break
    const until = Date.parse(lease.expiresAt) - Date.now()
    await new Promise(r => setTimeout(r, Math.min(4500, Math.max(300, Number.isFinite(until) ? until + 150 : 1000))))
  }
  if (!lease.acquired) throw new Error('Someone else is handling this listing right now. Try again in a moment.')
  const snap = await ref.get()
  return fn(snap.exists ? snap.data() : null)
}

// ---------- actions ----------

export async function listCard(uid, qty, price) {
  qty = Math.floor(Number(qty))
  price = Math.floor(Number(price))
  if (!(qty >= 1)) throw new Error('Choose how many copies to list.')
  if (!(price >= 1 && price <= MAX_PRICE)) throw new Error('Set a price of at least 1 Chronos.')

  removeCards(uid, qty) // throws if not enough free copies
  const listing = {
    uid,
    qty,
    price,
    sellerId: session.uid,
    sellerName: player.profile.username,
    status: 'active',
    createdAt: Date.now(),
  }
  try {
    if (col) {
      await save({ now: true })
      await col.add(listing)
    } else {
      localStore([...localLoad(), { id: 'l' + Date.now(), ...listing }])
      save()
    }
  } catch (e) {
    addCards([{ uid, qty }]) // put the cards back
    save()
    throw new Error(e?.code === 'quota_exceeded' ? 'The auction house is full right now.' : 'Listing failed. Your cards are back in your collection.')
  }
}

export async function cancelListing(a) {
  if (!col) {
    localStore(localLoad().filter(d => d.id !== a.id))
    addCards([{ uid: a.uid, qty: a.qty }])
    save()
    return
  }
  const ref = col.doc(a.id)
  await withLease(ref, async d => {
    if (!d || d.sellerId !== session.uid) throw new Error('This listing no longer exists.')
    if (d.status !== 'active') throw new Error('Too late, this listing just sold. Collect your Chronos instead.')
    await ref.delete()
    addCards([{ uid: canonicalId(d.uid), qty: Number(d.qty) }])
    await save({ now: true })
  })
}

export async function buyListing(a) {
  if (!col) throw new Error('Buying needs the online auction house.')
  if (a.sellerId === session.uid) throw new Error('You can\'t buy your own listing.')
  const ref = col.doc(a.id)
  await withLease(ref, async raw => {
    const d = clean(a.id, raw)
    if (!d || d.status !== 'active') throw new Error('This listing is no longer available.')
    if (player.profile.chronos < d.price) throw new Error('You don\'t have enough Chronos.')
    await ref.update({ status: 'sold', buyerName: player.profile.username, soldAt: Date.now() })
    player.profile.chronos -= d.price
    addCards([{ uid: d.uid, qty: d.qty }])
    await save({ now: true })
  })
}

export async function collectSale(a) {
  const ref = col.doc(a.id)
  await withLease(ref, async raw => {
    const d = clean(a.id, raw)
    if (!d || d.sellerId !== session.uid || d.status !== 'sold') throw new Error('Nothing to collect here.')
    await ref.delete()
    const p = player.profile
    p.chronos += d.price
    p.sales = [{ uid: d.uid, qty: d.qty, price: d.price, buyerName: d.buyerName, at: Date.now() }, ...p.sales].slice(0, 20)
    await save({ now: true })
  })
}
