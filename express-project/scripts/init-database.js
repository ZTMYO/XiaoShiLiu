const mysql = require('mysql2/promise');
const config = require('../config/config');
const { pool } = config;

class DatabaseInitializer {
  constructor() {
    this.dbConfig = {
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
      charset: config.database.charset
    };
  }

  async createDatabase() {
    // 创建数据库需要特殊处理，因为连接池默认需要指定数据库
    const connection = await mysql.createConnection(this.dbConfig);

    try {
      console.log('创建数据库...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`数据库 ${config.database.database} 创建成功`);
    } catch (error) {
      console.error('创建数据库失败:', error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  async initializeTables() {
    // 从连接池获取连接
    let connection;
    try {
      connection = await pool.getConnection();
      console.log('开始创建数据表...');

      // 开始事务
      await connection.beginTransaction();
      console.log('事务已开始');

      // 创建用户表
      await this.createUsersTable(connection);

      // 创建管理员表
      await this.createAdminTable(connection);

      // 创建分类表
      await this.createCategoriesTable(connection);

      // 创建笔记表
      await this.createPostsTable(connection);

      // 创建笔记图片表
      await this.createPostImagesTable(connection);

      // 创建笔记视频表
      await this.createPostVideosTable(connection);

      // 创建标签表
      await this.createTagsTable(connection);

      // 创建笔记标签关联表
      await this.createPostTagsTable(connection);

      // 创建关注关系表
      await this.createFollowsTable(connection);

      // 创建点赞表
      await this.createLikesTable(connection);

      // 创建收藏表
      await this.createCollectionsTable(connection);

      // 创建评论表
      await this.createCommentsTable(connection);

      // 创建通知表
      await this.createNotificationsTable(connection);

      // 创建用户会话表
      await this.createUserSessionsTable(connection);

      // 创建管理员会话表
      await this.createAdminSessionsTable(connection);

      // 创建审核表
      await this.createAuditTable(connection);

      // 创建用户认证表
      await this.createUserVerificationTable(connection);

      // 创建用户封禁表
      await this.createUserBanTable(connection);

      // 开始字段检查
      console.log('\n开始检查字段...');
      
      // 检查 users 表字段
      await this.checkAndAddColumn(connection, 'users', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'用户ID\' FIRST');
      await this.checkAndAddColumn(connection, 'users', 'password', '`password` varchar(255) DEFAULT NULL COMMENT \'密码\'');
      await this.checkAndAddColumn(connection, 'users', 'user_id', '`user_id` varchar(50) NOT NULL COMMENT \'小石榴号\'');
      await this.checkAndAddColumn(connection, 'users', 'nickname', '`nickname` varchar(100) NOT NULL COMMENT \'昵称\'');
      await this.checkAndAddColumn(connection, 'users', 'email', '`email` varchar(100) DEFAULT NULL COMMENT \'邮箱\'');
      await this.checkAndAddColumn(connection, 'users', 'avatar', '`avatar` varchar(500) DEFAULT NULL COMMENT \'头像URL\'');
      await this.checkAndAddColumn(connection, 'users', 'bio', '`bio` text DEFAULT NULL COMMENT \'个人简介\'');
      await this.checkAndAddColumn(connection, 'users', 'location', '`location` varchar(100) DEFAULT NULL COMMENT \'IP属地\'');
      await this.checkAndAddColumn(connection, 'users', 'follow_count', '`follow_count` int(11) DEFAULT 0 COMMENT \'关注数\'');
      await this.checkAndAddColumn(connection, 'users', 'fans_count', '`fans_count` int(11) DEFAULT 0 COMMENT \'粉丝数\'');
      await this.checkAndAddColumn(connection, 'users', 'like_count', '`like_count` int(11) DEFAULT 0 COMMENT \'获赞数\'');
      await this.checkAndAddColumn(connection, 'users', 'is_active', '`is_active` tinyint(1) DEFAULT 1 COMMENT \'是否激活\'');
      await this.checkAndAddColumn(connection, 'users', 'last_login_at', '`last_login_at` timestamp NULL DEFAULT NULL COMMENT \'最后登录时间\'');
      await this.checkAndAddColumn(connection, 'users', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      await this.checkAndAddColumn(connection, 'users', 'updated_at', '`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT \'更新时间\'');
      await this.checkAndAddColumn(connection, 'users', 'gender', '`gender` varchar(10) DEFAULT NULL COMMENT \'性别\'');
      await this.checkAndAddColumn(connection, 'users', 'zodiac_sign', '`zodiac_sign` varchar(20) DEFAULT NULL COMMENT \'星座\'');
      await this.checkAndAddColumn(connection, 'users', 'mbti', '`mbti` varchar(4) DEFAULT NULL COMMENT \'MBTI人格类型\'');
      await this.checkAndAddColumn(connection, 'users', 'education', '`education` varchar(50) DEFAULT NULL COMMENT \'学历\'');
      await this.checkAndAddColumn(connection, 'users', 'major', '`major` varchar(100) DEFAULT NULL COMMENT \'专业\'');
      await this.checkAndAddColumn(connection, 'users', 'interests', '`interests` json DEFAULT NULL COMMENT \'兴趣爱好（JSON数组）\'');
      await this.checkAndAddColumn(connection, 'users', 'verified', '`verified` tinyint(1) DEFAULT 0 COMMENT \'认证状态：0-未认证，1-已认证\'');
      
      // 检查 admin 表字段
      await this.checkAndAddColumn(connection, 'admin', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'管理员ID\' FIRST');
      await this.checkAndAddColumn(connection, 'admin', 'username', '`username` varchar(50) NOT NULL COMMENT \'管理员用户名\'');
      await this.checkAndAddColumn(connection, 'admin', 'password', '`password` varchar(255) NOT NULL COMMENT \'管理员密码\'');
      await this.checkAndAddColumn(connection, 'admin', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      
      // 检查 categories 表字段
      await this.checkAndAddColumn(connection, 'categories', 'id', '`id` int(11) NOT NULL AUTO_INCREMENT COMMENT \'分类ID\' FIRST');
      await this.checkAndAddColumn(connection, 'categories', 'name', '`name` varchar(50) NOT NULL COMMENT \'分类名称\'');
      await this.checkAndAddColumn(connection, 'categories', 'category_title', '`category_title` varchar(50) DEFAULT NULL COMMENT \'分类英文标题，用于URL路径\'');
      await this.checkAndAddColumn(connection, 'categories', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      
      // 检查 posts 表字段
      await this.checkAndAddColumn(connection, 'posts', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'笔记ID\' FIRST');
      await this.checkAndAddColumn(connection, 'posts', 'user_id', '`user_id` bigint(20) NOT NULL COMMENT \'发布用户ID\'');
      await this.checkAndAddColumn(connection, 'posts', 'title', '`title` varchar(200) NOT NULL COMMENT \'标题\'');
      await this.checkAndAddColumn(connection, 'posts', 'content', '`content` text NOT NULL COMMENT \'内容\'');
      await this.checkAndAddColumn(connection, 'posts', 'category_id', '`category_id` int(11) DEFAULT NULL COMMENT \'分类ID\'');
      await this.checkAndAddColumn(connection, 'posts', 'type', '`type` int(11) DEFAULT 1 COMMENT \'笔记类型：1-图片笔记，2-视频笔记\'');
      await this.checkAndAddColumn(connection, 'posts', 'view_count', '`view_count` bigint(20) DEFAULT 0 COMMENT \'浏览量\'');
      await this.checkAndAddColumn(connection, 'posts', 'like_count', '`like_count` int(11) DEFAULT 0 COMMENT \'点赞数\'');
      await this.checkAndAddColumn(connection, 'posts', 'collect_count', '`collect_count` int(11) DEFAULT 0 COMMENT \'收藏数\'');
      await this.checkAndAddColumn(connection, 'posts', 'comment_count', '`comment_count` int(11) DEFAULT 0 COMMENT \'评论数\'');
      await this.checkAndAddColumn(connection, 'posts', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'发布时间\'');
      await this.checkAndAddColumn(connection, 'posts', 'status', '`status` tinyint(1) DEFAULT 2 COMMENT \'笔记状态：0-发布（审核通过），1-草稿，2-待审核\'');
      await this.checkAndAddColumn(connection, 'posts', 'copyright', '`copyright` tinyint(1) DEFAULT 0 COMMENT \'版权声明：0-原创，1-转载\'');
      
      // 检查 post_images 表字段
      await this.checkAndAddColumn(connection, 'post_images', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'图片ID\' FIRST');
      await this.checkAndAddColumn(connection, 'post_images', 'post_id', '`post_id` bigint(20) NOT NULL COMMENT \'笔记ID\'');
      await this.checkAndAddColumn(connection, 'post_images', 'image_url', '`image_url` varchar(500) NOT NULL COMMENT \'图片URL\'');
      
      // 检查 post_videos 表字段
      await this.checkAndAddColumn(connection, 'post_videos', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'视频ID\' FIRST');
      await this.checkAndAddColumn(connection, 'post_videos', 'post_id', '`post_id` bigint(20) NOT NULL COMMENT \'笔记ID\'');
      await this.checkAndAddColumn(connection, 'post_videos', 'cover_url', '`cover_url` varchar(500) DEFAULT NULL COMMENT \'视频封面URL\'');
      await this.checkAndAddColumn(connection, 'post_videos', 'video_url', '`video_url` varchar(500) NOT NULL COMMENT \'视频URL\'');
      
      // 检查 tags 表字段
      await this.checkAndAddColumn(connection, 'tags', 'id', '`id` int(11) NOT NULL AUTO_INCREMENT COMMENT \'标签ID\' FIRST');
      await this.checkAndAddColumn(connection, 'tags', 'name', '`name` varchar(50) NOT NULL COMMENT \'标签名\'');
      await this.checkAndAddColumn(connection, 'tags', 'use_count', '`use_count` int(11) DEFAULT 0 COMMENT \'使用次数\'');
      await this.checkAndAddColumn(connection, 'tags', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      
      // 检查 post_tags 表字段
      await this.checkAndAddColumn(connection, 'post_tags', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'关联ID\' FIRST');
      await this.checkAndAddColumn(connection, 'post_tags', 'post_id', '`post_id` bigint(20) NOT NULL COMMENT \'笔记ID\'');
      await this.checkAndAddColumn(connection, 'post_tags', 'tag_id', '`tag_id` int(11) NOT NULL COMMENT \'标签ID\'');
      await this.checkAndAddColumn(connection, 'post_tags', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      
      // 检查 follows 表字段
      await this.checkAndAddColumn(connection, 'follows', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'关注ID\' FIRST');
      await this.checkAndAddColumn(connection, 'follows', 'follower_id', '`follower_id` bigint(20) NOT NULL COMMENT \'关注者ID\'');
      await this.checkAndAddColumn(connection, 'follows', 'following_id', '`following_id` bigint(20) NOT NULL COMMENT \'被关注者ID\'');
      await this.checkAndAddColumn(connection, 'follows', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'关注时间\'');
      
      // 检查 likes 表字段
      await this.checkAndAddColumn(connection, 'likes', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'点赞ID\' FIRST');
      await this.checkAndAddColumn(connection, 'likes', 'user_id', '`user_id` bigint(20) NOT NULL COMMENT \'用户ID\'');
      await this.checkAndAddColumn(connection, 'likes', 'target_type', '`target_type` tinyint(4) NOT NULL COMMENT \'目标类型: 1-笔记, 2-评论\'');
      await this.checkAndAddColumn(connection, 'likes', 'target_id', '`target_id` bigint(20) NOT NULL COMMENT \'目标ID\'');
      await this.checkAndAddColumn(connection, 'likes', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'点赞时间\'');
      
      // 检查 collections 表字段
      await this.checkAndAddColumn(connection, 'collections', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'收藏ID\' FIRST');
      await this.checkAndAddColumn(connection, 'collections', 'user_id', '`user_id` bigint(20) NOT NULL COMMENT \'用户ID\'');
      await this.checkAndAddColumn(connection, 'collections', 'post_id', '`post_id` bigint(20) NOT NULL COMMENT \'笔记ID\'');
      await this.checkAndAddColumn(connection, 'collections', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'收藏时间\'');
      
      // 检查 comments 表字段
      await this.checkAndAddColumn(connection, 'comments', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'评论ID\' FIRST');
      await this.checkAndAddColumn(connection, 'comments', 'post_id', '`post_id` bigint(20) NOT NULL COMMENT \'笔记ID\'');
      await this.checkAndAddColumn(connection, 'comments', 'user_id', '`user_id` bigint(20) NOT NULL COMMENT \'评论用户ID\'');
      await this.checkAndAddColumn(connection, 'comments', 'parent_id', '`parent_id` bigint(20) DEFAULT NULL COMMENT \'父评论ID\'');
      await this.checkAndAddColumn(connection, 'comments', 'content', '`content` text NOT NULL COMMENT \'评论内容\'');
      await this.checkAndAddColumn(connection, 'comments', 'like_count', '`like_count` int(11) DEFAULT 0 COMMENT \'点赞数\'');
      await this.checkAndAddColumn(connection, 'comments', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'评论时间\'');
      
      // 检查 notifications 表字段
      await this.checkAndAddColumn(connection, 'notifications', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'通知ID\' FIRST');
      await this.checkAndAddColumn(connection, 'notifications', 'user_id', '`user_id` bigint(20) NOT NULL COMMENT \'接收用户ID\'');
      await this.checkAndAddColumn(connection, 'notifications', 'sender_id', '`sender_id` bigint(20) NOT NULL COMMENT \'发送用户ID\'');
      await this.checkAndAddColumn(connection, 'notifications', 'type', '`type` tinyint(4) NOT NULL COMMENT \'通知类型: 1-点赞, 2-评论, 3-关注\'');
      await this.checkAndAddColumn(connection, 'notifications', 'title', '`title` varchar(200) NOT NULL COMMENT \'通知标题\'');
      await this.checkAndAddColumn(connection, 'notifications', 'target_id', '`target_id` bigint(20) DEFAULT NULL COMMENT \'关联目标ID\'');
      await this.checkAndAddColumn(connection, 'notifications', 'comment_id', '`comment_id` bigint(20) DEFAULT NULL COMMENT \'关联评论ID，用于评论和回复通知\'');
      await this.checkAndAddColumn(connection, 'notifications', 'is_read', '`is_read` tinyint(1) DEFAULT 0 COMMENT \'是否已读\'');
      await this.checkAndAddColumn(connection, 'notifications', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'通知时间\'');
      
      // 检查 user_sessions 表字段
      await this.checkAndAddColumn(connection, 'user_sessions', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'会话ID\' FIRST');
      await this.checkAndAddColumn(connection, 'user_sessions', 'user_id', '`user_id` bigint(20) NOT NULL COMMENT \'用户ID\'');
      await this.checkAndAddColumn(connection, 'user_sessions', 'token', '`token` varchar(255) NOT NULL COMMENT \'访问令牌\'');
      await this.checkAndAddColumn(connection, 'user_sessions', 'refresh_token', '`refresh_token` varchar(255) DEFAULT NULL COMMENT \'刷新令牌\'');
      await this.checkAndAddColumn(connection, 'user_sessions', 'expires_at', '`expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT \'过期时间\'');
      await this.checkAndAddColumn(connection, 'user_sessions', 'user_agent', '`user_agent` text DEFAULT NULL COMMENT \'用户代理\'');
      await this.checkAndAddColumn(connection, 'user_sessions', 'is_active', '`is_active` tinyint(1) DEFAULT 1 COMMENT \'是否激活\'');
      await this.checkAndAddColumn(connection, 'user_sessions', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      await this.checkAndAddColumn(connection, 'user_sessions', 'updated_at', '`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT \'更新时间\'');
      
      // 检查 admin_sessions 表字段
      await this.checkAndAddColumn(connection, 'admin_sessions', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'会话ID\' FIRST');
      await this.checkAndAddColumn(connection, 'admin_sessions', 'admin_id', '`admin_id` bigint(20) NOT NULL COMMENT \'管理员ID\'');
      await this.checkAndAddColumn(connection, 'admin_sessions', 'token', '`token` varchar(255) NOT NULL COMMENT \'访问令牌\'');
      await this.checkAndAddColumn(connection, 'admin_sessions', 'refresh_token', '`refresh_token` varchar(255) DEFAULT NULL COMMENT \'刷新令牌\'');
      await this.checkAndAddColumn(connection, 'admin_sessions', 'expires_at', '`expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT \'过期时间\'');
      await this.checkAndAddColumn(connection, 'admin_sessions', 'user_agent', '`user_agent` text DEFAULT NULL COMMENT \'用户代理\'');
      await this.checkAndAddColumn(connection, 'admin_sessions', 'is_active', '`is_active` tinyint(1) DEFAULT 1 COMMENT \'是否激活\'');
      await this.checkAndAddColumn(connection, 'admin_sessions', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      await this.checkAndAddColumn(connection, 'admin_sessions', 'updated_at', '`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT \'更新时间\'');
      
      // 检查 audit 表字段
      await this.checkAndAddColumn(connection, 'audit', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'审核ID\' FIRST');
      await this.checkAndAddColumn(connection, 'audit', 'admin_id', '`admin_id` bigint(20) DEFAULT NULL COMMENT \'审核人ID（管理员ID）\'');
      await this.checkAndAddColumn(connection, 'audit', 'type', '`type` tinyint(4) NOT NULL COMMENT \'审核类型：1-用户个人审核，2-用户官方审核，3-内容审核，4-评论审核\'');
      await this.checkAndAddColumn(connection, 'audit', 'target_id', '`target_id` bigint(20) NOT NULL COMMENT \'目标ID：根据type不同，对应用户ID、笔记ID或评论ID\'');
      await this.checkAndAddColumn(connection, 'audit', 'remark', '`remark` text DEFAULT NULL COMMENT \'审核备注\'');
      await this.checkAndAddColumn(connection, 'audit', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      await this.checkAndAddColumn(connection, 'audit', 'audit_time', '`audit_time` timestamp NULL DEFAULT NULL COMMENT \'审核时间\'');
      await this.checkAndAddColumn(connection, 'audit', 'status', '`status` tinyint(1) DEFAULT 0 COMMENT \'审核状态：0-待审核，1-审核通过，2-审核拒绝\'');
      
      // 检查 user_verification 表字段
      await this.checkAndAddColumn(connection, 'user_verification', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'主键ID\' FIRST');
      await this.checkAndAddColumn(connection, 'user_verification', 'user_id', '`user_id` bigint(20) NOT NULL COMMENT \'用户ID\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'type', '`type` tinyint(4) NOT NULL COMMENT \'认证类型：1=官方认证 2=个人认证\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'status', '`status` tinyint(4) DEFAULT 0 COMMENT \'认证状态：0=待审核 1=已通过 2=已拒绝\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'real_name', '`real_name` varchar(200) NOT NULL COMMENT \'真实姓名/机构名称\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'id_card', '`id_card` varchar(18) NOT NULL COMMENT \'身份证号/信用代码\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'contact_name', '`contact_name` varchar(50) DEFAULT NULL COMMENT \'联系人姓名\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'contact_phone', '`contact_phone` varchar(20) DEFAULT NULL COMMENT \'联系电话\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'title', '`title` varchar(100) DEFAULT NULL COMMENT \'认证称号\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'description', '`description` text DEFAULT NULL COMMENT \'认证理由\'');
      await this.checkAndAddColumn(connection, 'user_verification', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      
      // 检查 user_ban 表字段
      await this.checkAndAddColumn(connection, 'user_ban', 'id', '`id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT \'封禁记录ID\' FIRST');
      await this.checkAndAddColumn(connection, 'user_ban', 'user_id', '`user_id` bigint(20) NOT NULL COMMENT \'被封禁用户ID\'');
      await this.checkAndAddColumn(connection, 'user_ban', 'reason', '`reason` varchar(255) NOT NULL COMMENT \'封禁原因\'');
      await this.checkAndAddColumn(connection, 'user_ban', 'end_time', '`end_time` timestamp NULL DEFAULT NULL COMMENT \'封禁结束时间\'');
      await this.checkAndAddColumn(connection, 'user_ban', 'created_at', '`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT \'创建时间\'');
      await this.checkAndAddColumn(connection, 'user_ban', 'status', '`status` int(11) DEFAULT 0 COMMENT \'状态：0-封禁中，1-管理员解封，2-自动解封，3-永久封禁，4-封禁撤销\'');
      await this.checkAndAddColumn(connection, 'user_ban', 'operator', '`operator` bigint(20) NOT NULL DEFAULT 0 COMMENT \'操作人ID：0-系统，其他为管理员ID\'');
      
      console.log('字段检查完成!');

      // 提交事务
      await connection.commit();
      console.log('事务已提交');
      console.log('所有数据表创建完成!');

    } catch (error) {
      // 回滚事务
      if (connection) {
        try {
          await connection.rollback();
          console.log('事务已回滚');
        } catch (rollbackError) {
          console.error('回滚事务失败:', rollbackError.message);
        }
      }
      console.error('创建数据表失败:', error.message);
      throw error;
    } finally {
      if (connection) {
        connection.release();
        console.log('数据库连接已释放回连接池');
      }
    }
  }

  async createUsersTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
        \`password\` varchar(255) DEFAULT NULL COMMENT '密码',
        \`user_id\` varchar(50) NOT NULL COMMENT '小石榴号',
        \`nickname\` varchar(100) NOT NULL COMMENT '昵称',
        \`email\` varchar(100) DEFAULT NULL COMMENT '邮箱',
        \`avatar\` varchar(500) DEFAULT NULL COMMENT '头像URL',
        \`bio\` text DEFAULT NULL COMMENT '个人简介',
        \`location\` varchar(100) DEFAULT NULL COMMENT 'IP属地',
        \`follow_count\` int(11) DEFAULT 0 COMMENT '关注数',
        \`fans_count\` int(11) DEFAULT 0 COMMENT '粉丝数',
        \`like_count\` int(11) DEFAULT 0 COMMENT '获赞数',
        \`is_active\` tinyint(1) DEFAULT 1 COMMENT '是否激活',
        \`last_login_at\` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        \`gender\` varchar(10) DEFAULT NULL COMMENT '性别',
        \`zodiac_sign\` varchar(20) DEFAULT NULL COMMENT '星座',
        \`mbti\` varchar(4) DEFAULT NULL COMMENT 'MBTI人格类型',
        \`education\` varchar(50) DEFAULT NULL COMMENT '学历',
        \`major\` varchar(100) DEFAULT NULL COMMENT '专业',
        \`interests\` json DEFAULT NULL COMMENT '兴趣爱好（JSON数组）',
        \`verified\` tinyint(1) DEFAULT 0 COMMENT '认证状态：0-未认证，1-已认证',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`user_id\` (\`user_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_email\` (\`email\`),
        KEY \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
    `;
    await connection.execute(sql);
    console.log('✓ users 表创建成功');
  }

  async createAdminTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`admin\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
        \`username\` varchar(50) NOT NULL COMMENT '管理员用户名',
        \`password\` varchar(255) NOT NULL COMMENT '管理员密码',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`username\` (\`username\`),
        KEY \`idx_admin_username\` (\`username\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';
    `;
    await connection.execute(sql);
    console.log('✓ admin 表创建成功');
  }

  async createCategoriesTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`categories\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT '分类ID',
        \`name\` varchar(50) NOT NULL COMMENT '分类名称',
        \`category_title\` varchar(50) DEFAULT NULL COMMENT '分类英文标题，用于URL路径',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`name\` (\`name\`),
        UNIQUE KEY \`category_title\` (\`category_title\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';
    `;
    await connection.execute(sql);
    console.log('✓ categories 表创建成功');
  }

  async createPostsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`posts\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '笔记ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '发布用户ID',
        \`title\` varchar(200) NOT NULL COMMENT '标题',
        \`content\` text NOT NULL COMMENT '内容',
        \`category_id\` int(11) DEFAULT NULL COMMENT '分类ID',
        \`type\` int(11) DEFAULT 1 COMMENT '笔记类型：1-图片笔记，2-视频笔记',
        \`view_count\` bigint(20) DEFAULT 0 COMMENT '浏览量',
        \`like_count\` int(11) DEFAULT 0 COMMENT '点赞数',
        \`collect_count\` int(11) DEFAULT 0 COMMENT '收藏数',
        \`comment_count\` int(11) DEFAULT 0 COMMENT '评论数',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
        \`status\` tinyint(1) DEFAULT 2 COMMENT '笔记状态：0-发布（审核通过），1-草稿，2-待审核',
        \`copyright\` tinyint(1) DEFAULT 0 COMMENT '版权声明：0-原创，1-转载',
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_category_id\` (\`category_id\`),
        KEY \`idx_created_at\` (\`created_at\`),
        KEY \`idx_like_count\` (\`like_count\`),
        KEY \`idx_category_id_created_at\` (\`category_id\`, \`created_at\`),
        KEY \`idx_copyright\` (\`copyright\`),
        CONSTRAINT \`posts_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_posts_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记表';
    `;
    await connection.execute(sql);
    console.log('✓ posts 表创建成功');
  }

  async createPostImagesTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`post_images\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '图片ID',
        \`post_id\` bigint(20) NOT NULL COMMENT '笔记ID',
        \`image_url\` varchar(500) NOT NULL COMMENT '图片URL',
        PRIMARY KEY (\`id\`),
        KEY \`idx_post_id\` (\`post_id\`),
        CONSTRAINT \`post_images_ibfk_1\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记图片表';
    `;
    await connection.execute(sql);
    console.log('✓ post_images 表创建成功');
  }

  async createPostVideosTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`post_videos\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '视频ID',
        \`post_id\` bigint(20) NOT NULL COMMENT '笔记ID',
        \`cover_url\` varchar(500) DEFAULT NULL COMMENT '视频封面URL',
        \`video_url\` varchar(500) NOT NULL COMMENT '视频URL',
        PRIMARY KEY (\`id\`),
        KEY \`idx_post_id\` (\`post_id\`),
        CONSTRAINT \`post_videos_ibfk_1\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记视频表';
    `;
    await connection.execute(sql);
    console.log('✓ post_videos 表创建成功');
  }

  async createTagsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`tags\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT '标签ID',
        \`name\` varchar(50) NOT NULL COMMENT '标签名',
        \`use_count\` int(11) DEFAULT 0 COMMENT '使用次数',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`name\` (\`name\`),
        KEY \`idx_name\` (\`name\`),
        KEY \`idx_use_count\` (\`use_count\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';
    `;
    await connection.execute(sql);
    console.log('✓ tags 表创建成功');
  }

  async createPostTagsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`post_tags\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '关联ID',
        \`post_id\` bigint(20) NOT NULL COMMENT '笔记ID',
        \`tag_id\` int(11) NOT NULL COMMENT '标签ID',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_post_tag\` (\`post_id\`, \`tag_id\`),
        KEY \`idx_post_id\` (\`post_id\`),
        KEY \`idx_tag_id\` (\`tag_id\`),
        CONSTRAINT \`post_tags_ibfk_1\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`post_tags_ibfk_2\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记标签关联表';
    `;
    await connection.execute(sql);
    console.log('✓ post_tags 表创建成功');
  }

  async createFollowsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`follows\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '关注ID',
        \`follower_id\` bigint(20) NOT NULL COMMENT '关注者ID',
        \`following_id\` bigint(20) NOT NULL COMMENT '被关注者ID',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_follow\` (\`follower_id\`, \`following_id\`),
        KEY \`idx_follower_id\` (\`follower_id\`),
        KEY \`idx_following_id\` (\`following_id\`),
        KEY \`idx_follower_following\` (\`follower_id\`, \`following_id\`),
        CONSTRAINT \`follows_ibfk_1\` FOREIGN KEY (\`follower_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`follows_ibfk_2\` FOREIGN KEY (\`following_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注关系表';
    `;
    await connection.execute(sql);
    console.log('✓ follows 表创建成功');
  }

  async createLikesTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`likes\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '点赞ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '用户ID',
        \`target_type\` tinyint(4) NOT NULL COMMENT '目标类型: 1-笔记, 2-评论',
        \`target_id\` bigint(20) NOT NULL COMMENT '目标ID',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_target\` (\`user_id\`, \`target_type\`, \`target_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_target\` (\`target_type\`, \`target_id\`),
        KEY \`idx_user_target_type\` (\`user_id\`, \`target_type\`, \`target_id\`),
        CONSTRAINT \`likes_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';
    `;
    await connection.execute(sql);
    console.log('✓ likes 表创建成功');
  }

  async createCollectionsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`collections\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '用户ID',
        \`post_id\` bigint(20) NOT NULL COMMENT '笔记ID',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_post\` (\`user_id\`, \`post_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_post_id\` (\`post_id\`),
        CONSTRAINT \`collections_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`collections_ibfk_2\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';
    `;
    await connection.execute(sql);
    console.log('✓ collections 表创建成功');
  }

  async createCommentsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`comments\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '评论ID',
        \`post_id\` bigint(20) NOT NULL COMMENT '笔记ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '评论用户ID',
        \`parent_id\` bigint(20) DEFAULT NULL COMMENT '父评论ID',
        \`content\` text NOT NULL COMMENT '评论内容',
        \`like_count\` int(11) DEFAULT 0 COMMENT '点赞数',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_post_id\` (\`post_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_parent_id\` (\`parent_id\`),
        KEY \`idx_created_at\` (\`created_at\`),
        CONSTRAINT \`comments_ibfk_1\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`comments_ibfk_2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`comments_ibfk_3\` FOREIGN KEY (\`parent_id\`) REFERENCES \`comments\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';
    `;
    await connection.execute(sql);
    console.log('✓ comments 表创建成功');
  }

  async createNotificationsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '通知ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '接收用户ID',
        \`sender_id\` bigint(20) NOT NULL COMMENT '发送用户ID',
        \`type\` tinyint(4) NOT NULL COMMENT '通知类型: 1-点赞, 2-评论, 3-关注',
        \`title\` varchar(200) NOT NULL COMMENT '通知标题',
        \`target_id\` bigint(20) DEFAULT NULL COMMENT '关联目标ID',
        \`comment_id\` bigint(20) DEFAULT NULL COMMENT '关联评论ID，用于评论和回复通知',
        \`is_read\` tinyint(1) DEFAULT 0 COMMENT '是否已读',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_sender_id\` (\`sender_id\`),
        KEY \`idx_type\` (\`type\`),
        KEY \`idx_is_read\` (\`is_read\`),
        KEY \`idx_user_read\` (\`user_id\`, \`is_read\`),
        KEY \`idx_created_at\` (\`created_at\`),
        KEY \`idx_notifications_comment_id\` (\`comment_id\`),
        CONSTRAINT \`notifications_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`notifications_ibfk_2\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_notifications_comment_id\` FOREIGN KEY (\`comment_id\`) REFERENCES \`comments\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';
    `;
    await connection.execute(sql);
    console.log('✓ notifications 表创建成功');
  }

  async createUserSessionsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`user_sessions\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '会话ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '用户ID',
        \`token\` varchar(255) NOT NULL COMMENT '访问令牌',
        \`refresh_token\` varchar(255) DEFAULT NULL COMMENT '刷新令牌',
        \`expires_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '过期时间',
        \`user_agent\` text DEFAULT NULL COMMENT '用户代理',
        \`is_active\` tinyint(1) DEFAULT 1 COMMENT '是否激活',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`token\` (\`token\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_token\` (\`token\`),
        KEY \`idx_expires_at\` (\`expires_at\`),
        CONSTRAINT \`user_sessions_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';
    `;
    await connection.execute(sql);
    console.log('✓ user_sessions 表创建成功');
  }

  async createAdminSessionsTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`admin_sessions\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '会话ID',
        \`admin_id\` bigint(20) NOT NULL COMMENT '管理员ID',
        \`token\` varchar(255) NOT NULL COMMENT '访问令牌',
        \`refresh_token\` varchar(255) DEFAULT NULL COMMENT '刷新令牌',
        \`expires_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '过期时间',
        \`user_agent\` text DEFAULT NULL COMMENT '用户代理',
        \`is_active\` tinyint(1) DEFAULT 1 COMMENT '是否激活',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`token\` (\`token\`),
        KEY \`idx_admin_id\` (\`admin_id\`),
        KEY \`idx_token\` (\`token\`),
        KEY \`idx_expires_at\` (\`expires_at\`),
        CONSTRAINT \`admin_sessions_ibfk_1\` FOREIGN KEY (\`admin_id\`) REFERENCES \`admin\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员会话表';
    `;
    await connection.execute(sql);
    console.log('✓ admin_sessions 表创建成功');
  }

