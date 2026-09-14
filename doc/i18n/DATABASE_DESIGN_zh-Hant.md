# 資料庫設計

## 概述

資料庫名 `xiaoshiliu`，共 18 張表，涵蓋使用者、內容、社交互動與審核管理。表順序與編號與 [`init-database.sql`](../../express-project/scripts/init-database.sql) 保持一致，欄位變更請先改 SQL 再同步本文檔。

- 字元集：`utf8mb4`
- 排序規則：`utf8mb4_unicode_ci`
- 儲存引擎：`InnoDB`

## 1. 使用者表 (users)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| password | VARCHAR(255) | 密碼，可為空 |
| user_id | VARCHAR(50) | 小石榴號，唯一 |
| nickname | VARCHAR(100) | 暱稱 |
| email | VARCHAR(100) | 郵箱，可為空 |
| avatar | VARCHAR(500) | 頭像 URL |
| bio | TEXT | 個人簡介 |
| location | VARCHAR(100) | IP 屬地 |
| follow_count | INT | 關注數，預設 0 |
| fans_count | INT | 粉絲數，預設 0 |
| like_count | INT | 獲讚數，預設 0 |
| is_active | TINYINT(1) | 是否啟用，預設 1 |
| last_login_at | TIMESTAMP | 最後登入時間，可為空 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間，自動更新 |
| gender | VARCHAR(10) | 性別，可為空 |
| zodiac_sign | VARCHAR(20) | 星座，可為空 |
| mbti | VARCHAR(4) | MBTI 人格類型，可為空 |
| education | VARCHAR(50) | 學歷，可為空 |
| major | VARCHAR(100) | 專業，可為空 |
| interests | JSON | 興趣愛好（JSON 陣列），可為空 |
| verified | TINYINT(1) | 認證狀態：0-未認證，1-已認證，預設 0 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY user_id(user_id)`、`KEY idx_user_id(user_id)`、`KEY idx_email(email)`、`KEY idx_created_at(created_at)`

## 2. 管理員表 (admin)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| username | VARCHAR(50) | 管理員使用者名，唯一 |
| password | VARCHAR(255) | 管理員密碼，加密儲存 |
| created_at | TIMESTAMP | 建立時間 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY username(username)`、`KEY idx_admin_username(username)`

## 3. 分類表 (categories)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵，自增 |
| name | VARCHAR(50) | 分類名稱，唯一 |
| category_title | VARCHAR(50) | 分類英文標題，用於 URL 路徑，可為空 |
| created_at | TIMESTAMP | 建立時間 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY name(name)`、`UNIQUE KEY uk_category_title(category_title)`

**初始分類：** 學習(study)、校園(campus)、情感(emotion)、興趣(interest)、生活(life)、社交(social)、求助(help)、觀點(opinion)、畢業(graduation)、職場(career)

## 4. 筆記表 (posts)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| user_id | BIGINT | 發佈使用者 ID，外鍵關聯 users |
| title | VARCHAR(200) | 標題 |
| content | TEXT | 內容 |
| category_id | INT | 分類 ID，外鍵關聯 categories，可為空 |
| type | INT | 筆記類型：1-圖片筆記，2-影片筆記，預設 1 |
| view_count | BIGINT | 瀏覽量，預設 0 |
| like_count | INT | 按讚數，預設 0 |
| collect_count | INT | 收藏數，預設 0 |
| comment_count | INT | 評論數，預設 0 |
| created_at | TIMESTAMP | 發佈時間 |
| status | TINYINT(1) | 筆記狀態：0-發佈（審核通過），1-草稿，2-待審核，預設 2 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_user_id(user_id)`、`KEY idx_category_id(category_id)`、`KEY idx_created_at(created_at)`、`KEY idx_like_count(like_count)`、`KEY idx_category_id_created_at(category_id, created_at)`

**外鍵：** `user_id` → `users(id)` ON DELETE CASCADE；`category_id` → `categories(id)` ON DELETE SET NULL

## 5. 筆記圖片表 (post_images)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| post_id | BIGINT | 筆記 ID，外鍵關聯 posts |
| image_url | VARCHAR(500) | 圖片 URL |

**索引：** `PRIMARY KEY(id)`、`KEY idx_post_id(post_id)`

**外鍵：** `post_id` → `posts(id)` ON DELETE CASCADE

## 6. 筆記影片表 (post_videos)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| post_id | BIGINT | 筆記 ID，外鍵關聯 posts |
| cover_url | VARCHAR(500) | 影片封面 URL，可為空 |
| video_url | VARCHAR(500) | 影片 URL |

