const axios = require('axios');
const config = require('../config/config');

// 百度 opendata 返回的属地是「江苏省南京市 电信」这类整串，按开头的行政区名截取
const CHINA_REGIONS = [
  '北京', '天津', '上海', '重庆',
  '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南',
  '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾',
  '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门'
];

function extractRegion(location) {
  if (!location) return '';
  const text = location.trim();
  const matched = CHINA_REGIONS.find((name) => text.startsWith(name));
  if (matched) return matched;
  // 海外 IP 百度只给国家名（如「美国」），原样返回
  return text.split(/\s+/)[0];
}

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
    const response = await axios.get(config.ipLocation.api, {
      params: {
        query: ip,
        co: '',
        resource_id: '6006',
        oe: 'utf8'
      },
      timeout: config.ipLocation.timeout
    });

    // 成功时 status 是字符串 '0'，失败是数字 1，类型不一致，不能直接比较
    if (String(response.data && response.data.status) === '0') {
      const item = response.data.data && response.data.data[0];
      const region = extractRegion(item && item.location);
      if (region) return region;
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
