<template>
  <div class="auth-modal-overlay" :class="{ 'animating': isAnimating }" v-click-outside.mousedown="closeModal"
    v-escape-key="closeModal">
    <div class="auth-modal" @click.stop :class="{ 'scale-in': isAnimating }">
      <button class="close-btn" @click="closeModal">
        <SvgIcon name="close" />
      </button>

      <div class="auth-content">
        <div class="auth-header">
          <h2 class="auth-title">{{ isLoginMode ? '登录小石榴' : '注册小石榴' }}</h2>
          <p class="auth-subtitle">{{ isLoginMode ? '欢迎回来！' : '加入我们，开始分享美好生活' }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label for="user_id" class="form-label">小石榴号</label>
            <input type="text" id="user_id" v-model="formData.user_id" class="form-input"
              :class="{ 'error': showErrors && errors.user_id }"
              :placeholder="isLoginMode ? '请输入小石榴号' : '请输入小石榴号（3-15位字母数字下划线）'" maxlength="15"
              @input="clearError('user_id')" />
            <span v-if="showErrors && errors.user_id" class="error-message">{{ errors.user_id }}</span>
          </div>

          <div v-if="!isLoginMode" class="form-group">
            <label for="nickname" class="form-label">昵称</label>
            <input type="text" id="nickname" v-model="formData.nickname" class="form-input"
              :class="{ 'error': showErrors && errors.nickname }" placeholder="请输入昵称（少于10位）" maxlength="10"
              @input="clearError('nickname')" />
            <span v-if="showErrors && errors.nickname" class="error-message">{{ errors.nickname }}</span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <input type="password" id="password" v-model="formData.password" class="form-input"
              :class="{ 'error': showErrors && errors.password }" :placeholder="isLoginMode ? '请输入密码' : '请设置密码（6-20位）'"
              maxlength="20" @input="clearError('password')" />
            <span v-if="showErrors && errors.password" class="error-message">{{ errors.password }}</span>
          </div>

          <div v-if="!isLoginMode" class="form-group">
            <label for="confirmPassword" class="form-label">确认密码</label>
            <input type="password" id="confirmPassword" v-model="formData.confirmPassword" class="form-input"
              :class="{ 'error': showErrors && errors.confirmPassword }" placeholder="请再次输入密码"
              maxlength="20" @input="clearError('confirmPassword')" />
            <span v-if="showErrors && errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
          </div>

          <div v-if="submitError" class="submit-error">
            {{ submitError }}
          </div>

          <div v-if="unifiedMessage" class="unified-message">
            <SvgIcon name="alert" width="16" height="16" />
            {{ unifiedMessage }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isSubmitting" :class="{ 'loading': isSubmitting }">
            <span v-if="isSubmitting" class="loading-spinner"></span>
            {{ isSubmitting ? '加载中...' : (isLoginMode ? '登录' : '注册') }}
          </button>
        </form>

        <div class="auth-switch">
          <span class="switch-text">
            {{ isLoginMode ? '还没有账号？' : '已有账号？' }}
          </span>
          <button type="button" class="switch-btn" @click="toggleMode">
            {{ isLoginMode ? '立即注册' : '立即登录' }}
          </button>
        </div>
      </div>
    </div>

    <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import MessageToast from '@/components/MessageToast.vue'
import { useUserStore } from '@/stores/user.js'
import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({
  initialMode: {
    type: String,
    default: 'login',
    validator: (value) => ['login', 'register'].includes(value)
  }
})

const emit = defineEmits(['close', 'success'])

const userStore = useUserStore()

const { lock, unlock } = useScrollLock()

const isAnimating = ref(false)
const isLoginMode = ref(props.initialMode === 'login')
const isSubmitting = ref(false)
const submitError = ref('')
const unifiedMessage = ref('')

const formData = reactive({
  user_id: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  user_id: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const showErrors = ref(false)

const isFormValid = computed(() => {
  if (isLoginMode.value) {
    return formData.user_id.trim() && formData.password.trim() && !errors.user_id && !errors.password
  } else {
    return formData.user_id.trim() && formData.nickname.trim() && formData.password.trim() && formData.confirmPassword.trim() &&
      !errors.user_id && !errors.nickname && !errors.password && !errors.confirmPassword
  }
})

const validateUserId = () => {
  if (!formData.user_id.trim()) {
    errors.user_id = '请输入小石榴号'
  } else if (!isLoginMode.value && formData.user_id.length < 3) {
    errors.user_id = '小石榴号至少需要3位'
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.user_id)) {
    errors.user_id = '小石榴号只能包含字母、数字和下划线'
  } else {
    errors.user_id = ''
  }
}

const validateNickname = () => {
  if (!formData.nickname.trim()) {
    errors.nickname = '请输入昵称'
  } else {
    errors.nickname = ''
  }
}

const validatePassword = () => {
  if (!formData.password.trim()) {
    errors.password = '请输入密码'
  } else if (!isLoginMode.value && formData.password.length < 6) {
    errors.password = '密码至少需要6位'
  } else {
    errors.password = ''
  }
}

const validateConfirmPassword = () => {
  if (!formData.confirmPassword.trim()) {
    errors.confirmPassword = '请确认密码'
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
  } else {
    errors.confirmPassword = ''
  }
}

const clearError = (field) => {
  errors[field] = ''
  submitError.value = ''
  unifiedMessage.value = ''
  showErrors.value = false
}

const resetForm = () => {
  formData.user_id = ''
  formData.nickname = ''
  formData.password = ''
  formData.confirmPassword = ''
  errors.user_id = ''
  errors.nickname = ''
  errors.password = ''
  errors.confirmPassword = ''
  submitError.value = ''
  showErrors.value = false
}

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  submitError.value = ''
  unifiedMessage.value = ''
  showErrors.value = false
}

const handleSubmit = async () => {
  unifiedMessage.value = ''
  submitError.value = ''
  showErrors.value = true

  if (isLoginMode.value) {
    const isUserIdEmpty = !formData.user_id.trim()
    const isPasswordEmpty = !formData.password.trim()

    if (isUserIdEmpty && isPasswordEmpty) {
      return
    }

    if (isUserIdEmpty) {
      unifiedMessage.value = '请输入小石榴号'
      return
    }

    if (isPasswordEmpty) {
      unifiedMessage.value = '请输入密码'
      return
    }
  } else {
    validateUserId()
    validatePassword()
    validateNickname()
    validateConfirmPassword()

    if (!isFormValid.value) {
      return
    }
  }

  isSubmitting.value = true

  try {
    let result
    if (isLoginMode.value) {
      result = await userStore.login({
        user_id: formData.user_id,
        password: formData.password
      })
    } else {
      result = await userStore.register({
        user_id: formData.user_id,
        nickname: formData.nickname,
        password: formData.password,
        avatar: new URL('@/assets/imgs/avatar.png', import.meta.url).href,
        bio: '用户没有任何简介',
        location: '未知'
      })
    }

    if (result.success) {
      showToastMessage(
        isLoginMode.value ? '登录成功！' : '注册成功！',
        'success'
      )
      setTimeout(() => {
        emit('success')
        closeModal()
        window.location.reload()
      }, 1000)
    } else {
      unifiedMessage.value = result.message
    }
  } catch (error) {
    console.error('提交失败:', error)
    unifiedMessage.value = '网络错误，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

const handleToastClose = () => {
  showToast.value = false
}

const closeModal = () => {
  isAnimating.value = false
  unlock()
  setTimeout(() => {
    emit('close')
  }, 200)
}

onMounted(() => {
  lock()
  isAnimating.value = true
})
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(4px);
  width: 100vw;
  height: 100vh;
}

.auth-modal-overlay.animating {
  opacity: 1;
}

.auth-modal {
  background: var(--bg-color-primary);
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  transform: scale(0.9);
  transition: transform 0.2s ease;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.auth-modal.scale-in {
  transform: scale(1);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-color-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color-secondary);
  transition: all 0.2s ease;
  z-index: 1;
}

.close-btn:hover {
  background: var(--bg-color-tertiary);
  color: var(--text-color-primary);
}

.auth-content {
  padding: 32px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color-primary);
  margin: 0 0 8px 0;
}

.auth-subtitle {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.form-input {
  padding: 12px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 16px;
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
  caret-color: var(--primary-color);
  transition: border-color 0.2s ease;
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
  margin-top: -4px;
}

.submit-error {
  padding: 12px;
  background: rgba(var(--primary-color), 0.1);
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  color: var(--primary-color);
  font-size: 14px;
  text-align: center;
}

.unified-message {
  display: flex;
  flex-direction: row;
  align-items: center;
  color: var(--primary-color);
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn {
  padding: 14px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
}

.submit-btn:hover {
  background-color: var(--primary-color-dark);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.auth-switch {
  text-align: center;
  padding-top: 24px;
}

.switch-text {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-right: 8px;
}

.switch-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.switch-btn:hover {
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .auth-content {
    padding: 24px;
  }

  .auth-title {
    font-size: 20px;
  }
}
</style>