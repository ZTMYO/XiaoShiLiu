/**
 * 通知工具类
 * 统一管理通知类型和随机文字
 */

class NotificationHelper {
  // 通知类型定义
  static TYPES = {
    LIKE_POST: 1,      // 点赞笔记
    LIKE_COMMENT: 2,   // 点赞评论
    COLLECT_POST: 3,   // 收藏笔记
    COMMENT_POST: 4,   // 评论笔记
    REPLY_COMMENT: 5,  // 回复评论
    FOLLOW: 6,         // 关注
    MENTION: 7         // @提及
  };

  // 通知标题模板
  static TITLES = {
    [this.TYPES.LIKE_POST]: [
      '赞了你的笔记',
      '给你的笔记点了赞',
      '觉得你的笔记很赞',
      '给你点了个赞',
      '为你的笔记点赞',
      '喜欢你的笔记'
    ],
    [this.TYPES.LIKE_COMMENT]: [
      '赞了你的评论',
      '给你的评论点了赞',
      '觉得你的评论很赞',
      '为你的评论点赞',
      '喜欢你的评论'
    ],
    [this.TYPES.COLLECT_POST]: [
      '收藏了你的笔记',
      '把你的笔记加入收藏',
      '觉得你的内容值得收藏',
      '收藏了你的内容',
      '将你的笔记收藏了',
      '把你的作品收藏了'
    ],
    [this.TYPES.COMMENT_POST]: [
      '评论了你的笔记',
      '在你的笔记下留言了',
      '对你的笔记发表了评论',
      '在你的内容下评论了',
      '给你的笔记留言了'
    ],
    [this.TYPES.REPLY_COMMENT]: [
      '回复了你的评论',
      '回复了你',
      '对你的评论进行了回复',
      '回应了你的评论',
      '给你回复了'
    ],
    [this.TYPES.FOLLOW]: [
      '关注了你',
      '成为了你的粉丝',
      '开始关注你了',
      '关注了你的账号'
    ],
    [this.TYPES.MENTION]: [
      '在评论中@了你',
      '在评论中提到了你',
      '在评论中艾特了你',
      '评论中@了你',
      '提及了你'
    ]
  };

  /**
   * 获取随机通知标题
   * @param {number} type 通知类型
   * @returns {string} 随机标题
   */
  static getRandomTitle(type) {
    const titles = this.TITLES[type];
    if (!titles || titles.length === 0) {
      return '有新的通知';
    }
    return titles[Math.floor(Math.random() * titles.length)];
  }

  /**
   * 创建通知数据对象
   * @param {Object} params 通知参数
   * @param {number} params.userId 接收通知的用户ID
   * @param {number} params.senderId 发送通知的用户ID
   * @param {number} params.type 通知类型
   * @param {number|null} params.targetId 目标ID（笔记ID等）
   * @param {number|null} params.commentId 评论ID（可选）
   * @param {boolean} params.isRead 是否已读，默认false
   * @returns {Object} 通知数据对象
   */
  static createNotificationData({
    userId,
    senderId,
    type,
    targetId = null,
    commentId = null,
    isRead = false
  }) {
    return {
      user_id: userId,
      sender_id: senderId,
      type: type,
      title: this.getRandomTitle(type),
      target_id: targetId,
      comment_id: commentId,
      is_read: isRead ? 1 : 0
    };
  }

  /**
   * 创建点赞笔记通知
   * @param {number} postAuthorId 笔记作者ID
   * @param {number} likerId 点赞者ID
   * @param {number} postId 笔记ID
   * @returns {Object} 通知数据对象
   */
  static createLikePostNotification(postAuthorId, likerId, postId) {
    return this.createNotificationData({
      userId: postAuthorId,
      senderId: likerId,
      type: this.TYPES.LIKE_POST,
      targetId: postId
    });
  }

