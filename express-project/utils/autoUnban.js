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
    
    // 第一步：查询需要自动解封的封禁记录
    const [banRecords] = await pool.execute(
      'SELECT id, user_id FROM user_ban WHERE status = 0 AND end_time IS NOT NULL AND end_time < ?',
      [now]
    );
    
    if (banRecords.length > 0) {
      const banIds = banRecords.map(r => r.id);
      const userIds = banRecords.map(r => r.user_id);
      
      // 第二步：更新封禁记录状态为自动解封
      const banPlaceholders = banIds.map(() => '?').join(',');
      const [banResult] = await pool.execute(
        `UPDATE user_ban SET status = 2 WHERE id IN (${banPlaceholders})`,
        banIds
      );
      
      // 第三步：更新用户的 is_active 状态为 1（激活）
      const userPlaceholders = userIds.map(() => '?').join(',');
      const [userResult] = await pool.execute(
        `UPDATE users SET is_active = 1 WHERE id IN (${userPlaceholders})`,
        userIds
      );
      
      console.log(`● 自动解封 ${banResult.affectedRows} 个用户，重置 ${userResult.affectedRows} 个账号状态`);
    }
  } catch (error) {
    console.error('自动解封失败:', error);
  }
};

/**
 * 启动自动解封服务
 * @param {number} interval - 检查间隔（毫秒），默认1小时
 */
const startAutoUnbanService = (interval = 1 * 60 * 1000) => {
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
