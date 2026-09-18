# 项目结构

小石榴图文社区采用前后端分离结构：前端 Vue 3 + Vite，后端 Express + MySQL。

## 总体结构

```
小石榴图文社区/
├── vue3-project/            # 前端项目
├── express-project/         # 后端项目
├── doc/                     # 项目文档
│   ├── OVERVIEW.md          # 文档总览
│   ├── API_DOCS.md          # 接口文档
│   ├── DEPLOYMENT.md        # 部署指南
│   ├── PROJECT_STRUCTURE.md # 项目结构（本文档）
│   ├── DATABASE_DESIGN.md   # 数据库设计
│   ├── i18n/                # 文档的英/繁体版本
│   └── imgs/                # 文档配图
├── docker-compose.yml       # Docker 编排
├── .env.docker              # Docker 环境变量模板
├── deploy.sh                # Linux 一键部署脚本
├── deploy.ps1               # Windows 一键部署脚本
├── LICENSE                  # 开源协议
└── README.md                # 项目主文档
```

## 前端项目结构

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

## 后端项目结构

```
express-project/
├── config/                  # 应用配置（数据库、JWT、上传、邮件等）
├── constants/               # 业务常量
├── fonts/                   # 图片水印字体
├── imgLinks/                # 示例图片链接库
├── middleware/              # 中间件（认证、CRUD 工厂）
├── routes/                  # 路由定义
├── scripts/                 # 初始化、测试数据、违规词检测等脚本
├── utils/                   # 工具函数（JWT、上传、通知、搜索联想索引、定时任务等）
├── app.js                   # 应用入口
├── .env.example             # 环境变量模板
├── Dockerfile               # 镜像构建
└── package.json             # 依赖与脚本
```

### 路由文件说明

| 文件 | 挂载路径 | 功能 |
|------|----------|------|
| `auth.js` | `/api/auth` | 登录、注册、令牌校验 |
| `users.js` | `/api/users` | 用户信息、资料统计、关注与粉丝、认证申请、修改密码 |
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
| `admin.js` | `/api/admin` | 后台管理（用户、内容、会话、管理员等） |
| `docs.js` | `/api/system` | 站点文档的 Markdown 原文 |

此外 `GET /api/health` 健康检查由 `app.js` 直接定义，不经过 `routes/`。

### 脚本文件说明

| 文件 | 功能 |
|------|------|
| `init-database.js` | 创建数据库与数据表 |
| `init-database.sql` | SQL 版建表脚本，可直接在 MySQL 客户端执行 |
| `generate-data.js` | 生成开发环境测试数据 |
| `update-sample-images.js` | 批量更新示例图片链接 |
| `local-sensitive-word-check.js` | 扫描笔记与评论中的违规词 |
| `migrate-audit-to-verification.js` | 将 audit 表中的认证数据迁移到 user_verification |
| `违规词库.txt` | `local-sensitive-word-check.js` 加载的违规词词库 |

## 前端页面与路由

### 主站页面

| 页面文件 | 路由 | 说明 |
|----------|------|------|
| `layout/index.vue` | `/` | 主站布局（页头、侧边栏、页脚），根路径重定向到 `/explore` |
| `explore/index.vue` | `/explore` | 发现页 |
| `explore/ChannelPage.vue` | `/explore`、`/explore/:channel` | 频道内容流，`:channel` 无效时回退到推荐 |
| `PostDetail.vue` | `/post` | 笔记详情 |
| `publish/index.vue` | `/publish` | 发布笔记 |
| `notification/index.vue` | `/notification` | 通知中心 |
| `user/index.vue` | `/user` | 我的主页 |
| `user/UserProfile.vue` | `/user/:userId` | 他人主页 |
| `user/FollowList.vue` | `/follow/:type` | 关注、粉丝、互关列表，`type` 取 `mutual`、`following`、`followers` |
| `search/SearchResult.vue` | `/search_result`、`/search_result/:tab` | 搜索结果，`tab` 取 `all`、`post`、`video`、`user` |
| `post-management/index.vue` | `/post-management` | 笔记管理 |
| `draft-box/index.vue` | `/draft-box` | 草稿箱 |
| `NotFound.vue` | `/:pathMatch(.*)*` | 404 页面 |