  /**
   * 创建点赞评论通知
   * @param {number} commentAuthorId 评论作者ID
   * @param {number} likerId 点赞者ID
   * @param {number} postId 笔记ID（用于跳转）
   * @param {number} commentId 评论ID
   * @returns {Object} 通知数据对象
   */
  static createLikeCommentNotification(commentAuthorId, likerId, postId, commentId) {
    return this.createNotificationData({
      userId: commentAuthorId,
      senderId: likerId,
      type: this.TYPES.LIKE_COMMENT,
      targetId: postId,
      commentId: commentId
    });
  }

  /**
   * 创建收藏笔记通知
   * @param {number} postAuthorId 笔记作者ID
   * @param {number} collectorId 收藏者ID
   * @param {number} postId 笔记ID
   * @returns {Object} 通知数据对象
   */
  static createCollectPostNotification(postAuthorId, collectorId, postId) {
    return this.createNotificationData({
      userId: postAuthorId,
      senderId: collectorId,
      type: this.TYPES.COLLECT_POST,
      targetId: postId
    });
  }

  /**
   * 创建评论笔记通知
   * @param {number} postAuthorId 笔记作者ID
   * @param {number} commenterId 评论者ID
   * @param {number} postId 笔记ID
   * @param {number} commentId 评论ID
   * @returns {Object} 通知数据对象
   */
  static createCommentPostNotification(postAuthorId, commenterId, postId, commentId) {
    return this.createNotificationData({
      userId: postAuthorId,
      senderId: commenterId,
      type: this.TYPES.COMMENT_POST,
      targetId: postId,
      commentId: commentId
    });
  }

  /**
   * 创建回复评论通知
   * @param {number} parentCommentAuthorId 被回复评论的作者ID
   * @param {number} replierId 回复者ID
   * @param {number} postId 笔记ID
   * @param {number} replyCommentId 回复评论ID
   * @returns {Object} 通知数据对象
   */
  static createReplyCommentNotification(parentCommentAuthorId, replierId, postId, replyCommentId) {
    return this.createNotificationData({
      userId: parentCommentAuthorId,
      senderId: replierId,
      type: this.TYPES.REPLY_COMMENT,
      targetId: postId,
      commentId: replyCommentId
    });
  }

  /**
   * 创建关注通知
   * @param {number} followedUserId 被关注者ID
   * @param {number} followerId 关注者ID
   * @returns {Object} 通知数据对象
   */
  static createFollowNotification(followedUserId, followerId) {
    return this.createNotificationData({
      userId: followedUserId,
      senderId: followerId,
      type: this.TYPES.FOLLOW
    });
  }

  /**
   * 创建@提及通知
   * @param {number} mentionedUserId 被@用户ID
   * @param {number} mentionerId @用户的人ID
   * @param {number} postId 笔记ID
   * @param {number} commentId 评论ID
   * @returns {Object} 通知数据对象
   */
  static createMentionNotification(mentionedUserId, mentionerId, postId, commentId) {
    return this.createNotificationData({
      userId: mentionedUserId,
      senderId: mentionerId,
      type: this.TYPES.MENTION,
      targetId: postId,
      commentId: commentId
    });
  }

  /**
   * 插入通知到数据库
   * @param {Object} pool 数据库连接池
   * @param {Object} notificationData 通知数据
   * @returns {Promise<Object>} 插入结果
   */
  static async insertNotification(pool, notificationData) {
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, sender_id, type, title, target_id, comment_id, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        notificationData.user_id,
        notificationData.sender_id,
        notificationData.type,
        notificationData.title,
        notificationData.target_id,
        notificationData.comment_id,
        notificationData.is_read
      ]
    );
    return result;
  }

  /**
   * 创建并插入通知（便捷方法）
   * @param {Object} pool 数据库连接池
   * @param {Object} params 通知参数
   * @returns {Promise<Object>} 插入结果
   */
  static async createAndInsertNotification(pool, params) {
    // 检查是否给自己发通知
    if (params.userId === params.senderId) {
      console.log('⚠️ 不给自己发通知');
      return null;
    }

    const notificationData = this.createNotificationData(params);
    return await this.insertNotification(pool, notificationData);
  }
}

module.exports = NotificationHelper;