import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store' // Import the Vuex store

const app = createApp(App)

app.use(router)
app.use(store) // Add the store to the app

app.mount('#app')