### 独立布局页面

| 页面文件 | 路由 | 说明 |
|----------|------|------|
| `download/index.vue` | `/download` | 客户端下载页 |
| `doc/index.vue` | `/doc/:name?`、`/:lang(zh\|en\|zh-Hant)/doc/:name?` | 文档阅读页 |

### 后台管理页面

| 页面文件 | 路由 | 说明 |
|----------|------|------|
| `admin/AdminLogin.vue` | `/admin/login` | 后台登录 |
| `admin/AdminLayout.vue` | `/admin` | 后台布局，根路径重定向到 `/admin/monitor` |
| `admin/AdminMonitor.vue` | `/admin/monitor` | 动态监控 |
| `admin/UserManagement.vue` | `/admin/users` | 用户管理 |
| `admin/PostAudit.vue` | `/admin/post-audit` | 笔记审核 |
| `admin/CommentAudit.vue` | `/admin/comment-audit` | 评论审核 |
| `admin/PostManagement.vue` | `/admin/posts` | 笔记管理 |
| `admin/CommentManagement.vue` | `/admin/comments` | 评论管理 |
| `admin/CategoryManagement.vue` | `/admin/categories` | 分类管理 |
| `admin/TagManagement.vue` | `/admin/tags` | 标签管理 |
| `admin/LikeManagement.vue` | `/admin/likes` | 点赞管理 |
| `admin/CollectionManagement.vue` | `/admin/collections` | 收藏管理 |
| `admin/FollowManagement.vue` | `/admin/follows` | 关注管理 |
| `admin/NotificationManagement.vue` | `/admin/notifications` | 通知管理 |
| `admin/SessionManagement.vue` | `/admin/sessions` | 用户会话管理 |
| `admin/AdminSessionManagement.vue` | `/admin/admin-sessions` | 管理员会话管理 |
| `admin/AdminManagement.vue` | `/admin/admins` | 管理员管理 |
| `admin/AuditManagement.vue` | `/admin/audit` | 认证审核 |

## 请求生命周期

```
浏览器
  ↓ 前端 axios 实例（src/api/request.js）
     请求拦截器注入 Authorization: Bearer <token>（后台页面用 admin_token）
Vite 开发服务器 / Nginx（线上：静态托管 + /api 反向代理到后端 3001 端口）
  ↓
Express（app.js）
  ├── cors
  ├── express.json / urlencoded（请求体上限 50MB）
  ├── 限流：/api 每 15 分钟 500 次，/api/auth 每 5 分钟 20 次，/api/upload 每 15 分钟 60 次，/api/search/suggest 每分钟 120 次
  ├── 路由分发（routes/*.js，挂载路径见上表）
  ├── 认证中间件（middleware/auth.js 的 authenticateToken、optionalAuth）
  └── utils/dbHelper.js → MySQL 连接池（config/config.js 导出的 pool）
  ↓ JSON 响应（统一 { code, message, data }）
响应拦截器把 code 转成 success，401 清除令牌并跳登录，429 提示请求过于频繁
  ↓
Pinia store 更新状态 → 组件重新渲染
```

## 常见改动入口

| 要做的事 | 需要改的文件 |
|----------|--------------|
| 新增前端页面 | `src/views/` 新建组件 → `src/router/index.js` 注册路由 → 需要接口时在 `src/api/` 封装、在 `src/stores/` 加状态 |
| 新增后端接口 | 在 `routes/` 对应文件加路由，新领域则新建文件并在 `app.js` 挂载 → 需要认证时加 `middleware/auth.js` 的中间件 → 数据库操作走 `utils/dbHelper.js` |
| 新增数据表 | `scripts/init-database.js` 与 `scripts/init-database.sql` 两处保持同步 |
