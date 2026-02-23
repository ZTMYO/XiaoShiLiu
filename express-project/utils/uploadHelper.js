const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants');
const config = require('../config/config');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * 保存图片文件到本地
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function saveImageToLocal(fileBuffer, filename, mimetype) {
  try {
    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), config.upload.image.local.uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // MIME类型到扩展名的映射
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };

    // 根据MIME类型获取正确的扩展名
    let ext = mimeToExt[mimetype] || path.extname(filename);
    // 确保扩展名以.开头
    if (!ext.startsWith('.')) {
      ext = '.' + ext;
    }
    // 如果没有扩展名，使用.jpg作为默认
    if (ext === '.') {
      ext = '.jpg';
    }

    // 生成唯一文件名
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const uniqueFilename = `${Date.now()}_${hash}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // 保存文件
    fs.writeFileSync(filePath, fileBuffer);

    // 返回访问URL
    const url = `${config.upload.image.local.baseUrl}/${config.upload.image.local.uploadDir}/${uniqueFilename}`;
    return {
      success: true,
      url: url
    };
  } catch (error) {
    console.error('❌ 图片本地保存失败:', error.message);
    return {
      success: false,
      message: error.message || '图片本地保存失败'
    };
  }
}

/**
 * 保存视频文件到本地
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function saveVideoToLocal(fileBuffer, filename, mimetype) {
  try {
    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), config.upload.video.local.uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // MIME类型到扩展名的映射
    const mimeToExt = {
      'video/mp4': '.mp4',
      'video/avi': '.avi',
      'video/mov': '.mov',
      'video/wmv': '.wmv',
      'video/flv': '.flv',
      'video/webm': '.webm'
    };

    // 根据MIME类型获取正确的扩展名
    let ext = mimeToExt[mimetype] || path.extname(filename);
    // 确保扩展名以.开头
    if (!ext.startsWith('.')) {
      ext = '.' + ext;
    }
    // 如果没有扩展名，使用.mp4作为默认
    if (ext === '.') {
      ext = '.mp4';
    }

    // 生成唯一文件名
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const uniqueFilename = `${Date.now()}_${hash}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // 保存文件
    fs.writeFileSync(filePath, fileBuffer);

    // 返回访问URL和文件路径
    const url = `${config.upload.video.local.baseUrl}/${config.upload.video.local.uploadDir}/${uniqueFilename}`;
    return {
      success: true,
      url: url,
      filePath: filePath
    };
  } catch (error) {
    console.error('❌ 视频本地保存失败:', error.message);
    return {
      success: false,
      message: error.message || '视频本地保存失败'
    };
  }
}

