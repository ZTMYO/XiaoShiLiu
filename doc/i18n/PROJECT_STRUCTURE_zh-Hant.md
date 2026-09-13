# 項目結構

小石榴圖文社區採用前後端分離結構：前端 Vue 3 + Vite，後端 Express + MySQL。

## 總體結構

```
小石榴圖文社區/
├── vue3-project/            # 前端項目
├── express-project/         # 後端項目
├── doc/                     # 項目文檔
│   ├── OVERVIEW.md          # 文檔總覽
│   ├── API_DOCS.md          # 接口文檔
│   ├── DEPLOYMENT.md        # 部署指南
│   ├── PROJECT_STRUCTURE.md # 項目結構（本文檔）
│   ├── DATABASE_DESIGN.md   # 資料庫設計
│   ├── i18n/                # 文檔的英文/繁體版本
│   └── imgs/                # 文檔配圖
├── docker-compose.yml       # Docker 編排
├── .env.docker              # Docker 環境變數範本
├── deploy.sh                # Linux 一鍵部署腳本
├── deploy.ps1               # Windows 一鍵部署腳本
├── LICENSE                  # 開源協議
└── README.md                # 項目主文檔
```

## 前端項目結構（vue3-project/）

```
vue3-project/
├── public/                  # 靜態資源（站點圖示、manifest.json）
├── src/
│   ├── api/                 # 接口封裝
│   ├── assets/              # 圖片、圖示、樣式等靜態資源
│   ├── components/          # 公共元件
│   ├── composables/         # 組合式函數
│   ├── config/              # 應用配置與常數
│   ├── directives/          # 自訂指令
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia 狀態管理
│   ├── utils/               # 工具函數
│   ├── views/               # 頁面元件
│   ├── App.vue              # 根元件
│   └── main.js              # 入口文件
├── .env.example             # 環境變數範本
├── Dockerfile               # 鏡像建置
├── nginx.conf               # Nginx 配置
├── index.html               # HTML 範本
├── jsconfig.json            # 路徑別名配置
├── package.json             # 依賴與腳本
└── vite.config.js           # Vite 配置
```

## 後端項目結構（express-project/）

```
express-project/
├── config/                  # 應用配置（資料庫、JWT、上傳、郵件等）
├── constants/               # 業務常數
├── fonts/                   # 圖片浮水印字型
├── imgLinks/                # 示例圖片連結庫
├── middleware/              # 中間件（認證、CRUD 工廠）
├── routes/                  # 路由定義
├── scripts/                 # 初始化、測試資料、違規詞檢測等腳本
├── utils/                   # 工具函數（JWT、上傳、通知、定時任務等）
├── app.js                   # 應用程式入口
├── .env.example             # 環境變數範本
├── Dockerfile               # 鏡像建置
└── package.json             # 依賴與腳本
```

### 路由文件說明

| 文件 | 掛載路徑 | 功能 |
|------|----------|------|
| `auth.js` | `/api/auth` | 登入、註冊、權杖校驗 |
| `users.js` | `/api/users` | 使用者資訊、資料統計、關注與粉絲、認證申請、修改密碼 |
| `posts.js` | `/api/posts` | 筆記發佈、編輯、刪除、查詢 |
| `comments.js` | `/api/comments` | 評論發佈、刪除、查詢 |
| `likes.js` | `/api/likes` | 筆記與評論按讚 |
| `tags.js` | `/api/tags` | 標籤查詢與管理 |
| `search.js` | `/api/search` | 筆記、使用者、標籤搜尋 |
| `notifications.js` | `/api/notifications` | 通知列表與已讀 |
| `upload.js` | `/api/upload` | 圖片與影片上傳 |
| `stats.js` | `/api/stats` | 平台資料統計 |
| `categories.js` | `/api/categories` | 分類查詢 |
| `files.js` | `/api/files` | 檔案存取 |
| `admin.js` | `/api/admin` | 後台管理（使用者、內容、會話、管理員等） |
| `docs.js` | `/api/system` | 站點文檔的 Markdown 原文 |

此外 `GET /api/health` 健康檢查由 `app.js` 直接定義，不經過 `routes/`。

### 腳本文件說明

| 文件 | 功能 |
|------|------|
| `init-database.js` | 建立資料庫與資料表 |
| `init-database.sql` | SQL 版建表腳本，可直接在 MySQL 客戶端執行 |
| `generate-data.js` | 產生開發環境測試資料 |
| `update-sample-images.js` | 批次更新示例圖片連結 |
| `local-sensitive-word-check.js` | 掃描筆記與評論中的違規詞 |
| `migrate-audit-to-verification.js` | 將 audit 表中的認證資料遷移到 user_verification |
| `違規詞庫.txt` | `local-sensitive-word-check.js` 載入的違規詞詞庫 |

## 前端頁面與路由

### 主站頁面

