import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 认证模态框状态管理
 * 集中管理登录/注册模态框的显示状态
 */
export const useAuthStore = defineStore('auth', () => {
  // 模态框显示状态
  const showAuthModal = ref(false)
  
  // 模态框初始模式：'login' 或 'register'
  const initialMode = ref('login')

  // 打开登录模态框
  const openLoginModal = () => {
    initialMode.value = 'login'
    showAuthModal.value = true
  }

  // 打开注册模态框
  const openRegisterModal = () => {
    initialMode.value = 'register'
    showAuthModal.value = true
  }

  // 关闭模态框
  const closeAuthModal = () => {
    showAuthModal.value = false
  }

  return {
    showAuthModal,
    initialMode,
    openLoginModal,
    openRegisterModal,
    closeAuthModal
  }
})