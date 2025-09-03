<template>
  <div class="admin-layout">

    <template v-if="localLoginSuccess">

      <div class="sidebar" :class="{ collapsed: isCollapsed, expanded: isExpanded }" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave">
        <div class="sidebar-header">
          <div class="logo">
            <img :src="logoUrl" alt="" style="height: 40px;">
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

          <div v-if="!isCollapsed || isExpanded" class="admin-theme-switcher">
            <div class="theme-switcher-content">
              <div class="theme-toggle-container">
                <div class="theme-toggle-track">

                  <div class="theme-toggle-indicator" :style="{ transform: `translateX(${indicatorPosition}px)` }">
                  </div>


                  <div v-for="(option, index) in themeStore.themeOptions" :key="option.value"
                    class="theme-option-wrapper">
                    <button class="theme-toggle-option" :class="{ 'active': themeStore.currentTheme === option.value }"
                      @click="themeStore.setTheme(option.value)" :title="option.label">
                      <SvgIcon :name="option.icon" width="12" height="12" />
                    </button>
                    <div class="tooltip">{{ option.label }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button class="logout-btn" @click="handleLogout" title="退出登录">
            <SvgIcon name="leftArrow" />
            <span class="logout-text">退出登录</span>
          </button>
        </div>
      </div>


      <div class="main-content">
        <div class="content-header">
          <div class="header-left">
            <h1>{{ currentPageTitle }}</h1>
            <p class="page-description">{{ currentPageDescription }}</p>
          </div>
          <div class="header-right">
            <button class="back-btn" @click="goBack">
              <SvgIcon name="home" />
              返回主站
            </button>
          </div>
        </div>
        <div class="content-body">
          <router-view />
        </div>
      </div>
    </template>


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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useAdminStore } from '@/stores/admin'
import { useThemeStore } from '@/stores/theme'
import { useConfirm } from './composables/useConfirm'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()
const themeStore = useThemeStore()

// 静态资源URL
const logoUrl = new URL('@/assets/imgs/logo.ico', import.meta.url).href

// 确认弹框
const { confirmState, handleConfirm, handleCancel, confirmLogout } = useConfirm()

// 计算指示器位置
const indicatorPosition = computed(() => {
  const index = themeStore.themeOptions.findIndex(option => option.value === themeStore.currentTheme)
  return index * 24 // 后台管理中按钮尺寸较小，使用24px
})

// 侧边栏状态
const isCollapsed = ref(true) // 默认收起
const isExpanded = ref(false) // 鼠标悬停时展开

// 登录状态
const isLoading = ref(true)
const isLoggedIn = computed(() => adminStore.isLoggedIn)
const localLoginSuccess = ref(false) // 本地登录成功标记

// 组件挂载时检查登录状态
onMounted(async () => {
  try {
    // 初始化管理员信息
    adminStore.initializeAdmin()

    // 检查是否已登录
    if (!adminStore.isLoggedIn) {
      // 重定向到登录页面
      router.push('/admin/login')
      return
    }

    // 验证token有效性
    const isValid = await adminStore.checkTokenValidity()
    if (!isValid) {
      showMessage('登录已过期，请重新登录', 'error')
      // 重定向到登录页面
      router.push('/admin/login')
    } else {
      localLoginSuccess.value = true
    }
  } catch (error) {
    console.error('初始化失败:', error)
    // 重定向到登录页面
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

// 菜单项
const menuItems = [
  { path: '/admin/api-docs', title: 'API文档', icon: 'data' },
  { path: '/admin/users', title: '用户管理', icon: 'user' },
  { path: '/admin/posts', title: '笔记管理', icon: 'note' },
  { path: '/admin/comments', title: '评论管理', icon: 'chat' },
  { path: '/admin/tags', title: '标签管理', icon: 'hash' },
  { path: '/admin/likes', title: '点赞管理', icon: 'like' },
  { path: '/admin/collections', title: '收藏管理', icon: 'collect' },
  { path: '/admin/follows', title: '关注管理', icon: 'follow' },
  { path: '/admin/notifications', title: '通知管理', icon: 'notification' },
  { path: '/admin/sessions', title: '会话管理', icon: 'setting' },
  { path: '/admin/admins', title: '管理员管理', icon: 'user' }
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
    '/admin/users': '管理用户账户和权限',
    '/admin/posts': '管理用户发布的笔记内容',
    '/admin/comments': '管理用户评论和回复',
    '/admin/tags': '管理笔记标签分类',
    '/admin/likes': '管理用户点赞记录',
    '/admin/collections': '管理用户收藏记录',
    '/admin/follows': '管理用户关注关系',
    '/admin/notifications': '管理系统通知消息',
    '/admin/sessions': '管理用户登录会话',
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

const handleMouseLeave = () => {
  isExpanded.value = false
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
}

.sidebar {
  width: 280px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color-primary);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 100;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar.collapsed.expanded {
  width: 280px;
  z-index: 1000;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border-color-primary);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
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

.logo img {
  margin-left: 10px;
  height: 32px;
  width: auto;
  flex-shrink: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
  flex-shrink: 0;
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
}

.sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid var(--border-color-primary);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 主题切换器样式 */
.admin-theme-switcher {
  width: 100%;
}

.theme-switcher-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
}

.theme-toggle-container {
  display: inline-block;
  flex-shrink: 0;
}

.theme-toggle-track {
  position: relative;
  display: flex;
  background: var(--bg-color-secondary);
  border-radius: 12px;
  padding: 2px;
  border: 1px solid var(--border-color-primary);
}

.theme-option-wrapper {
  position: relative;
  display: inline-block;
}

.theme-toggle-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: var(--bg-color-primary);
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.theme-toggle-option {
  position: relative;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
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
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
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
  gap: 8px;
  padding: 8px 12px;
  background: none;
  border: 1px solid var(--border-color-primary);
  color: var(--text-color-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  white-space: nowrap;
  width: 100%;
}

.sidebar.collapsed .logout-btn {
  justify-content: center;
  padding: 8px;
  width: 56px;
  height: 40px;
}

.sidebar.collapsed.expanded .logout-btn {
  justify-content: flex-start;
  padding: 8px 12px;
  width: 100%;
}

.logout-btn:hover {
  background-color: var(--bg-color-secondary);
}

.logout-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.logout-text {
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed .logout-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.sidebar.collapsed.expanded .logout-text {
  opacity: 1;
  width: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--text-color-primary);
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 999px;
  margin: 4px 0;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
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
  transition: all 0.2s ease;
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
</style>