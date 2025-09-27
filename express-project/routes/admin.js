const express = require('express')
const router = express.Router()
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants')
const { pool } = require('../config/config')
const { createCrudHandlers } = require('../middleware/crudFactory')
const { recordExists } = require('../utils/dbHelper')
const { adminAuth } = require('../utils/uploadHelper')
const {
  validateLikeOrFavoriteData,
  validateFollowData,
  validateNotificationData
} = require('../utils/validationHelpers')

// 创建笔记
// Posts CRUD 配置
const postsCrudConfig = {
  table: 'posts',
  name: '笔记',
  requiredFields: ['user_id', 'title', 'content'],
  updateFields: ['title', 'content', 'category_id', 'view_count', 'is_draft'],
  cascadeRules: [
    { table: 'post_images', field: 'post_id' },
    { table: 'post_tags', field: 'post_id' },
    { table: 'comments', field: 'post_id' },
    { table: 'likes', field: 'target_id', condition: 'target_type = 1' },
    { table: 'collections', field: 'post_id' }
  ],
  searchFields: {
    title: { operator: 'LIKE' },
    user_display_id: { operator: '=' },
    category_id: { operator: '=' },
    type: {
      operator: '=',
      transform: (value) => parseInt(value) // 将字符串转换为数字
    },
    is_draft: {
      operator: '=',
      transform: (value) => parseInt(value) // 将字符串转换为数字
    }
  },
  allowedSortFields: ['id', 'view_count', 'like_count', 'collect_count', 'comment_count', 'created_at'],
  defaultOrderBy: 'created_at DESC',

  // 创建前的自定义验证和处理
  beforeCreate: async (data, req) => {
    const { user_id, images, image_urls, tags } = data

    // 检查用户是否存在
    const [userResult] = await pool.execute('SELECT id FROM users WHERE id = ?', [String(user_id)])
    if (userResult.length === 0) {
      throw new Error('用户不存在')
    }

    // 确保分类ID存在
    if (!data.category_id) {
      data.category_id = null
    }

    return data
  },

  // 创建后的处理（处理图片和标签）
  afterCreate: async (postId, data, req) => {
    const { images, image_urls, tags } = data
    // 处理图片信息
    if (images !== undefined || image_urls !== undefined) {
      // 收集所有有效的图片URL
      const allImages = []
      // 处理images字段
      if (images && Array.isArray(images)) {
        for (const image of images) {
          if (typeof image === 'string') {
            allImages.push(image)
          } else if (image && typeof image === 'object') {
            const possibleUrlProps = ['url', 'preview', 'src', 'path', 'link']
            for (const prop of possibleUrlProps) {
              if (image[prop] && typeof image[prop] === 'string') {
                allImages.push(image[prop])
                break
              }
            }
          }
        }
      }

      // 处理image_urls字段
      if (image_urls && Array.isArray(image_urls)) {
        const validUrls = image_urls.filter(url =>
          url &&
          typeof url === 'string'
        )
        allImages.push(...validUrls)
      }

      // 插入图片
      if (allImages.length > 0) {
        for (const imageUrl of allImages) {
          const cleanUrl = imageUrl ? imageUrl.trim().replace(/\`/g, '').replace(/\s+/g, '') : ''
          if (cleanUrl) {
            await pool.execute(
              'INSERT INTO post_images (post_id, image_url) VALUES (?, ?)',
              [String(postId), cleanUrl]
            )
          }
        }
      }
    }

    // 处理标签
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        let tagId
        let tagName

        // 处理字符串格式的标签
        if (typeof tag === 'string') {
          tagName = tag
          // 查找现有标签
          const [existingTag] = await pool.execute(
            'SELECT id FROM tags WHERE name = ?',
            [tagName]
          )

          if (existingTag.length > 0) {
            tagId = String(existingTag[0].id)
          } else {
            // 创建新标签
            const [tagResult] = await pool.execute(
              'INSERT INTO tags (name) VALUES (?)',
              [tagName]
            )
            tagId = String(tagResult.insertId)
          }
        } else {
          // 处理对象格式的标签（向后兼容）
          tagId = tag.id
          tagName = tag.name

          // 如果是新标签，先创建标签
          if (tag.is_new || String(tag.id).startsWith('temp_')) {
            const [existingTag] = await pool.execute(
              'SELECT id FROM tags WHERE name = ?',
              [tag.name]
            )

            if (existingTag.length > 0) {
              tagId = String(existingTag[0].id)
            } else {
              const [tagResult] = await pool.execute(
                'INSERT INTO tags (name) VALUES (?)',
                [tag.name]
              )
              tagId = String(tagResult.insertId)
            }
          }
        }

        // 关联笔记和标签
        await pool.execute(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [String(postId), String(tagId)]
        )

        // 更新标签使用次数
        await pool.execute(
          'UPDATE tags SET use_count = use_count + 1 WHERE id = ?',
          [String(tagId)]
        )
      }
    }
  },

  // 更新前的处理
  beforeUpdate: async (data, req, id) => {
    // 确保浏览量不为负数
    if (data.view_count !== undefined && data.view_count !== null) {
      data.view_count = Math.max(0, parseInt(data.view_count) || 0)
    }

    return { isValid: true }
  },

  // 更新后的处理（处理图片和标签）
  afterUpdate: async (postId, data, req) => {
    const { images, image_urls, tags } = data

    // 更新图片信息
    if (images !== undefined || image_urls !== undefined) {
      // 删除原有图片
      await pool.execute('DELETE FROM post_images WHERE post_id = ?', [String(postId)])

      // 使用Set来避免重复的图片URL
      const allImagesSet = new Set()

      // 处理image_urls字段
      if (image_urls && Array.isArray(image_urls)) {
        for (const url of image_urls) {
          if (url && typeof url === 'string') {
            allImagesSet.add(url)
          }
        }
      }

      // 处理images字段
      if (images && Array.isArray(images)) {
        for (const image of images) {
          if (typeof image === 'string') {
            allImagesSet.add(image)
          } else if (image && typeof image === 'object') {
            const possibleUrlProps = ['url', 'preview', 'src', 'path', 'link']
            for (const prop of possibleUrlProps) {
              if (image[prop] && typeof image[prop] === 'string') {
                allImagesSet.add(image[prop])
                break
              }
            }
          }
        }
      }

      // 插入新图片
      const allImages = Array.from(allImagesSet)
      if (allImages.length > 0) {
        for (const imageUrl of allImages) {
          const cleanUrl = imageUrl ? imageUrl.trim().replace(/\`/g, '').replace(/\s+/g, '') : ''
          if (cleanUrl) {
            await pool.execute(
              'INSERT INTO post_images (post_id, image_url) VALUES (?, ?)',
              [postId, cleanUrl]
            )
          }
        }
      }
    }

    // 处理视频更新 - 只要有任何视频相关字段就触发处理
    const hasVideoUpdate = data.video_url !== undefined || data.cover_url !== undefined || data.video !== undefined
    
    if (hasVideoUpdate) {
      // 获取原有视频记录用于清理文件
      const [oldVideoRows] = await pool.execute('SELECT video_url, cover_url FROM post_videos WHERE post_id = ?', [String(postId)])
      
      // 删除原有视频记录
      await pool.execute('DELETE FROM post_videos WHERE post_id = ?', [String(postId)])

      // 清理废弃的视频文件
      if (oldVideoRows.length > 0) {
        const { batchCleanupFiles } = require('../utils/fileCleanup')
        const oldVideoUrls = oldVideoRows.map(row => row.video_url).filter(url => url)
        const oldCoverUrls = oldVideoRows.map(row => row.cover_url).filter(url => url)
        
        // 异步清理文件，不阻塞响应
        batchCleanupFiles(oldVideoUrls, oldCoverUrls).then(result => {
          // 文件清理完成
        }).catch(error => {
          console.error('后台管理系统清理废弃视频文件失败:', error)
        })
      }

      // 插入新视频记录 - 优先使用video对象，然后是分离字段
      let videoUrl = null
      let coverUrl = null
      
      if (data.video && data.video.url) {
        // FormModal传递的video对象格式
        videoUrl = data.video.url
        coverUrl = data.video.coverUrl || ''
      } else if (data.video_url && data.video_url.trim() !== '') {
        // 分离字段格式
        videoUrl = data.video_url
        coverUrl = data.cover_url || ''
      }
      
      if (videoUrl) {
        await pool.execute(
          'INSERT INTO post_videos (post_id, video_url, cover_url) VALUES (?, ?, ?)',
          [postId, videoUrl, coverUrl]
        )
      }
    }

    // 更新标签信息
    if (tags !== undefined) {
      // 获取原有标签，用于更新使用次数
      const [oldTags] = await pool.execute(
        'SELECT tag_id FROM post_tags WHERE post_id = ?',
        [postId]
      )

      // 删除原有标签关联
      await pool.execute('DELETE FROM post_tags WHERE post_id = ?', [postId])

      // 减少原有标签的使用次数
      for (const oldTag of oldTags) {
        await pool.execute(
          'UPDATE tags SET use_count = GREATEST(use_count - 1, 0) WHERE id = ?',
          [oldTag.tag_id]
        )
      }

      // 处理新标签
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          let tagId
          let tagName

          // 处理字符串格式的标签
          if (typeof tag === 'string') {
            tagName = tag
            // 查找现有标签
            const [existingTag] = await pool.execute(
              'SELECT id FROM tags WHERE name = ?',
              [tagName]
            )

            if (existingTag.length > 0) {
              tagId = existingTag[0].id
            } else {
              // 创建新标签
              const [tagResult] = await pool.execute(
                'INSERT INTO tags (name) VALUES (?)',
                [tagName]
              )
              tagId = tagResult.insertId
            }
          } else {
            // 处理对象格式的标签（向后兼容）
            tagId = tag.id
            tagName = tag.name

            // 如果是新标签，先创建标签
            if (tag.is_new || String(tag.id).startsWith('temp_')) {
              const [existingTag] = await pool.execute(
                'SELECT id FROM tags WHERE name = ?',
                [tag.name]
              )

              if (existingTag.length > 0) {
                tagId = existingTag[0].id
              } else {
                const [tagResult] = await pool.execute(
                  'INSERT INTO tags (name) VALUES (?)',
                  [tag.name]
                )
                tagId = tagResult.insertId
              }
            }
          }

          // 关联笔记和标签
          await pool.execute(
            'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
            [String(postId), String(tagId)]
          )

          // 更新标签使用次数
          await pool.execute(
            'UPDATE tags SET use_count = use_count + 1 WHERE id = ?',
            [String(tagId)]
          )
        }
      }
    }
  },

  // 删除前的处理（减少标签使用次数）
  beforeDelete: async (id) => {
    // 获取笔记关联的标签，减少标签使用次数
    const [tagResult] = await pool.execute(
      'SELECT tag_id FROM post_tags WHERE post_id = ?',
      [String(id)]
    )

    // 减少标签使用次数
    for (const tag of tagResult) {
      await pool.execute('UPDATE tags SET use_count = use_count - 1 WHERE id = ?', [String(tag.tag_id)])
    }
    // 返回验证结果
    return { isValid: true }
  },

  // 批量删除前的处理
  beforeDeleteMany: async (ids) => {
    const placeholders = ids.map(() => '?').join(',')

    // 获取所有笔记关联的标签，减少标签使用次数
    const [tagResult] = await pool.execute(
      `SELECT tag_id FROM post_tags WHERE post_id IN (${placeholders})`,
      ids.map(id => String(id))
    )

    // 减少标签使用次数
    for (const tag of tagResult) {
      await pool.execute('UPDATE tags SET use_count = use_count - 1 WHERE id = ?', [String(tag.tag_id)])
    }
  },

  // 自定义查询（获取详情和列表）
  customQueries: {
    getOne: async (req) => {
      const postId = req.params.id

      // 获取笔记基本信息
      const [postResult] = await pool.execute(`
        SELECT p.id, p.user_id, p.title, p.content, p.type, p.category_id, c.name as category,
               p.view_count, p.like_count, p.collect_count, p.comment_count,
               p.is_draft, p.created_at,
               u.nickname, COALESCE(u.user_id, CONCAT('user', LPAD(u.id, 3, '0'))) as user_display_id
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, [String(postId)])

      if (postResult.length === 0) {
        return null
      }

      const post = postResult[0]

      // 根据笔记类型获取媒体信息
      if (post.type === 2) {
        // 视频笔记：获取视频信息
        const [videos] = await pool.execute('SELECT video_url, cover_url FROM post_videos WHERE post_id = ?', [String(postId)])
        if (videos.length > 0) {
          post.video_url = videos[0].video_url
          post.cover_url = videos[0].cover_url
          post.images = [videos[0].video_url] // 将视频URL放入images数组以兼容现有逻辑
        } else {
          post.images = []
        }
      } else {
        // 图文笔记：获取图片信息
        const [images] = await pool.execute('SELECT image_url FROM post_images WHERE post_id = ?', [String(postId)])
        post.images = images.map(img => img.image_url)
      }

      // 获取笔记标签
      const [tags] = await pool.execute(`
        SELECT t.id, t.name 
        FROM tags t 
        INNER JOIN post_tags pt ON t.id = pt.tag_id 
        WHERE pt.post_id = ?
      `, [String(postId)])
      post.tags = tags

      return post
    },

    getList: async (req) => {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit

      // 搜索条件
      let whereClause = ''
      const params = []

      if (req.query.title) {
        whereClause += ' WHERE p.title LIKE ?'
        params.push(`%${req.query.title}%`)
      }

      if (req.query.user_display_id) {
        whereClause += whereClause ? ' AND u.user_id LIKE ?' : ' WHERE u.user_id LIKE ?'
        params.push(`%${req.query.user_display_id}%`)
      }

      if (req.query.category_id) {
        if (req.query.category_id === 'null') {
          whereClause += whereClause ? ' AND p.category_id IS NULL' : ' WHERE p.category_id IS NULL'
        } else {
          whereClause += whereClause ? ' AND p.category_id = ?' : ' WHERE p.category_id = ?'
          params.push(req.query.category_id)
        }
      }

      if (req.query.type !== undefined && req.query.type !== '') {
        whereClause += whereClause ? ' AND p.type = ?' : ' WHERE p.type = ?'
        params.push(req.query.type)
      }

      if (req.query.is_draft !== undefined && req.query.is_draft !== '') {
        whereClause += whereClause ? ' AND p.is_draft = ?' : ' WHERE p.is_draft = ?'
        params.push(req.query.is_draft)
      }

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts p 
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}
      `
      const [countResult] = await pool.execute(countQuery, params)
      const total = countResult[0].total

      // 排序处理
      let orderClause = 'ORDER BY p.created_at DESC'
      if (req.query.sortField && req.query.sortOrder) {
        const allowedSortFields = ['id', 'title', 'view_count', 'like_count', 'collect_count', 'comment_count', 'created_at', 'nickname']
        const sortField = req.query.sortField
        const sortOrder = req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        if (allowedSortFields.includes(sortField)) {
          const fieldPrefix = sortField === 'nickname' ? 'u.' : 'p.'
          orderClause = `ORDER BY ${fieldPrefix}${sortField} ${sortOrder}`
        }
      }

      // 获取数据
      const dataQuery = `
        SELECT p.id, p.user_id, p.title, p.content, p.type, p.category_id, c.name as category,
               p.view_count, p.like_count, p.collect_count, p.comment_count,
               p.is_draft, p.created_at,
               u.nickname, COALESCE(u.user_id, CONCAT('user', LPAD(u.id, 3, '0'))) as user_display_id
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      const [posts] = await pool.execute(dataQuery, [...params, String(limit), String(offset)])

      // 为每个笔记获取图片信息和标签信息
      for (let post of posts) {
        const [images] = await pool.execute('SELECT image_url FROM post_images WHERE post_id = ?', [String(post.id)])
        post.images = images.map(img => img.image_url)

        // 获取笔记标签
        const [tags] = await pool.execute(`
          SELECT t.id, t.name 
          FROM tags t 
          INNER JOIN post_tags pt ON t.id = pt.tag_id 
          WHERE pt.post_id = ?
        `, [String(post.id)])
        post.tags = tags
      }

      return {
        data: posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  }
}

const postsHandlers = createCrudHandlers(postsCrudConfig)

// 注册 Posts CRUD 路由
router.post('/posts', adminAuth, postsHandlers.create)
router.put('/posts/:id', adminAuth, postsHandlers.update)
router.delete('/posts/:id', adminAuth, postsHandlers.deleteOne)
router.delete('/posts', adminAuth, postsHandlers.deleteMany)
router.get('/posts/:id', adminAuth, async (req, res) => {
  try {
    const result = await postsCrudConfig.customQueries.getOne(req)
    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: RESPONSE_CODES.NOT_FOUND,
        message: '笔记不存在'
      })
    }
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取笔记详情失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取笔记详情失败'
    })
  }
})
// 使用自定义查询覆盖默认的getList
router.get('/posts', adminAuth, async (req, res) => {
  try {
    const result = await postsCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取笔记列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取笔记列表失败'
    })
  }
})

