import { createStore } from 'vuex'

export default createStore({
  state: {
    isAuthenticated: !!localStorage.getItem('token'), // Check if token exists
    userData: JSON.parse(localStorage.getItem('userData')) || null, // Retrieve user data
  },
  mutations: {
    setUser(state, user) {
      state.userData = user
      state.isAuthenticated = true
      localStorage.setItem('userData', JSON.stringify(user))
    },
    clearUser(state) {
      state.userData = null
      state.isAuthenticated = false
      localStorage.removeItem('userData')
    },
    updateTimeShards(state, amount) {
      state.userData.time_shards += amount
    },
  },
  actions: {
    login({ commit }, user) {
      commit('setUser', user)
    },
    logout({ commit }) {
      localStorage.removeItem('token')
      commit('clearUser')
    },
    async updateUserData({ state }) {
      if (!state.userData.userId || state.userData.time_shards === undefined) {
        console.error('Missing required data for update')
        return
      }
      try {
        console.log('User Data Before Update:', state.userData) // Log the user data

        const response = await fetch('http://localhost:3000/users/updateUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: state.userData.userId, // Correct key name for ID
            time_shards: state.userData.time_shards,
          }),
        })

        if (!response.ok) {
          const errorDetails = await response.json()
          throw new Error(`Failed to update user data: ${errorDetails.message}`)
        }

        console.log('User data updated successfully in the database')
      } catch (error) {
        console.error('Error updating user data:', error)
      }
    },
  },
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    userData: state => state.userData,
  },
})
