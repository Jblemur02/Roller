<script setup>
// Full-screen reveal for cards above Legendary.
// Timeline: build-up (card back shakes and glows) → flash + burst as the card flips → celebration.
// Click or press a key to skip ahead; it also continues by itself.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import GameCard from './GameCard.vue'

const props = defineProps({
  card: { type: Object, required: true },
  theme: { type: Object, required: true },
})
const emit = defineEmits(['done'])

const BUILD_MS = 1150
const TOTAL_MS = 4300

const phase = ref('build') // build | revealed
const canvas = ref(null)
const runeChars = computed(() => [...(props.theme.runes || '')])
const timers = []
let raf = 0
let finished = false

const rootStyle = computed(() => ({
  '--glow': props.theme.glow,
  '--bg': props.theme.bg,
  '--c1': props.theme.colors[0],
  '--c2': props.theme.colors[1],
  '--c3': props.theme.colors[2],
}))

// ---------- particles ----------

const rand = (a, b) => a + Math.random() * (b - a)
const pick = arr => arr[(Math.random() * arr.length) | 0]
let parts = []
let w = 0
let h = 0
let cx = 0
let cy = 0
let ctx = null
let spawnCarry = 0

function resize() {
  const c = canvas.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = window.innerWidth
  h = window.innerHeight
  c.width = w * dpr
  c.height = h * dpr
  c.style.width = w + 'px'
  c.style.height = h + 'px'
  ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  cx = w / 2
  cy = h * 0.45
}

function makeAmbient() {
  const { mode, size, shape } = props.theme.ambient
  const base = { color: pick(props.theme.colors), size: rand(size[0], size[1]), shape, life: 1, rot: rand(0, 6.28) }
  const scale = Math.min(w, h)
  switch (mode) {
    case 'rise':
      return { ...base, x: rand(0, w), y: h + 10, vx: rand(-0.4, 0.4), vy: -rand(0.8, 2.8), decay: rand(0.003, 0.008), sway: rand(0, 6.28) }
    case 'fall':
      return { ...base, color: pick(['#ffffff', '#eaf4ff', props.theme.colors[1]]), x: rand(0, w), y: -15, vx: rand(-0.6, 0.6), vy: rand(0.6, 1.5), vr: rand(-0.03, 0.03), decay: 0.002, sway: rand(0, 6.28) }
    case 'vortex': {
      const a = rand(0, 6.28)
      const r = rand(0.45, 0.75) * Math.max(w, h)
      return { ...base, mode, a, r, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, decay: 0 }
    }
    case 'warp': {
      const a = rand(0, 6.28)
      const r = rand(0, 30)
      return { ...base, mode, a, r, s: rand(0.6, 2), x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, decay: 0 }
    }
    case 'orbit': {
      const a = rand(0, 6.28)
      const r = rand(0.22, 0.45) * scale
      return { ...base, mode, a, r, va: rand(0.008, 0.025) * (Math.random() < 0.5 ? -1 : 1), x: 0, y: 0, decay: rand(0.004, 0.009) }
    }
  }
}

function burst() {
  const { count, speed, size, shape } = props.theme.burst
  const n = window.innerWidth < 600 ? Math.round(count * 0.6) : count
  for (let i = 0; i < n; i++) {
    const a = rand(0, 6.28)
    const s = rand(speed[0], speed[1])
    parts.push({
      x: cx + Math.cos(a) * 30,
      y: cy + Math.sin(a) * 40,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      drag: 0.94,
      color: pick(props.theme.colors),
      size: rand(size[0], size[1]),
      shape,
      life: 1,
      decay: rand(0.008, 0.018),
      rot: rand(0, 6.28),
    })
  }
}

