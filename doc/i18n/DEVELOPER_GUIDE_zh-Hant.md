# 二次開發指南

本文面向想把小石榴圖文社區改造成自己專案的人，講清楚三件事：**必須改的品牌元素、必須遵守的開源協議、可以按需裁剪的功能**。

環境搭建、參數含義、上線配置等內容不在這裡，請先閱讀[部署指南](DEPLOYMENT_zh-Hant.md)。兩篇文檔的分工如下：

| 文檔 | 負責內容 |
|------|----------|
| [部署指南](DEPLOYMENT_zh-Hant.md) | 環境準備、Docker/傳統部署、上傳與郵件等參數配置、OSS 控制台操作、上線檢查 |
| 二次開發指南（本文） | 品牌元素替換、關於頁與作者署名、AGPL-3.0 協議義務、第三方資源授權、功能裁剪 |

> 💡 建議流程：先按本文完成品牌與協議層面的改造，再按部署指南完成環境配置與上線。

---

## 一、開源協議與法律義務

倉庫根目錄的 `LICENSE` 為 **GNU Affero General Public License v3.0（AGPL-3.0）** 全文。它與常見的 GPLv3 最大區別在於**第 13 條**：只要你的修改版透過網路對外提供服務，就必須向使用者提供獲取其完整對應原始碼的方式。Web 社區類專案正是典型場景，因此這條對二次開發者最需要注意。

二次開發時你需要履行：

- **保留版權聲明**：不得刪除或修改原始碼中的版權聲明、作者署名與協議文本（`LICENSE` 與各檔案頭部的協議註解）。
- **修改版同樣以 AGPL-3.0 開源**：你基於本專案改造後的程式碼，整體也必須以 AGPL-3.0 對外提供。
- **網路互動提供原始碼（第 13 條）**：網站上線後，應在頁面上提供明顯入口（如頁尾連結），讓訪客能下載到你所部署版本的完整原始碼。
- **註明修改**：建議在關於頁或頁尾標註「本專案基於小石榴圖文社區二次開發」，並附上原倉庫網址。

> ⚠️ 本專案為學習交流用途，作者不對二次開發的營運風險與合規問題負責。商業使用前請自行確認法律與平台合規要求。

---

## 二、品牌元素改造清單

下面按類別列出所有帶有「小石榴」品牌資訊的資源。改名、換圖時建議逐項核對，避免遺漏。

### 2.1 站點名稱與標題

| 位置 | 內容 | 說明 |
|------|------|------|
| `vue3-project/index.html` | `<title>小石榴 - 你的校园图文部落</title>` | 瀏覽器分頁標題 |
| `vue3-project/public/manifest.json` | `name`、`short_name`、`description`、`theme_color` | PWA 應用名稱、描述與主題色 |
| `vue3-project/.env.example` | `VITE_APP_TITLE=小石榴图文社区` | 應用標題變數 |
| `vue3-project/package.json` | `description`、`author` | 前端套件資訊 |
| `express-project/package.json` | `description`、`author` | 後端套件資訊 |
| `express-project/config/config.js` | 站點相關預設值 | 後端預設站點資訊 |
| `express-project/utils/email.js` | 郵件主旨與內文標題 | 見 2.5 |

### 2.2 圖片資源（`vue3-project/src/assets/imgs/`）

| 檔案 | 用途 | 引用範圍 |
|------|------|----------|
| `小石榴.png` | 站點 Logo，含小石榴元素 | 關於頁、頂部導覽、搜尋頁、後台登入頁與版面 |
| `avatar.png` | 預設頭像（無頭像時的備援） | 大量使用者、評論、通知相關元件 |
| `未加载.png` | 圖片佔位圖（載入失敗/未載入） | 貼文卡片、詳情頁、內容渲染、通知等 |
| `ztmyo.png` | 關於頁作者頭像 | AboutModal |
| `栗次元.ico` / `夏柔.ico` / `百度.ico` | 關於頁第三方服務圖示 | AboutModal |
| `avatars/avatar_1.png ~ avatar_24.png` | 示例資料使用的頭像 | `generate-data` 灌裝的示例資料 |

替換要求：

- `小石榴.png`：換成你自己的 Logo，**注意保持檔名或同步修改引用處的路徑**（目前引用該檔名的元件較多）。
- `avatar.png`、`未加载.png`：建議替換為無品牌的中性圖，避免預設頭像/佔位圖殘留原作者元素。
- `avatars/`：示例資料頭像，可整體替換，重新灌裝資料時會重新引用。
- 第三方服務圖示（栗次元/夏柔/百度）：若不使用對應服務，應在關於頁移除相關內容（見第四章）。

### 2.3 `public/` 目錄資源

使用者可自由替換的靜態資源都在 `vue3-project/public/` 下：

| 檔案 | 用途 |
|------|------|
| `manifest.json` | PWA 清單，見 2.1 |
| `favicon-32x32.png`、`favicon-64x64.png` | 瀏覽器分頁圖示 |
| `apple-touch-icon.png` | iOS 主畫面圖示 |
| `android-icon-192x192.png`、`android-icon-512x512.png` | Android 主畫面圖示 |
| `stickers/小石榴心情.png`、`stickers/小石榴日常.png` | 表情貼圖雪碧圖，見 2.4 |

