# 小石榴图文社区部署指南

## 项目简介

小石榴图文社区是一个基于 Express + Vue3 的现代化图文社区平台，支持用户注册、发布图文内容、互动交流等功能。

## 系统要求

- **Docker 部署**：Docker 20.10+ 和 Docker Compose 2.0+
- **传统部署**：Node.js 18+、MySQL 5.7+、npm 或 yarn

> 💡 **宝塔面板部署**：如果您使用宝塔面板，可以参考这个详细的图文教程：[使用宝塔搭建小石榴图文社区完整教程](https://www.sakuraidc.cc/forum-post/3116.html)

---

## 🐋 Docker 一键部署（推荐）

### 1. 克隆项目

```bash
git clone https://github.com/ZTMYO/XiaoShiLiu
cd XiaoShiLiu
```

### 2. 配置环境变量

复制环境配置文件：
```bash
cp .env.docker .env
```

编辑 `.env` 文件，根据需要修改配置：

```env
# 数据库配置
DB_HOST=mysql
DB_USER=xiaoshiliu_user
DB_PASSWORD=123456
DB_NAME=xiaoshiliu
DB_PORT=3306

# JWT配置
JWT_SECRET=xiaoshiliu_secret_key_2025_docker
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# 上传配置
UPLOAD_MAX_SIZE=50mb
# 图片上传策略 (local: 本地存储, imagehost: 第三方图床, r2: Cloudflare R2)
IMAGE_UPLOAD_STRATEGY=imagehost
# 视频上传策略 (local: 本地存储, r2: Cloudflare R2)
VIDEO_UPLOAD_STRATEGY=local

# 本地存储配置
LOCAL_UPLOAD_DIR=uploads
LOCAL_BASE_URL=http://localhost:3001
VIDEO_UPLOAD_DIR=uploads/videos
VIDEO_COVER_DIR=uploads/covers

# 第三方图床配置（当IMAGE_UPLOAD_STRATEGY=imagehost时使用）
IMAGEHOST_API_URL=https://api.xinyew.cn/api/360tc
IMAGEHOST_TIMEOUT=60000

# Cloudflare R2 配置（当IMAGE_UPLOAD_STRATEGY=r2或VIDEO_UPLOAD_STRATEGY=r2时使用）
# 如需使用R2存储，请取消注释并填入真实配置
# R2_ACCESS_KEY_ID=your_r2_access_key_id_here
# R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
# R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
# R2_BUCKET_NAME=your_bucket_name_here
# R2_ACCOUNT_ID=your_account_id_here
# R2_REGION=auto
# R2_PUBLIC_URL=https://your-custom-domain.com

# API配置
API_BASE_URL=http://localhost:3001

# 邮件服务配置
# 是否启用邮件功能 (true/false)，默认不启用
EMAIL_ENABLED=false
# SMTP服务器地址
SMTP_HOST=smtp.qq.com
# SMTP服务器端口
SMTP_PORT=465
# 是否使用SSL/TLS (true/false)
SMTP_SECURE=true
# 邮箱账号
SMTP_USER=your_email@example.com
# 邮箱密码/授权码
SMTP_PASSWORD=your_email_password
# 发件人邮箱
EMAIL_FROM=your_email@example.com
# 发件人名称
EMAIL_FROM_NAME=小石榴校园图文社区

# 前端构建配置
VITE_API_BASE_URL=http://localhost:3001/api

# 服务端口配置
FRONTEND_PORT=80
BACKEND_PORT=3001
DB_PORT_EXTERNAL=3306

# 生产环境标识
NODE_ENV=production
```

### 3. 启动服务

使用 PowerShell 脚本（Windows 推荐）：
```powershell
# 基本启动
.\deploy.ps1

# 重新构建并启动
.\deploy.ps1 -Build

# 启动并灌装示例数据
.\deploy.ps1 -Seed

# 查看帮助
.\deploy.ps1 -Help
```

或使用 Docker Compose：
```bash
# 启动服务
docker-compose up -d

# 重新构建并启动
docker-compose up -d --build
```

### 4. 访问应用

- **前端界面**：http://localhost:8080
- **后端API**：http://localhost:3001
- **数据库**：localhost:3307

### 5. 常用管理命令

```powershell
# 查看服务状态
.\deploy.ps1 -Status

# 查看日志
.\deploy.ps1 -Logs

# 停止服务
.\deploy.ps1 -Stop

# 清理所有数据（谨慎使用）
.\deploy.ps1 -Clean
```

## 🛠️ 传统部署

### 1. 环境准备

确保已安装：
- Node.js 18+
- MySQL 5.7+
- Git

### 2. 克隆项目

```bash
git clone <项目地址>
cd XiaoShiLiu
```

### 3. 数据库配置

确保 MySQL 服务已启动，数据库将通过脚本自动创建和初始化。

### 4. 后端配置

进入后端目录：
```bash
cd express-project
```

复制并配置环境文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 服务器配置
PORT=3001
NODE_ENV=development

# JWT配置
JWT_SECRET=xiaoshiliu_secret_key_2025_production
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
# 图片上传策略 (local: 本地存储, imagehost: 第三方图床, r2: Cloudflare R2)
UPLOAD_STRATEGY=imagehost

# 本地存储配置
LOCAL_UPLOAD_DIR=uploads
LOCAL_BASE_URL=http://localhost:3001

# 第三方图床配置（当UPLOAD_STRATEGY=imagehost时使用）
IMAGEHOST_API_URL=https://api.xinyew.cn/api/360tc
IMAGEHOST_TIMEOUT=60000

# Cloudflare R2 配置（当UPLOAD_STRATEGY=r2时使用）
# 请从 Cloudflare 控制台获取您自己的配置信息
R2_ACCESS_KEY_ID=your_r2_access_key_id_here
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your_bucket_name_here
R2_ACCOUNT_ID=your_account_id_here
R2_REGION=auto
# 可选：如果有自定义域名，可以设置 R2_PUBLIC_URL
# R2_PUBLIC_URL=https://your-custom-domain.com

# CORS配置
CORS_ORIGIN=http://localhost:5173

# 邮件服务配置
# 是否启用邮件功能 (true/false)
# 设置为false时，注册不需要邮箱验证，适合没有SMTP服务的用户
EMAIL_ENABLED=true
# SMTP服务器地址
SMTP_HOST=smtp.qq.com
# SMTP服务器端口
SMTP_PORT=465
# 是否使用SSL/TLS (true/false)
SMTP_SECURE=true
# 邮箱账号
SMTP_USER=your_email@example.com
# 邮箱密码/授权码
SMTP_PASSWORD=your_email_password
# 发件人邮箱
EMAIL_FROM=your_email@example.com
# 发件人名称
EMAIL_FROM_NAME=小石榴校园图文社区
```

安装依赖并初始化数据库：
```bash
npm install
# 初始化数据库结构
cd scripts
node init-database.js
# 生成示例数据（可选）
node generate-data.js
```

启动后端服务：
```bash
npm start
```

### 5. 前端配置

打开新终端，进入前端目录：
```bash
cd vue3-project
```

复制并配置环境文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，根据后端配置调整：
```env
# 开发环境配置

# API基础URL（需要与后端端口一致）
VITE_API_BASE_URL=http://localhost:3001/api

# 是否使用真实API
VITE_USE_REAL_API=true

# 应用标题
VITE_APP_TITLE=小石榴图文社区
```

安装依赖：
```bash
npm install
```

开发模式启动：
```bash
npm run dev
```

生产模式构建：
```bash
npm run build
npm run preview
```

### 6. 访问应用

- **开发模式**：http://localhost:5173
- **生产模式**：http://localhost:4173
- **后端API**：http://localhost:3001

## 📁 项目结构

```
XiaoShiLiu/
├── express-project/          # 后端项目
│   ├── app.js               # 应用入口
│   ├── package.json         # 后端依赖
│   ├── .env.example         # 后端环境配置模板
│   ├── Dockerfile           # 后端Docker配置
│   └── scripts/
│       └── init-database.sql # 数据库初始化脚本
├── vue3-project/            # 前端项目
│   ├── package.json         # 前端依赖
│   ├── Dockerfile           # 前端Docker配置
│   └── nginx.conf           # Nginx配置
├── docker-compose.yml       # Docker编排配置
├── .env.docker             # Docker环境配置模板
├── deploy.ps1              # Windows部署脚本
└── doc/
    └── DEPLOYMENT.md       # 本文档
```

## 🔧 配置说明

### 上传策略配置

项目支持三种图片上传策略：

1. **本地存储** (`UPLOAD_STRATEGY=local`)
   ```env
   LOCAL_UPLOAD_DIR=uploads
   LOCAL_BASE_URL=http://localhost:3001
   ```

2. **第三方图床** (`UPLOAD_STRATEGY=imagehost`)
   ```env
   IMAGEHOST_API_URL=https://api.xinyew.cn/api/360tc
   IMAGEHOST_TIMEOUT=60000
   ```

3. **Cloudflare R2** (`UPLOAD_STRATEGY=r2`)
   ```env
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
   R2_BUCKET_NAME=your_bucket_name
   R2_ACCOUNT_ID=your_account_id
   R2_REGION=auto
   ```

### Cloudflare R2 配置步骤

1. 登录 Cloudflare 控制台
2. 进入 R2 Object Storage
3. 创建存储桶
4. 生成 API 令牌（权限：R2:Edit）
5. 获取账户 ID
6. 配置环境变量

### 邮件功能配置

项目支持邮箱验证功能，可通过 `EMAIL_ENABLED` 开关控制：

1. **启用邮件功能** (`EMAIL_ENABLED=true`)
   - 注册时需要填写邮箱并验证
   - 需要配置SMTP服务器信息
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.qq.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@example.com
   SMTP_PASSWORD=your_email_password
   EMAIL_FROM=your_email@example.com
   EMAIL_FROM_NAME=小石榴校园图文社区
   ```

2. **禁用邮件功能** (`EMAIL_ENABLED=false`，默认)
   - 注册时不需要邮箱验证
   - 适合没有SMTP服务或不需要邮箱验证的场景
   ```env
   EMAIL_ENABLED=false
   ```

### 反向代理配置

**重要提示**：如果您使用了 Nginx、Apache 等反向代理服务器，需要修改以下配置：

#### 后端配置 (express-project/.env)

```env
# 将 API_BASE_URL 改为您的域名和端口
API_BASE_URL=https://yourdomain.com:端口号
# 或者如果使用默认端口（80/443）
API_BASE_URL=https://yourdomain.com

# CORS配置也需要修改为前端访问地址
CORS_ORIGIN=https://yourdomain.com
```

#### 前端配置 (vue3-project/.env)

```env
# 将 API 基础 URL 改为您的域名和后端端口
VITE_API_BASE_URL=https://yourdomain.com:端口号/api
# 或者如果使用默认端口（80/443）
VITE_API_BASE_URL=https://yourdomain.com/api
```

#### 配置示例

假设您的域名是 `example.com`，后端通过反向代理映射到 3001 端口：

**后端 .env：**
```env
API_BASE_URL=https://example.com
CORS_ORIGIN=https://example.com
```

**前端 .env：**
```env
VITE_API_BASE_URL=https://example.com/api
```

**Nginx 配置示例：**
```nginx
server {
    listen 80;
    server_name example.com;

    # 前端静态资源
    location / {
        root /path/to/vue3-project/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚨 故障排除

### Docker 部署问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -ano | findstr :8080
   # 修改 .env 中的端口配置
   ```

2. **容器启动失败**
   ```bash
   # 查看日志
   docker-compose logs
   # 重新构建
   docker-compose up -d --build
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库容器状态
   docker-compose ps
   # 重启数据库服务
   docker-compose restart mysql
   ```

### 传统部署问题

1. **Node.js 版本不兼容**
   ```bash
   # 检查版本
   node --version
   # 使用 nvm 切换版本
   nvm use 18
   ```

2. **数据库连接失败**
   - 检查 MySQL 服务是否启动
   - 验证数据库用户权限
   - 确认防火墙设置

3. **依赖安装失败**
   ```bash
   # 清理缓存
   npm cache clean --force
   # 删除 node_modules 重新安装
   rm -rf node_modules
   npm install
   ```

## 📝 注意事项

1. **生产环境部署**：
   - 修改默认密码和密钥
   - 配置 HTTPS
   - 设置防火墙规则
   - 定期备份数据

2. **性能优化**：
   - 使用 CDN 加速静态资源
   - 配置数据库索引
   - 启用 Gzip 压缩

3. **安全建议**：
   - 不要将 `.env` 文件提交到版本控制
   - 定期更新依赖包
   - 使用强密码策略

**祝您部署顺利！** 🎉