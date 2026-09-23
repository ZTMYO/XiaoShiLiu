<template>
    <div class="user-card" @click="handleUserClick">
        <div class="user-content">
            <div class="user-avatar" v-user-hover="userHoverConfig">
                <img v-img-lazy="avatarSrc" :alt="user.nickname" class="avatar-img lazy-avatar"
                    @error="handleAvatarError">
            </div>
            <div class="user-info">
                <div class="user-main">
                    <div class="nickname-container">
                        <h3 class="user-nickname" v-user-hover="userHoverConfig">{{ user.nickname }}</h3>
                        <VerifiedBadge :verified="user.verified" />
                    </div>
                    <div class="user-id">小石榴号：{{ user.userId }}</div>
                    <div class="user-stats">
                        <span class="stat-item">粉丝 · {{ formatNumber(user.followers) }}</span>
                        <span class="stat-item">笔记 · {{ formatNumber(user.post_count) }}</span>
                    </div>
                </div>
                <FollowButton v-if="!isCurrentUser" :is-following="user.isFollowing" :user-id="user.userId"
                    :follow-text="getFollowText(user)" :following-text="getFollowingText(user)" @follow="handleFollow"
                    @unfollow="handleUnfollow" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { watch, computed } from 'vue'
import { useFollowStore } from '@/stores/follow'
import { useUserStore } from '@/stores/user'
import FollowButton from '@/components/FollowButton.vue'
import VerifiedBadge from '@/components/VerifiedBadge.vue'
import { userApi } from '@/api/index.js'
import { supportsThumbnail, getDefaultAvatar } from '@/utils/imageUtils.js'
import defaultAvatar from '@/assets/imgs/avatar.png'

const props = defineProps({
    user: {
        type: Object,
        required: true,
        default: () => ({
            id: '',
            nickname: '',
            userId: '',
            avatar: '',
            followers: 0,
            posts: 0,
            isFollowing: false,
            buttonType: 'normal' // 新增按钮类型
        })
    }
})

const emit = defineEmits(['follow', 'unfollow', 'userClick'])

const followStore = useFollowStore()
const userStore = useUserStore()

// 头像为空或指向非本站图床时直接用默认头像，避免外部图片加载失败让头像区域长期空白
const avatarSrc = computed(() => {
    const url = (props.user.avatar || '').trim()
    if (!url) return getDefaultAvatar(props.user.user_id || props.user.userId)
    try {
        const hostname = new URL(url, window.location.origin).hostname.toLowerCase()
        if (supportsThumbnail(url) || hostname === window.location.hostname) return url
    } catch (e) {
        // 非法 URL 走默认头像
    }
    return defaultAvatar
})

// 监听用户数据变化，同步到store（仅在用户ID变化时初始化）
watch(() => props.user.userId, (newUserId, oldUserId) => {
    if (newUserId && newUserId !== oldUserId) {
        followStore.initUserFollowState(
            newUserId,
            props.user.isFollowing || false,
            props.user.isMutual || false,
            props.user.buttonType || 'follow'
        )
    }
}, { immediate: true })

// 判断是否为当前用户
const isCurrentUser = computed(() => {
    if (!userStore.isLoggedIn || !userStore.userInfo) {
        return false
    }

    const currentUserId = userStore.userInfo.user_id // 当前用户的小石榴号
    const userId = props.user.user_id || props.user.userId // 用户的小石榴号

    return currentUserId === userId
})
// 处理头像加载失败
function handleAvatarError(event) {
    event.target.src = defaultAvatar
}
function formatNumber(num) {
    // 处理null、undefined或非数字值
    if (num == null || isNaN(num)) {
        return '0'
    }

    const numValue = Number(num)
    if (numValue >= 10000) {
        return (numValue / 10000).toFixed(1) + '万'
    } else if (numValue >= 1000) {
        return (numValue / 1000).toFixed(1) + 'k'
    }
    return numValue.toString()
}

function handleFollow(userId) {
    emit('follow', { ...props.user, id: userId })
}

function handleUnfollow(userId) {
    emit('unfollow', { ...props.user, id: userId })
}

function handleUserClick() {
    emit('userClick', props.user)
}

// 根据用户状态获取关注按钮文本
function getFollowText(user) {
    if (user.buttonType === 'back') {
        return '回关'
    }
    return '关注'
}

// 根据用户状态获取已关注按钮文本
function getFollowingText(user) {
    if (user.buttonType === 'mutual') {
        return '互相关注'
    }
    return '已关注'
}

