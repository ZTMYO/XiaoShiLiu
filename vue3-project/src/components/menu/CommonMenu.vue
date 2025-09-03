<script setup>
import DropdownItem from '@/components/menu/DropdownItem.vue'
import DropdownDivider from '@/components/menu/DropdownDivider.vue'
import ThemeSwitcherMenuItem from '@/components/menu/ThemeSwitcherMenuItem.vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useAboutStore } from '@/stores/about'
import { useChangePasswordStore } from '@/stores/changePassword'

const userStore = useUserStore()
const authStore = useAuthStore()
const aboutStore = useAboutStore()
const changePasswordStore = useChangePasswordStore()

// 登录处理
const handleLoginClick = () => {
  authStore.openLoginModal()
}

// 退出登录处理
const handleLogout = async () => {
  try {
    await userStore.logout()
    // 退出登录后刷新页面，避免保留错误信息
    window.location.reload()
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 菜单项点击处理
const handleMenuClick = (action) => {
  if (action === 'about') {
    aboutStore.openAboutModal()
  } else if (action === 'logout') {
    handleLogout()
  } else if (action === 'login') {
    handleLoginClick()
  } else if (action === 'changePassword') {
    changePasswordStore.openChangePasswordModal()
  }
}
</script>

<template>

  <DropdownItem @click="handleMenuClick('about')">
    关于小石榴
  </DropdownItem>

  <ThemeSwitcherMenuItem />
  <DropdownDivider />

  <DropdownItem v-if="userStore.isLoggedIn" @click="handleMenuClick('changePassword')">
    修改密码
  </DropdownItem>

  <DropdownItem v-if="userStore.isLoggedIn" @click="handleMenuClick('logout')">
    退出登录
  </DropdownItem>
  <DropdownItem v-else @click="handleMenuClick('login')">
    登录/注册
  </DropdownItem>
</template>