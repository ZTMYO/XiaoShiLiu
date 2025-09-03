import { postApi } from './index.js'
import request from './request.js'
import apiConfig from '@/config/api.js'

// 转换后端数据格式为前端瀑布流需要的格式
function transformPostData(backendPost) {

  const likeCount = backendPost.like_count || 0
  const liked = backendPost.liked || false


  const collectCount = backendPost.collect_count || 0
  const commentCount = backendPost.comment_count || 0

  const transformedData = {
    id: backendPost.id,
    image: (backendPost.images && backendPost.images[0]) || new URL('@/assets/imgs/未加载.png', import.meta.url).href,
    title: backendPost.title,
    avatar: backendPost.user_avatar || new URL('@/assets/imgs/未加载.png', import.meta.url).href,
    author: backendPost.nickname || '匿名用户',
    location: backendPost.location || '', // 添加作者的location字段
    likeCount: likeCount,
    liked: liked, // 使用后端返回的真实点赞状态
    collected: backendPost.collected || false, // 使用后端返回的真实收藏状态
    collectCount: collectCount, // 添加收藏数量到顶层
    commentCount: commentCount, // 添加评论数量到顶层
    path: `/post/${backendPost.id}`,
    category: backendPost.category || 'general',
    author_auto_id: backendPost.author_auto_id, // 作者自增ID
    author_account: backendPost.author_account, // 作者小石榴号
    user_id: backendPost.user_id, // 保持兼容性
    // 保留原始数据以备需要
    originalData: {
      content: backendPost.content,
      images: backendPost.images || [],
      tags: backendPost.tags || [],
      viewCount: backendPost.view_count || 0,
      commentCount: backendPost.comment_count || 0,
      collectCount: collectCount,
      createdAt: backendPost.created_at,
      userId: backendPost.user_id
    }
  }
  
  return transformedData;
}

// 获取笔记列表
export async function getPostList(params = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    searchKeyword,
    searchTag,
    userId,
    type,
    sort
  } = params

  try {


    let response

    // 如果指定了用户ID和类型（收藏或点赞），获取用户的收藏或点赞内容
    if (userId && type) {
      if (type === 'collections') {
        // 获取用户收藏的笔记
        response = await fetch(`${apiConfig.baseURL}/users/${userId}/collections?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json())

        if (response && response.code === 200 && response.data && response.data.collections) {
          return {
            posts: response.data.collections.map(transformPostData),
            pagination: response.data.pagination,
            hasMore: response.data.pagination.page < response.data.pagination.pages
          }
        }
      } else if (type === 'likes') {
        // 获取用户点赞的笔记
        response = await fetch(`${apiConfig.baseURL}/users/${userId}/likes?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json())

        if (response && response.code === 200 && response.data && response.data.posts) {
          return {
            posts: response.data.posts.map(transformPostData),
            pagination: response.data.pagination,
            hasMore: response.data.pagination.page < response.data.pagination.pages
          }
        }
      } else if (type === 'posts') {
        // 获取用户自己发布的笔记
        const searchParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString()
        })

        if (category) {
          searchParams.append('category', category)
        }

        if (searchKeyword && searchKeyword.trim()) {
          searchParams.append('keyword', searchKeyword.trim())
        }

        if (sort) {
          searchParams.append('sort', sort)
        }

        response = await fetch(`${apiConfig.baseURL}/users/${userId}/posts?${searchParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json())

        if (response && response.code === 200 && response.data && response.data.posts) {
          return {
            posts: response.data.posts.map(transformPostData),
            pagination: response.data.pagination,
            hasMore: response.data.pagination.page < response.data.pagination.pages
          }
        }
      }
    } else if ((searchKeyword && searchKeyword.trim()) || (searchTag && searchTag.trim())) {
      // 如果有搜索关键词或标签，使用新的统一搜索API
      const searchParams = new URLSearchParams({
        type: 'posts',
        page: page.toString(),
        limit: limit.toString()
      })

      if (searchKeyword && searchKeyword.trim()) {
        searchParams.append('keyword', searchKeyword.trim())
      }

      if (searchTag && searchTag.trim()) {
        searchParams.append('tag', searchTag.trim())
      }

      response = await fetch(`${apiConfig.baseURL}/search?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json())

      // 适配新的搜索API返回格式 - posts模式返回笔记数据
      if (response && response.code === 200 && response.data && response.data.posts && response.data.posts.data) {
        return {
          posts: response.data.posts.data.map(transformPostData),
          pagination: response.data.posts.pagination,
          hasMore: response.data.posts.pagination.page < response.data.posts.pagination.pages
        }
      }
    } else if (userId) {
      // 如果指定了用户ID，获取该用户发布的笔记
      const apiParams = { page, limit, user_id: userId }
      if (category && category !== 'general') {
        apiParams.category = category
      }
      response = await postApi.getPosts(apiParams)
    } else {
      // 否则使用普通的获取笔记列表API
      const apiParams = { page, limit }
      if (category && category !== 'general') {
        apiParams.category = category
      }
      response = await postApi.getPosts(apiParams)
    }



    if (response && response.data && response.data.posts) {
      const transformedPosts = response.data.posts.map(transformPostData)

      return {
        posts: transformedPosts,
        pagination: response.data.pagination,
        hasMore: response.data.pagination.page < response.data.pagination.pages
      }
    }
  } catch (error) {
    console.error('获取笔记列表失败:', error)
  }

  // 如果API调用失败，返回空数据
  return {
    posts: [],
    pagination: {
      page,
      limit,
      total: 0,
      pages: 0
    },
    hasMore: false
  }
}

