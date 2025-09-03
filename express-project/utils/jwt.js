const jwt = require('jsonwebtoken');
const config = require('../config/config');

// JWT配置
const { secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN, refreshExpiresIn: REFRESH_TOKEN_EXPIRES_IN } = config.jwt;

/**
 * 生成访问令牌
 * @param {Object} payload - 用户信息
 * @returns {String} JWT token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 生成刷新令牌
 * @param {Object} payload - 用户信息
 * @returns {String} JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * 验证令牌
 * @param {String} token - JWT token
 * @returns {Object} 解码后的用户信息
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * 从请求头中提取token
 * @param {Object} req - Express请求对象
 * @returns {String|null} token
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  JWT_SECRET
};