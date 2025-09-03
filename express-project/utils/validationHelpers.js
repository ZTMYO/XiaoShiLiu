const { recordExists } = require('./dbHelper');

/**
 * 验证用户是否存在
 * @param {number} userId - 用户ID
 * @returns {Promise<boolean>} - 用户是否存在
 */
async function validateUserExists(userId) {
  if (!userId) {
    throw new Error('用户ID不能为空');
  }
  
  const exists = await recordExists('users', 'id', userId);
  if (!exists) {
    throw new Error('用户不存在');
  }
  
  return true;
}

/**
 * 验证目标类型是否有效
 * @param {number} targetType - 目标类型 (1: 笔记, 2: 评论)
 * @returns {boolean} - 目标类型是否有效
 */
function validateTargetType(targetType) {
  if (![1, 2].includes(targetType)) {
    throw new Error('目标类型只能是1(笔记)或2(评论)');
  }
  
  return true;
}

/**
 * 验证用户不能关注自己
 * @param {number} followerId - 关注者ID
 * @param {number} followingId - 被关注者ID
 * @returns {boolean} - 验证是否通过
 */
function validateNotSelfFollow(followerId, followingId) {
  if (followerId === followingId) {
    throw new Error('不能关注自己');
  }
  
  return true;
}

/**
 * 通用的点赞/收藏数据验证
 * @param {Object} data - 数据对象
 * @param {number} data.user_id - 用户ID
 * @param {number} data.target_type - 目标类型
 * @returns {Promise<boolean>} - 验证是否通过
 */
async function validateLikeOrFavoriteData(data) {
  validateTargetType(data.target_type);
  await validateUserExists(data.user_id);
  
  return true;
}

/**
 * 通用的关注数据验证
 * @param {Object} data - 数据对象
 * @param {number} data.follower_id - 关注者ID
 * @param {number} data.following_id - 被关注者ID
 * @returns {Promise<boolean>} - 验证是否通过
 */
async function validateFollowData(data) {
  await validateUserExists(data.follower_id);
  await validateUserExists(data.following_id);
  validateNotSelfFollow(data.follower_id, data.following_id);
  
  return true;
}

/**
 * 通用的通知数据验证
 * @param {Object} data - 数据对象
 * @param {number} data.user_id - 用户ID
 * @returns {Promise<boolean>} - 验证是否通过
 */
async function validateNotificationData(data) {
  await validateUserExists(data.user_id);
  
  return true;
}

module.exports = {
  validateUserExists,
  validateTargetType,
  validateNotSelfFollow,
  validateLikeOrFavoriteData,
  validateFollowData,
  validateNotificationData
};