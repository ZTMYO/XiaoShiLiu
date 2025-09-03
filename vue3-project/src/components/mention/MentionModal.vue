<template>
  <div v-if="visible" class="mention-modal-overlay" v-click-outside.mousedown="closeMentionModal"
    v-escape-key="closeMentionModal">
    <div class="mention-modal" @mousedown.stop @wheel.stop>
      <div class="mention-header">
        <h4>选择要@的用户</h4>
        <div class="header-actions">
          <button @click="refreshFriends" class="refresh-btn" :disabled="loading" title="刷新好友列表">
            <SvgIcon name="reload" width="16" height="16" :class="{ 'spinning': loading }" />
          </button>
          <button @click="closeMentionModal" class="close-btn">
            <SvgIcon name="close" width="16" height="16" />
          </button>
        </div>
      </div>

      <div class="mention-search">
        <input v-model="searchQuery" type="text" :placeholder="'搜索要@的用户...'" class="search-input"
          @input="handleSearchInput" />
      </div>

      <div class="mention-content">
        <div v-if="loading" class="loading-state">
          <SkeletonList :count="6" type="user-item" avatar-size="30px" :show-stats="false" :show-button="false" />
        </div>

        <div v-else-if="searchLoading" class="loading-state">
          <SkeletonList :count="3" type="user-item" avatar-size="30px" :show-stats="false" :show-button="false" />
        </div>


        <div v-else-if="displayedUsers.length > 0" class="friends-list">
          <div v-for="user in displayedUsers" :key="user.id" class="friend-item"
            :class="{ 'loading-disabled': loading || searchLoading }"
            @click="!(loading || searchLoading) && selectFriend(user)">
            <img :src="getImageSrc(user.avatar || defaultAvatar, user.id)" :alt="user.nickname" class="friend-avatar"
              @load="onImageLoad(user.id)" @error="onImageError(user.id)" />
            <div class="friend-info">
              <div class="friend-nickname">{{ user.nickname }}</div>
              <div class="friend-id">@{{ user.user_id }}</div>
            </div>
          </div>
        </div>


        <div v-else class="empty-state">
          <SvgIcon name="user-group" :width="48" :height="48" class="empty-icon" />
          <p v-if="isSearching">未找到相关用户</p>
          <p v-else>暂无好友</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import SkeletonList from '@/components/skeleton/SkeletonList.vue'
import { userApi, authApi } from '@/api/index.js'
import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'select'])

// 防滚动穿透
const { lock, unlock } = useScrollLock()

const defaultAvatar = new URL('@/assets/imgs/avatar.png', import.meta.url).href
const searchQuery = ref('')
const loading = ref(false)
const friends = ref([])
const currentUserId = ref(null)
const friendsLoaded = ref(false) // 标记是否已加载过好友列表



// 搜索结果列表
const searchResults = ref([])
const isSearching = ref(false)
const searchLoading = ref(false)

// 显示的用户列表（好友或搜索结果）
const displayedUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return friends.value
  }
  return searchResults.value
})

// 搜索所有用户
const searchUsers = async (keyword) => {
  if (!keyword.trim()) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  searchLoading.value = true
  isSearching.value = true

  try {
    const response = await userApi.searchUsers(keyword, { limit: 50 })
    if (response.success && response.data && response.data.users) {
      searchResults.value = response.data.users
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    searchResults.value = []
  }

  searchLoading.value = false
}

// 防抖搜索
let searchTimeout = null
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    searchUsers(searchQuery.value)
  }, 300)
}

// 图片加载状态缓存
const imageLoadStates = ref(new Map())
const imageCache = ref(new Map())

// 获取图片源地址
const getImageSrc = (originalSrc, friendId) => {
  // 如果图片已经缓存，直接返回缓存的地址
  if (imageCache.value.has(friendId)) {
    return imageCache.value.get(friendId)
  }

  // 如果图片正在加载或已加载失败，返回默认头像
  const loadState = imageLoadStates.value.get(friendId)
  if (loadState === 'loading' || loadState === 'error') {
    return defaultAvatar
  }

  // 开始加载图片
  if (!loadState) {
    imageLoadStates.value.set(friendId, 'loading')
    preloadImage(originalSrc, friendId)
  }

  return originalSrc
}

// 预加载图片
const preloadImage = (src, friendId) => {
  const img = new Image()
  img.onload = () => {
    imageLoadStates.value.set(friendId, 'loaded')
    imageCache.value.set(friendId, src)
  }
  img.onerror = () => {
    imageLoadStates.value.set(friendId, 'error')
    imageCache.value.set(friendId, defaultAvatar)
  }
  img.src = src
}

// 图片加载成功回调
const onImageLoad = (friendId) => {
  imageLoadStates.value.set(friendId, 'loaded')
}

// 图片加载失败回调
const onImageError = (friendId) => {
  imageLoadStates.value.set(friendId, 'error')
  // 设置默认头像
  const img = document.querySelector(`img[alt*="${friendId}"]`)
  if (img) {
    img.src = defaultAvatar
  }
}

