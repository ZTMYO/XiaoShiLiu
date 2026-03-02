const express = require('express');
const router = express.Router();
const { HTTP_STATUS, RESPONSE_CODES, ERROR_MESSAGES } = require('../constants');
const { pool } = require('../config/config');
const { optionalAuth } = require('../middleware/auth');

// 搜索（通用搜索接口）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const tag = req.query.tag || '';
    const type = req.query.type || 'all'; // all, posts, videos, users
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    // 如果既没有关键词也没有标签，返回空结果
    if (!keyword.trim() && !tag.trim()) {
      return res.json({
        code: RESPONSE_CODES.SUCCESS,
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

    // all、posts、videos都返回笔记内容，但根据type过滤不同类型
    if (type === 'all' || type === 'posts' || type === 'videos') {
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

            // 添加status条件，确保只搜索已发布的笔记
      whereConditions.push('p.status = 0');

      // 根据type添加内容类型过滤
      if (type === 'posts') {
        // 图文tab：只显示图片笔记（type=1），过滤掉视频
        whereConditions.push('p.type = 1');
      } else if (type === 'videos') {
        // 视频tab：只显示视频笔记（type=2）
        whereConditions.push('p.type = 2');
      }
      // all类型不添加type过滤，显示所有类型

      // 构建WHERE子句
      let whereClause = '';
      if (whereConditions.length > 0) {
        // 所有条件都用AND连接（keyword和tag是筛选关系）
        whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      }



      // 搜索笔记
      const [postRows] = await pool.execute(
        `SELECT p.*, u.nickname, u.avatar as user_avatar, u.user_id as author_account, u.location
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit.toString(), offset.toString()]
      );

      // 获取每个笔记的图片、标签和用户点赞收藏状态
      for (let post of postRows) {
        // 修复头像字段映射问题
        post.avatar = post.user_avatar;
        post.author = post.nickname;
        
        // 根据笔记类型获取图片或视频封面
        if (post.type === 2) {
          // 视频笔记：获取视频封面
          const [videos] = await pool.execute('SELECT video_url, cover_url FROM post_videos WHERE post_id = ?', [post.id.toString()]);
          post.images = videos.length > 0 && videos[0].cover_url ? [videos[0].cover_url] : [];
          post.video_url = videos.length > 0 ? videos[0].video_url : null;
          // 为瀑布流设置image字段
          post.image = videos.length > 0 && videos[0].cover_url ? videos[0].cover_url : null;
        } else {
          // 图文笔记：获取笔记图片
          const [images] = await pool.execute('SELECT image_url FROM post_images WHERE post_id = ?', [post.id.toString()]);
          post.images = images.map(img => img.image_url);
          // 为瀑布流设置image字段（取第一张图片）
          post.image = images.length > 0 ? images[0].image_url : null;
        }

        // 获取笔记标签
        const [tags] = await pool.execute(
          'SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?',
          [post.id.toString()]
        );
        post.tags = tags;

        // 检查当前用户是否已点赞和收藏（仅在用户已登录时检查）
        if (currentUserId) {
          const [likeResult] = await pool.execute(
            'SELECT id FROM likes WHERE user_id = ? AND target_type = 1 AND target_id = ?',
            [currentUserId.toString(), post.id.toString()]
          );
          post.liked = likeResult.length > 0;

          const [collectResult] = await pool.execute(
            'SELECT id FROM collections WHERE user_id = ? AND post_id = ?',
            [currentUserId.toString(), post.id.toString()]
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
        const keywordWhereClause = 'WHERE p.status = 0 AND (p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ? OR u.user_id LIKE ? OR EXISTS (SELECT 1 FROM post_tags pt2 JOIN tags t2 ON pt2.tag_id = t2.id WHERE pt2.post_id = p.id AND t2.name LIKE ?))';
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
           ORDER BY t.name ASC
           LIMIT 10`,
          keywordParams
        );

        tagStats = tagStatsResult.map(item => ({
          id: item.name,
          label: item.name,
          count: item.count
        }));
      }

      // all模式直接返回数据，posts模式和videos模式返回posts结构
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
      } else if (type === 'posts' || type === 'videos') {
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
        `SELECT u.id, u.user_id, u.nickname, u.avatar, u.bio, u.location, u.follow_count, u.fans_count, u.like_count, u.created_at, u.verified,
                (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND status = 0) as post_count
         FROM users u
         WHERE u.nickname LIKE ? OR u.user_id LIKE ? 
         ORDER BY u.created_at DESC 
         LIMIT ? OFFSET ?`,
        [`%${keyword}%`, `%${keyword}%`, limit.toString(), offset.toString()]
      );

      // 检查关注状态（仅在用户已登录时）
      if (currentUserId) {
        for (let user of userRows) {
          // 检查是否已关注
          const [followResult] = await pool.execute(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [currentUserId.toString(), user.id.toString()]
          );
          user.isFollowing = followResult.length > 0;

          // 检查是否互相关注
          const [mutualResult] = await pool.execute(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [user.id.toString(), currentUserId.toString()]
          );
          user.isMutual = user.isFollowing && mutualResult.length > 0;

          // 设置按钮类型
          if (user.id.toString() === currentUserId.toString()) {
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
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: {
        keyword,
        tag,
        type: type, // 确保返回正确的type值
        ...result
      }
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

module.exports = router;