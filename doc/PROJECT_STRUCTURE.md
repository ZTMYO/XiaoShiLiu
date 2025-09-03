# 项目结构

本文档详细介绍了小石榴图文社区项目的目录结构和文件组织。

## 总体结构

```
小石榴图文社区/
├── vue3-project/           # 前端项目
├── express-project/        # 后端项目
├── README.md              # 项目主文档
├── DEPLOYMENT.md          # 部署指南
└── PROJECT_STRUCTURE.md   # 项目结构说明（本文档）
```

## 前端项目结构（vue3-project/）

```
vue3-project/
├── public/                # 静态资源目录
│   └── logo.ico          # 网站图标
├── src/                  # 源代码目录
│   ├── api/              # API接口封装
│   ├── assets/           # 静态资源（图片、样式等）
│   ├── components/       # 公共组件
│   ├── composables/      # 组合式函数
│   ├── config/           # 配置文件
│   ├── directives/       # 自定义指令
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia状态管理
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── .env.example          # 环境变量模板
├── index.html            # HTML模板
├── package.json          # 项目配置
├── vite.config.js        # Vite配置
└── README.md             # 前端项目说明
```

### 前端目录详细说明

| 目录/文件 | 说明 | 主要内容 |
|-----------|------|----------|
| `public/` | 静态资源目录 | 网站图标、不需要编译的静态文件 |
| `src/api/` | API接口封装 | HTTP请求封装、接口定义 |
| `src/assets/` | 静态资源 | 图片、字体、样式文件等 |
| `src/components/` | 公共组件 | 可复用的Vue组件 |
| `src/composables/` | 组合式函数 | Vue 3 Composition API逻辑复用 |
| `src/config/` | 配置文件 | 应用配置、常量定义 |
| `src/directives/` | 自定义指令 | Vue自定义指令 |
| `src/router/` | 路由配置 | Vue Router路由定义 |
| `src/stores/` | 状态管理 | Pinia状态管理模块 |
| `src/utils/` | 工具函数 | 通用工具函数、辅助方法 |
| `src/views/` | 页面组件 | 页面级Vue组件 |
| `App.vue` | 根组件 | 应用程序根组件 |
| `main.js` | 入口文件 | 应用程序入口点 |
| `vite.config.js` | Vite配置 | 构建工具配置 |

## 后端项目结构（express-project/）

```
express-project/
├── config/               # 配置文件目录
│   ├── config.js        # 主配置文件
│   └── database.js      # 数据库配置
├── routes/               # 路由文件目录
│   ├── auth.js          # 认证路由
│   ├── users.js         # 用户路由
│   ├── posts.js         # 帖子路由
│   ├── comments.js      # 评论路由
│   └── ...              # 其他路由文件
├── middleware/           # 中间件目录
│   ├── auth.js          # 认证中间件
│   └── crudFactory.js   # CRUD工厂
├── utils/                # 工具函数目录
├── scripts/              # 脚本文件目录
│   ├── init-database.js # 数据库初始化脚本
│   ├── init-database.sql # SQL初始化脚本
│   ├── generate-data.js # 测试数据生成脚本
│   └── update-sample-images.js # 示例图片更新脚本
├── app.js               # 应用入口文件
├── package.json         # 项目配置
└── .env.example         # 环境变量模板
```

### 后端目录详细说明

| 目录/文件 | 说明 | 主要内容 |
|-----------|------|----------|
| `config/` | 配置文件目录 | 应用配置、数据库配置 |
| `routes/` | 路由文件目录 | Express路由定义、API端点 |
| `middleware/` | 中间件目录 | Express中间件、认证逻辑 |
| `utils/` | 工具函数目录 | 通用工具函数、辅助方法 |
| `scripts/` | 脚本文件目录 | 数据库初始化、数据生成脚本 |
| `app.js` | 应用入口文件 | Express应用程序入口 |

### 路由文件说明

| 路由文件 | 功能 | 主要端点 |
|----------|------|----------|
| `auth.js` | 用户认证 | 登录、注册、token验证 |
| `users.js` | 用户管理 | 用户信息CRUD、关注关系 |
| `posts.js` | 帖子管理 | 帖子发布、编辑、删除、查询 |
| `comments.js` | 评论管理 | 评论发布、删除、查询 |

### 脚本文件说明

| 脚本文件 | 功能 | 使用场景 |
|----------|------|----------|
| `init-database.js` | 数据库初始化 | 首次部署时创建数据库结构 |
| `init-database.sql` | SQL初始化脚本 | 直接在MySQL客户端执行 |
| `generate-data.js` | 测试数据生成 | 开发环境填充测试数据 |
| `update-sample-images.js` | 图片链接更新 | 更新示例图片资源 |

## 技术架构

### 前端架构

```
┌─────────────────────────────────────┐
│              Vue 3 App              │
├─────────────────────────────────────┤
│  Views (页面)  │  Components (组件)  │
├─────────────────────────────────────┤
│  Router (路由) │  Stores (状态管理)   │
├─────────────────────────────────────┤
│  API (接口)    │  Utils (工具)       │
├─────────────────────────────────────┤
│           Vite (构建工具)            │
└─────────────────────────────────────┘
```

### 后端架构

```
┌─────────────────────────────────────┐
│           Express Server            │
├─────────────────────────────────────┤
│  Routes (路由)  │ Middleware (中间件) │
├─────────────────────────────────────┤
│  Config (配置)  │  Utils (工具)      │
├─────────────────────────────────────┤
│           MySQL Database            │
└─────────────────────────────────────┘
```

## 数据流向

```
前端 Vue App
     ↓ HTTP请求
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
