<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScroll, useWindowSize } from '@vueuse/core'
import { useNavigationStore } from '@/stores/navigation'
import { useUserStore } from '@/stores/user'
import UserList from '@/views/search/components/UserList.vue'
import { userApi } from '@/api/index.js'
import BackToTopButton from '@/components/BackToTopButton.vue'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()
const userStore = useUserStore()

onMounted(() => {
  navigationStore.scrollToTop('instant')
})

const { y: scrollY } = useScroll(window)
const { width: windowWidth } = useWindowSize()

const tabs = ref([
  { name: 'mutual', label: '互相关注' },
  { name: 'following', label: '关注' },
  { name: 'followers', label: '粉丝' }
])

const activeTab = ref(route.params.type || 'following')
const tabBarRef = ref(null)
const fixedTabBarRef = ref(null)
const contentContainerRef = ref(null)

const userLists = ref({
  mutual: [],
  following: [],
  followers: []
})
const loading = ref(false)

const sliderStyle = computed(() => {
  const index = tabs.value.findIndex(tab => tab.name === activeTab.value)
  const isLargeScreen = windowWidth.value > 900

  if (isLargeScreen) {
    return {
      left: `calc(50% - 120px + ${index * 80}px)`
    }
  } else {
    return {
      left: `calc(50% - 104px + ${index * 80}px)`
    }
  }
})

const fixedSliderStyle = computed(() => {
  const index = tabs.value.findIndex(tab => tab.name === activeTab.value)
  const isLargeScreen = windowWidth.value > 900

  if (isLargeScreen) {
    return {
      left: `calc(220px + (100vw - 220px - 240px) / 2 + ${index * 80}px)`
    }
  } else {
    return {
      left: `calc(50% - 104px + ${index * 80}px)`
    }
  }
})



async function loadUserList(type) {
  loading.value = true
  try {
    const currentUserId = userStore.userInfo?.id

    if (!currentUserId) {
      console.error('用户未登录，无法加载关注列表')
      userLists.value[type] = []
      return
    }

    let response
    switch (type) {
      case 'mutual':
        response = await userApi.getMutualFollows(currentUserId)
        break
      case 'following':
        response = await userApi.getFollowing(currentUserId)
        break
      case 'followers':
        response = await userApi.getFollowers(currentUserId)
        break
    }

    if (response.success && response.data) {
      let users = []

      switch (type) {
        case 'mutual':
          users = response.data.mutualFollows || []
          break
        case 'following':
          users = response.data.following || []
          break
        case 'followers':
          users = response.data.followers || []
          break
      }

      userLists.value[type] = users.map(user => {
        const transformedUser = {
          id: user.id,
          nickname: user.nickname,
          userId: user.user_id,
          user_id: user.user_id,
          avatar: user.avatar,
          followers: user.fans_count || 0,
          notes: user.post_count || 0,
          isFollowing: user.isFollowing || false,
          isMutual: user.isMutual || false,
          buttonType: user.buttonType || 'follow',
          bio: user.bio,
          followCount: user.follow_count || 0,
          fansCount: user.fans_count || 0,
          followedAt: user.followed_at
        }

        return transformedUser
      })
    } else {
      userLists.value[type] = []
    }
  } catch (error) {
    console.error(`加载${type}列表失败:`, error)
    userLists.value[type] = []
  } finally {
    loading.value = false
  }
}

function onTabClick(tabName) {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop

  if (currentScrollTop > 500) {
    navigationStore.scrollToTop('instant')
  }

  activeTab.value = tabName

  router.replace({
    name: 'follow_list',
    params: { type: tabName }
  })

  if (userLists.value[tabName].length === 0) {
    loadUserList(tabName)
  }

  if (currentScrollTop <= 500) {
    setTimeout(() => {
      navigationStore.scrollToTop('smooth')
    }, 300)
  }
}



function handleUnfollow(user) {
  const listName = activeTab.value === 'following' ? 'following' : 'followers'
  const userIndex = userLists.value[listName].findIndex(u => u.userId === user.userId)
  if (userIndex !== -1) {
  }
}

function handleUserClick(user) {
  const userUrl = `${window.location.origin}/user/${user.user_id}`
  window.open(userUrl, '_blank')
}

function goTop() {
  navigationStore.scrollToTop('smooth')
}

onMounted(() => {
  userStore.initUserInfo()
  if (!userStore.isLoggedIn) {
    console.warn('用户未登录，跳转回首页')
    router.push('/')
    return
  }

  loadUserList(activeTab.value)
})
</script>

