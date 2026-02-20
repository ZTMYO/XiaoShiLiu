<template>
  <div class="admin-layout">
    <template v-if="localLoginSuccess">
      <div class="sidebar" :class="{ collapsed: isCollapsed, expanded: isExpanded }" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <img :src="logoUrl" alt="logo">
            </div>
            <h2 class="logo-text">小石榴管理后台</h2>
          </div>
        </div>
        <nav class="sidebar-nav">
          <router-link v-for="item in menuItems" :key="item.path" :to="item.path" class="nav-item"
            :class="{ active: $route.path === item.path }" :title="isCollapsed && !isExpanded ? item.title : ''">
            <SvgIcon :name="item.icon" class="nav-icon" />
            <span class="nav-text">{{ item.title }}</span>
          </router-link>
        </nav>


        <div class="sidebar-footer">
          <div v-if="isExpanded || !isCollapsed">
            <div class="theme-switcher-content">
              <div class="admin-theme-toggle">
                <div class="theme-toggle-track">
                  <div class="theme-toggle-indicator" :style="{ transform: `translateX(${indicatorPosition}px)` }">
                  </div>
                  <div v-for="(option, index) in themeStore.themeOptions" :key="option.value"
                    class="theme-option-wrapper">
                    <button class="theme-toggle-option" :class="{ 'active': themeStore.currentTheme === option.value }"
                      @click="themeStore.setTheme(option.value)">
                      <SvgIcon :name="option.icon" width="12" height="12" />
                    </button>
                    <div class="tooltip">{{ option.label }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="logout-btn" @click="handleLogout">
            <SvgIcon name="logout" />
            <span class="logout-text">退出登录</span>
          </div>
        </div>


      </div>
    </template>

    <div class="main-content">
      <div class="content-header">
        <div class="header-left">
          <h1>{{ currentPageTitle }}</h1>
          <p class="page-description">{{ currentPageDescription }}</p>
        </div>
        <div class="header-right">
          <!-- 桌面端直接显示筛选区域 -->
          <div v-if="shouldShowFilter" class="filters-desktop desktop-only">
            <slot name="filters" />
          </div>

          <button class="back-btn" @click="goBack">
            <SvgIcon name="home" />
            <span class="back-text">返回主站</span>
          </button>
          <!-- 小屏筛选按钮（下拉） -->
          <div v-if="shouldShowFilter" class="filters mobile-only">
            <button class="filter-btn" @click="isFilterOpen = !isFilterOpen" aria-label="筛选"
              :class="{ active: isFilterOpen }">
              <SvgIcon name="filter" width="18" height="18" />
            </button>
            <div v-if="isFilterOpen" class="filter-menu" @click.self="isFilterOpen = false">
              <div class="filter-menu-content">
                <div class="filter-menu-header">
                  <h3>筛选条件</h3>
                  <div @click="isFilterOpen = false" class="filter-close-btn">
                    <SvgIcon name="close" width="18" height="18" />
                  </div>
                </div>
                <div id="mobile-filter-container"></div>
              </div>
            </div>
          </div>
          <!-- 移动端主题切换按钮 -->
          <button class="mobile-theme-toggle-btn mobile-only" @click="themeStore.toggleTwoTheme" aria-label="切换主题">
            <SvgIcon :name="themeStore.currentTheme === 'dark' ? 'sun' : 'moon'" width="20" height="20" />
          </button>

          <!-- 小屏菜单按钮（代替侧边栏） -->
          <DropdownMenu class="mobile-only" direction="down" menu-class="mobile-admin-menu">
            <template #trigger>
              <button class="mobile-menu-btn" aria-label="打开菜单">
                <SvgIcon name="menu" width="20" height="20" />
              </button>
            </template>
            <template #menu>
              <div class="mobile-menu-content">
                <DropdownItem v-for="item in menuItems" :key="item.path" @click="() => $router.push(item.path)">
                  <SvgIcon :name="item.icon" class="mobile-menu-icon" />
                  <span class="mobile-menu-text">{{ item.title }}</span>
                </DropdownItem>
                <div class="mobile-menu-divider"></div>
                <DropdownItem @click="handleLogout">
                  <SvgIcon name="logout" class="mobile-menu-icon" />
                  <span class="mobile-menu-text">退出登录</span>
                </DropdownItem>
              </div>
            </template>
          </DropdownMenu>
        </div>
      </div>
      <div class="content-body">
        <router-view @close-filter="isFilterOpen = false" />
      </div>
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>正在验证登录状态...</p>
    </div>

    <ConfirmDialog v-model:visible="confirmState.visible" :title="confirmState.title" :message="confirmState.message"
      :type="confirmState.type" :confirm-text="confirmState.confirmText" :cancel-text="confirmState.cancelText"
      :show-cancel="confirmState.showCancel" @confirm="handleConfirm" @cancel="handleCancel" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import DropdownItem from '@/components/menu/DropdownItem.vue'
import DropdownMenu from '@/components/menu/DropdownMenu.vue'
import { useAdminStore } from '@/stores/admin'
import { useThemeStore } from '@/stores/theme'
import { useConfirm } from './composables/useConfirm'
import { useScrollLock } from '@/composables/useScrollLock'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const themeStore = useThemeStore()
const { confirmState, handleConfirm, handleCancel, confirmLogout } = useConfirm()
const { lock, unlock } = useScrollLock()

const logoUrl = new URL('@/assets/imgs/小石榴.png', import.meta.url).href

const indicatorPosition = computed(() => {
  const index = themeStore.themeOptions.findIndex(option => option.value === themeStore.currentTheme)
  return index * 28 // 每个按钮宽度28px
})

const isCollapsed = ref(true)
const isExpanded = ref(false)

const isLoading = ref(true)
const isLoggedIn = computed(() => adminStore.isLoggedIn)
const localLoginSuccess = ref(false)

const isMobile = ref(false)
const isFilterOpen = ref(false)

// 判断当前页面是否需要显示筛选按钮
const shouldShowFilter = computed(() => {
  const noFilterRoutes = ['/admin/api-docs', '/admin/monitor']
  return !noFilterRoutes.includes(route.path)
})

function setupMobileWatcher() {
  if (typeof window === 'undefined' || !window.matchMedia) return
  const mql = window.matchMedia('(max-width: 960px)')
  const update = () => { isMobile.value = mql.matches }
  update()
  if (mql.addEventListener) {
    mql.addEventListener('change', update)
  } else if (mql.addListener) {
    mql.addListener(update)
  }
}

onMounted(async () => {
  try {
    adminStore.initializeAdmin()
    if (!adminStore.isLoggedIn) {
      router.push('/admin/login')
      return
    }
    const isValid = await adminStore.checkTokenValidity()
    if (!isValid) {
      showMessage('登录已过期，请重新登录', 'error')
      router.push('/admin/login')
    } else {
      localLoginSuccess.value = true
    }
    setupMobileWatcher()
  } catch (error) {
    console.error('初始化失败:', error)
    router.push('/admin/login')
  } finally {
    isLoading.value = false
  }
})

// 消息提示函数
const showMessage = (message, type = 'success') => {
  // 创建消息元素
  const messageEl = document.createElement('div')
  messageEl.className = `message-toast ${type}`
  messageEl.textContent = message

  // 添加样式
  Object.assign(messageEl.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '6px',
    color: 'white',
    fontSize: '14px',
    zIndex: '10000',
    opacity: '0',
    transform: 'translateX(100%)',
    transition: 'all 0.3s ease'
  })

  // 根据类型设置背景色
  const colors = {
    success: '#67C23A',
    error: '#F56C6C',
    warning: '#E6A23C',
    info: '#409EFF'
  }
  messageEl.style.backgroundColor = colors[type] || colors.info

  // 添加到页面
  document.body.appendChild(messageEl)

  // 显示动画
  setTimeout(() => {
    messageEl.style.opacity = '1'
    messageEl.style.transform = 'translateX(0)'
  }, 10)

  // 自动移除
  setTimeout(() => {
    messageEl.style.opacity = '0'
    messageEl.style.transform = 'translateX(100%)'
    setTimeout(() => {
      document.body.removeChild(messageEl)
    }, 300)
  }, 3000)
}

