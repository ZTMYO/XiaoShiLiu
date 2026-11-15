const { features } = require('../config/config')
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants')

/**
 * 功能开关中间件。
 * 用法：router.post('/x', authenticateToken, requireFeature('userUpload'), handler)
 * 默认值在 config.features：本地全开，线上演示站用 .env 关闭。
 */
function requireFeature(name, message) {
  return (req, res, next) => {
    if (features[name]) return next()
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      code: RESPONSE_CODES.FORBIDDEN,
      message: message || '该功能在当前部署中未启用'
    })
  }
}

module.exports = { requireFeature }
