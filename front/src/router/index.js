import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StoreView from '../views/StoreView.vue'
import axios from 'axios'
import ClassCards from '../components/ClassCards.vue'

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
      path: '/store',
      name: 'store',
      component: StoreView,
    },
    {
      path: '/auction',
      name: 'auction',
      component: () => import('../views/AuctionView.vue'),
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
    {
      path: '/class-cards/:classType',
      component: ClassCards,
      props: true,
    },
  ],
})

export default router
