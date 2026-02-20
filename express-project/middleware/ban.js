/**
 * 用户封禁检查中间件
 */
const { pool } = require('../config/config')
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants')

/**
 * 检查用户是否被封禁
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
async function checkUserBan(req, res, next) {
  try {
    // 如果用户未登录，直接通过
    if (!req.user) {
      return next()
    }

    const userId = req.user.id

    // 检查用户是否有未解除的封禁记录
    const [banRecords] = await pool.execute(
      'SELECT id, reason, end_time, status FROM user_ban WHERE user_id = ? AND status IN (0, 3)',
      [String(userId)]
    )

    if (banRecords.length > 0) {
      // 用户被封禁，返回403错误
      return res.status(HTTP_STATUS.OK).json({
        code: RESPONSE_CODES.FORBIDDEN,
        message: `您已被封禁，无法执行此操作。封禁原因：${banRecords[0].reason}`
      })
    }

    // 用户未被封禁，继续执行
    next()
  } catch (error) {
    console.error('检查用户封禁状态失败:', error)
    // 数据库错误，继续执行
    next()
  }
}

module.exports = {
  checkUserBan
}