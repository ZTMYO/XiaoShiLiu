const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const NotificationHelper = require('../utils/notificationHelper');

// 搜索用户（必须放在 /:id 之前）
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    if (!keyword) {
      return res.status(400).json({ code: 400, message: '请输入搜索关键词' });
    }

    // 搜索用户：支持昵称和小石榴号搜索
    const [rows] = await pool.execute(
      `SELECT u.id, u.user_id, u.nickname, u.avatar, u.bio, u.location, u.follow_count, u.fans_count, u.like_count, u.created_at,
              (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_draft = 0) as post_count
       FROM users u
       WHERE u.nickname LIKE ? OR u.user_id LIKE ? 
       ORDER BY u.created_at DESC 
       LIMIT ? OFFSET ?`,
      [`%${keyword}%`, `%${keyword}%`, String(limit), String(offset)]
    );

    // 检查关注状态（仅在用户已登录时）
    if (currentUserId) {
      for (let user of rows) {
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
      for (let user of rows) {
        user.isFollowing = false;
        user.isMutual = false;
        user.buttonType = 'follow';
      }
    }

    // 获取总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users 
       WHERE nickname LIKE ? OR user_id LIKE ?`,
      [`%${keyword}%`, `%${keyword}%`]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        users: rows,
        keyword,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取用户信息
// 获取用户个性标签
router.get('/:id/personality-tags', async (req, res) => {
  try {
    const userIdParam = req.params.id;
    // 通过小石榴号(user_id)或数字ID进行查找
    let query, params;
    if (/^\d+$/.test(userIdParam)) {
      // 数字ID查询
      query = 'SELECT gender, zodiac_sign, mbti, education, major, interests FROM users WHERE id = ?';
      params = [userIdParam];
    } else {
      // 小石榴号查询
      query = 'SELECT gender, zodiac_sign, mbti, education, major, interests FROM users WHERE user_id = ?';
      params = [userIdParam];
    }

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      console.log('❌ 用户不存在:', userIdParam);
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    const personalityTags = rows[0];

    // 处理interests字段（如果是JSON字符串则解析）
    if (personalityTags.interests) {
      try {
        personalityTags.interests = typeof personalityTags.interests === 'string'
          ? JSON.parse(personalityTags.interests)
          : personalityTags.interests;
      } catch (e) {
        personalityTags.interests = null;
      }
    }

    res.json({
      code: 200,
      message: 'success',
      data: personalityTags
    });
  } catch (error) {
    console.error('获取用户个性标签失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userIdParam = req.params.id;
    // 只通过小石榴号(user_id)进行查找
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE user_id = ?',
      [userIdParam]
    );

    if (rows.length === 0) {
      console.log('❌ 用户不存在:', userIdParam);
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    const user = rows[0];

    // 处理interests字段（如果是JSON字符串则解析）
    if (user.interests) {
      try {
        user.interests = typeof user.interests === 'string'
          ? JSON.parse(user.interests)
          : user.interests;
      } catch (e) {
        user.interests = null;
      }
    }

    res.json({
      code: 200,
      message: 'success',
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      'SELECT id, user_id, nickname, avatar, bio, location, follow_count, fans_count, like_count, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [String(limit), String(offset)]
    );

    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        users: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取用户发布的笔记列表
router.get('/:id/posts', optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;
    const category = req.query.category;
    const keyword = req.query.keyword;
    const sort = req.query.sort || 'created_at';

    // 获取用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      // 数字ID
      userId = userIdParam;
    } else {
      // user_id格式，需要查询对应的数字ID
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    // 构建查询条件
    let whereConditions = ['p.user_id = ?', 'p.is_draft = 0'];
    let queryParams = [userId];

    if (category) {
      whereConditions.push('p.category = ?');
      queryParams.push(category);
    }

    if (keyword) {
      whereConditions.push('(p.title LIKE ? OR p.content LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 构建排序条件
    const allowedSortFields = ['created_at', 'view_count', 'like_count', 'collect_count', 'comment_count'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const orderBy = `ORDER BY p.${sortField} DESC`;

    // 查询用户发布的笔记
    const query = `
      SELECT p.*, u.nickname, u.avatar as user_avatar, u.user_id, u.location
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    queryParams.push(String(limit), String(offset));

    const [rows] = await pool.execute(query, queryParams);
    // 获取每个笔记的图片、标签和用户点赞收藏状态
    for (let post of rows) {
      // 获取笔记图片
      const [images] = await pool.execute('SELECT image_url FROM post_images WHERE post_id = ?', [post.id]);
      post.images = images.map(img => img.image_url);

      // 获取笔记标签
      const [tags] = await pool.execute(
        'SELECT t.id, t.name FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?',
        [post.id]
      );
      post.tags = tags;

      // 检查当前用户是否已点赞（仅在用户已登录时检查）
      if (currentUserId) {
        const [likeResult] = await pool.execute(
          'SELECT id FROM likes WHERE user_id = ? AND target_type = 1 AND target_id = ?',
          [currentUserId, post.id]
        );
        post.liked = likeResult.length > 0;

        // 检查当前用户是否已收藏
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

    // 计算总数时也要考虑筛选条件
    const countQuery = `SELECT COUNT(*) as total FROM posts p WHERE ${whereConditions.join(' AND ')}`;
    const countParams = queryParams.slice(0, -2); // 移除limit和offset参数
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;


    res.json({
      code: 200,
      message: 'success',
      data: {
        posts: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户笔记列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取用户收藏列表
router.get('/:id/collections', optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    // 获取用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      // 数字ID
      userId = userIdParam;
    } else {
      // user_id格式，需要查询对应的数字ID
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    const [rows] = await pool.execute(
      `SELECT p.*, u.nickname, u.avatar as user_avatar, u.user_id, u.location, c.created_at as collected_at
       FROM collections c
       LEFT JOIN posts p ON c.post_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE c.user_id = ? AND p.is_draft = 0
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, String(limit), String(offset)]
    );

    // 获取每个笔记的图片、标签和用户点赞收藏状态
    for (let post of rows) {
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

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM collections c LEFT JOIN posts p ON c.post_id = p.id WHERE c.user_id = ? AND p.is_draft = 0', 
      [userId]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        collections: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取用户点赞列表
router.get('/:id/likes', optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    // 获取用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      // 数字ID
      userId = userIdParam;
    } else {
      // user_id格式，需要查询对应的数字ID
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    // 查询笔记列表
    const [rows] = await pool.execute(
      `SELECT p.*, u.nickname, u.avatar as user_avatar, u.user_id, u.location, l.created_at as liked_at
       FROM likes l
       LEFT JOIN posts p ON l.target_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE l.user_id = ? AND l.target_type = 1 AND p.is_draft = 0
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, String(limit), String(offset)]
    );

    // 获取每个笔记的图片、标签和用户点赞收藏状态
    for (let post of rows) {
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

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM likes l LEFT JOIN posts p ON l.target_id = p.id WHERE l.user_id = ? AND l.target_type = 1 AND p.is_draft = 0', 
      [userId]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        posts: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取点赞列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 关注用户
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const followerId = req.user.id;

    // 获取被关注用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      userId = userIdParam;
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    // 不能关注自己
    if (followerId == userId) {
      return res.status(400).json({ code: 400, message: '不能关注自己' });
    }

    // 检查是否已经关注
    const [existingFollow] = await pool.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, userId]
    );

    if (existingFollow.length > 0) {
      return res.status(400).json({ code: 400, message: '已经关注了该用户' });
    }

    // 添加关注记录
    await pool.execute(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, userId]
    );

    // 更新关注者的关注数
    await pool.execute('UPDATE users SET follow_count = follow_count + 1 WHERE id = ?', [followerId]);

    // 更新被关注者的粉丝数
    await pool.execute('UPDATE users SET fans_count = fans_count + 1 WHERE id = ?', [userId]);

    // 创建关注通知
    try {
      const notificationData = NotificationHelper.createFollowNotification(userId, followerId);
      await NotificationHelper.insertNotification(pool, notificationData);
    } catch (notificationError) {
      console.error('关注通知创建失败:', notificationError);
    }

    console.log(`关注成功 - 用户ID: ${followerId}, 目标用户ID: ${userId}`);
    res.json({ code: 200, message: '关注成功' });
  } catch (error) {
    console.error('关注失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 取消关注用户
router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const followerId = req.user.id;

    // 获取被关注用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      userId = userIdParam;
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    // 删除关注记录
    const [result] = await pool.execute(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '关注记录不存在' });
    }

    // 更新关注者的关注数
    await pool.execute('UPDATE users SET follow_count = follow_count - 1 WHERE id = ?', [followerId]);

    // 更新被关注者的粉丝数
    await pool.execute('UPDATE users SET fans_count = fans_count - 1 WHERE id = ?', [userId]);

    // 删除相关的关注通知
    // 删除关注者发给被关注者的关注通知
    await pool.execute(
      'DELETE FROM notifications WHERE user_id = ? AND sender_id = ? AND type = ?',
      [userId, followerId, NotificationHelper.TYPES.FOLLOW]
    );

    console.log(`取消关注成功 - 用户ID: ${followerId}, 目标用户ID: ${userId}`);
    console.log(`已删除相关关注通知 - 接收者: ${userId}, 发送者: ${followerId}`);
    res.json({ code: 200, message: '取消关注成功' });
  } catch (error) {
    console.error('取消关注失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取关注状态
router.get('/:id/follow-status', optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const followerId = req.user ? req.user.id : null;

    // 获取用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      userId = userIdParam;
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    let isFollowing = false;
    let isMutual = false;
    let buttonType = 'follow';

    // 如果用户已登录，检查关注状态
    if (followerId) {
      // 检查关注状态
      const [followResult] = await pool.execute(
        'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, userId]
      );
      isFollowing = followResult.length > 0;

      // 检查是否互相关注
      const [mutualResult] = await pool.execute(
        'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
        [userId, followerId]
      );
      isMutual = isFollowing && mutualResult.length > 0;

      // 确定按钮类型
      if (userId == followerId) {
        buttonType = 'self';
      } else if (isMutual) {
        buttonType = 'mutual';
      } else if (isFollowing) {
        buttonType = 'unfollow';
      } else if (mutualResult.length > 0) {
        buttonType = 'back';
      }
    }
    // 如果用户未登录，保持默认值：isFollowing = false, isMutual = false, buttonType = 'follow'

    res.json({
      code: 200,
      message: 'success',
      data: {
        followed: isFollowing,
        isFollowing,
        isMutual,
        buttonType
      }
    });
  } catch (error) {
    console.error('获取关注状态失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取用户关注列表
router.get('/:id/following', optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    // 获取用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      userId = userIdParam;
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    // 查询所有关注的用户（包括互相关注）
    const [rows] = await pool.execute(
      `SELECT u.id, u.user_id, u.nickname, u.avatar, u.bio, u.location, u.follow_count, u.fans_count, u.like_count, u.created_at,
              f.created_at as followed_at
       FROM follows f
       LEFT JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, String(limit), String(offset)]
    );

    // 检查当前用户与这些用户的关注状态
    if (currentUserId) {
      for (let user of rows) {
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
        if (user.id == currentUserId) {
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
      for (let user of rows) {
        user.isFollowing = false;
        user.isMutual = false;
        user.buttonType = 'follow';
      }
    }

    // 计算所有关注的总数（包括互相关注）
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM follows f
       WHERE f.follower_id = ?`,
      [userId]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        following: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取用户粉丝列表
router.get('/:id/followers', optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    console.log(`获取粉丝列表 - 用户ID: ${userIdParam}, 当前用户ID: ${currentUserId}`);

    // 获取用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      userId = userIdParam;
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    const [rows] = await pool.execute(
      `SELECT u.id, u.user_id, u.nickname, u.avatar, u.bio, u.location, u.follow_count, u.fans_count, u.like_count, u.created_at,
              f.created_at as followed_at
       FROM follows f
       LEFT JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // 检查当前用户与这些用户的关注状态
    if (currentUserId) {
      for (let user of rows) {
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
        if (user.id == currentUserId) {
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
      for (let user of rows) {
        user.isFollowing = false;
        user.isMutual = false;
        user.buttonType = 'follow';
      }
    }

    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM follows WHERE following_id = ?', [userId]);
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        followers: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取互相关注列表
router.get('/:id/mutual-follows', optionalAuth, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    console.log(`获取互关列表 - 用户ID: ${userIdParam}, 当前用户ID: ${currentUserId}`);

    // 获取用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      userId = userIdParam;
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    // 查询互关用户
    const [rows] = await pool.execute(
      `SELECT u.id, u.user_id, u.nickname, u.avatar, u.bio, u.location, u.follow_count, u.fans_count, u.like_count, u.created_at
       FROM users u
       WHERE u.id IN (
         SELECT f1.following_id 
         FROM follows f1
         WHERE f1.follower_id = ? 
         AND EXISTS (
           SELECT 1 FROM follows f2 
           WHERE f2.follower_id = f1.following_id 
           AND f2.following_id = ?
         )
       )
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, String(limit), String(offset)]
    );

    // 检查当前用户与这些用户的关注状态
    if (currentUserId) {
      for (let user of rows) {
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
        if (user.id == currentUserId) {
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
      for (let user of rows) {
        user.isFollowing = false;
        user.isMutual = false;
        user.buttonType = 'follow';
      }
    }

    // 获取互关总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users u
       WHERE u.id IN (
         SELECT f1.following_id 
         FROM follows f1
         WHERE f1.follower_id = ? 
         AND EXISTS (
           SELECT 1 FROM follows f2 
           WHERE f2.follower_id = f1.following_id 
           AND f2.following_id = ?
         )
       )`,
      [userId, userId]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        mutualFollows: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取互关列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取用户统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const userIdParam = req.params.id;
    console.log(`获取用户统计信息 - 用户ID: ${userIdParam}`);

    // 获取用户的数字ID
    let userId;
    if (/^\d+$/.test(userIdParam)) {
      userId = userIdParam;
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      userId = userRows[0].id;
    }

    // 获取用户基本统计信息
    const [userStats] = await pool.execute(
      'SELECT follow_count, fans_count, like_count FROM users WHERE id = ?',
      [userId]
    );

    if (userStats.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    // 获取笔记数量
    const [postCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND is_draft = 0',
      [userId]
    );

    // 获取该用户发布的笔记被收藏的总数量
    const [collectCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM collections c JOIN posts p ON c.post_id = p.id WHERE p.user_id = ? AND p.is_draft = 0',
      [userId]
    );

    // 计算获赞与收藏总数
    const likesAndCollects = userStats[0].like_count + collectCount[0].count;

    const stats = {
      follow_count: userStats[0].follow_count,
      fans_count: userStats[0].fans_count,
      post_count: postCount[0].count,
      like_count: userStats[0].like_count,
      collect_count: collectCount[0].count,
      likes_and_collects: likesAndCollects
    };


    res.json({
      code: 200,
      message: 'success',
      data: stats
    });
  } catch (error) {
    console.error('获取用户统计信息失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 更新用户资料（用户自己）
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const currentUserId = req.user.id;
    const { nickname, avatar, bio, location, gender, zodiac_sign, mbti, education, major, interests } = req.body;

    console.log(`用户更新资料 - 目标用户ID: ${userIdParam}, 当前用户ID: ${currentUserId}`);

    // 获取目标用户的数字ID
    let targetUserId;
    if (/^\d+$/.test(userIdParam)) {
      targetUserId = parseInt(userIdParam);
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      targetUserId = userRows[0].id;
    }

    // 检查是否是用户本人
    if (currentUserId !== targetUserId) {
      return res.status(403).json({ code: 403, message: '只能修改自己的资料' });
    }

    // 验证必填字段
    if (!nickname || !nickname.trim()) {
      return res.status(400).json({ code: 400, message: '昵称不能为空' });
    }

    // 构建更新SQL
    let updateFields = [];
    let updateValues = [];

    updateFields.push('nickname = ?');
    updateValues.push(nickname.trim());

    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar || '');
    }

    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio || '');
    }

    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location || '');
    }

    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender || null);
    }

    if (zodiac_sign !== undefined) {
      updateFields.push('zodiac_sign = ?');
      updateValues.push(zodiac_sign || null);
    }

    if (mbti !== undefined) {
      updateFields.push('mbti = ?');
      updateValues.push(mbti || null);
    }

    if (education !== undefined) {
      updateFields.push('education = ?');
      updateValues.push(education || null);
    }

    if (major !== undefined) {
      updateFields.push('major = ?');
      updateValues.push(major || null);
    }

    if (interests !== undefined) {
      // 处理兴趣爱好数组，转换为JSON字符串
      const processedInterests = interests ? (Array.isArray(interests) ? JSON.stringify(interests) : interests) : null;
      updateFields.push('interests = ?');
      updateValues.push(processedInterests);
    }

    updateValues.push(targetUserId);

    // 更新用户资料
    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 获取更新后的用户信息
    const [updatedUser] = await pool.execute(
      'SELECT id, user_id, nickname, avatar, bio, location, gender, zodiac_sign, mbti, education, major, interests, follow_count, fans_count, like_count FROM users WHERE id = ?',
      [targetUserId]
    );

    res.json({
      code: 200,
      message: '资料更新成功',
      success: true,
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('更新用户资料失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 修改密码
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const userIdParam = req.params.id;
    const currentUserId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    console.log(`用户修改密码 - 目标用户ID: ${userIdParam}, 当前用户ID: ${currentUserId}`);

    // 验证必填字段
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '当前密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ code: 400, message: '新密码长度不能少于6位' });
    }

    // 获取目标用户的数字ID
    let targetUserId;
    if (/^\d+$/.test(userIdParam)) {
      targetUserId = parseInt(userIdParam);
    } else {
      const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [userIdParam]);
      if (userRows.length === 0) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      targetUserId = userRows[0].id;
    }

    // 检查是否是用户本人
    if (currentUserId !== targetUserId) {
      return res.status(403).json({ code: 403, message: '只能修改自己的密码' });
    }

    // 验证当前密码（使用SHA2哈希比较）
    const [userRows] = await pool.execute(
      'SELECT password FROM users WHERE id = ? AND password = SHA2(?, 256)',
      [targetUserId, currentPassword]
    );

    if (userRows.length === 0) {
      return res.status(400).json({ code: 400, message: '当前密码错误' });
    }

    // 更新密码（使用SHA2哈希加密）
    await pool.execute(
      'UPDATE users SET password = SHA2(?, 256) WHERE id = ?',
      [newPassword, targetUserId]
    );

    res.json({
      code: 200,
      message: '密码修改成功',
      success: true
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;