<template>
  <div class="follow-list-container">

    <div class="header">
      <div class="header-left"></div>
      <div class="header-title">
        {{ activeTab === 'mutual' ? '互相关注' : activeTab === 'following' ? '关注' : '粉丝' }}
      </div>
      <div class="header-right"></div>
    </div>


    <div class="tab" ref="tabBarRef">
      <div v-for="item in tabs" :key="item.name" class="tab-item" :class="{ active: activeTab === item.name }"
        @click="onTabClick(item.name)">
        {{ item.label }}
      </div>
      <div class="tab-slider" :style="sliderStyle"></div>
    </div>


    <div class="fixedTab" :class="{ hidden: scrollY < 120 }" ref="fixedTabBarRef">
      <div v-for="item in tabs" :key="item.name" class="tab-item" :class="{ active: activeTab === item.name }"
        @click="onTabClick(item.name)">
        {{ item.label }}
      </div>
      <div class="tab-slider" :style="fixedSliderStyle"></div>
    </div>


    <div class="content-switch-container" ref="contentContainerRef">

      <div class="content-item" :class="{ active: activeTab === 'mutual' }"
        :style="{ transform: activeTab === 'mutual' ? 'translateX(0%)' : 'translateX(-100%)' }">
        <div class="user-list-container">
          <UserList :users="userLists.mutual" :loading="loading && activeTab === 'mutual'" @follow="handleFollow"
            @unfollow="handleUnfollow" @userClick="handleUserClick" />
        </div>
      </div>


      <div class="content-item" :class="{ active: activeTab === 'following' }"
        :style="{ transform: activeTab === 'following' ? 'translateX(0%)' : (activeTab === 'mutual' ? 'translateX(100%)' : 'translateX(-100%)') }">
        <div class="user-list-container">
          <UserList :users="userLists.following" :loading="loading && activeTab === 'following'" @follow="handleFollow"
            @unfollow="handleUnfollow" @userClick="handleUserClick" />
        </div>
      </div>


      <div class="content-item" :class="{ active: activeTab === 'followers' }"
        :style="{ transform: activeTab === 'followers' ? 'translateX(0%)' : 'translateX(100%)' }">
        <div class="user-list-container">
          <UserList :users="userLists.followers" :loading="loading && activeTab === 'followers'" @follow="handleFollow"
            @unfollow="handleUnfollow" @userClick="handleUserClick" />
        </div>
      </div>
    </div>


    <BackToTopButton />
  </div>
</template>

<style scoped>
/* ---------- 1. 全局样式设置 ---------- */
* {
  box-sizing: border-box;
}

/* ---------- 2. 布局容器样式 ---------- */
.follow-list-container {
  padding-top: 72px;
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  background: var(--bg-color-primary);
  padding-bottom: 20px;
  min-height: calc(100vh - 72px);
}

/* ---------- 3. 顶部导航栏样式 ---------- */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: var(--bg-color-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.header-left {
  width: 48px;
  height: 48px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color-primary);
}

.header-right {
  width: 48px;
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
}

.tab-item {
  width: 80px;
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
}

.tab-item:hover {
  color: var(--text-color-primary);
}

.tab-item.active {
  color: var(--text-color-primary);
  font-weight: bold;
  background: transparent;
}

.tab-slider {
  position: absolute;
  top: 16px;
  width: 80px;
  height: 40px;
  border-radius: 999px;
  background: var(--bg-color-secondary);
  transition: left 0.3s cubic-bezier(.4, 0, .2, 1);
  z-index: 0;
}

.fixedTab .tab-slider {
  position: absolute;
  top: 16px;
  width: 80px;
  height: 40px;
  border-radius: 999px;
  background: var(--bg-color-secondary);
  transition: left 0.3s cubic-bezier(.4, 0, .2, 1);
  z-index: 0;
}

.hidden {
  display: none;
}

/* ---------- 5. 内容切换区域样式 ---------- */
.content-switch-container {
  width: 100%;
  max-width: 1200px;
  background: var(--bg-color-primary);
  position: relative;
  overflow: hidden;
  /* 隐藏水平滚动条 */
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

.user-list-container {
  width: 100%;
  max-width: 700px;
  padding: 0 16px calc(48px + constant(safe-area-inset-bottom)) 16px;
  padding: 0 16px calc(48px + env(safe-area-inset-bottom)) 16px;
  margin: 0 auto;
  background: var(--bg-color-primary);
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
}

.btn-icon {
  color: var(--text-color-secondary);
  transition: color 0.3s ease;
}

.btn:hover {
  background-color: var(--bg-color-secondary);
}

.btn:hover .btn-icon {
  color: var(--text-color-primary);
}

/* ---------- 7. 媒体查询 ---------- */
@media (min-width: 901px) {

  /* Tab栏响应式 */
  .tab {
    max-width: 700px;
    margin: 0 auto;
    padding-left: 0;
  }

  .fixedTab {
    padding-left: 220px;
  }

  /* 用户列表容器响应式 */
  .user-list-container {
    max-width: 650px;
    padding: 0;
  }
}
</style>