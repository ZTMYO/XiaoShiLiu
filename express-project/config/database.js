// 数据库配置
const mysql = require('mysql2/promise');
const config = require('./config');

// 数据库连接配置
const dbConfig = {
  ...config.database,
  timezone: '+08:00'
};

// 创建连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = {
  pool
};