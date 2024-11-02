// store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    isAuthenticated: !!localStorage.getItem('token'),
    userData: JSON.parse(localStorage.getItem('userData')) || null,
  },
  mutations: {
    updateUserCards(state, cardUpdates) {
      if (state.userData) {
        state.userData.cards = state.userData.cards
          .map(card => {
            const updatedCard = cardUpdates.find(
              update => update.uid === card.uid,
            )
            if (updatedCard) {
              card.quantity -= updatedCard.quantity
              if (card.quantity <= 0) {
                return null
              }
            }
            return card
          })
          .filter(Boolean)
        localStorage.setItem('userData', JSON.stringify(state.userData))
      }
    },
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
      if (state.userData) {
        state.userData.time_shards += amount
        localStorage.setItem('userData', JSON.stringify(state.userData))
      }
    },
    updateChronos(state, amount) {
      if (typeof amount !== 'number' || isNaN(amount)) {
        console.error('Invalid chronos amount:', amount)
        return
      }

      if (state.userData) {
        state.userData.chronos += amount
        localStorage.setItem('userData', JSON.stringify(state.userData))
      }
    },
    setUserCollection(state, payload) {
      state.userCollection = payload
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
    async saveChronos({ state }) {
      try {
        const response = await fetch(
          'http://localhost:3000/users/updateChronos',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: state.userData.userId,
              chronos: state.userData.chronos,
            }),
          },
        )

        if (!response.ok) {
          throw new Error('Failed to update chronos in the database')
        }
      } catch (error) {
        console.error('Error saving chronos:', error)
      }
    },
    async updateUserData({ state }) {
      if (!state.userData?.userId || state.userData.time_shards === undefined) {
        console.error('Missing required data for update')
        return
      }
      try {
        console.log('User Data Before Update:', state.userData)

        const response = await fetch('http://localhost:3000/users/updateUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: state.userData.userId,
            time_shards: state.userData.time_shards,
            chronos: state.userData.chronos,
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
    async fetchUserData({ commit }) {
      try {
        const userId = localStorage.getItem('id')
        if (!userId) {
          throw new Error('User ID not found in localStorage')
        }
        const response = await fetch(`http://localhost:3000/users/${userId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user data from server')
        }
        const userData = await response.json()
        commit('setUser', userData)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    },
    async updateUserCards({ state }, cardUpdates) {
      if (!state.userData?.userId || !state.userData?.cards) {
        console.log('info: ', state.userData)
        console.log(state.userData.cards)
        console.error('User ID or cards data is missing')
        return
      }

      const userId = state.userData.userId

      try {
        const response = await fetch(
          `http://localhost:3000/users/${userId}/updateCards`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cardUpdates }),
          },
        )

        if (!response.ok) {
          const errorDetails = await response.json()
          throw new Error(
            `Failed to update user cards: ${errorDetails.message}`,
          )
        }

        // Update local state only after successful update in backend
        state.userData.cards = state.userData.cards.filter(
          card =>
            !cardUpdates.some(
              update => update.uid === card.uid && update.quantity === 0,
            ),
        )

        console.log('User card storage updated successfully')
      } catch (error) {
        console.error('Error updating user cards:', error)
      }
    },
  },
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    userData: state => state.userData,
  },
})
