<template>
    <button class="follow-btn"
        :class="{ 'following': currentFollowState, 'small': props.size === 'small', 'disabled': isDisabled }"
        @click.stop="handleClick" :disabled="false">
        {{ displayText }}
    </button>
</template>

<script setup>
import { ref, watch, inject, onUnmounted, computed } from 'vue'
import { useFollowStore } from '@/stores/follow'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const props = defineProps({
    isFollowing: {
        type: Boolean,
        default: false
    },
    userId: {
        type: [String, Number],
        required: true
    },
    followText: {
        type: String,
        default: '关注'
    },
    followingText: {
        type: String,
        default: '已关注'
    },
    size: {
        type: String,
        default: 'normal', // 'normal' | 'small'
        validator: (value) => ['normal', 'small'].includes(value)
    },
    debounceTime: {
        type: Number,
        default: 2000 // 防抖时间，默认2秒（与消息显示时间一致）
    }
})

const emit = defineEmits(['follow', 'unfollow'])

// 注入消息管理器
const $message = inject('$message')

// 使用stores
const followStore = useFollowStore()
const authStore = useAuthStore()
const userStore = useUserStore()

// 内部状态管理
const isDisabled = ref(false)
let debounceTimer = null

// 从store获取关注状态和按钮类型
const currentFollowState = computed(() => {
    const storeState = followStore.getUserFollowState(props.userId)
    return storeState.followed
})

const currentButtonType = computed(() => {
    const storeState = followStore.getUserFollowState(props.userId)
    return storeState.buttonType
})

// 根据按钮类型计算显示文本
const displayText = computed(() => {
    const buttonType = currentButtonType.value
    const isFollowed = currentFollowState.value

    if (isFollowed) {
        // 已关注状态的文本
        if (buttonType === 'mutual') {
            return '互相关注'
        }
        return props.followingText
    } else {
        // 未关注状态的文本
        if (buttonType === 'back') {
            return '回关'
        }
        return props.followText
    }
})

// 监听外部状态变化，同步到store
watch(() => props.isFollowing, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        const storeState = followStore.getUserFollowState(props.userId)
        // 如果store中没有状态，或者状态不一致，则同步状态
        if (!storeState.hasState || storeState.followed !== newVal) {
            // 同步外部状态到store
            followStore.initUserFollowState(props.userId, newVal)
        }
    }
}, { immediate: true })

// 点击事件处理，始终阻止冒泡
function handleClick(event) {
    // 确保事件不会冒泡
    event.stopPropagation()

    // 如果正在禁用状态，直接返回，不执行关注逻辑
    if (isDisabled.value) return

    // 执行关注逻辑
    handleFollow()
}

async function handleFollow() {
    // 如果正在禁用状态，直接返回
    if (isDisabled.value) return

    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
        $message?.error('请登录')
        authStore.openLoginModal()
        return
    }

    // 设置禁用状态，防止重复点击
    isDisabled.value = true

    try {
        const result = await followStore.toggleUserFollow(props.userId)

        if (result.success) {
            // 从store获取最新状态来判断操作结果
            const newState = followStore.getUserFollowState(props.userId)
            if (newState.followed) {
                emit('follow', props.userId)
                $message?.success('关注成功')
            } else {
                emit('unfollow', props.userId)
                $message?.success('取消关注成功')
            }
        } else {
            // 检查是否是登录相关的错误
            const errorMessage = result.error || '操作失败，请重试'
            if (errorMessage.includes('访问令牌缺失') || errorMessage.includes('未授权') || errorMessage.includes('401')) {
                $message?.error('请登录')
                authStore.openLoginModal()
            } else {
                $message?.error(errorMessage)
            }
        }
    } catch (error) {
        console.error('关注操作失败:', error)
        // 检查是否是登录相关的错误
        const errorMessage = error.message || '操作失败，请重试'
        if (errorMessage.includes('访问令牌缺失') || errorMessage.includes('未授权') || errorMessage.includes('401')) {
            $message?.error('请登录')
            authStore.openLoginModal()
        } else {
            $message?.error('操作失败，请重试')
        }
    }

    // 设置定时器，在指定时间后恢复可点击状态
    if (debounceTimer) {
        clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
        isDisabled.value = false
    }, props.debounceTime)
}

// 组件卸载时清理定时器
onUnmounted(() => {
    if (debounceTimer) {
        clearTimeout(debounceTimer)
    }
})
</script>

<style scoped>
.follow-btn {
    padding: 8px 8px;
    border: none;
    border-radius: 20px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    flex-shrink: 0;
    margin-left: 12px;
    width: 96px;
    height: 40px;
    text-align: center;
    transition: all 0.2s ease;
    user-select: none;
    outline: none;
}

.follow-btn:not(.following) {
    background: var(--primary-color);
    color: white;
}

.follow-btn:not(.following):hover {
    background: var(--primary-color-dark);
}

.follow-btn.following {
    background: transparent;
    color: var(--text-color-secondary);
    border: 1px solid var(--border-color-secondary);
}

.follow-btn.following:hover {
    background: var(--bg-color-secondary);
    color: var(--text-color-primary);
}


/* 小尺寸按钮样式 */
.follow-btn.small {
    width: 88px;
    height: 32px;
    font-size: 14px;
    padding: 6px 8px;
    min-width: 88px;
}

/* 响应式设计 - 手机模式优化 */
@media (max-width: 480px) {
    .follow-btn {
        padding: 6px 8px;
        font-size: 12px;
        width: 72px;
        height: 32px;
        min-width: 72px;
        /* 确保最小宽度 */
    }

    .follow-btn.small {
        width: 68px;
        height: 28px;
        font-size: 11px;
        padding: 5px 6px;
        min-width: 68px;
    }
}
</style>