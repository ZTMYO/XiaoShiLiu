import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi, userApi } from '@/api/index.js'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const userInfo = ref(null)
  const isLoading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => {
    return !!token.value && (!!userInfo.value || !!localStorage.getItem('userInfo'))
  })

  // 登录
  const login = async (credentials) => {
    try {
      isLoading.value = true
      const response = await authApi.login(credentials)

      if (response.success && response.data) {
        // 保存token
        token.value = response.data.tokens.access_token
        refreshToken.value = response.data.tokens.refresh_token
        userInfo.value = response.data.user

        // 保存到localStorage
        localStorage.setItem('token', response.data.tokens.access_token)
        localStorage.setItem('refreshToken', response.data.tokens.refresh_token)
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))

        // Token已保存到localStorage

        return { success: true }
      } else {
        return {
          success: false,
          message: response.message || '登录失败'
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return {
        success: false,
        message: error.message || '网络错误，请稍后重试'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      isLoading.value = true
      const response = await authApi.register(userData)

      if (response.success) {
        // 注册成功后自动登录
        token.value = response.data.tokens.access_token
        refreshToken.value = response.data.tokens.refresh_token
        userInfo.value = response.data.user

        // 保存到localStorage
        localStorage.setItem('token', response.data.tokens.access_token)
        localStorage.setItem('refreshToken', response.data.tokens.refresh_token)
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))

        return { success: true }
      } else {
        return { success: false, message: response.message || '注册失败' }
      }
    } catch (error) {
      console.error('注册失败:', error)
      return {
        success: false,
        message: error.message || '网络错误，请稍后重试'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      // 调用后端退出接口
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 清除本地数据
      token.value = ''
      refreshToken.value = ''
      userInfo.value = null

      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')

      // 重置未读通知数量
      try {
        const { useNotificationStore } = await import('./notification')
        const notificationStore = useNotificationStore()
        notificationStore.resetUnreadCount()
      } catch (error) {
        console.error('重置未读通知数量失败:', error)
      }
    }
  }

  // 初始化用户信息（从localStorage恢复）
  const initUserInfo = () => {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo && token.value) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        // 清除无效数据
        localStorage.removeItem('userInfo')
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        token.value = ''
        refreshToken.value = ''
      }
    }
  }

  // 刷新token
  const refreshUserToken = async () => {
    try {
      const response = await authApi.refreshToken()
      if (response.success) {
        token.value = response.data.tokens.access_token
        localStorage.setItem('token', response.data.tokens.access_token)
        return true
      }
      return false
    } catch (error) {
      console.error('刷新token失败:', error)
      // token刷新失败，清除登录状态
      await logout()
      // 不再强制刷新页面，让组件自己处理未登录情况
      return false
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      
      if (response.success && response.data) {
        userInfo.value = response.data
        // 更新localStorage中的用户信息
        localStorage.setItem('userInfo', JSON.stringify(response.data))
        return response.data
      } else {
        console.error('获取当前用户信息失败:', response.message)
        return null
      }
    } catch (error) {
      console.error('获取当前用户信息失败:', error)
      return null
    }
  }

  // 获取用户统计信息
  const getUserStats = async (userId) => {
    try {
      const response = await userApi.getUserStats(userId)

      if (response.success) {
        return response.data
      } else {
        console.error('获取用户统计信息失败:', response.message)
        return null
      }
    } catch (error) {
      console.error('获取用户统计信息失败:', error)
      return null
    }
  }

  // 更新用户信息
  const updateUserInfo = (newUserInfo) => {
    if (userInfo.value) {
      // 合并新的用户信息
      userInfo.value = {
        ...userInfo.value,
        ...newUserInfo
      }

      // 更新localStorage中的用户信息
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  return {
    // 状态
    token,
    refreshToken,
    userInfo,
    isLoading,

    // 计算属性
    isLoggedIn,

    // 方法
    login,
    register,
    logout,
    initUserInfo,
    getCurrentUser,
    refreshUserToken,
    getUserStats,
    updateUserInfo
  }
})