# Roller

A collectible card game, rebuilt from scratch in Vue 3 + Vite. Open packs with Time Shards,
collect cards, equip gear for your class build, pick the Hand you take into battle,
and trade at the auction house for Chronos.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 (saves in your browser)
npm run build:page   # one self-contained page in dist-page/ (what's published on claude.ai)
```

Playing on claude.ai uses that page's database for accounts, saves and the auction house.
Locally it saves to localStorage and the auction house is single-player.

## Where things live

All the game's numbers are in `src/data/` so they can be tuned without touching code:

| File | What it holds |
|---|---|
| `cards.json` | Every card: type, name, multiplier (value), art |
| `tiers.json` | Card tiers (Eternal … Basic, plus minion tiers) |
| `packs/*.json` | What's in each pack and the pull odds |
| `shop.json` | What the shop sells, prices, categories |
| `gear.json` | Gear tiers (Worn → Ascended, max level 10–50), slots, every item's stats, side and weight, Inner Peace rules, stat caps |
| `builds.json` | Light / Hybrid / Heavy builds, what each wears, every class's base stats |
| `classes.json` | Sides (Order, Balance, Chaos), their classes, minion counts |
| `hand.json` | Hand rules: 1 starting + 3 reserve formations, 6 actions, minions by class |
| `formations.json` | Formation ranks, team effects, alignment and Inner Peace rules |
| `battle.json` | Battle rules (AP, exhaustion, damage), what each action card does, minion combat stats, AI opponents and rewards |
| `stats.json` | Base stats with no class chosen |

Code: `src/lib/` (game logic: `packs.js`, `cards.js`, `gear.js`, `builds.js`, `player.js`, `auctions.js`),
`src/views/` (pages), `src/components/` (cards, dialogs, reveal animations in `TierReveal.vue` / `tierThemes.js`).

Art is in `public/img/`. The 28 class gear pieces use drawn SVG icons in `public/img/cards/new/`;
replace any file with painted art of the same name and nothing else needs to change.

## Battles

Play → Battle. Your hero (class build, gear, Inner Peace) and the minions in your Hand fight an AI
team. Each round you gain your AP rate in action points and spend them on Basic Attack, your action
cards, or switching formation; then your minions attack and the enemy acts. Engine: `src/lib/battle.js`,
screen: `src/views/BattleView.vue`.

## Not built yet

- More action cards (only 4 exist) and smarter / harder AI opponents
- Where augments (passive buffs) are used
- A way to earn Time Shards besides the starting 500
