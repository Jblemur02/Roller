<script setup>
import { computed, ref } from 'vue'
import classes from '../data/classes.json'
import baseStats from '../data/stats.json'
import { player, chooseClass } from '../lib/player.js'
import { route, go } from '../lib/router.js'

const sides = classes.sides
const side = computed(() => sides.find(s => 'play-' + s.id === route.name) || null)
const hovered = ref(null)
const failed = ref({})
const notice = ref('')

function choose(c) {
  chooseClass(side.value.id, c.name)
  notice.value = `You are now a ${c.name} of ${side.value.name}.`
}
const isMine = c => player.profile.side === side.value?.id && player.profile.className === c.name

const base = baseStats.base
</script>

<template>
  <section class="play">
    <!-- Pick a side -->
    <template v-if="!side">
      <div class="hero">
        <p class="eyebrow">Play</p>
        <h1>Choose your class</h1>
        <p class="muted">
          <template v-if="player.profile.className">
            You're a <strong>{{ player.profile.className }}</strong>. Pick a side to look around or change class.
          </template>
          <template v-else>Pick a side, then pick a class.</template>
        </p>
      </div>

      <div class="sides">
        <button
          v-for="s in sides"
          :key="s.id"
          class="side"
          :class="{ open: hovered === s.id, mine: player.profile.side === s.id }"
          :style="{ background: `linear-gradient(170deg, ${s.colors[0]}, ${s.colors[1]})` }"
          @mouseenter="hovered = s.id"
          @mouseleave="hovered = null"
          @focus="hovered = s.id"
          @blur="hovered = null"
          @click="go('play-' + s.id)"
        >
          <img v-if="!failed[s.id]" :src="s.image" alt="" @error="failed[s.id] = true" />
          <span class="shade"></span>
          <span class="side-body">
            <span v-if="player.profile.side === s.id" class="badge">Your side</span>
            <span class="side-name">{{ s.name }}</span>
            <span class="tagline">"{{ s.tagline }}"</span>
            <ul>
              <li v-for="p in s.points" :key="p">{{ p }}</li>
            </ul>
          </span>
        </button>
      </div>

      <p class="soon muted">Battles are being rebuilt. Your class and <a href="#deck">deck</a> will carry over when they're ready.</p>
    </template>

    <!-- A side's classes -->
    <template v-else>
      <button class="back" @click="go('play')">← All sides</button>
      <div class="hero">
        <h1 :style="{ color: side.colors[0] }">{{ side.name }}</h1>
        <p class="quote">"{{ side.quote }}"</p>
      </div>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>

      <div class="classes">
        <article
          v-for="c in side.classes"
          :key="c.name"
          class="class"
          :class="{ mine: isMine(c) }"
          :style="{ '--accent': side.colors[0] }"
        >
          <div class="emblem" :style="{ background: `linear-gradient(160deg, ${side.colors[0]}, ${side.colors[1]})` }">
            {{ c.name.charAt(0) }}
          </div>
          <h3>{{ c.name }}</h3>
          <p class="desc">{{ c.description }}</p>
          <dl>
            <dt>Minions</dt><dd>{{ c.minions }}</dd>
            <dt>Damage</dt><dd>{{ base.aggression.damage }}</dd>
            <dt>Health</dt><dd>{{ base.resilience.health }}</dd>
            <dt>Inner peace</dt><dd>{{ base.inner_peace }}</dd>
          </dl>
          <button v-if="isMine(c)" class="secondary" disabled>Your class</button>
          <button v-else class="primary" @click="choose(c)">Choose {{ c.name }}</button>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.play {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 60px;
}
.hero {
  text-align: center;
  margin-bottom: 26px;
}
.hero h1 {
  margin: 8px 0;
  font-family: 'Cinzel', serif;
  font-size: clamp(1.7rem, 3.5vw, 2.6rem);
}
.hero p {
  margin: 0;
}
.quote {
  font-style: italic;
  opacity: 0.8;
}
.sides {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 18px;
}
.side {
  position: relative;
  height: 420px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0;
  text-align: left;
  transition: transform 0.25s, box-shadow 0.25s;
}
.side:hover,
.side:focus-visible {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
}
.side.mine {
  border-color: var(--gold);
}
.side img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 20%, rgba(0, 0, 0, 0.85));
}
.side-body {
  position: absolute;
  inset: auto 0 0 0;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.badge {
  align-self: flex-start;
  background: var(--gold);
  color: #1a1408;
  font-weight: 700;
  font-size: 0.72rem;
  padding: 3px 10px;
  border-radius: 999px;
}
.side-name {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  font-weight: 700;
}
.tagline {
  font-style: italic;
  opacity: 0.85;
}
.side ul {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 0.88rem;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.25s, max-height 0.3s;
}
.side.open ul {
  opacity: 0.9;
  max-height: 200px;
}
@media (hover: none) {
  .side ul {
    opacity: 0.9;
    max-height: none;
  }
}
.soon {
  text-align: center;
  margin-top: 26px;
}
a {
  color: var(--gold);
}
.back {
  background: none;
  border: none;
  color: #cfcfe0;
  padding: 6px 0;
}
.notice {
  background: rgba(80, 200, 120, 0.12);
  border: 1px solid rgba(80, 200, 120, 0.4);
  padding: 10px 14px;
  border-radius: 10px;
  text-align: center;
}
.classes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}
.class {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.class.mine {
  border-color: var(--gold);
  box-shadow: 0 0 0 1px var(--gold);
}
.emblem {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-family: 'Cinzel', serif;
  font-size: 1.9rem;
  font-weight: 700;
}
h3 {
  margin: 0;
  font-size: 1.3rem;
}
.desc {
  margin: 0;
  opacity: 0.8;
  flex: 1;
}
dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  margin: 0 0 6px;
  font-size: 0.9rem;
}
dt {
  opacity: 0.65;
}
dd {
  margin: 0;
  font-weight: 700;
}
</style>