// 创建评论
// ===== COMMENTS CRUD (使用工厂模式) =====
const commentsCrudConfig = {
  table: 'comments',
  name: '评论',
  requiredFields: ['user_id', 'post_id', 'content'],
  updateFields: ['content'],
  cascadeRules: [
    { table: 'likes', field: 'target_id', condition: 'target_type = 2' },
    { table: 'comments', field: 'parent_id' } // 删除子评论
  ],
  searchFields: {
    post_id: { operator: '=' },
    user_display_id: { operator: '=' },
    content: { operator: 'LIKE' }
  },
  allowedSortFields: ['id', 'like_count', 'created_at'],
  defaultOrderBy: 'created_at DESC',

  // 自定义验证
  beforeCreate: async (data) => {
    const { user_id, post_id, parent_id } = data

    // 检查用户是否存在
    const [userResult] = await pool.execute('SELECT id FROM users WHERE id = ?', [String(user_id)])
    if (userResult.length === 0) {
      return { isValid: false, message: '用户不存在' }
    }

    // 检查笔记是否存在
    const [postResult] = await pool.execute('SELECT id FROM posts WHERE id = ?', [String(post_id)])
    if (postResult.length === 0) {
      return { isValid: false, message: '笔记不存在' }
    }

    // 如果是回复评论，检查父评论是否存在
    if (parent_id) {
      const [parentResult] = await pool.execute('SELECT id FROM comments WHERE id = ?', [String(parent_id)])
      if (parentResult.length === 0) {
        return { isValid: false, message: '父评论不存在' }
      }
    }

    return { isValid: true }
  },

  // 自定义查询（用于管理后台的复杂查询）
  customQueries: {
    getList: async (req) => {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit

      // 搜索条件
      let whereClause = ''
      const params = []

      if (req.query.post_id) {
        whereClause += ' WHERE c.post_id = ?'
        params.push(req.query.post_id)
      }

      if (req.query.user_display_id) {
        whereClause += whereClause ? ' AND u.user_id LIKE ?' : ' WHERE u.user_id LIKE ?'
        params.push(`%${req.query.user_display_id}%`)
      }

      if (req.query.content) {
        whereClause += whereClause ? ' AND c.content LIKE ?' : ' WHERE c.content LIKE ?'
        params.push(`%${req.query.content}%`)
      }

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM comments c 
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN posts p ON c.post_id = p.id
        ${whereClause}
      `
      const [countResult] = await pool.execute(countQuery, params)
      const total = countResult[0].total

      // 排序处理
      let orderClause = 'ORDER BY c.created_at DESC'
      if (req.query.sortField && req.query.sortOrder) {
        const allowedSortFields = ['id', 'content', 'like_count', 'created_at', 'nickname']
        const sortField = req.query.sortField
        const sortOrder = req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        if (allowedSortFields.includes(sortField)) {
          const fieldPrefix = sortField === 'nickname' ? 'u.' : 'c.'
          orderClause = `ORDER BY ${fieldPrefix}${sortField} ${sortOrder}`
        }
      }

      // 获取数据
      const dataQuery = `
        SELECT c.id, c.content, c.parent_id, c.like_count, c.created_at,
               c.user_id, u.nickname, 
               COALESCE(u.user_id, CONCAT('user', LPAD(u.id, 3, '0'))) as user_display_id,
               p.id as post_id, p.title as post_title
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN posts p ON c.post_id = p.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      const [comments] = await pool.execute(dataQuery, [...params, String(limit), String(offset)])

      return {
        data: comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  }
}

const commentsHandlers = createCrudHandlers(commentsCrudConfig)

// 评论CRUD路由
router.post('/comments', adminAuth, commentsHandlers.create)
router.put('/comments/:id', adminAuth, commentsHandlers.update)
router.delete('/comments/:id', adminAuth, commentsHandlers.deleteOne)
router.delete('/comments', adminAuth, commentsHandlers.deleteMany)
router.get('/comments/:id', adminAuth, commentsHandlers.getOne)
// 使用自定义查询覆盖默认的getList
router.get('/comments', adminAuth, async (req, res) => {
  try {
    const result = await commentsCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取评论列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取评论列表失败'
    })
  }
})