function step(p) {
  p.px = p.x
  p.py = p.y
  if (p.mode === 'vortex') {
    p.r *= phase.value === 'build' ? 0.955 : 0.975
    p.a += 0.05
    p.x = cx + Math.cos(p.a) * p.r
    p.y = cy + Math.sin(p.a) * p.r * 0.8
    if (p.r < 25) p.life = 0
    return
  }
  if (p.mode === 'warp') {
    p.s *= 1.07
    p.r += p.s
    p.x = cx + Math.cos(p.a) * p.r
    p.y = cy + Math.sin(p.a) * p.r
    if (p.r > Math.max(w, h)) p.life = 0
    return
  }
  if (p.mode === 'orbit') {
    p.a += p.va
    p.x = cx + Math.cos(p.a) * p.r
    p.y = cy + Math.sin(p.a) * p.r * 0.55
    p.life -= p.decay
    return
  }
  if (p.drag) {
    p.vx *= p.drag
    p.vy *= p.drag
  }
  if (p.sway !== undefined) {
    p.sway += 0.03
    p.x += Math.sin(p.sway) * 0.4
  }
  if (p.vr) p.rot += p.vr
  p.x += p.vx
  p.y += p.vy
  p.life -= p.decay
  if (p.y < -30 || p.y > h + 30) p.life = 0
}

function draw(p) {
  const a = Math.max(0, Math.min(1, p.life))
  ctx.globalAlpha = a
  ctx.fillStyle = p.color
  ctx.strokeStyle = p.color
  switch (p.shape) {
    case 'dot':
    case 'ember': {
      const flicker = p.shape === 'ember' ? 0.6 + Math.random() * 0.4 : 1
      ctx.globalAlpha = a * 0.25 * flicker
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 3, 0, 6.28)
      ctx.fill()
      ctx.globalAlpha = a * flicker
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, 6.28)
      ctx.fill()
      break
    }
    case 'spark':
    case 'streak': {
      const px = p.px ?? p.x
      const py = p.py ?? p.y
      const k = p.shape === 'spark' ? 2.2 : 3
      ctx.lineWidth = p.size
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(p.x - (p.x - px) * k, p.y - (p.y - py) * k)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      break
    }
    case 'feather': {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = a * 0.75
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * 0.38, p.size, 0, 0, 6.28)
      ctx.fill()
      ctx.restore()
      break
    }
    case 'star': {
      const s = p.size * (1.5 + Math.sin(performance.now() / 120 + p.rot) * 0.8)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(p.x - s * 2, p.y)
      ctx.lineTo(p.x + s * 2, p.y)
      ctx.moveTo(p.x, p.y - s * 2)
      ctx.lineTo(p.x, p.y + s * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 0.8, 0, 6.28)
      ctx.fill()
      break
    }
  }
}

function frame() {
  if (!ctx) return
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'lighter'

  const rate = props.theme.ambient.rate * (phase.value === 'revealed' ? 1.4 : 1) * (w < 600 ? 0.6 : 1)
  spawnCarry += rate
  while (spawnCarry >= 1 && parts.length < 900) {
    parts.push(makeAmbient())
    spawnCarry -= 1
  }
  for (const p of parts) {
    step(p)
    draw(p)
  }
  parts = parts.filter(p => p.life > 0)
  raf = requestAnimationFrame(frame)
}

// ---------- timeline ----------

function revealNow() {
  if (phase.value === 'revealed') return
  phase.value = 'revealed'
  burst()
}

function finish() {
  if (finished) return
  finished = true
  emit('done')
}

function advance() {
  if (phase.value === 'build') revealNow()
  else finish()
}

function onKey(e) {
  e.preventDefault()
  e.stopPropagation()
  advance()
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', onKey, true)
  raf = requestAnimationFrame(frame)
  timers.push(setTimeout(revealNow, BUILD_MS))
  timers.push(setTimeout(finish, TOTAL_MS))
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  timers.forEach(clearTimeout)
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', onKey, true)
})
</script>

