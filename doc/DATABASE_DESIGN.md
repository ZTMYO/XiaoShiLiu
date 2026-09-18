# 数据库设计

## 概述

数据库名 `xiaoshiliu`，共 18 张表，覆盖用户、内容、社交互动与审核管理。表顺序与编号与 [`init-database.sql`](../express-project/scripts/init-database.sql) 保持一致，字段变更请先改 SQL 再同步本文档。

- 字符集：`utf8mb4`
- 排序规则：`utf8mb4_unicode_ci`
- 存储引擎：`InnoDB`
- 更新时间：2026-09-19

## 1. 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| password | VARCHAR(255) | 密码，可为空 |
| user_id | VARCHAR(50) | 小石榴号，唯一 |
| nickname | VARCHAR(100) | 昵称 |
| email | VARCHAR(100) | 邮箱，可为空 |
| avatar | VARCHAR(500) | 头像 URL |
| bio | TEXT | 个人简介 |
| location | VARCHAR(100) | IP 属地 |
| follow_count | INT | 关注数，默认 0 |
| fans_count | INT | 粉丝数，默认 0 |
| like_count | INT | 获赞数，默认 0 |
| is_active | TINYINT(1) | 是否激活，默认 1 |
| last_login_at | TIMESTAMP | 最后登录时间，可为空 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间，自动更新 |
| gender | VARCHAR(10) | 性别，可为空 |
| zodiac_sign | VARCHAR(20) | 星座，可为空 |
| mbti | VARCHAR(4) | MBTI 人格类型，可为空 |
| education | VARCHAR(50) | 学历，可为空 |
| major | VARCHAR(100) | 专业，可为空 |
| interests | JSON | 兴趣爱好（JSON 数组），可为空 |
| verified | TINYINT(1) | 认证状态：0-未认证，1-已认证，默认 0 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY user_id(user_id)`、`KEY idx_user_id(user_id)`、`KEY idx_email(email)`、`KEY idx_created_at(created_at)`

## 2. 管理员表 (admin)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| username | VARCHAR(50) | 管理员用户名，唯一 |
| password | VARCHAR(255) | 管理员密码，加密存储 |
| created_at | TIMESTAMP | 创建时间 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY username(username)`、`KEY idx_admin_username(username)`

## 3. 分类表 (categories)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(50) | 分类名称，唯一 |
| category_title | VARCHAR(50) | 分类英文标题，用于 URL 路径，可为空 |
| created_at | TIMESTAMP | 创建时间 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY name(name)`、`UNIQUE KEY uk_category_title(category_title)`

**初始分类：** 学习(study)、校园(campus)、情感(emotion)、兴趣(interest)、生活(life)、社交(social)、求助(help)、观点(opinion)、毕业(graduation)、职场(career)

## 4. 笔记表 (posts)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| user_id | BIGINT | 发布用户 ID，外键关联 users |
| title | VARCHAR(200) | 标题 |
| content | TEXT | 内容 |
| category_id | INT | 分类 ID，外键关联 categories，可为空 |
| type | INT | 笔记类型：1-图片笔记，2-视频笔记，默认 1 |
| view_count | BIGINT | 浏览量，默认 0 |
| like_count | INT | 点赞数，默认 0 |
| collect_count | INT | 收藏数，默认 0 |
| comment_count | INT | 评论数，默认 0 |
| created_at | TIMESTAMP | 发布时间 |
| status | TINYINT(1) | 笔记状态：0-发布（审核通过），1-草稿，2-待审核，3-未过审，默认 2 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_user_id(user_id)`、`KEY idx_category_id(category_id)`、`KEY idx_created_at(created_at)`、`KEY idx_like_count(like_count)`、`KEY idx_category_id_created_at(category_id, created_at)`

**外键：** `user_id` → `users(id)` ON DELETE CASCADE；`category_id` → `categories(id)` ON DELETE SET NULL

## 5. 笔记图片表 (post_images)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| post_id | BIGINT | 笔记 ID，外键关联 posts |
| image_url | VARCHAR(500) | 图片 URL |
| description | VARCHAR(500) | 图片描述，可为空 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_post_id(post_id)`

**外键：** `post_id` → `posts(id)` ON DELETE CASCADE

## 6. 笔记视频表 (post_videos)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| post_id | BIGINT | 笔记 ID，外键关联 posts |
| cover_url | VARCHAR(500) | 视频封面 URL，可为空 |
| video_url | VARCHAR(500) | 视频 URL |

**索引：** `PRIMARY KEY(id)`、`KEY idx_post_id(post_id)`

**外键：** `post_id` → `posts(id)` ON DELETE CASCADE

## 7. 标签表 (tags)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(50) | 标签名，唯一 |
| use_count | INT | 使用次数，默认 0 |
| created_at | TIMESTAMP | 创建时间 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY name(name)`、`KEY idx_name(name)`、`KEY idx_use_count(use_count)`

