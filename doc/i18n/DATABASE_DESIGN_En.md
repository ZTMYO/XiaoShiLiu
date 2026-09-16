# Database Design

## Overview

Database name `xiaoshiliu`, 18 tables in total, covering users, content, social interactions, and audit management. Table order and numbering match [`init-database.sql`](../../express-project/scripts/init-database.sql); change the SQL first, then sync this document.

- Character set: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`
- Storage engine: `InnoDB`
- Update time: 2026-09-16

## 1. Users Table (users)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| password | VARCHAR(255) | Password, nullable |
| user_id | VARCHAR(50) | XiaoShiLiu ID, unique |
| nickname | VARCHAR(100) | Nickname |
| email | VARCHAR(100) | Email, nullable |
| avatar | VARCHAR(500) | Avatar URL |
| bio | TEXT | Personal bio |
| location | VARCHAR(100) | IP location |
| follow_count | INT | Following count, default 0 |
| fans_count | INT | Follower count, default 0 |
| like_count | INT | Likes received, default 0 |
| is_active | TINYINT(1) | Active flag, default 1 |
| last_login_at | TIMESTAMP | Last login time, nullable |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Update time, auto-update |
| gender | VARCHAR(10) | Gender, nullable |
| zodiac_sign | VARCHAR(20) | Zodiac sign, nullable |
| mbti | VARCHAR(4) | MBTI personality type, nullable |
| education | VARCHAR(50) | Education, nullable |
| major | VARCHAR(100) | Major, nullable |
| interests | JSON | Interests (JSON array), nullable |
| verified | TINYINT(1) | Verification status: 0-unverified, 1-verified, default 0 |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY user_id(user_id)`, `KEY idx_user_id(user_id)`, `KEY idx_email(email)`, `KEY idx_created_at(created_at)`

## 2. Admin Table (admin)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| username | VARCHAR(50) | Admin username, unique |
| password | VARCHAR(255) | Admin password, encrypted |
| created_at | TIMESTAMP | Creation time |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY username(username)`, `KEY idx_admin_username(username)`

## 3. Categories Table (categories)

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR(50) | Category name, unique |
| category_title | VARCHAR(50) | Category slug used in URL paths, nullable |
| created_at | TIMESTAMP | Creation time |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY name(name)`, `UNIQUE KEY uk_category_title(category_title)`

**Initial categories:** Study(study), Campus(campus), Emotion(emotion), Interest(interest), Life(life), Social(social), Help(help), Opinion(opinion), Graduation(graduation), Career(career)

## 4. Posts Table (posts)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | Publisher user ID, foreign key to users |
| title | VARCHAR(200) | Title |
| content | TEXT | Content |
| category_id | INT | Category ID, foreign key to categories, nullable |
| type | INT | Post type: 1-image post, 2-video post, default 1 |
| view_count | BIGINT | View count, default 0 |
| like_count | INT | Like count, default 0 |
| collect_count | INT | Collection count, default 0 |
| comment_count | INT | Comment count, default 0 |
| created_at | TIMESTAMP | Publish time |
| status | TINYINT(1) | Post status: 0-published (approved), 1-draft, 2-pending review, default 2 |

**Indexes:** `PRIMARY KEY(id)`, `KEY idx_user_id(user_id)`, `KEY idx_category_id(category_id)`, `KEY idx_created_at(created_at)`, `KEY idx_like_count(like_count)`, `KEY idx_category_id_created_at(category_id, created_at)`

**Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `category_id` → `categories(id)` ON DELETE SET NULL

## 5. Post Images Table (post_images)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| post_id | BIGINT | Post ID, foreign key to posts |
| image_url | VARCHAR(500) | Image URL |
| description | VARCHAR(500) | Image description, nullable |

**Indexes:** `PRIMARY KEY(id)`, `KEY idx_post_id(post_id)`

**Foreign keys:** `post_id` → `posts(id)` ON DELETE CASCADE

## 6. Post Videos Table (post_videos)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| post_id | BIGINT | Post ID, foreign key to posts |
| cover_url | VARCHAR(500) | Video cover URL, nullable |
| video_url | VARCHAR(500) | Video URL |

