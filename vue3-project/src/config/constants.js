// 前端常量配置文件

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
}

// 响应码常量
export const RESPONSE_CODES = {
  SUCCESS: 200,
  ERROR: 500,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404
}

// 错误消息常量
export const ERROR_MESSAGES = {
  REQUEST_FAILED: '请求失败',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '禁止访问',
  NOT_FOUND: '资源不存在',
  INTERNAL_SERVER_ERROR: '服务器内部错误',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  REQUEST_CONFIG_ERROR: '请求配置错误',
  SESSION_EXPIRED: '会话已过期，已自动退出登录'
}