<template>
  <div class="admin-login-page">
    <div class="blur-balls" aria-hidden="true">
      <span class="ball ball-1"></span>
      <span class="ball ball-2"></span>
      <span class="ball ball-3"></span>
      <span class="ball ball-4"></span>
      <span class="ball ball-5"></span>
      <span class="ball ball-6"></span>
      <span class="ball ball-7"></span>
    </div>

    <aside class="login-brand">
      <div class="logo" @click="goHome" title="返回主站">
        <img :src="logoUrl" alt="小石榴" />
      </div>
      <div class="brand-inner">
        <h1 class="brand-title">小石榴 · 后台管理系统</h1>
        <p class="brand-slogan">让你的创作、分享与交流简单、清晰、高效</p>
      </div>
    </aside>

    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2 class="login-title">请使用管理员账号登录</h2>
        </div>

        <div v-if="unifiedMessage" class="message error">
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

          <button type="submit" class="login-button" :disabled="isSubmitting || !isFormValid">
            <span v-if="isSubmitting">登录中...</span>
            <span v-else>登录</span>
          </button>
        </form>
      </div>
    </div>

    <footer class="page-footer">XIAOSHILIU · UGC COMMUNITY ADMIN CONSOLE</footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

// Router
const router = useRouter()

// Store
const adminStore = useAdminStore()

const logoUrl = new URL('@/assets/imgs/小石榴.png', import.meta.url).href

// 后台在独立窗口打开，主站以新标签页返回，避免丢失登录页上下文
const goHome = () => window.open('/', '_blank', 'noopener')

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

// 必填项满足最低长度才允许提交，避免在空表单上反复试错
const isFormValid = computed(() => {
  return formData.username.trim().length >= 2 && formData.password.length >= 6
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
      router.push('/admin/monitor')
    } else {
      unifiedMessage.value = result.message || '登录失败，请检查用户名和密码'
    }
  } catch (error) {
    console.error('登录错误:', error)
    unifiedMessage.value = error.message || '登录失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  /* 后台登录页固定亮色，不跟随全局暗色主题 */
  --bg-color-primary: #fff;
  --bg-color-secondary: #f7f7f7;
  --text-color-primary: #333;
  --text-color-secondary: #5c5c5c;
  --text-color-tertiary: #858585;
  --text-color-quaternary: #bbbbbb;
  --border-color-primary: #ebebeb;
  --shadow-color: rgba(0, 0, 0, 0.08);
  --button-text-color: #fff;
  position: relative;
  display: flex;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: var(--bg-color-primary);
}

/* ===== 背景虚化小球 ===== */
.blur-balls {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ball {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

.ball-1 {
  width: 520px;
  height: 520px;
  top: -180px;
  left: -140px;
  background: var(--primary-color);
  opacity: 0.5;
  animation: ball-drift-a 22s ease-in-out infinite alternate;
}

.ball-2 {
  width: 400px;
  height: 400px;
  top: 6%;
  left: 26%;
  background: #ff5f7e;
  opacity: 0.42;
  animation: ball-drift-b 26s ease-in-out infinite alternate;
}

.ball-3 {
  width: 420px;
  height: 420px;
  top: -60px;
  right: -120px;
  background: #7aa2ff;
  opacity: 0.45;
  animation: ball-drift-c 24s ease-in-out infinite alternate;
}

.ball-4 {
  width: 380px;
  height: 380px;
  bottom: -140px;
  left: 14%;
  background: var(--primary-color-dark);
  opacity: 0.4;
  animation: ball-drift-b 30s ease-in-out infinite alternate-reverse;
}

.ball-5 {
  width: 260px;
  height: 260px;
  top: 40%;
  left: 46%;
  background: #7ee0c0;
  opacity: 0.4;
  animation: ball-drift-a 21s ease-in-out infinite alternate-reverse;
}

.ball-6 {
  width: 300px;
  height: 300px;
  bottom: 4%;
  right: 6%;
  background: #ffc46b;
  opacity: 0.42;
  animation: ball-drift-c 19s ease-in-out infinite alternate;
}

.ball-7 {
  width: 240px;
  height: 240px;
  top: 34%;
  right: 28%;
  background: #b18cff;
  opacity: 0.38;
  animation: ball-drift-a 28s ease-in-out infinite alternate-reverse;
}

@keyframes ball-drift-a {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(90px, 60px, 0) scale(1.12);
  }

  100% {
    transform: translate3d(-40px, 120px, 0) scale(0.95);
  }
}

@keyframes ball-drift-b {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(-120px, 80px, 0) scale(0.9);
  }

  100% {
    transform: translate3d(60px, -60px, 0) scale(1.15);
  }
}

@keyframes ball-drift-c {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(70px, -90px, 0) scale(1.18);
  }

  100% {
    transform: translate3d(-80px, 40px, 0) scale(0.92);
  }
}

/* ===== 左侧品牌区 ===== */
.login-brand {
  position: relative;
  z-index: 1;
  flex: 0 0 54%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 48px 64px 72px;
  box-sizing: border-box;
}

.brand-inner {
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

/* ===== 右侧表单区 ===== */
.login-container {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 64px 48px 0;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 32px 28px 34px;
  box-sizing: border-box;
  border-radius: 20px;
  background:
    radial-gradient(18% 46% at 16% -6%,
      color-mix(in srgb, #7ee0c0 18%, transparent) 0%,
      transparent 100%),
    var(--bg-color-primary);
  box-shadow: 0 20px 48px var(--shadow-color);
}

.login-header {
  margin-bottom: 28px;
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

.page-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 28px;
  z-index: 1;
  text-align: center;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
  pointer-events: none;
  user-select: none;
}

@media (max-width: 900px) {
  .login-brand {
    display: none;
  }

  .login-container {
    padding: 40px 20px;
  }

  .page-footer {
    bottom: 20px;
    font-size: 10px;
    letter-spacing: 0.18em;
  }
}
</style>