**Indexes:** `PRIMARY KEY(id)`, `KEY idx_post_id(post_id)`

**Foreign keys:** `post_id` → `posts(id)` ON DELETE CASCADE

## 7. Tags Table (tags)

| Field | Type | Description |
|-------|------|-------------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR(50) | Tag name, unique |
| use_count | INT | Usage count, default 0 |
| created_at | TIMESTAMP | Creation time |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY name(name)`, `KEY idx_name(name)`, `KEY idx_use_count(use_count)`

## 8. Post Tags Table (post_tags)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| post_id | BIGINT | Post ID, foreign key to posts |
| tag_id | INT | Tag ID, foreign key to tags |
| created_at | TIMESTAMP | Creation time |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY uk_post_tag(post_id, tag_id)`, `KEY idx_post_id(post_id)`, `KEY idx_tag_id(tag_id)`

**Foreign keys:** `post_id` → `posts(id)` ON DELETE CASCADE; `tag_id` → `tags(id)` ON DELETE CASCADE

## 9. Follows Table (follows)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| follower_id | BIGINT | Follower ID, foreign key to users |
| following_id | BIGINT | Followed user ID, foreign key to users |
| created_at | TIMESTAMP | Follow time |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY uk_follow(follower_id, following_id)`, `KEY idx_follower_id(follower_id)`, `KEY idx_following_id(following_id)`

**Foreign keys:** `follower_id` → `users(id)` ON DELETE CASCADE; `following_id` → `users(id)` ON DELETE CASCADE

## 10. Likes Table (likes)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | User ID, foreign key to users |
| target_type | TINYINT | Target type: 1-post, 2-comment |
| target_id | BIGINT | Target ID, post or comment ID |
| created_at | TIMESTAMP | Like time |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY uk_user_target(user_id, target_type, target_id)`, `KEY idx_user_id(user_id)`, `KEY idx_target(target_type, target_id)`

**Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE

## 11. Collections Table (collections)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | User ID, foreign key to users |
| post_id | BIGINT | Post ID, foreign key to posts |
| created_at | TIMESTAMP | Collection time |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY uk_user_post(user_id, post_id)`, `KEY idx_user_id(user_id)`, `KEY idx_post_id(post_id)`

**Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `post_id` → `posts(id)` ON DELETE CASCADE

## 12. Comments Table (comments)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| post_id | BIGINT | Post ID, foreign key to posts |
| user_id | BIGINT | Commenter user ID, foreign key to users |
| parent_id | BIGINT | Parent comment ID, used for replies, nullable |
| content | TEXT | Comment content |
| like_count | INT | Like count, default 0 |
| is_pinned | TINYINT(1) | Pinned flag: 0-no, 1-yes, default 0 |
| created_at | TIMESTAMP | Comment time |

**Indexes:** `PRIMARY KEY(id)`, `KEY idx_post_id(post_id)`, `KEY idx_user_id(user_id)`, `KEY idx_parent_id(parent_id)`, `KEY idx_created_at(created_at)`

**Foreign keys:** `post_id` → `posts(id)` ON DELETE CASCADE; `user_id` → `users(id)` ON DELETE CASCADE; `parent_id` → `comments(id)` ON DELETE CASCADE

## 13. Notifications Table (notifications)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | Recipient user ID, foreign key to users |
| sender_id | BIGINT | Sender user ID, foreign key to users |
| type | TINYINT | Notification type: 1-like, 2-comment, 3-follow |
| title | VARCHAR(200) | Notification title |
| target_id | BIGINT | Related target ID, nullable |
| comment_id | BIGINT | Related comment ID, used for comment and reply notifications, nullable |
| is_read | TINYINT(1) | Read flag, default 0 |
| created_at | TIMESTAMP | Notification time |

**Indexes:** `PRIMARY KEY(id)`, `KEY idx_user_id(user_id)`, `KEY idx_sender_id(sender_id)`, `KEY idx_type(type)`, `KEY idx_is_read(is_read)`, `KEY idx_user_read(user_id, is_read)`, `KEY idx_created_at(created_at)`, `KEY idx_notifications_comment_id(comment_id)`

**Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE; `sender_id` → `users(id)` ON DELETE CASCADE; `comment_id` → `comments(id)` ON DELETE CASCADE

## 14. User Sessions Table (user_sessions)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | User ID, foreign key to users |
| token | VARCHAR(255) | Access token, unique |
| refresh_token | VARCHAR(255) | Refresh token, nullable |
| expires_at | TIMESTAMP | Expiration time |
| user_agent | TEXT | User agent, nullable |
| is_active | TINYINT(1) | Active flag, default 1 |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Update time, auto-update |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY token(token)`, `KEY idx_user_id(user_id)`, `KEY idx_token(token)`, `KEY idx_expires_at(expires_at)`

**Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE

## 15. Admin Sessions Table (admin_sessions)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| admin_id | BIGINT | Admin ID, foreign key to admin |
| token | VARCHAR(255) | Access token, unique |
| refresh_token | VARCHAR(255) | Refresh token, nullable |
| expires_at | TIMESTAMP | Expiration time |
| user_agent | TEXT | User agent, nullable |
| is_active | TINYINT(1) | Active flag, default 1 |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Update time, auto-update |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY token(token)`, `KEY idx_admin_id(admin_id)`, `KEY idx_token(token)`, `KEY idx_expires_at(expires_at)`

**Foreign keys:** `admin_id` → `admin(id)` ON DELETE CASCADE

## 16. Audit Table (audit)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| admin_id | BIGINT | Auditor admin ID, foreign key to admin, nullable |
| type | TINYINT | Audit type: 1-personal verification, 2-official verification, 3-content audit, 4-comment audit |
| target_id | BIGINT | Target ID; maps to a user, post, or comment ID depending on type |
| remark | TEXT | Audit remark, nullable |
| created_at | TIMESTAMP | Submission time |
| audit_time | TIMESTAMP | Completion time, nullable |
| status | TINYINT(1) | Audit status: 0-pending, 1-approved, 2-rejected, default 0 |

**Indexes:** `PRIMARY KEY(id)`, `KEY idx_admin_id(admin_id)`, `KEY idx_type(type)`, `KEY idx_target_id(target_id)`, `KEY idx_status(status)`, `KEY idx_created_at(created_at)`, `KEY idx_type_target(type, target_id)`

**Foreign keys:** `admin_id` → `admin(id)` ON DELETE SET NULL

## 17. User Verification Table (user_verification)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | User ID, foreign key to users, unique (one record per user) |
| type | TINYINT | Verification type: 1=official, 2=personal |
| status | TINYINT | Verification status: 0=pending, 1=approved, 2=rejected, default 0 |
| real_name | VARCHAR(200) | Personal=real name; official=organization full name |
| id_card | VARCHAR(18) | Personal=ID card number; official=unified social credit code |
| contact_name | VARCHAR(50) | Contact name, optional for personal, required for official |
| contact_phone | VARCHAR(20) | Contact phone, optional for personal, required for official |
| title | VARCHAR(100) | Verification title, personal=occupation/identity; official=organization title |
| description | TEXT | Verification reason, nullable |
| created_at | TIMESTAMP | Creation time |

**Indexes:** `PRIMARY KEY(id)`, `UNIQUE KEY uk_user_id(user_id)`, `KEY idx_type(type)`, `KEY idx_status(status)`

**Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE

**Notes:** Verification status is kept in sync with the audit table for fast lookups; submitting an application writes an audit record with type=1/2 whose target_id references this table's id; once the audit completes, this table's status is updated.

## 18. User Ban Table (user_ban)

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | Banned user ID, foreign key to users |
| reason | TEXT | Ban reason |
| end_time | TIMESTAMP | Ban end time, nullable (permanent ban) |
| created_at | TIMESTAMP | Creation time |
| status | TINYINT | Status: 0-banned, 1-unbanned by admin, 2-auto unbanned, 3-permanent ban, 4-ban revoked, default 0 |
| operator | BIGINT | Operator ID, 0=system, other values are admin IDs |

**Indexes:** `PRIMARY KEY(id)`, `KEY idx_user_id(user_id)`, `KEY idx_status(status)`, `KEY idx_created_at(created_at)`, `KEY idx_operator(operator)`

**Foreign keys:** `user_id` → `users(id)` ON DELETE CASCADE
