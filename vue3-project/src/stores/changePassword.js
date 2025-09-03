import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 修改密码模态框状态管理
 * 集中管理修改密码模态框的显示状态
 */
export const useChangePasswordStore = defineStore('changePassword', () => {
  // 模态框显示状态
  const showChangePasswordModal = ref(false)

  // 打开修改密码模态框
  const openChangePasswordModal = () => {
    showChangePasswordModal.value = true
  }

  // 关闭模态框
  const closeChangePasswordModal = () => {
    showChangePasswordModal.value = false
  }

  return {
    showChangePasswordModal,
    openChangePasswordModal,
    closeChangePasswordModal
  }
})