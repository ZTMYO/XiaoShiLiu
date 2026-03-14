import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import {
  getSavedTheme,
  setTheme as setThemeUtil,
  getSystemTheme,
  themeOptions
} from '@/utils/themeUtils'

export const useThemeStore = defineStore('theme', () => {
  // 当前主题设置（system/light/dark）
  const currentTheme = ref(getSavedTheme())

  // 实际应用的主题（light/dark）
  const actualTheme = computed(() => {
    if (currentTheme.value === 'system') {
      return getSystemTheme()
    }
    return currentTheme.value
  })

  // 是否为深色主题
  const isDark = computed(() => actualTheme.value === 'dark')

  // 是否为浅色主题
  const isLight = computed(() => actualTheme.value === 'light')

  // 是否跟随系统
  const isSystem = computed(() => currentTheme.value === 'system')

  // 设置主题
  const setTheme = (theme) => {
    currentTheme.value = theme
    setThemeUtil(theme)
  }

  // 切换到下一个主题
  const toggleTheme = () => {
    const currentIndex = themeOptions.findIndex(option => option.value === currentTheme.value)
    const nextIndex = (currentIndex + 1) % themeOptions.length
    setTheme(themeOptions[nextIndex].value)
  }

  //切换主题但省略跟随系统，只有亮暗切换
  const toggleTwoTheme = () => {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = () => {
    if (currentTheme.value === 'system') {
      setThemeUtil('system')
    }
  }

  // 初始化监听器
  mediaQuery.addEventListener('change', handleSystemThemeChange)

  // 组件卸载时清理事件监听器
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  })

  return {
    // 状态
    currentTheme,
    actualTheme,
    isDark,
    isLight,
    isSystem,

    // 方法
    setTheme,
    toggleTheme,
    toggleTwoTheme,
    // 配置
    themeOptions
  }
})