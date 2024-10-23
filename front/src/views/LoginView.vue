<template>
  <main>
    <div id="items">
      <div v-if="selection === 'login'">
        <h1>Login</h1>
        <form @submit.prevent="loginUser">
          <input
            type="text"
            placeholder="Username"
            required
            v-model="loginForm.username"
          />
          <input
            type="password"
            placeholder="Password"
            required
            v-model="loginForm.password"
          />
          <button type="submit">Login</button>
          <p>
            Don't have an account?
            <a @click="selection = 'register'">Register</a>
          </p>
        </form>
      </div>

      <div v-if="selection === 'register'">
        <h1>Sign Up</h1>
        <form @submit.prevent="registerUser">
          <input
            type="text"
            placeholder="Username"
            required
            v-model="registerForm.username"
          />
          <input
            type="email"
            placeholder="Email"
            required
            v-model="registerForm.email"
          />
          <input
            type="password"
            placeholder="Password"
            required
            v-model="registerForm.password"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            required
            v-model="registerForm.confirmPassword"
          />
          <button type="submit">Register</button>
          <p>
            Already have an account?
            <a @click="selection = 'login'">Login</a>
          </p>
        </form>
      </div>
    </div>
  </main>
</template>

<script>
import axios from 'axios'
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      selection: 'login',
      loginForm: {
        username: '',
        password: '',
      },
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
    }
  },
  computed: {
    isAuthenticated() {
      return this.$store.state.isAuthenticated
    },
  },
  methods: {
    ...mapActions(['login', 'register']),

    async loginUser() {
      try {
        const response = await axios.post(
          'http://localhost:3000/users/login',
          this.loginForm,
        )

        // Save user data in localStorage
        localStorage.setItem('token', response.data.token) // Ensure your backend returns a token
        localStorage.setItem('username', response.data.username)
        localStorage.setItem('time_shards', response.data.time_shards)
        localStorage.setItem('level', response.data.level)
        localStorage.setItem('chronos', response.data.chronos)

        // Commit user data to Vuex
        this.login(response.data)
        this.$router.push('/account')
      } catch (error) {
        console.error(error.response.data)
        alert('Invalid credentials')
      }
    },
    async registerUser() {
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        return alert('Passwords do not match')
      }

      try {
        await axios.post(
          'http://localhost:3000/users/register',
          this.registerForm,
        )

        alert('Registration successful')
        this.selection = 'login'
      } catch (error) {
        alert('Error registering user')
      }
    },
  },
  mounted() {
    if (this.isAuthenticated) {
      this.$router.push('/account')
    }
  },
}
</script>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin: 0 auto;
}

#items {
  width: 500px;
}

h1 {
  color: var(--primary);
  margin-bottom: 10px;
}

form {
  box-shadow: var(--shadow);
  background-color: var(--inverse);
  padding: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 8px;
}

input:not([type='submit']) {
  border-radius: 8px;
  outline: none;
  padding: 10px;
  margin: 5px;
  border: none;
  box-shadow: var(--shadow);
}

button[type='submit'] {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin: 5px auto;
}

button[type='submit']:hover {
  background-color: var(--primaryh);
}

p {
  text-align: center;
  color: var(--text);
}

p a {
  color: var(--primary);
}

p a:hover {
  color: var(--primaryh);
}
</style>
