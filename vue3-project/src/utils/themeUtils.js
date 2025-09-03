/**
 * 主题工具函数
 * 用于管理应用的主题系统
 */

// 获取系统主题
export const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 应用主题到DOM
export const applyTheme = (theme) => {
  let actualTheme = theme
  if (theme === 'system') {
    actualTheme = getSystemTheme()
  }
  document.documentElement.setAttribute('data-theme', actualTheme)
  return actualTheme
}

// 获取当前保存的主题设置
export const getSavedTheme = () => {
  return localStorage.getItem('theme') || 'system'
}

// 保存主题设置
export const saveTheme = (theme) => {
  localStorage.setItem('theme', theme)
}

// 初始化主题系统
export const initTheme = () => {
  const savedTheme = getSavedTheme()
  const appliedTheme = applyTheme(savedTheme)

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = () => {
    const currentSavedTheme = getSavedTheme()
    if (currentSavedTheme === 'system') {
      applyTheme('system')
    }
  }

  mediaQuery.addEventListener('change', handleSystemThemeChange)

  return {
    savedTheme,
    appliedTheme,
    cleanup: () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }
}

// 设置主题（包含保存和应用）
export const setTheme = (theme) => {
  saveTheme(theme)
  return applyTheme(theme)
}

// 主题选项配置
export const themeOptions = [
  {
    value: 'system',
    label: '跟随系统',
    icon: 'setting'
  },
  {
    value: 'light',
    label: '浅色模式',
    icon: 'sun'
  },
  {
    value: 'dark',
    label: '深色模式',
    icon: 'moon'
  }
]