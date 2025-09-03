# 部署指南

本文档详细介绍了小石榴图文社区项目的部署流程和配置说明。

## 环境要求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 16.0.0 | 运行环境 |
| MySQL | >= 5.7 | 数据库 |
| MariaDB | >= 10.3 | 数据库（可选） |
| npm | >= 8.0.0 | 包管理器 |
| yarn | >= 1.22.0 | 包管理器（可选） |
| 浏览器 | 支持ES6+ | 现代浏览器 |

## 快速开始

### 1. 安装依赖

```bash
# 使用 cnpm
cnpm install
# 或使用 yarn
yarn install
```

### 2. 配置后端API地址

创建环境配置文件（可选）：

```bash
# 复制环境配置模板
cp .env.example .env
```

编辑 `.env` 文件，配置后端API地址：

```env
# 后端API地址
VITE_API_BASE_URL=http://localhost:3001

# 其他配置...
```

### 3. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 或使用 yarn
yarn dev
```

开发服务器将在 `http://localhost:5173` 启动

### 4. 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 后端服务配置

⚠️ **重要提醒**：前端项目需要配合后端服务使用

1. **启动后端服务**：
   ```bash
   # 进入后端项目目录
   cd ../express-project
   
   # 安装后端依赖
   npm install
   
   # 启动后端服务
   npm start
   ```

2. **后端服务地址**：`http://localhost:3001`

3. **API文档**：查看后端项目的 `API_DOCS.md` 文件

## 开发环境配置

### 环境检查

```bash
# 检查Node.js版本
node --version

# 检查npm版本
npm --version
```

### 开发服务器

```bash
# 启动开发服务器（热重载）
npm run dev

# 访问地址：http://localhost:5173
```

### 代码规范

- 使用 Vue 3 Composition API
- 遵循 Vue.js 官方风格指南
- 组件命名采用 PascalCase
- 文件命名采用 kebab-case

## 配置文件说明

### 前端配置文件（vue3-project目录）

| 文件 | 说明 |
|------|------|
| `.env` | 环境变量配置文件 |
| `vite.config.js` | Vite构建工具配置 |
| `package.json` | 项目依赖和脚本配置 |
| `jsconfig.json` | JavaScript项目配置 |

### 后端配置文件（express-project目录）

| 文件 | 说明 |
|------|------|
| `config/config.js` | 主配置文件 |
| `config/database.js` | 数据库配置 |
| `.env` | 环境变量配置文件 |
| `database_design.md` | 数据库设计文档 |
| `scripts/init-database.js` | 数据库初始化脚本 |
| `generate-data.js` | 测试数据生成脚本 |

## npm脚本命令

### 前端脚本（在vue3-project目录下执行）

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产版本 |

### 后端脚本（在express-project目录下执行）

| 命令 | 说明 |
|------|------|
| `npm start` | 启动服务器 |
| `npm run dev` | 启动开发服务器（热重载） |
| `npm run init-db` | 初始化数据库 |
| `npm run generate-data` | 生成测试数据 |

## 环境变量配置

### 前端环境变量（vue3-project/.env）

```env
# API服务器地址
VITE_API_BASE_URL=http://localhost:3001/api

# 其他前端配置
VITE_APP_TITLE=小石榴图文社区
VITE_USE_REAL_API=true
```

### 后端环境变量（express-project/.env）

```env
# 服务器配置
NODE_ENV=development
PORT=3001

# JWT配置
JWT_SECRET=xiaoshiliu_secret_key_2025
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=xiaoshiliu
DB_PORT=3306

# API配置
API_BASE_URL=http://localhost:3001

# 上传配置
UPLOAD_MAX_SIZE=50mb
```

## 数据库脚本说明

项目的数据库相关脚本都统一放在 `express-project/scripts/` 目录下，方便管理和使用：

### 脚本文件介绍

#### 1. 数据库初始化脚本
- **文件位置**：`scripts/init-database.js`
- **功能**：创建数据库和所有数据表结构
- **使用方法**：
  ```bash
  cd express-project
  node scripts/init-database.js
  ```
- **说明**：首次部署时必须运行，会自动创建 `xiaoshiliu` 数据库和12个数据表

#### 2. 测试数据生成脚本
- **文件位置**：`scripts/generate-data.js`
- **功能**：生成模拟的用户、帖子、评论等测试数据
- **使用方法**：
  ```bash
  cd express-project
  node scripts/generate-data.js
  ```
- **说明**：可选运行，用于快速填充测试数据，包含50个用户、200个帖子、800条评论等

#### 3. SQL初始化文件
- **文件位置**：`scripts/init-database.sql`
- **功能**：纯SQL版本的数据库初始化脚本
- **使用方法**：可直接在MySQL客户端中执行
- **说明**：与 `init-database.js` 功能相同，提供SQL版本供参考

#### 4. 示例图片更新脚本
- **文件位置**：`scripts/update-sample-images.js`
- **功能**：自动获取最新图片链接并更新数据库中的示例图片
- **使用方法**：
  ```bash
  cd express-project
  node scripts/update-sample-images.js
  ```
- **说明**：
  - 自动从栗次元API获取最新的图片链接
  - 更新 `imgLinks/avatar_link.txt`（50个头像链接）
  - 更新 `imgLinks/post_img_link.txt`（300个帖子图片链接）
  - 批量更新数据库中的用户头像和帖子图片
  - 支持统计显示更新前后的图片数量

## 开发环境启动流程

### 1. 启动后端服务

```bash
# 打开第一个终端，进入后端目录
cd express-project

# 安装后端依赖（首次运行）
npm install

# 配置数据库（首次运行）
# 编辑 config/config.js 或 .env 文件

# 初始化数据库（首次运行）
node scripts/init-database.js

# 生成测试数据（可选）
node scripts/generate-data.js

# 启动后端服务
npm start
# 后端服务运行在 http://localhost:3001
```

### 2. 启动前端服务

```bash
# 打开第二个终端，进入前端目录
cd vue3-project

# 安装前端依赖（首次运行）
npm install

# 配置API地址（可选）
# 编辑 .env 文件，设置 VITE_API_BASE_URL

# 启动前端开发服务器
npm run dev
# 前端服务运行在 http://localhost:5173
```

### 3. 访问应用

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:5173 |
| 后端API | http://localhost:3001 |