const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const { getIPLocation, getRealIP } = require('../utils/ipLocation');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { user_id, nickname, password } = req.body;

    if (!user_id || !nickname || !password) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    if (user_id.length < 3 || user_id.length > 15) {
      return res.status(400).json({ code: 400, message: '小石榴号长度必须在3-15位之间' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(user_id)) {
      return res.status(400).json({ code: 400, message: '小石榴号只能包含字母、数字和下划线' });
    }

    if (nickname.length > 10) {
      return res.status(400).json({ code: 400, message: '昵称长度必须少于10位' });
    }

    if (password.length < 6 || password.length > 20) {
      return res.status(400).json({ code: 400, message: '密码长度必须在6-20位之间' });
    }

    // 检查用户ID是否已存在
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE user_id = ?',
      [user_id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ code: 400, message: '用户ID已存在' });
    }

    // 获取用户IP属地

    const userIP = getRealIP(req);
    let ipLocation;
    try {
      ipLocation = await getIPLocation(userIP);
    } catch (error) {
      ipLocation = '未知';
    }
    // 获取用户User-Agent
    const userAgent = req.headers['user-agent'] || '';
    const defaultAvatar = 'https://img20.360buyimg.com/openfeedback/jfs/t1/331422/15/7925/27988/68b67434Fa5a85fc3/bfe751b0ffb4fdc3.png';

    // 插入新用户（密码使用SHA2哈希加密）
    const [result] = await pool.execute(
      'INSERT INTO users (user_id, nickname, password, avatar, bio, location) VALUES (?, ?, SHA2(?, 256), ?, ?, ?)',
      [user_id, nickname, password, defaultAvatar, '', ipLocation]
    );

    const userId = result.insertId;

    // 生成JWT令牌
    const accessToken = generateAccessToken({ userId, user_id });
    const refreshToken = generateRefreshToken({ userId, user_id });

    // 保存会话
    await pool.execute(
      'INSERT INTO user_sessions (user_id, token, refresh_token, expires_at, user_agent, is_active) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?, 1)',
      [userId, accessToken, refreshToken, userAgent]
    );

    // 获取完整用户信息
    const [userRows] = await pool.execute(
      'SELECT id, user_id, nickname, avatar, bio, location, follow_count, fans_count, like_count FROM users WHERE id = ?',
      [userId]
    );

    console.log(`用户注册成功 - 用户ID: ${userId}, 小石榴号: ${userRows[0].user_id}`);

    res.json({
      code: 200,
      message: '注册成功',
      data: {
        user: userRows[0],
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600
        }
      }
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { user_id, password } = req.body;
    if (!user_id || !password) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    // 查找用户
    const [userRows] = await pool.execute(
      'SELECT id, user_id, nickname, password, avatar, bio, location, follow_count, fans_count, like_count, is_active, gender, zodiac_sign, mbti, education, major, interests FROM users WHERE user_id = ?',
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(400).json({ code: 400, message: '用户不存在' });
    }

    const user = userRows[0];

    if (!user.is_active) {
      return res.status(400).json({ code: 400, message: '账户已被禁用' });
    }

    // 验证密码（哈希比较）
    const [passwordCheck] = await pool.execute(
      'SELECT 1 FROM users WHERE id = ? AND password = SHA2(?, 256)',
      [user.id, password]
    );
    
    if (passwordCheck.length === 0) {
      return res.status(400).json({ code: 400, message: '密码错误' });
    }

    // 生成JWT令牌
    const accessToken = generateAccessToken({ userId: user.id, user_id: user.user_id });
    const refreshToken = generateRefreshToken({ userId: user.id, user_id: user.user_id });

    // 获取用户IP和User-Agent
    const userIP = getRealIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // 获取IP地理位置并更新用户location
    const ipLocation = await getIPLocation(userIP);
    await pool.execute(
      'UPDATE users SET location = ? WHERE id = ?',
      [ipLocation, user.id]
    );

    // 清除旧会话并保存新会话
    await pool.execute('UPDATE user_sessions SET is_active = 0 WHERE user_id = ?', [user.id]);
    await pool.execute(
      'INSERT INTO user_sessions (user_id, token, refresh_token, expires_at, user_agent, is_active) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?, 1)',
      [user.id, accessToken, refreshToken, userAgent]
    );

    // 更新用户对象中的location字段
    user.location = ipLocation;

    // 移除密码字段
    delete user.password;

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

    console.log(`用户登录成功 - 用户ID: ${user.id}, 小石榴号: ${user.user_id}`);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600
        }
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 刷新令牌
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ code: 400, message: '缺少刷新令牌' });
    }

    // 验证刷新令牌
    const decoded = verifyToken(refresh_token);

    // 检查会话是否有效
    const [sessionRows] = await pool.execute(
      'SELECT id FROM user_sessions WHERE user_id = ? AND refresh_token = ? AND is_active = 1 AND expires_at > NOW()',
      [decoded.userId, refresh_token]
    );

    if (sessionRows.length === 0) {
      return res.status(401).json({ code: 401, message: '刷新令牌无效或已过期' });
    }

    // 生成新的令牌
    const newAccessToken = generateAccessToken({ userId: decoded.userId, user_id: decoded.user_id });
    const newRefreshToken = generateRefreshToken({ userId: decoded.userId, user_id: decoded.user_id });

    // 获取用户IP和User-Agent
    const userIP = getRealIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // 获取IP地理位置并更新用户location
    const ipLocation = await getIPLocation(userIP);
    await pool.execute(
      'UPDATE users SET location = ? WHERE id = ?',
      [ipLocation, decoded.userId]
    );

    // 更新会话
    await pool.execute(
      'UPDATE user_sessions SET token = ?, refresh_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY), user_agent = ? WHERE id = ?',
      [newAccessToken, newRefreshToken, userAgent, sessionRows[0].id]
    );

    res.json({
      code: 200,
      message: '令牌刷新成功',
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: 3600
      }
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(401).json({ code: 401, message: '刷新令牌无效' });
  }
});

