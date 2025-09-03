import { defineStore } from 'pinia'
import { ref } from 'vue'
import { commentApi } from '@/api/index.js'
import { formatTime } from '@/utils/timeFormat'

export const useCommentStore = defineStore('comment', () => {
    // 存储笔记的评论数据 { postId: { comments: Array, loading: boolean, loaded: boolean } }
    const postComments = ref(new Map())

    // 获取笔记评论
    const fetchComments = async (postId, params = {}) => {
        // 如果已经在加载中，则不重复请求
        if (postComments.value.get(postId)?.loading) {
            return postComments.value.get(postId)?.comments || []
        }

        // 设置加载状态
        postComments.value.set(postId, {
            ...postComments.value.get(postId),
            loading: true,
            loaded: false
        })

        try {
            const response = await commentApi.getComments(postId, params)

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
                    content: comment.content,
                    time: formatTime(comment.created_at),
                    location: comment.user_location || comment.location,
                    likeCount: comment.like_count || 0,
                    isLiked: comment.liked || false,
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
                                    content: reply.content,
                                    time: formatTime(reply.created_at),
                                    location: reply.user_location || reply.location,
                                    likeCount: reply.like_count || 0,
                                    isLiked: reply.liked || false,
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

                // 更新评论数据
                postComments.value.set(postId, {
                    comments: parentComments,
                    loading: false,
                    loaded: true,
                    total: totalComments
                })

                return parentComments
            } else {
                console.error(`笔记[${postId}]评论获取失败，响应结构:`, {
                    success: response.success,
                    hasData: !!response.data,
                    message: response.message || '未知错误'
                })

                // 设置加载失败状态
                postComments.value.set(postId, {
                    ...postComments.value.get(postId),
                    loading: false,
                    loaded: false,
                    comments: []
                })
                return []
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
        clearComments
    }
})