  async createAuditTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`audit\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '审核ID',
        \`admin_id\` bigint(20) DEFAULT NULL COMMENT '审核人ID（管理员ID）',
        \`type\` tinyint(4) NOT NULL COMMENT '审核类型：1-用户个人审核，2-用户官方审核，3-内容审核，4-评论审核',
        \`target_id\` bigint(20) NOT NULL COMMENT '目标ID：根据type不同，对应用户ID、笔记ID或评论ID',
        \`remark\` text DEFAULT NULL COMMENT '审核备注',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`audit_time\` timestamp NULL DEFAULT NULL COMMENT '审核时间',
        \`status\` tinyint(1) DEFAULT 0 COMMENT '审核状态：0-待审核，1-审核通过，2-审核拒绝',
        PRIMARY KEY (\`id\`),
        KEY \`idx_admin_id\` (\`admin_id\`),
        KEY \`idx_type\` (\`type\`),
        KEY \`idx_target_id\` (\`target_id\`),
        KEY \`idx_status\` (\`status\`),
        KEY \`idx_created_at\` (\`created_at\`),
        KEY \`idx_type_target\` (\`type\`, \`target_id\`),
        CONSTRAINT \`audit_ibfk_1\` FOREIGN KEY (\`admin_id\`) REFERENCES \`admin\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核表';
    `;
    await connection.execute(sql);
    console.log('✓ audit 表创建成功');
  }

  async createUserVerificationTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`user_verification\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '用户ID',
        \`type\` tinyint(4) NOT NULL COMMENT '认证类型：1=官方认证 2=个人认证',
        \`status\` tinyint(4) DEFAULT 0 COMMENT '认证状态：0=待审核 1=已通过 2=已拒绝',
        \`real_name\` varchar(200) NOT NULL COMMENT '真实姓名/机构名称',
        \`id_card\` varchar(18) NOT NULL COMMENT '身份证号/信用代码',
        \`contact_name\` varchar(50) DEFAULT NULL COMMENT '联系人姓名',
        \`contact_phone\` varchar(20) DEFAULT NULL COMMENT '联系电话',
        \`title\` varchar(100) DEFAULT NULL COMMENT '认证称号',
        \`description\` text DEFAULT NULL COMMENT '认证理由',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_id\` (\`user_id\`),
        KEY \`idx_type\` (\`type\`),
        KEY \`idx_status\` (\`status\`),
        CONSTRAINT \`user_verification_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户认证表';
    `;
    await connection.execute(sql);
    console.log('✓ user_verification 表创建成功');
  }

  async createUserBanTable(connection) {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`user_ban\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '封禁记录ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '被封禁用户ID',
        \`reason\` varchar(255) NOT NULL COMMENT '封禁原因',
        \`end_time\` timestamp NULL DEFAULT NULL COMMENT '封禁结束时间',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`status\` int(11) DEFAULT 0 COMMENT '状态：0-封禁中，1-管理员解封，2-自动解封，3-永久封禁，4-封禁撤销',
        \`operator\` bigint(20) NOT NULL DEFAULT 0 COMMENT '操作人ID：0-系统，其他为管理员ID',
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_status\` (\`status\`),
        KEY \`idx_created_at\` (\`created_at\`),
        KEY \`idx_end_time\` (\`end_time\`),
        CONSTRAINT \`user_ban_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户封禁表';
    `;
    await connection.execute(sql);
    console.log('✓ user_ban 表创建成功');
  }

  async checkAndAddColumn(connection, tableName, columnName, columnDefinition) {
    try {
      // 检查字段是否存在
      const checkSql = `SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`;
      const [rows] = await connection.execute(checkSql);
      
      if (rows.length === 0) {
        // 字段不存在，添加字段
        const addSql = `ALTER TABLE \`${tableName}\` ADD COLUMN ${columnDefinition}`;
        await connection.execute(addSql);
        console.log(`✓ 为 ${tableName} 表添加了 ${columnName} 字段`);
      }
    } catch (error) {
      console.error(`检查/添加 ${tableName}.${columnName} 字段时出错:`, error.message);
      throw error;
    }
  }

  async insertDefaultAdmin() {
    // 从连接池获取连接
    let connection;
    try {
      connection = await pool.getConnection();
      console.log('插入默认管理员账户...');

      // 默认管理员账户信息
      // 用户名: admin
      // 密码: 123456 (SHA-256加密后的值)
      const adminSql = `
        INSERT INTO \`admin\` (\`username\`, \`password\`) VALUES 
        ('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92')
        ON DUPLICATE KEY UPDATE \`username\` = VALUES(\`username\`)
      `;

      await connection.execute(adminSql);
    } catch (error) {
      console.error('插入默认管理员账户失败:', error.message);
      throw error;
    } finally {
      if (connection) {
        connection.release();
        console.log('数据库连接已释放回连接池');
      }
    }
  }

  async run() {
    try {
      console.log('=== 小石榴图文社区数据库初始化 ===\n');

      // 创建数据库
      await this.createDatabase();

      // 创建表结构
      await this.initializeTables();

      // 插入默认管理员账户
      await this.insertDefaultAdmin();

      console.log('\n=== 数据库初始化完成 ===');
      console.log('数据库名称:', config.database.database);
      console.log('字符集: utf8mb4');
      console.log('排序规则: utf8mb4_unicode_ci');
      console.log('存储引擎: InnoDB');

    } catch (error) {
      console.error('\n=== 数据库初始化失败 ===');
      console.error('错误信息:', error.message);
      process.exit(1);
    }
  }
}

// 等待用户按回车退出
async function waitForExit() {
  console.log('\n按回车键退出...');
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  const initializer = new DatabaseInitializer();
  initializer.run().then(async () => {
    await waitForExit();
    process.exit(0);
  }).catch(async () => {
    await waitForExit();
    process.exit(1);
  });
}

module.exports = DatabaseInitializer;