// 退出登录
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.token;

    // 将当前会话设为无效
    await pool.execute(
      'UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND token = ?',
      [userId, token]
    );

    console.log(`用户退出成功 - 用户ID: ${userId}`);

    res.json({
      code: 200,
      message: '退出成功'
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRows] = await pool.execute(
      'SELECT id, user_id, nickname, avatar, bio, location, follow_count, fans_count, like_count, is_active, created_at, gender, zodiac_sign, mbti, education, major, interests FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const user = userRows[0];

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

// 管理员登录
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }

    // 查找管理员
    const [adminRows] = await pool.execute(
      'SELECT id, username, password FROM admin WHERE username = ?',
      [username]
    );

    if (adminRows.length === 0) {
      return res.status(400).json({ code: 400, message: '管理员账号不存在' });
    }

    const admin = adminRows[0];

    // 验证密码（哈希比较）
    const [passwordCheck] = await pool.execute(
      'SELECT 1 FROM admin WHERE id = ? AND password = SHA2(?, 256)',
      [admin.id, password]
    );
    
    if (passwordCheck.length === 0) {
      return res.status(400).json({ code: 400, message: '密码错误' });
    }

    // 生成JWT令牌
    const accessToken = generateAccessToken({
      adminId: admin.id,
      username: admin.username,
      type: 'admin'
    });
    const refreshToken = generateRefreshToken({
      adminId: admin.id,
      username: admin.username,
      type: 'admin'
    });

    // 移除密码字段
    delete admin.password;

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        admin,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600
        }
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取当前管理员信息
router.get('/admin/me', authenticateToken, async (req, res) => {
  try {
    // 检查是否为管理员token
    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    const adminId = req.user.adminId;

    const [adminRows] = await pool.execute(
      'SELECT id, username FROM admin WHERE id = ?',
      [adminId]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    res.json({
      code: 200,
      message: 'success',
      data: adminRows[0]
    });
  } catch (error) {
    console.error('获取管理员信息失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取管理员列表
router.get('/admin/admins', authenticateToken, async (req, res) => {
  try {
    // 检查是否为管理员token
    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // 搜索条件
    let whereClause = '';
    const params = [];

    if (req.query.username) {
      whereClause += ' WHERE username LIKE ?';
      params.push(`%${req.query.username}%`);
    }

    // 验证排序字段
    const allowedSortFields = ['username', 'created_at'];
    const sortField = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'created_at';
    const sortOrder = req.query.sortOrder && req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM admin ${whereClause}`;
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    // 查询管理员列表
    const dataQuery = `
      SELECT username, password, created_at 
      FROM admin 
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;
    const [adminRows] = await pool.execute(dataQuery, [...params, limit, offset]);

    res.json({
      code: 200,
      message: 'success',
      data: {
        data: adminRows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取管理员列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 创建管理员
router.post('/admin/admins', authenticateToken, async (req, res) => {
  try {
    // 检查是否为管理员token
    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '账号和密码不能为空' });
    }

    // 检查用户名是否已存在
    const [existingRows] = await pool.execute(
      'SELECT id FROM admin WHERE username = ?',
      [username]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({ code: 400, message: '账号已存在' });
    }

    // 创建管理员（密码使用SHA2哈希加密）
    const [result] = await pool.execute(
      'INSERT INTO admin (username, password, created_at) VALUES (?, SHA2(?, 256), NOW())',
      [username, password]
    );

    res.json({
      code: 200,
      message: '创建管理员成功',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('创建管理员失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 更新管理员信息
router.put('/admin/admins/:id', authenticateToken, async (req, res) => {
  try {
    // 检查是否为管理员token
    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    const adminId = req.params.id;
    const { password } = req.body;

    // 验证必填字段
    if (!password) {
      return res.status(400).json({ code: 400, message: '密码不能为空' });
    }

    // 检查管理员是否存在
    const [adminRows] = await pool.execute(
      'SELECT username FROM admin WHERE username = ?',
      [adminId]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    // 更新管理员密码（使用SHA2哈希加密）
    await pool.execute(
      'UPDATE admin SET password = SHA2(?, 256) WHERE username = ?',
      [password, adminId]
    );

    res.json({
      code: 200,
      message: '更新管理员信息成功'
    });
  } catch (error) {
    console.error('更新管理员信息失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 删除管理员
router.delete('/admin/admins/:id', authenticateToken, async (req, res) => {
  try {
    // 检查是否为管理员token
    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    const adminId = req.params.id;

    // 检查管理员是否存在
    const [adminRows] = await pool.execute(
      'SELECT username FROM admin WHERE username = ?',
      [adminId]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    // 删除管理员
    await pool.execute('DELETE FROM admin WHERE username = ?', [adminId]);

    res.json({
      code: 200,
      message: '删除管理员成功'
    });
  } catch (error) {
    console.error('删除管理员失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 重置管理员密码
router.put('/admin/admins/:id/password', authenticateToken, async (req, res) => {
  try {
    // 检查是否为管理员token
    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    const adminId = req.params.id;
    const { password } = req.body;

    // 验证密码
    if (!password || password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码不能为空且长度不能少于6位' });
    }

    // 检查管理员是否存在
    const [adminRows] = await pool.execute(
      'SELECT id FROM admin WHERE id = ?',
      [adminId]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    // 更新密码（使用SHA2哈希加密）
    await pool.execute(
      'UPDATE admin SET password = SHA2(?, 256) WHERE id = ?',
      [password, adminId]
    );

    res.json({
      code: 200,
      message: '重置密码成功'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 启用/禁用管理员
router.put('/admin/admins/:id/status', authenticateToken, async (req, res) => {
  try {
    // 检查是否为管理员token
    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    const adminId = req.params.id;
    const { status } = req.body;

    // 验证状态
    if (![0, 1].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的状态' });
    }

    // 检查管理员是否存在
    const [adminRows] = await pool.execute(
      'SELECT id FROM admin WHERE id = ?',
      [adminId]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }

    // 不能禁用自己
    if (parseInt(adminId) === req.user.adminId && status === 0) {
      return res.status(400).json({ code: 400, message: '不能禁用自己' });
    }

    // 更新状态
    await pool.execute(
      'UPDATE admin SET status = ? WHERE id = ?',
      [status, adminId]
    );

    res.json({
      code: 200,
      message: `${status === 1 ? '启用' : '禁用'}管理员成功`
    });
  } catch (error) {
    console.error('更新管理员状态失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;