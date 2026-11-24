const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { pool } = require('../config/config');
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants');

/**
 * 认证中间件 - 验证JWT token
 */
async function authenticateToken(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        code: RESPONSE_CODES.UNAUTHORIZED,
        message: '访问令牌缺失'
      });
    }

    // 验证token
    const decoded = verifyToken(token);

    // 检查是否为管理员token
    if (decoded.type === 'admin') {
      // 管理员token验证
      const [adminRows] = await pool.execute(
        'SELECT id, username FROM admin WHERE id = ?',
        [decoded.adminId]
      );

      if (adminRows.length === 0) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          code: RESPONSE_CODES.UNAUTHORIZED,
          message: '管理员不存在'
        });
      }

      // 检查管理员会话是否有效
      const [sessionRows] = await pool.execute(
        'SELECT id FROM admin_sessions WHERE admin_id = ? AND token = ? AND is_active = 1 AND expires_at > NOW()',
        [decoded.adminId, token]
      );

      if (sessionRows.length === 0) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          code: RESPONSE_CODES.UNAUTHORIZED,
          message: '会话已过期，请重新登录'
        });
      }

      // 将管理员信息添加到请求对象
      req.user = {
        ...adminRows[0],
        type: 'admin',
        adminId: decoded.adminId
      };
      req.token = token;

      return next();
    } else {
      // 普通用户token验证
      if (!decoded.userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          code: RESPONSE_CODES.UNAUTHORIZED,
          message: '无效的访问令牌'
        });
      }

      // 检查用户是否存在且活跃
      const [userRows] = await pool.execute(
        'SELECT id, user_id, nickname, avatar, is_active FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );

      if (userRows.length === 0) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          code: RESPONSE_CODES.UNAUTHORIZED,
          message: '用户不存在或已被禁用'
        });
      }

      // 检查会话是否有效
      const [sessionRows] = await pool.execute(
        'SELECT id FROM user_sessions WHERE user_id = ? AND token = ? AND is_active = 1 AND expires_at > NOW()',
        [decoded.userId, token]
      );

      if (sessionRows.length === 0) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          code: RESPONSE_CODES.UNAUTHORIZED,
          message: '会话已过期，请重新登录'
        });
      }

      // 将用户信息添加到请求对象
      req.user = userRows[0];
      req.token = token;

      return next();
    }
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      code: RESPONSE_CODES.UNAUTHORIZED,
      message: '无效的访问令牌'
    });
  }
}

/**
 * 管理员权限验证中间件 - 在认证的基础上要求 admin 身份
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function adminAuth(req, res, next) {
  authenticateToken(req, res, (err) => {
    if (err) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        code: RESPONSE_CODES.UNAUTHORIZED,
        message: '认证失败'
      });
    }

    if (!req.user || !req.user.type || req.user.type !== 'admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        code: RESPONSE_CODES.FORBIDDEN,
        message: '权限不足，需要管理员权限'
      });
    }

    next();
  });
}

/**
 * 可选认证中间件 - 如果有token则验证，没有则跳过
 */
async function optionalAuth(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      req.user = null;
      return next();
    }

    // 验证token
    const decoded = verifyToken(token);

    // 检查用户是否存在且活跃
    const [userRows] = await pool.execute(
      'SELECT id, user_id, nickname, avatar, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (userRows.length > 0) {
      // 检查会话是否有效
      const [sessionRows] = await pool.execute(
        'SELECT id FROM user_sessions WHERE user_id = ? AND token = ? AND is_active = 1 AND expires_at > NOW()',
        [decoded.userId, token]
      );

      if (sessionRows.length > 0) {
        req.user = userRows[0];
        req.token = token;
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // 如果token无效，设置user为null继续执行
    req.user = null;
    next();
  }
}

module.exports = {
  authenticateToken,
  adminAuth,
  optionalAuth
};