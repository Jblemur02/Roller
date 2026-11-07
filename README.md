# Roller

A collectible card game, rebuilt from scratch. Vue 3 + Vite.

```bash
npm install
npm run dev
```

## Where things live

- `src/data/shop.json`: what the shop sells (name, price, category, art, which contents file)
- `src/data/packs/*.json`: what's inside each pack (card slots and pull rates), from the original Roller
- `src/data/cards.json`, `tiers.json`, `variants.json`: card and rarity definitions
- `src/lib/packs.js`: weighted pulls and odds
- `src/lib/cards.js`: decodes card IDs like `00012-00-05-LA0-000`
- `src/lib/wallet.js`: Time Shards and collection (saved in localStorage for now)

To add a pack: drop a contents file in `src/data/packs/` and point a shop item at it with `"contents": "<FileName>"`.
