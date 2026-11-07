<script setup>
const props = defineProps({ modelValue: Number, max: Number })
const emit = defineEmits(['update:modelValue'])
function set(v) {
  const n = Math.floor(Number(v))
  emit('update:modelValue', Math.min(props.max, Math.max(1, Number.isFinite(n) ? n : 1)))
}
</script>

<template>
  <div class="qty">
    <button type="button" aria-label="Fewer" :disabled="modelValue <= 1" @click="set(modelValue - 1)">−</button>
    <input type="number" min="1" :max="max" :value="modelValue" aria-label="Quantity" @change="set($event.target.value)" />
    <button type="button" aria-label="More" :disabled="modelValue >= max" @click="set(modelValue + 1)">+</button>
    <button type="button" class="all" :disabled="modelValue >= max" @click="set(max)">All ({{ max }})</button>
  </div>
</template>

<style scoped>
.qty {
  display: flex;
  gap: 6px;
  align-items: center;
}
button {
  min-width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 1.1rem;
}
button.all {
  font-size: 0.85rem;
  padding: 0 12px;
}
button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
input {
  width: 70px;
  height: 38px;
  text-align: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #0e0c18;
  color: #fff;
  font: inherit;
  font-size: 1rem;
}
</style>
