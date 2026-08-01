# 部署指南

本文件提供 XiaoShiLiu 圖文社區項目的部署流程及配置說明。

## 部署方法

項目支援兩種部署方法：

1. **Docker 一鍵部署**（推薦）- 簡單快捷，適合生產環境
2. **傳統部署** - 手動配置，適合開發環境

> 💡 **寶塔面板部署**：如果您使用寶塔面板，可以參考這個詳細的圖文教程：[使用寶塔搭建小石榴圖文社區完整教程](https://www.sakuraidc.cc/forum-post/3116.html)

---

## 🐳 Docker 一鍵部署（推薦）

### 環境需求

- Docker >= 20.0
- Docker Compose >= 2.0
- 可用記憶體 >= 2GB
- 可用磁碟空間 >= 5GB

### 圖像和版本說明

| 部件 | 圖像/來源 | 版本/標籤 | 說明 |
|------|-----------|-------------|-------------|
| 數據庫 | mysql | 5.7 | 使用官方圖像 `mysql:5.7`，默認配置為 utf8mb4 |
| 後端運行時 | node | 18-alpine | `express-project/Dockerfile` 使用 `node:18-alpine` |
| 前端編譯 | node | 18-alpine | `vue3-project/Dockerfile` 在編譯階段使用此圖像 |
| 前端運行時 | nginx | alpine | 使用 `nginx:alpine` 提供靜態文件 |
| Compose 健康檢查 | wget | - | 前端健康檢查使用 `wget --spider http://localhost/` |

> 記錄：上述版本與 `docker-compose.yml` 及前端和後端 `Dockerfile` 的版本一致；如需進行修改，請同步調整相關文件和文件說明。
### 快速啟動

#### 1. 克隆項目

```bash
git clone https://github.com/ZTMYO/XiaoShiLiu.git
cd XiaoShiLiu
```

#### 2. 配置環境變數

複製環境配置文件：
```bash
cp .env.docker .env
```

編輯 `.env` 文件，根據需要修改配置：

```env
# 資料庫配置
DB_HOST=mysql
DB_USER=xiaoshiliu_user
DB_PASSWORD=123456
DB_NAME=xiaoshiliu
DB_PORT=3306

# JWT配置
JWT_SECRET=xiaoshiliu_secret_key_2025_docker
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# 上傳配置
# 單張圖片最大文件大小
IMAGE_MAX_SIZE=10mb
# 上傳配置
# 單張圖片最大文件大小
IMAGE_MAX_SIZE=10mb
# 單個視頻最大文件大小
VIDEO_MAX_SIZE=100mb
# 圖片上傳策略 (local: 本地儲存, imagehost: 第三方圖床, r2: Cloudflare R2)
IMAGE_UPLOAD_STRATEGY=imagehost
# 視頻上傳策略 (local: 本地儲存, r2: Cloudflare R2)
VIDEO_UPLOAD_STRATEGY=local

# 本地儲存配置
LOCAL_UPLOAD_DIR=uploads
LOCAL_BASE_URL=http://localhost:3001
VIDEO_UPLOAD_DIR=uploads/videos
VIDEO_COVER_DIR=uploads/covers

# 第三方圖床配置（當IMAGE_UPLOAD_STRATEGY=imagehost時使用）
IMAGEHOST_API_URL=https://api.xinyew.cn/api/360tc
IMAGEHOST_TIMEOUT=60000

# Cloudflare R2 配置（當IMAGE_UPLOAD_STRATEGY=r2或VIDEO_UPLOAD_STRATEGY=r2時使用）
# 如需使用R2儲存，請取消註釋並填入真實配置
# R2_ACCESS_KEY_ID=your_r2_access_key_id_here
# R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
# R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
# R2_BUCKET_NAME=your_bucket_name_here
# R2_ACCOUNT_ID=your_account_id_here
# R2_REGION=auto
# R2_PUBLIC_URL=https://your-custom-domain.com

# API配置
API_BASE_URL=http://localhost:3001

# 郵件服務配置
# 是否啟用郵件功能 (true/false)，預設不啟用
EMAIL_ENABLED=false
# SMTP伺服器地址
SMTP_HOST=smtp.qq.com
# SMTP伺服器端口
SMTP_PORT=465
# 是否使用SSL/TLS (true/false)
SMTP_SECURE=true
# 郵箱賬號
SMTP_USER=your_email@example.com
# 郵箱密碼/授權碼
SMTP_PASSWORD=your_email_password
# 發件人郵箱
EMAIL_FROM=your_email@example.com
# 發件人名稱
EMAIL_FROM_NAME=小石榴校園圖文社區

# IP屬地查詢配置
# 主API地址
IP_LOCATION_PRIMARY_API=https://api.pearktrue.cn/api/ip/details
# 主API超時時間（毫秒）
IP_LOCATION_PRIMARY_TIMEOUT=10000
# 備用API地址
IP_LOCATION_BACKUP_API=https://api.pearktrue.cn/api/ip/high
# 備用API超時時間（毫秒）
IP_LOCATION_BACKUP_TIMEOUT=5000

# 日誌配置
LOG_ENABLED=false
LOG_DIR=logs

# 前端構建配置
VITE_API_BASE_URL=http://localhost:3001/api

# 服務端口配置
FRONTEND_PORT=80
BACKEND_PORT=3001
DB_PORT_EXTERNAL=3306

# 生產環境標識
NODE_ENV=production
```

#### 3. 一鍵啟動

**Windows 用戶：**

```powershell
#啟動服務
.\deploy.ps1

# 重新編譯並啟動
.\deploy.ps1 -Build

# 啟動並種植範例數據（選擇性）
.\deploy.ps1 -Build -Seed
# 或者服務啟動後分別種植數據
.\deploy.ps1 -Seed

# 檢查服務狀態
.\deploy.ps1 -Status

# 檢視日誌
.\deploy.ps1 -Logs

# 停止服務
.\deploy.ps1 -Stop
```

**Linux/macOS 用戶：**

```bash
# 賦予腳本執行權限
chmod +x deploy.sh

# 啟動服務
./deploy.sh

# 重新編譯並啟動
./deploy.sh --build

# 檢查服務狀態
./deploy.sh --status

# 檢視日誌
./deploy.sh --logs

# 停止服務
./deploy.sh --stop
```

#### 4. 存取應用程序

服務成功啟動後，您可以通过以下地址存取應用程序：

| 服務 | 地址 | 說明 |
|------|------|------|
| 前端介面 | http://localhost:8080 | 主要存取入口 |
| 後端 API | http://localhost:3001 | API 服務 |
| 數據庫 | localhost:3307 | MySQL 數據庫 |

### Docker 部署架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端          │    │    後端          │    │     MySQL       │
│   (Nginx)       │◄───┤   (Express)     │◄───┤   (資料庫)      │
│   網路通訊埠: 80 │    │   網路通訊埠: 3001│    │   網路通訊埠: 3306│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 環境變數配置

此專案使用 `.env` 文件進行配置，為前端和後端提供分離的環境配置：

#### 後端環境變數 (.env)

```env
# 伺服器配置
PORT=3001
NODE_ENV=development

# JWT 配置
JWT_SECRET=xiaoshiliu_secret_key_2025
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# 資料庫配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=xiaoshiliu
DB_PORT=3306

# 上傳配置
# 單張圖片最大文件大小
IMAGE_MAX_SIZE=10mb
# 單個視頻最大文件大小
VIDEO_MAX_SIZE=100mb
# 圖片上傳策略 (local: 本地儲存空間, imagehost: 第三方圖片伺服，r2: Cloudflare R2 儲存空間)
IMAGE_UPLOAD_STRATEGY=imagehost
# 視頻上傳策略 (local: 本地儲存空間, r2: Cloudflare R2 儲存空間)
VIDEO_UPLOAD_STRATEGY=local

# 本地儲存空間配置
LOCAL_UPLOAD_DIR=uploads
LOCAL_BASE_URL=http://localhost:3001
VIDEO_UPLOAD_DIR=uploads/videos
VIDEO_COVER_DIR=uploads/covers

# 第三方圖片伺服配置
IMAGEHOST_API_URL=https://api.xinyew.cn/api/360tc
IMAGEHOST_TIMEOUT=60000

# Cloudflare R2 儲存空間配置
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your_bucket_name
R2_ACCOUNT_ID=your_account_id
R2_REGION=auto
# 選擇性：自定義域名 URL (如果已配置自定義域名)
R2_PUBLIC_URL=https://your-custom-domain.com
# 上傳策略：local (本地儲存空間), imagehost (第三方圖片伺服), 或 r2 (Cloudflare R2 儲存空間)
IMAGE_UPLOAD_STRATEGY=imagehost
# 視頻上傳策略 (local: 本地存儲, r2: Cloudflare R2 存儲)
VIDEO_UPLOAD_STRATEGY=local

# 本地儲存空間配置
LOCAL_UPLOAD_DIR=uploads
LOCAL_BASE_URL=http://localhost:3001

# 第三方圖片伺服配置
IMAGEHOST_API_URL=https://api.xinyew.cn/api/360tc
IMAGEHOST_TIMEOUT=60000

# API 配置
API_BASE_URL=http://localhost:3001

# CORS 配置
CORS_ORIGIN=http://localhost:5173

# 郵件服務配置
# 是否啟用郵件功能 (true/false)
# 設置為false時，註冊不需要郵箱驗證，適合沒有SMTP服務的用戶
EMAIL_ENABLED=true
# SMTP服務器地址
SMTP_HOST=smtp.qq.com
# SMTP服務器端口
SMTP_PORT=465
# 是否使用SSL/TLS (true/false)
SMTP_SECURE=true
# 郵箱賬號
SMTP_USER=your_email@example.com
# 郵箱密碼/授權碼
SMTP_PASSWORD=your_email_password
# 發件人郵箱
EMAIL_FROM=your_email@example.com
# 發件人名稱
EMAIL_FROM_NAME=小石榴校園圖文社區
```

#### 前端環境變數 (.env)

```env
# API 基底 URL 配置
VITE_API_BASE_URL=http://localhost:3001/api

# 使用真實 API
VITE_USE_REAL_API=true

# 應用程式標題
VITE_APP_TITLE=Small Pear Graphic Community
```

#### Docker 環境變數說明

當使用 Docker 部署時，環境變數通過 `docker-compose.yml` 配置：

```env
# 資料庫配置 (Docker 環境)
DB_HOST=mysql
DB_USER=小石麗珠_user
DB_PASSWORD=123456
DB_NAME=小石麗珠

# JWT 配置
JWT_SECRET=小石麗珠_secret_key_2025_docker
JWT_EXPIRES_IN=7d

# 上傳配置
# 單張圖片最大文件大小
IMAGE_MAX_SIZE=10mb
# 單個視頻最大文件大小
VIDEO_MAX_SIZE=100mb
# 圖片上傳策略 (local: 本地存儲, imagehost: 第三方圖片存儲, r2: Cloudflare R2 存儲)
IMAGE_UPLOAD_STRATEGY=imagehost
# 視頻上傳策略 (local: 本地存儲, r2: Cloudflare R2 存儲)
VIDEO_UPLOAD_STRATEGY=local

# API 配置
API_BASE_URL=http://localhost:3001
```

### 常見命令

```bash
# 檢查服務狀態
docker-compose ps

# 查看服務日誌
docker-compose logs -f

# 重啟特定服務
docker-compose restart backend

# 遷入容器 (使用 sh 為了因為 alpine 鏡像通常沒有 bash)
docker-compose exec backend sh
# 或遷入 MySQL 客戶端
docker-compose exec mysql mysql -u root -p

# 備份資料庫
docker-compose exec mysql mysqldump -u root -p 小石麗珠 > backup.sql

# 恢復資料庫
docker-compose exec -T mysql mysql -u root -p 小石麗珠 < backup.sql
```

### 資料持久化

Docker 使用卷來在部署中進行資料持久化：

- `mysql_data`: MySQL 資料庫文件
- `backend_uploads`: 後端上傳文件

### 故障排除

#### 1. 頻道衝突

如果發生頻道衝突，您可以修改 `docker-compose.yml` 文件中的端口映射：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 修改前端端口
  backend:
    ports:
      - "3002:3001"  # 修改後端端口
```

#### 2. 變動不夠

請確保系統有足夠的記憶體，您可以使用以下命令查看資源使用情況：

```bash
docker stats
```

#### 3. 資料庫連接失敗 / 載入數據

- 檢查資料庫服務是否正常啟動：

```bash
docker-compose logs mysql
```

- 載入範例數據 (Windows):
```powershell
.\deploy.ps1 -Seed
```

- 手動執行載入範例數據：
```bash
docker-compose exec -T backend node scripts/generate-data.js
```

#### 4. 文件上傳權限問題

**問題現象**:
- 從前端上傳文件時，返回 400 錯誤
- 後端日誌顯示: `EACCES: permission denied, open '/app/uploads/xxx.png'`

**原因分析**:
Docker 容器上傳目錄的權限問題。目錄屬於 root 用戶，但應用程式在 nodejs 用戶下運行。

**解決方案**:

1. **檢查上傳目錄的權限**:
```bash
docker-compose exec backend ls -la /app/uploads
```

2. **修復權限問題**:
```bash
# 使用 root 用戶修改目錄所有權限
docker-compose exec --user root backend chown -R nodejs:nodejs /app/uploads
```

3. **確認權限修復**:
```bash
# 確認目錄現在屬於 nodejs 用戶
docker-compose exec backend ls -la /app/uploads
```

**預防措施**:
- 確保 Dockerfile 中上傳目錄的權限設定正確
- 在容器啟動時自動修復權限問題

#### 5. 上傳策略配置

此專案支援三種檔案上傳策略：

**本地儲存模式**（推薦用於開發和小型部署）:
```yaml
# 設定於 docker-compose.yml
環境變數:
  IMAGE_UPLOAD_STRATEGY: local
  VIDEO_UPLOAD_STRATEGY: local
```

**第三方圖片伺服器模式**（推薦用於生產環境）:
```yaml
# 設定於 docker-compose.yml
環境變數:
  IMAGE_UPLOAD_STRATEGY: imagehost
  VIDEO_UPLOAD_STRATEGY: local
```

**Cloudflare R2 儲存模式**（推薦用於生產環境，支援 CDN 加速）:

```yaml
# 設定於 docker-compose.yml
環境變數:
  IMAGE_UPLOAD_STRATEGY: r2
  VIDEO_UPLOAD_STRATEGY: r2
  R2_ACCESS_KEY_ID: your_r2_access_key_id
  R2_SECRET_ACCESS_KEY: your_r2_secret_access_key
  R2_ENDPOINT: https://your_account_id.r2.cloudflarestorage.com
  R2_BUCKET_NAME: your_bucket_name
  R2_ACCOUNT_ID: your_account_id
  R2_REGION: auto
  # 可選：自定義域名
  R2_PUBLIC_URL: https://your-custom-domain.com
```

> **注意**：要使用 Cloudflare R2 儲存，您需要先在 Cloudflare 控制台中創建 R2 桶和獲取相對應的存取金鑰。

#### 6. 郵件功能配置

專案支援郵箱驗證功能，可通過 `EMAIL_ENABLED` 開關控制：

1. **啟用郵件功能** (`EMAIL_ENABLED=true`)
   - 註冊時需要填寫郵箱並驗證
   - 需要配置SMTP服務器信息
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.qq.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@example.com
   SMTP_PASSWORD=your_email_password
   EMAIL_FROM=your_email@example.com
   EMAIL_FROM_NAME=小石榴校園圖文社區
   ```

2. **禁用郵件功能** (`EMAIL_ENABLED=false`，預設)
   - 註冊時不需要郵箱驗證
   - 適合沒有SMTP服務或不需要郵箱驗證的場景
   ```env
   EMAIL_ENABLED=false
   ```

#### 7. 日誌配置

專案支援請求日誌記錄功能，可配置以下參數：

```env
# 是否啟用請求日誌 (true/false)
LOG_ENABLED=false
# 日誌文件保存目錄
LOG_DIR=logs
```

**說明**：
- 日誌文件保存為 `logs/request.log`
- 每行一條 JSON 格式日誌記錄
- 記錄欄位：`timestamp`（請求時間）、`method`（HTTP方法）、`url`（請求URL）、`ip`（客戶端IP）、`statusCode`（狀態碼）、`responseTime`（響應時間）

#### 8. 反向代理配置

**重要提示**：如果您使用了 Nginx、Apache 等反向代理服務器，需要修改以下配置：

**後端配置 (express-project/.env)**

```env
# 將 API_BASE_URL 改為您的域名和端口
API_BASE_URL=https://yourdomain.com:端口號
# 或者如果使用默認端口（80/443）
API_BASE_URL=https://yourdomain.com

# CORS配置也需要修改為前端訪問地址
CORS_ORIGIN=https://yourdomain.com
```

**前端配置 (vue3-project/.env)**

```env
# 將 API 基礎 URL 改為您的域名和後端端口
VITE_API_BASE_URL=https://yourdomain.com:端口號/api
# 或者如果使用默認端口（80/443）
VITE_API_BASE_URL=https://yourdomain.com/api
```

**配置示例**

假設您的域名是 `example.com`，後端通過反向代理映射到 3001 端口：

**後端 .env：**
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

    # 前端靜態資源
    location / {
        root /path/to/vue3-project/dist;
        try_files $uri $uri/ /index.html;
    }

    # 後端 API 代理
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

#### 8. 清理與重置

如果您遇到問題並需要從頭開始：

```bash
# Windows
.\deploy.ps1 -Clean

# Linux/macOS
./deploy.sh --clean
```

---

## 📋 傳統部署方法

## 系統需求

| 槽件 | 版本要求 | 描述 |
|------|----------|------|
| Node.js | >= 16.0.0 | 运行環境 |
| MySQL | >= 5.7 | 數據庫 |
| MariaDB | >= 10.3 | 數據庫（選擇性） |
| npm | >= 8.0.0 | 對象管理器 |
| yarn | >= 1.22.0 | 對象管理器（選擇性） |
| Browser | 支援 ES6+ | 現代瀏覽器 |

## 快速開始

### 1. 安裝依賴項

```bash
# 使用 cnpm
cnpm install
# 或使用 yarn
yarn install
```

### 2. 設定後端 API 地址

建立環境配置檔案（可選）:

```bash
# 複製環境配置範本
cp .env.example .env
```

編輯 `.env` 檔案以設定後端 API 地址：

```env
# 後端 API 地址
VITE_API_BASE_URL=http://localhost:3001

# 其他設定...
```

### 3. 啟動開發伺服器

```bash
# 啟動開發伺服器
npm run dev

# 或使用 yarn
yarn dev
```

開發伺服器將在 `http://localhost:5173` 啟動。

### 4. 建立生產版本

```bash
# 建立生產版本
npm run build

# 預覽生產版本
npm run preview
```

## 後端服務配置

⚠️ **重要提醒**：前端專案需要與後端服務一起使用。

1. **啟動後端服務**：
   ```bash
   # 導航至後端專案目錄
   cd ../express-project
   
   # 安裝後端依賴
   npm install
   
   # 啟動後端服務
   npm start
   ```

2. **後端服務地址**：`http://localhost:3001`

3. **API 文件**：檢查後端專案中的 `API_DOCS.md` 文件。

## 開發環境配置

### 環境檢查

```bash
# 檢查 Node.js 版本
node --version

# 檢查 npm 版本
npm --version

### 開發伺服器

```bash
# 開啟開發伺服器（熱重載）
npm run dev

# 存取地址：http://localhost:5173
```

### 代碼規範

- 使用 Vue 3 Composition API
- 遵循官方 Vue.js 風格指南
- 成分命名使用 PascalCase
- 檔名命名使用 kebab-case

## 配置檔說明

### 前端配置檔（vue3-project 目錄）

| 檔名 | 描述 |
|------|-------------|
| `.env` | 環境變數配置檔 |
| `vite.config.js` | Vite 建置工具配置 |
| `package.json` | 專案依賴和腳本配置 |
| `jsconfig.json` | JavaScript 專案配置 |

### 後端配置檔（express-project 目錄）

| 檔名 | 描述 |
|------|-------------|
| `config/config.js` | 主要配置檔 |
| `.env` | 環境變數配置檔 |
| `database_design.md` | 資料庫設計文件 |
| `scripts/init-database.js` | 資料庫初始化腳本 |
| `generate-data.js` | 測試資料生成腳本 |

## npm 腳本命令

### 前端腳本（在 vue3-project 目錄中執行）

| 命令 | 描述 |
|---------|-------------|
| `npm run dev` | 開啟開發伺服器 |
| `npm run build` | 建置生產版本 |
| `npm run preview` | 預覽生產版本 |

### 後端腳本（在 express-project 目錄中執行）

| 命令 | 描述 |
|---------|-------------|
| `npm start` | 開啟伺服器 |
| `npm run dev` | 開啟開發伺服器（熱重載） |
| `npm run init-db` | 初始化資料庫 |
| `npm run generate-data` | 生成測試資料 |

## 環境變數配置

### 前端環境變數（vue3-project/.env）

```env
# API 伺服器地址
VITE_API_BASE_URL=http://localhost:3001/api

# 其他前端配置
VITE_APP_TITLE=Small石榴Image and Text Community
VITE_USE_REAL_API=true
```

### 後端環境變數（express-project/.env）

```env
# 伺服器配置
NODE_ENV=development
PORT=3001

# JWT 配置
JWT_SECRET=xiaoshiliu_secret_key_2025
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# 資料庫配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=xiaoshiliu
DB_PORT=3306

# API 配置
API_BASE_URL=http://localhost:3001

# 上傳配置
# 單張圖片最大文件大小
IMAGE_MAX_SIZE=10mb
# 單個視頻最大文件大小
VIDEO_MAX_SIZE=100mb
# 圖片上傳策略 (local: 本地存儲, imagehost: 第三方圖片存儲, r2: Cloudflare R2 存儲)
IMAGE_UPLOAD_STRATEGY=imagehost
# 視頻上傳策略 (local: 本地存儲, r2: Cloudflare R2 存儲)
VIDEO_UPLOAD_STRATEGY=local
```

## 資料庫腳本說明

專案中相關的資料庫腳本都放在 `express-project/scripts/` 目錄中，以便於管理和使用：

### 腳本檔案介紹

#### 1. 資料庫初始化腳本
- **檔案位置**: `scripts/init-database.js`
- **功能**: 創建資料庫和所有表結構
- **使用方法**:
  ```bash
  cd express-project
  node scripts/init-database.js

- **描述**：必須執行首次部署，將自動建立 `xiaoshiliu` 資料庫及 12 個資料表

#### 2. 測試資料生成腳本
- **檔案位置**：`scripts/generate-data.js`
- **功能**：生成模擬用戶、筆記、評論及其他測試資料
- **使用方法**：
  ```bash
  cd express-project
  node scripts/generate-data.js
  ```
- **描述**：可選執行，用於快速填充測試資料，包括 50 個用戶、200 則筆記、800 則評論等。

#### 3. SQL 初始化檔案
- **檔案位置**：`scripts/init-database.sql`
- **功能**：資料庫初始化腳本的純 SQL 版本
- **使用方法**：可直接在 MySQL 客戶端執行
- **描述**：與 `init-database.js` 有相同功能，提供 SQL 版本供參考

#### 4. 示範圖片更新腳本
- **檔案位置**：`scripts/update-sample-images.js`
- **功能**：自動獲取最新圖片鏈接並更新資料庫中的示範圖片
- **使用方法**：
  ```bash
  cd express-project
  node scripts/update-sample-images.js
  ```

- **描述**：
  - 自動從 Liziwen API 獲取最新圖片鏈接
  - 更新 `imgLinks/avatar_link.txt`（50 個頭像鏈接）
  - 更新 `imgLinks/post_img_link.txt`（300 則筆記圖片鏈接）
  - 批量更新資料庫中的用戶頭像和筆記圖片
  - 支援顯示更新前後圖片數量的統計數據

## 開發環境啟動流程

### 1. 啟動後端服務

```bash
# 開啟第一個終端，切換到後端目錄
cd express-project

# 安裝後端依賴（首次運行）
npm install

# 配置資料庫（首次運行）
# 編輯 config/config.js 或 .env 檔案

# 初始化資料庫（首次運行）
node scripts/init-database.js

# 生成測試資料（可選）
node scripts/generate-data.js

# 啟動後端服務
npm start
# 後端服務運行於 http://localhost:3001
```

### 2. 啟動前端服務

```bash
# 開啟第二個終端，切換到前端目錄
cd vue3-project

# 安裝前端依賴（首次運行）
npm install

# 配置 API 地址（可選）
# 編輯 .env 檔案，設定 VITE_API_BASE_URL

# 啟動前端開發服務器
npm run dev
# 前端服務運行於 http://localhost:5173
```

### 3. 適用服務

| 服務 | 地址 |
|------|------|
| 前端介面 | http://localhost:5173 |
| 後端 API | http://localhost:3001 |