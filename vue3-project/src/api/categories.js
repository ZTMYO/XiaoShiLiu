import request from './request.js'

// 获取所有分类
export async function getCategories(params = {}) {
  try {
    const response = await request.get('/categories', { params })
    return response
  } catch (error) {
    console.error('获取分类失败:', error)
    return {
      success: false,
      data: [],
      message: error.message || '获取分类失败'
    }
  }
}

// 获取分类详情
export async function getCategoryDetail(categoryId) {
  try {
    const response = await request.get(`/categories/${categoryId}`)
    return response
  } catch (error) {
    console.error('获取分类详情失败:', error)
    return {
      success: false,
      data: null,
      message: error.message || '获取分类详情失败'
    }
  }
}

// 创建分类
export async function createCategory(data) {
  try {
    const response = await request.post('/categories', data)
    return response
  } catch (error) {
    console.error('创建分类失败:', error)
    return {
      success: false,
      data: null,
      message: error.message || '创建分类失败'
    }
  }
}

// 更新分类
export async function updateCategory(categoryId, data) {
  try {
    const response = await request.put(`/categories/${categoryId}`, data)
    return response
  } catch (error) {
    console.error('更新分类失败:', error)
    return {
      success: false,
      data: null,
      message: error.message || '更新分类失败'
    }
  }
}

// 删除分类
export async function deleteCategory(categoryId) {
  try {
    const response = await request.delete(`/categories/${categoryId}`)
    return response
  } catch (error) {
    console.error('删除分类失败:', error)
    return {
      success: false,
      data: null,
      message: error.message || '删除分类失败'
    }
  }
}