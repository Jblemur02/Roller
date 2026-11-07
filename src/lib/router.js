// Tiny hash router: #shop, #auction, #collection, #play-order ...
import { reactive } from 'vue'

export const route = reactive({ name: 'home' })

function read() {
  route.name = location.hash.replace(/^#/, '') || 'home'
}
read()
window.addEventListener('hashchange', read)

export function go(name) {
  if (location.hash.replace(/^#/, '') === name) return
  location.hash = name
  window.scrollTo(0, 0)
}