// 创建标签
// ==================== 标签管理（使用CRUD工厂重构） ====================

// 标签CRUD配置
const tagsCrudConfig = {
  table: 'tags',
  name: '标签',
  requiredFields: ['name'],
  updateFields: ['name', 'description'],
  uniqueFields: ['name'],
  cascadeRules: [
    { table: 'post_tags', field: 'tag_id' }
  ],
  searchFields: {
    name: { operator: 'LIKE' }
  },
  allowedSortFields: ['id', 'use_count', 'created_at'],
  defaultOrderBy: 'created_at DESC'
}

// 生成标签CRUD处理器
const tagsHandlers = createCrudHandlers(tagsCrudConfig)

// 标签路由
router.post('/tags', adminAuth, tagsHandlers.create)
router.put('/tags/:id', adminAuth, tagsHandlers.update)
router.delete('/tags/:id', adminAuth, tagsHandlers.deleteOne)
router.delete('/tags', adminAuth, tagsHandlers.deleteMany)
router.get('/tags/:id', adminAuth, tagsHandlers.getOne)
router.get('/tags', adminAuth, tagsHandlers.getList)

// ==================== 点赞管理（使用CRUD工厂重构） ====================

// 点赞CRUD配置
const likesCrudConfig = {
  table: 'likes',
  name: '点赞',
  requiredFields: ['user_id', 'target_type', 'target_id'],
  updateFields: ['target_type', 'target_id'],
  searchFields: {
    user_id: { operator: '=' },
    target_type: { operator: '=' },
    target_id: { operator: '=' }
  },
  allowedSortFields: ['id', 'user_id', 'created_at'],
  defaultOrderBy: 'created_at DESC',

  // 自定义验证逻辑
  beforeCreate: async (data) => {
    await validateLikeOrFavoriteData(data)

    // 检查目标是否存在
    const targetTable = data.target_type == 1 ? 'posts' : 'comments'
    if (!(await recordExists(targetTable, 'id', data.target_id))) {
      return {
        isValid: false,
        message: data.target_type == 1 ? '笔记不存在' : '评论不存在',
        code: RESPONSE_CODES.NOT_FOUND
      }
    }

    return { isValid: true }
  },

  beforeUpdate: async (data) => {
    await validateLikeOrFavoriteData(data)
    return { isValid: true }
  },

  // 自定义查询（用于管理后台的复杂查询）
  customQueries: {
    getList: async (req) => {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit

      // 搜索条件
      let whereClause = ''
      const params = []

      if (req.query.user_display_id) {
        whereClause += whereClause ? ' AND u.user_id LIKE ?' : 'WHERE u.user_id LIKE ?'
        params.push(`%${req.query.user_display_id}%`)
      }

      if (req.query.target_type) {
        whereClause += whereClause ? ' AND l.target_type = ?' : 'WHERE l.target_type = ?'
        params.push(req.query.target_type)
      }

      if (req.query.target_id) {
        whereClause += whereClause ? ' AND l.target_id = ?' : 'WHERE l.target_id = ?'
        params.push(req.query.target_id)
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM likes l LEFT JOIN users u ON l.user_id = u.id ${whereClause}`
      const [countResult] = await pool.execute(countQuery, params)
      const total = countResult[0].total

      // 排序处理
      let orderClause = 'ORDER BY l.created_at DESC'
      if (req.query.sortField && req.query.sortOrder) {
        const allowedSortFields = ['id', 'user_id', 'created_at']
        const sortField = req.query.sortField
        const sortOrder = req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        if (allowedSortFields.includes(sortField)) {
          const fieldPrefix = 'l.'
          orderClause = `ORDER BY ${fieldPrefix}${sortField} ${sortOrder}`
        }
      }

      // 获取数据
      const dataQuery = `
        SELECT l.id, l.user_id, l.target_type, l.target_id, l.created_at,
               u.nickname, 
               COALESCE(u.user_id, CONCAT('user', LPAD(u.id, 3, '0'))) as user_display_id
        FROM likes l
        LEFT JOIN users u ON l.user_id = u.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      const [likes] = await pool.execute(dataQuery, [...params, String(limit), String(offset)])

      return {
        data: likes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  }
}

// 生成点赞CRUD处理器
const likesHandlers = createCrudHandlers(likesCrudConfig)

// 临时测试接口 - 检查用户数据
router.get('/test-users', adminAuth, async (req, res) => {
  try {
    const { pool } = require('../config/config')
    const [users] = await pool.execute(
      'SELECT id, user_id, nickname FROM users WHERE id IN (SELECT DISTINCT user_id FROM likes LIMIT 10)'
    )
    res.json({ code: RESPONSE_CODES.SUCCESS, data: users })
  } catch (error) {
    console.error('测试用户数据失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: '服务器错误' })
  }
})

// 点赞路由
router.post('/likes', adminAuth, likesHandlers.create)
router.put('/likes/:id', adminAuth, likesHandlers.update)
router.delete('/likes/:id', adminAuth, likesHandlers.deleteOne)
router.delete('/likes', adminAuth, likesHandlers.deleteMany)
router.get('/likes/:id', adminAuth, likesHandlers.getOne)
// 使用自定义查询覆盖默认的getList
router.get('/likes', adminAuth, async (req, res) => {
  try {
    const result = await likesCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取点赞列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取点赞列表失败'
    })
  }
})

// 创建收藏
// ==================== 收藏管理（使用CRUD工厂重构） ====================

// 收藏CRUD配置
const collectionsCrudConfig = {
  table: 'collections',
  name: '收藏',
  requiredFields: ['user_id', 'post_id'],
  updateFields: ['post_id'],
  searchFields: {
    user_id: { operator: '=' },
    post_id: { operator: '=' }
  },
  allowedSortFields: ['id', 'user_id', 'created_at'],
  defaultOrderBy: 'created_at DESC',

  // 自定义验证逻辑
  beforeCreate: async (data) => {
    // 检查用户是否存在
    if (!(await recordExists('users', 'id', data.user_id))) {
      return {
        isValid: false,
        message: '用户不存在',
        code: RESPONSE_CODES.NOT_FOUND
      }
    }

    // 检查笔记是否存在
    if (!(await recordExists('posts', 'id', data.post_id))) {
      return {
        isValid: false,
        message: '笔记不存在',
        code: RESPONSE_CODES.NOT_FOUND
      }
    }

    // 检查是否已经收藏
    const { pool } = require('../config/config')
    const [existing] = await pool.execute(
      'SELECT id FROM collections WHERE user_id = ? AND post_id = ?',
      [String(data.user_id), String(data.post_id)]
    )
    if (existing.length > 0) {
      return {
        isValid: false,
        message: '已经收藏过该笔记',
        code: RESPONSE_CODES.CONFLICT
      }
    }

    return { isValid: true }
  },

  beforeUpdate: async (data) => {
    // 检查笔记是否存在
    if (data.post_id && !(await recordExists('posts', 'id', data.post_id))) {
      return {
        isValid: false,
        message: '笔记不存在',
        code: RESPONSE_CODES.NOT_FOUND
      }
    }

    return { isValid: true }
  },

  // 自定义查询（用于管理后台的复杂查询）
  customQueries: {
    getList: async (req) => {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit

      // 搜索条件
      let whereClause = ''
      const params = []

      if (req.query.user_display_id) {
        whereClause += whereClause ? ' AND u.user_id LIKE ?' : 'WHERE u.user_id LIKE ?'
        params.push(`%${req.query.user_display_id}%`)
      }

      if (req.query.post_id) {
        whereClause += whereClause ? ' AND c.post_id = ?' : 'WHERE c.post_id = ?'
        params.push(req.query.post_id)
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM collections c LEFT JOIN users u ON c.user_id = u.id ${whereClause}`
      const [countResult] = await pool.execute(countQuery, params)
      const total = countResult[0].total

      // 排序处理
      let orderClause = 'ORDER BY c.created_at DESC'
      if (req.query.sortField && req.query.sortOrder) {
        const allowedSortFields = ['id', 'user_id', 'created_at']
        const sortField = req.query.sortField
        const sortOrder = req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        if (allowedSortFields.includes(sortField)) {
          const fieldPrefix = 'c.'
          orderClause = `ORDER BY ${fieldPrefix}${sortField} ${sortOrder}`
        }
      }

      // 获取数据
      const dataQuery = `
        SELECT c.id, c.user_id, c.post_id, c.created_at,
               u.nickname, 
               COALESCE(u.user_id, CONCAT('user', LPAD(u.id, 3, '0'))) as user_display_id,
               p.title as post_title
        FROM collections c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN posts p ON c.post_id = p.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      const [collections] = await pool.execute(dataQuery, [...params, String(limit), String(offset)])

      return {
        data: collections,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  }
}

// 生成收藏CRUD处理器
const collectionsHandlers = createCrudHandlers(collectionsCrudConfig)

// 收藏路由
router.post('/collections', adminAuth, collectionsHandlers.create)
router.put('/collections/:id', adminAuth, collectionsHandlers.update)
router.delete('/collections/:id', adminAuth, collectionsHandlers.deleteOne)
router.delete('/collections', adminAuth, collectionsHandlers.deleteMany)
router.get('/collections/:id', adminAuth, collectionsHandlers.getOne)
// 使用自定义查询覆盖默认的getList
router.get('/collections', adminAuth, async (req, res) => {
  try {
    const result = await collectionsCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取收藏列表失败'
    })
  }
})

// 创建关注
// ==================== 关注管理（使用CRUD工厂重构） ====================

// 关注CRUD配置
const followsCrudConfig = {
  table: 'follows',
  name: '关注',
  requiredFields: ['follower_id', 'following_id'],
  updateFields: ['following_id'],
  searchFields: {
    follower_id: { operator: '=' },
    following_id: { operator: '=' }
  },
  allowedSortFields: ['id', 'follower_id', 'following_id', 'created_at'],
  defaultOrderBy: 'created_at DESC',

  // 自定义验证逻辑
  beforeCreate: async (data) => {
    await validateFollowData(data)

    // 检查是否已经关注
    const { pool } = require('../config/config')
    const [existing] = await pool.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [String(data.follower_id), String(data.following_id)]
    )
    if (existing.length > 0) {
      return {
        isValid: false,
        message: '已经关注过了',
        code: RESPONSE_CODES.CONFLICT
      }
    }

    return { isValid: true }
  },

  beforeUpdate: async (data, id) => {
    if (data.following_id) {
      // 获取当前记录的关注者ID
      const { pool } = require('../config/config')
      const [current] = await pool.execute('SELECT follower_id FROM follows WHERE id = ?', [String(id)])
      if (current.length === 0) {
        return {
          isValid: false,
          message: '关注记录不存在',
          code: RESPONSE_CODES.NOT_FOUND
        }
      }

      const updateData = {
        follower_id: current[0].follower_id,
        following_id: data.following_id
      }
      await validateFollowData(updateData)
    }

    return { isValid: true }
  },

  // 自定义查询（用于管理后台的复杂查询）
  customQueries: {
    getList: async (req) => {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit

      // 搜索条件
      let whereClause = ''
      const params = []

      if (req.query.follower_display_id) {
        // 根据关注者小石榴号查找用户ID
        const userQuery = 'SELECT id FROM users WHERE COALESCE(user_id, CONCAT(\'user\', LPAD(id, 3, \'0\'))) = ?'
        const [userResult] = await pool.execute(userQuery, [req.query.follower_display_id])
        if (userResult.length > 0) {
          whereClause += whereClause ? ' AND f.follower_id = ?' : 'WHERE f.follower_id = ?'
          params.push(userResult[0].id)
        } else {
          // 如果找不到用户，返回空结果
          return {
            data: [],
            pagination: {
              page: parseInt(req.query.page) || 1,
              limit: parseInt(req.query.limit) || 20,
              total: 0,
              pages: 0
            }
          }
        }
      }

      if (req.query.following_display_id) {
        // 根据被关注者小石榴号查找用户ID
        const userQuery = 'SELECT id FROM users WHERE COALESCE(user_id, CONCAT(\'user\', LPAD(id, 3, \'0\'))) = ?'
        const [userResult] = await pool.execute(userQuery, [req.query.following_display_id])
        if (userResult.length > 0) {
          whereClause += whereClause ? ' AND f.following_id = ?' : 'WHERE f.following_id = ?'
          params.push(userResult[0].id)
        } else {
          // 如果找不到用户，返回空结果
          return {
            data: [],
            pagination: {
              page: parseInt(req.query.page) || 1,
              limit: parseInt(req.query.limit) || 20,
              total: 0,
              pages: 0
            }
          }
        }
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM follows f ${whereClause}`
      const [countResult] = await pool.execute(countQuery, params)
      const total = countResult[0].total

      // 排序处理
      let orderClause = 'ORDER BY f.created_at DESC'
      if (req.query.sortField && req.query.sortOrder) {
        const allowedSortFields = ['id', 'follower_id', 'following_id', 'created_at']
        const sortField = req.query.sortField
        const sortOrder = req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        if (allowedSortFields.includes(sortField)) {
          const fieldPrefix = 'f.'
          orderClause = `ORDER BY ${fieldPrefix}${sortField} ${sortOrder}`
        }
      }

      // 获取数据
      const dataQuery = `
        SELECT f.id, f.follower_id, f.following_id, f.created_at,
               u1.nickname as follower_nickname, 
               COALESCE(u1.user_id, CONCAT('user', LPAD(u1.id, 3, '0'))) as follower_display_id,
               u2.nickname as following_nickname, 
               COALESCE(u2.user_id, CONCAT('user', LPAD(u2.id, 3, '0'))) as following_display_id
        FROM follows f
        LEFT JOIN users u1 ON f.follower_id = u1.id
        LEFT JOIN users u2 ON f.following_id = u2.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      const [follows] = await pool.execute(dataQuery, [...params, String(limit), String(offset)])

      return {
        data: follows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  }
}

// 生成关注CRUD处理器
const followsHandlers = createCrudHandlers(followsCrudConfig)

// 关注路由
router.post('/follows', adminAuth, followsHandlers.create)
router.put('/follows/:id', adminAuth, followsHandlers.update)
router.delete('/follows/:id', adminAuth, followsHandlers.deleteOne)
router.delete('/follows', adminAuth, followsHandlers.deleteMany)
router.get('/follows/:id', adminAuth, followsHandlers.getOne)
// 使用自定义查询覆盖默认的getList
router.get('/follows', adminAuth, async (req, res) => {
  try {
    const result = await followsCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取关注列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取关注列表失败'
    })
  }
})

// 通知管理 CRUD 配置
const notificationsCrudConfig = {
  table: 'notifications',
  name: '通知',
  requiredFields: ['user_id', 'sender_id', 'type', 'title'],
  updateFields: ['user_id', 'sender_id', 'type', 'title', 'target_id', 'comment_id', 'is_read'],
  searchFields: {
    user_id: { operator: '=' },
    type: { operator: '=' },
    is_read: { operator: '=' }
  },
  allowedSortFields: ['id', 'created_at'],
  defaultOrderBy: 'created_at DESC',

  // 自定义查询（用于管理后台的复杂查询）
  customQueries: {
    getList: async (req) => {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit

      // 搜索条件
      let whereClause = ''
      const params = []

      if (req.query.user_display_id) {
        whereClause += whereClause ? ' AND u1.user_id LIKE ?' : 'WHERE u1.user_id LIKE ?'
        params.push(`%${req.query.user_display_id}%`)
      }

      if (req.query.type) {
        whereClause += whereClause ? ' AND n.type = ?' : 'WHERE n.type = ?'
        params.push(req.query.type)
      }

      if (req.query.is_read !== undefined) {
        whereClause += whereClause ? ' AND n.is_read = ?' : 'WHERE n.is_read = ?'
        params.push(req.query.is_read)
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM notifications n LEFT JOIN users u1 ON n.user_id = u1.id ${whereClause}`
      const [countResult] = await pool.execute(countQuery, params)
      const total = countResult[0].total

      // 排序处理
      let orderClause = 'ORDER BY n.created_at DESC'
      if (req.query.sortField && req.query.sortOrder) {
        const allowedSortFields = ['id', 'created_at']
        const sortField = req.query.sortField
        const sortOrder = req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        if (allowedSortFields.includes(sortField)) {
          const fieldPrefix = 'n.'
          orderClause = `ORDER BY ${fieldPrefix}${sortField} ${sortOrder}`
        }
      }

      // 获取数据
      const dataQuery = `
        SELECT n.id, n.user_id, n.sender_id, n.type, n.title, n.target_id, n.comment_id, n.is_read, n.created_at,
               u1.nickname as user_nickname, 
               COALESCE(u1.user_id, CONCAT('user', LPAD(u1.id, 3, '0'))) as user_display_id,
               u2.nickname as sender_nickname, 
               COALESCE(u2.user_id, CONCAT('user', LPAD(u2.id, 3, '0'))) as sender_display_id
        FROM notifications n
        LEFT JOIN users u1 ON n.user_id = u1.id
        LEFT JOIN users u2 ON n.sender_id = u2.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      const [notifications] = await pool.execute(dataQuery, [...params, String(limit), String(offset)])

      return {
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  }
}

const notificationsHandlers = createCrudHandlers(notificationsCrudConfig)

// 通知管理路由
router.post('/notifications', adminAuth, notificationsHandlers.create)
router.put('/notifications/:id', adminAuth, notificationsHandlers.update)
router.delete('/notifications/:id', adminAuth, notificationsHandlers.deleteOne)
router.delete('/notifications', adminAuth, notificationsHandlers.deleteMany)
router.get('/notifications/:id', adminAuth, notificationsHandlers.getOne)
// 使用自定义查询覆盖默认的getList
router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const result = await notificationsCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取通知列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取通知列表失败'
    })
  }
})

// 会话管理 CRUD 配置
const sessionsCrudConfig = {
  table: 'user_sessions',
  name: '会话',
  requiredFields: ['user_id'],
  updateFields: ['user_agent', 'is_active'],
  searchFields: {
    user_id: { operator: '=' },
    is_active: { operator: '=' }
  },
  allowedSortFields: ['id', 'is_active', 'expires_at', 'created_at'],
  defaultOrderBy: 'created_at DESC',

  // 自定义创建前验证
  beforeCreate: async (data) => {
    await validateNotificationData(data)

    // 生成refresh_token
    const crypto = require('crypto')
    data.refresh_token = crypto.randomBytes(32).toString('hex')

    // 设置过期时间（30天）
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + 30)
    data.expires_at = expires_at

    // 设置默认值
    data.user_agent = data.user_agent || ''
    data.is_active = data.is_active ? 1 : 0
  },

  // 自定义查询
  customQueries: {
    getList: async (req) => {
      const { pool } = require('../config/config')
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit

      // 构建搜索条件
      let whereClause = ''
      const params = []

      if (req.query.user_display_id) {
        whereClause += whereClause ? ' AND u.user_id LIKE ?' : 'WHERE u.user_id LIKE ?'
        params.push(`%${req.query.user_display_id}%`)
      }

      if (req.query.is_active !== undefined) {
        whereClause += whereClause ? ' AND s.is_active = ?' : 'WHERE s.is_active = ?'
        params.push(req.query.is_active)
      }



      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM user_sessions s LEFT JOIN users u ON s.user_id = u.id ${whereClause}`
      const [countResult] = await pool.execute(countQuery, params)
      const total = countResult[0].total

      // 排序处理
      let orderClause = 'ORDER BY s.created_at DESC'
      if (req.query.sortField && req.query.sortOrder) {
        const allowedSortFields = ['id', 'is_active', 'expires_at', 'created_at']
        const sortField = req.query.sortField
        const sortOrder = req.query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        if (allowedSortFields.includes(sortField)) {
          const fieldPrefix = 's.'
          orderClause = `ORDER BY ${fieldPrefix}${sortField} ${sortOrder}`
        }
      }

      // 获取数据
      const dataQuery = `
        SELECT s.id, s.user_id, s.refresh_token, s.user_agent, s.is_active, s.expires_at, s.created_at,
               u.nickname, 
               COALESCE(u.user_id, CONCAT('user', LPAD(u.id, 3, '0'))) as user_display_id
        FROM user_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      const [sessions] = await pool.execute(dataQuery, [...params, String(limit), String(offset)])

      return {
        data: sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }
  }
}

const sessionsHandlers = createCrudHandlers(sessionsCrudConfig)

// 会话管理路由
router.post('/sessions', adminAuth, sessionsHandlers.create)

router.put('/sessions/:id', adminAuth, sessionsHandlers.update)
router.delete('/sessions/:id', adminAuth, sessionsHandlers.deleteOne)
router.delete('/sessions', adminAuth, sessionsHandlers.deleteMany)
router.get('/sessions/:id', adminAuth, sessionsHandlers.getOne)
// 使用自定义查询覆盖默认的getList
router.get('/sessions', adminAuth, async (req, res) => {
  try {
    const result = await sessionsCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: result
    })
  } catch (error) {
    console.error('获取会话列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取会话列表失败'
    })
  }
})



