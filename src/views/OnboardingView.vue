<script setup>
import { ref } from 'vue'
import ShardIcon from '../components/ShardIcon.vue'
import { createPlayer, session, STARTING_SHARDS } from '../lib/player.js'

const name = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  const username = name.value.trim()
  if (!/^[\w .-]{3,20}$/.test(username)) {
    error.value = 'Use 3–20 letters, numbers, spaces, dots, dashes or underscores.'
    return
  }
  error.value = ''
  busy.value = true
  try {
    await createPlayer(username)
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="onboard">
    <div class="panel">
      <p class="eyebrow">Welcome to</p>
      <h1>ROLLER</h1>
      <p class="muted">Collect cards, build your gear and trade at the auction house.</p>

      <form @submit.prevent="submit">
        <label for="username">Choose your player name</label>
        <input id="username" v-model="name" maxlength="20" autocomplete="nickname" placeholder="e.g. Jethro" autofocus />
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="primary" type="submit" :disabled="busy">{{ busy ? 'Creating…' : 'Start playing' }}</button>
      </form>

      <p class="gift"><ShardIcon /> You start with {{ STARTING_SHARDS }} Time Shards.</p>
      <p v-if="session.mode === 'cloud'" class="muted small">You're signed in with claude.ai, so your progress saves to your account.</p>
      <p v-else-if="session.reason === 'view-only'" class="muted small">
        You have view-only access to this page, so your progress saves in this browser only. Ask the owner for edit access to trade with other players.
      </p>
      <p v-else-if="session.reason === 'signed-out'" class="muted small">You're not signed in, so your progress saves in this browser only.</p>
      <p v-else class="muted small">Progress saves in this browser.</p>
    </div>
  </section>
</template>

<style scoped>
.onboard {
  min-height: 80vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.panel {
  width: min(440px, 100%);
  text-align: center;
  background: linear-gradient(180deg, #1c1830, #131022);
  border: 1px solid rgba(201, 162, 74, 0.35);
  border-radius: 20px;
  padding: 34px 30px;
}
h1 {
  margin: 4px 0 8px;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.3em;
  color: var(--gold);
  font-size: 2.4rem;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 26px 0 16px;
  text-align: left;
}
label {
  font-weight: 600;
}
input {
  height: 46px;
  font-size: 1.05rem;
}
button {
  height: 46px;
}
.gift {
  margin: 0 0 8px;
}
.small {
  font-size: 0.82rem;
  margin: 0;
}
</style>