// 用户悬停配置
const userHoverConfig = computed(() => ({
    getUserInfo: async () => {
        const userId = props.user.user_id || props.user.userId
        const userAutoId = props.user.id

        // 获取真实的用户统计数据
        let userStats = {
            follow_count: 0,
            fans_count: 0,
            likes_and_collects: 0
        }

        try {
            userStats = await userStore.getUserStats(userId)
        } catch (error) {
            console.error('获取用户统计数据失败:', error)
        }

        // 获取用户的前三个笔记封面图
        let userPostImages = []
        try {
            const { postApi } = await import('@/api/index.js')
            const postsResponse = await postApi.getUserPosts(userId, { page: 1, limit: 3 })

            if (postsResponse && postsResponse.data && postsResponse.data.posts) {
                // 收集每个笔记的第一张图片作为封面
                const coverImages = []
                postsResponse.data.posts.forEach((post) => {
                    // 使用图片数组的第一张作为封面
                    if (post.images && post.images.length > 0) {
                        coverImages.push(post.images[0])
                    }
                })
                // 取前3张封面图
                userPostImages = coverImages.slice(0, 3)
            }
        } catch (error) {
            console.error('获取用户笔记封面失败:', error)
        }

        // 获取最新的关注状态
        let followStatus = { followed: false, isMutual: false, buttonType: 'follow' }
        try {
            const followResponse = await followStore.fetchFollowStatus(userId)
            if (followResponse.success) {
                followStatus = followResponse.data
            } else {
                // 如果获取失败，尝试从store中获取
                const storeState = followStore.getUserFollowState(userId)
                if (storeState.hasState) {
                    followStatus = {
                        followed: storeState.followed,
                        isMutual: storeState.isMutual,
                        buttonType: storeState.buttonType
                    }
                } else {
                    // 最后回退到props数据
                    followStatus.followed = props.user.isFollowing || false
                }
            }
        } catch (error) {
            console.error('获取关注状态失败:', error)
            // 回退到props数据
            followStatus.followed = props.user.isFollowing || false
        }

        const baseInfo = {
            id: userId, // 使用user_id而不是数字id，这样点击跳转时会使用正确的URL
            avatar: props.user.avatar || '',
            nickname: props.user.nickname || `用户${userId}`,
            bio: props.user.bio || '还没有简介',
            verified: props.user.verified || false,
            followCount: userStats.follow_count || 0,
            fansCount: userStats.fans_count || 0,
            likeAndCollectCount: userStats.likes_and_collects || 0,
            isFollowing: followStatus.followed,
            isMutual: followStatus.isMutual,
            buttonType: followStatus.buttonType,
            images: userPostImages
        }

        return baseInfo
    },
    onFollow: (userInfo) => {
        const userId = props.user.user_id || props.user.userId
        handleFollow(userId) // 使用小石榴号进行关注操作
    },
    onUnfollow: (userInfo) => {
        const userId = props.user.user_id || props.user.userId
        handleUnfollow(userId) // 使用小石榴号进行取消关注操作
    },
    delay: 500
}))
</script>

<style scoped>
.user-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: var(--bg-color-primary);
    border-radius: 12px;
    border: 1px solid var(--border-color-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 10px;
    margin-top: 2px;
    position: relative;
}

.user-card:hover {
    background: var(--bg-color-secondary);
    transform: translateY(-1px);
}

/* 真实内容样式 */
.user-content {
    display: flex;
    align-items: center;
    width: 100%;
}

/* 头像未加载完成时留一个圆形底色，避免头像位置空白 */
.user-avatar {
    margin-right: 12px;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--bg-color-secondary);
}

.avatar-img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
}

.user-info {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
}

.user-main {
    flex: 1;
    min-width: 0;
}

.nickname-container {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    gap: 6px;
}

.user-nickname {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    max-width: 180px;
    vertical-align: bottom;
}

.user-id {
    font-size: 12px;
    color: var(--text-color-tertiary);
    margin-bottom: 6px;
}

.user-stats {
    display: flex;
    gap: 16px;
}

.stat-item {
    font-size: 12px;
    color: var(--text-color-secondary);
}

/* 响应式设计 */
@media (max-width: 480px) {
    .user-card {
        padding: 12px;
    }

    .user-avatar,
    .avatar-img {
        width: 40px;
        height: 40px;
    }

    .user-nickname {
        font-size: 14px;
        max-width: 140px;
    }

    .user-stats {
        gap: 12px;
    }
}
</style>