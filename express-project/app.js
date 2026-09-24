/**
 * 小石榴校园图文社区 - Express后端服务
 * 
 * @author ZTMYO
 * @github https://github.com/ZTMYO
 * @description 基于Express框架的图文社区后端API服务
 * @version v1.3.3
 * @license GPLv3
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { HTTP_STATUS, RESPONSE_CODES } = require('./constants');
// 导入自动解封功能
const { startAutoUnbanService } = require('./utils/autoUnban');
// 导入违规词检测服务
const { startSensitiveWordCheckService } = require('./utils/sensitiveWordScheduler');
// 导入搜索联想索引服务
const { startSuggestService } = require('./utils/searchSuggest');
// 导入违规词库加载（发布评论时需实时检测，词库必须在服务监听前就绪）
const { loadSensitiveWords } = require('./scripts/local-sensitive-word-check');

// 导入路由模块
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');
const likesRoutes = require('./routes/likes');
const tagsRoutes = require('./routes/tags');
const searchRoutes = require('./routes/search');
const notificationsRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const categoriesRoutes = require('./routes/categories');
const filesRoutes = require('./routes/files');
const docsRoutes = require('./routes/docs');

const app = express();

// 关键修复：Nginx 反代下不设置 trust proxy 会导致 req.ip 恒为 Nginx 的 IP，
// express-rate-limit 默认按 req.ip 计数时全站共用同一个桶（A 触发上限 → 全站 429 全崩）。
// production 部署在 Nginx 后时需在 .env 设置 TRUST_PROXY=true。
app.set('trust proxy', config.server.trustProxy);

// 统一限流 key：必须用 req.ip（trust proxy 开启后为 XFF 最右的真实客户端 IP）。
// 不要取 X-Forwarded-For 的第一个值——攻击者可以伪造该头绕过限流。
const clientKey = (req) => req.ip;

const createLimiter = (options) => rateLimit({
  windowMs: options.windowMs,
  max: options.max,
  keyGenerator: clientKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      code: RESPONSE_CODES.TOO_MANY_REQUESTS,
      message: '请求过于频繁，请稍后再试'
    });
  },
  ...options.extra
});

const { rateLimit: rateLimitConfig } = config;

// 读接口（GET）放宽，全局限流只针对写操作：避免校园 NAT 出口共享 IP 误伤全体用户
const skipGet = (req) => req.method === 'GET' || req.path === '/api/health';
const apiLimiter = createLimiter({ ...rateLimitConfig.api, extra: { skip: skipGet } });
const authLimiter = createLimiter({ ...rateLimitConfig.auth, extra: { skip: (req) => req.method === 'GET' } });
const registerLimiter = createLimiter({ ...rateLimitConfig.register, extra: { skipFailedRequests: true } });
const captchaLimiter = createLimiter(rateLimitConfig.captcha);
const sendCodeLimiter = createLimiter(rateLimitConfig.sendCode);
const uploadLimiter = createLimiter(rateLimitConfig.upload);
const suggestLimiter = createLimiter(rateLimitConfig.suggest);

// 中间件配置
// CORS配置
const corsOptions = {
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // 显式处理OPTIONS请求
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    code: RESPONSE_CODES.SUCCESS,
    message: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 路由配置
// 先挂精确路径的专用限流（验证码 GET、注册、邮件验证码发送），再挂宽路径限流
app.use('/api', apiLimiter);
app.use('/api/auth/captcha', captchaLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/send-email-code', sendCodeLimiter);
app.use('/api/auth/send-reset-code', sendCodeLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/search/suggest', suggestLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/system', docsRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: '服务器内部错误' });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({ code: RESPONSE_CODES.NOT_FOUND, message: '接口不存在' });
});

async function startServer() {
  // 先载入违规词库再监听：词库未就绪时发布评论会漏检
  await loadSensitiveWords();

  // 启动自动解封服务
  startAutoUnbanService();

  // 启动违规词检测服务
  startSensitiveWordCheckService();

  // 启动服务器
  const PORT = config.server.port;
  app.listen(PORT, () => {
    console.log(`● 服务器运行在端口 ${PORT}`);
    console.log(`● 环境: ${config.server.env}`);
  });

  // 启动搜索联想索引（异步构建，不阻塞服务启动）
  startSuggestService();
}

startServer();

module.exports = app;