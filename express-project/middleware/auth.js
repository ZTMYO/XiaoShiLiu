const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { pool } = require('../config/database');

/**
 * 认证中间件 - 验证JWT token
 */
async function authenticateToken(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        code: 401,
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
        return res.status(401).json({
          code: 401,
          message: '管理员不存在'
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
        return res.status(401).json({
          code: 401,
          message: '无效的访问令牌'
        });
      }

      // 检查用户是否存在且活跃
      const [userRows] = await pool.execute(
        'SELECT id, user_id, nickname, avatar, is_active FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );

      if (userRows.length === 0) {
        return res.status(401).json({
          code: 401,
          message: '用户不存在或已被禁用'
        });
      }

      // 检查会话是否有效
      const [sessionRows] = await pool.execute(
        'SELECT id FROM user_sessions WHERE user_id = ? AND token = ? AND is_active = 1 AND expires_at > NOW()',
        [decoded.userId, token]
      );

      if (sessionRows.length === 0) {
        return res.status(401).json({
          code: 401,
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
    return res.status(401).json({
      code: 401,
      message: '无效的访问令牌'
    });
  }
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
  optionalAuth
};