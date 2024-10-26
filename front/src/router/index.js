import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StoreView from '../views/StoreView.vue'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:3000'

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
    {
      path: '/catalog',
      name: 'catalog',
      component: () => import('../views/CatalogView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
    },
    {
      path: '/play',
      name: 'play',
      component: () => import('../views/PlayView.vue'),
    },
  ],
})

export default router
