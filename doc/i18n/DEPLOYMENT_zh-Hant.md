# 小石榴圖文社區部署指南

## 系統需求

- **Docker 部署**：Docker 20.10+、Docker Compose 2.0+
- **傳統部署**：Node.js 18+、MySQL 5.7+、npm 或 yarn

> 💡 使用寶塔面板部署可參考：[使用寶塔搭建小石榴圖文社區完整教程](https://www.sakuraidc.cc/forum-post/3116.html)

---

## 🐋 Docker 一鍵部署（推薦）

### 1. 複製專案

```bash
git clone https://github.com/ZTMYO/XiaoShiLiu
cd XiaoShiLiu
```

### 2. 設定環境變數

Docker 部署只用根目錄這一份 `.env`，無需再改 `express-project/.env` 和 `vue3-project/.env`：

```bash
cp .env.docker .env
```

真機部署必須檢查的關鍵項：

```env
# ① 資料庫密碼
DB_PASSWORD=123456

# ② JWT 金鑰
JWT_SECRET=xiaoshiliu_secret_key_2025_docker

# ③ 圖片對外存取地址（改用域名/伺服器 IP 時同步修改，否則圖片裂圖）
LOCAL_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001

# ④ 需要郵箱驗證時開啟並填寫 SMTP（預設關閉）
EMAIL_ENABLED=false
```

> 全部變數及註解見 [.env.docker](../../.env.docker)。
> 宿主機端口固定為 8080（前端）、3001（後端）、3307（資料庫），需要調整請改 [docker-compose.yml](../../docker-compose.yml) 的 `ports` 段，而不是改 `.env`。

### 3. 啟動服務

Windows 推薦使用 PowerShell 腳本：

```powershell
.\deploy.ps1            # 啟動
.\deploy.ps1 -Build     # 重新建構並啟動
.\deploy.ps1 -Seed      # 啟動並灌裝示例資料
.\deploy.ps1 -Help      # 檢視說明
```

其他平台使用 Docker Compose：

```bash
docker-compose up -d
docker-compose up -d --build   # 重新建構並啟動
```

> 首次在伺服器啟動前，可先執行 `docker compose config` 驗證編排配置是否合法。

### 4. 存取應用

| 服務 | 地址 |
|---|---|
| 前端介面 | http://localhost:8080 |
| 後端 API | http://localhost:3001 |
| 資料庫 | localhost:3307 |

部署到伺服器後，把 `localhost` 換成公網 IP 或域名即可存取。資料庫端口 3307 **不要**對公網開放，僅允許本機/內網存取更安全。

### 5. 常用指令

```powershell
.\deploy.ps1 -Status    # 檢視服務狀態
.\deploy.ps1 -Logs      # 檢視日誌
.\deploy.ps1 -Stop      # 停止服務
.\deploy.ps1 -Clean     # 清理所有資料（謹慎使用）
```

---

## 🛠️ 傳統部署

### 1. 環境準備

確保已安裝 Node.js 18+、MySQL 5.7+、Git。

### 2. 後端配置

```bash
cd express-project
cp .env.example .env
npm install
```

編輯 `.env`，以下四項必須確認：

```env
DB_PASSWORD=123456                      # 資料庫密碼
JWT_SECRET=xiaoshiliu_secret_key_2025   # JWT 金鑰，生產環境務必更換
API_BASE_URL=http://localhost:3001      # 後端對外存取地址
CORS_ORIGIN=http://localhost:5173       # 允許跨域的前端地址
```

其餘變數（上傳策略、郵件、IP 屬地、違規詞檢測等）保持預設即可，變數的完整列表和註解見 [.env.example](../../express-project/.env.example)，各項含義見下方「配置說明」。

初始化資料庫並啟動服務：

```bash
npm run init-db        # 建庫建表
npm run generate-data  # 生成示例資料（可選）
npm start              # 啟動服務，預設 http://localhost:3001
```

> 資料庫相關腳本都在 `express-project/scripts/` 下：`init-database.js`（建庫建表）、`init-database.sql`（純 SQL 版，可直接在 MySQL 用戶端執行）、`generate-data.js`（生成示例資料）、`update-sample-images.js`（更新示例圖連結）。

### 3. 前端配置

```bash
cd vue3-project
cp .env.example .env
npm install
npm run dev            # 開發模式，預設 http://localhost:5173
```

生產模式建構與預覽：

```bash
npm run build          # 建構到 dist/
npm run preview        # 本機預覽，預設 http://localhost:4173
```

前端 `.env` 預設指向 `http://localhost:3001/api`，後端改端口時需同步修改 `VITE_API_BASE_URL`。

### 4. 存取應用

| 服務 | 地址 |
|---|---|
| 前端（開發模式） | http://localhost:5173 |
| 前端（生產預覽） | http://localhost:4173 |
| 後端 API | http://localhost:3001 |

---

## 🔧 配置說明

### 上傳配置

圖片上傳策略由 `IMAGE_UPLOAD_STRATEGY` 選擇，共四種：

| 策略 | 取值 | 說明 | 需要配置的變數 |
|---|---|---|---|
| 本地儲存 | `local` | 存到伺服器磁碟 | `LOCAL_UPLOAD_DIR`、`LOCAL_BASE_URL` |
| 第三方圖床 | `imagehost` | 上傳到第三方圖床（預設） | `IMAGEHOST_API_URL`、`IMAGEHOST_TIMEOUT` |
| Cloudflare R2 | `r2` | 存到 R2 儲存桶 | `R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_ENDPOINT`、`R2_BUCKET_NAME`、`R2_ACCOUNT_ID`、`R2_REGION` |
| 阿里雲 OSS | `aliyun` | 存到 OSS 儲存桶 | `OSS_REGION`、`OSS_BUCKET_NAME`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`、`OSS_IMAGE_PREFIX` |

視頻上傳策略由 `VIDEO_UPLOAD_STRATEGY` 選擇，只支援 `local` 和 `r2`。檔案大小上限由 `IMAGE_MAX_SIZE`（預設 10mb）和 `VIDEO_MAX_SIZE`（預設 100mb）控制。

> 使用 `local` 策略時，`LOCAL_BASE_URL` 必須是瀏覽器能存取到的地址，否則圖片會裂圖。

### Cloudflare R2 配置

1. 登入 Cloudflare 控制台，進入 R2 Object Storage
2. 建立儲存桶
3. 生成 API 權杖，權限選擇 R2:Edit
4. 取得帳戶 ID
5. 將 `R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_ENDPOINT`、`R2_BUCKET_NAME`、`R2_ACCOUNT_ID`、`R2_REGION=auto` 填入 `.env`
6. 綁定自訂域名後可另行設定 `R2_PUBLIC_URL`，留空則使用 R2 預設域名

### 阿里雲 OSS 配置

1. 登入阿里雲控制台，進入物件儲存 OSS
2. 建立 Bucket（推薦使用 `oss-cn-hongkong`，讀寫權限按需設定）
3. 建立 RAM 子帳號並生成 AccessKey，只授予該 Bucket 的讀寫權限
4. 將 `OSS_REGION`、`OSS_BUCKET_NAME`、`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET` 填入 `.env`
5. 綁定自訂域名或 CDN 後可另行設定 `OSS_PUBLIC_URL`；`OSS_IMAGE_PREFIX` 用於按環境或用途隔離圖片，預設 `images/`

### 郵件功能配置

`EMAIL_ENABLED` 控制註冊是否需要郵箱驗證：

- `false`（預設）：註冊不需要郵箱驗證，無需配置 SMTP
- `true`：註冊需填寫郵箱並驗證，需同時配置 `SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASSWORD`、`EMAIL_FROM`、`EMAIL_FROM_NAME`

### IP屬地查詢配置

```env
# 主API地址
IP_LOCATION_PRIMARY_API=https://api.pearktrue.cn/api/ip/details
# 主API超時時間（毫秒）
IP_LOCATION_PRIMARY_TIMEOUT=10000
# 備用API地址
IP_LOCATION_BACKUP_API=https://api.pearktrue.cn/api/ip/high
# 備用API超時時間（毫秒）
IP_LOCATION_BACKUP_TIMEOUT=5000
```

系統會在主 API 失敗時自動切換到備用 API，超時時間可根據網路情況調整。

### 違規詞檢測配置

`SENSITIVE_WORD_CHECK_ENABLED` 控制開關：

```env
# 是否啟用定時違規詞檢測
SENSITIVE_WORD_CHECK_ENABLED=false
# 白名單用戶ID，名單內用戶不參與檢測，多個用英文逗號分隔（留空表示不啟用白名單）
SENSITIVE_WORD_CHECK_WHITELIST=
```

- 檢測方式為關鍵詞匹配，詞庫位於 `express-project/scripts/违规词库.txt`，每行一個詞
- 檢測範圍：小石榴號、用戶暱稱、個人簡介、標籤名、貼文標題與內容、評論
- 命中後直接替換為"違規暱稱""違規內容""違規標題""違規評論""違規標籤"，不發送通知
- `SENSITIVE_WORD_CHECK_WHITELIST` 中的用戶 ID 不參與檢測
- 檢測間隔為 24 小時，後端啟動時先執行一次，之後按間隔執行；未啟用時不會註冊任務

需要立即檢測一次時，可手動執行（同樣受開關控制，未啟用會直接跳過）：

```bash
cd express-project
node scripts/local-sensitive-word-check.js
```

### 反向代理配置

站點掛在 Nginx 等反向代理後面（綁定域名 / HTTPS）時，按部署方式修改。

**Docker 部署**：前端映像檔內建 nginx，已把 `/api` 反代到後端容器，外層 Nginx 只需把 `/api` 轉發到宿主機上後端的映射端口：

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

同源部署時瀏覽器請求走相對路徑 `/api`，**不需要 CORS**；僅當前端域名與後端域名不一致時才需配置：

```env
CORS_ORIGIN=https://yourdomain.com
```

使用本地儲存圖片時，務必把對外存取地址改成真實域名：

```env
LOCAL_BASE_URL=https://yourdomain.com
API_BASE_URL=https://yourdomain.com
```

**傳統部署**：需要分別修改兩份 `.env`（前端改完需重新執行 `npm run build`）：

```env
# express-project/.env
API_BASE_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# vue3-project/.env
VITE_API_BASE_URL=https://yourdomain.com/api
```

完整的 Nginx 站點配置示例（以 `example.com` 為例）：

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

---

## 🚨 故障排除

### Docker 部署問題

| 問題 | 排查方式 |
|---|---|
| 端口衝突 | `netstat -ano \| findstr :8080` 檢視佔用；端口映射在 docker-compose.yml 的 `ports` 段修改，改完重新 `docker compose up -d` |
| 容器啟動失敗 | `docker-compose logs` 檢視日誌，`docker-compose up -d --build` 重新建構 |
| 資料庫連接失敗 | `docker-compose ps` 檢視容器狀態，`docker-compose restart mysql` 重啟資料庫 |

### 傳統部署問題

| 問題 | 排查方式 |
|---|---|
| Node.js 版本不相容 | `node --version` 確認版本不低於 18，用 nvm 切換：`nvm use 18` |
| 資料庫連接失敗 | 檢查 MySQL 是否啟動、資料庫用戶權限、防火牆設定 |
| 依賴安裝失敗 | `npm cache clean --force`，刪除 `node_modules` 後重新 `npm install` |

---

## 📝 注意事項

- **生產環境**：更換預設資料庫密碼與 `JWT_SECRET`，配置 HTTPS，設定防火牆規則，定期備份資料
- **不要**將 `.env` 檔案提交到版本控制
- 建議使用 CDN 加速靜態資源，並定期更新依賴套件

**祝您部署順利！** 🎉
