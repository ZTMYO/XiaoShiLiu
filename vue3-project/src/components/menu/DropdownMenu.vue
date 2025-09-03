<template>
  <div class="dropdown-container" ref="dropdownRef">

    <div class="dropdown-trigger" @click="toggleDropdown">
      <slot name="trigger"></slot>
    </div>


    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu" :class="[
        direction === 'up' ? 'dropdown-up' : 'dropdown-down',
        menuClass
      ]">
        <slot name="menu"></slot>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 弹出方向：'up' 或 'down'
  direction: {
    type: String,
    default: 'down'
  },
  // 自定义菜单样式类
  menuClass: {
    type: String,
    default: ''
  }
})

const isOpen = ref(false)
const dropdownRef = ref(null)

// 切换下拉菜单
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

// 关闭下拉菜单
const closeDropdown = () => {
  isOpen.value = false
}

// 点击外部关闭
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-container {
  position: relative;
}

.dropdown-trigger {
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  z-index: 1000;
  min-width: 200px;
  background: var(--bg-color-primary);
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-color);
  padding: 2px 0;
  backdrop-filter: blur(10px);
}

.dropdown-down {
  top: 100%;
  margin-top: 4px;
  left: 0;
}

.dropdown-up {
  bottom: 100%;
  margin-bottom: 4px;
  left: 0;
}

/* 过渡动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
  transform-origin: top left;
}

.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

/* 向上弹出的动画 */
.dropdown-up.dropdown-enter-active,
.dropdown-up.dropdown-leave-active {
  transform-origin: bottom left;
}

.dropdown-up.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

.dropdown-up.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>