<template>
  <div
    class="reveal"
    :class="['theme-' + theme.key, phase, { shake: theme.shake && phase === 'revealed' }]"
    :style="rootStyle"
    role="dialog"
    aria-modal="true"
    :aria-label="`${card.tier.name} ${card.name}`"
    @click="advance"
  >
    <div class="bg"></div>

    <!-- themed layers -->
    <div v-if="theme.layers.includes('nebula')" class="fx nebula"></div>
    <div v-if="theme.layers.includes('beam')" class="fx beam"></div>
    <div v-if="theme.layers.includes('moon')" class="fx moon"></div>
    <div v-if="theme.layers.includes('void')" class="fx void"></div>
    <div v-if="theme.layers.includes('ripple')" class="fx ripples"><i></i><i></i><i></i></div>
    <div v-if="theme.layers.includes('eclipse')" class="fx eclipse"><span class="sun"></span><span class="disc"></span></div>
    <div v-if="theme.layers.includes('rays')" class="fx rays"></div>
    <div v-if="theme.layers.includes('halo')" class="fx halo"></div>
    <div v-if="theme.layers.includes('runes')" class="fx runes">
      <span v-for="(r, i) in runeChars" :key="i" :style="{ transform: `rotate(${(360 / runeChars.length) * i}deg) translateY(calc(var(--rune-r) * -1))` }">{{ r }}</span>
    </div>
    <div v-if="theme.layers.includes('flames')" class="fx flames"></div>
    <div v-if="theme.layers.includes('vignette')" class="fx vignette"></div>

    <canvas ref="canvas" class="particles"></canvas>
    <div class="flash"></div>

    <div class="stage">
      <div class="card-holder">
        <GameCard :card="card" :revealed="phase === 'revealed'" />
      </div>
      <div class="caption">
        <p class="tier" :style="{ fontFamily: card.tier.font }">{{ card.tier.name }}</p>
        <p class="name">{{ card.name }}</p>
      </div>
    </div>

    <p class="hint">{{ phase === 'build' ? 'Click to reveal' : 'Click to continue' }}</p>
  </div>
</template>

<style scoped>
.reveal {
  position: fixed;
  inset: 0;
  z-index: 300;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  animation: fade-in 0.3s ease-out;
  --rune-r: min(34vh, 40vw);
}
@keyframes fade-in {
  from { opacity: 0; }
}
.bg {
  position: absolute;
  inset: 0;
  background: var(--bg);
  background-color: #000;
  transition: filter 0.6s;
  filter: brightness(0.55);
}
.revealed .bg {
  filter: brightness(1);
}
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.fx {
  position: absolute;
  pointer-events: none;
}

/* ---- flash on flip ---- */
.flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 45%, #fff 0%, var(--glow) 35%, transparent 70%);
  opacity: 0;
  pointer-events: none;
}
.revealed .flash {
  animation: flash 0.9s ease-out;
}
@keyframes flash {
  0% { opacity: 0; }
  12% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---- screen shake ---- */
.shake .stage,
.shake .fx {
  animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
@keyframes shake {
  10%, 90% { translate: -2px 1px; }
  20%, 80% { translate: 5px -3px; }
  30%, 50%, 70% { translate: -9px 4px; }
  40%, 60% { translate: 9px -4px; }
}

/* ---- the card ---- */
.stage {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding-bottom: 6vh;
}
.card-holder {
  --card-scale: 1.35;
  scale: var(--card-scale);
  animation: rise-in 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.1);
}
.build .card-holder {
  animation: rise-in 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.1), tremble 0.09s linear 0.7s infinite;
  filter: drop-shadow(0 0 24px var(--glow)) drop-shadow(0 0 60px var(--glow));
}
.revealed .card-holder {
  animation: pop 0.6s cubic-bezier(0.2, 1.6, 0.4, 1);
  filter: drop-shadow(0 0 30px var(--glow));
}
@keyframes rise-in {
  from { transform: translateY(80px) scale(0.5); opacity: 0; }
}
@keyframes tremble {
  0% { transform: translate(0, 0) rotate(0) scale(1); }
  25% { transform: translate(-2px, 1px) rotate(-0.6deg) scale(1.01); }
  50% { transform: translate(2px, -1px) rotate(0.6deg) scale(1.02); }
  75% { transform: translate(-1px, -2px) rotate(-0.3deg) scale(1.01); }
}
@keyframes pop {
  0% { transform: scale(0.82); }
  60% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@media (max-width: 600px), (max-height: 640px) {
  .card-holder { --card-scale: 1.05; }
}

.caption {
  text-align: center;
  opacity: 0;
  margin-top: 40px;
}
.revealed .caption {
  animation: caption-in 0.8s 0.25s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
}
@keyframes caption-in {
  from { opacity: 0; transform: translateY(20px); letter-spacing: 0.6em; }
  to { opacity: 1; transform: none; letter-spacing: 0.12em; }
}
.caption p {
  margin: 0;
}
.tier {
  font-size: clamp(2rem, 6vw, 3.6rem);
  color: #fff;
  text-transform: uppercase;
  text-shadow: 0 0 12px var(--glow), 0 0 32px var(--glow), 0 0 64px var(--glow);
}
.name {
  margin-top: 6px !important;
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  opacity: 0.9;
}
.hint {
  position: absolute;
  bottom: 18px;
  width: 100%;
  text-align: center;
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.5;
}

/* ---- rays (Eternal) ---- */
.rays {
  left: 50%;
  top: 45%;
  width: 220vmax;
  height: 220vmax;
  margin: -110vmax 0 0 -110vmax;
  background: repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--glow) 55%, transparent) 0deg 5deg, transparent 5deg 18deg);
  mask: radial-gradient(circle, #000 0%, transparent 45%);
  opacity: 0.2;
  animation: spin 30s linear infinite;
  transition: opacity 0.8s;
}
.revealed .rays {
  opacity: 0.9;
}
@keyframes spin {
  to { rotate: 360deg; }
}

