<template>
  <div class="user-info-card" v-if="visible" @click="handleCardClick">

    <div class="card-header">
      <div class="avatar-info">
        <img :src="userInfo.avatar" :alt="userInfo.nickname" class="avatar" />
        <span class="nickname">{{ userInfo.nickname }}</span>
      </div>
      <FollowButton v-if="!isCurrentUser" :user-id="userInfo.id" :is-following="userInfo.isFollowing" :follow-text="getFollowText(userInfo)"
        :following-text="getFollowingText(userInfo)" size="small" @follow="handleFollow" @unfollow="handleUnfollow"
        @click.stop />
    </div>


    <div class="card-content">

      <div class="bio" v-if="userInfo.bio">
        <MentionText :text="userInfo.bio" />
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
import MentionText from './mention/MentionText.vue'

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
  }
})

const emit = defineEmits(['follow', 'unfollow', 'click'])

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
function handleFollow(userId) {
  emit('follow', userId)
}

// 处理取消关注事件 - FollowButton组件已经处理了消息提示
function handleUnfollow(userId) {
  emit('unfollow', userId)
}

// 计算关注按钮文字（未关注状态）
function getFollowText(userInfo) {
  if (userInfo.buttonType === 'back') {
    return '回关'
  }
  return '关注'
}

// 计算关注按钮文字（已关注状态）
function getFollowingText(userInfo) {
  if (userInfo.buttonType === 'mutual' || userInfo.isMutual) {
    return '互相关注'
  }
  return '已关注'
}

// 监听用户信息变化，初始化关注状态
watch(() => props.userInfo, (newUserInfo) => {
  if (newUserInfo && newUserInfo.id) {
    // 初始化关注状态到 store
    followStore.initUserFollowState(
      newUserInfo.id,
      newUserInfo.isFollowing || false,
      newUserInfo.isMutual || false,
      newUserInfo.buttonType || (newUserInfo.isFollowing ? 'unfollow' : 'follow')
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

.nickname {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
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