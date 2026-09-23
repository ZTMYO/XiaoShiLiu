<template>
  <div class="user-info-card" v-if="visible" @click="handleCardClick">

    <div class="card-header">
      <div class="avatar-info">
        <img :src="userInfo.avatar || getDefaultAvatar(userInfo.user_id || userInfo.userId || userInfo.id)" :alt="userInfo.nickname" class="avatar" @error="handleAvatarError" />
        <div class="nickname-container">
          <span class="nickname">{{ userInfo.nickname }}</span>
          <VerifiedBadge :verified="userInfo.verified" />
        </div>
      </div>
      <FollowButton v-if="!isCurrentUser"
        :user-id="mergedUserInfo.user_id || mergedUserInfo.userId || mergedUserInfo.id"
        :is-following="mergedUserInfo.isFollowing" :follow-text="getFollowText(mergedUserInfo)"
        :following-text="getFollowingText(mergedUserInfo)" size="small" @follow="handleFollow"
        @unfollow="handleUnfollow" @click.stop />
    </div>


    <div class="card-content">

      <div class="bio" v-if="userInfo.bio">
        <ContentRenderer :text="userInfo.bio" />
      </div>
      <div class="bio" v-else>
        还没有简介
      </div>


      <div class="stats">
        <span class="stat-item">
          <span class="stat-number">{{ userInfo.followCount }}</span>
          <span class="stat-label"> 关注</span>
        </span>
        <span class="stat-item">
          <span class="stat-number">{{ userInfo.fansCount }}</span>
          <span class="stat-label"> 粉丝</span>
        </span>
        <span class="stat-item">
          <span class="stat-number">{{ userInfo.likeAndCollectCount }}</span>
          <span class="stat-label"> 获赞与收藏</span>
        </span>
      </div>
    </div>


    <div class="card-images" v-if="userInfo.images && userInfo.images.length > 0">
      <div v-for="(image, index) in displayImages" :key="index" class="image-item">
        <img :src="image" :alt="`用户图片${index + 1}`" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFollowStore } from '@/stores/follow'
import { useUserStore } from '@/stores/user'
import FollowButton from './FollowButton.vue'
import ContentRenderer from './ContentRenderer.vue'
import VerifiedBadge from './VerifiedBadge.vue'
import defaultAvatar from '@/assets/imgs/avatar.png'
import { getDefaultAvatar } from '@/utils/imageUtils'

const router = useRouter()
const followStore = useFollowStore()
const userStore = useUserStore()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      avatar: '',
      nickname: '',
      bio: '',
      followCount: 0,
      fansCount: 0,
      likeAndCollectCount: 0,
      isFollowing: false,
      images: []
    })
  },
  position: {
    type: String,
    default: 'bottom',
    validator: (value) => ['top', 'bottom', 'left', 'right'].includes(value)
  },
  onFollow: {
    type: Function,
    default: null
  },
  onUnfollow: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['follow', 'unfollow', 'click'])

// 实时获取关注状态
const currentFollowState = computed(() => {
  const userId = props.userInfo.user_id || props.userInfo.userId || props.userInfo.id
  return followStore.getUserFollowState(userId)
})

// 合并用户信息和实时关注状态
const mergedUserInfo = computed(() => {
  const followState = currentFollowState.value
  return {
    ...props.userInfo,
    isFollowing: followState?.followed ?? props.userInfo.isFollowing,
    isMutual: followState?.isMutual ?? props.userInfo.isMutual,
    buttonType: followState?.buttonType ?? props.userInfo.buttonType
  }
})

// 判断是否为当前用户
const isCurrentUser = computed(() => {
  if (!userStore.isLoggedIn || !userStore.userInfo) {
    return false
  }

  const currentUserId = userStore.userInfo.user_id // 当前用户的小石榴号
  const userId = props.userInfo.id // 传入的用户ID（小石榴号）

  return currentUserId === userId
})

// 最多显示3张图片
const displayImages = computed(() => {
  const images = props.userInfo.images ? props.userInfo.images.slice(0, 3) : []
  return images
})

