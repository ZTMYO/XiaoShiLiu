import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUnreadNotificationCount, getUnreadNotificationCountByType } from '@/api/notification.js'

export const useNotificationStore = defineStore('notification', () => {
  // 未读通知数量
  const unreadCount = ref(0)

  // 按类型的未读通知数量
  const unreadCountByType = ref({
    comments: 0,
    likes: 0,
    collections: 0,
    follows: 0
  })

  // 获取未读通知数量
  async function fetchUnreadCount() {
    try {
      const response = await getUnreadNotificationCount()
      unreadCount.value = response.count || 0
      return unreadCount.value
    } catch (error) {
      console.error('获取未读通知数量失败:', error)
      unreadCount.value = 0
      return 0
    }
  }

  // 获取按类型的未读通知数量
  async function fetchUnreadCountByType() {
    try {
      const response = await getUnreadNotificationCountByType()
      unreadCountByType.value = {
        comments: response.comments || 0,
        likes: response.likes || 0,
        collections: response.collections || 0,
        follows: response.follows || 0
      }
      // 同时更新总数
      unreadCount.value = response.total || 0
      return unreadCountByType.value
    } catch (error) {
      console.error('获取按类型的未读通知数量失败:', error)
      unreadCountByType.value = {
        comments: 0,
        likes: 0,
        collections: 0,
        follows: 0
      }
      return unreadCountByType.value
    }
  }

  // 减少未读数量（当标记单个通知为已读时）
  function decrementUnreadCount() {
    if (unreadCount.value > 0) {
      unreadCount.value--
    }
  }

  // 减少特定类型的未读数量
  function decrementUnreadCountByType(type) {
    if (unreadCountByType.value[type] > 0) {
      unreadCountByType.value[type]--
    }
    // 同时减少总数
    if (unreadCount.value > 0) {
      unreadCount.value--
    }
  }

  // 清空未读数量（当标记所有通知为已读时）
  function clearUnreadCount() {
    unreadCount.value = 0
    unreadCountByType.value = {
      comments: 0,
      likes: 0,
      collections: 0,
      follows: 0
    }
  }

  // 重置未读数量（用户登出时）
  function resetUnreadCount() {
    unreadCount.value = 0
    unreadCountByType.value = {
      comments: 0,
      likes: 0,
      collections: 0,
      follows: 0
    }
  }

  return {
    unreadCount,
    unreadCountByType,
    fetchUnreadCount,
    fetchUnreadCountByType,
    decrementUnreadCount,
    decrementUnreadCountByType,
    clearUnreadCount,
    resetUnreadCount
  }
})