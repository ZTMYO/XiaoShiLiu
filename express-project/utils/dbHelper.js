/**
 * 通用数据库操作工具
 */
const { pool } = require('../config/database')

/**
 * 检查记录是否存在
 * @param {string} table - 表名
 * @param {string} field - 字段名
 * @param {*} value - 字段值
 * @returns {Promise<boolean>} 是否存在
 */
async function recordExists(table, field, value) {
  const [result] = await pool.execute(
    `SELECT 1 FROM ${table} WHERE ${field} = ? LIMIT 1`,
    [value]
  )
  return result.length > 0
}

/**
 * 检查多个记录是否存在
 * @param {string} table - 表名
 * @param {string} field - 字段名
 * @param {Array} values - 字段值数组
 * @returns {Promise<Object>} {existingCount: number, missingValues: Array}
 */
async function recordsExist(table, field, values) {
  if (!values || values.length === 0) {
    return { existingCount: 0, missingValues: [] }
  }

  const placeholders = values.map(() => '?').join(',')
  const [result] = await pool.execute(
    `SELECT ${field} FROM ${table} WHERE ${field} IN (${placeholders})`,
    values
  )

  const existingValues = result.map(row => row[field])
  const missingValues = values.filter(value => !existingValues.includes(value))

  return {
    existingCount: existingValues.length,
    missingValues
  }
}

/**
 * 检查唯一性约束
 * @param {string} table - 表名
 * @param {string} field - 字段名
 * @param {*} value - 字段值
 * @param {number} excludeId - 排除的ID（用于更新操作）
 * @returns {Promise<boolean>} 是否唯一
 */
async function isUnique(table, field, value, excludeId = null) {
  let query = `SELECT 1 FROM ${table} WHERE ${field} = ?`
  const params = [value]

  if (excludeId) {
    query += ' AND id != ?'
    params.push(excludeId)
  }

  const [result] = await pool.execute(query, params)
  return result.length === 0
}

/**
 * 创建记录
 * @param {string} table - 表名
 * @param {Object} data - 数据对象
 * @returns {Promise<number>} 插入的ID
 */
async function createRecord(table, data) {
  const fields = Object.keys(data)
  const values = Object.values(data)
  const placeholders = fields.map(() => '?').join(',')

  const query = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders})`
  const [result] = await pool.execute(query, values)

  return result.insertId
}

/**
 * 更新记录
 * @param {string} table - 表名
 * @param {number} id - 记录ID
 * @param {Object} data - 更新数据
 * @returns {Promise<number>} 影响的行数
 */
async function updateRecord(table, id, data) {
  const fields = Object.keys(data)
  const values = Object.values(data)
  const setClause = fields.map(field => `${field} = ?`).join(', ')

  const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`
  const [result] = await pool.execute(query, [...values, id])

  return result.affectedRows
}

/**
 * 删除记录
 * @param {string} table - 表名
 * @param {number} id - 记录ID
 * @returns {Promise<number>} 影响的行数
 */
async function deleteRecord(table, id) {
  const [result] = await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id])
  return result.affectedRows
}

/**
 * 批量删除记录
 * @param {string} table - 表名
 * @param {Array} ids - ID数组
 * @returns {Promise<number>} 影响的行数
 */
async function deleteRecords(table, ids) {
  if (!ids || ids.length === 0) {
    return 0
  }

  const placeholders = ids.map(() => '?').join(',')
  const [result] = await pool.execute(
    `DELETE FROM ${table} WHERE id IN (${placeholders})`,
    ids
  )

  return result.affectedRows
}

/**
 * 获取记录详情
 * @param {string} table - 表名
 * @param {number} id - 记录ID
 * @param {string} fields - 要查询的字段，默认为*
 * @returns {Promise<Object|null>} 记录对象或null
 */
async function getRecord(table, id, fields = '*') {
  const [result] = await pool.execute(
    `SELECT ${fields} FROM ${table} WHERE id = ? LIMIT 1`,
    [id]
  )

  return result.length > 0 ? result[0] : null
}

/**
 * 获取分页记录列表
 * @param {string} table - 表名
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.limit - 每页数量
 * @param {string} options.where - WHERE条件
 * @param {Array} options.params - 查询参数
 * @param {string} options.orderBy - 排序字段
 * @param {string} options.fields - 查询字段
 * @returns {Promise<Object>} {data: Array, total: number, page: number, limit: number}
 */
async function getRecords(table, options = {}) {
  const {
    page = 1,
    limit = 20,
    where = '',
    params = [],
    orderBy = 'created_at DESC',
    fields = '*'
  } = options

  const offset = (page - 1) * limit

  // 构建查询条件
  const whereClause = where ? `WHERE ${where}` : ''

  // 获取总数
  const countQuery = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`
  const [countResult] = await pool.execute(countQuery, params)
  const total = countResult[0].total

  // 获取数据
  const dataQuery = `SELECT ${fields} FROM ${table} ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  const [dataResult] = await pool.execute(dataQuery, [...params, limit, offset])

  return {
    data: dataResult,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * 执行级联删除
 * @param {Array} cascadeRules - 级联删除规则数组
 * @param {number|Array} targetIds - 目标ID或ID数组
 * @returns {Promise<void>}
 */
async function cascadeDelete(cascadeRules, targetIds) {
  const ids = Array.isArray(targetIds) ? targetIds : [targetIds]

  for (const rule of cascadeRules) {
    const { table, field } = rule
    const placeholders = ids.map(() => '?').join(',')

    await pool.execute(
      `DELETE FROM ${table} WHERE ${field} IN (${placeholders})`,
      ids
    )
  }
}

module.exports = {
  recordExists,
  recordsExist,
  isUnique,
  createRecord,
  updateRecord,
  deleteRecord,
  deleteRecords,
  getRecord,
  getRecords,
  cascadeDelete
}