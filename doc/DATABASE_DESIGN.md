# 图文社区项目数据库设计

## 概述

基于小石榴风格的图文社区项目，简化版数据库结构设计，包含用户管理、内容发布、社交互动等核心功能。

### 字符集和排序规则

- 数据库字符集：`utf8mb4`
- 排序规则：`utf8mb4_unicode_ci`
- 存储引擎：`InnoDB`

## 核心数据表结构

### 1. 用户表 (users)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 用户ID | 主键，自增 |
| password | VARCHAR(255) | 密码 | 可为空 |
| user_id | VARCHAR(50) | 小石榴号 | 唯一标识 |
| nickname | VARCHAR(100) | 昵称 | 显示名称 |
| avatar | VARCHAR(500) | 头像URL | 用户头像 |
| bio | TEXT | 个人简介 | 用户介绍 |
| location | VARCHAR(100) | IP属地 | 地理位置 |
| follow_count | INT | 关注数 | 统计字段，默认0 |
| fans_count | INT | 粉丝数 | 统计字段，默认0 |
| like_count | INT | 获赞数 | 统计字段，默认0 |
| is_active | TINYINT(1) | 是否激活 | 默认1 |
| last_login_at | TIMESTAMP | 最后登录时间 | 可为空 |
| created_at | TIMESTAMP | 创建时间 | 注册时间 |
| updated_at | TIMESTAMP | 更新时间 | 自动更新 |
| gender | VARCHAR(10) | 性别 | 可为空 |
| zodiac_sign | VARCHAR(20) | 星座 | 可为空 |
| mbti | VARCHAR(4) | MBTI人格类型 | 可为空 |
| education | VARCHAR(50) | 学历 | 可为空 |
| major | VARCHAR(100) | 专业 | 可为空 |
| interests | JSON | 兴趣爱好 | JSON数组，可为空 |

### 2. 笔记表 (posts)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 笔记ID | 主键，自增 |
| user_id | BIGINT | 发布用户ID | 外键关联users |
| title | VARCHAR(200) | 标题 | 笔记标题 |
| content | TEXT | 内容 | 笔记描述 |
| category | VARCHAR(50) | 分类 | 如：穿搭、美食等，可为空 |
| is_draft | TINYINT(1) | 是否为草稿 | 1-草稿，0-已发布，默认1 |
| view_count | BIGINT | 浏览量 | 统计字段，默认0 |
| like_count | INT | 点赞数 | 统计字段，默认0 |
| collect_count | INT | 收藏数 | 统计字段，默认0 |
| comment_count | INT | 评论数 | 统计字段，默认0 |
| created_at | TIMESTAMP | 发布时间 | 创建时间 |

### 3. 笔记图片表 (post_images)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 图片ID | 主键，自增 |
| post_id | BIGINT | 笔记ID | 外键关联posts |
| image_url | VARCHAR(500) | 图片URL | 原图地址 |

### 4. 标签表 (tags)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | INT | 标签ID | 主键，自增 |
| name | VARCHAR(50) | 标签名 | 标签内容，唯一 |
| use_count | INT | 使用次数 | 热度统计，默认0 |
| created_at | TIMESTAMP | 创建时间 | 首次使用时间 |

### 5. 笔记标签关联表 (post_tags)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 关联ID | 主键，自增 |
| post_id | BIGINT | 笔记ID | 外键关联posts |
| tag_id | INT | 标签ID | 外键关联tags |
| created_at | TIMESTAMP | 创建时间 | 关联时间 |

### 6. 关注关系表 (follows)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 关注ID | 主键，自增 |
| follower_id | BIGINT | 关注者ID | 外键关联users |
| following_id | BIGINT | 被关注者ID | 外键关联users |
| created_at | TIMESTAMP | 关注时间 | 创建时间 |

### 7. 点赞表 (likes)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 点赞ID | 主键，自增 |
| user_id | BIGINT | 用户ID | 外键关联users |
| target_type | TINYINT | 目标类型 | 1-笔记, 2-评论 |
| target_id | BIGINT | 目标ID | 笔记或评论ID |
| created_at | TIMESTAMP | 点赞时间 | 创建时间 |

### 8. 收藏表 (collections)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 收藏ID | 主键，自增 |
| user_id | BIGINT | 用户ID | 外键关联users |
| post_id | BIGINT | 笔记ID | 外键关联posts |
| created_at | TIMESTAMP | 收藏时间 | 创建时间 |

### 9. 评论表 (comments)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 评论ID | 主键，自增 |
| post_id | BIGINT | 笔记ID | 外键关联posts |
| user_id | BIGINT | 评论用户ID | 外键关联users |
| parent_id | BIGINT | 父评论ID | 回复评论时使用，可为空 |
| content | TEXT | 评论内容 | 评论文本 |
| like_count | INT | 点赞数 | 统计字段，默认0 |
| created_at | TIMESTAMP | 评论时间 | 创建时间 |

### 10. 通知表 (notifications)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 通知ID | 主键，自增 |
| user_id | BIGINT | 接收用户ID | 外键关联users |
| sender_id | BIGINT | 发送用户ID | 外键关联users |
| type | TINYINT | 通知类型 | 1-点赞, 2-评论, 3-关注 |
| title | VARCHAR(200) | 通知标题 | 通知内容 |
| target_id | BIGINT | 关联目标ID | 笔记或评论ID，可为空 |
| comment_id | BIGINT | 关联评论ID | 用于评论和回复通知，可为空 |
| is_read | TINYINT(1) | 是否已读 | 默认0 |
| created_at | TIMESTAMP | 通知时间 | 创建时间 |



### 11. 用户会话表 (user_sessions)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 会话ID | 主键，自增 |
| user_id | BIGINT | 用户ID | 外键关联users |
| token | VARCHAR(255) | 访问令牌 | 唯一 |
| refresh_token | VARCHAR(255) | 刷新令牌 | 可为空 |
| expires_at | TIMESTAMP | 过期时间 | 令牌过期时间 |
| user_agent | TEXT | 用户代理 | 浏览器信息，可为空 |
| is_active | TINYINT(1) | 是否激活 | 默认1 |
| created_at | TIMESTAMP | 创建时间 | 会话创建时间 |
| updated_at | TIMESTAMP | 更新时间 | 自动更新 |

### 12. 管理员表 (admin)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 管理员ID | 主键，自增 |
| username | VARCHAR(50) | 管理员用户名 | 唯一 |
| password | VARCHAR(255) | 管理员密码 | 加密存储 |
| created_at | TIMESTAMP | 创建时间 | 账号创建时间 |

