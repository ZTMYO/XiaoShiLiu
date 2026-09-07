/**
 * 通用CRUD操作工厂
 */
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants')
const { success, error, handleError, validateRequired, validateIds } = require('../utils/responseHelper')
const {
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
} = require('../utils/dbHelper')

/**
 * 创建CRUD配置
 * @param {Object} config - CRUD配置
 * @param {string} config.table - 表名
 * @param {string} config.name - 资源名称（用于错误消息）
 * @param {Array} config.requiredFields - 创建时的必填字段
 * @param {Array} config.updateFields - 更新时允许的字段
 * @param {Array} config.uniqueFields - 唯一性约束字段
 * @param {Array} config.cascadeRules - 级联删除规则
 * @param {Function} config.beforeCreate - 创建前的自定义验证
 * @param {Function} config.beforeUpdate - 更新前的自定义验证
 * @param {Function} config.beforeDelete - 删除前的自定义验证
 * @param {Object} config.searchFields - 搜索字段配置
 * @param {string} config.defaultOrderBy - 默认排序
 */
function createCrudHandlers(config) {
  const {
    table,
    name,
    requiredFields = [],
    updateFields = [],
    uniqueFields = [],
    cascadeRules = [],
    beforeCreate,
    afterCreate,
    beforeUpdate,
    afterUpdate,
    beforeDelete,
    searchFields = {},
    defaultOrderBy = 'created_at DESC'
  } = config

  /**
   * 创建记录
   */
  const create = async (req, res) => {
    try {
      const data = req.body

      // 验证必填字段
      const validation = validateRequired(data, requiredFields)
      if (!validation.isValid) {
        return error(res, validation.message, RESPONSE_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST)
      }

      // 验证唯一性约束
      for (const field of uniqueFields) {
        if (data[field] && !(await isUnique(table, field, data[field]))) {
          return error(res, `${field}已存在`, RESPONSE_CODES.CONFLICT, HTTP_STATUS.CONFLICT)
        }
      }

      // 自定义验证
      if (beforeCreate) {
        const customValidation = await beforeCreate(data, req)
        if (!customValidation.isValid) {
          return error(res, customValidation.message, customValidation.code || RESPONSE_CODES.VALIDATION_ERROR, customValidation.code || HTTP_STATUS.BAD_REQUEST)
        }
      }

      // 创建记录
      const id = await createRecord(table, data)

      // 后置处理
      if (afterCreate) {
        await afterCreate(id, data, req)
      }

      success(res, { id }, `${name}创建成功`)
    } catch (err) {
      handleError(err, res, `创建${name}`)
    }
  }

  /**
   * 更新记录
   */
  const update = async (req, res) => {
    try {
      const id = req.params.id
      const data = req.body

      // 检查记录是否存在
      if (!(await recordExists(table, 'id', id))) {
        return error(res, `${name}不存在`, RESPONSE_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      }

      // 过滤允许更新的字段
      const updateData = {}
      for (const field of updateFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field]
        }
      }

      // 验证唯一性约束
      for (const field of uniqueFields) {
        if (updateData[field] && !(await isUnique(table, field, updateData[field], id))) {
          return error(res, `${field}已存在`, RESPONSE_CODES.CONFLICT, HTTP_STATUS.CONFLICT)
        }
      }

      // 自定义验证
      if (beforeUpdate) {
        const customValidation = await beforeUpdate(updateData, id, req)
        if (!customValidation.isValid) {
          return error(res, customValidation.message, customValidation.code || RESPONSE_CODES.VALIDATION_ERROR, customValidation.code || HTTP_STATUS.BAD_REQUEST)
        }
      }

      // 更新记录
      await updateRecord(table, id, updateData)

      // 后置处理
      if (afterUpdate) {
        await afterUpdate(id, data, req)
      }

      success(res, null, `${name}更新成功`)
    } catch (err) {
      handleError(err, res, `更新${name}`)
    }
  }

  /**
   * 删除单个记录
   */
  const deleteOne = async (req, res) => {
    try {
      const id = req.params.id

      // 检查记录是否存在
      if (!(await recordExists(table, 'id', id))) {
        return error(res, `${name}不存在`, RESPONSE_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      }

      // 自定义验证
      if (beforeDelete) {
        const customValidation = await beforeDelete(id, req)
        if (!customValidation.isValid) {
          return error(res, customValidation.message, customValidation.code || RESPONSE_CODES.VALIDATION_ERROR, customValidation.code || HTTP_STATUS.BAD_REQUEST)
        }
      }

      // 级联删除
      if (cascadeRules.length > 0) {
        await cascadeDelete(cascadeRules, id)
      }

      // 删除记录
      await deleteRecord(table, id)

      success(res, null, `${name}删除成功`)
    } catch (err) {
      handleError(err, res, `删除${name}`)
    }
  }

  /**
   * 批量删除记录
   */
  const deleteMany = async (req, res) => {
    try {
      const { ids } = req.body

      // 验证ID数组
      const validation = validateIds(ids, `${name}ID`)
      if (!validation.isValid) {
        return error(res, validation.message, RESPONSE_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST)
      }

      // 检查记录是否存在
      const { existingCount, missingValues } = await recordsExist(table, 'id', ids)
      if (missingValues.length > 0) {
        return error(res, `部分${name}不存在: ${missingValues.join(', ')}`, RESPONSE_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      }

      // 自定义验证
      if (beforeDelete) {
        for (const id of ids) {
          const customValidation = await beforeDelete(id, req)
          if (!customValidation.isValid) {
            return error(res, customValidation.message, customValidation.code || RESPONSE_CODES.VALIDATION_ERROR, customValidation.code || HTTP_STATUS.BAD_REQUEST)
          }
        }
      }

      // 级联删除
      if (cascadeRules.length > 0) {
        await cascadeDelete(cascadeRules, ids)
      }

      // 批量删除记录
      const deletedCount = await deleteRecords(table, ids)

      success(res, { deletedCount }, `成功删除${deletedCount}个${name}`)
    } catch (err) {
      handleError(err, res, `批量删除${name}`)
    }
  }

  /**
   * 获取单个记录
   */
  const getOne = async (req, res) => {
    try {
      const id = req.params.id

      const record = await getRecord(table, id)
      if (!record) {
        return error(res, `${name}不存在`, RESPONSE_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      }

      success(res, record)
    } catch (err) {
      handleError(err, res, `获取${name}详情`)
    }
  }

  /**
   * 获取记录列表
   */
  const getList = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20

      // 构建搜索条件
      let whereClause = ''
      const params = []

      for (const [field, config] of Object.entries(searchFields)) {
        const value = req.query[field]
        if (value) {
          const operator = config.operator || '='
          const condition = config.condition || `${field} ${operator} ?`

          whereClause += whereClause ? ` AND ${condition}` : condition

          let paramValue = value
          // 如果有transform函数，使用它转换值
          if (config.transform && typeof config.transform === 'function') {
            paramValue = config.transform(value)
          }

          if (operator === 'LIKE') {
            params.push(`%${paramValue}%`)
          } else {
            params.push(paramValue)
          }
        }
      }

      // 排序处理
      let orderBy = defaultOrderBy
      if (req.query.sortField && req.query.sortOrder) {
        const allowedSortFields = config.allowedSortFields || ['id', 'created_at']
        const sortField = req.query.sortField
        const sortOrder = req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        if (allowedSortFields.includes(sortField)) {
          orderBy = `${sortField} ${sortOrder}`
        }
      }

      const result = await getRecords(table, {
        page,
        limit,
        where: whereClause,
        params,
        orderBy
      })

      success(res, result)
    } catch (err) {
      handleError(err, res, `获取${name}列表`)
    }
  }

  return {
    create,
    update,
    deleteOne,
    deleteMany,
    getOne,
    getList
  }
}

