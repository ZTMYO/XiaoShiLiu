<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useScroll, useWindowSize } from '@vueuse/core'
import { useNavigationStore } from '@/stores/navigation'
import { useUserStore } from '@/stores/user'
import WaterfallFlow from '@/components/WaterfallFlow.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { eventBus, EVENT_TYPES } from '@/utils/eventBus.js'
import EditProfileModal from './components/EditProfileModal.vue'
import UserPersonalityTags from './components/UserPersonalityTags.vue'
import MentionText from '@/components/mention/MentionText.vue'
import { userApi } from '@/api/index.js'
import BackToTopButton from '@/components/BackToTopButton.vue'

const router = useRouter()
const navigationStore = useNavigationStore()
const userStore = useUserStore()

const defaultAvatar = new URL('@/assets/imgs/avatar.png', import.meta.url).href

// 用户统计信息
const userStats = ref({
  follow_count: 0,
  fans_count: 0,
  post_count: 0,
  like_count: 0,
  collect_count: 0,
  likes_and_collects: 0
})

// 编辑资料模态框
const showEditProfileModal = ref(false)

// 打开编辑资料模态框
const openEditProfileModal = () => {
  showEditProfileModal.value = true
}

// 关闭编辑资料模态框
const closeEditProfileModal = () => {
  showEditProfileModal.value = false
}

// 点击头像打开编辑资料模态框
const openAvatarCropModal = () => {
  showEditProfileModal.value = true
}

// 处理资料保存成功
const handleProfileSaved = async (formData) => {
  try {
    // 调用API更新用户资料
    const response = await userApi.updateUserInfo(userStore.userInfo.id, formData)

    if (response.success) {
      // 更新本地用户信息
      userStore.updateUserInfo(formData)
      console.log('用户资料更新成功')
    } else {
      console.error('用户资料更新失败:', response.message)
    }
  } catch (error) {
    console.error('用户资料更新API调用失败:', error)
  }

  closeEditProfileModal()
  // 重新加载用户统计信息
  loadUserStats()
}

// 格式化数字显示
const formatNumber = (num) => {
  // 处理null、undefined或非数字值
  if (num == null || isNaN(num)) {
    return '0'
  }
  
  const numValue = Number(num)
  if (numValue >= 10000) {
    return (numValue / 10000).toFixed(1) + '万'
  }
  return numValue.toString()
}

// 获取用户统计信息
const loadUserStats = async () => {
  if (userStore.userInfo?.id) {
    const stats = await userStore.getUserStats(userStore.userInfo.id)
    if (stats) {
      userStats.value = stats
    }
  }
}

// 页面挂载时自动滚动到顶部并获取统计信息
onMounted(() => {
  navigationStore.scrollToTop('instant')

  // 监听全局点赞和收藏事件
  eventBus.on(EVENT_TYPES.USER_LIKED_POST, handleGlobalLikeEvent)
  eventBus.on(EVENT_TYPES.USER_UNLIKED_POST, handleGlobalLikeEvent)
  eventBus.on(EVENT_TYPES.USER_COLLECTED_POST, handleGlobalCollectEvent)
  eventBus.on(EVENT_TYPES.USER_UNCOLLECTED_POST, handleGlobalCollectEvent)
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  eventBus.off(EVENT_TYPES.USER_LIKED_POST, handleGlobalLikeEvent)
  eventBus.off(EVENT_TYPES.USER_UNLIKED_POST, handleGlobalLikeEvent)
  eventBus.off(EVENT_TYPES.USER_COLLECTED_POST, handleGlobalCollectEvent)
  eventBus.off(EVENT_TYPES.USER_UNCOLLECTED_POST, handleGlobalCollectEvent)
})

// 处理全局点赞事件
function handleGlobalLikeEvent(data) {
  console.log('用户页面: 收到全局点赞事件', data)
  // 刷新点赞tab的数据
  refreshKeys.value.likes++
  // 延迟刷新统计数据
  setTimeout(() => {
    loadUserStats()
  }, 500)
}

// 处理全局收藏事件
function handleGlobalCollectEvent(data) {
  console.log('用户页面: 收到全局收藏事件', data)
  refreshKeys.value.collections++
  setTimeout(() => {
    loadUserStats()
  }, 500)
}

