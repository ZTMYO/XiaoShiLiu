/**
 * 自动解封功能
 * 定期检查并自动解封过期的用户封禁记录
 */

const { pool } = require('../config/config');

/**
 * 自动解封过期用户
 * @returns {Promise<void>}
 */
const autoUnbanUsers = async () => {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 更新过期的封禁记录为自动解封
    const [result] = await pool.execute(
      'UPDATE user_ban SET status = 2 WHERE status = 0 AND end_time IS NOT NULL AND end_time < ?',
      [now]
    );
    
    if (result.affectedRows > 0) {
      console.log(`● 自动解封 ${result.affectedRows} 个用户`);
    }
  } catch (error) {
    console.error('自动解封失败:', error);
  }
};

/**
 * 启动自动解封服务
 * @param {number} interval - 检查间隔（毫秒），默认1小时
 */
const startAutoUnbanService = (interval = 5 * 60 * 1000) => {
  // 启动时执行一次自动解封
  autoUnbanUsers();
  
  // 定期执行自动解封
  const intervalId = setInterval(autoUnbanUsers, interval);
  
  console.log(`● 自动解封功能已启用，每 ${Math.floor(interval / (60 * 1000))} 分钟检查一次`);
  
  return intervalId;
};

module.exports = {
  autoUnbanUsers,
  startAutoUnbanService
};