| 頁面文件 | 路由 | 說明 |
|----------|------|------|
| `layout/index.vue` | `/` | 主站佈局（頁首、側邊欄、頁尾），根路徑重定向到 `/explore` |
| `explore/index.vue` | `/explore` | 發現頁 |
| `explore/ChannelPage.vue` | `/explore`、`/explore/:channel` | 頻道內容流，`:channel` 無效時回退到推薦 |
| `PostDetail.vue` | `/post` | 筆記詳情 |
| `publish/index.vue` | `/publish` | 發佈筆記 |
| `notification/index.vue` | `/notification` | 通知中心 |
| `user/index.vue` | `/user` | 我的主頁 |
| `user/UserProfile.vue` | `/user/:userId` | 他人主頁 |
| `user/FollowList.vue` | `/follow/:type` | 關注、粉絲、互關列表，`type` 取 `mutual`、`following`、`followers` |
| `search/SearchResult.vue` | `/search_result`、`/search_result/:tab` | 搜尋結果，`tab` 取 `all`、`post`、`video`、`user` |
| `post-management/index.vue` | `/post-management` | 筆記管理 |
| `draft-box/index.vue` | `/draft-box` | 草稿箱 |
| `NotFound.vue` | `/:pathMatch(.*)*` | 404 頁面 |

### 獨立佈局頁面

| 頁面文件 | 路由 | 說明 |
|----------|------|------|
| `download/index.vue` | `/download` | 客戶端下載頁 |
| `doc/index.vue` | `/doc/:name?`、`/:lang(zh\|en\|zh-Hant)/doc/:name?` | 文檔閱讀頁 |

### 後台管理頁面

| 頁面文件 | 路由 | 說明 |
|----------|------|------|
| `admin/AdminLogin.vue` | `/admin/login` | 後台登入 |
| `admin/AdminLayout.vue` | `/admin` | 後台佈局，根路徑重定向到 `/admin/monitor` |
| `admin/AdminMonitor.vue` | `/admin/monitor` | 動態監控 |
| `admin/UserManagement.vue` | `/admin/users` | 使用者管理 |
| `admin/PostAudit.vue` | `/admin/post-audit` | 筆記審核 |
| `admin/PostManagement.vue` | `/admin/posts` | 筆記管理 |
| `admin/CommentManagement.vue` | `/admin/comments` | 評論管理 |
| `admin/CategoryManagement.vue` | `/admin/categories` | 分類管理 |
| `admin/TagManagement.vue` | `/admin/tags` | 標籤管理 |
| `admin/LikeManagement.vue` | `/admin/likes` | 按讚管理 |
| `admin/CollectionManagement.vue` | `/admin/collections` | 收藏管理 |
| `admin/FollowManagement.vue` | `/admin/follows` | 關注管理 |
| `admin/NotificationManagement.vue` | `/admin/notifications` | 通知管理 |
| `admin/SessionManagement.vue` | `/admin/sessions` | 使用者會話管理 |
| `admin/AdminSessionManagement.vue` | `/admin/admin-sessions` | 管理員會話管理 |
| `admin/AdminManagement.vue` | `/admin/admins` | 管理員管理 |
| `admin/AuditManagement.vue` | `/admin/audit` | 認證審核 |

## 請求生命週期

```
瀏覽器
  ↓ 前端 axios 實例（src/api/request.js）
     請求攔截器注入 Authorization: Bearer <token>（後台頁面用 admin_token）
Vite 開發伺服器 / Nginx（線上：靜態託管 + /api 反向代理到後端 3001 埠）
  ↓
Express（app.js）
  ├── cors
  ├── express.json / urlencoded（請求體上限 50MB）
  ├── 限流：/api 每 15 分鐘 500 次，/api/auth 每 5 分鐘 20 次，/api/upload 每 15 分鐘 60 次
  ├── 路由分發（routes/*.js，掛載路徑見上表）
  ├── 認證中間件（middleware/auth.js 的 authenticateToken、optionalAuth）
  └── utils/dbHelper.js → MySQL 連線池（config/config.js 導出的 pool）
  ↓ JSON 回應（統一 { code, message, data }）
回應攔截器把 code 轉成 success，401 清除權杖並跳登入，429 提示請求過於頻繁
  ↓
Pinia store 更新狀態 → 元件重新渲染
```

## 常見改動入口

| 要做的事 | 需要改的文件 |
|----------|--------------|
| 新增前端頁面 | `src/views/` 新建元件 → `src/router/index.js` 註冊路由 → 需要接口時在 `src/api/` 封裝、在 `src/stores/` 加狀態 |
| 新增後端接口 | 在 `routes/` 對應文件加路由，新領域則新建文件並在 `app.js` 掛載 → 需要認證時加 `middleware/auth.js` 的中間件 → 資料庫操作走 `utils/dbHelper.js` |
| 新增資料表 | `scripts/init-database.js` 與 `scripts/init-database.sql` 兩處保持同步 |
