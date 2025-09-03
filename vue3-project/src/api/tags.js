import request from './request.js'

// 获取所有标签
export async function getTags(params = {}) {
  try {
    const response = await request.get('/tags', { params })
    return response
  } catch (error) {
    console.error('获取标签失败:', error)
    return {
      success: false,
      data: [],
      message: error.message || '获取标签失败'
    }
  }
}

// 获取热门标签
export async function getHotTags(limit = 20) {
  try {
    const response = await request.get('/tags/hot', {
      params: { limit }
    })
    return response
  } catch (error) {
    console.error('获取热门标签失败:', error)
    return {
      success: false,
      data: [],
      message: error.message || '获取热门标签失败'
    }
  }
}

// 搜索标签
export async function searchTags(keyword, params = {}) {
  try {
    const response = await request.get('/tags/search', {
      params: { keyword, ...params }
    })
    return response
  } catch (error) {
    console.error('搜索标签失败:', error)
    return {
      success: false,
      data: [],
      message: error.message || '搜索标签失败'
    }
  }
}

// 创建标签
export async function createTag(data) {
  try {
    const response = await request.post('/tags', data)
    return response
  } catch (error) {
    console.error('创建标签失败:', error)
    return {
      success: false,
      data: null,
      message: error.message || '创建标签失败'
    }
  }
}