## 8. 笔记标签关联表 (post_tags)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| post_id | BIGINT | 笔记 ID，外键关联 posts |
| tag_id | INT | 标签 ID，外键关联 tags |
| created_at | TIMESTAMP | 创建时间 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_post_tag(post_id, tag_id)`、`KEY idx_post_id(post_id)`、`KEY idx_tag_id(tag_id)`

**外键：** `post_id` → `posts(id)` ON DELETE CASCADE；`tag_id` → `tags(id)` ON DELETE CASCADE

## 9. 关注关系表 (follows)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| follower_id | BIGINT | 关注者 ID，外键关联 users |
| following_id | BIGINT | 被关注者 ID，外键关联 users |
| created_at | TIMESTAMP | 关注时间 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_follow(follower_id, following_id)`、`KEY idx_follower_id(follower_id)`、`KEY idx_following_id(following_id)`

**外键：** `follower_id` → `users(id)` ON DELETE CASCADE；`following_id` → `users(id)` ON DELETE CASCADE

## 10. 点赞表 (likes)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| user_id | BIGINT | 用户 ID，外键关联 users |
| target_type | TINYINT | 目标类型：1-笔记，2-评论 |
| target_id | BIGINT | 目标 ID，笔记或评论 ID |
| created_at | TIMESTAMP | 点赞时间 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_user_target(user_id, target_type, target_id)`、`KEY idx_user_id(user_id)`、`KEY idx_target(target_type, target_id)`

**外键：** `user_id` → `users(id)` ON DELETE CASCADE

## 11. 收藏表 (collections)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| user_id | BIGINT | 用户 ID，外键关联 users |
| post_id | BIGINT | 笔记 ID，外键关联 posts |
| created_at | TIMESTAMP | 收藏时间 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_user_post(user_id, post_id)`、`KEY idx_user_id(user_id)`、`KEY idx_post_id(post_id)`

**外键：** `user_id` → `users(id)` ON DELETE CASCADE；`post_id` → `posts(id)` ON DELETE CASCADE

## 12. 评论表 (comments)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| post_id | BIGINT | 笔记 ID，外键关联 posts |
| user_id | BIGINT | 评论用户 ID，外键关联 users |
| parent_id | BIGINT | 父评论 ID，回复评论时使用，可为空 |
| content | TEXT | 评论内容 |
| like_count | INT | 点赞数，默认 0 |
| is_pinned | TINYINT(1) | 是否置顶：0-否，1-是，默认 0 |
| status | TINYINT(1) | 评论状态：0-待审核，1-正常显示，2-审核未通过，默认 1 |
| created_at | TIMESTAMP | 评论时间 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_post_id(post_id)`、`KEY idx_user_id(user_id)`、`KEY idx_parent_id(parent_id)`、`KEY idx_status(status)`、`KEY idx_created_at(created_at)`

**外键：** `post_id` → `posts(id)` ON DELETE CASCADE；`user_id` → `users(id)` ON DELETE CASCADE；`parent_id` → `comments(id)` ON DELETE CASCADE

**说明：** 只有 `status=1` 对所有人可见；`status=0/2` 仅评论作者本人可见（`posts.js` / `comments.js` 的列表查询按 `user_id` 放行）。`status=2` 的评论内容会被替换为「违规评论」。`posts.comment_count` 只统计 `status=1` 的评论。

## 13. 通知表 (notifications)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| user_id | BIGINT | 接收用户 ID，外键关联 users |
| sender_id | BIGINT | 发送用户 ID，外键关联 users |
| type | TINYINT | 通知类型：1-点赞，2-评论，3-关注 |
| title | VARCHAR(200) | 通知标题 |
| target_id | BIGINT | 关联目标 ID，可为空 |
| comment_id | BIGINT | 关联评论 ID，用于评论和回复通知，可为空 |
| is_read | TINYINT(1) | 是否已读，默认 0 |
| created_at | TIMESTAMP | 通知时间 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_user_id(user_id)`、`KEY idx_sender_id(sender_id)`、`KEY idx_type(type)`、`KEY idx_is_read(is_read)`、`KEY idx_user_read(user_id, is_read)`、`KEY idx_created_at(created_at)`、`KEY idx_notifications_comment_id(comment_id)`

**外键：** `user_id` → `users(id)` ON DELETE CASCADE；`sender_id` → `users(id)` ON DELETE CASCADE；`comment_id` → `comments(id)` ON DELETE CASCADE

