/**
 * 小石榴校园图文社区 - 应用配置文件
 * 集中管理所有配置项
 * 
 * @author ZTMYO
 * @github https://github.com/ZTMYO
 * @description Express应用的核心配置管理
 * @version v1.3.3
 */

const mysql = require('mysql2/promise');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });


const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3001,
    // 生产环境有 Nginx 反代时必须设为 true，否则 req.ip 恒为 Nginx 的 IP，
    // 限流会对全站用户共用同一个计数器（A 触发上限 → 全站 429）
    trustProxy: process.env.TRUST_PROXY === 'true',
    env: process.env.NODE_ENV || 'development'
  },

  // 限流配置（按真实客户端 IP 计数）
  rateLimit: {
    // 通用 API：15 分钟 500 次
    api: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_API_MAX) || 500
    },
    // 认证接口（登录/注册/发码等）：5 分钟 20 次
    auth: {
      windowMs: 5 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 20
    },
    // 注册接口：10 分钟 6 次（防注册轰炸）
    register: {
      windowMs: 10 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX) || 6
    },
    // 图形验证码获取：10 分钟 30 次（防脚本循环取码）
    captcha: {
      windowMs: 10 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_CAPTCHA_MAX) || 30
    },
    // 邮箱验证码发送：10 分钟 10 次
    sendCode: {
      windowMs: 10 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_SENDCODE_MAX) || 10
    },
    // 上传接口：15 分钟 60 次
    upload: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX) || 60
    },
    // 搜索联想：1 分钟 120 次
    suggest: {
      windowMs: 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_SUGGEST_MAX) || 120
    },
    // 登录失败锁定：同账号 15 分钟 5 次后临时锁定
    loginLock: {
      windowMs: 15 * 60 * 1000,
      maxFailures: 5
    }
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : ['http://localhost:5173', 'http://localhost:3001']
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
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
      strategy: process.env.IMAGE_UPLOAD_STRATEGY || 'imagehost', // 'local', 'imagehost', 'r2' 或 'aliyun'
      // 本地存储配置
      local: {
        uploadDir: process.env.IMAGE_LOCAL_UPLOAD_DIR || 'uploads/images',
        baseUrl: process.env.LOCAL_BASE_URL || 'http://localhost:3001'
      },
      // 第三方图床配置
      imagehost: {
        apiUrl: process.env.IMAGEHOST_API_URL || 'https://api.xinyew.cn/api/360tc',
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
      },
      // 阿里云 OSS配置
      aliyun: {
        region: process.env.OSS_REGION || 'oss-cn-hongkong',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucketName: process.env.OSS_BUCKET_NAME,
        publicUrl: process.env.OSS_PUBLIC_URL, // 可选：自定义域名或 CDN
        // 对象前缀，用于按环境或用途隔离图片
        imagePrefix: process.env.OSS_IMAGE_PREFIX || 'images/'
      }
    },
    // 视频上传配置
    video: {
      maxSize: process.env.VIDEO_MAX_SIZE || '100mb',
      allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
      // 视频上传策略配置（不支持第三方图床）
      strategy: process.env.VIDEO_UPLOAD_STRATEGY || 'local', // 'local'、'r2' 或 'aliyun'
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
      },
      // 阿里云 OSS配置
      aliyun: {
        region: process.env.OSS_REGION || 'oss-cn-hongkong',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
        bucketName: process.env.OSS_BUCKET_NAME,
        publicUrl: process.env.OSS_PUBLIC_URL, // 可选：自定义域名或 CDN
        // 对象前缀，用于按环境或用途隔离视频
        videoPrefix: process.env.OSS_VIDEO_PREFIX || 'videos/'
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
  },

  // 邮件服务配置
  email: {
    // 是否启用邮件功能
    enabled: process.env.EMAIL_ENABLED === 'true', // 默认不启用
    // SMTP服务器配置
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'false' ? false : true, // 默认使用SSL
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || ''
      }
    },
    // 发件人配置
    from: {
      email: process.env.EMAIL_FROM || '',
      name: process.env.EMAIL_FROM_NAME || '小石榴校园图文社区'
    }
  },

  // IP属地查询配置（百度 opendata：公开接口，免费、无需密钥）
  ipLocation: {
    api: process.env.IP_LOCATION_API || 'https://opendata.baidu.com/api.php',
    timeout: parseInt(process.env.IP_LOCATION_TIMEOUT) || 8000
  },

  // 违规词检测配置
  sensitiveWordCheck: {
    enabled: process.env.SENSITIVE_WORD_CHECK_ENABLED === 'true',
    // 白名单用户ID，名单内用户不参与检测，多个用英文逗号分隔
    userWhitelist: (process.env.SENSITIVE_WORD_CHECK_WHITELIST || '')
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !Number.isNaN(id))
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