import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postApi } from '@/api/index.js'
import { eventBus, EVENT_TYPES } from '@/utils/eventBus.js'

export const useCollectStore = defineStore('collect', () => {
  // 存储笔记的收藏状态 { postId: { collected: boolean, collectCount: number } }
  const postCollectStates = ref(new Map())

  // 更新笔记收藏状态
  const updatePostCollectState = (postId, collected, collectCount) => {
    postCollectStates.value.set(postId, { collected, collectCount })
  }

  // 获取笔记收藏状态
  const getPostCollectState = (postId) => {
    const state = postCollectStates.value.get(postId) || { collected: false, collectCount: 0 }
    return state
  }

  // 切换笔记收藏状态
  const togglePostCollect = async (postId, currentCollected, currentCollectCount) => {

    const willBeCollected = !currentCollected
    const newCollectCount = currentCollected ? currentCollectCount - 1 : currentCollectCount + 1

    // 执行收藏操作

    // 先更新本地状态，提供即时反馈
    updatePostCollectState(postId, willBeCollected, newCollectCount)

    try {
      // 调用后端API
      if (willBeCollected) {
        await postApi.collectPost(postId)
      } else {
        await postApi.uncollectPost(postId)
      }

      return { success: true, collected: willBeCollected, collectCount: newCollectCount }
    } catch (error) {
      console.error('收藏操作失败:', error)
      // 如果API调用失败，恢复原状态
      updatePostCollectState(postId, currentCollected, currentCollectCount)
      return { success: false, error: error.message }
    } finally {
      // 无论成功还是失败，都触发全局事件通知其他页面
      if (willBeCollected) {
        eventBus.emit(EVENT_TYPES.USER_COLLECTED_POST, { postId, collected: willBeCollected, collectCount: newCollectCount })
      } else {
        eventBus.emit(EVENT_TYPES.USER_UNCOLLECTED_POST, { postId, collected: willBeCollected, collectCount: newCollectCount })
      }
    }
  }

  // 初始化笔记收藏状态（从API获取的数据）
  const initPostCollectState = (postId, collected, collectCount) => {
    // 总是更新状态，确保与后端数据同步
    updatePostCollectState(postId, collected, collectCount)
  }

  // 批量初始化笔记收藏状态
  const initPostsCollectStates = (posts) => {

    posts.forEach(post => {
      initPostCollectState(post.id, post.collected || false, post.collectCount || 0)
    })
  }

  return {
    postCollectStates,
    updatePostCollectState,
    getPostCollectState,
    togglePostCollect,
    initPostCollectState,
    initPostsCollectStates
  }
})