const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * 从URL中提取本地文件路径
 * @param {string} url - 视频文件URL
 * @returns {string|null} - 本地文件路径，如果不是本地文件则返回null
 */
function extractLocalFilePath(url) {
  try {
    if (!url || typeof url !== 'string') return null;
    
    // 检查是否是API路径格式（/api/files/...）
    if (url.startsWith('/api/files/')) {
      const match = url.match(/^\/api\/files\/(images|videos)\/(.+)$/);
      if (match) {
        const [, type, filename] = match;
        const uploadDir = type === 'images' 
          ? config.upload.image.local.uploadDir 
          : config.upload.video.local.uploadDir;
        const absolutePath = path.join(process.cwd(), uploadDir, filename);
        return absolutePath;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ 提取文件路径失败: ${url}`, error.message);
    return null;
  }
}

/**
 * 删除本地视频文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} - 删除是否成功
 */
async function deleteLocalFile(filePath) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      console.warn('⚠️ 无效的文件路径');
      return false;
    }

    // 安全检查：确保文件路径在项目目录内
    const projectRoot = process.cwd();
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(projectRoot)) {
      console.error(`❌ 安全检查失败，文件路径超出项目范围: ${filePath}`);
      return false;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    } else {
      return true; // 文件不存在也算成功
    }
  } catch (error) {
    console.error(`❌ 删除视频文件失败: ${filePath}`, error.message);
    return false;
  }
}

/**
 * 清理废弃的视频文件
 * @param {Array} videoUrls - 需要删除的视频URL数组
 * @returns {Promise<{success: boolean, deletedCount: number, failedCount: number, errors: Array}>}
 */
async function cleanupVideoFiles(videoUrls) {
  if (!Array.isArray(videoUrls) || videoUrls.length === 0) {
    return { success: true, deletedCount: 0, failedCount: 0, errors: [] };
  }

  let deletedCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const url of videoUrls) {
    try {
      const filePath = extractLocalFilePath(url);
      
      if (filePath) {
        // 只处理本地文件
        const success = await deleteLocalFile(filePath);
        if (success) {
          deletedCount++;
        } else {
          failedCount++;
          errors.push(`删除失败: ${url}`);
        }
      } else {
        // 云端文件或其他类型的URL，跳过处理
        console.log(`⏭️ 跳过非本地文件: ${url}`);
      }
    } catch (error) {
      failedCount++;
      errors.push(`处理文件时出错 ${url}: ${error.message}`);
      console.error(`❌ 处理视频文件时出错: ${url}`, error.message);
    }
  }


  
  return {
    success: failedCount === 0,
    deletedCount,
    failedCount,
    errors
  };
}

/**
 * 清理废弃的封面图片文件
 * @param {Array} coverUrls - 需要删除的封面图片URL数组
 * @returns {Promise<{success: boolean, deletedCount: number, failedCount: number, errors: Array}>}
 */
async function cleanupCoverFiles(coverUrls) {
  if (!Array.isArray(coverUrls) || coverUrls.length === 0) {
    return { success: true, deletedCount: 0, failedCount: 0, errors: [] };
  }

  let deletedCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const url of coverUrls) {
    try {
      if (!url || typeof url !== 'string') continue;

      // 检查是否是本地图片文件
      const baseUrl = config.upload.image.local.baseUrl;
      
      if (url.startsWith(baseUrl)) {
        const relativePath = url.replace(`${baseUrl}/`, '');
        const absolutePath = path.join(process.cwd(), relativePath);
        
        const success = await deleteLocalFile(absolutePath);
        if (success) {
          deletedCount++;
        } else {
          failedCount++;
          errors.push(`删除封面失败: ${url}`);
        }
      } else {
        // 云端文件或其他类型的URL，跳过处理
      }
    } catch (error) {
      failedCount++;
      errors.push(`处理封面文件时出错 ${url}: ${error.message}`);
      console.error(`❌ 处理封面文件时出错: ${url}`, error.message);
    }
  }


  
  return {
    success: failedCount === 0,
    deletedCount,
    failedCount,
    errors
  };
}

/**
 * 批量清理文件（视频和封面）
 * @param {Array} videoUrls - 视频URL数组
 * @param {Array} coverUrls - 封面URL数组
 * @returns {Promise<{success: boolean, videoResult: Object, coverResult: Object}>}
 */
async function batchCleanupFiles(videoUrls = [], coverUrls = []) {
  try {
    const [videoResult, coverResult] = await Promise.all([
      cleanupVideoFiles(videoUrls),
      cleanupCoverFiles(coverUrls)
    ]);

    const overallSuccess = videoResult.errors.length === 0 && coverResult.errors.length === 0;
    
    return {
        success: overallSuccess,
        videoFiles: {
            success: videoResult.success,
            errors: videoResult.errors.length
        },
        coverFiles: {
            success: coverResult.success,
            errors: coverResult.errors.length
        },
        allErrors: [...videoResult.errors, ...coverResult.errors]
    };
  } catch (error) {
    console.error('❌ 批量文件清理失败:', error.message);
    return {
      success: false,
      videoResult: { success: false, deletedCount: 0, failedCount: 0, errors: [error.message] },
      coverResult: { success: false, deletedCount: 0, failedCount: 0, errors: [error.message] }
    };
  }
}

module.exports = {
  cleanupVideoFiles,
  cleanupCoverFiles,
  batchCleanupFiles,
  extractLocalFilePath,
  deleteLocalFile
};