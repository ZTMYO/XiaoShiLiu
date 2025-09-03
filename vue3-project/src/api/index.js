import request from './request.js'

// 用户相关API
export const userApi = {
  // 获取用户信息
  getUserInfo(userId) {
    return request.get(`/users/${userId}`)
  },

  // 获取用户个性标签
  getUserPersonalityTags(userId) {
    return request.get(`/users/${userId}/personality-tags`)
  },

  // 更新用户信息
  updateUserInfo(userId, data) {
    return request.put(`/users/${userId}`, data)
  },

  // 关注用户
  followUser(userId) {
    return request.post(`/users/${userId}/follow`)
  },

  // 取消关注用户
  unfollowUser(userId) {
    return request.delete(`/users/${userId}/follow`)
  },

  // 搜索用户
  searchUsers(keyword, params = {}) {
    return request.get('/users/search', { params: { keyword, ...params } })
  },

  // 获取互相关注列表
  getMutualFollows(userId, params = {}) {
    return request.get(`/users/${userId}/mutual-follows`, { params })
  },

  // 获取关注列表
  getFollowing(userId, params = {}) {
    return request.get(`/users/${userId}/following`, { params })
  },

  // 获取粉丝列表
  getFollowers(userId, params = {}) {
    return request.get(`/users/${userId}/followers`, { params })
  },

  // 获取关注状态
  getFollowStatus(userId) {
    return request.get(`/users/${userId}/follow-status`)
  },

  // 获取用户统计信息
  getUserStats(userId) {
    return request.get(`/users/${userId}/stats`)
  },

  // 修改密码
  changePassword(userId, data) {
    return request.put(`/users/${userId}/password`, data)
  }
}

// 笔记相关API
export const postApi = {
  // 获取笔记列表
  getPosts(params = {}) {
    return request.get('/posts', { params })
  },

  // 获取笔记详情
  getPostDetail(postId) {
    return request.get(`/posts/${postId}`)
  },

  // 搜索笔记
  searchPosts(keyword, params = {}) {
    return request.get('/search/posts', { params: { keyword, ...params } })
  },

  // 创建笔记
  createPost(data) {
    return request.post('/posts', data)
  },

  // 更新笔记
  updatePost(postId, data) {
    return request.put(`/posts/${postId}`, data)
  },

  // 删除笔记
  deletePost(postId) {
    return request.delete(`/posts/${postId}`)
  },

  // 点赞笔记
  likePost(postId) {
    return request.post('/likes', { target_type: 1, target_id: postId })
  },

  // 取消点赞笔记
  unlikePost(postId) {
    return request.delete('/likes', { data: { target_type: 1, target_id: postId } })
  },

  // 收藏笔记
  collectPost(postId) {
    return request.post(`/posts/${postId}/collect`)
  },

  // 取消收藏笔记
  uncollectPost(postId) {
    return request.delete(`/posts/${postId}/collect`)
  },

  // 获取用户笔记
  getUserPosts(userId, params = {}) {
    return request.get(`/users/${userId}/posts`, { params })
  },

  // 获取用户收藏
  getUserCollections(userId, params = {}) {
    return request.get(`/users/${userId}/collections`, { params })
  }
}

// 评论相关API
export const commentApi = {
  // 获取评论列表
  getComments(postId, params = {}) {
    // 确保postId是有效的
    if (!postId) {
      console.error('获取评论失败: 笔记ID无效')
      return Promise.reject(new Error('笔记ID无效'))
    }

    // 构建正确的API路径
    // 注意：后端API路由是 /api/posts/:id/comments
    // 但axios实例已配置baseURL为http://localhost:3001/api
    // 所以这里只需要/posts/:id/comments部分
    const url = `/posts/${postId}/comments`

    return request.get(url, { params })
      .then(response => {
        // 响应已经在拦截器中被处理成 {success, data, message} 格式
        return response
      })
      .catch(error => {
        console.error(`获取笔记[${postId}]评论失败:`, error.message)
        // 返回一个格式化的错误对象，与成功响应格式一致
        return {
          success: false,
          data: null,
          message: error.message || '获取评论失败'
        }
      })
  },

  // 获取子评论列表
  getReplies(commentId, params = {}) {
    // 确保commentId是有效的
    if (!commentId) {
      console.error('获取回复失败: 评论ID无效')
      return Promise.reject(new Error('评论ID无效'))
    }

    const url = `/comments/${commentId}/replies`

    return request.get(url, { params })
      .then(response => {
        return response
      })
      .catch(error => {
        console.error(`获取评论[${commentId}]回复失败:`, error.message)
        // 返回一个格式化的错误对象，与成功响应格式一致
        return {
          success: false,
          data: null,
          message: error.message || '获取回复失败'
        }
      })
  },

  // 创建评论
  createComment(data) {
    return request.post('/comments', data)
  },

  // 删除评论
  deleteComment(commentId) {
    return request.delete(`/comments/${commentId}`)
  },

  // 点赞评论
  likeComment(commentId) {
    return request.post('/likes', { target_type: 2, target_id: commentId })
  },

  // 取消点赞评论
  unlikeComment(commentId) {
    return request.delete('/likes', { data: { target_type: 2, target_id: commentId } })
  }
}

