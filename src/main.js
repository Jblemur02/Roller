import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { connect } from './lib/platform.js'
import { start } from './lib/player.js'
import { startAuctions } from './lib/auctions.js'

createApp(App).mount('#app')

connect().then(async platform => {
  await start(platform)
  startAuctions(platform)
})
