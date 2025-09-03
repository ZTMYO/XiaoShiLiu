// API配置文件
export const apiConfig = {
  // 后端API基础URL
  baseURL: '/api',

  // 请求超时时间（毫秒）
  timeout: 60000, // 增加到60秒，适应多图片上传场景

  // 默认请求头
  defaultHeaders: {
    'Content-Type': 'application/json'
  },

  // 分页配置
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100
  },

  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxImageCount: 9 // 最多上传9张图片
  }
}

// 本地开发环境配置
// 所有环境都使用 localhost:3001/api

export default apiConfig