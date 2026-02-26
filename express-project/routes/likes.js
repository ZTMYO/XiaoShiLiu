const express = require('express');
const router = express.Router();
const { HTTP_STATUS, RESPONSE_CODES, ERROR_MESSAGES } = require('../constants');
const { pool } = require('../config/config');
const { authenticateToken } = require('../middleware/auth');
const NotificationHelper = require('../utils/notificationHelper');

// 点赞/取消点赞
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { target_type, target_id } = req.body;
    const userId = req.user.id;

    // 验证参数
    if (!target_type || !target_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '缺少必要参数' });
    }

    // target_type: 1=笔记, 2=评论
    if (![1, 2].includes(parseInt(target_type))) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '无效的目标类型' });
    }

    // 检查是否已经点赞
    const [existingLike] = await pool.execute(
      'SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
      [String(userId), String(target_type), String(target_id)]
    );

    if (existingLike.length > 0) {
      // 已点赞，执行取消点赞
      await pool.execute(
        'DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
        [String(userId), String(target_type), String(target_id)]
      );

      // 更新对应表的点赞数
      if (target_type == 1) {
        // 笔记
        await pool.execute('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [String(target_id)]);

        // 更新笔记作者的获赞数
        await pool.execute(
          'UPDATE users SET like_count = like_count - 1 WHERE id = (SELECT user_id FROM posts WHERE id = ?)',
          [String(target_id)]
        );
      } else if (target_type == 2) {
        // 评论
        await pool.execute('UPDATE comments SET like_count = like_count - 1 WHERE id = ?', [String(target_id)]);
      }

      console.log(`取消点赞成功 - 用户ID: ${userId}`);
      res.json({ code: RESPONSE_CODES.SUCCESS, message: '取消点赞成功', data: { liked: false } });
    } else {
      // 未点赞，执行点赞
      await pool.execute(
        'INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)',
        [String(userId), String(target_type), String(target_id)]
      );

      // 更新对应表的点赞数
      let targetUserId = null;
      let notificationTargetId = target_id; // 默认使用原始target_id

      if (target_type == 1) {
        // 笔记
        await pool.execute('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [String(target_id)]);

        // 更新笔记作者的获赞数
        await pool.execute(
          'UPDATE users SET like_count = like_count + 1 WHERE id = (SELECT user_id FROM posts WHERE id = ?)',
          [String(target_id)]
        );

        // 获取笔记作者ID，用于创建通知
        const [postResult] = await pool.execute('SELECT user_id FROM posts WHERE id = ?', [String(target_id)]);
        if (postResult.length > 0) {
          targetUserId = postResult[0].user_id;
        }
        // 点赞笔记时，target_id就是笔记ID
        notificationTargetId = target_id;
      } else if (target_type == 2) {
        // 评论
        await pool.execute('UPDATE comments SET like_count = like_count + 1 WHERE id = ?', [String(target_id)]);

        // 获取评论作者ID和所属笔记ID，用于创建通知
        const [commentResult] = await pool.execute('SELECT user_id, post_id FROM comments WHERE id = ?', [String(target_id)]);
        if (commentResult.length > 0) {
          targetUserId = commentResult[0].user_id;
          // 点赞评论时，通知的target_id应该是评论所属的笔记ID，这样点击通知可以跳转到笔记页面
          notificationTargetId = commentResult[0].post_id;
        }
      }

      // 创建通知（不给自己发通知）
      if (targetUserId && targetUserId !== userId) {

        let notificationData;
        if (target_type == 1) {
          // 点赞笔记
          notificationData = NotificationHelper.createLikePostNotification(targetUserId, userId, notificationTargetId);
        } else if (target_type == 2) {
          // 点赞评论
          notificationData = NotificationHelper.createLikeCommentNotification(targetUserId, userId, notificationTargetId, target_id);
        }

        // 插入通知到数据库
        if (notificationData) {
          await NotificationHelper.insertNotification(pool, notificationData);
        }
      }
      console.log(`点赞成功 - 用户ID: ${userId}`);
      res.json({ code: RESPONSE_CODES.SUCCESS, message: '点赞成功', data: { liked: true } });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// 取消点赞（兼容旧接口）
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { target_type, target_id } = req.body;
    const userId = req.user.id;

    // 验证参数
    if (!target_type || !target_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '缺少必要参数' });
    }

    // 删除点赞记录
    const [result] = await pool.execute(
      'DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
      [String(userId), String(target_type), String(target_id)]
    );

    if (result.affectedRows === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ code: RESPONSE_CODES.NOT_FOUND, message: '点赞记录不存在' });
    }

    // 更新对应表的点赞数
    if (target_type == 1) {
      // 笔记
      await pool.execute('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [String(target_id)]);

      // 更新笔记作者的获赞数
      await pool.execute(
        'UPDATE users SET like_count = like_count - 1 WHERE id = (SELECT user_id FROM posts WHERE id = ?)',
        [String(target_id)]
      );
    } else if (target_type == 2) {
      // 评论
      await pool.execute('UPDATE comments SET like_count = like_count - 1 WHERE id = ?', [String(target_id)]);
    }

    console.log(`取消点赞成功 - 用户ID: ${userId}`);
    res.json({ code: RESPONSE_CODES.SUCCESS, message: '取消点赞成功' });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

module.exports = router;