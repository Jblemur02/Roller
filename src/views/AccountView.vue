<script setup>
import { computed, ref } from 'vue'
import ProfileTab from './account/ProfileTab.vue'
import CollectionTab from './account/CollectionTab.vue'
import GearTab from './account/GearTab.vue'
import DeckTab from './account/DeckTab.vue'
import { route, go } from '../lib/router.js'

const TABS = [
  { id: 'profile', label: 'Profile', component: ProfileTab },
  { id: 'collection', label: 'Collection', component: CollectionTab },
  { id: 'gear', label: 'Gear', component: GearTab },
  { id: 'deck', label: 'Deck', component: DeckTab },
]
const current = computed(() => TABS.find(t => t.id === route.name) || TABS[0])

const notice = ref('')
let timer
function showNotice(msg) {
  notice.value = msg
  clearTimeout(timer)
  timer = setTimeout(() => (notice.value = ''), 4000)
}
</script>

<template>
  <section class="account">
    <aside>
      <button v-for="t in TABS" :key="t.id" :class="{ active: current.id === t.id }" @click="go(t.id)">
        {{ t.label }}
      </button>
    </aside>
    <div class="content">
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <component :is="current.component" @notice="showNotice" />
    </div>
  </section>
</template>

<style scoped>
.account {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 60px;
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 28px;
}
aside {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: sticky;
  top: 90px;
  align-self: start;
}
aside button {
  text-align: left;
  background: none;
  border: none;
  color: #cfcfe0;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
}
aside button:hover {
  background: rgba(255, 255, 255, 0.06);
}
aside button.active {
  background: rgba(201, 162, 74, 0.15);
  color: var(--gold);
}
@media (max-width: 760px) {
  .account {
    grid-template-columns: 1fr;
  }
  aside {
    flex-direction: row;
    position: static;
    overflow-x: auto;
  }
}
.notice {
  background: rgba(80, 200, 120, 0.12);
  border: 1px solid rgba(80, 200, 120, 0.4);
  padding: 10px 14px;
  border-radius: 10px;
  margin: 0 0 16px;
}
</style>
