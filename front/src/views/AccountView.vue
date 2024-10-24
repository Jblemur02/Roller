<template>
  <main>
    <aside>
      <div id="pic"><img src="" alt="" /></div>
      <h1>{{ user.username }}</h1>
      <ul>
        <li>
          <a
            :class="{ active: selectedTab === 'profile' }"
            @click="selectTab('profile')"
            >Profile
          </a>
        </li>
        <li>
          <a
            :class="{ active: selectedTab === 'collection' }"
            @click="selectTab('collection')"
            >Collection
          </a>
        </li>
        <li>
          <a
            :class="{ active: selectedTab === 'settings' }"
            @click="selectTab('settings')"
          >
            Settings
          </a>
        </li>

        <li>
          <a
            :class="{ active: selectedTab === 'spells' }"
            @click="selectTab('spells')"
          >
            Spells
          </a>
        </li>
      </ul>
    </aside>

    <div class="content" v-if="selectedTab === 'profile'">
      <h2>Profile</h2>
      <p>{{ user.username }}'s profile content</p>
      <p>your Id is{{ user.id }}</p>
    </div>

    <div class="content" v-if="selectedTab === 'collection'">
      <h2>Collection</h2>
      <p>{{ user.username }}'s collection content</p>
    </div>

    <div class="content" v-if="selectedTab === 'settings'">
      <h2>Settings</h2>
      <p>{{ user.username }}'s settings content</p>
    </div>

    <div class="content" v-if="selectedTab === 'spells'">
      <h2>Spells</h2>
      <p>{{ user.username }}'s spells content</p>
    </div>
  </main>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  setup() {
    const store = useStore()
    const user = computed(() => store.state.userData || { username: 'Guest' })

    return {
      user,
    }
  },
  data() {
    return {
      selectedTab: 'profile',
    }
  },
  methods: {
    selectTab(tab) {
      this.selectedTab = tab
    },
  },
}
</script>

<style scoped>
main {
  color: var(--inverse);
  height: 100%;
  display: flex;
  flex-direction: row;
  padding: 1%;
}

aside {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1%;
  width: 5%;
  border: 1px solid var(--primary);
  box-shadow: var(--shadow);
}

aside ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}

aside ul li {
  padding: 10px;
  text-align: center;
  cursor: pointer;
}

aside ul li a {
  text-decoration: none;
  margin: 1% 0;
}

aside ul li a.active {
  background-color: dark-gray;
}

.content {
  width: 100%;
}
</style>
