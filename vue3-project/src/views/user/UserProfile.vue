<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScroll, useWindowSize } from '@vueuse/core'
import { useNavigationStore } from '@/stores/navigation'
import { useUserStore } from '@/stores/user'
import { useFollowStore } from '@/stores/follow'
import { userApi } from '@/api'
import WaterfallFlow from '@/components/WaterfallFlow.vue'
import FollowButton from '@/components/FollowButton.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import UserPersonalityTags from './components/UserPersonalityTags.vue'
import MentionText from '@/components/mention/MentionText.vue'
import BackToTopButton from '@/components/BackToTopButton.vue'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()
const userStore = useUserStore()
const followStore = useFollowStore()

const defaultAvatar = new URL('@/assets/imgs/avatar.png', import.meta.url).href
const userId = ref(route.params.userId)
const loading = ref(true)

// 获取滚动信息和窗口尺寸
const { y: scrollY } = useScroll(window)
const { width: windowWidth } = useWindowSize()

// tab栏相关
const tabs = ref([
  { name: 'notes', label: '笔记' },
  { name: 'collections', label: '收藏' }
])

const activeTab = ref('notes')
const tabBarRef = ref(null)
const fixedTabBarRef = ref(null)

// 用户信息
const userInfo = ref({
  id: null,
  user_id: '',
  nickname: '',
  avatar: '',
  bio: '',
  location: '',
  follow_count: 0,
  fans_count: 0,
  like_count: 0
})

// 用户统计信息
const userStats = ref({
  follow_count: 0,
  fans_count: 0,
  post_count: 0,
  like_count: 0,
  collect_count: 0,
  likes_and_collects: 0
})

// 关注状态
const followStatus = ref(false)

// 判断是否是当前用户
const isCurrentUser = computed(() => {
  return userStore.isLoggedIn && userStore.userInfo?.user_id === userId.value
})

// 计算滑块位置
const sliderStyle = computed(() => {
  const index = tabs.value.findIndex(tab => tab.name === activeTab.value)
  const isLargeScreen = windowWidth.value > 900

  if (isLargeScreen) {
    // 大屏：tab容器居中，max-width: 700px，无padding-left
    // 指示器需要相对于居中的tab容器定位
    return {
      left: `calc(50% - 64px + ${index * 64}px)`
    }
  } else {
    // 小屏：tab容器有padding-left: 16px，justify-content: center
    // 由于左边有16px padding，需要稍微向左调整以补偿视觉偏移
    return {
      left: `calc(50% - 56px + ${index * 64}px)`
    }
  }
})