// 获取笔记详情
export async function getPostDetail(postId) {
  try {
    const response = await postApi.getPostDetail(postId)
    if (response && response.data) {
      return transformPostData(response.data)
    }
  } catch (error) {
    console.error('获取笔记详情失败:', error)
  }

  return null
}

// 点赞笔记
export async function likePost(postId) {
  try {
    const response = await postApi.likePost(postId)
    return response
  } catch (error) {
    console.error('点赞失败:', error)
    throw error
  }
}

// 取消点赞笔记
export async function unlikePost(postId) {
  try {
    const response = await postApi.unlikePost(postId)
    return response
  } catch (error) {
    console.error('取消点赞失败:', error)
    throw error
  }
}

// 收藏笔记
export async function collectPost(postId) {
  try {
    const response = await postApi.collectPost(postId)
    return response
  } catch (error) {
    console.error('收藏失败:', error)
    throw error
  }
}

// 取消收藏笔记
export async function uncollectPost(postId) {
  try {
    const response = await postApi.uncollectPost(postId)
    return response
  } catch (error) {
    console.error('取消收藏失败:', error)
    throw error
  }
}

// 创建笔记
export async function createPost(data) {
  try {
    const response = await postApi.createPost(data)
    return {
      success: true,
      data: response.data,
      message: response.message
    }
  } catch (error) {
    console.error('创建笔记失败:', error)
    return {
      success: false,
      message: error.response?.data?.message || '创建笔记失败'
    }
  }
}

// 获取用户笔记列表
export async function getUserPosts(params = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      category,
      sort = 'created_at',
      user_id
    } = params

    const queryParams = {
      page,
      limit,
      userId: user_id,
      type: 'posts',
      searchKeyword: keyword,
      category,
      sort
    }

    const response = await getPostList(queryParams)

    return {
      success: true,
      data: {
        posts: response.posts || [],
        pagination: response.pagination || {
          page: 1,
          pages: 1,
          total: 0
        }
      }
    }
  } catch (error) {
    console.error('获取用户笔记失败:', error)
    return {
      success: false,
      message: error.response?.data?.message || '获取笔记失败'
    }
  }
}

// 更新笔记
export async function updatePost(postId, data) {
  try {
    const response = await postApi.updatePost(postId, data)
    return {
      success: true,
      data: response.data,
      message: response.message || '更新成功'
    }
  } catch (error) {
    console.error('更新笔记失败:', error)
    return {
      success: false,
      message: error.response?.data?.message || '更新笔记失败'
    }
  }
}

// 删除笔记
export async function deletePost(postId) {
  try {
    const response = await postApi.deletePost(postId)
    return {
      success: true,
      message: response.message || '删除成功'
    }
  } catch (error) {
    console.error('删除笔记失败:', error)
    return {
      success: false,
      message: error.response?.data?.message || '删除笔记失败'
    }
  }
}

// 获取草稿列表
export async function getDraftPosts(params = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      keyword = '',
      category = '',
      sort = 'created_at',
      user_id
    } = params

    const queryParams = {
      page,
      limit,
      keyword,
      category,
      sort,
      user_id,
      is_draft: 1 // 只获取草稿
    }

    // 过滤空值参数
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
        delete queryParams[key]
      }
    })

    const response = await request.get('/posts', { params: queryParams })
    
    if (response.success && response.data && response.data.posts) {
      const transformedPosts = response.data.posts.map(transformPostData)
      
      return {
        success: true,
        data: {
          posts: transformedPosts,
          pagination: response.data.pagination
        }
      }
    } else {
      return {
        success: false,
        message: response.message || '获取草稿列表失败',
        data: {
          posts: [],
          pagination: {
            page: 1,
            pages: 1,
            total: 0
          }
        }
      }
    }
  } catch (error) {
    console.error('获取草稿列表失败:', error)
    return {
      success: false,
      message: error.response?.data?.message || '获取草稿列表失败，请重试',
      data: {
        posts: [],
        pagination: {
          page: 1,
          pages: 1,
          total: 0
        }
      }
    }
  }
}