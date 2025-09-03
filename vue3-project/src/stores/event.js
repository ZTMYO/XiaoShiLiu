import { defineStore } from 'pinia'
import { ref, onMounted, onUnmounted } from 'vue'

export const useEventStore = defineStore('event', () => {
  // 事件监听器映射
  const eventListeners = ref(new Map())

  // 添加事件监听器
  const addEventListener = (eventName, handler, target = window) => {
    const key = `${eventName}_${Date.now()}_${Math.random()}`

    target.addEventListener(eventName, handler)

    eventListeners.value.set(key, {
      eventName,
      handler,
      target
    })

    return key
  }

  // 移除事件监听器
  const removeEventListener = (key) => {
    const listener = eventListeners.value.get(key)
    if (listener) {
      listener.target.removeEventListener(listener.eventName, listener.handler)
      eventListeners.value.delete(key)
    }
  }

  // 移除所有事件监听器
  const removeAllEventListeners = () => {
    eventListeners.value.forEach((listener, key) => {
      listener.target.removeEventListener(listener.eventName, listener.handler)
    })
    eventListeners.value.clear()
  }

  // 触发自定义事件
  const dispatchEvent = (eventName, detail = null, target = window) => {
    const event = detail
      ? new CustomEvent(eventName, { detail })
      : new CustomEvent(eventName)

    target.dispatchEvent(event)
  }

  // 浮动按钮刷新相关事件
  const triggerFloatingBtnReload = () => {
    dispatchEvent('floating-btn-reload')
  }

  const triggerFloatingBtnReloadRequest = () => {
    dispatchEvent('floating-btn-reload-request')
  }

  return {
    addEventListener,
    removeEventListener,
    removeAllEventListeners,
    dispatchEvent,
    triggerFloatingBtnReload,
    triggerFloatingBtnReloadRequest
  }
})