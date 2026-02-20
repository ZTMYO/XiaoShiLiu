const { pool } = require('../../config/config')
const { createCrudHandlers } = require('../../middleware/crudFactory')
const { HTTP_STATUS, RESPONSE_CODES } = require('../../constants')

// 状态文本映射常量
const STATUS_MAP = {
  0: '封禁中',
  1: '管理员解封',
  2: '自动解封',
  3: '永久封禁',
  4: '封禁撤销'
}

// 公共的封禁数据处理函数
const processBanData = async (data, req) => {
  // 验证状态值，未提供时默认设置为0
  const validStatuses = [0, 1, 2, 3, 4]
  const statusNum = data.status !== undefined ? Number(data.status) : 0
  if (!validStatuses.includes(statusNum)) {
    return { isValid: false, message: '无效的状态值' }
  }
  
  // 设置状态值
  data.status = statusNum
  
  // 首先处理管理员解封状态
  if (data.status === 1) {
    // 管理员解封时，保留原来的封禁时间
    // 只需要确保时间格式正确
    if (data.end_time && typeof data.end_time === 'string' && data.end_time.includes('T')) {
      const date = new Date(data.end_time)
      data.end_time = date.toISOString().slice(0, 19).replace('T', ' ')
    }
  } else {
    // 处理其他状态的时间
    // 处理end_time为空的情况（更健壮的空值检查）
    if (!data.end_time || data.end_time === '' || data.end_time === 'null' || data.end_time === 'undefined') {
      data.end_time = null
      // 无时间时，状态自动改为3（永久封禁）
      data.status = 3
    } else {
      // 有时间时，转换ISO格式的日期时间字符串为MySQL兼容格式
      if (typeof data.end_time === 'string' && data.end_time.includes('T')) {
        const date = new Date(data.end_time)
        data.end_time = date.toISOString().slice(0, 19).replace('T', ' ')
      }
      // 有时间时，状态自动改为0（封禁中）
      data.status = 0
    }
  }

  // 自动设置操作人ID为当前登录的管理员ID
  data.operator = req.user?.id || 0

  return { isValid: true }
}