/**
 * 上传文件到图床
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadToImageHost(fileBuffer, filename, mimetype) {
  try {
    // 检查配置是否存在
    if (!config.upload || !config.upload.image || !config.upload.image.imagehost || !config.upload.image.imagehost.apiUrl) {
      console.error('❌ 图床配置不完整:', config.upload?.image?.imagehost);
      return {
        success: false,
        message: '图床配置不完整，缺少apiUrl'
      };
    }

    // MIME类型到扩展名的映射
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };

    // 根据MIME类型获取正确的扩展名
    let ext = mimeToExt[mimetype] || path.extname(filename);
    // 确保扩展名以.开头
    if (!ext.startsWith('.')) {
      ext = '.' + ext;
    }
    // 如果没有扩展名，使用.jpg作为默认
    if (ext === '.') {
      ext = '.jpg';
    }

    // 生成安全的文件名
    const nameWithoutExt = path.basename(filename, path.extname(filename));
    const safeFilename = `${nameWithoutExt}${ext}`;

    // 构建multipart/form-data请求体
    const boundary = `----formdata-${Date.now()}`;

    const formDataBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${safeFilename}"\r\n`),
      Buffer.from(`Content-Type: ${mimetype}\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    // 上传到图床
    const response = await axios.post(config.upload.image.imagehost.apiUrl, formDataBody, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBody.length
      },
      timeout: config.upload.image.imagehost.timeout,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    // 打印响应数据，以便调试
    console.log('图床响应数据:', response.data);

    // 检查响应格式，适配不同图床API的返回格式
    if (response.data && (response.data.errno === 0 || response.data.success === true || response.data.code === 200 || response.data.ok === true)) {
      // 尝试从不同字段获取URL
      let imageUrl;
      if (response.data.data && response.data.data.url) {
        imageUrl = response.data.data.url;
      } else if (response.data.url) {
        imageUrl = response.data.url;
      } else if (response.data.result) {
        imageUrl = response.data.result;
      } else if (response.data.data) {
        imageUrl = response.data.data;
      }

      if (imageUrl) {
        imageUrl = imageUrl.trim().replace(/\`/g, '').replace(/\s+/g, '');
        return {
          success: true,
          url: imageUrl
        };
      }
    }

    console.log('❌ 图床返回错误:', response.data);
    return {
      success: false,
      message: response.data.message || response.data.error || '图床上传失败'
    };
  } catch (error) {
    console.error('❌ 图床上传失败:', error.message);
    return {
      success: false,
      message: error.message || '图床上传失败'
    };
  }
}


/**
 * 上传图片到 Cloudflare R2
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadImageToR2(fileBuffer, filename, mimetype) {
  try {
    const r2Config = config.upload.image.r2;

    // 验证必要的配置
    if (!r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucketName || !r2Config.endpoint) {
      throw new Error('Cloudflare R2 配置不完整');
    }

    // 创建 S3 客户端（Cloudflare R2 兼容 S3 API）
    const s3Client = new S3Client({
      region: r2Config.region,
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });

    // MIME类型到扩展名的映射
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };

    // 根据MIME类型获取正确的扩展名
    let ext = mimeToExt[mimetype] || path.extname(filename);
    // 确保扩展名以.开头
    if (!ext.startsWith('.')) {
      ext = '.' + ext;
    }
    // 如果没有扩展名，使用.jpg作为默认
    if (ext === '.') {
      ext = '.jpg';
    }

    // 生成唯一文件名
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const uniqueFilename = `images/${Date.now()}_${hash}${ext}`;

    // 上传参数
    const uploadParams = {
      Bucket: r2Config.bucketName,
      Key: uniqueFilename,
      Body: fileBuffer,
      ContentType: mimetype,
    };

    // 执行上传
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // 构建访问URL
    let fileUrl;
    if (r2Config.publicUrl) {
      // 使用自定义域名
      fileUrl = `${r2Config.publicUrl}/${uniqueFilename}`;
    } else {
      // 使用默认的 R2 公共URL格式
      const accountId = r2Config.accountId;
      fileUrl = `https://pub-${accountId}.r2.dev/${uniqueFilename}`;
    }

    return {
      success: true,
      url: fileUrl
    };
  } catch (error) {
    console.error('Cloudflare R2 图片上传失败:', error.message);
    return {
      success: false,
      message: error.message || 'Cloudflare R2 图片上传失败'
    };
  }
}

/**
 * 上传视频到 Cloudflare R2
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadVideoToR2(fileBuffer, filename, mimetype) {
  try {
    const r2Config = config.upload.video.r2;

    // 验证必要的配置
    if (!r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucketName || !r2Config.endpoint) {
      throw new Error('Cloudflare R2 配置不完整');
    }

    // 创建 S3 客户端（Cloudflare R2 兼容 S3 API）
    const s3Client = new S3Client({
      region: r2Config.region,
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });

    // MIME类型到扩展名的映射
    const mimeToExt = {
      'video/mp4': '.mp4',
      'video/avi': '.avi',
      'video/mov': '.mov',
      'video/wmv': '.wmv',
      'video/flv': '.flv',
      'video/webm': '.webm'
    };

    // 根据MIME类型获取正确的扩展名
    let ext = mimeToExt[mimetype] || path.extname(filename);
    // 确保扩展名以.开头
    if (!ext.startsWith('.')) {
      ext = '.' + ext;
    }
    // 如果没有扩展名，使用.mp4作为默认
    if (ext === '.') {
      ext = '.mp4';
    }

    // 生成唯一文件名
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const uniqueFilename = `videos/${Date.now()}_${hash}${ext}`;

    // 上传参数
    const uploadParams = {
      Bucket: r2Config.bucketName,
      Key: uniqueFilename,
      Body: fileBuffer,
      ContentType: mimetype,
    };

    // 执行上传
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // 构建访问URL
    let fileUrl;
    if (r2Config.publicUrl) {
      // 使用自定义域名
      fileUrl = `${r2Config.publicUrl}/${uniqueFilename}`;
    } else {
      // 使用默认的 R2 公共URL格式
      const accountId = r2Config.accountId;
      fileUrl = `https://pub-${accountId}.r2.dev/${uniqueFilename}`;
    }

    return {
      success: true,
      url: fileUrl
    };
  } catch (error) {
    console.error('Cloudflare R2 视频上传失败:', error.message);
    return {
      success: false,
      message: error.message || 'Cloudflare R2 视频上传失败'
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
    console.error('❌ 图片上传失败:', error.message);
    // 确保删除临时文件
    if (deleteAfterUpload && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return {
      success: false,
      message: error.message || '图片上传失败'
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
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        code: RESPONSE_CODES.UNAUTHORIZED,
        message: '认证失败'
      });
    }

    if (!req.user.type || req.user.type !== 'admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        code: RESPONSE_CODES.FORBIDDEN,
        message: '权限不足，需要管理员权限'
      });
    }

    next();
  });
}

/**
 * 统一上传接口 - 根据配置选择上传策略
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
/**
 * 上传图片文件
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, message?: string}>}
 */