## 14. 用户会话表 (user_sessions)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| user_id | BIGINT | 用户 ID，外键关联 users |
| token | VARCHAR(255) | 访问令牌，唯一 |
| refresh_token | VARCHAR(255) | 刷新令牌，可为空 |
| expires_at | TIMESTAMP | 过期时间 |
| user_agent | TEXT | 用户代理，可为空 |
| is_active | TINYINT(1) | 是否激活，默认 1 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间，自动更新 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY token(token)`、`KEY idx_user_id(user_id)`、`KEY idx_token(token)`、`KEY idx_expires_at(expires_at)`

**外键：** `user_id` → `users(id)` ON DELETE CASCADE

## 15. 管理员会话表 (admin_sessions)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| admin_id | BIGINT | 管理员 ID，外键关联 admin |
| token | VARCHAR(255) | 访问令牌，唯一 |
| refresh_token | VARCHAR(255) | 刷新令牌，可为空 |
| expires_at | TIMESTAMP | 过期时间 |
| user_agent | TEXT | 用户代理，可为空 |
| is_active | TINYINT(1) | 是否激活，默认 1 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间，自动更新 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY token(token)`、`KEY idx_admin_id(admin_id)`、`KEY idx_token(token)`、`KEY idx_expires_at(expires_at)`

**外键：** `admin_id` → `admin(id)` ON DELETE CASCADE

## 16. 审核表 (audit)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| admin_id | BIGINT | 审核人 ID，外键关联 admin，可为空 |
| type | TINYINT | 审核类型：1-用户个人审核，2-用户官方审核，3-内容审核，4-评论审核 |
| target_id | BIGINT | 目标 ID，按 type 对应用户 ID、笔记 ID 或评论 ID |
| source | TINYINT(1) | 来源：1-发布自检，2-用户举报，3-定时巡检，可为空 |
| remark | TEXT | 审核备注，可为空 |
| created_at | TIMESTAMP | 提交审核时间 |
| audit_time | TIMESTAMP | 完成审核时间，可为空 |
| status | TINYINT(1) | 审核状态：0-待审核，1-审核通过，2-审核拒绝，默认 0 |

**索引：** `PRIMARY KEY(id)`、`KEY idx_admin_id(admin_id)`、`KEY idx_type(type)`、`KEY idx_target_id(target_id)`、`KEY idx_status(status)`、`KEY idx_created_at(created_at)`、`KEY idx_type_target(type, target_id)`

**外键：** `admin_id` → `admin(id)` ON DELETE SET NULL

## 17. 用户认证表 (user_verification)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| user_id | BIGINT | 用户 ID，外键关联 users，唯一（一个用户仅一条认证记录） |
| type | TINYINT | 认证类型：1=官方认证，2=个人认证 |
| status | TINYINT | 认证状态：0=待审核，1=已通过，2=已拒绝，默认 0 |
| real_name | VARCHAR(200) | 个人=真实姓名；官方=机构全称 |
| id_card | VARCHAR(18) | 个人=身份证号；官方=统一社会信用代码 |
| contact_name | VARCHAR(50) | 联系人姓名，个人选填、官方必填 |
| contact_phone | VARCHAR(20) | 联系电话，个人选填、官方必填 |
| title | VARCHAR(100) | 认证称号，个人=职业/身份；官方=机构称号 |
| description | TEXT | 认证理由，可为空 |
| created_at | TIMESTAMP | 创建时间 |

**索引：** `PRIMARY KEY(id)`、`UNIQUE KEY uk_user_id(user_id)`、`KEY idx_type(type)`、`KEY idx_status(status)`

**外键：** `user_id` → `users(id)` ON DELETE CASCADE

**说明：** 认证审核状态与 audit 表保持同步，便于快速查询；提交认证申请时在 audit 表写入 type=1/2 的记录，target_id 关联本表 id；审核完成后回写本表 status。

## 18. 用户封禁表 (user_ban)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| user_id | BIGINT | 被封禁用户 ID，外键关联 users |
| reason | TEXT | 封禁原因 |
| end_time | TIMESTAMP | 封禁结束时间，可为空（永久封禁） |
| created_at | TIMESTAMP | 创建时间 |
| status | TINYINT | 状态：0=封禁中，1=管理员解封，2=自动解封，3=永久封禁，4=封禁撤销，默认 0 |
| operator | BIGINT | 操作人 ID，0=系统，其他为管理员 ID |

**索引：** `PRIMARY KEY(id)`、`KEY idx_user_id(user_id)`、`KEY idx_status(status)`、`KEY idx_created_at(created_at)`、`KEY idx_operator(operator)`

**外键：** `user_id` → `users(id)` ON DELETE CASCADE