/* ---- halo ring ---- */
.halo {
  left: 50%;
  top: 45%;
  width: min(70vh, 80vw);
  height: min(70vh, 80vw);
  translate: -50% -50%;
  border-radius: 50%;
  border: 3px solid var(--c1);
  box-shadow: 0 0 40px var(--glow), inset 0 0 40px var(--glow);
  opacity: 0;
  scale: 0.3;
}
.revealed .halo {
  animation: halo 1.2s cubic-bezier(0.2, 0.9, 0.3, 1) forwards, breathe 2.4s 1.2s ease-in-out infinite;
}
@keyframes halo {
  0% { opacity: 1; scale: 0.3; }
  100% { opacity: 0.85; scale: 1; }
}
@keyframes breathe {
  50% { scale: 1.04; opacity: 0.6; }
}

/* ---- rune circle (Eternal, Mythic, Mystical) ---- */
.runes {
  left: 50%;
  top: 45%;
  width: 0;
  height: 0;
  animation: spin 22s linear infinite;
  opacity: 0.35;
  transition: opacity 0.6s;
}
.runes span {
  position: absolute;
  left: -0.5em;
  top: -0.6em;
  width: 1em;
  text-align: center;
  font-size: clamp(1.1rem, 3vh, 1.8rem);
  color: var(--c1);
  font-family: 'Noto Sans Runic', 'Segoe UI Historic', 'Segoe UI Symbol', sans-serif;
  text-shadow: 0 0 10px var(--glow), 0 0 20px var(--glow);
}
.revealed .runes {
  opacity: 1;
}

/* ---- heavenly beam ---- */
.beam {
  left: 50%;
  top: -10%;
  width: 40vw;
  height: 120%;
  translate: -50% 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(180, 220, 255, 0.4) 50%, transparent 85%);
  clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%);
  filter: blur(12px);
  opacity: 0;
  scale: 0.2 1;
}
.build .beam {
  animation: beam-build 1.1s ease-in forwards;
}
.revealed .beam {
  opacity: 0.85;
  scale: 1 1;
  transition: scale 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.5s;
}
@keyframes beam-build {
  to { opacity: 0.5; scale: 0.35 1; }
}

/* ---- crimson moon ---- */
.moon {
  left: 50%;
  top: 30%;
  width: min(62vh, 70vw);
  height: min(62vh, 70vw);
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #ff6a4d, #c40000 45%, #4a0000 80%);
  box-shadow: 0 0 80px 20px rgba(255, 0, 0, 0.55), 0 0 200px 60px rgba(160, 0, 0, 0.45);
  translate: -50% 40%;
  opacity: 0.4;
  transition: translate 1.1s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 1s;
}
.build .moon {
  animation: moon-rise 1.15s cubic-bezier(0.3, 0.6, 0.4, 1) forwards;
}
.revealed .moon {
  translate: -50% -50%;
  opacity: 0.9;
}
@keyframes moon-rise {
  to { translate: -50% -30%; opacity: 0.75; }
}
.vignette {
  inset: 0;
  box-shadow: inset 0 0 160px 60px rgba(120, 0, 0, 0.9);
}
.revealed .vignette {
  animation: pulse-red 1.6s ease-in-out infinite;
}
@keyframes pulse-red {
  50% { box-shadow: inset 0 0 220px 90px rgba(200, 0, 0, 0.9); }
}