// ===== USERS CRUD (使用工厂模式) =====
const usersCrudConfig = {
  table: 'users',
  name: '用户',
  requiredFields: ['user_id', 'nickname'],
  updateFields: ['user_id', 'nickname', 'avatar', 'bio', 'location', 'is_active', 'gender', 'zodiac_sign', 'mbti', 'education', 'major', 'interests', 'verified'],
  uniqueFields: ['user_id'],
  cascadeRules: [
    { table: 'posts', field: 'user_id' },
    { table: 'comments', field: 'user_id' },
    { table: 'likes', field: 'user_id' },
    { table: 'collections', field: 'user_id' },
    { table: 'follows', field: 'follower_id' },
    { table: 'follows', field: 'following_id' },
    { table: 'notifications', field: 'user_id' },
    { table: 'user_sessions', field: 'user_id' }
  ],
  searchFields: {
    user_id: { operator: 'LIKE' },
    nickname: { operator: 'LIKE' },
    location: { operator: 'LIKE' },
    is_active: { operator: '=' }
  },
  allowedSortFields: ['id', 'fans_count', 'like_count', 'created_at'],
  defaultOrderBy: 'created_at DESC',

  // 自定义数据处理
  beforeCreate: async (data) => {
    // 处理interests字段（转换为JSON字符串）
    if (data.interests) {
      data.interests = Array.isArray(data.interests) ? JSON.stringify(data.interests) : data.interests
    }

    // 设置默认值
    // 如果没有提供密码，设置默认哈希密码（123456的SHA256哈希值）
    if (!data.password) {
      // 使用MySQL的SHA2函数生成默认密码的哈希值
      const [result] = await pool.execute('SELECT SHA2(?, 256) as hashed_password', [String('123456')])
      data.password = result[0].hashed_password
    } else {
      // 如果提供了密码，进行哈希处理
      const [result] = await pool.execute('SELECT SHA2(?, 256) as hashed_password', [String(data.password)])
      data.password = result[0].hashed_password
    }
    data.avatar = data.avatar || ''
    data.bio = data.bio || ''
    data.location = data.location || ''
    data.is_active = data.is_active ? 1 : 0

    return { isValid: true }
  },

  beforeUpdate: async (data) => {
    // 处理interests字段（转换为JSON字符串）
    if (data.interests) {
      data.interests = Array.isArray(data.interests) ? JSON.stringify(data.interests) : data.interests
    }

    // 处理is_active字段
    if (data.is_active !== undefined) {
      data.is_active = data.is_active ? 1 : 0
    }

    return { isValid: true }
  }
}

