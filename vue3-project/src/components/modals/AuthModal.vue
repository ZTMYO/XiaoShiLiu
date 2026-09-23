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

        <form @submit.prevent="handleSubmit" class="auth-form" novalidate autocomplete="off">
          <div class="form-group">
            <label for="user_id" class="form-label">小石榴号</label>
            <input type="text" id="user_id" v-model="formData.user_id" class="form-input"
              :class="{ 'error': showErrors && errors.user_id }"
              :placeholder="isLoginMode ? '请输入小石榴号' : '请输入小石榴号（3-15位字母数字下划线）'" maxlength="15"
              autocomplete="off" @input="clearError('user_id')" />
            <span v-if="showErrors && errors.user_id" class="error-message">{{ errors.user_id }}</span>
          </div>

          <div v-if="!isLoginMode" class="form-group">
            <label for="nickname" class="form-label">昵称</label>
            <input type="text" id="nickname" v-model="formData.nickname" class="form-input"
              :class="{ 'error': showErrors && errors.nickname }" placeholder="请输入昵称（少于10位）" maxlength="10"
              autocomplete="off" @input="clearError('nickname')" />
            <span v-if="showErrors && errors.nickname" class="error-message">{{ errors.nickname }}</span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <input type="password" id="password" v-model="formData.password" class="form-input"
              :class="{ 'error': showErrors && errors.password }" :placeholder="isLoginMode ? '请输入密码' : '请设置密码（6-20位）'"
              maxlength="20" autocomplete="new-password" @input="clearError('password')" />
            <span v-if="showErrors && errors.password" class="error-message">{{ errors.password }}</span>
          </div>

          <div v-if="!isLoginMode" class="form-group">
            <label for="confirmPassword" class="form-label">确认密码</label>
            <input type="password" id="confirmPassword" v-model="formData.confirmPassword" class="form-input"
              :class="{ 'error': showErrors && errors.confirmPassword }" placeholder="请再次输入密码" maxlength="20"
              autocomplete="new-password" @input="clearError('confirmPassword')" />
            <span v-if="showErrors && errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
          </div>

          <div v-if="!isLoginMode && emailEnabled" class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <input type="email" id="email" v-model="formData.email" class="form-input"
              :class="{ 'error': showErrors && errors.email }" placeholder="请输入邮箱地址" maxlength="100"
              autocomplete="off" @input="clearError('email')" />
            <span v-if="showErrors && errors.email" class="error-message">{{ errors.email }}</span>
          </div>

          <div v-if="!isLoginMode && emailEnabled" class="form-group">
            <label for="emailCode" class="form-label">邮箱验证码</label>
            <div class="form-input-with-button">
              <input type="text" id="emailCode" v-model="formData.emailCode" class="form-input"
                :class="{ 'error': showErrors && errors.emailCode }" placeholder="请输入邮箱验证码" maxlength="6"
                autocomplete="one-time-code" @input="clearError('emailCode')" />
              <button type="button" class="email-code-btn"
                :disabled="userStore.isSendingEmailCode || userStore.emailCodeCountdown > 0 || !isEmailValid"
                @click="sendEmailCode">
                {{ userStore.emailCodeCountdown > 0 ? `${userStore.emailCodeCountdown}秒后重发` : (userStore.isSendingEmailCode ? '发送中...' : '获取验证码') }}
              </button>
            </div>
            <span v-if="showErrors && errors.emailCode" class="error-message">{{ errors.emailCode }}</span>
          </div>

          <div v-if="submitError" class="submit-error">
            {{ submitError }}
          </div>

          <div v-if="unifiedMessage" class="unified-message">
            <SvgIcon name="alert" width="16" height="16" />
            {{ unifiedMessage }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isSubmitting || !isFormValid"
            :class="{ 'loading': isSubmitting }">
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

        <div v-if="isLoginMode && emailEnabled" class="forgot-password">
          <button type="button" class="forgot-btn" @click="openResetPassword">
            忘记密码？
          </button>
        </div>
      </div>
    </div>

    <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />

    <!-- 验证码模态框 -->
    <CaptchaModal :show="showCaptchaModal" :captcha-svg="captchaSvg" v-model:captcha-text="formData.captchaText"
      :is-loading="isLoadingCaptcha" @close="closeCaptchaModal" @refresh="refreshCaptcha"
      @confirm="handleCaptchaConfirm" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import MessageToast from '@/components/MessageToast.vue'
import CaptchaModal from '@/components/modals/CaptchaModal.vue'
import { useUserStore } from '@/stores/user.js'
import { useScrollLock } from '@/composables/useScrollLock'
import { getDefaultAvatar } from '@/utils/imageUtils'

const props = defineProps({
  initialMode: {
    type: String,
    default: 'login',
    validator: (value) => ['login', 'register'].includes(value)
  }
})

const emit = defineEmits(['close', 'success', 'open-reset-password'])

const userStore = useUserStore()

const { lock, unlock } = useScrollLock()

// 邮件功能是否启用
const emailEnabled = ref(false)

const isAnimating = ref(false)
const isLoginMode = ref(props.initialMode === 'login')
const isSubmitting = ref(false)
const submitError = ref('')
const unifiedMessage = ref('')

const formData = reactive({
  user_id: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  email: '',
  emailCode: '',
  captchaText: ''
})

const errors = reactive({
  user_id: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  email: '',
  emailCode: '',
  captchaText: ''
})

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const showErrors = ref(false)

// 验证码相关状态
const captchaId = ref('')
const captchaSvg = ref('')
const showCaptchaModal = ref(false)
const isLoadingCaptcha = ref(false)

// 计算属性：邮箱格式是否有效
const isEmailValid = computed(() => {
  return formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
})

const isFormValid = computed(() => {
  if (isLoginMode.value) {
    return formData.user_id.trim() && formData.password.trim() && !errors.user_id && !errors.password
  } else {
    const baseValid = formData.user_id.trim() && formData.nickname.trim() && formData.password.trim() && formData.confirmPassword.trim() && !errors.user_id && !errors.nickname && !errors.password && !errors.confirmPassword
    if (emailEnabled.value) {
      return baseValid && formData.email.trim() && formData.emailCode.trim() && !errors.email && !errors.emailCode
    }
    return baseValid
  }
})

const validateUserId = async () => {
  errors.user_id = ''

  if (!formData.user_id.trim()) {
    errors.user_id = '请输入小石榴号'
    return
  }

  if (formData.user_id.length < 3 || formData.user_id.length > 15) {
    errors.user_id = '小石榴号长度必须在3-15位之间'
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(formData.user_id)) {
    errors.user_id = '小石榴号只能包含字母、数字和下划线'
    return
  }

  // 注册模式下检查用户ID是否已存在
  if (!isLoginMode.value) {
    try {
      const response = await fetch(`/api/auth/check-user-id?user_id=${encodeURIComponent(formData.user_id)}`)
      const result = await response.json()

      if (result.code === 200) {
        if (!result.data.isUnique) {
          errors.user_id = '小石榴号已存在'
          return
        }
      } else {
        console.error('检查用户ID失败:', result.message)
      }
    } catch (error) {
      console.error('检查用户ID失败:', error)
      // 网络错误时不阻止用户继续，让后端最终验证
    }
  }

  errors.user_id = ''
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

// 验证邮箱
const validateEmail = () => {
  if (!formData.email.trim()) {
    errors.email = '请输入邮箱地址'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = '请输入有效的邮箱地址'
  } else {
    errors.email = ''
  }
}

// 验证邮箱验证码
const validateEmailCode = () => {
  if (!formData.emailCode.trim()) {
    errors.emailCode = '请输入邮箱验证码'
  } else if (formData.emailCode.length !== 6) {
    errors.emailCode = '邮箱验证码长度为6位'
  } else {
    errors.emailCode = ''
  }
}

const clearError = (field) => {
  errors[field] = ''
  submitError.value = ''
  unifiedMessage.value = ''
  showErrors.value = false
}

// 获取验证码
const getCaptcha = async () => {
  isLoadingCaptcha.value = true
  try {
    const response = await fetch('/api/auth/captcha')
    const result = await response.json()
    if (result.code === 200) {
      captchaId.value = result.data.captchaId
      captchaSvg.value = result.data.captchaSvg
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
  } finally {
    isLoadingCaptcha.value = false
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  formData.captchaText = ''
  getCaptcha()
}

// 打开验证码模态框
const openCaptchaModal = () => {
  showCaptchaModal.value = true
  getCaptcha()
}

// 关闭验证码模态框
const closeCaptchaModal = () => {
  showCaptchaModal.value = false
  formData.captchaText = ''
  errors.captchaText = ''
}

// 验证码验证
const validateCaptcha = () => {
  if (!formData.captchaText.trim()) {
    errors.captchaText = '请输入验证码'
  } else {
    errors.captchaText = ''
  }
}

// 发送邮箱验证码
const sendEmailCode = async () => {
  // 验证邮箱格式
  validateEmail()
  if (errors.email) {
    showErrors.value = true
    return
  }

  try {
    const response = await userStore.sendEmailCode({email:formData.email})
    if (response.success) {
      showToastMessage(response.message, 'success')
    } else {
      unifiedMessage.value = response.message || '发送验证码失败'
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    unifiedMessage.value = '网络错误，请稍后重试'
  }
}

const resetForm = () => {
  formData.user_id = ''
  formData.nickname = ''
  formData.password = ''
  formData.confirmPassword = ''
  formData.email = ''
  formData.emailCode = ''
  formData.captchaText = ''
  errors.user_id = ''
  errors.nickname = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.email = ''
  errors.emailCode = ''
  errors.captchaText = ''
  submitError.value = ''
  showErrors.value = false
  captchaId.value = ''
  captchaSvg.value = ''
  // 清除邮箱验证码倒计时
  userStore.clearEmailCodeCountdown()
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
  captchaId.value = ''
  captchaSvg.value = ''
  showCaptchaModal.value = false
}

// 处理验证码确认
const handleCaptchaConfirm = async () => {
  // 邮件功能启用时才验证邮箱验证码
  if (emailEnabled.value) {
    validateEmailCode()
    if (errors.emailCode) {
      closeCaptchaModal()
      showErrors.value = true
      return
    }
  }

  // 验证图形验证码
  validateCaptcha()
  if (errors.captchaText) {
    return
  }

  // 验证码验证通过，执行注册
  await performSubmit()
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

    // 登录模式直接提交
    await performSubmit()
  } else {
    // 注册模式：先验证表单，通过后打开验证码模态框
    await validateUserId()
    validatePassword()
    validateNickname()
    validateConfirmPassword()
    if (emailEnabled.value) {
      validateEmail()
      validateEmailCode()
    }

    if (!isFormValid.value) {
      return
    }

    // 表单验证通过，打开验证码模态框
    openCaptchaModal()
  }
}

// 执行实际的提交操作
const performSubmit = async () => {

  isSubmitting.value = true

  try {
    let result
    if (isLoginMode.value) {
      result = await userStore.login({
        user_id: formData.user_id,
        password: formData.password
      })
    } else {
      const registerData = {
        user_id: formData.user_id,
        nickname: formData.nickname,
        password: formData.password,
        captchaId: captchaId.value,
        captchaText: formData.captchaText,
        avatar: getDefaultAvatar(formData.user_id),
        bio: '用户没有任何简介',
        location: '未知'
      }
      // 邮件功能启用时才传邮箱相关参数
      if (emailEnabled.value) {
        registerData.email = formData.email
        registerData.emailCode = formData.emailCode
      }
      result = await userStore.register(registerData)
    }

    if (result.success) {
      showToastMessage(
        isLoginMode.value ? '登录成功！' : '注册成功！',
        'success'
      )
      if (!isLoginMode.value) {
        closeCaptchaModal()
      }
      setTimeout(() => {
        emit('success')
        closeModal()
        window.location.reload()
      }, 1000)
    } else {
      // 如果是图形验证码相关错误，刷新验证码
      if (!isLoginMode.value && showCaptchaModal.value &&
        (result.message.includes('验证码已过期') || result.message.includes('验证码错误') || result.message.includes('captcha')) &&
        !result.message.includes('邮箱验证码')) {
        refreshCaptcha()
      } else if (result.message.includes('邮箱验证码')) {
        // 邮箱验证码错误，关闭图形验证码模态框并显示错误
        errors.emailCode = result.message
        showErrors.value = true
        closeCaptchaModal()
      } else if (result.message.includes('用户ID已存在')) {
        // 用户ID重复错误，设置到对应字段
        errors.user_id = result.message
        closeCaptchaModal()
      } else {
        unifiedMessage.value = result.message
      }
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

// 打开找回密码
const openResetPassword = () => {
  isAnimating.value = false
  unlock()
  setTimeout(() => {
    emit('open-reset-password')
  }, 200)
}

// 获取邮件功能配置
const fetchEmailConfig = async () => {
  try {
    const response = await fetch('/api/auth/email-config')
    const result = await response.json()
    if (result.code === 200) {
      emailEnabled.value = result.data.emailEnabled
    }
  } catch (error) {
    console.error('获取邮件配置失败:', error)
  }
}

onMounted(() => {
  lock()
  isAnimating.value = true
  fetchEmailConfig()
})
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  transition: opacity 0.2s ease;
  width: 100vw;
  height: 100%;
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
  box-shadow: 0 20px 40px var(--shadow-color);
}

.auth-modal.scale-in {
  transform: scale(1);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 30px;
  height: 30px;
  background: var(--bg-color-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--text-color-primary);
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--text-color-secondary);
  transform: scale(1.1);
  transition: all 0.2s ease;
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

.submit-btn:hover:not(:disabled) {
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

.forgot-password {
  text-align: center;
  margin-top: 8px;
}

.forgot-btn {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.forgot-btn:hover {
  color: var(--primary-color);
}

/* 邮箱验证码输入框和按钮样式 */
.form-input-with-button {
  display: flex;
  gap: 8px;
}

.form-input-with-button .form-input {
  flex: 1;
}

.email-code-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.email-code-btn:hover:not(:disabled) {
  background-color: var(--primary-color-dark);
}

.email-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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