<template>
  <div class="auth-modal-overlay" :class="{ animating: isAnimating }" @mousedown="handleClose">
    <div class="auth-modal" :class="{ 'scale-in': isAnimating }" @mousedown.stop>
      <button @click="handleClose" class="close-btn">
        <SvgIcon name="close" width="16" height="16" />
      </button>

      <div class="auth-content">
        <div class="auth-header">
          <h2 class="auth-title">修改密码</h2>
          <p class="auth-subtitle">为了您的账户安全，请谨慎设置新密码</p>
        </div>

        <form @submit.prevent="handleChangePassword" class="auth-form">
          <div class="form-group">
            <label class="form-label">当前密码</label>
            <input v-model="form.currentPassword" type="password" class="form-input" placeholder="请输入当前密码"
              :disabled="loading" />
          </div>

          <div class="form-group">
            <label class="form-label">新密码</label>
            <input v-model="form.newPassword" type="password" class="form-input" placeholder="请输入新密码（至少6位）"
              :disabled="loading" />
          </div>

          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="请再次输入新密码"
              :disabled="loading" />
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? '修改中...' : '修改密码' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, watch, onMounted } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

// 注入消息管理器
const $message = inject('$message')

// 滚动锁定
const { lock, unlock } = useScrollLock()

// 动画状态
const isAnimating = ref(false)

// 表单数据
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 加载状态
const loading = ref(false)

// 组件挂载时启动动画
onMounted(() => {
  lock()
  setTimeout(() => {
    isAnimating.value = true
  }, 10)
})

// 关闭模态框
const handleClose = () => {
  if (loading.value) return
  isAnimating.value = false
  unlock()
  setTimeout(() => {
    emit('close')
  }, 200)
}

// 修改密码
const handleChangePassword = async () => {
  // 基础表单验证
  if (!form.currentPassword) {
    $message.error('请输入当前密码')
    return
  }
  if (!form.newPassword) {
    $message.error('请输入新密码')
    return
  }
  if (form.newPassword.length < 6) {
    $message.error('新密码至少需要6位')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    $message.error('两次输入的新密码不一致')
    return
  }

  loading.value = true

  try {
    const { userApi } = await import('@/api/index.js')
    const userId = props.userInfo.user_id

    const result = await userApi.changePassword(userId, {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword
    })

    // 检查API返回结果的success字段，只有success === true时才显示成功提示
    if (result && result.success === true) {
      $message.success('密码修改成功')

      // 清空表单并关闭模态框
      form.currentPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''

      // 确保loading状态重置
      loading.value = false
      handleClose()
    } else {
      // 当success !== true时，表示操作失败
      const errorMessage = result?.message || ''

      // 优先检查当前密码是否错误
      if (errorMessage.includes('当前密码') || errorMessage.includes('密码错误') || errorMessage.includes('密码不正确')) {
        $message.error('当前密码输入错误，请检查后重新输入')
        // 清空当前密码输入框，但不关闭模态框
        form.currentPassword = ''
        return
      }

      // 如果当前密码正确，但新密码与当前密码相同
      if (errorMessage.includes('新密码不能与') || errorMessage.includes('相同')) {
        $message.error('新密码不能与当前密码相同')
        return
      }

      // 其他错误情况
      $message.error(errorMessage || '密码修改失败，请重试')
    }

  } catch (error) {
    console.error('密码修改失败:', error)

    // 处理网络错误或其他异常
    $message.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}
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
  color: var(--text-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: all 0.2s ease;
}

.close-btn:hover {
  opacity: 0.8;
  transform: scale(1.1);
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

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--text-color-tertiary);
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  max-width: 200px;
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
  background: var(--primary-color-dark);
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