/**
 * 创建管理后台列表查询路由处理器
 * 统一包装 config.customQueries.getList 的响应与错误处理
 * @param {Object} config - CRUD配置（须包含 customQueries.getList）
 * @param {Object} [options]
 * @param {string} [options.successMessage='success'] - 成功消息
 * @param {string} [options.errorMessage='获取列表失败'] - 失败消息
 * @param {boolean} [options.includeError=false] - 错误响应是否附带 error 字段
 * @param {Object} [options.fixedQuery={}] - 固定合并进 req.query 的查询参数
 * @param {boolean} [options.spreadData=false] - 是否将结果展开到响应顶层（替代 data 字段）
 */
function createAdminListRoute(config, options = {}) {
  const {
    successMessage = 'success',
    errorMessage = '获取列表失败',
    includeError = false,
    fixedQuery = {},
    spreadData = false
  } = options

  return async (req, res) => {
    try {
      // 合并固定查询参数
      if (Object.keys(fixedQuery).length > 0) {
        req.query = { ...req.query, ...fixedQuery }
      }

      const result = await config.customQueries.getList(req)

      if (spreadData) {
        res.json({ code: RESPONSE_CODES.SUCCESS, message: successMessage, ...result })
      } else {
        res.json({ code: RESPONSE_CODES.SUCCESS, message: successMessage, data: result })
      }
    } catch (error) {
      console.error(`${errorMessage}:`, error)
      const body = { code: RESPONSE_CODES.ERROR, message: errorMessage }
      if (includeError) {
        body.error = error.message
      }
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(body)
    }
  }
}

module.exports = {
  createCrudHandlers,
  createAdminListRoute
}