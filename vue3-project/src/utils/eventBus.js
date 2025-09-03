import { ref } from 'vue'

// 创建全局事件总线
class EventBus {
  constructor() {
    this.events = {}
  }

  // 监听事件
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  // 移除事件监听
  off(event, callback) {
    if (!this.events[event]) return
    
    const index = this.events[event].indexOf(callback)
    if (index > -1) {
      this.events[event].splice(index, 1)
    }
  }

  // 触发事件
  emit(event, data) {
    if (!this.events[event]) return
    
    this.events[event].forEach(callback => {
      callback(data)
    })
  }

  // 移除所有事件监听
  clear() {
    this.events = {}
  }
}

// 创建全局实例
export const eventBus = new EventBus()

// 定义事件类型常量
export const EVENT_TYPES = {
  USER_LIKED_POST: 'user_liked_post',
  USER_UNLIKED_POST: 'user_unliked_post',
  USER_COLLECTED_POST: 'user_collected_post',
  USER_UNCOLLECTED_POST: 'user_uncollected_post',
  USER_PROFILE_REFRESH: 'user_profile_refresh'
}