const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const { HTTP_STATUS } = require('../constants');
const { fileTypeFromFile } = require('file-type');

/**
 * 解析大小字符串（如 "10MB"）为字节数
 */
function parseSize(sizeStr) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = sizeStr.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  return Math.floor(value * (units[unit] || 1));
}

/**
 * 检查文件名是否仅包含安全字符
 */
function isValidName(filename) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(filename);
}

/**
 * 获取文件状态（不存在时返回 null）
 */
async function getStat(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

/**
 * 检查目标路径是否安全（不脱离基础目录）
 */
function isSafePath(targetPath, baseDir) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(baseDir);
  const relative = path.relative(resolvedBase, resolvedTarget);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * 根据类型获取上传配置（目录、最大尺寸、MIME 映射）
 */
function getConfig(type) {
  const cfg = config.upload[type];
  if (!cfg) return null;
  return {
    dir: cfg.local.uploadDir,
    maxSize: parseSize(cfg.maxSize),
    allowedTypes: cfg.allowedTypes || []
  };
}

/**
 * 验证文件真实 MIME 类型是否合法
 */
async function checkMime(filePath, allowedTypes) {
  try {
    const fileType = await fileTypeFromFile(filePath);
    if (!fileType) return null;
    if (!allowedTypes.includes(fileType.mime)) return null;
    return { contentType: fileType.mime };
  } catch {
    return null;
  }
}

/**
 * 构建文件绝对路径，并确保其位于上传目录内
 */
function resolvePath(filename, uploadDir) {
  const fullPath = path.join(process.cwd(), uploadDir, filename);
  const baseDir = path.join(process.cwd(), uploadDir);
  if (!isSafePath(fullPath, baseDir)) return null;
  return fullPath;
}

/**
 * 检查文件是否存在、是否为普通文件，以及是否超过大小限制
 */
async function checkFile(filePath, maxSize) {
  const stat = await getStat(filePath);
  if (!stat || !stat.isFile()) {
    return { ok: false, code: stat ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.NOT_FOUND };
  }
  if (maxSize && stat.size > maxSize) {
    return { ok: false, code: HTTP_STATUS.BAD_REQUEST };
  }
  return { ok: true, size: stat.size };
}

/**
 * 核心验证：校验文件名、路径安全性、文件状态及 MIME 类型
 */
async function validate(filename, type) {
  if (!isValidName(filename)) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const cfg = getConfig(type);
  if (!cfg) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const filePath = resolvePath(filename, cfg.dir);
  if (!filePath) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  const status = await checkFile(filePath, cfg.maxSize);
  if (!status.ok) {
    return { valid: false, statusCode: status.code };
  }

  const mimeInfo = await checkMime(filePath, cfg.allowedTypes);
  if (!mimeInfo) {
    return { valid: false, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  return {
    valid: true,
    filePath,
    fileSize: status.size,
    contentType: mimeInfo.contentType
  };
}

// ---------- 对外接口 ----------
async function validateImageFile(filename) {
  return validate(filename, 'image');
}

async function validateVideoFile(filename) {
  return validate(filename, 'video');
}

module.exports = {
  validateImageFile,
  validateVideoFile,
  parseSize
};