# 部署指南

## 系统要求

- **Docker 部署**：Docker 20.10+、Docker Compose 2.0+
- **传统部署**：Node.js 18+、MySQL 5.7+、npm 或 yarn

> 💡 使用宝塔面板部署可参考：[使用宝塔搭建小石榴图文社区完整教程](https://www.sakuraidc.cc/forum-post/3116.html)

---

## Docker 一键部署（推荐）

### 1. 克隆项目

```bash
git clone https://github.com/ZTMYO/XiaoShiLiu
cd XiaoShiLiu
```

### 2. 配置环境变量

Docker 部署只用根目录这一份 `.env`，无需再改 `express-project/.env` 和 `vue3-project/.env`：

```bash
cp .env.docker .env
```

真机部署必须检查的关键项：

```env
# ① 数据库密码
DB_PASSWORD=123456

# ② JWT 密钥
JWT_SECRET=xiaoshiliu_secret_key_2025_docker

# ③ 图片对外访问地址（改用域名/服务器 IP 时同步修改，否则图片裂图）
LOCAL_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001

# ④ 需要邮箱验证时开启并填写 SMTP（默认关闭）
EMAIL_ENABLED=false
```

> 全部变量及注释见 [.env.docker](../.env.docker)。
> 宿主机端口固定为 8080（前端）、3001（后端）、3307（数据库），需要调整请改 [docker-compose.yml](../docker-compose.yml) 的 `ports` 段，而不是改 `.env`。

### 3. 启动服务

Windows 推荐使用 PowerShell 脚本：

```powershell
.\deploy.ps1            # 启动
.\deploy.ps1 -Build     # 重新构建并启动
.\deploy.ps1 -Seed      # 启动并灌装示例数据
.\deploy.ps1 -Help      # 查看帮助
```

其他平台使用 Docker Compose：

```bash
docker compose up -d
docker compose up -d --build   # 重新构建并启动
```

> 首次在服务器启动前，可先运行 `docker compose config` 校验编排配置是否合法。

### 4. 访问应用

| 服务 | 地址 |
|---|---|
| 前端界面 | http://localhost:8080 |
| 后端 API | http://localhost:3001 |
| 数据库 | localhost:3307 |

部署到服务器后，把 `localhost` 换成公网 IP 或域名即可访问。数据库端口 3307 **不要**对公网开放，仅允许本机/内网访问更安全。

### 5. 常用命令

```powershell
.\deploy.ps1 -Status    # 查看服务状态
.\deploy.ps1 -Logs      # 查看日志
.\deploy.ps1 -Stop      # 停止服务
.\deploy.ps1 -Clean     # 清理所有数据（谨慎使用）
```

---

## 传统部署

### 1. 环境准备

确保已安装 Node.js 18+、MySQL 5.7+、Git。

### 2. 后端配置

```bash
cd express-project
cp .env.example .env
npm install
```

编辑 `.env`，以下四项必须确认：

```env
DB_PASSWORD=123456                      # 数据库密码
JWT_SECRET=xiaoshiliu_secret_key_2025   # JWT 密钥，生产环境务必更换
API_BASE_URL=http://localhost:3001      # 后端对外访问地址
CORS_ORIGIN=http://localhost:5173       # 允许跨域的前端地址
```

其余变量（上传策略、邮件、IP 属地、违规词检测等）保持默认即可，变量的完整列表和注释见 [.env.example](../express-project/.env.example)，各项含义见下方「配置说明」。

初始化数据库并启动服务：

```bash
npm run init-db        # 建库建表
npm run generate-data  # 生成示例数据（可选）
npm start              # 启动服务，默认 http://localhost:3001
```

> 数据库相关脚本都在 `express-project/scripts/` 下：`init-database.js`（建库建表）、`init-database.sql`（纯 SQL 版，可直接在 MySQL 客户端执行）、`generate-data.js`（生成示例数据）、`update-sample-images.js`（刷新示例图链接）。

### 3. 前端配置

```bash
cd vue3-project
cp .env.example .env
npm install
npm run dev            # 开发模式，默认 http://localhost:5173
```

生产模式构建与预览：

```bash
npm run build          # 构建到 dist/
npm run preview        # 本地预览，默认 http://localhost:4173
```

前端 `.env` 默认指向 `http://localhost:3001/api`，后端改端口时需同步修改 `VITE_API_BASE_URL`。

### 4. 访问应用

| 服务 | 地址 |
|---|---|
| 前端（开发模式） | http://localhost:5173 |
| 前端（生产预览） | http://localhost:4173 |
| 后端 API | http://localhost:3001 |

---

## 配置说明

### 上传配置

图片上传策略由 `IMAGE_UPLOAD_STRATEGY` 选择，共四种：

| 策略 | 取值 | 说明 | 需要配置的变量 |
|---|---|---|---|
| 本地存储 | `local` | 存到服务器磁盘 | `IMAGE_LOCAL_UPLOAD_DIR`、`VIDEO_LOCAL_UPLOAD_DIR` |
| 第三方图床 | `imagehost` | 上传到第三方图床（默认） | `IMAGEHOST_API_URL`、`IMAGEHOST_TIMEOUT` |
| Cloudflare R2 | `r2` | 存到 R2 存储桶 | `R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_ENDPOINT`、`R2_BUCKET_NAME`、`R2_ACCOUNT_ID`、`R2_REGION` |
| 阿里云 OSS | `aliyun` | 存到 OSS 存储桶 | `OSS_REGION`、`OSS_BUCKET_NAME`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`、`OSS_IMAGE_PREFIX` |

视频上传策略由 `VIDEO_UPLOAD_STRATEGY` 选择，支持 `local`、`r2` 和 `aliyun`（`aliyun` 复用图片的 OSS 变量，可用 `OSS_VIDEO_PREFIX` 指定视频目录前缀，默认 `videos/`）。文件大小上限由 `IMAGE_MAX_SIZE`（默认 10mb）和 `VIDEO_MAX_SIZE`（默认 100mb）控制。

> 使用 `local` 策略时，图片以 `/api/files/images/*` 相对路径返回，由前端同域访问，无需额外配置对外地址。

### Cloudflare R2 配置

1. 登录 Cloudflare 控制台，进入 R2 Object Storage
2. 创建存储桶
3. 生成 API 令牌，权限选择 R2:Edit
4. 获取账户 ID
5. 将 `R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_ENDPOINT`、`R2_BUCKET_NAME`、`R2_ACCOUNT_ID`、`R2_REGION=auto` 填入 `.env`
6. 绑定自定义域名后可另行设置 `R2_PUBLIC_URL`，留空则使用 R2 默认域名

### 阿里云 OSS 配置

1. 登录阿里云控制台，进入对象存储 OSS
2. 创建 Bucket（推荐使用 `oss-cn-hongkong`，读写权限按需设置）
3. 创建 RAM 子账号并生成 AccessKey，只授予该 Bucket 的读写权限
4. 将 `OSS_REGION`、`OSS_BUCKET_NAME`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET` 填入 `.env`
5. 绑定自定义域名或 CDN 后可另行设置 `OSS_PUBLIC_URL`；`OSS_IMAGE_PREFIX` 与 `OSS_VIDEO_PREFIX` 分别用于按环境或用途隔离图片与视频，默认 `images/`、`videos/`

### 邮件功能配置

`EMAIL_ENABLED` 控制注册是否需要邮箱验证：

- `false`（默认）：注册不需要邮箱验证，无需配置 SMTP
- `true`：注册需填写邮箱并验证，需同时配置 `SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASSWORD`、`EMAIL_FROM`、`EMAIL_FROM_NAME`

### IP属地查询配置

```env
# 主API地址
IP_LOCATION_PRIMARY_API=https://api.pearktrue.cn/api/ip/details
# 主API超时时间（毫秒）
IP_LOCATION_PRIMARY_TIMEOUT=10000
# 备用API地址
IP_LOCATION_BACKUP_API=https://api.pearktrue.cn/api/ip/high
# 备用API超时时间（毫秒）
IP_LOCATION_BACKUP_TIMEOUT=5000
```

系统会在主 API 失败时自动切换到备用 API，超时时间可根据网络情况调整。

### 违规词检测配置

`SENSITIVE_WORD_CHECK_ENABLED` 控制开关：

```env
# 是否启用定时违规词检测
SENSITIVE_WORD_CHECK_ENABLED=false
# 白名单用户ID，名单内用户不参与检测，多个用英文逗号分隔（留空表示不启用白名单）
SENSITIVE_WORD_CHECK_WHITELIST=
```

- 检测方式为关键词匹配，词库位于 `express-project/scripts/违规词库.txt`，每行一个词
- 检测范围：小石榴号、用户昵称、个人简介、标签名、帖子标题与内容、评论
- 命中后直接替换为"违规昵称""违规内容""违规标题""违规评论""违规标签"，不发送通知
- `SENSITIVE_WORD_CHECK_WHITELIST` 中的用户 ID 不参与检测
- 检测间隔为 24 小时，后端启动时先执行一次，之后按间隔执行；未启用时不会注册任务

需要立即检测一次时，可手动执行（同样受开关控制，未启用会直接跳过）：

```bash
cd express-project
node scripts/local-sensitive-word-check.js
```

### 反向代理配置

站点挂在 Nginx 等反向代理后面（绑定域名 / HTTPS）时，按部署方式修改。

**Docker 部署**：前端镜像内置 nginx，已把 `/api` 反代到后端容器，外层 Nginx 只需把 `/api` 转发到宿主机上后端的映射端口：

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

同源部署时浏览器请求走相对路径 `/api`，**不需要 CORS**；仅当前端域名与后端域名不一致时才需配置：

```env
CORS_ORIGIN=https://yourdomain.com
```

使用本地存储图片时，务必把对外访问地址改成真实域名：

```env
LOCAL_BASE_URL=https://yourdomain.com
API_BASE_URL=https://yourdomain.com
```

**传统部署**：需要分别修改两份 `.env`（前端改完需重新执行 `npm run build`）：

```env
# express-project/.env
API_BASE_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# vue3-project/.env
VITE_API_BASE_URL=https://yourdomain.com/api
```

完整的 Nginx 站点配置示例（以 `example.com` 为例）：

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

---

## 故障排除

### Docker 部署问题

| 问题 | 排查方式 |
|---|---|
| 端口冲突 | `netstat -ano \| findstr :8080` 查看占用；端口映射在 docker-compose.yml 的 `ports` 段修改，改完重新 `docker compose up -d` |
| 容器启动失败 | `docker compose logs` 查看日志，`docker compose up -d --build` 重新构建 |
| 数据库连接失败 | `docker compose ps` 查看容器状态，`docker compose restart mysql` 重启数据库 |

### 传统部署问题

| 问题 | 排查方式 |
|---|---|
| Node.js 版本不兼容 | `node --version` 确认版本不低于 18，用 nvm 切换：`nvm use 18` |
| 数据库连接失败 | 检查 MySQL 是否启动、数据库用户权限、防火墙设置 |
| 依赖安装失败 | `npm cache clean --force`，删除 `node_modules` 后重新 `npm install` |

---

## 注意事项

- **生产环境**：更换默认数据库密码与 `JWT_SECRET`，配置 HTTPS，设置防火墙规则，定期备份数据
- **不要**将 `.env` 文件提交到版本控制
- 建议使用 CDN 加速静态资源，并定期更新依赖包

**祝您部署顺利！** 🎉
