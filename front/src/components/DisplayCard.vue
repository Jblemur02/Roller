<template>
  <div
    :class="['roll', rollClass(tier.name), { hovered }]"
    @mouseover="applyHoverBrightness"
    :style="{
      color: tier.color,
      boxShadow: tier.aura,
      background:
        tier.backgroundType === 'image'
          ? `url(${tier.background}) no-repeat center center / cover`
          : tier.background,
    }"
  >
    <p>{{ type }}</p>
    <img :src="image" :alt="type" />
    <h1>{{ name }}</h1>
    <h2
      :class="['tier', tierClass(tier.name)]"
      :style="{ fontFamily: tier.font }"
    >
      {{ tier.name }}
    </h2>
    <p>
      Base Value: {{ value }}
      <span
        ><img
          id="chronos_logo"
          src="../components/images/chronos_logo.png"
          alt="Chronos Logo"
      /></span>
    </p>
  </div>
</template>

<script>
export default {
  props: {
    name: String,
    type: String,
    image: String,
    tier: Object,
    value: Number,
  },
  data() {
    return {
      hovered: false,
    }
  },
  methods: {
    rollClass(tierName) {
      return `tier-${tierName.toLowerCase().replace(/\s/g, '-')}`
    },
    tierClass(tierName) {
      return `font-${tierName.toLowerCase().replace(/\s/g, '-')}`
    },
    applyHoverBrightness() {
      this.hovered = true
    },
  },
}
</script>

<style scoped>
.hovered {
  filter: brightness(1.1);
}

.roll {
  box-shadow: var(--shadow);
  width: 250px;
  height: 350px;
  margin: 10px;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-shadow:
    rgba(0, 0, 0, 0.4) 0px 4px 6px,
    rgba(0, 0, 0, 0.3) 0px 8px 16px -4px,
    rgba(0, 0, 0, 0.2) 0px -4px 0px inset;
  transition:
    transform 0.3s ease,
    filter 0.3s ease;
  filter: brightness(0.9);
}

.card-content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

img {
  width: 100px;
  height: 100px;
  border-radius: 5px;
  margin: 10px auto;
}

.card-name {
  font-size: 1.5rem;
  margin: 10px 0;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

.base-value {
  font-size: 1.1rem;
  margin-top: 10px;
}

.roll:hover {
  transform: scale(1.05);
}

.tier-eternal,
.tier-heavenly,
.tier-crimson-dusk,
.tier-abyssal {
  filter: brightness(0.6);
}

.tier-eternal.hovered,
.tier-heavenly.hovered,
.tier-crimson-dusk.hovered,
.tier-abyssal.hovered {
  filter: brightness(1);
}
</style>
