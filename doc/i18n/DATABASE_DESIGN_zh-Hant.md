# 圖文社區項目資料庫設計

## 概述

基於小石榴風格的圖文社區項目，簡化版資料庫結構設計，包含使用者管理、內容發佈、社交互動等核心功能。

### 字元集和排序規則

- 資料庫字元集：`utf8mb4`
- 排序規則：`utf8mb4_unicode_ci`
- 儲存引擎：`InnoDB`

## 核心資料表結構

### 1. 使用者表 (users)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 使用者ID | 主鍵，自增 |
| password | VARCHAR(255) | 密碼 | 可為空 |
| user_id | VARCHAR(50) | 小石榴號 | 唯一標識 |
| email | VARCHAR(100) | 郵箱 | 可選，可為空 |
| nickname | VARCHAR(100) | 暱稱 | 顯示名稱 |
| avatar | VARCHAR(500) | 頭像URL | 使用者頭像 |
| bio | TEXT | 個人簡介 | 使用者介紹 |
| location | VARCHAR(100) | IP屬地 | 地理位置 |
| follow_count | INT | 關注數 | 統計欄位，預設0 |
| fans_count | INT | 粉絲數 | 統計欄位，預設0 |
| like_count | INT | 獲讚數 | 統計欄位，預設0 |
| is_active | TINYINT(1) | 是否啟用 | 預設1 |
| last_login_at | TIMESTAMP | 最後登入時間 | 可為空 |
| created_at | TIMESTAMP | 建立時間 | 註冊時間 |
| updated_at | TIMESTAMP | 更新時間 | 自動更新 |
| gender | VARCHAR(10) | 性別 | 可為空 |
| zodiac_sign | VARCHAR(20) | 星座 | 可為空 |
| mbti | VARCHAR(4) | MBTI人格類型 | 可為空 |
| education | VARCHAR(50) | 學歷 | 可為空 |
| major | VARCHAR(100) | 專業 | 可為空 |
| interests | JSON | 興趣愛好 | JSON陣列，可為空 |
| verified | TINYINT(1) | 認證狀態 | 0-未認證，1-已認證，預設0 |

### 2. 分類表 (categories)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | INT | 分類ID | 主鍵，自增 |
| name | VARCHAR(50) | 分類名稱 | 唯一，如：學習、校園、情感等 |
| category_title | VARCHAR(50) | 英文標題 | 唯一，用於URL路由，如：study、campus、emotion等 |
| created_at | TIMESTAMP | 建立時間 | 分類建立時間 |

**索引：**
- PRIMARY KEY (`id`)
- UNIQUE KEY `name` (`name`)
- KEY `idx_name` (`name`)

**初始資料：**
- 學習
- 校園
- 情感
- 興趣
- 生活
- 社交
- 幫助
- 觀點
- 畢業
- 職場

### 3. 筆記表 (posts)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 筆記ID | 主鍵，自增 |
| user_id | BIGINT | 發佈使用者ID | 外鍵關聯users |
| title | VARCHAR(200) | 標題 | 筆記標題 |
| content | TEXT | 內容 | 筆記描述 |
| category_id | INT | 分類ID | 外鍵關聯categories表，可為空 |
| is_draft | TINYINT(1) | 是否為草稿 | 1-草稿，0-已發佈，預設1 |
| view_count | BIGINT | 瀏覽量 | 統計欄位，預設0 |
| like_count | INT | 按讚數 | 統計欄位，預設0 |
| collect_count | INT | 收藏數 | 統計欄位，預設0 |
| comment_count | INT | 評論數 | 統計欄位，預設0 |
| created_at | TIMESTAMP | 發佈時間 | 建立時間 |

### 3. 筆記圖片表 (post_images)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 圖片ID | 主鍵，自增 |
| post_id | BIGINT | 筆記ID | 外鍵關聯posts |
| image_url | VARCHAR(500) | 圖片URL | 原圖地址 |

### 4. 標籤表 (tags)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | INT | 標籤ID | 主鍵，自增 |
| name | VARCHAR(50) | 標籤名 | 標籤內容，唯一 |
| use_count | INT | 使用次數 | 熱度統計，預設0 |
| created_at | TIMESTAMP | 建立時間 | 首次使用時間 |

### 5. 筆記標籤關聯表 (post_tags)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 關聯ID | 主鍵，自增 |
| post_id | BIGINT | 筆記ID | 外鍵關聯posts |
| tag_id | INT | 標籤ID | 外鍵關聯tags |
| created_at | TIMESTAMP | 建立時間 | 關聯時間 |

### 6. 關注關係表 (follows)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 關注ID | 主鍵，自增 |
| follower_id | BIGINT | 關注者ID | 外鍵關聯users |
| following_id | BIGINT | 被關注者ID | 外鍵關聯users |
| created_at | TIMESTAMP | 關注時間 | 建立時間 |

### 7. 按讚表 (likes)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 按讚ID | 主鍵，自增 |
| user_id | BIGINT | 使用者ID | 外鍵關聯users |
| target_type | TINYINT | 目標類型 | 1-筆記, 2-評論 |
| target_id | BIGINT | 目標ID | 筆記或評論ID |
| created_at | TIMESTAMP | 按讚時間 | 建立時間 |

