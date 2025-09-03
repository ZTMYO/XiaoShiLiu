<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useAboutStore } from '@/stores/about'
import { useChangePasswordStore } from '@/stores/changePassword'
import AuthModal from '@/components/modals/AuthModal.vue'
import AboutModal from '@/components/modals/AboutModal.vue'
import ChangePasswordModal from '@/components/modals/ChangePasswordModal.vue'

const userStore = useUserStore()
const authStore = useAuthStore()
const aboutStore = useAboutStore()
const changePasswordStore = useChangePasswordStore()

// 应用启动时初始化用户信息
onMounted(() => {
  userStore.initUserInfo()
})
</script>

<template>
  <div class="app-container">
    <RouterView />
    <AuthModal v-if="authStore.showAuthModal" :initial-mode="authStore.initialMode" @close="authStore.closeAuthModal"
      @success="authStore.closeAuthModal" />
    <AboutModal v-if="aboutStore.showAboutModal" @close="aboutStore.closeAboutModal" />
    <ChangePasswordModal v-if="changePasswordStore.showChangePasswordModal" 
      :userInfo="userStore.userInfo"
      @close="changePasswordStore.closeChangePasswordModal" />
  </div>
</template>

<style>
.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  min-width: 100%;
  background-color: var(--bg-color-primary);
  box-sizing: border-box;
  position: relative;
  overflow-x: hidden;
  transition: background 0.2s ease;
}

body {
  margin: 0;
  padding: 0;
}
</style>