**索引：** `PRIMARY KEY(id)`、`KEY idx_post_id(post_id)`

**外鍵：** `post_id` → `posts(id)` ON DELETE CASCADE

## 7. 標籤表 (tags)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵，自增 |
| name | VARCHAR(50) | 標籤名，唯一 |
| use_count | INT | 使用次數，預設 0 |
| created_at | TIMESTAMP | 建立時間 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY name(name)`、`KEY idx_name(name)`、`KEY idx_use_count(use_count)`

## 8. 筆記標籤關聯表 (post_tags)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| post_id | BIGINT | 筆記 ID，外鍵關聯 posts |
| tag_id | INT | 標籤 ID，外鍵關聯 tags |
| created_at | TIMESTAMP | 建立時間 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_post_tag(post_id, tag_id)`、`KEY idx_post_id(post_id)`、`KEY idx_tag_id(tag_id)`

**外鍵：** `post_id` → `posts(id)` ON DELETE CASCADE；`tag_id` → `tags(id)` ON DELETE CASCADE

## 9. 關注關係表 (follows)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| follower_id | BIGINT | 關注者 ID，外鍵關聯 users |
| following_id | BIGINT | 被關注者 ID，外鍵關聯 users |
| created_at | TIMESTAMP | 關注時間 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_follow(follower_id, following_id)`、`KEY idx_follower_id(follower_id)`、`KEY idx_following_id(following_id)`

**外鍵：** `follower_id` → `users(id)` ON DELETE CASCADE；`following_id` → `users(id)` ON DELETE CASCADE

## 10. 按讚表 (likes)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| user_id | BIGINT | 使用者 ID，外鍵關聯 users |
| target_type | TINYINT | 目標類型：1-筆記，2-評論 |
| target_id | BIGINT | 目標 ID，筆記或評論 ID |
| created_at | TIMESTAMP | 按讚時間 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_user_target(user_id, target_type, target_id)`、`KEY idx_user_id(user_id)`、`KEY idx_target(target_type, target_id)`

**外鍵：** `user_id` → `users(id)` ON DELETE CASCADE

## 11. 收藏表 (collections)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| user_id | BIGINT | 使用者 ID，外鍵關聯 users |
| post_id | BIGINT | 筆記 ID，外鍵關聯 posts |
| created_at | TIMESTAMP | 收藏時間 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_user_post(user_id, post_id)`、`KEY idx_user_id(user_id)`、`KEY idx_post_id(post_id)`

**外鍵：** `user_id` → `users(id)` ON DELETE CASCADE；`post_id` → `posts(id)` ON DELETE CASCADE

## 12. 評論表 (comments)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| post_id | BIGINT | 筆記 ID，外鍵關聯 posts |
| user_id | BIGINT | 評論使用者 ID，外鍵關聯 users |
| parent_id | BIGINT | 父評論 ID，回覆評論時使用，可為空 |
| content | TEXT | 評論內容 |
| like_count | INT | 按讚數，預設 0 |
| is_pinned | TINYINT(1) | 是否置頂：0-否，1-是，預設 0 |
| created_at | TIMESTAMP | 評論時間 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_post_id(post_id)`、`KEY idx_user_id(user_id)`、`KEY idx_parent_id(parent_id)`、`KEY idx_created_at(created_at)`

**外鍵：** `post_id` → `posts(id)` ON DELETE CASCADE；`user_id` → `users(id)` ON DELETE CASCADE；`parent_id` → `comments(id)` ON DELETE CASCADE

## 13. 通知表 (notifications)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| user_id | BIGINT | 接收使用者 ID，外鍵關聯 users |
| sender_id | BIGINT | 發送使用者 ID，外鍵關聯 users |
| type | TINYINT | 通知類型：1-按讚，2-評論，3-關注 |
| title | VARCHAR(200) | 通知標題 |
| target_id | BIGINT | 關聯目標 ID，可為空 |
| comment_id | BIGINT | 關聯評論 ID，用於評論和回覆通知，可為空 |
| is_read | TINYINT(1) | 是否已讀，預設 0 |
| created_at | TIMESTAMP | 通知時間 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_user_id(user_id)`、`KEY idx_sender_id(sender_id)`、`KEY idx_type(type)`、`KEY idx_is_read(is_read)`、`KEY idx_user_read(user_id, is_read)`、`KEY idx_created_at(created_at)`、`KEY idx_notifications_comment_id(comment_id)`

**外鍵：** `user_id` → `users(id)` ON DELETE CASCADE；`sender_id` → `users(id)` ON DELETE CASCADE；`comment_id` → `comments(id)` ON DELETE CASCADE

## 14. 使用者會話表 (user_sessions)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| user_id | BIGINT | 使用者 ID，外鍵關聯 users |
| token | VARCHAR(255) | 存取權杖，唯一 |
| refresh_token | VARCHAR(255) | 刷新權杖，可為空 |
| expires_at | TIMESTAMP | 過期時間 |
| user_agent | TEXT | 使用者代理，可為空 |
| is_active | TINYINT(1) | 是否啟用，預設 1 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間，自動更新 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY token(token)`、`KEY idx_user_id(user_id)`、`KEY idx_token(token)`、`KEY idx_expires_at(expires_at)`

