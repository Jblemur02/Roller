import { createStore } from 'vuex'

const store = createStore({
  state: {
    token: localStorage.getItem('token') || null, // Initially read from localStorage
  },
  mutations: {
    setToken(state, token) {
      console.log('Setting token:', token) // Log the token
      state.token = token
      localStorage.setItem('token', token) // Save token in localStorage
    },
    removeToken(state) {
      console.log('Removing token') // Log when the token is removed
      state.token = null
      localStorage.removeItem('token') // Remove token from localStorage
    },
  },

  getters: {
    isAuthenticated(state) {
      return !!state.token // Return true if token exists
    },
  },
})

export default store
