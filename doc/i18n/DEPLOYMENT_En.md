# XiaoShiLiu Image & Text Community Deployment Guide

## System Requirements

- **Docker Deployment**: Docker 20.10+, Docker Compose 2.0+
- **Traditional Deployment**: Node.js 18+, MySQL 5.7+, npm or yarn

> 💡 For BT-Panel deployment, refer to: [Complete Tutorial for Deploying the XiaoShiLiu Image & Text Community with BT-Panel](https://www.sakuraidc.cc/forum-post/3116.html)

---

## 🐋 Docker One-Click Deployment (Recommended)

### 1. Clone the Project

```bash
git clone https://github.com/ZTMYO/XiaoShiLiu
cd XiaoShiLiu
```

### 2. Configure Environment Variables

Docker deployment only uses the single `.env` in the root directory; there is no need to modify `express-project/.env` or `vue3-project/.env`:

```bash
cp .env.docker .env
```

Key items that must be checked for a real-machine deployment:

```env
# ① Database password
DB_PASSWORD=123456

# ② JWT secret
JWT_SECRET=xiaoshiliu_secret_key_2025_docker

# ③ Public image access address (update it at the same time when switching to a domain/server IP, otherwise images will break)
LOCAL_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001

# ④ Enable and fill in SMTP when email verification is required (disabled by default)
EMAIL_ENABLED=false
```

> See [.env.docker](../../.env.docker) for all variables and comments.
> The host ports are fixed at 8080 (frontend), 3001 (backend), and 3307 (database). To adjust them, modify the `ports` section of [docker-compose.yml](../../docker-compose.yml) rather than `.env`.

### 3. Start the Services

On Windows, using the PowerShell script is recommended:

```powershell
.\deploy.ps1            # Start
.\deploy.ps1 -Build     # Rebuild and start
.\deploy.ps1 -Seed      # Start and seed sample data
.\deploy.ps1 -Help      # View help
```

On other platforms, use Docker Compose:

```bash
docker-compose up -d
docker-compose up -d --build   # Rebuild and start
```

> Before starting on a server for the first time, you can first run `docker compose config` to verify that the orchestration configuration is valid.

### 4. Access the Application

| Service | Address |
|---|---|
| Frontend UI | http://localhost:8080 |
| Backend API | http://localhost:3001 |
| Database | localhost:3307 |

After deploying to a server, replace `localhost` with the public IP or domain to access it. Database port 3307 should **not** be exposed to the public internet; allowing only local/intranet access is safer.

### 5. Common Commands

```powershell
.\deploy.ps1 -Status    # Check service status
.\deploy.ps1 -Logs      # View logs
.\deploy.ps1 -Stop      # Stop services
.\deploy.ps1 -Clean     # Clean up all data (use with caution)
```

---

## 🛠️ Traditional Deployment

### 1. Prerequisites

Make sure Node.js 18+, MySQL 5.7+, and Git are installed.

### 2. Backend Configuration

```bash
cd express-project
cp .env.example .env
npm install
```

Edit `.env`; the following four items must be confirmed:

```env
DB_PASSWORD=123456                      # Database password
JWT_SECRET=xiaoshiliu_secret_key_2025   # JWT secret, be sure to change it in production
API_BASE_URL=http://localhost:3001      # Backend public access address
CORS_ORIGIN=http://localhost:5173       # Frontend address allowed for CORS
```

The remaining variables (upload strategy, email, IP location, sensitive word detection, etc.) can keep their defaults. For the complete list of variables and comments, see [.env.example](../../express-project/.env.example), and for the meaning of each item, see "Configuration" below.

Initialize the database and start the service:

```bash
npm run init-db        # Create the database and tables
npm run generate-data  # Generate sample data (optional)
npm start              # Start the service, default http://localhost:3001
```

> The database-related scripts are all under `express-project/scripts/`: `init-database.js` (create the database and tables), `init-database.sql` (pure SQL version, which can be executed directly in a MySQL client), `generate-data.js` (generate sample data), `update-sample-images.js` (refresh sample image links).

### 3. Frontend Configuration

```bash
cd vue3-project
cp .env.example .env
npm install
npm run dev            # Development mode, default http://localhost:5173
```

Build and preview in production mode:

```bash
npm run build          # Build to dist/
npm run preview        # Local preview, default http://localhost:4173
```

The frontend `.env` points to `http://localhost:3001/api` by default; when the backend port is changed, `VITE_API_BASE_URL` must be updated accordingly.

### 4. Access the Application

| Service | Address |
|---|---|
| Frontend (development mode) | http://localhost:5173 |
| Frontend (production preview) | http://localhost:4173 |
| Backend API | http://localhost:3001 |

---

## 🔧 Configuration

### Upload Configuration

The image upload strategy is selected by `IMAGE_UPLOAD_STRATEGY`, and there are four in total:

| Strategy | Value | Description | Variables to Configure |
|---|---|---|---|
| Local storage | `local` | Stored on the server disk | `LOCAL_UPLOAD_DIR`, `LOCAL_BASE_URL` |
| Third-party image hosting | `imagehost` | Uploaded to third-party image hosting (default) | `IMAGEHOST_API_URL`, `IMAGEHOST_TIMEOUT` |
| Cloudflare R2 | `r2` | Stored in an R2 bucket | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_REGION` |
| Alibaba Cloud OSS | `aliyun` | Stored in an OSS bucket | `OSS_REGION`, `OSS_BUCKET_NAME`, `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET`, `OSS_IMAGE_PREFIX` |

The video upload strategy is selected by `VIDEO_UPLOAD_STRATEGY`, which supports only `local` and `r2`. The file size limits are controlled by `IMAGE_MAX_SIZE` (default 10mb) and `VIDEO_MAX_SIZE` (default 100mb).

> When using the `local` strategy, `LOCAL_BASE_URL` must be an address that the browser can reach, otherwise images will break.

### Cloudflare R2 Configuration

1. Log in to the Cloudflare console and go to R2 Object Storage
2. Create a bucket
3. Generate an API token and select R2:Edit as the permission
4. Obtain the account ID
5. Fill `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_REGION=auto` into `.env`
6. After binding a custom domain, you can optionally set `R2_PUBLIC_URL`; if left empty, the default R2 domain is used

### Alibaba Cloud OSS Configuration

1. Log in to the Alibaba Cloud console and go to Object Storage Service (OSS)
2. Create a bucket (`oss-cn-hongkong` is recommended; set the read/write permission as needed)
3. Create a RAM sub-account and generate an AccessKey, granting it read/write permission for that bucket only
4. Fill `OSS_REGION`, `OSS_BUCKET_NAME`, `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET` into `.env`
5. After binding a custom domain or CDN, you can optionally set `OSS_PUBLIC_URL`; `OSS_IMAGE_PREFIX` is used to isolate images by environment or purpose, and defaults to `images/`

### Email Configuration

`EMAIL_ENABLED` controls whether registration requires email verification:

- `false` (default): registration does not require email verification, and no SMTP configuration is needed
- `true`: registration requires filling in an email and verifying it, and `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `EMAIL_FROM_NAME` must be configured at the same time

### IP Location Query Configuration

```env
# Primary API URL
IP_LOCATION_PRIMARY_API=https://api.pearktrue.cn/api/ip/details
# Primary API timeout (milliseconds)
IP_LOCATION_PRIMARY_TIMEOUT=10000
# Backup API URL
IP_LOCATION_BACKUP_API=https://api.pearktrue.cn/api/ip/high
# Backup API timeout (milliseconds)
IP_LOCATION_BACKUP_TIMEOUT=5000
```

The system automatically switches to the backup API when the primary API fails; the timeout can be adjusted according to network conditions.

### Sensitive Word Detection Configuration

`SENSITIVE_WORD_CHECK_ENABLED` controls the switch:

```env
# Whether to enable scheduled sensitive word detection
SENSITIVE_WORD_CHECK_ENABLED=false
# Whitelisted user IDs; whitelisted users are excluded from detection, separate multiple IDs with English commas (leave empty to disable the whitelist)
SENSITIVE_WORD_CHECK_WHITELIST=
```

- The detection method is keyword matching; the word list is located at `express-project/scripts/违规词库.txt`, with one word per line
- Detection scope: XiaoShiLiu ID, user nickname, personal bio, tag names, post titles and content, comments
- On a match, the content is directly replaced with "违规昵称", "违规内容", "违规标题", "违规评论", "违规标签", and no notification is sent
- User IDs in `SENSITIVE_WORD_CHECK_WHITELIST` are excluded from detection
- The detection interval is 24 hours; it is not executed immediately when the backend starts, and no task is registered when it is not enabled

To run detection once immediately, you can execute it manually (also controlled by the switch, and skipped directly when not enabled):

```bash
cd express-project
node scripts/local-sensitive-word-check.js
```

### Reverse Proxy Configuration

When the site is behind a reverse proxy such as Nginx (binding a domain / HTTPS), modify it according to the deployment method.

**Docker Deployment**: The frontend image has nginx built in and already reverse-proxies `/api` to the backend container. The outer Nginx only needs to forward `/api` to the mapped backend port on the host:

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

For same-origin deployment, browser requests use the relative path `/api`, so **no CORS** is needed; configuration is required only when the frontend domain differs from the backend domain:

```env
CORS_ORIGIN=https://yourdomain.com
```

When using local image storage, be sure to change the public access address to the real domain:

```env
LOCAL_BASE_URL=https://yourdomain.com
API_BASE_URL=https://yourdomain.com
```

**Traditional Deployment**: You need to modify the two `.env` files separately (after changing the frontend, you must re-run `npm run build`):

```env
# express-project/.env
API_BASE_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# vue3-project/.env
VITE_API_BASE_URL=https://yourdomain.com/api
```

A complete Nginx site configuration example (using `example.com` as an example):

```nginx
server {
    listen 80;
    server_name example.com;

    # Frontend static resources
    location / {
        root /path/to/vue3-project/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
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

## 🚨 Troubleshooting

### Docker Deployment Issues

| Issue | Troubleshooting |
|---|---|
| Port conflict | Use `netstat -ano \| findstr :8080` to check the usage; modify the port mapping in the `ports` section of docker-compose.yml, then run `docker compose up -d` again |
| Container fails to start | Use `docker-compose logs` to view the logs, and `docker-compose up -d --build` to rebuild |
| Database connection failure | Use `docker-compose ps` to check the container status, and `docker-compose restart mysql` to restart the database |

### Traditional Deployment Issues

| Issue | Troubleshooting |
|---|---|
| Node.js version incompatible | Use `node --version` to confirm that the version is not lower than 18, and switch with nvm: `nvm use 18` |
| Database connection failure | Check whether MySQL is started, the database user permissions, and the firewall settings |
| Dependency installation failure | Run `npm cache clean --force`, delete `node_modules`, and then run `npm install` again |

---

## 📝 Notes

- **Production environment**: Change the default database password and `JWT_SECRET`, configure HTTPS, set firewall rules, and back up data regularly
- **Do not** commit the `.env` file to version control
- It is recommended to use a CDN to accelerate static resources and to update dependencies regularly

**Wishing you a smooth deployment!** 🎉