// 监听用户信息变化，重新获取统计信息
let hasLoadedStatsOnce = false
watch(() => userStore.userInfo?.id, (newUserId) => {
  if (!newUserId) return
  if (hasLoadedStatsOnce) return
  hasLoadedStatsOnce = true
  loadUserStats()
}, { immediate: true })

// 获取滚动信息和窗口尺寸
const { y: scrollY } = useScroll(window)
const { width: windowWidth } = useWindowSize()

// tab栏相关
const tabs = ref([
  { name: 'notes', label: '笔记' },
  { name: 'collections', label: '收藏' },
  { name: 'likes', label: '点赞' }
])

const activeTab = ref('notes')
const tabBarRef = ref(null)
const fixedTabBarRef = ref(null)

// 添加刷新键，用于触发WaterfallFlow组件重新加载数据
const refreshKeys = ref({
  notes: 0,
  collections: 0,
  likes: 0
})

// 计算滑块位置
const sliderStyle = computed(() => {
  const index = tabs.value.findIndex(tab => tab.name === activeTab.value)
  const isLargeScreen = windowWidth.value > 900

  if (isLargeScreen) {
    // 大屏：tab容器居中，max-width: 700px，无padding-left
    // 指示器需要相对于居中的tab容器定位
    return {
      left: `calc(50% - 96px + ${index * 64}px)`
    }
  } else {
    // 小屏：tab容器有padding-left: 16px，justify-content: center
    // 由于左边有16px padding，需要稍微向左调整以补偿视觉偏移
    return {
      left: `calc(50% - 88px + ${index * 64}px)`
    }
  }
})

const fixedSliderStyle = computed(() => {
  const index = tabs.value.findIndex(tab => tab.name === activeTab.value)
  const isLargeScreen = windowWidth.value > 900

  if (isLargeScreen) {
    return {
      left: `calc(220px + (100vw - 220px - 192px) / 2 + ${index * 64}px)`
    }
  } else {
    // 小屏：与普通tab相同的布局
    return {
      left: `calc(50% - 88px + ${index * 64}px)`
    }
  }
})



function onTabClick(tabName) {
  // 在切换tab前立即检查当前滚动位置
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop

  // 如果当前滚动位置过高，立即跳转到顶部
  if (currentScrollTop > 500) { // 设置一个阈值，超过500px就直接跳到顶部
    navigationStore.scrollToTop('instant')
  }

  activeTab.value = tabName

  // 如果没有立即跳转到顶部，则等待动画完成后平滑滚动
  if (currentScrollTop <= 500) {
    setTimeout(() => {
      navigationStore.scrollToTop('smooth')
    }, 300) // 300ms 等待动画完成
  }

  // 预留路由跳转
  // router.push(...)
}

// 回到顶部
function goTop() {
  navigationStore.scrollToTop('smooth')
}

// 跳转到关注/粉丝页面
function goToFollowList(type) {
  router.push({
    name: 'follow_list',
    params: { type }
  })
}

// 处理关注事件
function handleFollow(userId) {
  console.log('用户页面: 收到关注事件，用户ID:', userId)
  // 延迟刷新统计数据，确保后端数据已更新
  setTimeout(() => {
    loadUserStats()
  }, 500)
}

// 处理取消关注事件
function handleUnfollow(userId) {
  console.log('用户页面: 收到取消关注事件，用户ID:', userId)
  // 延迟刷新统计数据，确保后端数据已更新
  setTimeout(() => {
    loadUserStats()
  }, 500)
}

// 处理点赞事件
function handleLike(data) {
  console.log('点赞操作:', data)
  // 延迟刷新统计数据，确保后端数据已更新
  setTimeout(() => {
    loadUserStats()
  }, 500)

  // 如果是点赞操作，刷新点赞tab的数据
  if (data && data.liked) {
    refreshKeys.value.likes++
  }
  // 如果是取消点赞操作，也需要刷新点赞tab的数据
  if (data && !data.liked) {
    refreshKeys.value.likes++
  }
}

