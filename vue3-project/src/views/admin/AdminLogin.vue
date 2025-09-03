<template>
  <div class="admin-login-page">
    <div class="login-container">
      <div class="login-card">

        <div class="login-header">
          <h1 class="login-title">小石榴管理后台</h1>
        </div>


        <div v-if="unifiedMessage" class="message" :class="messageType">
          {{ unifiedMessage }}
        </div>


        <form @submit.prevent="handleSubmit" class="login-form">

          <div class="form-group">
            <label for="username" class="form-label">用户名</label>
            <div class="input-wrapper">
              <input type="text" id="username" v-model="formData.username" class="form-input"
                :class="{ 'error': errors.username }" placeholder="请输入用户名" @input="clearError('username')" />
            </div>
            <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
          </div>


          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <div class="input-wrapper">
              <input type="password" id="password" v-model="formData.password" class="form-input"
                :class="{ 'error': errors.password }" placeholder="请输入密码" @input="clearError('password')" />
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
        router.push('/admin/api-docs')
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
  min-height: 100vh;
  background: var(--bg-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: var(--bg-color-primary);
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 4px 12px var(--shadow-color);
  border: 1px solid var(--border-color-primary);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0;
}

.message {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
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
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}


.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-color-primary);
  transition: border-color 0.2s ease;
  box-sizing: border-box;
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
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.login-button:hover:not(:disabled) {
  background: #e02a44;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .admin-login-page {
    padding: 10px;
  }

  .login-card {
    padding: 30px 20px;
  }
}
</style>