const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 获取评论通知
router.get('/comments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = `
      SELECT n.*, 
             u.id as from_user_auto_id,
             u.nickname as from_nickname, 
             u.avatar as from_avatar, 
             u.user_id as from_user_id,
             p.title as post_title,
             (SELECT pi.image_url FROM post_images pi WHERE pi.post_id = p.id ORDER BY pi.id LIMIT 1) as post_image,
             c.content as comment_content,
             c.created_at as comment_created_at,
             c.like_count as comment_like_count,
             CASE 
               WHEN n.comment_id IS NOT NULL THEN 
                 CASE WHEN EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND target_type = 2 AND target_id = n.comment_id) 
                      THEN 1 ELSE 0 END
               ELSE 0
             END as comment_is_liked,
             CASE 
               WHEN n.type = 5 AND c.parent_id IS NOT NULL THEN 
                 (SELECT content FROM comments WHERE id = c.parent_id)
               ELSE NULL 
             END as parent_comment_content
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN posts p ON n.target_id = p.id
      LEFT JOIN comments c ON n.comment_id = c.id
      WHERE n.user_id = ? AND n.type IN (4, 5, 7)
      ORDER BY n.created_at DESC LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [userId, userId, limit, offset]);

    // 获取总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND type IN (4, 5, 7)',
      [userId]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        notifications: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取评论通知失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取点赞通知
router.get('/likes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = `
      SELECT n.*, 
             u.id as from_user_auto_id,
             u.nickname as from_nickname, 
             u.avatar as from_avatar, 
             u.user_id as from_user_id,
             p.title as post_title,
             (SELECT pi.image_url FROM post_images pi WHERE pi.post_id = p.id ORDER BY pi.id LIMIT 1) as post_image
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN posts p ON n.target_id = p.id
      WHERE n.user_id = ? AND n.type IN (1, 2)
      ORDER BY n.created_at DESC LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [userId, limit, offset]);

    // 获取总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND type IN (1, 2)',
      [userId]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        notifications: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取点赞通知失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取关注通知
router.get('/follows', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = `
      SELECT n.*, 
             u.id as from_user_auto_id,
             u.nickname as from_nickname, 
             u.avatar as from_avatar, 
             u.user_id as from_user_id
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = ? AND n.type = 6
      ORDER BY n.created_at DESC LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [userId, limit, offset]);

    // 获取总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND type = ?',
      [userId, 6]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        notifications: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取关注通知失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取收藏通知
router.get('/collections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = `
      SELECT n.*, 
             u.id as from_user_auto_id,
             u.nickname as from_nickname, 
             u.avatar as from_avatar, 
             u.user_id as from_user_id,
             p.title as post_title,
             (SELECT pi.image_url FROM post_images pi WHERE pi.post_id = p.id ORDER BY pi.id LIMIT 1) as post_image
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN posts p ON n.target_id = p.id
      WHERE n.user_id = ? AND n.type = 3
      ORDER BY n.created_at DESC LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [userId, limit, offset]);

    // 获取总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND type = ?',
      [userId, 3]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        notifications: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取收藏通知失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取通知列表（通用接口）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type; // comment, like, follow
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT n.*, 
             u.id as from_user_auto_id,
             u.nickname as from_nickname, 
             u.avatar as from_avatar, 
             u.user_id as from_user_id
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = ?
    `;
    let queryParams = [userId];

    if (type) {
      query += ` AND n.type = ?`;
      queryParams.push(type);
    }

    query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [rows] = await pool.execute(query, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    let countParams = [userId];
    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // 获取未读数量
    const [unreadResult] = await pool.execute(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    const unread = unreadResult[0].unread;

    res.json({
      code: 200,
      message: 'success',
      data: {
        notifications: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unread
      }
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 标记通知为已读
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // 验证通知是否属于当前用户
    const [notificationRows] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notificationRows.length === 0) {
      return res.status(404).json({ code: 404, message: '通知不存在' });
    }

    // 标记为已读
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [notificationId]
    );

    res.json({ code: 200, message: '标记成功' });
  } catch (error) {
    console.error('标记通知已读失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 标记所有通知为已读
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 标记所有通知为已读
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );


    res.json({ code: 200, message: '全部标记成功' });
  } catch (error) {
    console.error('标记所有通知已读失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 删除通知
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // 验证通知是否属于当前用户
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '通知不存在' });
    }

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取按类型分组的未读通知数量
router.get('/unread-count-by-type', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 按类型统计未读通知数量
    const [result] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN type IN (4, 5, 7) THEN 1 ELSE 0 END) as comments,
        SUM(CASE WHEN type IN (1, 2) THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN type = 3 THEN 1 ELSE 0 END) as collections,
        SUM(CASE WHEN type = 6 THEN 1 ELSE 0 END) as follows,
        COUNT(*) as total
      FROM notifications 
      WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    const counts = result[0];
    res.json({
      code: 200,
      message: 'success',
      data: {
        comments: parseInt(counts.comments || 0),
        likes: parseInt(counts.likes || 0),
        collections: parseInt(counts.collections || 0),
        follows: parseInt(counts.follows || 0),
        total: parseInt(counts.total || 0)
      }
    });
  } catch (error) {
    console.error('获取按类型分组的未读通知数量失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取未读通知数量
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      code: 200,
      message: 'success',
      data: { count: result[0].count }
    });
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;