// 处理收藏事件
function handleCollect(data) {
  console.log('收藏操作:', data)
  // 延迟刷新统计数据，确保后端数据已更新
  setTimeout(() => {
    loadUserStats()
  }, 500)

  // 如果是收藏操作，刷新收藏tab的数据
  if (data && data.collected) {
    refreshKeys.value.collections++
  }
  // 如果是取消收藏操作，也需要刷新收藏tab的数据
  if (data && !data.collected) {
    refreshKeys.value.collections++
  }
}
</script>
<template>
  <div class="content-container">
    <div class="user-info" v-if="userStore.isLoggedIn">
      <div class="basic-info">
        <img :src="userStore.userInfo?.avatar || defaultAvatar"
          :alt="userStore.userInfo?.nickname || '用户头像'" class="avatar" @click="openAvatarCropModal">
        <div class="user-basic">
          <div class="user-nickname">{{ userStore.userInfo?.nickname || '用户' }}</div>
          <div class="user-content">
            <div class="user-id text-ellipsis">小石榴号：{{ userStore.userInfo?.user_id || '' }}</div>
            <div class="user-IP text-ellipsis">IP属地：{{ userStore.userInfo?.location || '未知' }}</div>
          </div>
        </div>
        <div class="edit-profile-button-wrapper">
          <button class="edit-profile-btn" @click="openEditProfileModal">
            编辑资料
          </button>
        </div>
      </div>
      <div class="user-desc">
        <MentionText v-if="userStore.userInfo?.bio" :text="userStore.userInfo.bio" />
        <span v-else>用户没有任何简介</span>
      </div>

      <UserPersonalityTags :user-info="userStore.userInfo" />
      <div class="user-interactions">
        <div class="interaction-item" @click="goToFollowList('following')">
          <span class="count">{{ formatNumber(userStats.follow_count) }}</span>
          <span class="shows">关注</span>
        </div>
        <div class="interaction-item" @click="goToFollowList('followers')">
          <span class="count">{{ formatNumber(userStats.fans_count) }}</span>
          <span class="shows">粉丝</span>
        </div>
        <div class="interaction-item">
          <span class="count">{{ formatNumber(userStats.likes_and_collects) }}</span>
          <span class="shows">获赞与收藏</span>
        </div>
      </div>
    </div>


    <div class="login-prompt" v-else>
      <div class="prompt-content">
        <SvgIcon name="user" width="48" height="48" class="prompt-icon" />
        <h3>请先登录</h3>
        <p>登录后即可查看个人信息和管理内容</p>
      </div>
    </div>

    <div class="tab" ref="tabBarRef" v-if="userStore.isLoggedIn">

      <div v-for="item in tabs" class="tab-item" :class="{ active: activeTab === item.name }"
        @click="onTabClick(item.name)">
        {{ item.label }}</div>
      <div class="tab-slider" :style="sliderStyle"></div>
    </div>

    <div class="fixedTab" :class="{ hidden: scrollY < 260 }" ref="fixedTabBarRef" v-if="userStore.isLoggedIn">

      <div v-for="item in tabs" class="tab-item" :class="{ active: activeTab === item.name }"
        @click="onTabClick(item.name)">
        {{ item.label }}</div>
      <div class="tab-slider" :style="fixedSliderStyle"></div>
    </div>


    <div class="content-switch-container" v-if="userStore.isLoggedIn">

      <div class="content-item" :class="{ active: activeTab === 'notes' }"
        :style="{ transform: activeTab === 'notes' ? 'translateX(0%)' : 'translateX(-100%)' }">
        <div class="waterfall-container">
          <WaterfallFlow :userId="userStore.userInfo?.id" :type="'posts'" :refreshKey="refreshKeys.notes"
            @follow="handleFollow" @unfollow="handleUnfollow" @like="handleLike" @collect="handleCollect" />
        </div>
      </div>


      <div class="content-item" :class="{ active: activeTab === 'collections' }"
        :style="{ transform: activeTab === 'collections' ? 'translateX(0%)' : activeTab === 'notes' ? 'translateX(100%)' : 'translateX(-100%)' }">
        <div class="waterfall-container">
          <WaterfallFlow :userId="userStore.userInfo?.id" :type="'collections'" :refreshKey="refreshKeys.collections"
            @follow="handleFollow" @unfollow="handleUnfollow" @like="handleLike" @collect="handleCollect" />
        </div>
      </div>


      <div class="content-item" :class="{ active: activeTab === 'likes' }"
        :style="{ transform: activeTab === 'likes' ? 'translateX(0%)' : 'translateX(100%)' }">
        <div class="waterfall-container">
          <WaterfallFlow :userId="userStore.userInfo?.id" :type="'likes'" :refreshKey="refreshKeys.likes"
            @follow="handleFollow" @unfollow="handleUnfollow" @like="handleLike" @collect="handleCollect" />
        </div>
      </div>
    </div>

    <BackToTopButton />


    <EditProfileModal :visible="showEditProfileModal" :user-info="userStore.userInfo"
      @update:visible="showEditProfileModal = $event" @save="handleProfileSaved" />
  </div>