async function uploadImage(fileBuffer, filename, mimetype) {
  const strategy = config.upload.image.strategy;

  if (strategy === 'local') {
    return await saveImageToLocal(fileBuffer, filename, mimetype);
  } else if (strategy === 'imagehost') {
    return await uploadToImageHost(fileBuffer, filename, mimetype);
  } else if (strategy === 'r2') {
    return await uploadImageToR2(fileBuffer, filename, mimetype);
  } else {
    return {
      success: false,
      message: '未知的图片上传策略'
    };
  }
}

/**
 * 上传视频文件
 * @param {Buffer} fileBuffer - 文件缓冲区
 * @param {string} filename - 文件名
 * @param {string} mimetype - 文件MIME类型
 * @returns {Promise<{success: boolean, url?: string, filePath?: string, message?: string}>}
 */
async function uploadVideo(fileBuffer, filename, mimetype) {
  const strategy = config.upload.video.strategy;

  if (strategy === 'local') {
    return await saveVideoToLocal(fileBuffer, filename, mimetype);
  } else if (strategy === 'r2') {
    return await uploadVideoToR2(fileBuffer, filename, mimetype);
  } else {
    return {
      success: false,
      message: '未知的视频上传策略'
    };
  }
}

// 保持向后兼容的旧函数
async function uploadFile(fileBuffer, filename, mimetype) {
  // 根据文件类型判断是图片还是视频
  if (mimetype.startsWith('image/')) {
    return await uploadImage(fileBuffer, filename, mimetype);
  } else if (mimetype.startsWith('video/')) {
    return await uploadVideo(fileBuffer, filename, mimetype);
  } else {
    return {
      success: false,
      message: '不支持的文件类型'
    };
  }
}


module.exports = {
  uploadToImageHost,
  uploadFileToImageHost,
  saveImageToLocal,
  saveVideoToLocal,
  uploadImageToR2,
  uploadVideoToR2,
  uploadImage,
  uploadVideo,
  uploadFile,
  adminAuth
};