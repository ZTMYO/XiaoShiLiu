import axios from 'axios'
import apiConfig from '@/config/api.js'
import { HTTP_STATUS, ERROR_MESSAGES } from '@/config/constants.js'
import messageManager from '@/utils/messageManager.js'

// 创建axios实例
const request = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: apiConfig.defaultHeaders
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const isAdminRequest = config.url && config.url.includes('/auth/admin/')
    const isInAdminPage = window.location.pathname.startsWith('/admin')

    if (isAdminRequest || isInAdminPage) {
      // admin相关请求或在admin页面时使用admin token
      const adminToken = localStorage.getItem('admin_token')
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`
      }
    } else {
      // 普通用户请求使用普通token
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('❌ 请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 对于后端返回的 { code, message, data } 格式，转换为前端期望的 { success, message, data } 格式
    if (response.data && response.data.hasOwnProperty('code')) {
      return {
        success: response.data.code === HTTP_STATUS.OK,
        message: response.data.message,
        data: response.data.data
      }
    }

    // 其他情况直接返回原始数据
    return response.data
  },
  async error => {
    // 对响应错误做点什么
    if (error.response) {
      // 处理特定的HTTP状态码
      let errorMessage = ERROR_MESSAGES.REQUEST_FAILED
      switch (error.response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // 未授权，需要区分是会话过期还是未登录状态
          console.log('检测到401错误，开始处理未授权访问')
          
          // 判断是管理员还是普通用户
          const isAdminPage = window.location.pathname.startsWith('/admin')
          const isAdminRequest = error.config?.url?.includes('/auth/admin/')
          
          console.log('页面类型判断:', { isAdminPage, isAdminRequest })
          
          if (isAdminPage || isAdminRequest) {
            // 管理员相关请求
            const adminToken = localStorage.getItem('admin_token')
            if (adminToken) {
              // 有token但401，说明是会话过期
              console.log('管理员会话过期，清除本地存储')
              localStorage.removeItem('admin_token')
              localStorage.removeItem('admin_refresh_token')
              localStorage.removeItem('admin_info')
              // 只有在登录页面才跳转，避免死循环
              if (!window.location.pathname.includes('/admin/login')) {
                window.location.href = '/admin/login'
              }
              errorMessage = ERROR_MESSAGES.SESSION_EXPIRED
            } else {
              // 没有token，说明是未登录状态，不需要跳转
              errorMessage = ERROR_MESSAGES.UNAUTHORIZED
            }
          } else {
            // 普通用户相关请求
            const userToken = localStorage.getItem('token')
            if (userToken) {
              // 有token但401，说明是会话过期
              console.log('普通用户会话过期，清除本地存储')
              localStorage.removeItem('token')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('userInfo')
              // 跳转到首页
              window.location.href = '/'
              errorMessage = ERROR_MESSAGES.SESSION_EXPIRED
            } else {
              // 没有token，说明是未登录状态，不需要跳转
              errorMessage = ERROR_MESSAGES.UNAUTHORIZED
            }
          }
          break
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          errorMessage = ERROR_MESSAGES.TOO_MANY_REQUESTS
          try {
            messageManager.warning(errorMessage)
          } catch (e) {
            console.warn('Failed to show rate limit toast:', e)
          }
          break
        case HTTP_STATUS.FORBIDDEN:
          errorMessage = ERROR_MESSAGES.FORBIDDEN
          break
        case HTTP_STATUS.NOT_FOUND:
          errorMessage = ERROR_MESSAGES.NOT_FOUND
          break
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          errorMessage = ERROR_MESSAGES.INTERNAL_SERVER_ERROR
          console.error('服务器内部错误:', error.response.data)
          break
        default:
          errorMessage = error.response.data?.message || `请求失败 (${error.response.status})`
      }

      // 如果服务器返回了code字段，使用服务器的错误信息
      if (error.response.data && error.response.data.hasOwnProperty('code')) {
        return {
          success: false,
          message: error.response.data.message || errorMessage,
          data: error.response.data.data
        }
      }

      return {
        success: false,
        message: errorMessage,
        data: null
      }
    } else if (error.request) {
      // 请求已经成功发起，但没有收到响应
      console.error('网络连接失败，请检查网络设置')
      return {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: null
      }
    } else {
      // 发送请求时出了点问题
      console.error('请求配置错误:', error.message)
      return {
        success: false,
        message: error.message || ERROR_MESSAGES.REQUEST_CONFIG_ERROR,
        data: null
      }
    }
  }
)

export default request