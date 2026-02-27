# Image-Text Community Project Database Design

## Overview

Database structure design for the Xiaoshiliu-style image-text community project (simplified version), including core functionalities such as user management, content publishing, and social interactions.

### Character Set and Collation

- Database Character Set: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`
- Storage Engine: `InnoDB`

## Core Database Table Structure

### 1. Users Table (users)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | User ID | Primary key, auto-increment |
| password | VARCHAR(255) | Password | Nullable |
| user_id | VARCHAR(50) | Xiaoshiliu ID | Unique identifier |
| email | VARCHAR(100) | Email | Optional, nullable |
| nickname | VARCHAR(100) | Nickname | Display name |
| avatar | VARCHAR(500) | Avatar URL | User avatar |
| bio | TEXT | Personal Bio | User introduction |
| location | VARCHAR(100) | IP Location | Geographic location |
| follow_count | INT | Following Count | Statistics field, default 0 |
| fans_count | INT | Followers Count | Statistics field, default 0 |
| like_count | INT | Likes Received | Statistics field, default 0 |
| is_active | TINYINT(1) | Is Active | Default 1 |
| last_login_at | TIMESTAMP | Last Login Time | Nullable |
| created_at | TIMESTAMP | Creation Time | Registration time |
| updated_at | TIMESTAMP | Update Time | Auto-update |
| gender | VARCHAR(10) | Gender | Nullable |
| zodiac_sign | VARCHAR(20) | Zodiac Sign | Nullable |
| mbti | VARCHAR(4) | MBTI Personality Type | Nullable |
| education | VARCHAR(50) | Education | Nullable |
| major | VARCHAR(100) | Major | Nullable |
| interests | JSON | Interests | JSON array, nullable |
| verified | TINYINT(1) | Verification Status | 0-Unverified, 1-Verified, default 0 |

### 2. Categories Table (categories)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | INT | Category ID | Primary key, auto-increment |
| name | VARCHAR(50) | Category Name | Unique, e.g., Study, Campus, Emotion |
| created_at | TIMESTAMP | Creation Time | Category creation time |

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY `name` (`name`)
- KEY `idx_name` (`name`)

**Initial Data:**
- 学习 (Study)
- 校园 (Campus)
- 情感 (Emotion)
- 兴趣 (Interest)
- 生活 (Life)
- 社交 (Social)
- 帮助 (Help)
- 观点 (Opinion)
- 毕业 (Graduation)
- 职场 (Career)

### 3. Posts Table (posts)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Post ID | Primary key, auto-increment |
| user_id | BIGINT | Publisher User ID | Foreign key to users |
| title | VARCHAR(200) | Title | Post title |
| content | TEXT | Content | Post description |
| category_id | INT | Category ID | Foreign key to categories table, nullable |
| is_draft | TINYINT(1) | Is Draft | 1-Draft, 0-Published, default 1 |
| view_count | BIGINT | View Count | Statistics field, default 0 |
| like_count | INT | Like Count | Statistics field, default 0 |
| collect_count | INT | Collection Count | Statistics field, default 0 |
| comment_count | INT | Comment Count | Statistics field, default 0 |
| created_at | TIMESTAMP | Publish Time | Creation time |

### 3. Post Images Table (post_images)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Image ID | Primary key, auto-increment |
| post_id | BIGINT | Post ID | Foreign key to posts |
| image_url | VARCHAR(500) | Image URL | Original image address |

### 4. Tags Table (tags)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | INT | Tag ID | Primary key, auto-increment |
| name | VARCHAR(50) | Tag Name | Tag content, unique |
| use_count | INT | Usage Count | Popularity statistics, default 0 |
| created_at | TIMESTAMP | Creation Time | First usage time |

### 5. Post Tags Association Table (post_tags)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Association ID | Primary key, auto-increment |
| post_id | BIGINT | Post ID | Foreign key to posts |
| tag_id | INT | Tag ID | Foreign key to tags |
| created_at | TIMESTAMP | Creation Time | Association time |

### 6. Follow Relationships Table (follows)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Follow ID | Primary key, auto-increment |
| follower_id | BIGINT | Follower ID | Foreign key to users |
| following_id | BIGINT | Following ID | Foreign key to users |
| created_at | TIMESTAMP | Follow Time | Creation time |

### 7. Likes Table (likes)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Like ID | Primary key, auto-increment |
| user_id | BIGINT | User ID | Foreign key to users |
| target_type | TINYINT | Target Type | 1-Post, 2-Comment |
| target_id | BIGINT | Target ID | Post or comment ID |
| created_at | TIMESTAMP | Like Time | Creation time |

### 8. Collections Table (collections)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Collection ID | Primary key, auto-increment |
| user_id | BIGINT | User ID | Foreign key to users |
| post_id | BIGINT | Post ID | Foreign key to posts |
| created_at | TIMESTAMP | Collection Time | Creation time |

### 9. Comments Table (comments)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Comment ID | Primary key, auto-increment |
| post_id | BIGINT | Post ID | Foreign key to posts |
| user_id | BIGINT | Commenter User ID | Foreign key to users |
| parent_id | BIGINT | Parent Comment ID | Used for reply comments, nullable |
| content | TEXT | Comment Content | Comment text |
| like_count | INT | Like Count | Statistics field, default 0 |
| created_at | TIMESTAMP | Comment Time | Creation time |

### 10. Notifications Table (notifications)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Notification ID | Primary key, auto-increment |
| user_id | BIGINT | Recipient User ID | Foreign key to users |
| sender_id | BIGINT | Sender User ID | Foreign key to users |
| type | TINYINT | Notification Type | 1-Like Post, 2-Like Comment, 3-Collection, 4-Comment Post, 5-Reply Comment, 6-Follow, 7-Comment Mention, 8-Post Mention |
| title | VARCHAR(200) | Notification Title | Notification content |
| target_id | BIGINT | Associated Target ID | Post or comment ID, nullable |
| comment_id | BIGINT | Associated Comment ID | For comment and reply notifications, nullable |
| is_read | TINYINT(1) | Is Read | Default 0 |
| created_at | TIMESTAMP | Notification Time | Creation time |

### 11. User Sessions Table (user_sessions)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Session ID | Primary key, auto-increment |
| user_id | BIGINT | User ID | Foreign key to users |
| token | VARCHAR(255) | Access Token | Unique |
| refresh_token | VARCHAR(255) | Refresh Token | Nullable |
| expires_at | TIMESTAMP | Expiration Time | Token expiration time |
| user_agent | TEXT | User Agent | Browser information, nullable |
| is_active | TINYINT(1) | Is Active | Default 1 |
| created_at | TIMESTAMP | Creation Time | Session creation time |
| updated_at | TIMESTAMP | Update Time | Auto-update |

### 12. Admin Table (admin)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Admin ID | Primary key, auto-increment |
| username | VARCHAR(50) | Admin Username | Unique |
| password | VARCHAR(255) | Admin Password | Encrypted storage |
| created_at | TIMESTAMP | Creation Time | Account creation time |

### 13. Admin Session Table (admin_sessions)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Session ID | Primary key, auto-increment |
| admin_id | BIGINT | Admin ID | Foreign key to admin table |
| token | VARCHAR(255) | Access Token | Unique |
| refresh_token | VARCHAR(255) | Refresh Token | Nullable |
| expires_at | TIMESTAMP | Expiration Time | Token expiration time |
| user_agent | TEXT | User Agent | Browser info, nullable |
| is_active | TINYINT(1) | Is Active | Default 1 |
| created_at | TIMESTAMP | Creation Time | Session creation time |
| updated_at | TIMESTAMP | Update Time | Auto update |

### 14. Audit Table (audit)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Audit ID | Primary key, auto-increment |
| admin_id | BIGINT | Auditor ID | Foreign key to admin table, nullable |
| type | TINYINT | Audit Type | 1-Personal audit, 2-Enterprise audit, 3-Content audit, 4-Comment audit |
| target_id | BIGINT | Target ID | User ID for type 1/2, Post ID for type 3, Comment ID for type 4 |
| content | TEXT | Audit Content | Specific content to be audited |
| remark | TEXT | Audit Remark | Remark filled by auditor, nullable |
| created_at | TIMESTAMP | Creation Time | Time when audit was submitted |
| audit_time | TIMESTAMP | Audit Time | Time when audit was completed, nullable |
| status | TINYINT(1) | Audit Status | 0-Pending, 1-Approved, 2-Rejected |

### 15. User Ban Table (user_ban)

| Field Name | Type | Description | Notes |
|------------|------|-------------|-------|
| id | BIGINT | Ban Record ID | Primary key, auto-increment |
| user_id | BIGINT | Banned User ID | Foreign key to users table |
| reason | VARCHAR(255) | Ban Reason | Reason for the ban |
| end_time | TIMESTAMP | Ban End Time | Nullable (permanent ban) |
| created_at | TIMESTAMP | Creation Time | Ban record creation time |
| status | INT | Status | 0-Banned, 1-Unbanned by admin, 2-Auto unbanned, 3-Permanent ban, 4-Ban revoked |
| operator | BIGINT | Operator ID | 0-System, others are admin IDs |

**Indexes:**
- PRIMARY KEY (`id`)
- KEY `idx_user_id` (`user_id`)
- KEY `idx_status` (`status`)

---

*Last Updated: February 27, 2026*
*Database Version: 1.0.4*