</template>

<style scoped>
/* ---------- 1. 全局样式设置 ---------- */
* {
  box-sizing: border-box;
}

/* ---------- 2. 布局容器样式 ---------- */
.content-container {
  padding-top: 72px;
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  background: var(--bg-color-primary);
  min-height: 100vh;
  transition: background-color 0.2s ease;
}

/* 内容切换容器 */
.content-switch-container {
  width: 100%;
  max-width: 1200px;
  background: var(--bg-color-primary);
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  padding-bottom: calc(48px + constant(safe-area-inset-bottom));
  padding-bottom: calc(48px + env(safe-area-inset-bottom));
}

.content-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: var(--bg-color-primary);
  transition: transform 0.3s ease;
  opacity: 0;
  pointer-events: none;
}

.content-item.active {
  position: relative;
  opacity: 1;
  pointer-events: auto;
}

.waterfall-container {
  width: 100%;
  max-width: 700px;
  padding: 0 8px;
  margin: 0 auto;
  background: var(--bg-color-primary);
  transition: background-color 0.2s ease;
}

/* 大屏下调整瀑布流容器宽度以适应 4 列布局 */
@media (min-width: 960px) {
  .waterfall-container {
    max-width: 1000px;
    padding: 0 16px;
  }
}

/* ---------- 3. 用户信息区域 ---------- */
.user-info {
  height: auto;
  min-height: 196px;
  padding: 16px 0;
  width: 100%;
  max-width: 1200px;
  overflow-x: hidden;
  background: var(--bg-color-primary);
  transition: background-color 0.2s ease;
}

.basic-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 72px;
  width: 100%;
  padding: 0 16px;
  position: relative;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 1px solid var(--border-color-primary);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.user-basic {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 16px;
  gap: 6px;
}

.user-nickname {
  color: var(--text-color-primary);
  font-size: 18px;
  font-weight: bold;
}

.user-content {
  display: flex;
  flex-direction: column;
  color: var(--text-color-quaternary);
  font-size: 12px;
  gap: 4px;
  max-width: 100%;
}