// 监听筛选菜单状态变化，控制滚动锁定
watch(isFilterOpen, (newValue) => {
  if (newValue) {
    lock()
  } else {
    unlock()
  }
})

// 菜单项
const menuItems = [
  { path: '/admin/api-docs', title: 'API文档', icon: 'data' },
  { path: '/admin/monitor', title: '动态监控', icon: 'monitor' },
  { path: '/admin/users', title: '用户管理', icon: 'user' },
  { path: '/admin/user-ban', title: '封禁管理', icon: 'ban' },
  { path: '/admin/posts', title: '笔记管理', icon: 'post' },
  { path: '/admin/comments', title: '评论管理', icon: 'chat' },
  { path: '/admin/categories', title: '分类管理', icon: 'category' },
  { path: '/admin/tags', title: '标签管理', icon: 'hash' },
  { path: '/admin/likes', title: '点赞管理', icon: 'like' },
  { path: '/admin/collections', title: '收藏管理', icon: 'collect' },
  { path: '/admin/follows', title: '关注管理', icon: 'follow' },
  { path: '/admin/notifications', title: '通知管理', icon: 'notification' },
  { path: '/admin/sessions', title: '会话管理', icon: 'setting' },
  { path: '/admin/audit', title: '认证管理', icon: 'verified' },
  { path: '/admin/admins', title: '管理员管理', icon: 'admin' }
]

