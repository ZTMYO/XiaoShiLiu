# 項目結構

小石榴圖文社區採用前後端分離結構：前端 Vue 3 + Vite，後端 Express + MySQL。

## 總體結構

```
小石榴圖文社區/
├── vue3-project/            # 前端項目
├── express-project/         # 後端項目
├── doc/                     # 項目文檔
│   ├── API_DOCS.md          # 接口文檔
│   ├── DATABASE_DESIGN.md   # 資料庫設計
│   ├── DEPLOYMENT.md        # 部署指南
│   ├── PROJECT_STRUCTURE.md # 項目結構（本文檔）
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
| `users.js` | `/api/users` | 使用者資訊、關注關係 |
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
| `admin.js` | `/api/admin` | 後台管理 |
| `docs.js` | `/api/system` | 系統資訊與接口文檔 |

### 腳本文件說明

| 文件 | 功能 |
|------|------|
| `init-database.js` | 建立資料庫與資料表 |
| `init-database.sql` | SQL 版建表腳本，可直接在 MySQL 客戶端執行 |
| `generate-data.js` | 產生開發環境測試資料 |
| `update-sample-images.js` | 批次更新示例圖片連結 |
| `local-sensitive-word-check.js` | 掃描筆記與評論中的違規詞 |
| `migrate-audit-to-verification.js` | 將 audit 表中的認證資料遷移到 user_verification |

## 技術架構

### 前端架構

```
┌──────────────────────────────────────┐
│              Vue 3 App               │
├──────────────────────────────────────┤
│   Views (頁面)  │  Components (元件)  │
├──────────────────────────────────────┤
│   Router (路由) │  Stores (狀態管理)  │
├──────────────────────────────────────┤
│   API (接口)    │  Utils (工具)       │
├──────────────────────────────────────┤
│           Vite (建置工具)            │
└──────────────────────────────────────┘
```

### 後端架構

```
┌──────────────────────────────────────┐
│           Express Server             │
├──────────────────────────────────────┤
│   Routes (路由) │ Middleware (中間件) │
├──────────────────────────────────────┤
│   Config (配置) │  Utils (工具)       │
├──────────────────────────────────────┤
│           MySQL Database             │
└──────────────────────────────────────┘
```

## 資料流向

```
前端 Vue App
     ↓ HTTP 請求
Express 路由
     ↓ 資料處理
中間件驗證
     ↓ 資料庫操作
MySQL 資料庫
     ↓ 返回資料
前端狀態更新
     ↓ 視圖渲染
使用者介面展示
```
