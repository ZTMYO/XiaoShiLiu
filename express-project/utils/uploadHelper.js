const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * 上传文件到图床
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadToImageHost(fileBuffer, filename, mimetype) {
  try {
    // 构建multipart/form-data请求体
    const boundary = `----formdata-${Date.now()}`;

    const formDataBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
      Buffer.from(`Content-Type: ${mimetype}\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    // 上传到图床
    const response = await axios.post('https://api.xinyew.cn/api/jdtc', formDataBody, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBody.length
      },
      timeout: 60000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    if (response.data && response.data.errno === 0 && response.data.data && response.data.data.url) {
      const imageUrl = response.data.data.url.trim().replace(/\`/g, '').replace(/\s+/g, '');
      return {
        success: true,
        url: imageUrl
      };
    } else {
      console.log('❌ 图床返回错误:', response.data);
      return {
        success: false,
        message: '图床上传失败'
      };
    }
  } catch (error) {
    console.error('❌ 图床上传失败:', error.message);
    return {
      success: false,
      message: error.message || '图床上传失败'
    };
  }
}

/**
 * 从base64数据上传到图床
 * @param {string} base64Data - base64格式的图片数据
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadBase64ToImageHost(base64Data) {
  try {
    // 验证base64格式
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image/')) {
      return {
        success: false,
        message: '无效的base64数据'
      };
    }

    // 解析base64数据
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return {
        success: false,
        message: 'base64格式不正确'
      };
    }

    const imageType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');

    // 检查文件大小（5MB限制）
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return {
        success: false,
        message: '图片大小超过5MB限制'
      };
    }

    const filename = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${imageType}`;
    const mimetype = `image/${imageType}`;

    return await uploadToImageHost(imageBuffer, filename, mimetype);
  } catch (error) {
    console.error('❌ Base64图片上传失败:', error.message);
    return {
      success: false,
      message: error.message || 'Base64图片上传失败'
    };
  }
}

/**
 * 从文件路径上传到图床
 * @param {string} filePath - 文件路径
 * @param {string} originalname - 原始文件名
 * @param {string} mimetype - 文件MIME类型
 * @param {boolean} deleteAfterUpload - 上传后是否删除本地文件
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadFileToImageHost(filePath, originalname, mimetype, deleteAfterUpload = true) {
  try {
    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);
    const filename = originalname || path.basename(filePath);

    const result = await uploadToImageHost(fileBuffer, filename, mimetype);

    // 上传成功后删除本地文件
    if (result.success && deleteAfterUpload && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    console.error('❌ 文件上传失败:', error.message);
    // 确保删除临时文件
    if (deleteAfterUpload && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return {
      success: false,
      message: error.message || '文件上传失败'
    };
  }
}

/**
 * 管理员权限验证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
function adminAuth(req, res, next) {
  const { authenticateToken } = require('../middleware/auth');

  authenticateToken(req, res, (err) => {
    if (err) {
      return res.status(401).json({
        code: 401,
        message: '认证失败'
      });
    }

    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，需要管理员权限'
      });
    }

    next();
  });
}

module.exports = {
  uploadToImageHost,
  uploadBase64ToImageHost,
  uploadFileToImageHost,
  adminAuth
};