// 处理卡片点击事件
function handleCardClick() {
  // 发出点击事件，让父组件处理（比如隐藏卡片）
  emit('click')

  // 在新标签页中打开用户首页
  if (props.userInfo.id) {
    try {
      const targetPath = `/user/${props.userInfo.id}`
      const url = window.location.origin + targetPath
      window.open(url, '_blank')
    } catch (error) {
      console.error('🔗 打开用户页面失败:', error)
    }
  } else {
    console.error('🔗 跳转失败: 用户ID不存在', {
      userId: props.userInfo.id
    })
  }
}

// 处理关注事件 - FollowButton组件已经处理了消息提示
async function handleFollow(userId) {
  // 如果有外部的onFollow回调，优先使用外部回调
  if (props.onFollow) {
    await props.onFollow(userId)
  } else {
    // 否则使用内部的toggleUserFollow逻辑
    if (!userStore.isLoggedIn) {
      return
    }
    try {
      await followStore.toggleUserFollow(userId)
    } catch (error) {
      console.error('关注操作失败:', error)
    }
  }
  emit('follow', userId)
}

// 处理取消关注事件 - FollowButton组件已经处理了消息提示
async function handleUnfollow(userId) {
  // 如果有外部的onUnfollow回调，优先使用外部回调
  if (props.onUnfollow) {
    await props.onUnfollow(userId)
  } else {
    // 否则使用内部的toggleUserFollow逻辑
    if (!userStore.isLoggedIn) {
      return
    }
    try {
      await followStore.toggleUserFollow(userId)
    } catch (error) {
      console.error('取消关注操作失败:', error)
    }
  }
  emit('unfollow', userId)
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

function handleAvatarError(event) {
  event.target.src = defaultAvatar
}

// 监听用户信息变化，初始化关注状态
watch(() => props.userInfo, (newUserInfo) => {
  if (newUserInfo && newUserInfo.id) {
    // 初始化关注状态到 store
    // 确保使用正确的用户ID（小石榴号）
    const userId = newUserInfo.user_id || newUserInfo.userId || newUserInfo.id
    const isFollowing = newUserInfo.isFollowing || false
    const isMutual = newUserInfo.isMutual || false

    // 根据关注状态确定buttonType
    let buttonType = newUserInfo.buttonType
    if (!buttonType) {
      if (isFollowing) {
        buttonType = isMutual ? 'mutual' : 'unfollow'
      } else {
        // 未关注时，需要判断是否为回关情况
        // 这里应该从API获取，但作为fallback使用follow
        buttonType = 'follow'
      }
    }

    followStore.initUserFollowState(
      userId,
      isFollowing,
      isMutual,
      buttonType
    )
  }
}, { immediate: true })
</script>

<style scoped>
.user-info-card {
  width: 360px;
  background: var(--bg-color-primary);
  border: 1px solid var(--border-color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 16px;
  position: absolute;
  z-index: 1000;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease;
}


.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.avatar-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 40px;
  margin-right: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--border-color-secondary);
  transition: all 0.3s ease;
}

.avatar:not([src]),
.avatar[src=""] {
  background: transparent;
  border: 1px solid var(--border-color-secondary);
}

.nickname-container {
  display: flex;
  align-items: center;
  min-width: 0;
}

.nickname {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 6px;
}

/* 第二部分：简介和统计数据 */
.card-content {
  margin-bottom: 16px;
}

.bio {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.4;
  margin-bottom: 12px;
  word-wrap: break-word;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 13px;
  color: var(--text-color-tertiary);
  white-space: nowrap;
}

.stat-number {
  font-weight: bold;
  color: var(--text-color-primary);
}

.stat-label {
  font-weight: normal;
  color: var(--text-color-tertiary);
}

/* 第三部分：图片展示 */
.card-images {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.image-item {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  flex-shrink: 0;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent;
  border: 1px solid var(--border-color-secondary);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.image-item img:not([src]),
.image-item img[src=""] {
  background: transparent;
  border: 1px solid var(--border-color-secondary);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .user-info-card {
    width: 320px;
    padding: 12px;
  }

  .avatar-info {
    width: 200px;
  }

  .avatar {
    width: 36px;
    height: 36px;
  }

  .nickname {
    font-size: 15px;
  }

  .bio {
    font-size: 13px;
  }

  .stat-item {
    font-size: 12px;
  }

  .image-item {
    width: 88px;
    height: 88px;
  }
}
</style>