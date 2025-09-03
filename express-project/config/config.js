/**
 * 小石榴校园图文社区 - 应用配置文件
 * 集中管理所有配置项
 * 
 * @author ZTMYO
 * @github https://github.com/ZTMYO
 * @description Express应用的核心配置管理
 * @version 1.0.0
 */

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'xiaoshiliu_secret_key_2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'xiaoshiliu',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
  },

  // 上传配置
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '50mb',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },

  // API配置
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    timeout: 30000
  },

  // 分页配置
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },

  // 缓存配置
  cache: {
    ttl: 300 // 5分钟
  }
};