// 当前页面标题
const currentPageTitle = computed(() => {
  const currentItem = menuItems.find(item => item.path === route.path)
  return currentItem?.title
})

// 当前页面描述
const currentPageDescription = computed(() => {
  const descriptions = {
    '/admin/api-docs': '查看和测试API接口文档',
    '/admin/monitor': '查看系统最近动态和活动监控',
    '/admin/users': '管理用户账户和权限',
    '/admin/user-ban': '管理用户封禁记录和状态',
    '/admin/posts': '管理用户发布的笔记内容',
    '/admin/comments': '管理用户评论和回复',
    '/admin/categories': '管理笔记分类和分类信息',
    '/admin/tags': '管理笔记标签分类',
    '/admin/likes': '管理用户点赞记录',
    '/admin/collections': '管理用户收藏记录',
    '/admin/follows': '管理用户关注关系',
    '/admin/notifications': '管理系统通知消息',
    '/admin/sessions': '管理用户登录会话',
    '/admin/audit': '管理用户认证申请和审核',
    '/admin/admins': '管理系统管理员账号'
  }
  return descriptions[route.path]
})

// 获取角色文本
const getRoleText = (role) => {
  const roleMap = {
    'super_admin': '超级管理员',
    'admin': '管理员',
    'moderator': '版主'
  }
  return roleMap[role] || '未知角色'
}

// 侧边栏鼠标事件处理
const handleMouseEnter = () => {
  if (isCollapsed.value) {
    isExpanded.value = true
  }
}

const handleMouseLeave = (event) => {
  // 获取侧边栏元素的边界信息
  const sidebarElement = event.currentTarget
  const rect = sidebarElement.getBoundingClientRect()

  // 获取鼠标离开时的位置
  const mouseX = event.clientX

  // 只有当鼠标从右侧离开时才收起侧边栏
  // 右侧边界位置 + 一些容差值
  if (mouseX >= rect.right - 5) {
    isExpanded.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await confirmLogout()
    // 用户确认退出
    try {
      await adminStore.logout()
      localLoginSuccess.value = false
      showMessage('已退出登录', 'success')
      // 重定向到登录页面
      router.push('/admin/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      showMessage('退出登录失败', 'error')
    }
  } catch (error) {
    // 用户取消退出，不做任何操作
  }
}

// 返回主站
const goBack = () => {
  window.open('/', '_blank')
}


</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-color-secondary);
  overflow: hidden;
  transition: background-color 0.3s ease;
}

.sidebar {
  width: 280px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color-primary);
  position: relative;
  z-index: 100;
}

.sidebar.collapsed {
  width: 80px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, border-color 0.3s ease;
}

.sidebar.collapsed.expanded {
  width: 280px;
  z-index: 1000;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, border-color 0.3s ease;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border-color-primary);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color-primary);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.sidebar.collapsed .sidebar-header {
  padding: 24px 12px;
  justify-content: center;
}

