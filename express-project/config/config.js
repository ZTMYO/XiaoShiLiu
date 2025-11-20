/**
 * 小石榴校园图文社区 - 应用配置文件
 * 集中管理所有配置项
 * 
 * @author ZTMYO
 * @github https://github.com/ZTMYO
 * @description Express应用的核心配置管理
 * @version v1.2.0
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
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
    charset: 'utf8mb4',
    timezone: '+08:00'
  },

  // 上传配置
  upload: {
    // 图片上传配置
    image: {
      maxSize: process.env.IMAGE_MAX_SIZE || '10mb',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      // 图片上传策略配置
      strategy: process.env.IMAGE_UPLOAD_STRATEGY || 'imagehost', // 'local', 'imagehost' 或 'r2'
      // 本地存储配置
      local: {
        uploadDir: process.env.IMAGE_LOCAL_UPLOAD_DIR || 'uploads/images',
        baseUrl: process.env.LOCAL_BASE_URL || 'http://localhost:3001'
      },
      // 第三方图床配置
      imagehost: {
        apiUrl: process.env.IMAGEHOST_API_URL || 'https://api.xinyew.cn/api/jdtc',
        timeout: parseInt(process.env.IMAGEHOST_TIMEOUT) || 60000
      },
      // Cloudflare R2配置
      r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucketName: process.env.R2_BUCKET_NAME,
        endpoint: process.env.R2_ENDPOINT,
        publicUrl: process.env.R2_PUBLIC_URL, // 可选：自定义域名
        region: process.env.R2_REGION || 'auto'
      }
    },
    // 视频上传配置
    video: {
      maxSize: process.env.VIDEO_MAX_SIZE || '100mb',
      allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
      // 视频上传策略配置（只支持本地和R2，不支持第三方图床）
      strategy: process.env.VIDEO_UPLOAD_STRATEGY || 'local', // 'local' 或 'r2'
      // 本地存储配置
      local: {
        uploadDir: process.env.VIDEO_LOCAL_UPLOAD_DIR || 'uploads/videos',
        baseUrl: process.env.LOCAL_BASE_URL || 'http://localhost:3001'
      },
      // Cloudflare R2配置
      r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucketName: process.env.R2_BUCKET_NAME,
        endpoint: process.env.R2_ENDPOINT,
        publicUrl: process.env.R2_PUBLIC_URL, // 可选：自定义域名
        region: process.env.R2_REGION || 'auto'
      }
    }
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

// 数据库连接池配置
const dbConfig = {
  ...config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

module.exports = {
  ...config,
  pool
};