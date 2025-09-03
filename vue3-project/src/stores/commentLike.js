import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { commentApi } from '@/api/index.js'

export const useCommentLikeStore = defineStore('commentLike', () => {
  // 存储评论的点赞状态 { commentId: { liked: boolean, likeCount: number } }
  const commentLikeStates = reactive({})

  // 更新评论点赞状态
  const updateCommentLikeState = (commentId, liked, likeCount) => {
    commentLikeStates[commentId] = { liked, likeCount }
  }

  // 获取评论点赞状态（响应式）
  const getCommentLikeState = (commentId) => {
    return commentLikeStates[commentId] || { liked: false, likeCount: 0 }
  }

  // 切换评论点赞状态
  const toggleCommentLike = async (commentId, currentLiked, currentLikeCount) => {
    const willBeLiked = !currentLiked
    const newLikeCount = currentLiked ? currentLikeCount - 1 : currentLikeCount + 1

    // 先更新本地状态，提供即时反馈
    updateCommentLikeState(commentId, willBeLiked, newLikeCount)

    try {
      // 调用后端API
      if (willBeLiked) {
        await commentApi.likeComment(commentId)
      } else {
        await commentApi.unlikeComment(commentId)
      }

      return { success: true, liked: willBeLiked, likeCount: newLikeCount }
    } catch (error) {
      console.error(`评论${commentId}点赞操作失败:`, error)

      // 恢复原始状态
      updateCommentLikeState(commentId, currentLiked, currentLikeCount)

      return { success: false, error: error.message || '操作失败' }
    }
  }

  // 初始化评论点赞状态（从API获取的数据）
  const initCommentLikeState = (commentId, liked, likeCount) => {
    // 总是更新状态，确保与后端数据同步
    updateCommentLikeState(commentId, liked, likeCount)
  }

  // 批量初始化评论点赞状态
  const initCommentsLikeStates = (comments) => {
    const initComment = (comment) => {
      // 兼容后端返回的字段名（is_liked, like_count）和前端期望的字段名（isLiked, likeCount）
      const liked = comment.isLiked !== undefined ? comment.isLiked : (comment.is_liked || false)
      const likeCount = comment.likeCount !== undefined ? comment.likeCount : (comment.like_count || 0)

      initCommentLikeState(comment.id, liked, likeCount)

      // 如果有回复，也初始化回复的点赞状态
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(reply => {
          const replyLiked = reply.isLiked !== undefined ? reply.isLiked : (reply.is_liked || false)
          const replyLikeCount = reply.likeCount !== undefined ? reply.likeCount : (reply.like_count || 0)
          initCommentLikeState(reply.id, replyLiked, replyLikeCount)
        })
      }
    }

    comments.forEach(initComment)
  }

  return {
    commentLikeStates,
    updateCommentLikeState,
    getCommentLikeState,
    toggleCommentLike,
    initCommentLikeState,
    initCommentsLikeStates
  }
})