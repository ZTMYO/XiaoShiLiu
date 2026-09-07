import { defineStore } from 'pinia'
import { ref } from 'vue'
import { commentApi } from '@/api/index.js'
import { formatTime } from '@/utils/timeFormat'

export const useCommentStore = defineStore('comment', () => {
    // 存储笔记的评论数据 { postId: { comments: Array, loading: boolean, loaded: boolean, hasMore: boolean, currentPage: number } }
    const postComments = ref(new Map())
    // 获取笔记评论
    const fetchComments = async (postId, params = {}) => {
        let { page = 1, limit = 5, loadMore = false, sort = 'desc', silentLoad = false } = params
        // 如果已经在加载中，则不重复请求
        if (postComments.value.get(postId)?.loading) {
            return postComments.value.get(postId)?.comments || []
        }
        const currentData = postComments.value.get(postId) || { comments: [], hasMore: true, currentPage: 0, sort: 'desc' }

        // 检查排序方式是否改变，如果改变则重置分页状态
        const sortChanged = currentData.sort !== sort
        if (sortChanged && loadMore) {
            // 排序改变时，loadMore应该被视为重新开始
            loadMore = false
            page = 1
        }

        // 如果是加载更多但没有更多数据，直接返回
        if (loadMore && !currentData.hasMore) {
            return currentData.comments
        }

        // 设置加载状态（静默加载时不显示loading状态）
        if (!silentLoad) {
            postComments.value.set(postId, {
                ...currentData,
                loading: true,
                loaded: false
            })
        }

        try {
            // 构建API参数，包含分页信息
            const apiParams = {
                ...params,
                page,
                limit
            }
            const response = await commentApi.getComments(postId, apiParams)

            // 检查响应是否存在
            if (!response) {
                console.error(`笔记[${postId}]评论获取失败，响应为空`)
                throw new Error('响应数据为空')
            }

            if (response.success && response.data && response.data.comments) {
                // 处理顶级评论数据格式
                const parentComments = response.data.comments.map(comment => ({
                    id: comment.id,
                    user_id: comment.user_display_id || comment.user_id, // 小石榴号（用于导航）
                    user_auto_id: comment.user_auto_id || comment.user_id, // 用户自增ID（用于权限判断）
                    username: comment.nickname || '匿名用户',
                    avatar: comment.user_avatar || new URL('@/assets/imgs/avatar.png', import.meta.url).href,
                    verified: comment.verified || 0, // 认证状态
                    content: comment.content,
                    time: formatTime(comment.created_at),
                    location: comment.user_location || comment.location,
                    likeCount: comment.like_count || 0,
                    isLiked: comment.liked || false,
                    pinned: comment.is_pinned == 1,
                    parent_id: comment.parent_id,
                    replies: [],
                    reply_count: comment.reply_count || 0, // 子评论数量
                    isReply: false // 顶级评论
                }));

                // 递归获取所有层级的回复，扁平化处理
                const fetchAllReplies = async (commentId, allComments = [], allReplies = []) => {
                    try {
                        const repliesResponse = await commentApi.getReplies(commentId)
                        if (repliesResponse.success && repliesResponse.data && repliesResponse.data.comments) {
                            const replies = repliesResponse.data.comments.map(reply => {
                                // 查找被回复的评论或用户信息
                                let replyToUsername = '未知用户'

                                // 首先在当前获取的回复中查找
                                const parentInReplies = repliesResponse.data.comments.find(r => r.id === reply.parent_id)
                                if (parentInReplies) {
                                    replyToUsername = parentInReplies.nickname || '匿名用户'
                                } else {
                                    // 在所有评论中查找父评论
                                    const parentComment = allComments.find(c => c.id === reply.parent_id)
                                    if (parentComment) {
                                        replyToUsername = parentComment.username || '匿名用户'
                                    } else {
                                        // 在已收集的回复中查找
                                        const parentReply = allReplies.find(r => r.id === reply.parent_id)
                                        if (parentReply) {
                                            replyToUsername = parentReply.username || '匿名用户'
                                        }
                                    }
                                }

                                return {
                                    id: reply.id,
                                    user_id: reply.user_display_id || reply.user_id, // 小石榴号（用于导航）
                                    user_auto_id: reply.user_auto_id || reply.user_id, // 用户自增ID（用于权限判断）
                                    username: reply.nickname || '匿名用户',
                                    avatar: reply.user_avatar || new URL('@/assets/imgs/未加载.png', import.meta.url).href,
                                    verified: reply.verified || 0, // 认证状态
                                    content: reply.content,
                                    time: formatTime(reply.created_at),
                                    location: reply.user_location || reply.location,
                                    likeCount: reply.like_count || 0,
                                    isLiked: reply.liked || false,
                                    pinned: reply.is_pinned == 1,
                                    parent_id: reply.parent_id,
                                    replyTo: replyToUsername, // 添加被回复者昵称
                                    replies: [], // 保持空数组，因为是扁平化结构
                                    isReply: true // 标记为回复
                                }
                            });

                            // 将当前层级的回复添加到总回复数组
                            const flatReplies = [...replies]

                            // 递归获取每个回复的子回复，并扁平化合并
                            for (const reply of replies) {
                                const childReplies = await fetchAllReplies(reply.id, allComments, [...allReplies, ...flatReplies])
                                flatReplies.push(...childReplies)
                            }

                            return flatReplies
                        }
                    } catch (error) {
                        console.error(`获取评论[${commentId}]的回复失败:`, error)
                    }
                    return []
                }

                // 为有回复的评论获取所有层级的子评论
                for (const comment of parentComments) {
                    if (comment.reply_count > 0) {
                        comment.replies = await fetchAllReplies(comment.id, parentComments)
                    }
                }

                // 计算所有评论的总数（包括顶级评论和所有回复）
                const totalComments = calculateTotalComments(parentComments)

                // 判断是否还有更多评论
                const hasMore = parentComments.length === limit

                // 更新评论数据
                const existingComments = loadMore ? currentData.comments : []
                const updatedComments = loadMore ? [...existingComments, ...parentComments] : parentComments

                // 使用服务器返回的真实总数，而不是计算的总数
                const serverTotal = response.data.pagination ? response.data.pagination.total : 0

                postComments.value.set(postId, {
                    comments: updatedComments,
                    loading: false,
                    loaded: true,
                    total: serverTotal,
                    hasMore: hasMore,
                    currentPage: page,
                    sort: sort // 记录当前排序方式
                })

                return updatedComments
            } else {
                console.error(`笔记[${postId}]评论获取失败，响应结构:`, {
                    success: response.success,
                    hasData: !!response.data,
                    message: response.message || '未知错误'
                })

                // 设置加载失败状态
                postComments.value.set(postId, {
                    ...currentData,
                    loading: false,
                    loaded: false,
                    comments: loadMore ? currentData.comments : []
                })
                return loadMore ? currentData.comments : []
            }
        } catch (error) {
            console.error(`获取笔记[${postId}]评论失败:`, error)
            // 设置加载失败状态
            postComments.value.set(postId, {
                ...postComments.value.get(postId),
                loading: false,
                loaded: false,
                comments: []
            })
            return []
        }
    }

    // 计算所有评论的总数（包括顶级评论和所有回复）
    const calculateTotalComments = (comments) => {
        let total = comments.length // 顶级评论数量
        comments.forEach(comment => {
            if (comment.replies && comment.replies.length > 0) {
                total += comment.replies.length // 添加回复数量
            }
        })
        return total
    }

    // 添加评论
    const addComment = (postId, comment) => {
        const currentData = postComments.value.get(postId) || { comments: [], loading: false, loaded: true }
        const newComments = [comment, ...currentData.comments]

        postComments.value.set(postId, {
            ...currentData,
            comments: newComments,
            total: (currentData.total || 0) + 1
        })
    }

    // 更新评论数据
    const updateComments = (postId, newData) => {
        const currentData = postComments.value.get(postId) || { comments: [], loading: false, loaded: true }
        postComments.value.set(postId, {
            ...currentData,
            ...newData
        })
    }

    // 获取评论数据
    const getComments = (postId) => {
        return postComments.value.get(postId) || { comments: [], loading: false, loaded: false, total: 0 }
    }

    // 更新评论置顶状态，置顶评论优先展示
    const setCommentPinned = (postId, commentId, pinned) => {
        const currentData = postComments.value.get(postId)
        if (!currentData || !currentData.comments) return

        const updatedComments = currentData.comments.map(comment =>
            comment.id === commentId ? { ...comment, pinned: !!pinned } : comment
        )

        // 稳定排序：置顶评论排在前面，其余评论保持原有相对顺序
        updatedComments.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

        postComments.value.set(postId, {
            ...currentData,
            comments: updatedComments
        })
    }

    // 清除评论数据
    const clearComments = (postId) => {
        if (postId) {
            postComments.value.delete(postId)
        } else {
            postComments.value.clear()
        }
    }



    return {
        fetchComments,
        addComment,
        updateComments,
        getComments,
        setCommentPinned,
        clearComments
    }
})
