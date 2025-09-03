const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

// 搜索（通用搜索接口）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const tag = req.query.tag || '';
    const type = req.query.type || 'all'; // all, posts, users
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    // 如果既没有关键词也没有标签，返回空结果
    if (!keyword.trim() && !tag.trim()) {
      return res.json({
        code: 200,
        message: 'success',
        data: {
          keyword,
          tag,
          type,
          data: [],
          tagStats: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      });
    }

    let result = {};

    // all和posts都返回笔记内容（all=视频+图文，但目前只有图文，所以和posts一样）
    if (type === 'all' || type === 'posts') {
      // 构建搜索条件
      let whereConditions = [];
      let queryParams = [];

      // 关键词搜索条件 - 匹配小石榴号、昵称、标题、正文内容、标签名称中的任意一种
      if (keyword.trim()) {
        whereConditions.push('(p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ? OR u.user_id LIKE ? OR EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id AND t.name LIKE ?))');
        queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }

      // 标签搜索条件 - 如果有keyword，则在keyword结果基础上筛选；如果没有keyword，则直接按tag搜索
      if (tag.trim()) {
        if (keyword.trim()) {
          // 有keyword时，在keyword搜索结果基础上进行tag筛选（AND关系）
          whereConditions.push('EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id AND t.name = ?)');
          queryParams.push(tag);
        } else {
          // 没有keyword时，直接按tag搜索
          whereConditions.push('EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id AND t.name = ?)');
          queryParams.push(tag);
        }
      }

      // 添加is_draft条件，确保只搜索已发布的笔记
      whereConditions.push('p.is_draft = 0');

      // 构建WHERE子句
      let whereClause = '';
      if (whereConditions.length > 0) {
        // 所有条件都用AND连接（keyword和tag是筛选关系）
        whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      }



      // 搜索笔记
      const [postRows] = await pool.execute(
        `SELECT p.*, u.nickname, u.avatar as user_avatar, u.user_id, u.location
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // 获取每个笔记的图片、标签和用户点赞收藏状态
      for (let post of postRows) {
        // 获取笔记图片
        const [images] = await pool.execute('SELECT image_url FROM post_images WHERE post_id = ?', [post.id]);
        post.images = images.map(img => img.image_url);

        // 获取笔记标签
        const [tags] = await pool.execute(
          'SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?',
          [post.id]
        );
        post.tags = tags;

        // 检查当前用户是否已点赞和收藏（仅在用户已登录时检查）
        if (currentUserId) {
          const [likeResult] = await pool.execute(
            'SELECT id FROM likes WHERE user_id = ? AND target_type = 1 AND target_id = ?',
            [currentUserId, post.id]
          );
          post.liked = likeResult.length > 0;

          const [collectResult] = await pool.execute(
            'SELECT id FROM collections WHERE user_id = ? AND post_id = ?',
            [currentUserId, post.id]
          );
          post.collected = collectResult.length > 0;
        } else {
          post.liked = false;
          post.collected = false;
        }
      }

      // 获取笔记总数 - 使用相同的搜索条件
      const [postCountResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         ${whereClause}`,
        queryParams
      );

      // 统计标签频率 - 始终基于keyword搜索结果，不受当前tag筛选影响
      let tagStats = [];
      if (keyword.trim()) {
        // 构建仅基于keyword的搜索条件（包括标题、内容、用户名、小石榴号、标签名称），并确保只统计已激活的笔记
        const keywordWhereClause = 'WHERE p.is_draft = 0 AND (p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ? OR u.user_id LIKE ? OR EXISTS (SELECT 1 FROM post_tags pt2 JOIN tags t2 ON pt2.tag_id = t2.id WHERE pt2.post_id = p.id AND t2.name LIKE ?))';
        const keywordParams = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`];

        // 获取keyword搜索结果中的标签统计
        const [tagStatsResult] = await pool.execute(
          `SELECT t.name, COUNT(*) as count
           FROM tags t
           JOIN post_tags pt ON t.id = pt.tag_id
           JOIN posts p ON pt.post_id = p.id
           LEFT JOIN users u ON p.user_id = u.id
           ${keywordWhereClause}
           GROUP BY t.id, t.name
           ORDER BY count DESC
           LIMIT 10`,
          keywordParams
        );

        tagStats = tagStatsResult.map(item => ({
          id: item.name,
          label: item.name,
          count: item.count
        }));
      }

      // all模式和posts模式都只返回笔记数据
      if (type === 'all') {
        result = {
          data: postRows,
          tagStats: tagStats,
          pagination: {
            page,
            limit,
            total: postCountResult[0].total,
            pages: Math.ceil(postCountResult[0].total / limit)
          }
        };
      } else {
        result.posts = {
          data: postRows,
          tagStats: tagStats,
          pagination: {
            page,
            limit,
            total: postCountResult[0].total,
            pages: Math.ceil(postCountResult[0].total / limit)
          }
        };
      }
    }

    // 只有当type为'users'时才搜索用户
    if (type === 'users') {
      // 搜索用户
      const [userRows] = await pool.execute(
        `SELECT u.id, u.user_id, u.nickname, u.avatar, u.bio, u.location, u.follow_count, u.fans_count, u.like_count, u.created_at,
                (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_draft = 0) as post_count
         FROM users u
         WHERE u.nickname LIKE ? OR u.user_id LIKE ? 
         ORDER BY u.created_at DESC 
         LIMIT ? OFFSET ?`,
        [`%${keyword}%`, `%${keyword}%`, limit, offset]
      );

      // 检查关注状态（仅在用户已登录时）
      if (currentUserId) {
        for (let user of userRows) {
          // 检查是否已关注
          const [followResult] = await pool.execute(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [currentUserId, user.id]
          );
          user.isFollowing = followResult.length > 0;

          // 检查是否互相关注
          const [mutualResult] = await pool.execute(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [user.id, currentUserId]
          );
          user.isMutual = user.isFollowing && mutualResult.length > 0;

          // 设置按钮类型
          if (user.id === currentUserId) {
            user.buttonType = 'self';
          } else if (user.isMutual) {
            user.buttonType = 'mutual';
          } else if (user.isFollowing) {
            user.buttonType = 'unfollow';
          } else if (mutualResult.length > 0) {
            user.buttonType = 'back';
          } else {
            user.buttonType = 'follow';
          }
        }
      } else {
        // 未登录用户，所有用户都显示为未关注状态
        for (let user of userRows) {
          user.isFollowing = false;
          user.isMutual = false;
          user.buttonType = 'follow';
        }
      }

      // 获取用户总数
      const [userCountResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM users 
         WHERE nickname LIKE ? OR user_id LIKE ?`,
        [`%${keyword}%`, `%${keyword}%`]
      );

      result.users = {
        data: userRows,
        pagination: {
          page,
          limit,
          total: userCountResult[0].total,
          pages: Math.ceil(userCountResult[0].total / limit)
        }
      };
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        keyword,
        tag,
        type,
        ...result
      }
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;