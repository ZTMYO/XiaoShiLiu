import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postApi } from '@/api/index.js'
import { eventBus, EVENT_TYPES } from '@/utils/eventBus.js'

export const useLikeStore = defineStore('like', () => {
  // 存储笔记的点赞状态 { postId: { liked: boolean, likeCount: number } }
  const postLikeStates = ref(new Map())

  // 更新笔记点赞状态
  const updatePostLikeState = (postId, liked, likeCount) => {
    postLikeStates.value.set(postId, { liked, likeCount })
  }

  // 获取笔记点赞状态
  const getPostLikeState = (postId) => {
    const state = postLikeStates.value.get(postId) || { liked: false, likeCount: 0 }
    return state
  }

  // 切换笔记点赞状态
  const togglePostLike = async (postId, currentLiked, currentLikeCount) => {
    // 计算新状态
    const willBeLiked = !currentLiked
    const newLikeCount = willBeLiked ? currentLikeCount + 1 : currentLikeCount - 1

    // 立即更新UI状态（乐观更新）
    updatePostLikeState(postId, willBeLiked, newLikeCount)

    try {
      let result
      if (willBeLiked) {
        result = await postApi.likePost(postId)
      } else {
        result = await postApi.unlikePost(postId)
      }

      return { success: true, liked: willBeLiked, likeCount: newLikeCount }
    } catch (error) {
      console.error('点赞操作失败:', error)
      // 如果API调用失败，恢复原状态
      updatePostLikeState(postId, currentLiked, currentLikeCount)
      return { success: false, error: error.message }
    } finally {
      // 无论成功还是失败，都触发全局事件通知其他页面
      if (willBeLiked) {
        eventBus.emit(EVENT_TYPES.USER_LIKED_POST, { postId, liked: willBeLiked, likeCount: newLikeCount })
      } else {
        eventBus.emit(EVENT_TYPES.USER_UNLIKED_POST, { postId, liked: willBeLiked, likeCount: newLikeCount })
      }
    }
  }

  // 初始化笔记点赞状态（从API获取的数据）
  const initPostLikeState = (postId, liked, likeCount) => {
    // 总是更新状态，确保与后端数据同步
    updatePostLikeState(postId, liked, likeCount)
  }

  // 批量初始化笔记点赞状态
  const initPostsLikeStates = (posts) => {

    posts.forEach(post => {
      initPostLikeState(post.id, post.liked || false, post.likeCount || 0)
    })
  }

  return {
    postLikeStates,
    updatePostLikeState,
    getPostLikeState,
    togglePostLike,
    initPostLikeState,
    initPostsLikeStates
  }
})