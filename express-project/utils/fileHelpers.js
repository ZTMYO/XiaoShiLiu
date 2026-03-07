const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const { HTTP_STATUS } = require('../constants');

const IMAGE_MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

const VIDEO_MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.avi': 'video/avi',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.webm': 'video/webm'
};

function parseSize(sizeStr) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = sizeStr.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  return Math.floor(value * (units[unit] || 1));
}

function validateFilename(filename) {
  return /^[a-zA-Z0-9_.-]+$/.test(filename);
}

function getFileExt(filename) {
  return path.extname(filename).toLowerCase();
}

async function getFileStat(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function validateImageFile(filename) {
  if (!validateFilename(filename)) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const ext = getFileExt(filename);
  if (!IMAGE_MIME_TYPES[ext]) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const uploadDir = config.upload.image.local.uploadDir;
  const filePath = path.join(process.cwd(), uploadDir, filename);

  // 路径遍历检查：确保解析后的路径仍在上传目录内
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(process.cwd(), uploadDir);
  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  // 合并文件检查：一次磁盘操作获取文件信息
  const stat = await getFileStat(filePath);
  if (!stat) {
    return { valid: false, statusCode: HTTP_STATUS.NOT_FOUND };
  }

  if (!stat.isFile()) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const maxSize = parseSize(config.upload.image.maxSize);
  if (maxSize && stat.size > maxSize) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  return {
    valid: true,
    filePath,
    fileSize: stat.size,
    contentType: IMAGE_MIME_TYPES[ext]
  };
}

async function validateVideoFile(filename) {
  if (!validateFilename(filename)) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const ext = getFileExt(filename);
  if (!VIDEO_MIME_TYPES[ext]) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const uploadDir = config.upload.video.local.uploadDir;
  const filePath = path.join(process.cwd(), uploadDir, filename);

  // 路径遍历检查：确保解析后的路径仍在上传目录内
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(process.cwd(), uploadDir);
  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  // 合并文件检查：一次磁盘操作获取文件信息
  const stat = await getFileStat(filePath);
  if (!stat) {
    return { valid: false, statusCode: HTTP_STATUS.NOT_FOUND };
  }

  if (!stat.isFile()) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const maxSize = parseSize(config.upload.video.maxSize);
  if (maxSize && stat.size > maxSize) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  return {
    valid: true,
    filePath,
    fileSize: stat.size,
    contentType: VIDEO_MIME_TYPES[ext]
  };
}

module.exports = {
  validateImageFile,
  validateVideoFile,
  getFileStat,
  parseSize,
  validateFilename,
  getFileExt,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES
};