### 8. 收藏表 (collections)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 收藏ID | 主鍵，自增 |
| user_id | BIGINT | 使用者ID | 外鍵關聯users |
| post_id | BIGINT | 筆記ID | 外鍵關聯posts |
| created_at | TIMESTAMP | 收藏時間 | 建立時間 |

### 9. 評論表 (comments)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 評論ID | 主鍵，自增 |
| post_id | BIGINT | 筆記ID | 外鍵關聯posts |
| user_id | BIGINT | 評論使用者ID | 外鍵關聯users |
| parent_id | BIGINT | 父評論ID | 回覆評論時使用，可為空 |
| content | TEXT | 評論內容 | 評論文字 |
| like_count | INT | 按讚數 | 統計欄位，預設0 |
| created_at | TIMESTAMP | 評論時間 | 建立時間 |

### 10. 通知表 (notifications)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 通知ID | 主鍵，自增 |
| user_id | BIGINT | 接收使用者ID | 外鍵關聯users |
| sender_id | BIGINT | 發送使用者ID | 外鍵關聯users |
| type | TINYINT | 通知類型 | 1-按讚筆記, 2-按讚評論, 3-收藏, 4-評論筆記, 5-回覆評論, 6-關注, 7-評論提及, 8-筆記提及 |
| title | VARCHAR(200) | 通知標題 | 通知內容 |
| target_id | BIGINT | 關聯目標ID | 筆記或評論ID，可為空 |
| comment_id | BIGINT | 關聯評論ID | 用於評論和回覆通知，可為空 |
| is_read | TINYINT(1) | 是否已讀 | 預設0 |
| created_at | TIMESTAMP | 通知時間 | 建立時間 |

### 11. 使用者會話表 (user_sessions)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 會話ID | 主鍵，自增 |
| user_id | BIGINT | 使用者ID | 外鍵關聯users |
| token | VARCHAR(255) | 存取權杖 | 唯一 |
| refresh_token | VARCHAR(255) | 重新整理權杖 | 可為空 |
| expires_at | TIMESTAMP | 過期時間 | 權杖過期時間 |
| user_agent | TEXT | 使用者代理 | 瀏覽器信息，可為空 |
| is_active | TINYINT(1) | 是否啟用 | 預設1 |
| created_at | TIMESTAMP | 建立時間 | 會話建立時間 |
| updated_at | TIMESTAMP | 更新時間 | 自動更新 |

### 12. 管理員表 (admin)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 管理員ID | 主鍵，自增 |
| username | VARCHAR(50) | 管理員使用者名稱 | 唯一 |
| password | VARCHAR(255) | 管理員密碼 | 加密儲存 |
| created_at | TIMESTAMP | 建立時間 | 帳號建立時間 |

### 13. 管理員會話表 (admin_sessions)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 會話ID | 主鍵，自增 |
| admin_id | BIGINT | 管理員ID | 外鍵關聯admin |
| token | VARCHAR(255) | 訪問令牌 | 唯一 |
| refresh_token | VARCHAR(255) | 重新整理令牌 | 可為空 |
| expires_at | TIMESTAMP | 過期時間 | 令牌過期時間 |
| user_agent | TEXT | 使用者代理 | 瀏覽器資訊，可為空 |
| is_active | TINYINT(1) | 是否啟用 | 預設1 |
| created_at | TIMESTAMP | 建立時間 | 會話建立時間 |
| updated_at | TIMESTAMP | 更新時間 | 自動更新 |

### 14. 審核表 (audit)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 審核ID | 主鍵，自增 |
| admin_id | BIGINT | 審核人ID | 外鍵關聯admin，可為空 |
| type | TINYINT | 審核類型 | 1-使用者個人審核，2-企業審核，3-內容審核，4-評論審核 |
| target_id | BIGINT | 目標ID | 根據type不同，對應使用者ID、筆記ID或評論ID |
| content | TEXT | 審核內容 | 待審核的具體內容 |
| remark | TEXT | 審核備註 | 審核人填寫的備註資訊，可為空 |
| created_at | TIMESTAMP | 建立時間 | 提交審核時間 |
| audit_time | TIMESTAMP | 審核時間 | 完成審核時間，可為空 |
| status | TINYINT(1) | 審核狀態 | 0-待審核，1-審核通過，2-審核拒絕，預設0 |

### 15. 使用者封禁表 (user_ban)

| 欄位名 | 類型 | 說明 | 備註 |
|--------|------|------|------|
| id | BIGINT | 封禁記錄ID | 主鍵，自增 |
| user_id | BIGINT | 被封禁使用者ID | 外鍵關聯users |
| reason | VARCHAR(255) | 封禁原因 | 封禁理由描述 |
| end_time | TIMESTAMP | 封禁結束時間 | 可為空（永久封禁） |
| created_at | TIMESTAMP | 建立時間 | 封禁記錄建立時間 |
| status | INT | 狀態 | 0-封禁中，1-管理員解封，2-自動解封，3-永久封禁，4-封禁撤銷 |
| operator | BIGINT | 操作人ID | 0-系統，其他為管理員ID |

**索引：**
- PRIMARY KEY (`id`)
- KEY `idx_user_id` (`user_id`)
- KEY `idx_status` (`status`)

---

*最後更新: 2026年2月27日*
*資料庫版本: 1.0.4*