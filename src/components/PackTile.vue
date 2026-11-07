<script setup>
import { computed, ref } from 'vue'
import ShardIcon from './ShardIcon.vue'
import { isOpenable } from '../lib/packs.js'
import { canAfford } from '../lib/player.js'

const props = defineProps({ item: { type: Object, required: true } })
defineEmits(['open', 'odds'])

const imageFailed = ref(false)
const openable = computed(() => isOpenable(props.item))
const affordable = computed(() => canAfford(props.item.price))
const tileStyle = computed(() => ({
  background: `linear-gradient(165deg, ${props.item.theme[0]}, ${props.item.theme[1]})`,
}))
</script>

<template>
  <article class="tile" :class="{ disabled: !openable }" :style="tileStyle">
    <img v-if="!imageFailed" class="art" :src="item.image" alt="" @error="imageFailed = true" />
    <div class="shade"></div>

    <span v-if="!openable" class="badge">Coming soon</span>

    <div class="body">
      <h3>{{ item.name }}</h3>
      <p class="desc">{{ item.description }}</p>
      <p class="price">{{ item.price.toLocaleString() }} <ShardIcon /></p>

      <button
        class="buy"
        :disabled="!openable || !affordable"
        @click="$emit('open', item)"
      >
        <template v-if="!openable">Not available yet</template>
        <template v-else-if="!affordable">Not enough shards</template>
        <template v-else>Open</template>
      </button>
      <button v-if="openable" class="odds" @click="$emit('odds', item)">View odds</button>
    </div>
  </article>
</template>

<style scoped>
.tile {
  position: relative;
  width: 260px;
  height: 360px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transition: transform 0.25s, box-shadow 0.25s;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.tile:not(.disabled):hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(201, 162, 74, 0.6);
}
.tile.disabled {
  filter: saturate(0.4);
}
.art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(0, 0, 0, 0.85) 80%);
}
.badge {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}
.body {
  position: relative;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
h3 {
  margin: 0;
  font-size: 1.35rem;
}
.desc {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.75;
}
.price {
  margin: 4px 0 8px;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gold);
}
.buy {
  padding: 11px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  font-size: 1rem;
  background: var(--gold);
  color: #1a1408;
  transition: filter 0.2s, transform 0.2s;
}
.buy:not(:disabled):hover {
  filter: brightness(1.12);
  transform: scale(1.02);
}
.buy:disabled {
  background: #3b3b46;
  color: #9a9aa8;
  cursor: not-allowed;
}
.odds {
  background: none;
  border: none;
  color: #cfcfe0;
  font-size: 0.85rem;
  text-decoration: underline;
  padding: 4px;
}
</style>
