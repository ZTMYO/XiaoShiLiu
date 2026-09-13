# 项目结构

小石榴图文社区采用前后端分离结构：前端 Vue 3 + Vite，后端 Express + MySQL。

## 总体结构

```
小石榴图文社区/
├── vue3-project/            # 前端项目
├── express-project/         # 后端项目
├── doc/                     # 项目文档
│   ├── API_DOCS.md          # 接口文档
│   ├── DATABASE_DESIGN.md   # 数据库设计
│   ├── DEPLOYMENT.md        # 部署指南
│   ├── PROJECT_STRUCTURE.md # 项目结构（本文档）
│   ├── i18n/                # 文档的英/繁体版本
│   └── imgs/                # 文档配图
├── docker-compose.yml       # Docker 编排
├── .env.docker              # Docker 环境变量模板
├── deploy.sh                # Linux 一键部署脚本
├── deploy.ps1               # Windows 一键部署脚本
├── LICENSE                  # 开源协议
└── README.md                # 项目主文档
```

## 前端项目结构（vue3-project/）

```
vue3-project/
├── public/                  # 静态资源（站点图标、manifest.json）
├── src/
│   ├── api/                 # 接口封装
│   ├── assets/              # 图片、图标、样式等静态资源
│   ├── components/          # 公共组件
│   ├── composables/         # 组合式函数
│   ├── config/              # 应用配置与常量
│   ├── directives/          # 自定义指令
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia 状态管理
│   ├── utils/               # 工具函数
│   ├── views/               # 页面组件
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
├── .env.example             # 环境变量模板
├── Dockerfile               # 镜像构建
├── nginx.conf               # Nginx 配置
├── index.html               # HTML 模板
├── jsconfig.json            # 路径别名配置
├── package.json             # 依赖与脚本
└── vite.config.js           # Vite 配置
```

## 后端项目结构（express-project/）

```
express-project/
├── config/                  # 应用配置（数据库、JWT、上传、邮件等）
├── constants/               # 业务常量
├── fonts/                   # 图片水印字体
├── imgLinks/                # 示例图片链接库
├── middleware/              # 中间件（认证、CRUD 工厂）
├── routes/                  # 路由定义
├── scripts/                 # 初始化、测试数据、违规词检测等脚本
├── utils/                   # 工具函数（JWT、上传、通知、定时任务等）
├── app.js                   # 应用入口
├── .env.example             # 环境变量模板
├── Dockerfile               # 镜像构建
└── package.json             # 依赖与脚本
```

### 路由文件说明

| 文件 | 挂载路径 | 功能 |
|------|----------|------|
| `auth.js` | `/api/auth` | 登录、注册、令牌校验 |
| `users.js` | `/api/users` | 用户信息、关注关系 |
| `posts.js` | `/api/posts` | 笔记发布、编辑、删除、查询 |
| `comments.js` | `/api/comments` | 评论发布、删除、查询 |
| `likes.js` | `/api/likes` | 笔记与评论点赞 |
| `tags.js` | `/api/tags` | 标签查询与管理 |
| `search.js` | `/api/search` | 笔记、用户、标签搜索 |
| `notifications.js` | `/api/notifications` | 通知列表与已读 |
| `upload.js` | `/api/upload` | 图片与视频上传 |
| `stats.js` | `/api/stats` | 平台数据统计 |
| `categories.js` | `/api/categories` | 分类查询 |
| `files.js` | `/api/files` | 文件访问 |
| `admin.js` | `/api/admin` | 后台管理 |
| `docs.js` | `/api/system` | 系统信息与接口文档 |

### 脚本文件说明

| 文件 | 功能 |
|------|------|
| `init-database.js` | 创建数据库与数据表 |
| `init-database.sql` | SQL 版建表脚本，可直接在 MySQL 客户端执行 |
| `generate-data.js` | 生成开发环境测试数据 |
| `update-sample-images.js` | 批量更新示例图片链接 |
| `local-sensitive-word-check.js` | 扫描笔记与评论中的违规词 |
| `migrate-audit-to-verification.js` | 将 audit 表中的认证数据迁移到 user_verification |

## 技术架构

### 前端架构

```
┌──────────────────────────────────────┐
│              Vue 3 App               │
├──────────────────────────────────────┤
│   Views (页面)  │  Components (组件)  │
├──────────────────────────────────────┤
│   Router (路由) │  Stores (状态管理)  │
├──────────────────────────────────────┤
│   API (接口)    │  Utils (工具)      │
├──────────────────────────────────────┤
│           Vite (构建工具)            │
└──────────────────────────────────────┘
```

### 后端架构

```
┌──────────────────────────────────────┐
│           Express Server             │
├──────────────────────────────────────┤
│   Routes (路由) │ Middleware (中间件) │
├──────────────────────────────────────┤
│   Config (配置) │  Utils (工具)      │
├──────────────────────────────────────┤
│           MySQL Database             │
└──────────────────────────────────────┘
```

## 数据流向

```
前端 Vue App
     ↓ HTTP 请求
Express 路由
     ↓ 数据处理
中间件验证
     ↓ 数据库操作
MySQL 数据库
     ↓ 返回数据
前端状态更新
     ↓ 视图渲染
用户界面展示
```