> ⚠️ `vue3-project/index.html` 引用了 `/logo.ico`，但專案中並不存在該檔案，屬於原有缺失項。請自行準備一個 `.ico` 圖示放入 `public/logo.ico`，或刪除該行引用，避免瀏覽器 404。全部圖示建議使用同一套設計的新 Logo 統一替換，尺寸與檔名保持不變即可直接生效。

### 2.4 表情貼圖

表情貼圖配置在 `vue3-project/src/components/emoji-picker/stickers.json`，包含分組標題（目前為「小石榴心情」「小石榴日常」）與雪碧圖路徑。替換方式：

1. 用等寬等高的雪碧圖替換 `public/stickers/` 下的圖片；
2. 在 `stickers.json` 中同步修改分組 `title`、`sheet` 路徑以及 `columns`（每行張數）等參數。

具體欄位說明見同目錄下的 `stickers.js` 註解。

### 2.5 郵件模板

啟用郵箱驗證後，註冊郵件中的標題與內文帶有品牌名，位於 `express-project/utils/email.js`，同時 `.env` 中的 `EMAIL_FROM_NAME` 也會顯示寄件人名稱，請一併修改。

### 2.6 頁面可見的品牌文案

除名稱與圖片外，以下位置在介面上直接可見，需要按需修改：

| 位置 | 內容 |
|------|------|
| `vue3-project/src/components/modals/AuthModal.vue` | 「登入/註冊小石榴」、欄位標籤與驗證提示中的「小石榴號」 |
| `vue3-project/src/views/user/UserProfile.vue`、`vue3-project/src/views/user/index.vue`、`vue3-project/src/views/search/components/UserCard.vue` | 「小石榴號：xxx」 |
| `vue3-project/src/components/DetailCard.vue` | 分享文案中的站點名稱 |
| `vue3-project/src/components/menu/CommonMenu.vue` | 「關於小石榴」選單項目 |
| `vue3-project/src/components/modals/SiteSearchModal.vue` | 搜尋提示文案 |
| `vue3-project/src/views/admin/AdminLayout.vue` | 後台標題「小石榴管理後台」 |
| `vue3-project/src/views/download/index.vue` | 下載頁標題、版本號、GitHub 連結 |
| `vue3-project/src/views/doc/index.vue` | 文檔站側欄標題、頁尾版權與協議連結 |

> 💡 **「小石榴號」是使用者唯一識別欄位的介面稱呼**（資料庫欄位為 `user_id`）。若只改顯示名稱，修改上述元件文案即可；若連同術語一起替換，還需同步後端提示語、違規詞檢測腳本與文檔說明，改動面較大，建議保留內部欄位名、僅調整介面文案。

### 2.7 程式碼註解與倉庫連結

原始碼檔案頭部的作者與倉庫資訊（`@author`、`@github`）及文檔、README、下載頁中的 GitHub 倉庫連結，二次開發時請替換為你自己的資訊：

- `express-project/app.js`、`vue3-project/src/main.js`、`vue3-project/vite.config.js` 的檔案頭註解
- `README.md`、`vue3-project/src/views/doc/index.vue`、`vue3-project/src/views/download/index.vue` 中的 `GITHUB_URL`
- [OVERVIEW.md](OVERVIEW_zh-Hant.md) 等文檔中指向原倉庫的「原檔案」連結

原倉庫網址為 `https://github.com/ZTMYO/XiaoShiLiu`。

但**涉及作者署名的部分不能直接刪除**，處理方式見下一章。

---

## 三、關於頁與作者署名

`vue3-project/src/components/modals/AboutModal.vue` 是專案的「關於」彈窗，包含專案簡介、開發者、專案亮點、介面服務、隱私聲明與版權聲明。二次開發時：

- **可以修改**：專案簡介、專案亮點、介面服務（改為你自己實際使用的服務）、隱私聲明、頁面文案與圖示、頁尾版權行 `© xxxx 你的專案名稱`。
- **必須保留**：對原作者的署名。AGPL-3.0 要求保留版權聲明，且這是對開源貢獻者最基本的尊重。
- **建議做法**：保留原「開發者」資訊，並新增一句「本專案基於小石榴圖文社區二次開發」的說明，附上原倉庫網址；頁尾改為 `© xxxx 你的專案名稱 · Based on XiaoShiLiu by @ZTMYO`。

| 區塊 | 處理建議 |
|------|----------|
| 專案簡介 | 改為你的專案定位 |
| 開發者 | 保留原作者（@ZTMYO + 原倉庫），可另加你的資訊 |
| 專案亮點 | 保留或按實際技術棧調整 |
| 介面服務 | 若不再使用栗次元/夏柔/百度等服務，刪除對應項目 |
| 隱私聲明 | 按你的實際資料處理方式修改 |
| 版權聲明 | 補充「基於 AGPL-3.0 二次開發」說明 |
| 頁尾 | 保留原作者署名，加註你的專案名稱 |

