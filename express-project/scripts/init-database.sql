-- 小石榴图文社区数据库初始化脚本
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `xiaoshiliu_community` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `xiaoshiliu_community`;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `password` varchar(255) DEFAULT NULL COMMENT '密码',
  `user_id` varchar(50) NOT NULL COMMENT '小石榴号',
  `nickname` varchar(100) NOT NULL COMMENT '昵称',
  `avatar` varchar(500) DEFAULT NULL COMMENT '头像URL',
  `bio` text DEFAULT NULL COMMENT '个人简介',
  `location` varchar(100) DEFAULT NULL COMMENT 'IP属地',
  `follow_count` int(11) DEFAULT 0 COMMENT '关注数',
  `fans_count` int(11) DEFAULT 0 COMMENT '粉丝数',
  `like_count` int(11) DEFAULT 0 COMMENT '获赞数',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否激活',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `gender` varchar(10) DEFAULT NULL COMMENT '性别',
  `zodiac_sign` varchar(20) DEFAULT NULL COMMENT '星座',
  `mbti` varchar(4) DEFAULT NULL COMMENT 'MBTI人格类型',
  `education` varchar(50) DEFAULT NULL COMMENT '学历',
  `major` varchar(100) DEFAULT NULL COMMENT '专业',
  `interests` json DEFAULT NULL COMMENT '兴趣爱好（JSON数组）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 管理员表
CREATE TABLE IF NOT EXISTS `admin` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` varchar(50) NOT NULL COMMENT '管理员用户名',
  `password` varchar(255) NOT NULL COMMENT '管理员密码',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 3. 帖子表
CREATE TABLE IF NOT EXISTS `posts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '帖子ID',
  `user_id` bigint(20) NOT NULL COMMENT '发布用户ID',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `content` text NOT NULL COMMENT '内容',
  `category` varchar(50) DEFAULT NULL COMMENT '分类',
  `view_count` bigint(20) DEFAULT 0 COMMENT '浏览量',
  `like_count` int(11) DEFAULT 0 COMMENT '点赞数',
  `collect_count` int(11) DEFAULT 0 COMMENT '收藏数',
  `comment_count` int(11) DEFAULT 0 COMMENT '评论数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `is_draft` tinyint(1) DEFAULT 1 COMMENT '是否为草稿：1-草稿，0-已发布',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_like_count` (`like_count`),
  KEY `idx_category_created_at` (`category`, `created_at`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- 4. 帖子图片表
CREATE TABLE IF NOT EXISTS `post_images` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '图片ID',
  `post_id` bigint(20) NOT NULL COMMENT '帖子ID',
  `image_url` varchar(500) NOT NULL COMMENT '图片URL',
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  CONSTRAINT `post_images_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子图片表';

-- 5. 标签表
CREATE TABLE IF NOT EXISTS `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `name` varchar(50) NOT NULL COMMENT '标签名',
  `use_count` int(11) DEFAULT 0 COMMENT '使用次数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`),
  KEY `idx_use_count` (`use_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- 6. 帖子标签关联表
CREATE TABLE IF NOT EXISTS `post_tags` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `post_id` bigint(20) NOT NULL COMMENT '帖子ID',
  `tag_id` int(11) NOT NULL COMMENT '标签ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_tag` (`post_id`, `tag_id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_tag_id` (`tag_id`),
  CONSTRAINT `post_tags_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子标签关联表';

-- 7. 关注关系表
CREATE TABLE IF NOT EXISTS `follows` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '关注ID',
  `follower_id` bigint(20) NOT NULL COMMENT '关注者ID',
  `following_id` bigint(20) NOT NULL COMMENT '被关注者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follow` (`follower_id`, `following_id`),
  KEY `idx_follower_id` (`follower_id`),
  KEY `idx_following_id` (`following_id`),
  KEY `idx_follower_following` (`follower_id`, `following_id`),
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注关系表';

-- 8. 点赞表
CREATE TABLE IF NOT EXISTS `likes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '点赞ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `target_type` tinyint(4) NOT NULL COMMENT '目标类型: 1-帖子, 2-评论',
  `target_id` bigint(20) NOT NULL COMMENT '目标ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target` (`user_id`, `target_type`, `target_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_user_target_type` (`user_id`, `target_type`, `target_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- 9. 收藏表
CREATE TABLE IF NOT EXISTS `collections` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `post_id` bigint(20) NOT NULL COMMENT '帖子ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_post` (`user_id`, `post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_post_id` (`post_id`),
  CONSTRAINT `collections_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `collections_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- 10. 评论表
CREATE TABLE IF NOT EXISTS `comments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `post_id` bigint(20) NOT NULL COMMENT '帖子ID',
  `user_id` bigint(20) NOT NULL COMMENT '评论用户ID',
  `parent_id` bigint(20) DEFAULT NULL COMMENT '父评论ID',
  `content` text NOT NULL COMMENT '评论内容',
  `like_count` int(11) DEFAULT 0 COMMENT '点赞数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 11. 通知表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `user_id` bigint(20) NOT NULL COMMENT '接收用户ID',
  `sender_id` bigint(20) NOT NULL COMMENT '发送用户ID',
  `type` tinyint(4) NOT NULL COMMENT '通知类型: 1-点赞, 2-评论, 3-关注',
  `title` varchar(200) NOT NULL COMMENT '通知标题',
  `target_id` bigint(20) DEFAULT NULL COMMENT '关联目标ID',
  `comment_id` bigint(20) DEFAULT NULL COMMENT '关联评论ID，用于评论和回复通知',
  `is_read` tinyint(1) DEFAULT 0 COMMENT '是否已读',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_user_read` (`user_id`, `is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_notifications_comment_id` (`comment_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_comment_id` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- 12. 用户会话表
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `token` varchar(255) NOT NULL COMMENT '访问令牌',
  `refresh_token` varchar(255) DEFAULT NULL COMMENT '刷新令牌',
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '过期时间',
  `user_agent` text DEFAULT NULL COMMENT '用户代理',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- 插入默认管理员账号（密码: admin123，使用SHA2哈希加密）
INSERT INTO `admin` (`username`, `password`) VALUES 
('admin', SHA2('admin123', 256));

-- 数据库初始化完成
SELECT '数据库初始化完成！' AS message;
SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = 'xiaoshiliu_community';