**外鍵：** `user_id` → `users(id)` ON DELETE CASCADE

## 15. 管理員會話表 (admin_sessions)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| admin_id | BIGINT | 管理員 ID，外鍵關聯 admin |
| token | VARCHAR(255) | 存取權杖，唯一 |
| refresh_token | VARCHAR(255) | 刷新權杖，可為空 |
| expires_at | TIMESTAMP | 過期時間 |
| user_agent | TEXT | 使用者代理，可為空 |
| is_active | TINYINT(1) | 是否啟用，預設 1 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間，自動更新 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY token(token)`、`KEY idx_admin_id(admin_id)`、`KEY idx_token(token)`、`KEY idx_expires_at(expires_at)`

**外鍵：** `admin_id` → `admin(id)` ON DELETE CASCADE

## 16. 審核表 (audit)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| admin_id | BIGINT | 審核人 ID，外鍵關聯 admin，可為空 |
| type | TINYINT | 審核類型：1-使用者個人審核，2-使用者官方審核，3-內容審核，4-評論審核 |
| target_id | BIGINT | 目標 ID，按 type 對應使用者 ID、筆記 ID 或評論 ID |
| remark | TEXT | 審核備註，可為空 |
| created_at | TIMESTAMP | 提交審核時間 |
| audit_time | TIMESTAMP | 完成審核時間，可為空 |
| status | TINYINT(1) | 審核狀態：0-待審核，1-審核通過，2-審核拒絕，預設 0 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_admin_id(admin_id)`、`KEY idx_type(type)`、`KEY idx_target_id(target_id)`、`KEY idx_status(status)`、`KEY idx_created_at(created_at)`、`KEY idx_type_target(type, target_id)`

**外鍵：** `admin_id` → `admin(id)` ON DELETE SET NULL

## 17. 使用者認證表 (user_verification)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| user_id | BIGINT | 使用者 ID，外鍵關聯 users，唯一（一個使用者僅一條認證記錄） |
| type | TINYINT | 認證類型：1=官方認證，2=個人認證 |
| status | TINYINT | 認證狀態：0=待審核，1=已通過，2=已拒絕，預設 0 |
| real_name | VARCHAR(200) | 個人=真實姓名；官方=機構全稱 |
| id_card | VARCHAR(18) | 個人=身分證號；官方=統一社會信用代碼 |
| contact_name | VARCHAR(50) | 聯絡人姓名，個人選填、官方必填 |
| contact_phone | VARCHAR(20) | 聯絡電話，個人選填、官方必填 |
| title | VARCHAR(100) | 認證稱號，個人=職業/身分；官方=機構稱號 |
| description | TEXT | 認證理由，可為空 |
| created_at | TIMESTAMP | 建立時間 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_user_id(user_id)`、`KEY idx_type(type)`、`KEY idx_status(status)`

**外鍵：** `user_id` → `users(id)` ON DELETE CASCADE

**說明：** 認證審核狀態與 audit 表保持同步，便於快速查詢；提交認證申請時在 audit 表寫入 type=1/2 的記錄，target_id 關聯本表 id；審核完成後回寫本表 status。

## 18. 使用者封禁表 (user_ban)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | BIGINT | 主鍵，自增 |
| user_id | BIGINT | 被封禁使用者 ID，外鍵關聯 users |
| reason | TEXT | 封禁原因 |
| end_time | TIMESTAMP | 封禁結束時間，可為空（永久封禁） |
| created_at | TIMESTAMP | 建立時間 |
| status | TINYINT | 狀態：0=封禁中，1=管理員解封，2=自動解封，3=永久封禁，4=封禁撤銷，預設 0 |
| operator | BIGINT | 操作人 ID，0=系統，其他為管理員 ID |

**索引：** `PRIMARY KEY(id)`、`KEY idx_user_id(user_id)`、`KEY idx_status(status)`、`KEY idx_created_at(created_at)`、`KEY idx_operator(operator)`

**外鍵：** `user_id` → `users(id)` ON DELETE CASCADE