// 认证相关API
export const authApi = {
  // 用户登录
  login(data) {
    return request.post('/auth/login', data)
  },

  // 用户注册
  register(data) {
    return request.post('/auth/register', data)
  },

  // 退出登录
  logout() {
    return request.post('/auth/logout')
  },

  // 刷新token
  refreshToken() {
    return request.post('/auth/refresh')
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request.get('/auth/me')
  }
}

// 导入新的图片上传API
import * as imageUploadApi from './upload.js'

// 文件上传API（保持向后兼容）
export const uploadApi = {
  // 上传图片（后端接口）
  uploadImage(file) {
    const formData = new FormData()
    formData.append('image', file)
    return request.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 批量上传图片（后端接口）
  uploadImages(files) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })
    return request.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 上传base64图片到图床（新接口）
  uploadBase64Images: imageUploadApi.uploadBase64Images,

  // 上传图片到图床（新接口）
  uploadToImageHost: imageUploadApi.uploadImage,

  // 批量上传图片到图床（新接口）
  uploadMultipleToImageHost: imageUploadApi.uploadImages,

  // 上传裁剪后的图片（新接口）
  uploadCroppedImage: imageUploadApi.uploadCroppedImage,

  // 验证图片文件（新接口）
  validateImageFile: imageUploadApi.validateImageFile,

  // 格式化文件大小（新接口）
  formatFileSize: imageUploadApi.formatFileSize,

  // 生成图片预览（新接口）
  createImagePreview: imageUploadApi.createImagePreview
}

// 导出图片上传API（推荐使用）
export { imageUploadApi }

// 通知相关API
export const notificationApi = {
  // 获取评论通知
  getCommentNotifications(params = {}) {
    return request.get('/notifications/comments', { params })
  },

  // 获取点赞通知
  getLikeNotifications(params = {}) {
    return request.get('/notifications/likes', { params })
  },

  // 获取关注通知
  getFollowNotifications(params = {}) {
    return request.get('/notifications/follows', { params })
  },

  // 获取收藏通知
  getCollectionNotifications(params = {}) {
    return request.get('/notifications/collections', { params })
  },

  // 标记通知为已读
  markAsRead(notificationId) {
    return request.put(`/notifications/${notificationId}/read`)
  },

  // 标记所有通知为已读
  markAllAsRead() {
    return request.put('/notifications/read-all')
  },

  // 获取未读通知数量
  getUnreadCount() {
    return request.get('/notifications/unread-count')
  },

  // 获取按类型分组的未读通知数量
  getUnreadCountByType() {
    return request.get('/notifications/unread-count-by-type')
  },

  // 删除通知
  deleteNotification(notificationId) {
    return request.delete(`/notifications/${notificationId}`)
  }
}

// 搜索相关API
export const searchApi = {
  // 统一搜索接口
  search(params = {}) {
    return request.get('/search', { params })
  },

  // 搜索笔记（支持关键词和标签）
  searchPosts(keyword = '', tag = '', params = {}) {
    return request.get('/search', {
      params: {
        keyword,
        tag,
        type: 'posts',
        ...params
      }
    })
  },

  // 搜索用户
  searchUsers(keyword = '', params = {}) {
    return request.get('/search', {
      params: {
        keyword,
        type: 'users',
        ...params
      }
    })
  }
}

