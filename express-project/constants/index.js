/**
 * 应用常量定义
 */

// HTTP状态码
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// 响应码
const RESPONSE_CODES = {
  SUCCESS: 200,
  ERROR: 500,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409
};

// 用户类型
const USER_TYPES = {
  ADMIN: 'admin',
  USER: 'user'
};

// 性别
const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

// 笔记分类
const POST_CATEGORIES = {
  STUDY: 'study',
  CAMPUS: 'campus', 
  EMOTION: 'emotion',
  INTEREST: 'interest',
  LIFE: 'life',
  SOCIAL: 'social',
  HELP: 'help',
  OPINION: 'opinion',
  GRADUATION: 'graduation',
  CAREER: 'career'
};

// 通知类型
const NOTIFICATION_TYPES = {
  LIKE_POST: 1,      // 点赞笔记
  LIKE_COMMENT: 2,   // 点赞评论
  COMMENT: 3,        // 评论
  FOLLOW: 4,         // 关注
  COLLECT: 5,        // 收藏
  MENTION: 7         // @提及
};

// 点赞目标类型
const LIKE_TARGET_TYPES = {
  POST: 1,     // 笔记
  COMMENT: 2   // 评论
};

// 排序字段
const SORT_FIELDS = {
  CREATED_AT: 'created_at',
  VIEW_COUNT: 'view_count',
  LIKE_COUNT: 'like_count',
  COLLECT_COUNT: 'collect_count',
  COMMENT_COUNT: 'comment_count'
};

// 排序方向
const SORT_ORDERS = {
  ASC: 'ASC',
  DESC: 'DESC'
};

// 文件类型
const FILE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document'
};

// 支持的图片格式
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

// 错误消息
const ERROR_MESSAGES = {
  VALIDATION_FAILED: '数据验证失败',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '权限不足',
  NOT_FOUND: '资源不存在',
  DUPLICATE_ENTRY: '数据已存在',
  DATABASE_ERROR: '数据库操作失败',
  UPLOAD_FAILED: '文件上传失败',
  INVALID_TOKEN: '无效的令牌',
  TOKEN_EXPIRED: '令牌已过期'
};

// 成功消息
const SUCCESS_MESSAGES = {
  OPERATION_SUCCESS: '操作成功',
  CREATE_SUCCESS: '创建成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
  UPLOAD_SUCCESS: '上传成功'
};

// 正则表达式
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  USER_ID: /^[a-zA-Z0-9_]{3,20}$/
};

module.exports = {
  HTTP_STATUS,
  RESPONSE_CODES,
  USER_TYPES,
  GENDERS,
  POST_CATEGORIES,
  NOTIFICATION_TYPES,
  LIKE_TARGET_TYPES,
  SORT_FIELDS,
  SORT_ORDERS,
  FILE_TYPES,
  SUPPORTED_IMAGE_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX_PATTERNS
};