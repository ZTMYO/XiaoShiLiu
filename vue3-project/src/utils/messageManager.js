import { createApp } from 'vue'
import MessageToast from '@/components/MessageToast.vue'

class MessageManager {
  constructor() {
    this.toasts = []
  }

  show(message, type = 'success', duration = 2000) {
    // 创建容器
    const container = document.createElement('div')
    document.body.appendChild(container)

    // 创建应用实例
    const app = createApp(MessageToast, {
      message,
      type,
      duration,
      onClose: () => {
        app.unmount()
        document.body.removeChild(container)
        // 从数组中移除
        const index = this.toasts.indexOf(app)
        if (index > -1) {
          this.toasts.splice(index, 1)
        }
      }
    })

    // 挂载应用
    app.mount(container)
    this.toasts.push(app)

    return app
  }

  success(message, duration) {
    return this.show(message, 'success', duration)
  }

  error(message, duration) {
    return this.show(message, 'error', duration)
  }

  info(message, duration) {
    return this.show(message, 'info', duration)
  }

  // 清除所有提示
  clear() {
    this.toasts.forEach(app => {
      try {
        app.unmount()
      } catch (e) {
        console.warn('Failed to unmount toast:', e)
      }
    })
    this.toasts = []
  }
}

// 创建全局实例
const messageManager = new MessageManager()

// 导出实例和安装函数
export default messageManager

export function install(app) {
  app.config.globalProperties.$message = messageManager
  app.provide('$message', messageManager)
}