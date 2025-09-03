<template>
  <div class="theme-switcher-menu-item">
    <div class="theme-item-content">
      <span class="theme-label">深色模式</span>
      <div class="theme-toggle-container">
        <div class="theme-toggle-track">

          <div class="theme-toggle-indicator" :style="{ transform: `translateX(${indicatorPosition}px)` }"></div>


          <div v-for="(option, index) in themeStore.themeOptions" :key="option.value" class="theme-option-wrapper">
            <button class="theme-toggle-option" :class="{ 'active': themeStore.currentTheme === option.value }"
              @click="themeStore.setTheme(option.value)">
              <SvgIcon :name="option.icon" width="14" height="14" />
            </button>
            <div class="tooltip">{{ option.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 计算指示器位置
const indicatorPosition = computed(() => {
  const index = themeStore.themeOptions.findIndex(option => option.value === themeStore.currentTheme)
  return index * 28 // 每个按钮宽度28px
})
</script>

<style scoped>
.theme-switcher-menu-item {
  padding: 8px 4px;
  margin: 4px;
  border-radius: 999px;
}

.theme-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  gap: 20px;
}

.theme-label {
  font-size: 16px;
  color: var(--text-color-primary);
  font-weight: 400;
  flex-shrink: 0;
}

.theme-toggle-container {
  display: inline-block;
  flex-shrink: 0;
}

.theme-toggle-track {
  position: relative;
  display: flex;
  background: var(--bg-color-secondary);
  border-radius: 16px;
  padding: 2px;
  border: 1px solid var(--border-color-primary);
}

.theme-option-wrapper {
  position: relative;
  display: inline-block;
}

.theme-toggle-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  background: var(--bg-color-primary);
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.theme-toggle-option {
  position: relative;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  color: var(--text-color-tertiary);
}

.theme-toggle-option:hover {
  color: var(--text-color-secondary);
}

.theme-toggle-option.active {
  color: var(--text-color-primary);
}

/* Tooltip 样式 */
.tooltip {
  position: absolute;
  bottom: 35px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color-primary);
  z-index: 10;
  pointer-events: none;
}

.theme-option-wrapper:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

/* 确保图标在按钮中完全居中 */
.theme-toggle-option :deep(svg) {
  display: block;
  margin: auto;
}

/* 深色主题下的样式调整 */
[data-theme="dark"] .theme-toggle-indicator {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>