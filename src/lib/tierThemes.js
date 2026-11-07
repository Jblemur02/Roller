// Reveal animations for cards above Legendary, keyed by tier value.
//
// Each theme sets:
//   colors   particle palette
//   glow     main accent colour (card tease glow, title, flash)
//   bg       backdrop gradient behind the reveal
//   layers   CSS effect layers drawn by TierReveal.vue
//   ambient  particles during the build-up and celebration
//   burst    particles fired when the card flips
//   shake    screen shake on the flip
//   rank     1 = rarest, used for tease intensity and reveal order

export const TIER_THEMES = {
  '00': {
    key: 'eternal',
    rank: 1,
    glow: '#ffc42e',
    colors: ['#fff6d5', '#ffd76a', '#ffc42e', '#ffffff'],
    bg: 'radial-gradient(circle at 50% 45%, rgba(255, 210, 90, 0.45), rgba(60, 40, 0, 0.92) 55%, #050300 85%)',
    layers: ['rays', 'halo', 'runes'],
    runes: 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ',
    ambient: { mode: 'rise', rate: 3, size: [1.5, 4], shape: 'dot' },
    burst: { count: 220, speed: [4, 16], size: [1.5, 4.5], shape: 'spark' },
    shake: true,
  },
  '01': {
    key: 'heavenly',
    rank: 2,
    glow: '#5fb0ff',
    colors: ['#ffffff', '#cfe8ff', '#8cc8ff', '#5fb0ff'],
    bg: 'linear-gradient(180deg, rgba(190, 225, 255, 0.55), rgba(20, 60, 120, 0.9) 45%, #02060f 90%)',
    layers: ['beam', 'halo'],
    ambient: { mode: 'fall', rate: 1.2, size: [5, 11], shape: 'feather' },
    burst: { count: 140, speed: [3, 11], size: [2, 4], shape: 'dot' },
    shake: false,
  },
  '02': {
    key: 'crimson-dusk',
    rank: 3,
    glow: '#ff2a2a',
    colors: ['#ff6a3d', '#ff2a2a', '#b30000', '#ffb199'],
    bg: 'radial-gradient(circle at 50% 30%, rgba(160, 0, 0, 0.6), rgba(40, 0, 0, 0.94) 55%, #070000 85%)',
    layers: ['moon', 'vignette'],
    ambient: { mode: 'rise', rate: 4, size: [1, 3.2], shape: 'ember' },
    burst: { count: 180, speed: [3, 13], size: [1.5, 3.5], shape: 'ember' },
    shake: true,
  },
  '03': {
    key: 'abyssal',
    rank: 4,
    glow: '#9c08ff',
    colors: ['#d38cff', '#9c08ff', '#5a00a8', '#ffffff'],
    bg: 'radial-gradient(circle at 50% 50%, #000 0%, rgba(40, 0, 70, 0.95) 40%, #030008 85%)',
    layers: ['ripple', 'void'],
    ambient: { mode: 'vortex', rate: 5, size: [1, 3], shape: 'streak' },
    burst: { count: 160, speed: [5, 15], size: [1.5, 3], shape: 'streak' },
    shake: true,
  },
  '04': {
    key: 'cosmic',
    rank: 5,
    glow: '#7a86ff',
    colors: ['#ffffff', '#b9c2ff', '#7a86ff', '#c48bff'],
    bg: 'radial-gradient(ellipse at 40% 40%, rgba(90, 60, 200, 0.55), transparent 60%), radial-gradient(ellipse at 65% 60%, rgba(30, 80, 200, 0.5), transparent 55%), #02020c',
    layers: ['nebula'],
    ambient: { mode: 'warp', rate: 6, size: [0.8, 2], shape: 'streak' },
    burst: { count: 120, speed: [6, 18], size: [1, 2.5], shape: 'star' },
    shake: false,
  },
  '05': {
    key: 'eclipse',
    rank: 6,
    glow: '#ffd700',
    colors: ['#fff3b0', '#ffd700', '#ff9d00', '#ffffff'],
    bg: 'radial-gradient(circle at 50% 42%, rgba(80, 60, 0, 0.6), #050400 60%)',
    layers: ['eclipse'],
    ambient: { mode: 'orbit', rate: 2, size: [1, 2.5], shape: 'dot' },
    burst: { count: 130, speed: [4, 12], size: [1.5, 3], shape: 'spark' },
    shake: false,
  },
  '06': {
    key: 'mythic',
    rank: 7,
    glow: '#ff9a1f',
    colors: ['#ffe28a', '#ffb21f', '#ff7a00', '#ff4a00'],
    bg: 'radial-gradient(circle at 50% 70%, rgba(255, 110, 0, 0.45), rgba(50, 15, 0, 0.94) 55%, #070200 85%)',
    layers: ['runes', 'flames'],
    runes: 'ᛟᛞᛜᛚᛗᛖᛒᛏᛊᛉᛈᛇᛃᛁᚾᚺᚹᚷᚲᚱᚨᚦᚢᚠ',
    ambient: { mode: 'rise', rate: 5, size: [1.5, 4], shape: 'ember' },
    burst: { count: 150, speed: [3, 12], size: [2, 4], shape: 'ember' },
    shake: false,
  },
  '20': {
    key: 'mystical',
    rank: 1,
    glow: '#3ee6d6',
    colors: ['#3ee6d6', '#9b7bff', '#ff7ae0', '#ffffff'],
    bg: 'radial-gradient(circle at 50% 45%, rgba(30, 160, 170, 0.45), rgba(40, 10, 70, 0.94) 55%, #030108 85%)',
    layers: ['runes', 'halo'],
    runes: '✦✧⟡◈◇✶✷✸⊹⋆✺❋',
    ambient: { mode: 'orbit', rate: 4, size: [1.2, 3], shape: 'star' },
    burst: { count: 180, speed: [3, 13], size: [1.5, 3.5], shape: 'star' },
    shake: true,
  },
}

export function themeFor(card) {
  return card ? TIER_THEMES[card.tier.value] || null : null
}
