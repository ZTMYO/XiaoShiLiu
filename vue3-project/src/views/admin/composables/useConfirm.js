import { ref } from 'vue'

// 全局状态管理确认弹框
const confirmState = ref({
  visible: false,
  title: '确认操作',
  message: '',
  type: 'warning',
  confirmText: '确认',
  cancelText: '取消',
  showCancel: true
})

let resolvePromise = null
let rejectPromise = null

export function useConfirm() {
  const showConfirm = (options) => {
    return new Promise((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject

      // 更新弹框状态
      Object.assign(confirmState.value, {
        visible: true,
        title: options.title || '确认操作',
        message: options.message || '',
        type: options.type || 'warning',
        confirmText: options.confirmText || '确认',
        cancelText: options.cancelText || '取消',
        showCancel: options.showCancel !== false
      })
    })
  }

  const handleConfirm = () => {
    confirmState.value.visible = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
      rejectPromise = null
    }
  }

  const handleCancel = () => {
    confirmState.value.visible = false
    if (rejectPromise) {
      rejectPromise(false)
      resolvePromise = null
      rejectPromise = null
    }
  }

  // 便捷方法
  const confirmDelete = (entityName = '项目', count = 1) => {
    const message = count > 1
      ? `确定要删除选中的 ${count} 个${entityName}吗？`
      : `确定要删除这个${entityName}吗？`

    return showConfirm({
      title: '删除确认',
      message,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消'
    })
  }

  const confirmLogout = () => {
    return showConfirm({
      title: '退出登录',
      message: '确定要退出登录吗？',
      type: 'info',
      confirmText: '退出',
      cancelText: '取消'
    })
  }

  const showError = (message, title = '错误') => {
    return showConfirm({
      title,
      message,
      type: 'error',
      confirmText: '确定',
      showCancel: false
    })
  }

  return {
    confirmState,
    handleConfirm,
    handleCancel,
    confirmDelete,
    confirmLogout,
    showError
  }
}