const usersHandlers = createCrudHandlers(usersCrudConfig)

// 用户CRUD路由
router.post('/users', adminAuth, usersHandlers.create)
router.put('/users/:id', adminAuth, usersHandlers.update)
router.delete('/users/:id', adminAuth, usersHandlers.deleteOne)
router.delete('/users', adminAuth, usersHandlers.deleteMany)
router.get('/users/:id', adminAuth, usersHandlers.getOne)
router.get('/users', adminAuth, usersHandlers.getList)

// ===== ADMINS CRUD (使用工厂模式) =====
const adminsCrudConfig = {
  table: 'admin',
  name: '管理员',
  requiredFields: ['username', 'password'],
  updateFields: ['password'],
  uniqueFields: ['username'],
  searchFields: {
    username: { operator: 'LIKE' }
  },
  allowedSortFields: ['username', 'created_at'],
  defaultOrderBy: 'created_at DESC',
  primaryKey: 'username', // 使用username作为主键

  // 创建前的自定义处理
  beforeCreate: async (data) => {
    // 对密码进行哈希加密
    if (data.password) {
      const [hashResult] = await pool.execute('SELECT SHA2(?, 256) as hashed_password', [data.password])
      data.password = hashResult[0].hashed_password
    }
    return { isValid: true }
  },

  // 更新前的自定义处理
  beforeUpdate: async (data) => {
    // 如果更新密码，进行哈希加密
    if (data.password) {
      const [hashResult] = await pool.execute('SELECT SHA2(?, 256) as hashed_password', [data.password])
      data.password = hashResult[0].hashed_password
    }
    return { isValid: true }
  }
}

