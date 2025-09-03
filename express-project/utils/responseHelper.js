/**
 * 通用响应处理工具
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} code - 响应代码
 */
function success(res, data = null, message = '操作成功', code = 200) {
  const response = {
    code,
    message
  }

  if (data !== null) {
    response.data = data
  }

  res.status(200).json(response)
}

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} code - 错误代码
 * @param {number} httpStatus - HTTP状态码
 */
function error(res, message = '操作失败', code = 500, httpStatus = null) {
  const statusCode = httpStatus || (code >= 400 && code < 600 ? code : 500)

  res.status(statusCode).json({
    code,
    message
  })
}

/**
 * 通用错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} res - Express响应对象
 * @param {string} operation - 操作名称
 */
function handleError(err, res, operation = '操作') {
  console.error(`${operation}失败:`, err)

  // 数据库约束错误
  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, '数据已存在，请检查唯一性约束', 409, 409)
  }

  // 外键约束错误
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return error(res, '关联数据不存在', 400, 400)
  }

  // 数据格式错误
  if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
    return error(res, '数据格式错误', 400, 400)
  }

  // 默认服务器错误
  return error(res, '服务器内部错误', 500, 500)
}

/**
 * 验证必填字段
 * @param {Object} data - 要验证的数据
 * @param {Array} requiredFields - 必填字段数组
 * @returns {Object} 验证结果 {isValid: boolean, message: string}
 */
function validateRequired(data, requiredFields) {
  const missingFields = []

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field)
    }
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `缺少必填字段: ${missingFields.join(', ')}`
    }
  }

  return { isValid: true }
}

/**
 * 验证ID数组
 * @param {Array} ids - ID数组
 * @param {string} fieldName - 字段名称
 * @returns {Object} 验证结果
 */
function validateIds(ids, fieldName = 'ID') {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return {
      isValid: false,
      message: `请提供要操作的${fieldName}列表`
    }
  }

  // 验证所有ID都是有效的数字
  const invalidIds = ids.filter(id => !Number.isInteger(Number(id)) || Number(id) <= 0)
  if (invalidIds.length > 0) {
    return {
      isValid: false,
      message: `无效的${fieldName}: ${invalidIds.join(', ')}`
    }
  }

  return { isValid: true }
}

module.exports = {
  success,
  error,
  handleError,
  validateRequired,
  validateIds
}