// 管理员相关API
export const adminApi = {
  // 管理员登录
  login(data) {
    return request.post('/auth/admin/login', data)
  },

  // 获取当前管理员信息
  getCurrentAdmin() {
    return request.get('/auth/admin/me')
  },

  // 管理员退出登录
  logout() {
    return request.post('/auth/admin/logout')
  },

  // ========== 用户管理 ==========
  // 获取用户列表
  getUsers(params = {}) {
    return request.get('/admin/users', { params })
  },

  // 创建用户
  createUser(data) {
    return request.post('/admin/users', data)
  },

  // 更新用户信息
  updateUser(userId, data) {
    return request.put(`/admin/users/${userId}`, data)
  },

  // 删除用户
  deleteUser(userId) {
    return request.delete(`/admin/users/${userId}`)
  },

  // 批量删除用户
  batchDeleteUsers(ids) {
    return request.delete('/admin/users', { data: { ids } })
  },

  // 获取单个用户详情
  getUserDetail(userId) {
    return request.get(`/admin/users/${userId}`)
  },

  // ========== 笔记管理 ==========
  // 获取笔记列表
  getPosts(params = {}) {
    return request.get('/admin/posts', { params })
  },

  // 创建笔记
  createPost(data) {
    return request.post('/admin/posts', data)
  },

  // 更新笔记
  updatePost(postId, data) {
    return request.put(`/admin/posts/${postId}`, data)
  },

  // 删除笔记
  deletePost(postId) {
    return request.delete(`/admin/posts/${postId}`)
  },

  // 批量删除笔记
  batchDeletePosts(ids) {
    return request.delete('/admin/posts', { data: { ids } })
  },

  // 获取单个笔记详情
  getPostDetail(postId) {
    return request.get(`/admin/posts/${postId}`)
  },

  // ========== 评论管理 ==========
  // 获取评论列表
  getComments(params = {}) {
    return request.get('/admin/comments', { params })
  },

  // 创建评论
  createComment(data) {
    return request.post('/admin/comments', data)
  },

  // 更新评论
  updateComment(commentId, data) {
    return request.put(`/admin/comments/${commentId}`, data)
  },

  // 删除评论
  deleteComment(commentId) {
    return request.delete(`/admin/comments/${commentId}`)
  },

  // 批量删除评论
  batchDeleteComments(ids) {
    return request.delete('/admin/comments', { data: { ids } })
  },

  // 获取单个评论详情
  getCommentDetail(commentId) {
    return request.get(`/admin/comments/${commentId}`)
  },

  // ========== 标签管理 ==========
  // 获取标签列表
  getTags(params = {}) {
    return request.get('/admin/tags', { params })
  },

  // 创建标签
  createTag(data) {
    return request.post('/admin/tags', data)
  },

  // 更新标签
  updateTag(tagId, data) {
    return request.put(`/admin/tags/${tagId}`, data)
  },

  // 删除标签
  deleteTag(tagId) {
    return request.delete(`/admin/tags/${tagId}`)
  },

  // 批量删除标签
  batchDeleteTags(ids) {
    return request.delete('/admin/tags', { data: { ids } })
  },

  // 获取单个标签详情
  getTagDetail(tagId) {
    return request.get(`/admin/tags/${tagId}`)
  },

  // ========== 点赞管理 ==========
  // 获取点赞列表
  getLikes(params = {}) {
    return request.get('/admin/likes', { params })
  },

  // 创建点赞
  createLike(data) {
    return request.post('/admin/likes', data)
  },

  // 更新点赞
  updateLike(likeId, data) {
    return request.put(`/admin/likes/${likeId}`, data)
  },

  // 删除点赞
  deleteLike(likeId) {
    return request.delete(`/admin/likes/${likeId}`)
  },

  // 批量删除点赞
  batchDeleteLikes(ids) {
    return request.delete('/admin/likes', { data: { ids } })
  },

  // 获取单个点赞详情
  getLikeDetail(likeId) {
    return request.get(`/admin/likes/${likeId}`)
  },

  // ========== 收藏管理 ==========
  // 获取收藏列表
  getCollections(params = {}) {
    return request.get('/admin/collections', { params })
  },

  // 创建收藏
  createCollection(data) {
    return request.post('/admin/collections', data)
  },

  // 更新收藏
  updateCollection(collectionId, data) {
    return request.put(`/admin/collections/${collectionId}`, data)
  },

  // 删除收藏
  deleteCollection(collectionId) {
    return request.delete(`/admin/collections/${collectionId}`)
  },

  // 批量删除收藏
  batchDeleteCollections(ids) {
    return request.delete('/admin/collections', { data: { ids } })
  },

  // 获取单个收藏详情
  getCollectionDetail(collectionId) {
    return request.get(`/admin/collections/${collectionId}`)
  },

  // ========== 关注管理 ==========
  // 获取关注列表
  getFollows(params = {}) {
    return request.get('/admin/follows', { params })
  },

  // 创建关注
  createFollow(data) {
    return request.post('/admin/follows', data)
  },

  // 更新关注
  updateFollow(followId, data) {
    return request.put(`/admin/follows/${followId}`, data)
  },

  // 删除关注
  deleteFollow(followId) {
    return request.delete(`/admin/follows/${followId}`)
  },

  // 批量删除关注
  batchDeleteFollows(ids) {
    return request.delete('/admin/follows', { data: { ids } })
  },

  // 获取单个关注详情
  getFollowDetail(followId) {
    return request.get(`/admin/follows/${followId}`)
  },

  // ========== 通知管理 ==========
  // 获取通知列表
  getNotifications(params = {}) {
    return request.get('/admin/notifications', { params })
  },

  // 创建通知
  createNotification(data) {
    return request.post('/admin/notifications', data)
  },

  // 更新通知
  updateNotification(notificationId, data) {
    return request.put(`/admin/notifications/${notificationId}`, data)
  },

  // 删除通知
  deleteNotification(notificationId) {
    return request.delete(`/admin/notifications/${notificationId}`)
  },

  // 批量删除通知
  batchDeleteNotifications(ids) {
    return request.delete('/admin/notifications', { data: { ids } })
  },

  // 获取单个通知详情
  getNotificationDetail(notificationId) {
    return request.get(`/admin/notifications/${notificationId}`)
  },

  // ========== 会话管理 ==========
  // 获取会话列表
  getSessions(params = {}) {
    return request.get('/admin/sessions', { params })
  },

  // 创建会话
  createSession(data) {
    return request.post('/admin/sessions', data)
  },

  // 更新会话
  updateSession(sessionId, data) {
    return request.put(`/admin/sessions/${sessionId}`, data)
  },

  // 删除会话
  deleteSession(sessionId) {
    return request.delete(`/admin/sessions/${sessionId}`)
  },

  // 批量删除会话
  batchDeleteSessions(ids) {
    return request.delete('/admin/sessions', { data: { ids } })
  },

  // 获取单个会话详情
  getSessionDetail(sessionId) {
    return request.get(`/admin/sessions/${sessionId}`)
  },

  // ========== 管理员管理 ==========
  // 获取管理员列表（两个路由都支持）
  getAdmins(params = {}) {
    return request.get('/admin/admins', { params })
  },

  // 获取管理员列表（认证路由）
  getAdminsAuth(params = {}) {
    return request.get('/auth/admin/admins', { params })
  },

  // 创建管理员
  createAdmin(data) {
    return request.post('/admin/admins', data)
  },

  // 创建管理员（认证路由）
  createAdminAuth(data) {
    return request.post('/auth/admin/admins', data)
  },

  // 更新管理员信息
  updateAdmin(adminId, data) {
    return request.put(`/admin/admins/${adminId}`, data)
  },

  // 更新管理员信息（认证路由）
  updateAdminAuth(adminId, data) {
    return request.put(`/auth/admin/admins/${adminId}`, data)
  },

  // 删除管理员
  deleteAdmin(adminId) {
    return request.delete(`/admin/admins/${adminId}`)
  },

  // 删除管理员（认证路由）
  deleteAdminAuth(adminId) {
    return request.delete(`/auth/admin/admins/${adminId}`)
  },

  // 批量删除管理员
  batchDeleteAdmins(ids) {
    return request.delete('/admin/admins', { data: { ids } })
  },

  // 批量删除管理员（认证路由）
  batchDeleteAdminsAuth(ids) {
    return request.delete('/auth/admin/admins', { data: { ids } })
  },

  // 获取单个管理员详情
  getAdminDetail(adminId) {
    return request.get(`/admin/admins/${adminId}`)
  },

  // 获取单个管理员详情（认证路由）
  getAdminDetailAuth(adminId) {
    return request.get(`/auth/admin/admins/${adminId}`)
  }
}