// 用户封禁CRUD配置
const userBanCrudConfig = {
  table: 'user_ban',
  name: '用户封禁',
  requiredFields: ['user_id', 'reason'],
  updateFields: ['reason', 'end_time', 'status'],
  searchFields: {
    user_id: { operator: '=' },
    reason: { operator: 'LIKE' },
    status: { operator: '=' },
    operator: { operator: '=' }
  },
  allowedSortFields: ['id', 'user_id', 'created_at', 'end_time', 'status'],
  defaultOrderBy: 'created_at DESC',

  // 自定义验证逻辑
  beforeCreate: async (data, req) => {
    const { user_id } = data

    // 检查用户是否存在
    const [userResult] = await pool.execute('SELECT id FROM users WHERE id = ?', [String(user_id)])
    if (userResult.length === 0) {
      return { isValid: false, message: '用户不存在' }
    }

    // 检查是否已经有未解除的封禁记录
    const [existingBan] = await pool.execute(
      'SELECT id FROM user_ban WHERE user_id = ? AND status IN (0, 3)',
      [String(user_id)]
    )
    
    // 如果有未解除的封禁记录，先将其状态改为"封禁撤销"
    if (existingBan.length > 0) {
      // 使用Promise.all并行处理多个封禁记录，提高性能
      const updatePromises = existingBan.map(ban => 
        pool.execute(
          'UPDATE user_ban SET status = 4, operator = ? WHERE id = ?',
          [req.user?.id || 0, ban.id]
        )
      )
      await Promise.all(updatePromises)
    }

    // 使用公共处理函数处理封禁数据
    return processBanData(data, req)
  },

  beforeUpdate: async (data, id, req) => {
    // 使用公共处理函数处理封禁数据
    return processBanData(data, req)
  },

  // 自定义查询（用于管理后台的复杂查询）
  customQueries: {
    getList: async (req) => {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit

      // 搜索条件
      let whereClause = ''
      const params = []

      if (req.query.user_id) {
        whereClause += ' WHERE ub.user_id = ?'
        params.push(req.query.user_id)
      }

      if (req.query.reason) {
        whereClause += whereClause ? ' AND ub.reason LIKE ?' : ' WHERE ub.reason LIKE ?'
        params.push(`%${req.query.reason}%`)
      }

      if (req.query.status) {
        whereClause += whereClause ? ' AND ub.status = ?' : ' WHERE ub.status = ?'
        params.push(req.query.status)
      }

      if (req.query.operator) {
        whereClause += whereClause ? ' AND ub.operator = ?' : ' WHERE ub.operator = ?'
        params.push(req.query.operator)
      }

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM user_ban ub 
        LEFT JOIN users u ON ub.user_id = u.id
        ${whereClause}
      `
      const [countResult] = await pool.execute(countQuery, params)
      const total = countResult[0].total

      // 排序处理
      const allowedSortFields = {
        'id': 'ub.id',
        'user_id': 'ub.user_id',
        'reason': 'ub.reason',
        'end_time': 'ub.end_time',
        'created_at': 'ub.created_at',
        'status': 'ub.status',
        'operator': 'ub.operator',
        'nickname': 'u.nickname'
      }
      
      const allowedSortOrders = {
        'asc': 'ASC',
        'desc': 'DESC'
      }
      
      const validSortField = allowedSortFields[req.query.sortField] || 'ub.created_at'
      const validSortOrder = allowedSortOrders[req.query.sortOrder?.toLowerCase()] || 'DESC'
      const orderClause = `ORDER BY ${validSortField} ${validSortOrder}`

      // 获取数据
      const dataQuery = `
        SELECT ub.id, ub.user_id, ub.reason, ub.end_time, ub.created_at, ub.status, ub.operator,
               u.nickname, 
               COALESCE(u.user_id, CONCAT('user', LPAD(u.id, 3, '0'))) as user_display_id
        FROM user_ban ub
        LEFT JOIN users u ON ub.user_id = u.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      const [bans] = await pool.execute(dataQuery, [...params, String(limit), String(offset)])

      // 添加状态文本
      const enhancedBans = bans.map(ban => ({
        ...ban,
        status_text: STATUS_MAP[ban.status] || '未知状态'
      }))

      return {
        data: enhancedBans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    },

    getOne: async (req) => {
      const banId = req.params.id

      const [banResult] = await pool.execute(`
        SELECT ub.*, 
               u.nickname, 
               COALESCE(u.user_id, CONCAT('user', LPAD(u.id, 3, '0'))) as user_display_id
        FROM user_ban ub
        LEFT JOIN users u ON ub.user_id = u.id
        WHERE ub.id = ?
      `, [String(banId)])

      if (banResult.length === 0) {
        return null
      }

      const ban = banResult[0]

      return {
        ...ban,
        status_text: STATUS_MAP[ban.status] || '未知状态'
      }
    }
  }
}

// 生成用户封禁CRUD处理器
const userBanHandlers = createCrudHandlers(userBanCrudConfig)

// 解封用户接口处理函数
const handleUnban = async (req, res) => {
  try {
    const banId = req.params.id
    const { reason } = req.body
    const adminId = req.user?.id || 0

    // 检查封禁记录是否存在
    const [banResult] = await pool.execute('SELECT id, user_id, status FROM user_ban WHERE id = ?', [String(banId)])
    if (banResult.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: RESPONSE_CODES.NOT_FOUND,
        message: '封禁记录不存在'
      })
    }

    const ban = banResult[0]
    if (![0, 3].includes(ban.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: RESPONSE_CODES.VALIDATION_ERROR,
        message: '该记录无需解封'
      })
    }

    // 更新封禁状态为管理员解封
    await pool.execute(
      'UPDATE user_ban SET status = 1, operator = ? WHERE id = ?',
      [String(adminId), String(banId)]
    )

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '用户已成功解封'
    })
  } catch (error) {
    console.error('解封用户失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '解封用户失败'
    })
  }
}

// 获取单个封禁记录
const handleGetOne = async (req, res) => {
  try {
    const result = await userBanCrudConfig.customQueries.getOne(req)
    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: RESPONSE_CODES.NOT_FOUND,
        message: '封禁记录不存在'
      })
    }
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取封禁记录失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取封禁记录失败'
    })
  }
}

// 获取封禁记录列表
const handleGetList = async (req, res) => {
  try {
    const result = await userBanCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取封禁列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取封禁列表失败'
    })
  }
}

// 导出路由配置
module.exports = {
  userBanCrudConfig,
  userBanHandlers,
  handleUnban,
  handleGetOne,
  handleGetList
}
