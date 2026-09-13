<template>
  <div class="admin-login-page">
    <aside class="login-brand">
      <div class="logo" @click="router.push('/')" title="返回主站">
        <img :src="logoUrl" alt="小石榴" />
      </div>
      <div class="brand-inner">
        <h1 class="brand-title">小石榴图文社区</h1>
        <p class="brand-slogan">让你的创作、分享与交流简单、清晰、高效。</p>
        <p class="brand-meta">Vue3 + Express + MySQL · GPLv3 开源</p>
      </div>
    </aside>

    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2 class="login-title">小石榴管理后台</h2>
          <p class="login-subtitle">请使用管理员账号登录</p>
        </div>

        <div v-if="unifiedMessage" class="message" :class="messageType">
          {{ unifiedMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">用户名</label>
            <div class="input-wrapper">
              <input type="text" id="username" v-model="formData.username" class="form-input"
                :class="{ 'error': errors.username }" placeholder="请输入用户名" autocomplete="off" @input="clearError('username')" />
            </div>
            <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <div class="input-wrapper">
              <input type="password" id="password" v-model="formData.password" class="form-input"
                :class="{ 'error': errors.password }" placeholder="请输入密码" autocomplete="new-password" @input="clearError('password')" />
            </div>
            <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          </div>

          <button type="submit" class="login-button" :disabled="isSubmitting">
            <span v-if="isSubmitting">登录中...</span>
            <span v-else>登录</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

// Router
const router = useRouter()

// Store
const adminStore = useAdminStore()

const logoUrl = new URL('@/assets/imgs/小石榴.png', import.meta.url).href

// 响应式数据
const isSubmitting = ref(false)
const unifiedMessage = ref('')
const messageType = ref('error') // 'error' | 'success'

// 表单数据
const formData = reactive({
  username: '',
  password: ''
})

// 错误信息
const errors = reactive({
  username: '',
  password: ''
})

// 清除错误信息
const clearError = (field) => {
  errors[field] = ''
  unifiedMessage.value = ''
}

// 处理表单提交
const handleSubmit = async () => {
  // 清除之前的错误信息
  errors.username = ''
  errors.password = ''
  unifiedMessage.value = ''

  // 验证表单
  let hasError = false

  if (!formData.username.trim()) {
    errors.username = '请输入用户名'
    hasError = true
  } else if (formData.username.length < 2) {
    errors.username = '用户名至少需要2位'
    hasError = true
  }

  if (!formData.password) {
    errors.password = '请输入密码'
    hasError = true
  } else if (formData.password.length < 6) {
    errors.password = '密码至少需要6位'
    hasError = true
  }

  // 如果有错误，不提交表单
  if (hasError) {
    return
  }

  isSubmitting.value = true

  try {
    const result = await adminStore.login({
      username: formData.username,
      password: formData.password
    })

    if (result.success) {
      unifiedMessage.value = '登录成功，正在跳转...'
      messageType.value = 'success'

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/admin/monitor')
      }, 1000)
    } else {
      unifiedMessage.value = result.message || '登录失败，请检查用户名和密码'
      messageType.value = 'error'
    }
  } catch (error) {
    console.error('登录错误:', error)
    unifiedMessage.value = error.message || '登录失败，请稍后重试'
    messageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--bg-color-primary);
}

/* ===== 左侧品牌区 ===== */
.login-brand {
  position: relative;
  flex: 0 0 58%;
  max-width: 760px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 48px 64px 72px;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--bg-color-secondary);
}

/* 主题色柔光，避免大面积浅色底显得空 */
.login-brand::before,
.login-brand::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform;
}

.login-brand::before {
  width: 520px;
  height: 520px;
  top: -180px;
  right: -140px;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  filter: blur(90px);
  animation: brand-drift-a 24s ease-in-out infinite alternate;
}

.login-brand::after {
  width: 420px;
  height: 420px;
  bottom: -180px;
  left: -120px;
  background: color-mix(in srgb, var(--primary-color) 7%, transparent);
  filter: blur(90px);
  animation: brand-drift-b 28s ease-in-out infinite alternate-reverse;
}

@keyframes brand-drift-a {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-60px, 50px, 0) scale(1.12);
  }
  100% {
    transform: translate3d(40px, 90px, 0) scale(0.95);
  }
}

@keyframes brand-drift-b {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(70px, -50px, 0) scale(1.1);
  }
  100% {
    transform: translate3d(-50px, -90px, 0) scale(0.92);
  }
}

.brand-inner {
  position: relative;
  max-width: 420px;
  margin: auto 0;
}

.brand-title {
  margin: 0;
  font-size: 36px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--text-color-primary);
}

.brand-slogan {
  margin: 22px 0 0;
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-color-secondary);
}

.brand-meta {
  margin: 32px 0 0;
  font-size: 13px;
  color: var(--text-color-tertiary);
}

/* ===== 右侧表单区 ===== */
.login-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 380px;
}

.login-header {
  margin-bottom: 32px;
}

.logo {
  width: 68.32px;
  height: 32px;
  background: var(--primary-color);
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.logo img {
  width: 68.32px;
  height: 32px;
}

.login-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.login-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--text-color-tertiary);
}

.message {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 20px;
}

.message.success {
  background: var(--bg-color-secondary);
  color: #38a169;
  border: 1px solid #9ae6b4;
}

.message.error {
  background: var(--bg-color-secondary);
  color: #e53e3e;
  border: 1px solid #feb2b2;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  font-size: 14px;
  box-sizing: border-box;
  caret-color: var(--primary-color);
  transition: border-color 0.2s ease;
}

.form-input::placeholder {
  color: var(--text-color-quaternary);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-input.error {
  border-color: var(--primary-color);
}

.error-message {
  font-size: 12px;
  color: var(--primary-color);
}

.login-button {
  width: 100%;
  height: 46px;
  margin-top: 4px;
  border: none;
  border-radius: 10px;
  background: var(--primary-color);
  color: var(--button-text-color);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.login-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary-color) 85%, #ffffff);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .login-brand {
    display: none;
  }

  .login-container {
    padding: 40px 20px;
  }
}
</style>