/* ---- abyssal void + ripples ---- */
.void {
  left: 50%;
  top: 45%;
  width: 60vmin;
  height: 60vmin;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(circle, #000 35%, rgba(60, 0, 110, 0.8) 55%, transparent 70%);
  box-shadow: 0 0 120px 30px rgba(156, 8, 255, 0.5);
}
.build .void {
  animation: void-pull 1.15s ease-in forwards;
}
.revealed .void {
  animation: void-blast 0.9s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
}
@keyframes void-pull {
  from { scale: 1.6; }
  to { scale: 0.45; }
}
@keyframes void-blast {
  from { scale: 0.45; }
  to { scale: 2.6; opacity: 0.55; }
}
.ripples i {
  position: absolute;
  left: 50vw;
  top: 45vh;
  width: 30vmin;
  height: 30vmin;
  margin: -15vmin 0 0 -15vmin;
  border-radius: 50%;
  border: 2px solid var(--c1);
  box-shadow: 0 0 20px var(--glow);
  opacity: 0;
}
.revealed .ripples i {
  animation: ripple 2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
}
.revealed .ripples i:nth-child(2) { animation-delay: 0.45s; }
.revealed .ripples i:nth-child(3) { animation-delay: 0.9s; }
@keyframes ripple {
  0% { scale: 0.3; opacity: 0.9; }
  100% { scale: 5; opacity: 0; }
}

/* ---- cosmic nebula ---- */
.nebula {
  inset: -30%;
  background:
    radial-gradient(ellipse at 30% 40%, rgba(196, 139, 255, 0.35), transparent 40%),
    radial-gradient(ellipse at 70% 55%, rgba(80, 140, 255, 0.35), transparent 45%),
    radial-gradient(ellipse at 50% 70%, rgba(255, 120, 200, 0.2), transparent 40%);
  filter: blur(20px);
  animation: spin 40s linear infinite;
  opacity: 0.6;
  transition: opacity 0.8s;
}
.revealed .nebula {
  opacity: 1;
}

/* ---- eclipse ---- */
.eclipse {
  left: 50%;
  top: 45%;
  width: min(66vh, 74vw);
  height: min(66vh, 74vw);
  translate: -50% -50%;
}
.eclipse .sun,
.eclipse .disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}
.eclipse .sun {
  background: radial-gradient(circle, #fff6c2 0%, #ffd700 45%, #ff9d00 70%);
  box-shadow: 0 0 80px 20px rgba(255, 200, 0, 0.6);
}
.eclipse .disc {
  background: #000;
  translate: -110% 0;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 1);
}
.build .eclipse .disc {
  animation: eclipse-slide 1.15s cubic-bezier(0.5, 0, 0.5, 1) forwards;
}
.revealed .eclipse .disc {
  translate: 0 0;
  scale: 0.96;
}
.eclipse::before {
  content: '';
  position: absolute;
  inset: -45%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 236, 140, 0.95) 33%, rgba(255, 190, 40, 0.55) 42%, rgba(255, 120, 0, 0.18) 56%, transparent 70%);
  opacity: 0;
  scale: 0.8;
  transition: opacity 0.4s, scale 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.3);
}
.revealed .eclipse::before {
  opacity: 1;
  scale: 1;
  animation: corona 2.4s 0.6s ease-in-out infinite;
}
@keyframes eclipse-slide {
  to { translate: -8% 0; }
}
@keyframes corona {
  50% { scale: 1.07; opacity: 0.85; }
}

/* ---- mythic flames ---- */
.flames {
  left: 0;
  right: 0;
  bottom: -5%;
  height: 55%;
  background:
    radial-gradient(ellipse at 20% 100%, rgba(255, 120, 0, 0.75), transparent 55%),
    radial-gradient(ellipse at 50% 100%, rgba(255, 180, 30, 0.8), transparent 60%),
    radial-gradient(ellipse at 80% 100%, rgba(255, 90, 0, 0.75), transparent 55%);
  filter: blur(18px);
  transform-origin: bottom;
  scale: 1 0.5;
  opacity: 0.5;
  animation: flicker 0.35s ease-in-out infinite alternate;
  transition: scale 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.6s;
}
.revealed .flames {
  scale: 1 1;
  opacity: 1;
}
@keyframes flicker {
  from { filter: blur(18px) brightness(0.9); }
  to { filter: blur(22px) brightness(1.2); }
}

@media (prefers-reduced-motion: reduce) {
  .reveal *,
  .reveal {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
