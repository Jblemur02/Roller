import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StoreView from '../views/StoreView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/roll',
      name: 'roll',
      component: () => import('../views/RollView.vue'),
    },
    {
      path: '/store',
      name: 'store',
      component: StoreView,
    },
  ],
})

export default router
