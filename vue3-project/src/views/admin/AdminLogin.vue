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

    <!-- 桌面端：左侧品牌区 -->
    <aside class="login-brand">
      <div class="logo" @click="goHome" title="返回主站">
        <img :src="logoUrl" alt="小石榴" />
      </div>
      <div class="brand-inner">
        <h1 class="brand-title">小石榴 · 后台管理系统</h1>
        <p class="brand-slogan">让你的创作、分享与交流简单、清晰、高效</p>
      </div>
    </aside>

    <!-- 桌面端：表单卡片 -->
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2 class="login-title">管理员登录</h2>
          <p class="login-subtitle">请使用管理员账号登录</p>
        </div>

        <div v-if="unifiedMessage" class="message error">
          {{ unifiedMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">用户名</label>
            <div class="input-wrapper">
              <svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M15.95 7.5a3.7 3.7 0 1 1-7.4 0 3.7 3.7 0 0 1 7.4 0m1.8 0a5.5 5.5 0 1 0-11 0 5.5 5.5 0 0 0 11 0M2.25 21.005c0-3.4 2.756-6.155 6.155-6.155h7.69c3.4 0 6.155 2.755 6.155 6.155v.093a.9.9 0 0 1-1.8 0v-.093a4.355 4.355 0 0 0-4.355-4.355h-7.69a4.355 4.355 0 0 0-4.355 4.355v.093a.9.9 0 1 1-1.8 0v-.093" />
              </svg>
              <input type="text" id="username" v-model="formData.username" class="form-input"
                :class="{ 'error': errors.username }" placeholder="输入管理员账号" autocomplete="username" @input="clearError('username')" />
            </div>
            <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <div class="input-wrapper">
              <svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Zm3 3.5c.8 0 1.5.7 1.5 1.5a1.5 1.5 0 0 1-3 0c0-.8.7-1.5 1.5-1.5Z" />
              </svg>
              <input :type="showPassword ? 'text' : 'password'" id="password" v-model="formData.password" class="form-input"
                :class="{ 'error': errors.password }" placeholder="请输入密码" autocomplete="current-password" @input="clearError('password')" />
              <button type="button" class="password-toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" class="toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M12 4.5C4 4.5 1.5 12 1.5 12S4 19.5 12 19.5 22.5 12 22.5 12 20 4.5 12 4.5Zm0 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                </svg>
                <svg v-else class="toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M3.6 2.7a1 1 0 0 0-1.4 1.4l3.4 3.4A16.6 16.6 0 0 0 1.5 12S4 19.5 12 19.5c2 0 3.6-.5 5-1.2l2.9 2.9a1 1 0 0 0 1.4-1.4Zm8.1 4.6a4.72 4.72 0 0 1 5.9 5.9l1.7 1.7A15.3 15.3 0 0 0 22.5 12S20 4.5 12 4.5c-1.1 0-2.1.17-3 .48zM6.5 7.9l3 3A4.5 4.5 0 0 0 9.75 12a2.25 2.25 0 0 0 .55 1.49l-1.5 1.5A4.5 4.5 0 0 1 6.5 12c0-.16.01-.31.03-.46a5.1 5.1 0 0 1-.03-.5v-.5c0 .3.02.6.05.88z" />
                </svg>
              </button>
            </div>
            <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          </div>

          <button type="submit" class="login-button" :disabled="isSubmitting || !isFormValid">
            <span v-if="isSubmitting">登录中...</span>
            <span v-else>登 录</span>
          </button>
        </form>
      </div>
    </div>

    <!-- 移动端：无卡片布局 -->
    <div class="mobile-login">
      <div class="m-back-home" role="button" @click="goHome">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4-5.6-5.6H20v-2Z" />
        </svg>
        返回主站
      </div>

      <div class="mobile-header">
        <h1 class="ml-title">小石榴</h1>
        <p class="ml-subtitle">后台管理系统</p>
      </div>

      <form @submit.prevent="handleSubmit" class="mobile-form">
        <div v-if="unifiedMessage" class="message error">
          {{ unifiedMessage }}
        </div>

        <div class="m-field">
          <input type="text" v-model="formData.username" class="m-input"
            :class="{ 'error': errors.username }" placeholder="输入管理员账号" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" @input="clearError('username')" />
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="m-field">
          <input :type="showPassword ? 'text' : 'password'" v-model="formData.password" class="m-input"
            :class="{ 'error': errors.password }" placeholder="请输入密码" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" @input="clearError('password')" />
          <button type="button" class="m-toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
            <svg v-if="!showPassword" class="toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 4.5C4 4.5 1.5 12 1.5 12S4 19.5 12 19.5 22.5 12 22.5 12 20 4.5 12 4.5Zm0 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
            </svg>
            <svg v-else class="toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M3.6 2.7a1 1 0 0 0-1.4 1.4l3.4 3.4A16.6 16.6 0 0 0 1.5 12S4 19.5 12 19.5c2 0 3.6-.5 5-1.2l2.9 2.9a1 1 0 0 0 1.4-1.4Zm8.1 4.6a4.72 4.72 0 0 1 5.9 5.9l1.7 1.7A15.3 15.3 0 0 0 22.5 12S20 4.5 12 4.5c-1.1 0-2.1.17-3 .48zM6.5 7.9l3 3A4.5 4.5 0 0 0 9.75 12a2.25 2.25 0 0 0 .55 1.49l-1.5 1.5A4.5 4.5 0 0 1 6.5 12c0-.16.01-.31.03-.46a5.1 5.1 0 0 1-.03-.5v-.5c0 .3.02.6.05.88z" />
            </svg>
          </button>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <button type="submit" class="login-button" :disabled="isSubmitting || !isFormValid">
          <span v-if="isSubmitting">登录中...</span>
          <span v-else>登 录</span>
        </button>
      </form>
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
const showPassword = ref(false)

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
    errors.username = '请输入账号'
    hasError = true
  } else if (formData.username.length < 2) {
    errors.username = '账号至少需要2位'
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
      unifiedMessage.value = result.message || '登录失败，请检查账号和密码'
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
.admin-login-page input::-ms-reveal,
.admin-login-page input::-ms-clear {
  display: none;
}

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
  background:
    linear-gradient(160deg, #fff 45%, #fdf3f4 100%);
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

/* ===== 桌面端左侧品牌区 ===== */
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

/* ===== 桌面端表单区 ===== */
.login-container {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
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
  background: #fef2f2;
  color: #e53e3e;
  border: 1px solid #fecaca;
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

.field-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--text-color-quaternary);
  pointer-events: none;
  transition: color 0.2s ease;
}

.input-wrapper:focus-within .field-icon {
  color: var(--primary-color);
}

.form-input {
  width: 100%;
  height: 46px;
  padding: 0 44px 0 42px;
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

.password-toggle {
  position: absolute;
  right: 8px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.password-toggle:hover {
  background: var(--bg-color-secondary);
}

.toggle-icon {
  width: 18px;
  height: 18px;
  color: var(--text-color-quaternary);
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

/* ===== 移动端布局（无卡片） ===== */
.mobile-login {
  display: none;
}

@media (max-width: 900px) {
  .login-brand,
  .login-container {
    display: none;
  }

  .admin-login-page {
    background: #fff;
    overflow-y: auto;
  }

  .ball-1,
  .ball-2,
  .ball-3,
  .ball-5,
  .ball-7 {
    display: none;
  }

  .ball-4 {
    width: 300px;
    height: 300px;
    bottom: -140px;
    left: -90px;
  }

  .ball-6 {
    width: 260px;
    height: 260px;
    bottom: 12%;
    right: -100px;
  }

  .mobile-login {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    padding-top: max(14vh, 56px);
    padding-right: 30px;
    padding-bottom: max(64px, calc(env(safe-area-inset-bottom) + 40px));
    padding-left: 30px;
    box-sizing: border-box;
  }

  .m-back-home {
    position: absolute;
    top: max(18px, env(safe-area-inset-top));
    right: 24px;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 13px;
    color: var(--text-color-tertiary);
    cursor: pointer;
    user-select: none;
  }

  .m-back-home svg {
    width: 16px;
    height: 16px;
  }

  .mobile-header {
    animation: card-fade-up 0.5s ease both;
  }

  .ml-title,
  .ml-subtitle {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.02em;
    color: var(--text-color-primary);
  }

  .ml-subtitle {
    margin-top: 6px;
  }

  .mobile-form {
    margin-top: 56px;
    animation: card-fade-up 0.5s 0.08s ease both;
  }

  .m-field {
    position: relative;
    margin-bottom: 30px;
  }

  .m-input {
    width: 100%;
    height: 52px;
    padding: 0 44px 2px 2px;
    border: none;
    border-bottom: 1.5px solid var(--border-color-primary);
    border-radius: 0;
    outline: none;
    background: transparent;
    color: var(--text-color-primary);
    font-size: 16px;
    box-sizing: border-box;
    caret-color: var(--primary-color);
    transition: border-color 0.2s ease;
  }

  .m-input::placeholder {
    color: var(--text-color-quaternary);
  }

  .m-input:focus {
    border-bottom-color: var(--primary-color);
    border-bottom-width: 2px;
  }

  .m-input.error {
    border-bottom-color: var(--primary-color);
    border-bottom-width: 2px;
  }

  .m-field .error-message {
    display: block;
    margin-top: 6px;
    padding-left: 2px;
  }

  .m-field .message.error {
    margin: 0 0 8px;
  }

  .m-toggle {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .m-toggle .toggle-icon {
    width: 20px;
    height: 20px;
  }

  .mobile-form .login-button {
    height: 50px;
    margin-top: 20px;
    border-radius: 12px;
    font-size: 16px;
  }

  .page-footer {
    bottom: max(18px, env(safe-area-inset-bottom));
    font-size: 9px;
    letter-spacing: 0.18em;
  }

  @keyframes card-fade-up {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>