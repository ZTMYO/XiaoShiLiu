import request from './request.js'

// 压缩图片函数
const compressImage = (file, maxSizeMB = 0.8, quality = 0.4) => {
  return new Promise((resolve) => {
    // 对于800KB以下的文件不进行压缩
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 超过800KB的图片使用强力压缩
      const compressQuality = 0.4
      const maxDimension = 1200

      // 计算新的尺寸
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // 绘制并压缩
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        })

        resolve(compressedFile)
      }, file.type, compressQuality)
    }

    img.onerror = () => resolve(file) // 加载失败，返回原文件
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadImage(file, options = {}) {
  try {
    if (!file) throw new Error('请选择要上传的文件')
    if (file instanceof File && !file.type.startsWith('image/')) throw new Error('请选择图片文件')
    if (file.size > 5 * 1024 * 1024) throw new Error('图片大小不能超过5MB')

    // 压缩图片
    const compressedFile = await compressImage(file)

    const formData = new FormData()
    const filename = options.filename || (compressedFile instanceof File ? compressedFile.name : 'image.png')
    formData.append('file', compressedFile, filename)

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

    const response = await fetch('/api/upload/single', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) throw new Error(`HTTP错误: ${response.status}`)

    const result = await response.json()
    if (result.code !== 200) throw new Error(result.message || '上传失败')

    return {
      success: true,
      data: { url: result.data.url, originalName: filename, size: file.size },
      message: '上传成功'
    }
  } catch (error) {
    let errorMessage = '上传失败，请重试'

    if (error.name === 'AbortError') {
      errorMessage = '上传超时，请检查网络连接或稍后重试'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      data: null,
      message: errorMessage
    }
  }
}

export async function uploadImages(files, options = {}) {
  try {
    const { maxCount = 9, onProgress, onSingleComplete } = options
    const fileArray = Array.from(files)

    if (fileArray.length === 0) throw new Error('请选择要上传的文件')
    if (fileArray.length > maxCount) throw new Error(`最多只能上传${maxCount}张图片`)

    const results = []
    const errors = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]

      try {
        onProgress?.({
          current: i + 1,
          total: fileArray.length,
          percent: Math.round(((i + 1) / fileArray.length) * 100)
        })

        const result = await uploadImage(file)

        if (result.success) {
          results.push(result.data)
          onSingleComplete?.({ index: i, file, result: result.data, success: true })
        } else {
          errors.push({ file: file.name, error: result.message })
          onSingleComplete?.({ index: i, file, result: null, success: false, error: result.message })
        }
      } catch (error) {
        errors.push({ file: file.name, error: error.message })
        onSingleComplete?.({ index: i, file, result: null, success: false, error: error.message })
      }
    }

    return {
      success: results.length > 0,
      data: {
        uploaded: results,
        errors,
        total: fileArray.length,
        successCount: results.length,
        errorCount: errors.length
      },
      message: errors.length === 0 ? '所有图片上传成功' : `${results.length}张上传成功，${errors.length}张失败`
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.message || '批量上传失败，请重试'
    }
  }
}

export async function uploadCroppedImage(blob, options = {}) {
  try {
    if (!blob) throw new Error('请选择要上传的文件')
    
    const formData = new FormData()
    const filename = options.filename || 'avatar.png'
    formData.append('file', blob, filename)

    // 自动检测token类型（管理员或普通用户）
    const adminToken = localStorage.getItem('admin_token')
    const userToken = localStorage.getItem('token')
    const token = adminToken || userToken

    if (!token) {
      throw new Error('未登录，请先登录')
    }

    // 使用后端的单文件上传接口
    const response = await fetch('/api/upload/single', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.code === 200) {
      return {
        success: true,
        data: { url: result.data.url, originalName: filename, size: blob.size },
        message: '上传成功'
      }
    } else {
      throw new Error(result.message || '上传失败')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    return {
      success: false,
      data: null,
      message: error.message || '上传失败，请重试'
    }
  }
}

export function validateImageFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  } = options

  if (!file) return { valid: false, error: '请选择文件' }
  if (!file.type.startsWith('image/')) return { valid: false, error: '请选择图片文件' }
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `不支持的文件类型` }
  }
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return { valid: false, error: `文件大小不能超过${maxSizeMB}MB` }
  }
  return { valid: true, error: null }
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('不是有效的图片文件'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

export async function uploadBase64Images(base64Images) {
  try {
    if (!base64Images || !Array.isArray(base64Images) || base64Images.length === 0) {
      throw new Error('没有提供图片数据')
    }



    const response = await request.post('/upload/base64', {
      images: base64Images
    })

    if (!response.success) {
      throw new Error(response.message || '上传失败')
    }



    return {
      success: true,
      data: response.data.urls,
      message: response.message
    }
  } catch (error) {
    console.error('❌ 上传base64图片到图床失败:', error.message)

    let errorMessage = '上传失败，请重试'
    if (error.message && error.message.includes('timeout')) {
      errorMessage = '上传超时，图片较多时需要更长时间，请稍后重试'
    } else if (error.message && error.message.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络后重试'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      data: [],
      message: errorMessage
    }
  }
}

export default {
  uploadImage,
  uploadImages,
  uploadCroppedImage,
  validateImageFile,
  formatFileSize,
  createImagePreview,
  uploadBase64Images
}