/**
 * 防滚动穿透的统一解决方案
 * 当模态框打开时，直接禁用底层页面的滚动
 */
import { ref, onUnmounted } from 'vue'

// 全局状态，记录当前有多少个模态框在使用滚动锁定
const lockCount = ref(0)
// 保存原始的body样式
let originalBodyStyle = ''

/**
 * 锁定页面滚动
 */
const lockScroll = () => {
  if (lockCount.value === 0) {
    // 第一次锁定时，保存原始样式
    originalBodyStyle = document.body.style.cssText
    
    // 获取当前滚动位置
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    
    // 设置body样式来禁用滚动
    document.body.style.cssText = `
      ${originalBodyStyle}
      position: fixed;
      top: -${scrollTop}px;
      left: 0;
      right: 0;
      width: 100%;
      overflow: hidden;
    `
  }
  lockCount.value++
}

/**
 * 解锁页面滚动
 */
const unlockScroll = () => {
  if (lockCount.value > 0) {
    lockCount.value--
    
    if (lockCount.value === 0) {
      // 最后一个模态框关闭时，恢复滚动
      const scrollTop = Math.abs(parseInt(document.body.style.top) || 0)
      
      // 恢复原始样式
      document.body.style.cssText = originalBodyStyle
      
      // 恢复滚动位置
      window.scrollTo(0, scrollTop)
    }
  }
}

/**
 * 使用滚动锁定的组合式函数
 */
export function useScrollLock() {
  let isLocked = false
  
  const lock = () => {
    if (!isLocked) {
      lockScroll()
      isLocked = true
    }
  }
  
  const unlock = () => {
    if (isLocked) {
      unlockScroll()
      isLocked = false
    }
  }
  
  // 组件卸载时自动解锁
  onUnmounted(() => {
    unlock()
  })
  
  return {
    lock,
    unlock,
    isLocked: () => isLocked
  }
}