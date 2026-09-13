const express = require('express');
const router = express.Router();
const { HTTP_STATUS, RESPONSE_CODES, ERROR_MESSAGES } = require('../constants');
const { pool } = require('../config/config');
const { optionalAuth } = require('../middleware/auth');
const { getSuggestions } = require('../utils/searchSuggest');

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
      if (postRows.length > 0) {
        const postIds = postRows.map(p => p.id);

        // 修复头像字段映射问题
        for (let post of postRows) {
          post.avatar = post.user_avatar;
          post.author = post.nickname;
        }

        // 批量获取视频信息
        const [videos] = await pool.query('SELECT post_id, video_url, cover_url FROM post_videos WHERE post_id IN (?)', [postIds]);
        const videoMap = {};
        videos.forEach(v => { videoMap[v.post_id] = v; });

        // 批量获取图片信息
        const [images] = await pool.query('SELECT post_id, image_url FROM post_images WHERE post_id IN (?)', [postIds]);
        const imageMap = {};
        images.forEach(img => {
          if (!imageMap[img.post_id]) imageMap[img.post_id] = [];
          imageMap[img.post_id].push(img.image_url);
        });

        // 批量获取标签信息
        const [tags] = await pool.query(
          'SELECT pt.post_id, t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id IN (?)',
          [postIds]
        );
        const tagMap = {};
        tags.forEach(t => {
          if (!tagMap[t.post_id]) tagMap[t.post_id] = [];
          tagMap[t.post_id].push({ id: t.id, name: t.name });
        });

        // 批量获取点赞状态
        let likedPostIds = new Set();
        if (currentUserId) {
          const [likes] = await pool.query(
            'SELECT target_id FROM likes WHERE user_id = ? AND target_type = 1 AND target_id IN (?)',
            [currentUserId.toString(), postIds]
          );
          likedPostIds = new Set(likes.map(l => l.target_id.toString()));
        }

        // 批量获取收藏状态
        let collectedPostIds = new Set();
        if (currentUserId) {
          const [collections] = await pool.query(
            'SELECT post_id FROM collections WHERE user_id = ? AND post_id IN (?)',
            [currentUserId.toString(), postIds]
          );
          collectedPostIds = new Set(collections.map(c => c.post_id.toString()));
        }

        // 组装数据
        for (let post of postRows) {
          if (post.type === 2) {
            const video = videoMap[post.id];
            post.images = video && video.cover_url ? [video.cover_url] : [];
            post.video_url = video ? video.video_url : null;
            post.image = video && video.cover_url ? video.cover_url : null;
          } else {
            const postImages = imageMap[post.id] || [];
            post.images = postImages;
            post.image = postImages.length > 0 ? postImages[0] : null;
          }
          post.tags = tagMap[post.id] || [];
          post.liked = likedPostIds.has(post.id.toString());
          post.collected = collectedPostIds.has(post.id.toString());
        }
      }

      // 获取笔记总数 - 使用相同的搜索条件
      const [postCountResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         ${whereClause}`,
        queryParams
      );

      // 统计标签频率 - 始终基于keyword搜索结果，不受当前tag筛选影响，但要与列表保持同一内容类型
      let tagStats = [];
      if (keyword.trim()) {
        // 构建仅基于keyword的搜索条件（包括标题、内容、用户名、小石榴号、标签名称），并确保只统计已激活的笔记
        const typeCondition = type === 'posts' ? ' AND p.type = 1' : type === 'videos' ? ' AND p.type = 2' : '';
        const keywordWhereClause = `WHERE p.status = 0 AND (p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ? OR u.user_id LIKE ? OR EXISTS (SELECT 1 FROM post_tags pt2 JOIN tags t2 ON pt2.tag_id = t2.id WHERE pt2.post_id = p.id AND t2.name LIKE ?))${typeCondition}`;
        const keywordParams = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`];

        // 获取keyword搜索结果中的标签统计 - 按数量降序排序
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

        // 如果指定了tag，且tag不在前10中，则需要将其补充进去
        if (tag && !tagStats.some(t => t.id === tag)) {
          const [tagCount] = await pool.execute(
            `SELECT COUNT(*) as count
             FROM post_tags pt
             JOIN tags t ON pt.tag_id = t.id
             JOIN posts p ON pt.post_id = p.id
             LEFT JOIN users u ON p.user_id = u.id
             ${keywordWhereClause} AND t.name = ?`,
            [...keywordParams, tag]
          );
          
          if (tagCount[0].count > 0) {
            tagStats.push({
              id: tag,
              label: tag,
              count: tagCount[0].count
            });
            // 重新排序并保持10个限制
            tagStats.sort((a, b) => b.count - a.count);
            if (tagStats.length > 10) {
              // 如果选中的标签在排序后还是最后一位且超过了10个，则保留它，去掉倒数第二个
              const tagIndex = tagStats.findIndex(t => t.id === tag);
              if (tagIndex >= 10) {
                 tagStats.splice(9, 1); // 去掉第10个
              } else {
                 tagStats.pop();
              }
            }
          }
        }
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
      if (currentUserId && userRows.length > 0) {
        const userIds = userRows.map(u => u.id.toString());

        // 批量获取关注状态
        const [follows] = await pool.query(
          'SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (?)',
          [currentUserId.toString(), userIds]
        );
        const followingSet = new Set(follows.map(f => f.following_id.toString()));

        // 批量获取互相关注状态
        const [mutuals] = await pool.query(
          'SELECT follower_id FROM follows WHERE following_id = ? AND follower_id IN (?)',
          [currentUserId.toString(), userIds]
        );
        const mutualSet = new Set(mutuals.map(f => f.follower_id.toString()));

        for (let user of userRows) {
          const userIdStr = user.id.toString();
          user.isFollowing = followingSet.has(userIdStr);
          const isFollowedBy = mutualSet.has(userIdStr);
          user.isMutual = user.isFollowing && isFollowedBy;

          // 设置按钮类型
          if (user.id.toString() === currentUserId.toString()) {
            user.buttonType = 'self';
          } else if (user.isMutual) {
            user.buttonType = 'mutual';
          } else if (user.isFollowing) {
            user.buttonType = 'unfollow';
          } else if (isFollowedBy) {
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

// 搜索联想（候选来自进程内存索引，不查库）
router.get('/suggest', (req, res) => {
  try {
    const data = getSuggestions(req.query.q, req.query.limit);
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data
    });
  } catch (error) {
    console.error('搜索联想失败:', error);
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: { tags: [], posts: [], users: [] }
    });
  }
});

module.exports = router;