const fixedSliderStyle = computed(() => {
  const index = tabs.value.findIndex(tab => tab.name === activeTab.value)
  const isLargeScreen = windowWidth.value > 900

  if (isLargeScreen) {
    // 大屏：fixedTab有padding-left: 220px，justify-content: center
    // 由于有220px的左边距，实际可用宽度是 (100% - 220px)
    // tab项在这个可用区域内居中，所以起始位置是：
    // 220px + (可用宽度 - 2*64px) / 2
    return {
      left: `calc(220px + (100vw - 220px - 128px) / 2 + ${index * 64}px)`
    }
  } else {
    // 小屏：与普通tab相同的布局
    return {
      left: `calc(50% - 56px + ${index * 64}px)`
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
}

// 回到顶部
function goTop() {
  navigationStore.scrollToTop('smooth')
}

// 获取用户信息
const getUserInfo = async () => {
  loading.value = true
  try {
    const response = await userApi.getUserInfo(userId.value)

    if (response.success) {
      userInfo.value = response.data
      // 获取用户信息成功后，再获取关注状态
      await getFollowStatus()
    } else {
      // 用户不存在或其他错误，清空用户信息
      userInfo.value = {}
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 网络错误或其他错误，也清空用户信息
    userInfo.value = {}
  } finally {
    loading.value = false
  }
}

// 获取用户统计信息
const getUserStats = async () => {
  try {
    const response = await userApi.getUserStats(userId.value)
    if (response.success) {
      userStats.value = response.data
    }
  } catch (error) {
    console.error('获取用户统计信息失败:', error)
  }
}

// 获取关注状态
const getFollowStatus = async () => {
  if (isCurrentUser.value || !userInfo.value.id) return

  try {
    const result = await followStore.fetchFollowStatus(userInfo.value.id)
    if (result.success) {
      followStatus.value = result.data.followed
      // 同时初始化 followStore 中的状态
      followStore.initUserFollowState(
        userInfo.value.id,
        result.data.followed,
        result.data.isMutual || false,
        result.data.buttonType || 'follow'
      )
    } else {
      // 如果获取失败（比如未登录），默认为未关注状态
      followStatus.value = false
    }
  } catch (error) {
    console.error('获取关注状态失败:', error)
    // 出错时默认为未关注状态
    followStatus.value = false
  }
}

// 监听路由参数变化
watch(() => route.params.userId, (newUserId) => {
  if (newUserId) {
    // 检查是否是当前用户访问自己的主页，如果是则重定向到 /user
    if (userStore.isLoggedIn && userStore.userInfo?.user_id === newUserId) {
      router.replace('/user')
      return
    }

    userId.value = newUserId
    activeTab.value = 'notes'

    // 重新加载数据
    getUserInfo()
    getUserStats()

    // 滚动到顶部
    navigationStore.scrollToTop('instant')
  }
})

onMounted(async () => {
  // 检查是否是当前用户访问自己的主页，如果是则重定向到 /user
  if (userStore.isLoggedIn && userStore.userInfo?.user_id === userId.value) {
    router.replace('/user')
    return
  }

  await getUserInfo()
  await getUserStats()
  navigationStore.scrollToTop('instant')
})
</script>
<template>
  <div class="content-container">

    <div class="user-info" v-if="userInfo.nickname">
      <div class="basic-info">
        <img :src="userInfo.avatar || defaultAvatar" :alt="userInfo.nickname || '用户头像'" class="avatar">
        <div class="user-basic">
          <div class="user-nickname">{{ userInfo?.nickname || '用户' }}</div>
          <div class="user-content">
            <div class="user-id text-ellipsis">小石榴号：{{ userInfo?.user_id || '' }}</div>
            <div class="user-IP text-ellipsis">IP属地：{{ userInfo?.location || '未知' }}</div>
          </div>
        </div>

        <div class="follow-button-wrapper" v-if="!isCurrentUser">
          <FollowButton :user-id="userInfo.id" :is-following="followStatus" />
        </div>
      </div>
      <div class="user-desc">
        <MentionText v-if="userInfo.bio" :text="userInfo.bio" />
        <span v-else>用户没有任何简介</span>
      </div>

      <UserPersonalityTags :user-info="userInfo" />
      <div class="user-interactions">
        <div class="interaction-item">
          <span class="count">{{ userStats.follow_count || 0 }}</span>
          <span class="shows">关注</span>
        </div>
        <div class="interaction-item">
          <span class="count">{{ userStats.fans_count || 0 }}</span>
          <span class="shows">粉丝</span>
        </div>
        <div class="interaction-item">
          <span class="count">{{ userStats.likes_and_collects || 0 }}</span>
          <span class="shows">获赞与收藏</span>
        </div>
      </div>
    </div>


    <div class="loading-state" v-else-if="loading">
      <div class="loading-content">
        <SvgIcon name="loading" width="32" height="32" class="loading-icon" />
        <p>加载用户信息中...</p>
      </div>
    </div>


    <div class="error-state" v-else>
      <div class="error-content">
        <SvgIcon name="user" width="48" height="48" class="error-icon" />
        <h3>用户不存在</h3>
        <p>该用户可能已被删除或不存在</p>
      </div>
    </div>


    <div class="tab" ref="tabBarRef" v-if="userInfo.nickname">
      <div v-for="item in tabs" class="tab-item" :class="{ active: activeTab === item.name }"
        @click="onTabClick(item.name)">
        {{ item.label }}
      </div>
      <div class="tab-slider" :style="sliderStyle"></div>
    </div>

    <div class="fixedTab" :class="{ hidden: scrollY < 260 }" ref="fixedTabBarRef" v-if="userInfo.nickname">
      <div v-for="item in tabs" class="tab-item" :class="{ active: activeTab === item.name }"
        @click="onTabClick(item.name)">
        {{ item.label }}
      </div>
      <div class="tab-slider" :style="fixedSliderStyle"></div>
    </div>


    <div class="content-switch-container" v-if="userInfo.nickname">

      <div class="content-item" :class="{ active: activeTab === 'notes' }"
        :style="{ transform: activeTab === 'notes' ? 'translateX(0%)' : 'translateX(-100%)' }">
        <div class="waterfall-container">
          <WaterfallFlow :userId="userId" :type="'posts'" :key="`notes-${userId}`" />
        </div>
      </div>


      <div class="content-item" :class="{ active: activeTab === 'collections' }"
        :style="{ transform: activeTab === 'collections' ? 'translateX(0%)' : 'translateX(100%)' }">
        <div class="waterfall-container">
          <WaterfallFlow :userId="userId" :type="'collections'" :key="`collections-${userId}`" />
        </div>
      </div>
    </div>


    <BackToTopButton />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.content-container {
  padding-top: 72px;
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  background: var(--bg-color-primary);
  min-height: 100vh;
  transition: background-color 0.2s ease;
}

/* 内容区域 */
.content-area {
  width: 100%;
  background-color: var(--bg-color-primary);
  /* 防止底部出现多余空间 */
  margin-bottom: 0;
  padding: 0px 10px calc(48px + constant(safe-area-inset-bottom)) 10px;
  padding: 0px 10px calc(48px + env(safe-area-inset-bottom)) 10px;
  box-sizing: border-box;
  overflow-x: hidden;
  transition: background-color 0.2s ease;
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

/* ---------- 3.5. 关注按钮样式 ---------- */
.follow-button-wrapper {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

/* ---------- 3.6. 加载和错误状态样式 ---------- */
.loading-state,
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 16px;
  background: var(--bg-color-primary);
}

.loading-content,
.error-content {
  text-align: center;
  max-width: 300px;
}

.loading-icon,
.error-icon {
  color: var(--text-color-quaternary);
  margin-bottom: 16px;
}

.loading-content p,
.error-content h3 {
  color: var(--text-color-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.error-content p {
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

/* ---------- 5. 内容切换容器样式 ---------- */
.content-switch-container {
  width: 100%;
  max-width: 1200px;
  background: var(--bg-color-primary);
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  /* 隐藏水平滚动条 */
  transition: background-color 0.2s ease;
}

.content-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: var(--bg-color-primary);
  transition: transform 0.3s ease;
  /* 平滑过渡动画 */
  opacity: 0;
  pointer-events: none;
  /* 非活跃状态下不响应鼠标事件 */
  display: flex;
  justify-content: center;
}

.content-item.active {
  position: relative;
  /* 活跃状态下使用相对定位，让容器高度跟随内容 */
  opacity: 1;
  pointer-events: auto;
  /* 活跃状态下响应鼠标事件 */
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

  /* 关注按钮在大屏下的位置调整 */
  .follow-button-wrapper {
    right: 0;
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
}
</style>