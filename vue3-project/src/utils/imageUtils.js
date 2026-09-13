/**
 * 图片处理工具函数
 * 提供图片 URL 处理、格式化等功能
 */

/**
 * 获取优先级图片 URL
 * 优先使用 thumbnailUrl，为空时使用 hoverUrl
 * @param {Object} imageData - 图片数据对象
 * @param {string} imageData.thumbnailUrl - 缩略图 URL
 * @param {string} imageData.hoverUrl - 悬停图 URL
 * @param {string} fallbackUrl - 备用 URL（可选）
 * @returns {string} 处理后的图片 URL
 */
export function getImageUrl(imageData, fallbackUrl = '') {
  if (!imageData || typeof imageData !== 'object') {
    return fallbackUrl
  }

  // 清理 URL 中的反引号和空格
  const cleanUrl = (url) => {
    if (!url || typeof url !== 'string') return ''
    return url.replace(/\`/g, '').replace(/\s+/g, '').trim()
  }

  // 优先使用 thumbnailUrl
  const thumbnailUrl = cleanUrl(imageData.thumbnailUrl)
  if (thumbnailUrl) {
    return thumbnailUrl
  }

  // 其次使用 hoverUrl
  const hoverUrl = cleanUrl(imageData.hoverUrl)
  if (hoverUrl) {
    return hoverUrl
  }

  // 最后使用备用 URL
  return fallbackUrl
}

/**
 * 批量处理图片数据，提取优先级 URL
 * @param {Array} imageList - 图片数据数组
 * @param {string} fallbackUrl - 备用 URL（可选）
 * @returns {Array} 处理后的图片数据数组
 */
export function processImageList(imageList, fallbackUrl = '') {
  if (!Array.isArray(imageList)) {
    return []
  }

  return imageList.map(item => ({
    ...item,
    url: getImageUrl(item, fallbackUrl),
    // 保留原始数据以备需要
    originalData: {
      thumbnailUrl: item.thumbnailUrl,
      hoverUrl: item.hoverUrl
    }
  }))
}

/**
 * 验证图片 URL 是否有效
 * @param {string} url - 图片 URL
 * @returns {boolean} URL 是否有效
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false
  }

  // 基本的 URL 格式验证
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 获取图片的显示尺寸信息
 * @param {Object} imageData - 图片数据对象
 * @param {number} imageData.width - 图片宽度
 * @param {number} imageData.height - 图片高度
 * @param {number} maxWidth - 最大宽度（可选）
 * @param {number} maxHeight - 最大高度（可选）
 * @returns {Object} 包含宽高信息的对象
 */
export function getImageDimensions(imageData, maxWidth = null, maxHeight = null) {
  const { width = 0, height = 0 } = imageData || {}

  if (!width || !height) {
    return { width: 0, height: 0, aspectRatio: 1 }
  }

  let displayWidth = width
  let displayHeight = height
  const aspectRatio = width / height

  // 如果设置了最大尺寸，按比例缩放
  if (maxWidth && displayWidth > maxWidth) {
    displayWidth = maxWidth
    displayHeight = maxWidth / aspectRatio
  }

  if (maxHeight && displayHeight > maxHeight) {
    displayHeight = maxHeight
    displayWidth = maxHeight * aspectRatio
  }

  return {
    width: Math.round(displayWidth),
    height: Math.round(displayHeight),
    aspectRatio,
    originalWidth: width,
    originalHeight: height
  }
}

/**
 * 生成图片的备用 URL
 * @param {number} width - 宽度（已废弃，保留兼容性）
 * @param {number} height - 高度（已废弃，保留兼容性）
 * @param {string} text - 显示文本（已废弃，保留兼容性）
 * @param {string} bgColor - 背景色（已废弃，保留兼容性）
 * @returns {string} 备用图片 URL
 */
export function generateFallbackImageUrl(width = 400, height = 300, text = '图片', bgColor = 'CCCCCC') {
  return new URL('@/assets/imgs/未加载.png', import.meta.url).href
}

// 支持 URL 参数缩放的服务域名，绑定自定义域名或 CDN 后可通过 VITE_OSS_IMAGE_HOSTS 追加
const THUMBNAIL_HOSTS = (import.meta.env.VITE_OSS_IMAGE_HOSTS || 'aliyuncs.com')
  .split(',')
  .map(host => host.trim().toLowerCase())
  .filter(Boolean)

function supportsThumbnail(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return THUMBNAIL_HOSTS.some(host => hostname === host || hostname.endsWith('.' + host))
  } catch {
    return false
  }
}

/**
 * 生成图片缩略图 URL
 * 仅对支持图片处理的服务生效，其余来源（如旧图床）原样返回
 * @param {string} url - 原图 URL
 * @param {number} width - 目标宽度
 * @param {Object} options - 可选参数
 * @param {string|null} options.format - 输出格式，传 null 保持原格式
 * @param {number|null} options.quality - 压缩质量，传 null 不压缩
 * @returns {string} 缩略图 URL
 */
export function getThumbnailUrl(url, width = 480, options = {}) {
  if (!url || typeof url !== 'string' || !supportsThumbnail(url)) {
    return url
  }

  if (url.includes('x-oss-process=')) {
    return url
  }

  // 动图经缩放处理后只剩第一帧，保持原图
  if (/\.gif(\?|$)/i.test(url)) {
    return url
  }

  const { format = 'webp', quality = 75 } = options
  const process = ['image/resize,w_' + width]
  if (format) process.push('format,' + format)
  if (quality) process.push('quality,q_' + quality)

  const separator = url.includes('?') ? '&' : '?'
  return url + separator + 'x-oss-process=' + process.join('/')
}