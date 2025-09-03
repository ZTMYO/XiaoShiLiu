const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const NotificationHelper = require('../utils/notificationHelper');
const { extractMentionedUsers, hasMentions } = require('../utils/mentionParser');

// 递归删除评论及其子评论，返回删除的评论总数
async function deleteCommentRecursive(commentId) {
  let deletedCount = 0;
  
  // 获取所有子评论
  const [children] = await pool.execute('SELECT id FROM comments WHERE parent_id = ?', [commentId]);

  // 递归删除子评论
  for (const child of children) {
    deletedCount += await deleteCommentRecursive(child.id);
  }

  // 删除当前评论的点赞记录
  await pool.execute('DELETE FROM likes WHERE target_type = 2 AND target_id = ?', [commentId]);

  // 删除当前评论
  await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);
  
  // 当前评论也算一个
  deletedCount += 1;
  
  return deletedCount;
}

// 获取评论列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const postId = req.query.post_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    if (!postId) {
      return res.status(400).json({ code: 400, message: '缺少笔记ID' });
    }

    // 获取顶级评论（parent_id为NULL）
    const [rows] = await pool.execute(
      `SELECT c.*, u.nickname, u.avatar as user_avatar, u.id as user_auto_id, u.user_id as user_display_id, u.location as user_location
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.parent_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [postId, limit, offset]
    );

    // 为每个评论检查点赞状态
    for (let comment of rows) {
      if (currentUserId) {
        const [likeResult] = await pool.execute(
          'SELECT id FROM likes WHERE user_id = ? AND target_type = 2 AND target_id = ?',
          [currentUserId, comment.id]
        );
        comment.liked = likeResult.length > 0;
      } else {
        comment.liked = false;
      }

      // 获取子评论数量
      const [childCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM comments WHERE parent_id = ?',
        [comment.id]
      );
      comment.reply_count = childCount[0].count;
    }

    // 获取总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND parent_id IS NULL',
      [postId]
    );
    const total = countResult[0].total;

    res.json({
      code: 200,
      message: 'success',
      data: {
        comments: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 创建评论
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { post_id, content, parent_id } = req.body;
    const userId = req.user.id;

    // 验证必填字段
    if (!post_id || !content) {
      return res.status(400).json({ code: 400, message: '笔记ID和评论内容不能为空' });
    }

    // 验证笔记是否存在
    const [postRows] = await pool.execute('SELECT id FROM posts WHERE id = ?', [post_id]);
    if (postRows.length === 0) {
      return res.status(404).json({ code: 404, message: '笔记不存在' });
    }

    // 如果是回复评论，验证父评论是否存在
    if (parent_id) {
      const [parentRows] = await pool.execute('SELECT id FROM comments WHERE id = ?', [parent_id]);
      if (parentRows.length === 0) {
        return res.status(404).json({ code: 404, message: '父评论不存在' });
      }
    }

    // 插入评论
    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [post_id, userId, content, parent_id || null]
    );

    const commentId = result.insertId;

    // 更新笔记评论数
    await pool.execute('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [post_id]);

    // 创建通知
    if (parent_id) {
      // 回复评论，给被回复的评论作者发通知
      const [parentCommentResult] = await pool.execute('SELECT user_id FROM comments WHERE id = ?', [parent_id]);
      if (parentCommentResult.length > 0) {
        const parentUserId = parentCommentResult[0].user_id;
        // 不给自己发通知
        if (parentUserId !== userId) {
          const notificationData = NotificationHelper.createReplyCommentNotification(parentUserId, userId, post_id, commentId);
          await NotificationHelper.insertNotification(pool, notificationData);
        }
      }
    } else {
      // 评论笔记，给笔记作者发通知
      const [postResult] = await pool.execute('SELECT user_id FROM posts WHERE id = ?', [post_id]);
      if (postResult.length > 0) {
        const postUserId = postResult[0].user_id;
        // 不给自己发通知
        if (postUserId !== userId) {
          const notificationData = NotificationHelper.createCommentPostNotification(postUserId, userId, post_id, commentId);
          await NotificationHelper.insertNotification(pool, notificationData);
        }
      }
    }

    // 处理@用户通知
    if (hasMentions(content)) {
      const mentionedUsers = extractMentionedUsers(content);

      for (const mentionedUser of mentionedUsers) {
        try {
          // 根据小石榴号查找用户的自增ID
          const [userRows] = await pool.execute('SELECT id FROM users WHERE user_id = ?', [mentionedUser.userId]);

          if (userRows.length > 0) {
            const mentionedUserId = userRows[0].id;

            // 不给自己发通知
            if (mentionedUserId !== userId) {
              // 创建@用户通知
              const mentionNotificationData = NotificationHelper.createNotificationData({
                userId: mentionedUserId,
                senderId: userId,
                type: NotificationHelper.TYPES.MENTION,
                targetId: post_id,
                commentId: commentId
              });

              await NotificationHelper.insertNotification(pool, mentionNotificationData);
            }
          }
        } catch (error) {
          console.error(`处理@用户通知失败 - 用户: ${mentionedUser.userId}:`, error);
        }
      }
    }

    console.log(`创建评论成功 - 用户ID: ${userId}, 评论ID: ${commentId}`);

    res.json({
      code: 200,
      message: '评论成功',
      data: { id: commentId }
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取子评论列表
router.get('/:id/replies', optionalAuth, async (req, res) => {
  try {
    const parentId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;


    // 获取子评论
    const [rows] = await pool.execute(
      `SELECT c.*, u.nickname, u.avatar as user_avatar, u.id as user_auto_id, u.user_id as user_display_id, u.location as user_location
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = ?
       ORDER BY c.created_at ASC
       LIMIT ? OFFSET ?`,
      [parentId, limit, offset]
    );

    // 为每个评论检查点赞状态
    for (let comment of rows) {
      if (currentUserId) {
        const [likeResult] = await pool.execute(
          'SELECT id FROM likes WHERE user_id = ? AND target_type = 2 AND target_id = ?',
          [currentUserId, comment.id]
        );
        comment.liked = likeResult.length > 0;
      } else {
        comment.liked = false;
      }
    }

    // 获取总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM comments WHERE parent_id = ?',
      [parentId]
    );
    const total = countResult[0].total;


    res.json({
      code: 200,
      message: 'success',
      data: {
        comments: rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取子评论列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});



// 删除评论
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    // 验证评论是否存在并且是当前用户发布的
    const [commentRows] = await pool.execute(
      'SELECT id, post_id, user_id, parent_id FROM comments WHERE id = ?',
      [commentId]
    );

    if (commentRows.length === 0) {
      return res.status(404).json({ code: 404, message: '评论不存在' });
    }

    const comment = commentRows[0];

    // 检查是否是评论作者
    if (comment.user_id !== userId) {
      return res.status(403).json({ code: 403, message: '只能删除自己发布的评论' });
    }

    // 使用递归删除函数删除评论及其所有子评论，获取删除的评论总数
    const deletedCount = await deleteCommentRecursive(commentId);

    // 根据实际删除的评论数量更新笔记的评论计数
    await pool.execute('UPDATE posts SET comment_count = comment_count - ? WHERE id = ?', [deletedCount, comment.post_id]);

    console.log(`删除评论成功 - 用户ID: ${userId}, 评论ID: ${commentId}`);

    res.json({
      code: 200,
      message: '删除成功',
      data: { 
        id: commentId,
        deletedCount: deletedCount
      }
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;