---

## 四、第三方資源與授權

專案中使用的外部服務與素材，二次開發時注意各自的授權與合規要求：

| 資源 | 用途 | 注意事項 |
|------|------|----------|
| 栗次元圖床（t.alcy.cc） | 示例資料圖片來源 | 僅作示例，生產環境請替換為你自己的圖床；示例連結見 `express-project/imgLinks/post_img_link.txt` |
| 夏柔 API（aa1.cn） | 第三方圖片上傳介面 | 第三方公共介面，穩定性與可用性不受本專案控制，建議改為 OSS/R2 或自建上傳 |
| 百度 opendata | IP 屬地查詢 | 免費公開介面，無需金鑰；如涉及隱私合規請自行評估 |
| UI 參考（小紅書） | 介面設計參考 | 僅作版面參考，**不要**使用對方商標、Logo 或受版權保護的素材 |
| 表情貼圖雪碧圖 | 站內表情 | 目前標註為原創素材，若替換請確保自己擁有所用素材的授權 |

> ⚠️ 請勿在二次開發的網站中保留或使用任何第三方品牌標識（包括原作者的相關素材）來暗示官方關聯，避免商標與版權風險。關於頁的「免責聲明」也應據此調整為你的實際情況。

---

## 五、功能裁剪

以下功能可透過配置開關關閉，或直接移除對應模組，按需裁剪：

| 功能 | 開關 / 位置 | 裁剪方式 |
|------|-------------|----------|
| 圖片/影片上傳 | `IMAGE_UPLOAD_STRATEGY`、`VIDEO_UPLOAD_STRATEGY` | 選擇 `local` 即可不依賴任何第三方儲存，無需 OSS/R2/圖床 |
| 郵箱驗證註冊 | `EMAIL_ENABLED` | 設為 `false` 後註冊無需郵箱驗證，也不用配置 SMTP |
| IP 屬地顯示 | `IP_LOCATION_API` 等 | 不使用時可關閉相關顯示邏輯 |
| 定時違規詞檢測 | `SENSITIVE_WORD_CHECK_ENABLED` | 設為 `false` 不註冊檢測任務 |
| 多語言文檔 | `express-project/routes/docs.js` 的 `LANG_SUFFIX` | 不需要多語言時保留中文即可，缺失的語言版本會自動隱藏 |
| 表情貼圖 | `public/stickers/` 與 `stickers.json` | 刪除配置項即可移除對應分組 |
| 關於頁第三方服務區塊 | AboutModal | 刪除不使用的服務項目 |

> 💡 裁剪文檔時，記得同步 `express-project/routes/docs.js` 的 `DOC_ITEMS` 清單與 [OVERVIEW.md](OVERVIEW_zh-Hant.md)、`README.md` 的文檔索引，避免站點出現無法存取的文檔入口。

---

## 六、上線前自查清單（品牌與合規）

- 站點名稱、標題、PWA 清單已換成自己的品牌
- Logo、預設頭像、佔位圖、favicon 系列、表情貼圖已替換
- 介面可見文案（「小石榴號」、「關於小石榴」、分享文案等）已按需調整
- `public/logo.ico` 已補齊或刪除引用
- 郵件模板與寄件人名稱已修改
- 關於頁保留原作者署名，並註明「二次開發」，頁尾版權行已更新
- 已按 AGPL-3.0 第 13 條，為線上訪客提供獲取完整原始碼的入口
- 不再使用的第三方服務相關內容已從關於頁移除
- 程式碼註解與倉庫連結中的作者資訊已替換（署名部分保留）
- 管理員預設密碼已修改（見[部署指南](DEPLOYMENT_zh-Hant.md)）

---

## 七、常見問題

**Q：只改介面文案、不改資料庫欄位，可以嗎？**
可以。「小石榴號」等術語只是 `user_id` 欄位的顯示名稱，僅調整前端文案不影響資料。若要連欄位術語一起更換，需同步後端提示語、檢測腳本與文檔，改動面較大。

**Q：可以不保留原作者資訊嗎？**
不可以。AGPL-3.0 要求保留版權與授權聲明，請至少在關於頁與 `LICENSE` 中保留原作者署名，並註明你的修改。

**Q：我的站點需要公開原始碼嗎？**
如果你修改後的版本對外提供網路服務，需要按 AGPL-3.0 第 13 條向使用者提供獲取完整對應原始碼的途徑；純內部自用而不對外服務時通常不受此約束，具體請以協議原文為準。

**Q：換 Logo 後圖片不顯示？**
檢查檔名是否與引用路徑一致。`小石榴.png` 被多個元件按檔名引用，直接替換同名檔案最省事；改名則需同步更新所有引用處。

---

> 相關文檔：[部署指南](DEPLOYMENT_zh-Hant.md) · [項目結構](PROJECT_STRUCTURE_zh-Hant.md) · [接口文檔](API_DOCS_zh-Hant.md) · [資料庫設計](DATABASE_DESIGN_zh-Hant.md)
