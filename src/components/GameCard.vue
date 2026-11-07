<script setup>
import { computed, ref } from 'vue'
import ChronosIcon from './ChronosIcon.vue'
import { rarityRank } from '../lib/cards.js'

const props = defineProps({
  card: { type: Object, required: true },
  revealed: { type: Boolean, default: true },
  small: Boolean,
  tease: { type: String, default: null }, // glow colour on the face-down back for special cards
})
defineEmits(['reveal'])

const artFailed = ref(false)

// Fallback colour under image backgrounds, so the card still looks right if the image can't load.
const fallback = computed(() => {
  const aura = props.card.tier.aura
  const m = aura && aura.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const [r, g, b] = m[1].split(',').map(s => s.trim())
    return `linear-gradient(160deg, rgb(${r},${g},${b}) 0%, #0c0c14 85%)`
  }
  return 'linear-gradient(160deg, #444 0%, #111 85%)'
})

const faceStyle = computed(() => {
  const t = props.card.tier
  const background =
    t.backgroundType === 'image'
      ? `url("${t.background}") center / cover no-repeat, ${fallback.value}`
      : t.background
  return {
    background,
    color: t.color,
    boxShadow: (props.small ? shrinkAura(t.aura) : t.aura) || undefined,
  }
})

// Tier auras are sized for the big pack-opening cards; in grids they'd swamp the neighbours.
function shrinkAura(aura) {
  if (!aura) return aura
  return aura.replace(/(-?\d+(?:\.\d+)?)px/g, (_, n) => `${Math.round(Number(n) * 0.22)}px`)
}

const rare = computed(() => rarityRank(props.card.tier) <= 6)
</script>

<template>
  <div
    class="card"
    :class="{ flipped: revealed, rare, small }"
    role="button"
    :aria-label="revealed ? `${card.name}, ${card.tier.name}` : 'Face-down card, click to reveal'"
    tabindex="0"
    @click="!revealed && $emit('reveal')"
    @keydown.enter="!revealed && $emit('reveal')"
  >
    <div class="inner">
      <div class="back" :class="{ teasing: tease && !revealed }" :style="tease ? { '--tease': tease } : {}">
        <ChronosIcon size="64px" />
        <span>ROLLER</span>
      </div>

      <div class="front" :style="faceStyle">
        <div class="shade"></div>
        <p class="type">{{ card.type }}<template v-if="card.subtype && card.subtype !== 'None'"> · {{ card.subtype }}</template></p>
        <div class="art">
          <img v-if="!artFailed" :src="card.image" :alt="card.name" @error="artFailed = true" />
          <span v-else class="art-fallback">{{ card.name.charAt(0) }}</span>
        </div>
        <h3 class="name">{{ card.name }}</h3>
        <p class="tier" :style="{ fontFamily: card.tier.font }">{{ card.tier.name }}</p>
        <p class="value">{{ card.value.toLocaleString() }} <ChronosIcon /></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  width: 200px;
  height: 290px;
  perspective: 1000px;
  cursor: pointer;
  flex: 0 0 auto;
  outline: none;
}
.card.flipped {
  cursor: default;
}
.inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.3, 1.4, 0.5, 1);
  transform-style: preserve-3d;
}
.card.flipped .inner {
  transform: rotateY(180deg);
}
.card:not(.flipped):hover .inner,
.card:not(.flipped):focus-visible .inner {
  transform: translateY(-8px) rotateZ(-1deg);
}
.back,
.front {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  backface-visibility: hidden;
  overflow: hidden;
}
.back {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.04) 0 10px, transparent 10px 20px),
    linear-gradient(160deg, #2a2340, #0f0c1a);
  border: 2px solid #c9a24a;
  color: #c9a24a;
  font-weight: 800;
  letter-spacing: 0.3em;
  font-size: 0.85rem;
}
.back.teasing {
  border-color: var(--tease);
  color: var(--tease);
  animation: tease 1.1s ease-in-out infinite;
}
@keyframes tease {
  0%, 100% { box-shadow: 0 0 10px 1px var(--tease), inset 0 0 20px -6px var(--tease); }
  50% { box-shadow: 0 0 28px 6px var(--tease), inset 0 0 36px -4px var(--tease); }
}
.front {
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 12px;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.25);
}
.card.flipped.rare .front {
  animation: glow 2.4s ease-in-out infinite;
}
@keyframes glow {
  50% { filter: brightness(1.18); }
}
.shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55));
  pointer-events: none;
}
.front > *:not(.shade) {
  position: relative;
}
.type {
  margin: 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.85;
}
.art {
  width: 110px;
  height: 110px;
  margin: 12px 0 10px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
}
.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.art-fallback {
  font-size: 3rem;
  font-weight: 800;
  opacity: 0.8;
}
.name {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.2;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}
.tier {
  margin: 6px 0 0;
  font-size: 1.15rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}
.value {
  margin: auto 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}
.card.small {
  width: 160px;
  height: 232px;
}
.card.small .front {
  padding: 10px 8px;
}
.card.small .art {
  width: 84px;
  height: 84px;
  margin: 8px 0 6px;
}
.card.small .name {
  font-size: 0.92rem;
}
.card.small .tier {
  font-size: 0.95rem;
  margin-top: 3px;
}
.card.small .type {
  font-size: 0.62rem;
}
.card.small .value {
  font-size: 0.8rem;
}
@media (prefers-reduced-motion: reduce) {
  .inner { transition: none; }
  .card.flipped.rare .front { animation: none; }
}
</style>