.sidebar.collapsed.expanded .sidebar-header {
  padding: 24px 20px;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon img {
  width: 120%;
  height: 100%;
  object-fit: contain;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed .logo-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar.collapsed.expanded .logo-text {
  opacity: 1;
  width: auto;
}



.sidebar-nav {
  flex: 1;
  padding: 20px 12px;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--bg-color-primary);
  transition: background-color 0.3s ease;
}

.sidebar.collapsed.expanded .sidebar-footer {
  border-top: 1px solid var(--border-color-primary);
  transition: border 0.3s ease, background-color 0.3s ease;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: var(--bg-color-primary);
  border-top: 1px solid var(--border-color-primary);
}

.theme-switcher-content {
  padding: 24px 8px 8px 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.admin-theme-toggle {
  display: inline-block;
  flex-shrink: 0;
}

.theme-toggle-track {
  position: relative;
  display: flex;
  background: var(--bg-color-secondary);
  border-radius: 16px;
  padding: 2px;
  border: 1px solid var(--border-color-primary);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.theme-option-wrapper {
  position: relative;
  display: inline-block;
}

.theme-toggle-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  background: var(--bg-color-primary);
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.theme-toggle-option {
  position: relative;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;
  color: var(--text-color-tertiary);
}

.theme-toggle-option:hover {
  color: var(--text-color-secondary);
}

.theme-toggle-option.active {
  color: var(--text-color-primary);
}

/* Tooltip 样式 */
.tooltip {
  position: absolute;
  bottom: 35px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color-primary);
  z-index: 10;
  pointer-events: none;
}

.theme-option-wrapper:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

/* 确保图标在按钮中完全居中 */
.theme-toggle-option :deep(svg) {
  display: block;
  margin: auto;
}

[data-theme="dark"] .theme-toggle-indicator {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: var(--bg-color-secondary);
}

.sidebar.collapsed .admin-info {
  justify-content: center;
  padding: 8px;
}

.sidebar.collapsed.expanded .admin-info {
  justify-content: flex-start;
  padding: 8px 12px;
}

.admin-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.admin-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.admin-details {
  flex: 1;
  min-width: 0;
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed .admin-details {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar.collapsed.expanded .admin-details {
  opacity: 1;
  width: auto;
}

.admin-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-role {
  font-size: 12px;
  color: var(--text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  display: flex;
  align-items: center;
  background: var(--bg-color-primary);
  border-top: 1px solid var(--border-color-primary);
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.sidebar.collapsed .logout-btn {
  justify-content: center;
  padding: 8px 8px 16px 8px;
}

.sidebar.collapsed.expanded .logout-btn {
  justify-content: flex-start;
  padding-left: 28px;
  width: calc(100% - 0px);
  box-sizing: border-box;
}

.logout-btn:hover {
  background-color: var(--bg-color-secondary);
}

.logout-btn svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: var(--text-color-tertiary);
}

.logout-text {
  opacity: 1;
  margin-left: 10px;
  text-wrap: nowrap;
}

.sidebar.collapsed .logout-text {
  opacity: 0;
  overflow: hidden;
  display: none;
}

.sidebar.collapsed.expanded .logout-text {
  opacity: 1;
  width: auto;
  display: flex;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--text-color-primary);
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: 999px;
  margin: 4px 0;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
  transition: all 0.3s ease;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar.collapsed.expanded .nav-item {
  justify-content: flex-start;
  padding: 12px 16px;
}

.nav-item:hover {
  background-color: var(--bg-color-secondary);
}

.nav-item.active {
  background-color: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  flex-shrink: 0;
  color: var(--text-color-tertiary);
  transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed .nav-icon {
  margin-right: 0;
}

.sidebar.collapsed.expanded .nav-icon {
  margin-right: 12px;
}

.nav-item.active .nav-icon {
  color: var(--primary-color);
}

.nav-text {
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed .nav-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar.collapsed.expanded .nav-text {
  opacity: 1;
  width: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-header {
  background-color: var(--bg-color-primary);
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-color-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: var(--text-color-primary);
  font-weight: 600;
}

.page-description {
  margin: 0;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.header-right {
  display: flex;
  align-items: center;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  font-weight: 500;
}

.back-btn:hover {
  opacity: 0.9;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.content-body {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background-color: var(--bg-color-secondary);
  flex-direction: column;
  transition: background-color 0.3s ease;
}

/* 滚动条样式 */
.sidebar-nav::-webkit-scrollbar,
.content-body::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: var(--bg-color-secondary);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--border-color-primary);
  border-radius: 3px;
}

.content-body::-webkit-scrollbar-track {
  background: var(--bg-color-tertiary);
}

.content-body::-webkit-scrollbar-thumb {
  background: var(--border-color-primary);
  border-radius: 3px;
}

.content-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-quaternary);
}

/* 加载覆盖层样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--overlay-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color-primary);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin: 0;
}



/* header 内小屏品牌区域样式 */
.header-brand {
  display: none;
  align-items: center;
  gap: 8px;
}

/* 默认仅桌面显示的元素 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* 小屏规则（合并） */
@media (max-width: 960px) {
  .sidebar {
    display: none;
  }

  .header-brand {
    display: flex;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: inline-flex;
  }

  .back-btn .back-text {
    display: none;
  }

  .header-right .back-btn,
  .header-right .filter-btn,
  .header-right .mobile-theme-toggle-btn,
  .header-right .mobile-menu-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    margin-left: 8px;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--button-text-color);
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .header-right .back-btn:hover,
  .header-right .filter-btn:hover,
  .header-right .mobile-theme-toggle-btn:hover,
  .header-right .mobile-menu-btn:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }

  .header-right .back-btn svg,
  .header-right .filter-btn svg,
  .header-right .mobile-theme-toggle-btn svg,
  .header-right .mobile-menu-btn svg {
    width: 20px;
    height: 20px;
  }
}

/* header 内的 mobile 菜单定位 */
.content-header {
  position: relative;
}

.content-header .mobile-menu {
  position: absolute;
  top: 56px;
  right: 32px;
}

/* 默认隐藏移动头部（仅小屏显示） */
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 200;
  height: 56px;
  padding: 0 12px;
  background: var(--bg-color-primary);
  border-bottom: 1px solid var(--border-color-primary);
  align-items: center;
  justify-content: space-between;
}

.mobile-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-logo {
  width: 28px;
  height: 28px;
}

.mobile-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.mobile-header-right {
  position: relative;
  display: flex;
  align-items: center;
}

.mobile-menu-btn {
  border: none;
  background: transparent;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-color-primary);
  transition: background-color 0.3s ease;
}

.mobile-menu-icon {
  width: 18px;
  height: 18px;
  margin-right: 10px;
  color: var(--text-color-tertiary);
}

.mobile-menu-text {
  font-size: 14px;
}

/* 移动端管理菜单样式 */
.mobile-admin-menu {
  max-height: 70vh;
  overflow-y: auto;
  min-width: 220px;
}

.mobile-menu-content {
  max-height: 70vh;
  overflow-y: auto;
}

.mobile-menu-content::-webkit-scrollbar {
  width: 4px;
}

.mobile-menu-content::-webkit-scrollbar-track {
  background: var(--bg-color-secondary);
}

.mobile-menu-content::-webkit-scrollbar-thumb {
  background: var(--border-color-primary);
  border-radius: 2px;
}

.mobile-menu-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-quaternary);
}

.mobile-menu-divider {
  height: 1px;
  background: var(--border-color-primary);
  margin: 8px 16px;
}


.filters {
  position: relative;
}


.filter-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  height: 100vh;
  height: 100dvh;
}

.filter-menu-content {
  background: var(--bg-color-primary);
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-height: 70vh;
  max-height: 70dvh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  min-height: 200px;
  transition: background-color 0.3s ease;
}

.filter-menu-content::-webkit-scrollbar {
  width: 4px;
}

.filter-menu-content::-webkit-scrollbar-track {
  background: var(--bg-color-secondary);
}

.filter-menu-content::-webkit-scrollbar-thumb {
  background: var(--border-color-primary);
  border-radius: 2px;
}

.filter-menu-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-quaternary);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

.filter-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-primary);
  transition: border-color 0.3s ease;
}

.filter-menu-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-color-secondary);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
}

.filter-btn.active {
  background: var(--primary-color) !important;
  color: white !important;
}

.filters-desktop {
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>