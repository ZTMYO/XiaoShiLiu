const express = require('express');
const router = express.Router();
const { HTTP_STATUS, RESPONSE_CODES, ERROR_MESSAGES } = require('../constants');
const { pool } = require('../config/config');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const NotificationHelper = require('../utils/notificationHelper');
const { extractMentionedUsers, hasMentions } = require('../utils/mentionParser');
const { sanitizeContent } = require('../utils/contentSecurity');
const { checkSensitiveWord, USER_WHITELIST } = require('../scripts/local-sensitive-word-check');

// 递归删除评论及其子评论，返回删除总数、其中计入 comment_count 的数量与全部被删ID
async function deleteCommentRecursive(commentId, status) {
  const [children] = await pool.execute('SELECT id, status FROM comments WHERE parent_id = ?', [commentId.toString()]);

  const acc = {
    deletedCount: 0,
    visibleCount: status === 1 ? 1 : 0,
    deletedIds: [commentId]
  };

  for (const child of children) {
    const childAcc = await deleteCommentRecursive(child.id, child.status);
    acc.deletedCount += childAcc.deletedCount;
    acc.visibleCount += childAcc.visibleCount;
    acc.deletedIds = acc.deletedIds.concat(childAcc.deletedIds);
  }

  // 删除当前评论的点赞记录
  await pool.execute('DELETE FROM likes WHERE target_type = 2 AND target_id = ?', [commentId.toString()]);

  // 删除当前评论
  await pool.execute('DELETE FROM comments WHERE id = ?', [commentId.toString()]);

  acc.deletedCount += 1;

  return acc;
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
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '缺少笔记ID' });
    }

    // 获取顶级评论（parent_id为NULL）：他人只看已过审，本人可看自己的待审/未过审
    const [rows] = await pool.execute(
      `SELECT c.*, u.nickname, u.avatar as user_avatar, u.id as user_auto_id, u.user_id as user_display_id, u.location as user_location, u.verified
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.parent_id IS NULL
         AND (c.status = 1 OR (c.user_id = ? AND c.status IN (0, 2)))
       ORDER BY c.is_pinned DESC, c.created_at DESC
       LIMIT ? OFFSET ?`,
      [postId.toString(), currentUserId, limit.toString(), offset.toString()]
    );

    if (rows.length > 0) {
      const commentIds = rows.map(c => c.id);
      
      // 批量获取点赞状态
      let likedCommentIds = new Set();
      if (currentUserId) {
        const [likes] = await pool.query(
          'SELECT target_id FROM likes WHERE user_id = ? AND target_type = 2 AND target_id IN (?)',
          [currentUserId.toString(), commentIds]
        );
        likedCommentIds = new Set(likes.map(l => l.target_id.toString()));
      }

      // 批量获取子评论数量（与列表可见性规则保持一致）
      const [replyCounts] = await pool.query(
        'SELECT parent_id, COUNT(*) as count FROM comments WHERE parent_id IN (?) AND (status = 1 OR (user_id = ? AND status IN (0, 2))) GROUP BY parent_id',
        [commentIds, currentUserId]
      );
      const replyCountMap = {};
      replyCounts.forEach(r => {
        replyCountMap[r.parent_id] = r.count;
      });

      // 组装数据
      for (let comment of rows) {
        comment.liked = likedCommentIds.has(comment.id.toString());
        comment.reply_count = replyCountMap[comment.id] || 0;
      }
    }

    // 获取总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM comments
       WHERE post_id = ? AND parent_id IS NULL
         AND (status = 1 OR (user_id = ? AND status IN (0, 2)))`,
      [postId.toString(), currentUserId]
    );
    const total = countResult[0].total;

    res.json({
      code: RESPONSE_CODES.SUCCESS,
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
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// 创建评论
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { post_id, content, parent_id } = req.body;
    const userId = req.user.id;

    // 验证必填字段
    if (!post_id || !content) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '笔记ID和评论内容不能为空' });
    }

    // 对内容进行安全过滤，防止XSS攻击
    const sanitizedContent = sanitizeContent(content);
    
    // 再次验证过滤后的内容不为空
    if (!sanitizedContent.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '评论内容不能为空' });
    }

    // 验证笔记是否存在
    const [postRows] = await pool.execute('SELECT id FROM posts WHERE id = ?', [post_id.toString()]);
    if (postRows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ code: RESPONSE_CODES.NOT_FOUND, message: '笔记不存在' });
    }

    // 如果是回复评论，验证父评论是否存在
    if (parent_id) {
      const [parentRows] = await pool.execute('SELECT id FROM comments WHERE id = ?', [parent_id.toString()]);
      if (parentRows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ code: RESPONSE_CODES.NOT_FOUND, message: '父评论不存在' });
      }
    }

    // 违规词检测：命中不修改内容，仅转为待审核；白名单用户豁免
    const isWhitelisted = USER_WHITELIST.includes(userId);
    const checkResult = isWhitelisted ? { hasSensitive: false } : checkSensitiveWord(sanitizedContent);
    const commentStatus = checkResult.hasSensitive ? 0 : 1;

    // 插入评论
    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, user_id, content, parent_id, status) VALUES (?, ?, ?, ?, ?)',
      [post_id.toString(), userId.toString(), sanitizedContent, parent_id ? parent_id.toString() : null, commentStatus]
    );

    const commentId = result.insertId;

    if (commentStatus === 1) {
      // 更新笔记评论数
      await pool.execute('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [post_id.toString()]);

      // 创建通知
      if (parent_id) {
        // 回复评论，给被回复的评论作者发通知
        const [parentCommentResult] = await pool.execute('SELECT user_id FROM comments WHERE id = ?', [parent_id.toString()]);
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
        const [postResult] = await pool.execute('SELECT user_id FROM posts WHERE id = ?', [post_id.toString()]);
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
                  type: NotificationHelper.TYPES.MENTION_COMMENT,
                  targetId: post_id,
                  commentId: commentId
                });

                await NotificationHelper.insertNotification(pool, mentionNotificationData);
              }
            }
          } catch (error) {
            console.error('处理@用户通知失败 - 用户: %s:', mentionedUser.userId, error);
          }
        }
      }
    } else {
      // 命中违规词：进入人工审核队列，不递增评论数
      await pool.execute(
        'INSERT INTO audit (type, target_id, status, source, remark) VALUES (?, ?, ?, ?, ?)',
        [4, commentId.toString(), 0, 1, checkResult.sensitiveWord ? `命中违规词：${checkResult.sensitiveWord}` : null]
      );
    }

    // 获取刚创建的评论的完整信息
    const [commentRows] = await pool.execute(
      `SELECT c.*, u.nickname, u.avatar as user_avatar, u.id as user_auto_id, u.user_id as user_display_id, u.location as user_location, u.verified
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId.toString()]
    );

    const commentData = commentRows[0];
    commentData.liked = false; // 新创建的评论默认未点赞
    commentData.reply_count = 0; // 新创建的评论默认无回复

    console.log('创建评论成功 - 用户ID: %s, 评论ID: %s, 状态: %s', userId, commentId, commentStatus);

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: commentStatus === 1 ? '评论成功' : '评论已提交，审核通过后展示',
      data: commentData
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
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


    // 获取子评论：他人只看已过审，本人可看自己的待审/未过审
    const [rows] = await pool.execute(
      `SELECT c.*, u.nickname, u.avatar as user_avatar, u.id as user_auto_id, u.user_id as user_display_id, u.location as user_location, u.verified
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = ?
         AND (c.status = 1 OR (c.user_id = ? AND c.status IN (0, 2)))
       ORDER BY c.created_at ASC
       LIMIT ? OFFSET ?`,
      [parentId.toString(), currentUserId, limit.toString(), offset.toString()]
    );

    // 为每个评论检查点赞状态
    if (rows.length > 0 && currentUserId) {
      const commentIds = rows.map(c => c.id);
      const [likes] = await pool.query(
        'SELECT target_id FROM likes WHERE user_id = ? AND target_type = 2 AND target_id IN (?)',
        [currentUserId.toString(), commentIds]
      );
      const likedCommentIds = new Set(likes.map(l => l.target_id.toString()));

      for (let comment of rows) {
        comment.liked = likedCommentIds.has(comment.id.toString());
      }
    } else {
      for (let comment of rows) {
        comment.liked = false;
      }
    }

    // 获取总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM comments
       WHERE parent_id = ?
         AND (status = 1 OR (user_id = ? AND status IN (0, 2)))`,
      [parentId.toString(), currentUserId]
    );
    const total = countResult[0].total;


    res.json({
      code: RESPONSE_CODES.SUCCESS,
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
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});



// 置顶/取消置顶评论（仅帖子作者可操作，且仅支持顶级评论）
router.put('/:id/pin', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    const pinned = req.body.pinned === true;

    // 验证评论是否存在
    const [commentRows] = await pool.execute(
      'SELECT id, post_id, parent_id FROM comments WHERE id = ?',
      [commentId.toString()]
    );

    if (commentRows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ code: RESPONSE_CODES.NOT_FOUND, message: '评论不存在' });
    }

    const comment = commentRows[0];

    // 仅顶级评论支持置顶
    if (comment.parent_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '只能置顶顶级评论' });
    }

    // 校验帖子作者身份
    const [postRows] = await pool.execute('SELECT user_id FROM posts WHERE id = ?', [comment.post_id.toString()]);
    if (postRows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ code: RESPONSE_CODES.NOT_FOUND, message: '笔记不存在' });
    }

    if (postRows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ code: RESPONSE_CODES.FORBIDDEN, message: '只有帖子作者可以置顶评论' });
    }

    await pool.execute('UPDATE comments SET is_pinned = ? WHERE id = ?', [pinned ? 1 : 0, commentId.toString()]);

    console.log('%s评论成功 - 评论ID: %s, 操作者用户ID: %s', pinned ? '置顶' : '取消置顶', commentId, userId);

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: pinned ? '评论已置顶' : '已取消置顶',
      data: {
        id: commentId,
        pinned: pinned
      }
    });
  } catch (error) {
    console.error('置顶评论失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// 删除评论
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    // 验证评论是否存在
    const [commentRows] = await pool.execute(
      'SELECT id, post_id, user_id, parent_id, status FROM comments WHERE id = ?',
      [commentId.toString()]
    );

    if (commentRows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ code: RESPONSE_CODES.NOT_FOUND, message: '评论不存在' });
    }

    const comment = commentRows[0];

    // 评论作者或帖子作者均可删除该评论
    let isAuthorized = comment.user_id === userId;
    if (!isAuthorized) {
      const [postRows] = await pool.execute('SELECT user_id FROM posts WHERE id = ?', [comment.post_id.toString()]);
      isAuthorized = postRows.length > 0 && postRows[0].user_id === userId;
    }
    if (!isAuthorized) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ code: RESPONSE_CODES.FORBIDDEN, message: '只能删除自己发布的评论或自己帖子下的评论' });
    }

    // 使用递归删除函数删除评论及其所有子评论
    const deleteResult = await deleteCommentRecursive(commentId, comment.status);

    // comment_count 只统计已过审评论，此处仅回退其中真正计入过的数量
    await pool.execute('UPDATE posts SET comment_count = comment_count - ? WHERE id = ?', [deleteResult.visibleCount.toString(), comment.post_id.toString()]);

    console.log('删除评论成功 - 用户ID: %s, 评论ID: %s', userId, commentId);

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '删除成功',
      data: {
        id: commentId,
        deletedCount: deleteResult.deletedCount
      }
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

module.exports = router;