const adminsHandlers = createCrudHandlers(adminsCrudConfig)

// 管理员CRUD路由
router.post('/admins', adminAuth, adminsHandlers.create)
router.put('/admins/:id', adminAuth, adminsHandlers.update)
router.delete('/admins/:id', adminAuth, adminsHandlers.deleteOne)
router.delete('/admins', adminAuth, adminsHandlers.deleteMany)
router.get('/admins/:id', adminAuth, adminsHandlers.getOne)
router.get('/admins', adminAuth, adminsHandlers.getList)

// 监控页面API - 获取最近动态
router.get('/monitor/activities', adminAuth, async (req, res) => {
  try {
    const activities = []

    // 获取最近10个新注册用户
    const [newUsers] = await pool.execute(
      `SELECT id, user_id, nickname, avatar, created_at, 'user_register' as type
       FROM users
       ORDER BY created_at DESC
       LIMIT ?`,
      ['10']
    )

    // 获取最近10篇发布的笔记
    const [newPosts] = await pool.execute(
      `SELECT p.id, p.title, p.created_at, u.user_id, u.nickname, u.avatar, 'post_publish' as type
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.is_draft = 0
       ORDER BY p.created_at DESC
       LIMIT ?`,
      ['10']
    )

    // 获取最近10条评论
    const [newComments] = await pool.execute(
      `SELECT c.id, c.content, c.post_id, c.created_at, u.user_id, u.nickname, u.avatar, p.title as post_title, 'comment_publish' as type
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN posts p ON c.post_id = p.id
       ORDER BY c.created_at DESC
       LIMIT ?`,
      ['10']
    )

    // 合并所有动态
    newUsers.forEach(user => {
      activities.push({
        id: `user_${user.id}`,
        type: 'user_register',
        user_id: user.user_id,
        nickname: user.nickname,
        avatar: user.avatar,
        title: `新用户注册`,
        content: `用户 ${user.nickname} (${user.user_id}) 注册了账号`,
        target_id: user.id,
        created_at: user.created_at
      })
    })

    newPosts.forEach(post => {
      activities.push({
        id: `post_${post.id}`,
        type: 'post_publish',
        user_id: post.user_id,
        nickname: post.nickname,
        avatar: post.avatar,
        title: post.title,
        content: `${post.nickname} 发布了笔记《${post.title}》`,
        target_id: post.id,
        created_at: post.created_at
      })
    })

    newComments.forEach(comment => {
      activities.push({
        id: comment.id,
        type: 'comment_publish',
        user_id: comment.user_id,
        nickname: comment.nickname,
        avatar: comment.avatar,
        title: comment.post_title,
        content: comment.content, // 原始评论内容，用于CommentImage组件渲染
        description: `${comment.nickname} 在《${comment.post_title}》中发表了评论`,
        target_id: comment.post_id,
        created_at: comment.created_at
      })
    })

    // 按时间降序排序
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '获取动态成功',
      data: activities
    })
  } catch (error) {
    console.error('获取监控动态失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取动态失败',
      error: error.message
    })
  }
})