// 关闭弹窗
const closeMentionModal = () => {
  unlock()
  emit('close')
}

// 选择好友
const selectFriend = (friend) => {
  // 如果正在加载，禁止选择
  if (loading.value) {
    return
  }

  emit('select', friend)
  closeMentionModal()
}

// 加载好友列表
const loadFriends = async (forceReload = false) => {
  // 如果已经加载过且不是强制重新加载，直接返回
  if (friendsLoaded.value && !forceReload) {
    return
  }

  loading.value = true

  // 确保骨架屏至少显示500ms，提升用户体验
  const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500))

  try {
    // 获取当前用户ID
    if (!currentUserId.value) {
      try {
        const userResponse = await authApi.getCurrentUser()
        if (userResponse.success && userResponse.data) {
          currentUserId.value = userResponse.data.id
        } else {
          // 如果获取失败，使用默认ID
          currentUserId.value = 1
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error)
        currentUserId.value = 1
      }
    }

    // 调用API获取关注的好友列表
    const response = await userApi.getFollowing(currentUserId.value, { limit: 50 })
    if (response.success && response.data && response.data.following) {
      friends.value = response.data.following
    } else {
      friends.value = []
    }

    friendsLoaded.value = true
  } catch (error) {
    console.error('加载好友列表失败:', error)
    friends.value = []
    friendsLoaded.value = true
  }

  // 等待最小加载时间完成
  await minLoadingTime
  loading.value = false
}

// 监听弹窗显示状态
watch(() => props.visible, (newValue) => {
  if (newValue) {
    searchQuery.value = ''
    searchResults.value = []
    isSearching.value = false
    searchLoading.value = false
    loadFriends() // 只有首次或强制刷新时才会真正加载
    // 锁定滚动
    nextTick(() => {
      lock()
    })
  } else {
    // 解锁滚动
    unlock()
    // 清理搜索状态
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      searchTimeout = null
    }
  }
})

// 提供刷新好友列表的方法
const refreshFriends = () => {
  friendsLoaded.value = false

  // 清除图片缓存
  imageLoadStates.value.clear()
  imageCache.value.clear()

  loadFriends(true)
}

// 暴露刷新方法给父组件
defineExpose({
  refreshFriends
})
</script>

<style scoped>
.mention-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.mention-modal {
  background: var(--bg-color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 400px;
  max-width: 90vw;
  max-height: 300px;
  overflow: hidden;
  animation: scaleIn 0.2s ease;
  display: flex;
  flex-direction: column;
}

.mention-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  border-bottom: 1px solid var(--border-color-primary);
  flex-shrink: 0;
}

.mention-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn,
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--text-color-secondary);
  transition: all 0.2s ease;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

.refresh-btn:hover:not(:disabled),
.close-btn:hover {
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
}

.mention-search {
  padding: 5px 20px;
  border-bottom: 1px solid var(--border-color-primary);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-input::placeholder {
  color: var(--text-color-secondary);
}

.mention-content {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  max-height: 400px;
}

.loading-state {
  padding: 8px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-color-secondary);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.friends-list {
  padding: 2px 0;
  max-height: 400px;
  overflow-y: auto;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 5px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.friend-item:hover {
  background: var(--bg-color-secondary);
}

.friend-item.loading-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.friend-item.loading-disabled:hover {
  background: transparent;
  transform: none;
}

.friend-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  flex-shrink: 0;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-nickname {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-primary);
  margin-bottom: 2px;
}

.friend-id {
  font-size: 12px;
  color: var(--text-color-secondary);
}

/* 滚动条样式 */
.mention-content::-webkit-scrollbar {
  width: 6px;
}

.mention-content::-webkit-scrollbar-track {
  background: transparent;
}

.mention-content::-webkit-scrollbar-thumb {
  background: var(--border-color-secondary);
  border-radius: 3px;
}

.mention-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-primary);
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}



@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .mention-modal {
    width: 95vw;
    max-height: 80vh;
    margin: 10px;
  }

  .mention-header {
    padding: 8px 16px;
  }

  .mention-title {
    font-size: 16px;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }

  .mention-search {
    padding: 12px 16px;
  }

  .search-input {
    font-size: 14px;
    padding: 8px 12px;
  }

  .mention-content {
    min-height: 150px;
    max-height: 300px;
  }

  .friend-item {
    padding: 10px 16px;
  }

  .friend-avatar {
    width: 32px;
    height: 32px;
  }

  .friend-info {
    margin-left: 10px;
  }

  .friend-name {
    font-size: 14px;
  }

  .friend-bio {
    font-size: 12px;
  }

  .skeleton-item {
    padding: 10px 16px;
    height: 56px;
  }

  .skeleton-avatar {
    width: 28px;
    height: 28px;
    margin-right: 10px;
  }
}
</style>