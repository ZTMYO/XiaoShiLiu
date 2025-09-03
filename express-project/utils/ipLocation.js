const axios = require('axios');

/**
 * 获取IP属地信息
 * @param {string} ip - IP地址
 * @returns {Promise<string>} 返回省份信息
 */
async function getIPLocation(ip) {
  try {
    // 如果是本地IP，返回默认值
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return '本地';
    }

    // 调用IP属地API
    const response = await axios.get(`https://api.pearktrue.cn/api/ip/details`, {
      params: {
        ip: ip
      },
      timeout: 10000 // 10秒超时
    });

    if (response.data && response.data.code === 200 && response.data.data) {
      const locationData = response.data.data;
      // 根据API返回的数据结构提取省份信息
      if (locationData.subdivisions) {
        return locationData.subdivisions.replace('省', '').replace('壮族自治区', '').replace('回族自治区', '').replace('回族自治区', '').replace('特别行政区', '').replace('市', '').replace('维吾尔自治区', '').replace('自治区', '');
      } else if (locationData.region) {
        return locationData.region.replace('省', '').replace('壮族自治区', '').replace('回族自治区', '').replace('回族自治区', '').replace('特别行政区', '').replace('市', '').replace('维吾尔自治区', '').replace('自治区', '');
      }
    }

    // 如果主接口返回未知，尝试备用接口
    try {
      const backupResponse = await axios.get(`https://api.pearktrue.cn/api/ip/high`, {
        params: {
          ip: ip
        },
        timeout: 5000 // 5秒超时
      });

      if (backupResponse.data && backupResponse.data.code === 200 && backupResponse.data.data && backupResponse.data.data.province) {
        return backupResponse.data.data.province.replace('省', '').replace('壮族自治区', '').replace('回族自治区', '').replace('回族自治区', '').replace('特别行政区', '').replace('市', '').replace('维吾尔自治区', '').replace('自治区', '');
      }
    } catch (backupError) {
      console.error('备用IP属地接口调用失败:', backupError.message);
    }

    return '未知';
  } catch (error) {
    console.error('获取IP属地失败:', error.message);
    return '未知';
  }
}

/**
 * 从请求中获取真实IP地址
 * @param {Object} req - Express请求对象
 * @returns {string} IP地址
 */
function getRealIP(req) {
  let ip = req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    req.ip;

  // 处理IPv4映射的IPv6地址格式，去掉::ffff:前缀
  if (ip && typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.substring(7); // 去掉'::ffff:'前缀
  }

  // 如果是x-forwarded-for头，可能包含多个IP，取第一个
  if (ip && typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  return ip;
}

module.exports = {
  getIPLocation,
  getRealIP
};