/* 大屏幕下恢复横向布局 */
@media (min-width: 901px) {
  .user-content {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.user-id {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-IP {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-IP::before {
  content: '';
  display: none;
}

/* 大屏幕下恢复分隔线和宽度限制 */
@media (min-width: 901px) {
  .user-id {
    max-width: 60%;
  }

  .user-IP::before {
    content: '';
    display: inline-block;
    width: 0.92px;
    height: 12px;
    background-color: var(--bg-color-tertiary);
    margin-right: 8px;
    vertical-align: middle;
    transition: background-color 0.2s ease;
  }
}

.user-desc {
  margin: 17px 0px 0px;
  color: var(--text-color-primary);
  font-size: 14px;
  padding: 0 16px;
}

.user-interactions {
  display: flex;
  padding: 0 16px;
  flex-wrap: wrap;
  width: 100%;
}

.user-interactions div {
  display: flex;
  flex-direction: column;
  margin-right: 16px;
  margin-top: 20px;
}

.interaction-item {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.interaction-item:hover {
  background-color: var(--bg-color-secondary);
}

.interaction-item:last-child {
  cursor: default;
}

.interaction-item:last-child:hover {
  background-color: transparent;
}

.count {
  color: var(--text-color-primary);
  margin-right: 4px;
  font-size: 14px;
  text-align: center;
}

.shows {
  color: var(--text-color-quaternary);
  margin: 4px 0 0;
  font-size: 14px;
  text-align: center;
}

/* ---------- 3.5. 登录提示样式 ---------- */
.login-prompt {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 16px;
  background: var(--bg-color-primary);
  transition: background-color 0.2s ease;
}

.prompt-content {
  text-align: center;
  max-width: 300px;
}

.prompt-icon {
  color: var(--text-color-quaternary);
  margin-bottom: 16px;
}

.prompt-content h3 {
  color: var(--text-color-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.prompt-content p {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* ---------- 4. Tab栏样式 ---------- */
.tab {
  position: relative;
  display: flex;
  justify-content: center;
  padding-left: 16px;
  padding-top: 16px;
  padding-bottom: 16px;
  background: var(--bg-color-primary);
  transition: background-color 0.2s ease;
}

.fixedTab {
  position: fixed;
  top: 72px;
  z-index: 99;
  transform: none;
  background: var(--bg-color-primary);
  display: flex;
  justify-content: center;
  left: 0;
  right: 0;
  padding-left: 16px;
  padding-top: 16px;
  padding-bottom: 16px;
  transition: background-color 0.2s ease;
}

.tab-item {
  width: 64px;
  height: 40px;
  font-size: 16px;
  color: var(--text-color-secondary);
  cursor: pointer;
  background: transparent;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  position: relative;
  z-index: 1;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.tab-item:hover {
  color: var(--text-color-primary);
  transition: color 0.2s ease;
}

.tab-item.active {
  color: var(--text-color-primary);
  font-weight: bold;
  background: transparent;
  transition: color 0.2s ease;
}

.tab-slider {
  position: absolute;
  top: 16px;
  width: 64px;
  height: 40px;
  border-radius: 999px;
  background: var(--bg-color-secondary);
  transition: left 0.3s cubic-bezier(.4, 0, .2, 1), background-color 0.2s ease;
  z-index: 0;
}

.fixedTab .tab-slider {
  position: absolute;
  top: 16px;
  width: 64px;
  height: 40px;
  border-radius: 999px;
  background: var(--bg-color-secondary);
  transition: left 0.3s cubic-bezier(.4, 0, .2, 1), background-color 0.2s ease;
  z-index: 0;
}

.hidden {
  display: none;
}



/* ---------- 6. 悬浮按钮样式 ---------- */
.btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--bg-color-primary);
  border: var(--border-color-primary) 1px solid;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}




.btn-icon {
  color: var(--text-color-secondary);
  transition: color 0.3s ease;
}

.btn:hover {
  background-color: var(--bg-color-secondary);
  transition: all 0.2s ease;
}

.btn:hover .btn-icon {
  color: var(--text-color-primary);
}

.edit-profile-button-wrapper {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.edit-profile-btn {
  padding: 3px 16px;
  border: 1px solid var(--text-color-quaternary);
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  width: 90px;
  height: 40px;
  text-align: center;
  transition: all 0.2s ease;
  user-select: none;
  background: #aeadad0d;
  color: var(--text-color-tertiary);
}

.edit-profile-btn:hover {
  background: #6e6e6e2c;
  color: var(--text-color-secondary);
  border-color: var(--text-color-tertiary);
}

/* ---------- 7. 通用工具类 ---------- */
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ---------- 8. 媒体查询 ---------- */
@media (min-width: 901px) {

  /* 用户信息区域响应式 */
  .user-info {
    max-width: 650px;
    margin: 0 auto;
    padding: 16px 0px;
  }

  /* 内边距调整 */
  .basic-info,
  .user-desc,
  .user-interactions {
    padding: 0;
  }

  /* Tab栏响应式 */
  .tab {
    max-width: 700px;
    margin: 0 auto;
    padding-left: 0;
  }

  .fixedTab {
    padding-left: 220px;
  }

  /* 内容区域响应式 */
  .content-item {
    padding-left: 0;
  }

  /* 编辑资料按钮在大屏下的位置调整 */
  .edit-profile-button-wrapper {
    right: 0;
  }

}
</style>