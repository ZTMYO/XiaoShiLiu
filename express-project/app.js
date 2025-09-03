/**
 * 小石榴校园图文社区 - Express后端服务
 * 
 * @author ZTMYO
 * @github https://github.com/ZTMYO
 * @description 基于Express框架的图文社区后端API服务
 * @version 1.0.0
 * @license MIT
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config/config');

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

const app = express();

// 中间件配置
// CORS配置
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // 显式处理OPTIONS请求
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 路由配置
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

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 启动服务器
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`● 服务器运行在端口 ${PORT}`);
  console.log(`● 环境: ${config.server.env}`);
});

module.exports = app;