<template>
  <div class="dropdown-item" @click="handleClick">
    <div class="dropdown-item-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.dropdown-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 999px;
  margin: 4px;
}

.dropdown-item:hover {
  background: var(--bg-color-secondary);
}

.dropdown-item-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--text-color-primary);
  font-size: 16px;
  line-height: 1.4;
}
</style>