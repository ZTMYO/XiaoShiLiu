const pool = require('../config/database');

/**
 * 获取表的记录总数
 * @param {string} table - 表名
 * @param {string} whereClause - WHERE条件（可选）
 * @param {Array} params - 查询参数（可选）
 * @returns {Promise<number>} 记录总数
 */
async function getTableCount(table, whereClause = '', params = []) {
  try {
    const query = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    const [result] = await pool.execute(query, params);
    return result[0].count;
  } catch (error) {
    console.error(`获取${table}表记录数失败:`, error);
    throw error;
  }
}

/**
 * 获取多个表的统计信息
 * @param {Array} tables - 表配置数组，每个元素包含 {table, whereClause?, params?}
 * @returns {Promise<Object>} 统计结果对象
 */
async function getMultipleTableStats(tables) {
  try {
    const results = {};
    
    for (const config of tables) {
      const { table, alias, whereClause = '', params = [] } = config;
      const count = await getTableCount(table, whereClause, params);
      results[alias || table] = count;
    }
    
    return results;
  } catch (error) {
    console.error('获取多表统计信息失败:', error);
    throw error;
  }
}

/**
 * 获取分页查询的总数和数据
 * @param {string} table - 表名
 * @param {Object} options - 查询选项
 * @param {string} options.fields - 查询字段，默认为 '*'
 * @param {string} options.whereClause - WHERE条件
 * @param {Array} options.params - 查询参数
 * @param {string} options.orderBy - 排序条件
 * @param {number} options.page - 页码
 * @param {number} options.limit - 每页数量
 * @returns {Promise<Object>} 包含total和data的对象
 */
async function getPaginatedData(table, options = {}) {
  const {
    fields = '*',
    whereClause = '',
    params = [],
    orderBy = 'id DESC',
    page = 1,
    limit = 20
  } = options;
  
  try {
    // 获取总数
    const total = await getTableCount(table, whereClause, params);
    
    // 获取分页数据
    const offset = (page - 1) * limit;
    const dataQuery = `SELECT ${fields} FROM ${table} ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit, offset];
    
    const [data] = await pool.execute(dataQuery, dataParams);
    
    return {
      total,
      data,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('获取分页数据失败:', error);
    throw error;
  }
}

module.exports = {
  getTableCount,
  getMultipleTableStats,
  getPaginatedData
};