// 认证管理 CRUD 配置
const auditCrudConfig = {
  table: 'audit',
  name: '认证管理',
  requiredFields: ['user_id', 'type', 'content'],
  updateFields: ['type', 'content', 'status', 'audit_time'],
  searchFields: {
    user_id: { operator: '=' },
    type: { operator: '=' },
    status: { operator: '=' },
    user_display_id: { operator: '=' }
  },
  allowedSortFields: ['id', 'created_at', 'audit_time', 'status'],
  defaultOrderBy: 'created_at DESC',

  // 自定义查询，关联用户信息
  customQueries: {
    getList: async (req) => {
      const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', ...filters } = req.query
      const offset = (page - 1) * limit

      // 构建查询条件
      let whereClause = 'WHERE 1=1'
      const queryParams = []
      let paramIndex = 1

      // 处理筛选条件
      if (filters.user_id) {
        whereClause += ` AND a.user_id = ?`
        queryParams.push(filters.user_id)
      }

      if (filters.user_display_id) {
        whereClause += ` AND u.user_id LIKE ?`
        queryParams.push(`%${filters.user_display_id}%`)
      }

      if (filters.type) {
        whereClause += ` AND a.type = ?`
        queryParams.push(filters.type)
      }

      if (filters.status !== undefined && filters.status !== '') {
        whereClause += ` AND a.status = ?`
        queryParams.push(parseInt(filters.status))
      }

      // 构建排序
      const validSortFields = ['id', 'created_at', 'audit_time', 'status']
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

      // 查询数据
      const dataQuery = `
        SELECT 
          a.id,
          a.user_id,
          a.type,
          a.content,
          a.status,
          a.created_at,
          a.audit_time,
          u.user_id as user_display_id,
          u.nickname,
          u.avatar
        FROM audit a
        LEFT JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.${sortField} ${order}
        LIMIT ? OFFSET ?
      `

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit a
        LEFT JOIN users u ON a.user_id = u.id
        ${whereClause}
      `

      queryParams.push(parseInt(limit), offset)

      const [dataResult, countResult] = await Promise.all([
        pool.query(dataQuery, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ])

      return {
        data: dataResult[0],
        total: parseInt(countResult[0][0].total),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    },

    getOne: async (req) => {
      const { id } = req.params

      const query = `
        SELECT 
          a.id,
          a.user_id,
          a.type,
          a.content,
          a.status,
          a.created_at,
          a.audit_time,
          u.user_id as user_display_id,
          u.nickname,
          u.avatar
        FROM audit a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
      `

      const result = await pool.query(query, [id])
      return result[0][0] || null
    }
  }
}

const auditHandlers = createCrudHandlers(auditCrudConfig)

// 认证管理路由
router.post('/audit', adminAuth, auditHandlers.create)
router.put('/audit/:id', adminAuth, auditHandlers.update)
router.delete('/audit/:id', adminAuth, auditHandlers.deleteOne)
router.delete('/audit', adminAuth, auditHandlers.deleteMany)
router.get('/audit/:id', adminAuth, async (req, res) => {
  try {
    const result = await auditCrudConfig.customQueries.getOne(req)
    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: RESPONSE_CODES.NOT_FOUND,
        message: '认证记录不存在'
      })
    }
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '获取认证记录成功',
      data: result
    })
  } catch (error) {
    console.error('获取认证记录失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取认证记录失败',
      error: error.message
    })
  }
})

router.get('/audit', adminAuth, async (req, res) => {
  try {
    const result = await auditCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '获取认证列表成功',
      data: result
    })
  } catch (error) {
    console.error('获取认证列表失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '获取认证列表失败',
      error: error.message
    })
  }
})

// 审核通过
router.put('/audit/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params

    // 获取审核记录信息
    const [auditResult] = await pool.query('SELECT user_id, type FROM audit WHERE id = ?', [id])
    if (auditResult.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: RESPONSE_CODES.ERROR,
        message: '审核记录不存在'
      })
    }

    const { user_id, type } = auditResult[0]

    // 更新审核状态为通过
    await pool.query('UPDATE audit SET status = 1, audit_time = NOW() WHERE id = ?', [id])

    // 根据认证类型更新用户的verified字段
    // type: 1-官方认证, 2-个人认证
    const verifiedValue = type === 1 ? 1 : (type === 2 ? 2 : 0)
    await pool.query('UPDATE users SET verified = ? WHERE id = ?', [verifiedValue, user_id])

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '审核通过成功'
    })
  } catch (error) {
    console.error('审核通过失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '审核通过失败',
      error: error.message
    })
  }
})

// 拒绝申请
router.put('/audit/:id/reject', adminAuth, async (req, res) => {
  try {
    const { id } = req.params

    // 获取审核记录信息
    const [auditResult] = await pool.query('SELECT user_id FROM audit WHERE id = ?', [id])
    if (auditResult.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: RESPONSE_CODES.ERROR,
        message: '审核记录不存在'
      })
    }

    const { user_id } = auditResult[0]

    // 更新审核状态为拒绝
    await pool.query('UPDATE audit SET status = 2, audit_time = NOW() WHERE id = ?', [id])

    // 拒绝认证申请时，将用户的verified字段设置为0（未认证）
    await pool.query('UPDATE users SET verified = 0 WHERE id = ?', [user_id])

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '拒绝申请成功'
    })
  } catch (error) {
    console.error('拒绝申请失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '拒绝申请失败',
      error: error.message
    })
  }
})

// Categories CRUD 配置
const categoriesCrudConfig = {
  table: 'categories',
  name: '分类',
  requiredFields: ['name', 'category_title'],
  updateFields: ['name', 'category_title'],
  uniqueFields: ['name', 'category_title'],
  cascadeRules: [
    { table: 'posts', field: 'category_id' }
  ],
  searchFields: {
    name: { operator: 'LIKE' },
    category_title: { operator: 'LIKE' }
  },
  allowedSortFields: ['id', 'name', 'created_at'],
  defaultOrderBy: 'id ASC',

  // 创建前的自定义验证
  beforeCreate: async (data) => {
    const { name, category_title } = data

    if (!name || name.trim() === '') {
      return { isValid: false, message: '分类名称不能为空' }
    }

    if (!category_title || category_title.trim() === '') {
      return { isValid: false, message: '分类英文标题不能为空' }
    }

    // 检查分类名称是否已存在
    const [existingName] = await pool.execute(
      'SELECT id FROM categories WHERE name = ?',
      [name.trim()]
    )

    if (existingName.length > 0) {
      return { isValid: false, message: '分类名称已存在' }
    }

    // 检查分类英文标题是否已存在
    const [existingTitle] = await pool.execute(
      'SELECT id FROM categories WHERE category_title = ?',
      [category_title.trim()]
    )

    if (existingTitle.length > 0) {
      return { isValid: false, message: '分类英文标题已存在' }
    }

    // 清理数据
    data.name = name.trim()
    data.category_title = category_title.trim()

    return { isValid: true }
  },

  // 更新前的自定义验证
  beforeUpdate: async (data, id, req) => {
    const { name, category_title } = data

    if (name && name.trim() === '') {
      return { isValid: false, message: '分类名称不能为空' }
    }

    if (category_title && category_title.trim() === '') {
      return { isValid: false, message: '分类英文标题不能为空' }
    }

    if (name) {
      // 检查分类名称是否已存在（排除当前记录）
      const [existingName] = await pool.execute(
        'SELECT id FROM categories WHERE name = ? AND id != ?',
        [name.trim(), id]
      )

      if (existingName.length > 0) {
        return { isValid: false, message: '分类名称已存在' }
      }

      data.name = name.trim()
    }

    if (category_title) {
      // 检查分类英文标题是否已存在（排除当前记录）
      const [existingTitle] = await pool.execute(
        'SELECT id FROM categories WHERE category_title = ? AND id != ?',
        [category_title.trim(), id]
      )

      if (existingTitle.length > 0) {
        return { isValid: false, message: '分类英文标题已存在' }
      }

      data.category_title = category_title.trim()
    }

    return { isValid: true }
  },

  // 删除前检查
  beforeDelete: async (id) => {
    // 检查是否有笔记使用此分类
    const [posts] = await pool.execute(
      'SELECT COUNT(*) as count FROM posts WHERE category_id = ?',
      [id]
    )

    if (posts[0].count > 0) {
      return { isValid: false, message: `该分类下还有 ${posts[0].count} 篇笔记，无法删除` }
    }

    return { isValid: true }
  },

  // 批量删除前检查
  beforeDeleteMany: async (ids) => {
    const placeholders = ids.map(() => '?').join(',')
    const [posts] = await pool.execute(
      `SELECT category_id, COUNT(*) as count FROM posts WHERE category_id IN (${placeholders}) GROUP BY category_id`,
      ids
    )

    if (posts.length > 0) {
      const categoryIds = posts.map(p => p.category_id).join(', ')
      return { isValid: false, message: `分类 ${categoryIds} 下还有笔记，无法删除` }
    }

    return { isValid: true }
  },

  customQueries: {
    create: async (req) => {
      const { name, category_title } = req.body;

      if (!name || name.trim() === '') {
        throw new Error('分类名称不能为空');
      }

      if (!category_title || category_title.trim() === '') {
        throw new Error('分类英文标题不能为空');
      }

      // 检查分类名称是否已存在
      const [existingName] = await pool.execute(
        'SELECT id FROM categories WHERE name = ?',
        [name.trim()]
      );

      if (existingName.length > 0) {
        throw new Error('分类名称已存在');
      }

      // 检查分类英文标题是否已存在
      const [existingTitle] = await pool.execute(
        'SELECT id FROM categories WHERE category_title = ?',
        [category_title.trim()]
      );

      if (existingTitle.length > 0) {
        throw new Error('分类英文标题已存在');
      }

      // 创建分类
      const [result] = await pool.execute(
        'INSERT INTO categories (name, category_title) VALUES (?, ?)',
        [name.trim(), category_title.trim()]
      );

      return {
        id: result.insertId,
        name: name.trim(),
        category_title: category_title.trim()
      };
    },

    getList: async (req) => {
      const { page = 1, limit = 10, sortField = 'id', sortOrder = 'asc', name, category_title } = req.query
      const offset = (parseInt(page) - 1) * parseInt(limit)

      // 构建WHERE条件
      const conditions = []
      const queryParams = []

      if (name && name.trim()) {
        conditions.push('c.name LIKE ?')
        queryParams.push(`%${name.trim()}%`)
      }

      if (category_title && category_title.trim()) {
        conditions.push('c.category_title LIKE ?')
        queryParams.push(`%${category_title.trim()}%`)
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

      // 验证排序字段
      const allowedSortFields = ['id', 'name', 'category_title', 'created_at', 'post_count']
      const validSortField = allowedSortFields.includes(sortField) ? sortField : 'id'
      const validSortOrder = ['asc', 'desc'].includes(sortOrder?.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC'

      // 获取总数
      const [countResult] = await pool.execute(`
        SELECT COUNT(DISTINCT c.id) as total
        FROM categories c
        ${whereClause}
      `, queryParams)

      // 获取数据
      const limitNum = Number(limit);
      const offsetNum = Number(offset);

      const [categories] = await pool.execute(`
        SELECT 
          c.id,
          c.name,
          c.category_title,
          c.created_at,
          COUNT(p.id) as post_count
        FROM categories c
        LEFT JOIN posts p ON c.id = p.category_id
        ${whereClause}
        GROUP BY c.id, c.name, c.category_title, c.created_at
        ORDER BY ${validSortField} ${validSortOrder}
        LIMIT ${limitNum} OFFSET ${offsetNum}
      `, queryParams);

      return {
        data: categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    }
  }
}

const categoriesHandlers = createCrudHandlers(categoriesCrudConfig)

// Categories 路由
router.post('/categories', adminAuth, categoriesHandlers.create)
router.put('/categories/:id', adminAuth, categoriesHandlers.update)
router.delete('/categories/:id', adminAuth, categoriesHandlers.deleteOne)
router.delete('/categories', adminAuth, categoriesHandlers.deleteMany)
router.get('/categories/:id', adminAuth, categoriesHandlers.getOne)
router.get('/categories', adminAuth, async (req, res) => {
  try {
    const result = await categoriesCrudConfig.customQueries.getList(req)
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      ...result
    })
  } catch (err) {
    console.error('获取分类列表失败:', err)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.SERVER_ERROR,
      message: err.message || '获取分类列表失败'
    })
  }
})

module.exports = router