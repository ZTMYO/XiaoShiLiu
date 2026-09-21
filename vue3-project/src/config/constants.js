// 前端常量配置文件

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
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

// 图片描述前缀：标记这张图是用「文字配图」工具生成的纯文字卡片。
// 描述内容就是用户填的那段字，没有画面信息，检索时需要区别对待。
export const TEXT_IMAGE_DESC_PREFIX = '[文字配图] '

// 错误消息常量
export const ERROR_MESSAGES = {
  REQUEST_FAILED: '请求失败',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '禁止访问',
  NOT_FOUND: '资源不存在',
  TOO_MANY_REQUESTS: '请求频繁，请稍后再试',
  INTERNAL_SERVER_ERROR: '服务器内部错误',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  REQUEST_CONFIG_ERROR: '请求配置错误',
  SESSION_EXPIRED: '会话已过期，已自动退出登录'
}