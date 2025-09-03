import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 关于模态框状态管理
 * 集中管理关于小石榴模态框的显示状态
 */
export const useAboutStore = defineStore('about', () => {
  // 模态框显示状态
  const showAboutModal = ref(false)

  // 打开关于模态框
  const openAboutModal = () => {
    showAboutModal.value = true
  }

  // 关闭关于模态框
  const closeAboutModal = () => {
    showAboutModal.value = false
  }

  return {
    showAboutModal,
    openAboutModal,
    closeAboutModal
  }
})