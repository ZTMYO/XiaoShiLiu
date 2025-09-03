# 小石榴图文社区 API 接口文档

## 项目信息
- **项目名称**: 小石榴图文社区
- **版本**: v1.0.0
- **基础URL**: `http://localhost:3001`
- **数据库**: xiaoshiliu (MySQL)
- **更新时间**: 2025-09-03

## 通用说明

### 响应格式
所有API接口统一返回JSON格式，结构如下：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 状态码说明
- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权，需要登录
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

### 认证说明
需要认证的接口需要在请求头中携带JWT token：
```
Authorization: Bearer <your_jwt_token>
```

### 分页参数
支持分页的接口通用参数：
- `page`: 页码，默认为1
- `limit`: 每页数量，默认为20

---

## 认证相关接口

### 1. 用户注册
**接口地址**: `POST /api/auth/register`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 用户ID（唯一） |
| nickname | string | 是 | 昵称 |
| password | string | 是 | 密码（6-20位） |
| avatar | string | 否 | 头像URL |
| bio | string | 否 | 个人简介 |
| location | string | 否 | 所在地（如不提供，系统将自动根据IP获取属地） |

**功能说明**:
- 系统会自动通过第三方API获取用户属地信息
- 如果用户手动提供了location参数，则优先使用用户提供的值
- 对于本地环境，location将显示为"本地"
- 系统不会存储用户的IP地址，仅获取属地信息用于显示

**响应示例**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "user_id": "user_001",
      "nickname": "小石榴",
      "avatar": "https://example.com/avatar.jpg",
      "bio": "这是个人简介",
      "location": "北京"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}
```

### 2. 用户登录
**接口地址**: `POST /api/auth/login`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 小石榴号 |
| password | string | 是 | 密码 |

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "user_id": "xiaoshiliu123",
      "nickname": "小石榴用户",
      "avatar": "http://example.com/avatar.jpg",
      "bio": "这是我的个人简介",
      "location": "北京",
      "follow_count": 10,
      "fans_count": 20,
      "like_count": 100
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}
```

### 3. 刷新令牌
**接口地址**: `POST /api/auth/refresh`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 刷新令牌 |

**响应示例**:
```json
{
  "code": 200,
  "message": "令牌刷新成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### 4. 退出登录
**接口地址**: `POST /api/auth/logout`
**需要认证**: 是

**响应示例**:
```json
{
  "code": 200,
  "message": "退出成功"
}
```

### 5. 获取当前用户信息
**接口地址**: `GET /api/auth/me`
**需要认证**: 是

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "小石榴",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "这是个人简介",
    "location": "北京",
    "follow_count": 10,
    "fans_count": 20,
    "like_count": 100,
    "is_active": 1,
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

---

## 用户相关接口

### 1. 获取用户列表
**接口地址**: `GET /api/users`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "user_id": "user_001",
        "nickname": "小石榴",
        "avatar": "https://example.com/avatar.jpg",
        "bio": "这是个人简介",
        "location": "北京",
        "follow_count": 10,
        "fans_count": 20,
        "like_count": 100,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### 2. 获取用户详情
**接口地址**: `GET /api/users/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "小石榴",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "这是个人简介",
    "location": "北京",
    "follow_count": 10,
    "fans_count": 20,
    "like_count": 100,
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

### 3. 获取用户收藏列表
**接口地址**: `GET /api/users/:id/collections`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

### 4. 关注用户
**接口地址**: `POST /api/users/:id/follow`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 被关注用户ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "关注成功"
}
```

### 5. 取消关注用户
**接口地址**: `DELETE /api/users/:id/follow`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 被关注用户ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "取消关注成功"
}
```

### 6. 获取关注列表
**接口地址**: `GET /api/users/:id/following`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "following": [
      {
        "id": 2,
        "user_id": "user_002",
        "nickname": "用户2",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "个人简介",
        "follow_count": 5,
        "fans_count": 10,
        "followed_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

### 7. 获取粉丝列表
**接口地址**: `GET /api/users/:id/followers`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "followers": [
      {
        "id": 3,
        "user_id": "user_003",
        "nickname": "用户3",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "个人简介",
        "follow_count": 8,
        "fans_count": 15,
        "followed_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 20,
      "pages": 1
    }
  }
}
```

### 8. 搜索用户
**接口地址**: `GET /api/users/search`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词（支持昵称和小石榴号搜索） |
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "user_id": "user_001",
        "nickname": "小石榴",
        "avatar": "https://example.com/avatar.jpg",
        "bio": "这是个人简介",
        "location": "北京",
        "follow_count": 10,
        "fans_count": 20,
        "like_count": 100,
        "post_count": 5,
        "isFollowing": false,
        "isMutual": false,
        "buttonType": "follow",
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 9. 获取用户个性标签
**接口地址**: `GET /api/users/:id/personality-tags`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "摄影爱好者",
        "color": "#FF6B6B"
      },
      {
        "id": 2,
        "name": "旅行达人",
        "color": "#4ECDC4"
      }
    ]
  }
}
```

### 10. 获取用户发布的帖子
**接口地址**: `GET /api/users/:id/posts`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "美丽的风景",
        "content": "今天拍到了很美的风景",
        "images": ["https://example.com/image1.jpg"],
        "category": "photography",
        "tags": ["风景", "摄影"],
        "like_count": 10,
        "comment_count": 5,
        "collection_count": 3,
        "view_count": 100,
        "isLiked": false,
        "isCollected": false,
        "created_at": "2025-08-30T00:00:00.000Z",
        "user": {
          "id": 1,
          "user_id": "user_001",
          "nickname": "小石榴",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### 11. 获取用户点赞的帖子
**接口地址**: `GET /api/users/:id/likes`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 2,
        "title": "精彩的瞬间",
        "content": "记录生活中的美好",
        "images": ["https://example.com/image2.jpg"],
        "category": "life",
        "tags": ["生活", "记录"],
        "like_count": 15,
        "comment_count": 8,
        "collection_count": 5,
        "view_count": 150,
        "isLiked": true,
        "isCollected": false,
        "liked_at": "2025-01-02T00:00:00.000Z",
        "created_at": "2025-08-30T00:00:00.000Z",
        "user": {
          "id": 2,
          "user_id": "user_002",
          "nickname": "用户2",
          "avatar": "https://example.com/avatar2.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "pages": 1
    }
  }
}
```

### 12. 获取关注状态
**接口地址**: `GET /api/users/:id/follow-status`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 目标用户ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "isFollowing": true,
    "isMutual": false,
    "buttonType": "unfollow"
  }
}
```

### 13. 获取互关列表
**接口地址**: `GET /api/users/:id/mutual-follows`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "mutualFollows": [
      {
        "id": 3,
        "user_id": "user_003",
        "nickname": "用户3",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "个人简介",
        "follow_count": 8,
        "fans_count": 15,
        "followed_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### 14. 获取用户统计信息
**接口地址**: `GET /api/users/:id/stats`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts_count": 25,
    "likes_count": 150,
    "collections_count": 80,
    "comments_count": 45,
    "followers_count": 120,
    "following_count": 85,
    "views_count": 2500
  }
}
```

### 15. 更新用户信息
**接口地址**: `PUT /api/users/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| avatar | string | 否 | 头像URL |
| bio | string | 否 | 个人简介 |
| location | string | 否 | 所在地 |

**响应示例**:
```json
{
  "code": 200,
  "message": "用户信息更新成功",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "新昵称",
    "avatar": "https://example.com/new_avatar.jpg",
    "bio": "新的个人简介",
    "location": "上海",
    "updated_at": "2025-01-02T00:00:00.000Z"
  }
}
```

---

## 笔记相关接口

### 1. 获取笔记列表
**接口地址**: `GET /api/posts`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| category | string | 否 | 分类筛选 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "user_id": 1,
        "title": "笔记标题",
        "content": "笔记内容",
        "category": "生活",
        "view_count": 100,
        "like_count": 10,
        "comment_count": 5,
        "collect_count": 3,
        "created_at": "2025-08-30T00:00:00.000Z",
        "nickname": "小石榴",
        "user_avatar": "https://example.com/avatar.jpg",
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "tags": [
          {
            "id": 1,
            "name": "标签名"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### 2. 获取笔记详情
**接口地址**: `GET /api/posts/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**说明**: 访问笔记详情会自动增加浏览量

### 3. 创建笔记
**接口地址**: `POST /api/posts`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 笔记标题 |
| content | string | 是 | 笔记内容 |
| category | string | 否 | 分类 |
| images | array | 否 | 图片URL数组 |
| tags | array | 否 | 标签ID数组 |

**请求示例**:
```json
{
  "title": "分享一个美好的下午",
  "content": "今天天气很好，在公园里散步...",
  "category": "生活",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "tags": [1, 2, 3]
}
```

### 4. 获取笔记评论
**接口地址**: `GET /api/posts/:id/comments`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

### 5. 收藏笔记
**接口地址**: `POST /api/posts/:id/collect`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "收藏成功"
}
```

### 6. 搜索笔记
**接口地址**: `GET /api/posts/search`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词（支持标题和内容搜索） |
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| category | string | 否 | 分类筛选 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "美丽的风景",
        "content": "今天拍到了很美的风景",
        "images": ["https://example.com/image1.jpg"],
        "category": "photography",
        "tags": ["风景", "摄影"],
        "like_count": 10,
        "comment_count": 5,
        "collection_count": 3,
        "view_count": 100,
        "isLiked": false,
        "isCollected": false,
        "created_at": "2025-08-30T00:00:00.000Z",
        "user": {
          "id": 1,
          "user_id": "user_001",
          "nickname": "小石榴",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 7. 更新笔记
**接口地址**: `PUT /api/posts/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 笔记标题 |
| content | string | 否 | 笔记内容 |
| category | string | 否 | 分类 |
| images | array | 否 | 图片URL数组 |
| tags | array | 否 | 标签ID数组 |

**请求示例**:
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "category": "生活",
  "images": [
    "https://example.com/new_image1.jpg"
  ],
  "tags": [1, 3, 5]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "笔记更新成功",
  "data": {
    "id": 1,
    "title": "更新后的标题",
    "content": "更新后的内容",
    "category": "生活",
    "updated_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 8. 删除笔记
**接口地址**: `DELETE /api/posts/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "笔记删除成功"
}
```

### 9. 取消收藏笔记
**接口地址**: `DELETE /api/posts/:id/collect`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "取消收藏成功"
}
```

### 10. 获取草稿列表
**接口地址**: `GET /api/posts/drafts`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| keyword | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "drafts": [
      {
        "id": 1,
        "title": "草稿标题",
        "content": "草稿内容",
        "category": "生活",
        "images": ["image1.jpg", "image2.jpg"],
        "tags": ["标签1", "标签2"],
        "created_at": "2025-01-16T00:00:00.000Z",
        "updated_at": "2025-01-16T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### 11. 保存草稿
**接口地址**: `POST /api/posts/drafts`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 草稿标题 |
| content | string | 否 | 草稿内容 |
| category | string | 否 | 分类 |
| images | array | 否 | 图片URL数组 |
| tags | array | 否 | 标签数组 |

**响应示例**:
```json
{
  "code": 200,
  "message": "草稿保存成功",
  "data": {
    "id": 1,
    "title": "草稿标题",
    "content": "草稿内容",
    "category": "生活",
    "images": ["image1.jpg"],
    "tags": ["标签1"],
    "created_at": "2025-01-16T00:00:00.000Z"
  }
}
```

### 12. 更新草稿
**接口地址**: `PUT /api/posts/drafts/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 草稿ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 草稿标题 |
| content | string | 否 | 草稿内容 |
| category | string | 否 | 分类 |
| images | array | 否 | 图片URL数组 |
| tags | array | 否 | 标签数组 |

**响应示例**:
```json
{
  "code": 200,
  "message": "草稿更新成功",
  "data": {
    "id": 1,
    "title": "更新后的草稿标题",
    "content": "更新后的草稿内容",
    "updated_at": "2025-01-16T00:00:00.000Z"
  }
}
```

### 13. 删除草稿
**接口地址**: `DELETE /api/posts/drafts/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 草稿ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "草稿删除成功"
}
```

### 14. 发布草稿
**接口地址**: `POST /api/posts/drafts/:id/publish`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 草稿ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "草稿发布成功",
  "data": {
    "post_id": 123,
    "title": "发布的笔记标题",
    "published_at": "2025-01-16T00:00:00.000Z"
  }
}
```

---
### 4. 删除评论
**接口地址**: `DELETE /api/comments/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 评论ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "评论删除成功"
}
```

---
### 4. 获取笔记评论
**接口地址**: `GET /api/posts/:id/comments`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

---

## 评论相关接口

### 1. 获取评论列表
**接口地址**: `GET /api/comments`
**需要认证**: 否（可选）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| post_id | int | 是 | 笔记ID |
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "这是一条普通评论",
        "user_id": 1,
        "nickname": "张三",
        "user_avatar": "https://img.example.com/avatar1.jpg",
        "user_auto_id": 1,
        "user_display_id": "user123",
        "post_id": 1,
        "parent_id": null,
        "created_at": "2025-08-30T00:00:00.000Z",
        "likes_count": 5,
        "replies_count": 2,
        "is_liked": false
      },
      {
        "id": 2,
        "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@摄影爱好者</a>&nbsp;你的作品真的很棒！</p>",
        "user_id": 2,
        "nickname": "李四",
        "user_avatar": "https://img.example.com/avatar2.jpg",
        "user_auto_id": 2,
        "user_display_id": "user456",
        "post_id": 1,
        "parent_id": null,
        "created_at": "2025-08-30T01:00:00.000Z",
        "likes_count": 3,
        "replies_count": 0,
        "is_liked": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

**说明**:
- `content` 字段可能包含HTML格式的@用户标签
- 前端需要正确渲染HTML内容以显示@用户链接
- @用户链接包含 `href`、`data-user-id`、`class` 等属性用于前端处理
```

### 2. 创建评论
**接口地址**: `POST /api/comments`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| post_id | int | 是 | 笔记ID |
| content | string | 是 | 评论内容（支持@功能的HTML格式） |
| parent_id | int | 否 | 父评论ID（回复评论时使用） |

**@功能说明**:
- 评论内容支持@用户功能
- @用户的HTML格式：`<a href="/user/{user_id}" data-user-id="{user_id}" class="mention-link" contenteditable="false">@{nickname}</a>`
- 系统会自动解析@用户标签并发送通知给被@的用户
- 支持在一条评论中@多个用户

**请求示例**:
​```json
{
  "post_id": 1,
  "content": "这是一条普通评论",
  "parent_id": null
}
```

**包含@用户的请求示例**:
```json
{
  "post_id": 1,
  "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@摄影爱好者</a>&nbsp;你的作品真的很棒！</p>",
  "parent_id": null
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "评论创建成功",
  "data": {
    "id": 1,
    "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@摄影爱好者</a>&nbsp;你的作品真的很棒！</p>",
    "user_id": 1,
    "post_id": 1,
    "parent_id": null,
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

**@功能处理说明**:
- 当评论包含@用户标签时，系统会自动：
  1. 解析HTML中的`data-user-id`属性获取被@用户的ID
  2. 验证被@用户是否存在
  3. 向被@用户发送mention类型的通知
  4. 不会向自己发送@通知

### 3. 获取评论回复
**接口地址**: `GET /api/comments/:id/replies`
**需要认证**: 否（可选）

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 评论ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认10 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "replies": [
      {
        "id": 2,
        "content": "这是一条回复",
        "user_id": 2,
        "nickname": "李四",
        "user_avatar": "https://img.example.com/avatar2.jpg",
        "parent_id": 1,
        "created_at": "2025-08-30T01:00:00.000Z",
        "likes_count": 2,
        "is_liked": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 4. 删除评论
**接口地址**: `DELETE /api/comments/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 评论ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "评论删除成功"
}
```

---

## 通知相关接口

### 1. 获取评论通知
**接口地址**: `GET /api/notifications/comments`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "comment",
        "sender_id": 2,
        "sender_nickname": "用户2",
        "sender_avatar": "https://example.com/avatar2.jpg",
        "post_id": 1,
        "post_title": "笔记标题",
        "comment_content": "评论内容",
        "is_read": 0,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

### 2. 获取点赞通知
**接口地址**: `GET /api/notifications/likes`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 2,
        "type": "like",
        "sender_id": 3,
        "sender_nickname": "用户3",
        "sender_avatar": "https://example.com/avatar3.jpg",
        "target_type": "post",
        "post_id": 1,
        "post_title": "笔记标题",
        "is_read": 0,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### 3. 获取关注通知
**接口地址**: `GET /api/notifications/follows`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 3,
        "type": "follow",
        "sender_id": 4,
        "sender_nickname": "用户4",
        "sender_avatar": "https://example.com/avatar4.jpg",
        "is_read": 0,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "pages": 1
    }
  }
}
```

### 4. 标记通知为已读
**接口地址**: `PUT /api/notifications/:id/read`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 通知ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "标记成功"
}
```

### 4. 获取收藏通知
**接口地址**: `GET /api/notifications/collections`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 4,
        "type": "collection",
        "sender_id": 5,
        "sender_nickname": "用户5",
        "sender_avatar": "https://example.com/avatar5.jpg",
        "post_id": 1,
        "post_title": "笔记标题",
        "post_image": "https://example.com/post_image.jpg",
        "is_read": 0,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "pages": 1
    }
  }
}
```

### 5. 获取所有通知
**接口地址**: `GET /api/notifications`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "comment",
        "sender_id": 2,
        "sender_nickname": "用户2",
        "sender_avatar": "https://example.com/avatar2.jpg",
        "post_id": 1,
        "post_title": "笔记标题",
        "comment_content": "评论内容",
        "is_read": 0,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

### 6. 标记通知为已读
**接口地址**: `PUT /api/notifications/:id/read`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 通知ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "标记成功"
}
```

### 7. 标记所有通知为已读
**接口地址**: `PUT /api/notifications/read-all`
**需要认证**: 是

**响应示例**:
```json
{
  "code": 200,
  "message": "全部标记成功"
}
```

### 8. 删除通知
**接口地址**: `DELETE /api/notifications/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 通知ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

### 9. 获取未读通知数量
**接口地址**: `GET /api/notifications/unread-count`
**需要认证**: 是

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "unread_count": 5
  }
}
```

---

## 文件上传接口

### 1. 单文件上传
**接口地址**: `POST /api/upload/single`
**需要认证**: 是

**请求参数**:
- 使用 `multipart/form-data` 格式
- 文件字段名: `file`
- 支持格式: jpg, jpeg, png, webp
- 文件大小限制: 5MB

**响应示例**:
```json
{
  "code": 200,
  "message": "文件上传成功",
  "data": {
    "originalname": "image.jpg",
    "size": 1024000,
    "url": "https://img.example.com/1640995200000_image.jpg"
  }
}
```

### 2. 多文件上传
**接口地址**: `POST /api/upload/multiple`
**需要认证**: 是

**请求参数**:
- 使用 `multipart/form-data` 格式
- 文件字段名: `files`
- 最多支持9个文件
- 支持格式: jpg, jpeg, png, webp
- 单文件大小限制: 5MB

**响应示例**:
```json
{
  "code": 200,
  "message": "文件上传成功",
  "data": [
    {
      "originalname": "image1.jpg",
      "size": 1024000,
      "url": "https://img.example.com/1640995200000_image1.jpg"
    },
    {
      "originalname": "image2.jpg",
      "size": 2048000,
      "url": "https://img.example.com/1640995200001_image2.jpg"
    }
  ]
}
```

### 3. Base64图片上传
**接口地址**: `POST /api/upload/base64`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| images | array | 是 | Base64编码的图片数组 |

**请求示例**:
```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB..."
  ]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "图片上传成功",
  "data": {
    "count": 2,
    "urls": [
      "https://img.example.com/1640995200000_base64_image1.jpg",
      "https://img.example.com/1640995200001_base64_image2.png"
    ]
  }
}
```

### 4. 删除文件
**接口地址**: `DELETE /api/upload/:filename`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 是 | 文件名 |

**响应示例**:
```json
{
  "code": 200,
  "message": "文件删除成功"
}
```

---

## 互动相关接口

### 1. 点赞/取消点赞
**接口地址**: `POST /api/likes`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_type | int | 是 | 目标类型（1:笔记, 2:评论） |
| target_id | int | 是 | 目标ID |

**功能说明**:
- 如果用户未点赞，则执行点赞操作
- 如果用户已点赞，则执行取消点赞操作

**请求示例**:
```json
{
  "target_type": 1,
  "target_id": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "liked": true
  }
}
```

### 1.1 取消点赞（备用接口）
**接口地址**: `DELETE /api/likes`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_type | int | 是 | 目标类型（1:笔记, 2:评论） |
| target_id | int | 是 | 目标ID |

**请求示例**:
```json
{
  "target_type": 1,
  "target_id": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "取消点赞成功"
}
```

### 2. 收藏/取消收藏
**接口地址**: `POST /api/collections`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| post_id | int | 是 | 笔记ID |

**请求示例**:
```json
{
  "post_id": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "collected": true
  }
}
```

---

## 标签相关接口

### 1. 获取标签列表
**接口地址**: `GET /api/tags`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "生活",
      "description": "生活相关内容",
      "use_count": 100,
      "is_hot": 1,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

### 2. 获取热门标签
**接口地址**: `GET /api/tags/hot`

**说明**: 返回最多10个热门标签

---

## 搜索相关接口

### 1. 通用搜索
**接口地址**: `GET /api/search`
**需要认证**: 否（可选）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词 |
| tag | string | 否 | 标签搜索 |
| type | string | 否 | 搜索类型：all（默认）、posts、users |
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "生活",
    "tag": "",
    "type": "all",
    "data": {
      "posts": [
        {
          "id": 1,
          "title": "生活小记",
          "content": "今天的生活很美好",
          "author_id": 1,
          "author_name": "张三",
          "author_avatar": "https://img.example.com/avatar1.jpg",
          "created_at": "2025-08-30T00:00:00.000Z",
          "likes_count": 10,
          "comments_count": 5,
          "is_liked": false,
          "is_favorited": false
        }
      ],
      "users": [
        {
          "id": 1,
          "username": "张三",
          "nickname": "小张",
          "avatar": "https://img.example.com/avatar1.jpg",
          "bio": "热爱生活",
          "is_following": false
        }
      ]
    },
    "tagStats": [
      {
        "name": "生活",
        "count": 50
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 统计相关接口

### 1. 获取统计数据
**接口地址**: `GET /api/stats`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": 1000,
    "posts": 5000,
    "comments": 10000,
    "likes": 20000
  }
}
```

---

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### 使用curl测试接口

```bash
# 用户注册
curl -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "nickname": "测试用户",
    "password": "123456",
    "email": "test@example.com"
  }'

# 用户登录
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "password": "123456"
  }'

# 获取当前用户信息（需要认证）
curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 获取用户列表
curl -X GET "http://localhost:3001/api/users?page=1&limit=10"

# 获取笔记详情
curl -X GET "http://localhost:3001/api/posts/1"

# 创建笔记（需要认证）
curl -X POST "http://localhost:3001/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "测试笔记",
    "content": "这是测试内容",
    "category": "测试"
  }'

# 创建评论（需要认证）
curl -X POST "http://localhost:3001/api/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "post_id": 1,
    "content": "这是一条测试评论"
  }'

# 点赞笔记（需要认证）
curl -X POST "http://localhost:3001/api/posts/1/like" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 收藏笔记（需要认证）
curl -X POST "http://localhost:3001/api/posts/1/collect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 关注用户（需要认证）
curl -X POST "http://localhost:3001/api/users/2/follow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 上传单个文件（需要认证）
curl -X POST "http://localhost:3001/api/upload/single" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/image.jpg"

# 获取通知（需要认证）
curl -X GET "http://localhost:3001/api/notifications/comments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 搜索笔记
curl -X GET "http://localhost:3001/api/search?keyword=生活"
```

### 使用JavaScript测试接口

```javascript
// 设置基础URL和token
const API_BASE = 'http://localhost:3001';
let authToken = localStorage.getItem('auth_token');

// 通用请求函数
async function apiRequest(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  if (authToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${API_BASE}${url}`, config);
  return response.json();
}

// 用户注册
async function register() {
  const result = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'test_user',
      nickname: '测试用户',
      password: '123456',
      email: 'test@example.com'
    })
  });
  
  if (result.code === 200) {
    authToken = result.data.tokens.access_token;
    localStorage.setItem('auth_token', authToken);
  }
  
  return result;
}

// 用户登录
async function login() {
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'test_user',
      password: '123456'
    })
  });
  
  if (result.code === 200) {
    authToken = result.data.tokens.access_token;
    localStorage.setItem('auth_token', authToken);
  }
  
  return result;
}

// 获取当前用户信息
async function getCurrentUser() {
  return await apiRequest('/api/auth/me');
}

// 获取笔记列表
async function getPosts(page = 1, limit = 10) {
  return await apiRequest(`/api/posts?page=${page}&limit=${limit}`);
}

// 创建笔记
async function createPost(postData) {
  return await apiRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  });
}

// 点赞笔记
async function likePost(postId) {
  return await apiRequest(`/api/posts/${postId}/like`, {
    method: 'POST'
  });
}

// 收藏笔记
async function collectPost(postId) {
  return await apiRequest(`/api/posts/${postId}/collect`, {
    method: 'POST'
  });
}

// 关注用户
async function followUser(userId) {
  return await apiRequest(`/api/users/${userId}/follow`, {
    method: 'POST'
  });
}

// 上传文件
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  return await apiRequest('/api/upload/single', {
    method: 'POST',
    headers: {
      // 不设置Content-Type，让浏览器自动设置multipart/form-data
      Authorization: `Bearer ${authToken}`
    },
    body: formData
  });
}

// 获取通知
async function getNotifications(type = 'comments', page = 1) {
  return await apiRequest(`/api/notifications/${type}?page=${page}`);
}

// 使用示例
async function example() {
  try {
    // 登录
    const loginResult = await login();
    console.log('登录结果:', loginResult);
    
    // 获取笔记列表
    const posts = await getPosts();
    console.log('笔记列表:', posts);
    
    // 创建笔记
    const newPost = await createPost({
      title: '测试笔记',
      content: '这是测试内容',
      category: '测试'
    });
    console.log('创建笔记结果:', newPost);
    
    // 点赞笔记
    if (posts.data.posts.length > 0) {
      const likeResult = await likePost(posts.data.posts[0].id);
      console.log('点赞结果:', likeResult);
    }
    
  } catch (error) {
    console.error('API调用错误:', error);
  }
}
```

---

## 注意事项

1. **认证要求**: 需要认证的接口必须在请求头中携带有效的JWT token
2. **Token管理**: 访问令牌有效期为1小时，刷新令牌有效期为7天
3. **请求格式**: 所有POST/PUT请求需要设置`Content-Type: application/json`（文件上传除外）
4. **文件上传**: 文件上传接口使用`multipart/form-data`格式，支持jpg、jpeg、png、gif、webp格式，单文件最大5MB
5. **状态切换**: 点赞、收藏、关注等操作支持切换状态（已点赞则取消点赞）
6. **自动更新**: 访问笔记详情会自动增加浏览量，创建评论会自动更新笔记的评论数
7. **关系更新**: 关注操作会自动更新用户的关注数和粉丝数
8. **搜索功能**: 搜索功能支持标题和内容的模糊匹配
9. **通知系统**: 评论、点赞、关注等操作会自动生成通知
10. **数据验证**: 用户注册时会验证用户ID唯一性和密码强度（6-20位）

---

## 管理员相关接口

### 认证说明
管理员接口使用JWT认证方式：
- 管理员需要先通过登录接口获取JWT token
- 在后续请求中在请求头中携带 `Authorization: Bearer <token>`

### 1. 管理员登录
**接口地址**: `POST /api/auth/admin/login`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 管理员用户名 |
| password | string | 是 | 管理员密码 |

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "admin": {
      "id": 1,
      "username": "admin"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}
```

### 2. 获取当前管理员信息
**接口地址**: `GET /api/auth/admin/me`
**需要认证**: 是（JWT）

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin"
  }
}
```

### 3. 用户管理

#### 3.1 获取用户列表
**接口地址**: `GET /api/admin/users`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| user_id | string | 否 | 用户ID搜索 |
| nickname | string | 否 | 昵称搜索 |
| status | int | 否 | 状态筛选（1=活跃，0=禁用） |
| sortBy | string | 否 | 排序字段（id, fans_count, like_count, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 3.2 创建用户
**接口地址**: `POST /api/admin/users`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 用户ID |
| nickname | string | 是 | 昵称 |
| password | string | 是 | 密码 |
| avatar | string | 否 | 头像URL |
| bio | string | 否 | 个人简介 |
| location | string | 否 | 所在地 |

#### 3.3 更新用户
**接口地址**: `PUT /api/admin/users/:id`
**需要认证**: 是

#### 3.4 删除用户
**接口地址**: `DELETE /api/admin/users/:id`
**需要认证**: 是

#### 3.5 批量删除用户
**接口地址**: `DELETE /api/admin/users`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 用户ID数组 |

### 4. 笔记管理

#### 4.1 获取笔记列表
**接口地址**: `GET /api/admin/posts`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| title | string | 否 | 标题搜索 |
| category | string | 否 | 分类筛选 |
| sortBy | string | 否 | 排序字段（id, view_count, like_count, collect_count, comment_count, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 4.2 创建笔记
**接口地址**: `POST /api/admin/posts`
**需要认证**: 是

#### 4.3 更新笔记
**接口地址**: `PUT /api/admin/posts/:id`
**需要认证**: 是

#### 4.4 删除笔记
**接口地址**: `DELETE /api/admin/posts/:id`
**需要认证**: 是

#### 4.5 批量删除笔记
**接口地址**: `DELETE /api/admin/posts`
**需要认证**: 是

### 5. 评论管理

#### 5.1 获取评论列表
**接口地址**: `GET /api/admin/comments`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| content | string | 否 | 内容搜索 |
| sortBy | string | 否 | 排序字段（id, like_count, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 5.2 创建评论
**接口地址**: `POST /api/admin/comments`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 评论内容 |
| user_id | int | 是 | 评论者ID |
| post_id | int | 是 | 笔记ID |
| parent_id | int | 否 | 父评论ID（回复评论时使用） |

#### 5.3 更新评论
**接口地址**: `PUT /api/admin/comments/:id`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 否 | 评论内容 |

#### 5.4 删除评论
**接口地址**: `DELETE /api/admin/comments/:id`
**需要认证**: 是

#### 5.5 批量删除评论
**接口地址**: `DELETE /api/admin/comments`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 评论ID数组 |

#### 5.6 获取单个评论详情
**接口地址**: `GET /api/admin/comments/:id`
**需要认证**: 是

### 6. 标签管理

#### 6.1 获取标签列表
**接口地址**: `GET /api/admin/tags`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| name | string | 否 | 标签名搜索 |
| sortBy | string | 否 | 排序字段（id, use_count, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 6.2 创建标签
**接口地址**: `POST /api/admin/tags`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 标签名称 |
| description | string | 否 | 标签描述 |

#### 6.3 更新标签
**接口地址**: `PUT /api/admin/tags/:id`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 标签名称 |
| description | string | 否 | 标签描述 |

#### 6.4 删除标签
**接口地址**: `DELETE /api/admin/tags/:id`
**需要认证**: 是

#### 6.5 批量删除标签
**接口地址**: `DELETE /api/admin/tags`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 标签ID数组 |

#### 6.6 获取单个标签详情
**接口地址**: `GET /api/admin/tags/:id`
**需要认证**: 是

### 7. 点赞管理

#### 7.1 获取点赞列表
**接口地址**: `GET /api/admin/likes`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| target_type | int | 否 | 目标类型（1=笔记，2=评论） |
| sortBy | string | 否 | 排序字段（id, user_id, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 7.2 创建点赞
**接口地址**: `POST /api/admin/likes`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | int | 是 | 用户ID |
| target_id | int | 是 | 目标ID（笔记ID或评论ID） |
| target_type | int | 是 | 目标类型（1=笔记，2=评论） |

#### 7.3 更新点赞
**接口地址**: `PUT /api/admin/likes/:id`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_type | int | 否 | 目标类型（1=笔记，2=评论） |

#### 7.4 删除点赞
**接口地址**: `DELETE /api/admin/likes/:id`
**需要认证**: 是

#### 7.5 批量删除点赞
**接口地址**: `DELETE /api/admin/likes`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 点赞ID数组 |

#### 7.6 获取单个点赞详情
**接口地址**: `GET /api/admin/likes/:id`
**需要认证**: 是

### 8. 收藏管理

#### 8.1 获取收藏列表
**接口地址**: `GET /api/admin/collections`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| sortBy | string | 否 | 排序字段（id, user_id, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 8.2 创建收藏
**接口地址**: `POST /api/admin/collections`
**需要认证**: 是

#### 8.3 删除收藏
**接口地址**: `DELETE /api/admin/collections/:id`
**需要认证**: 是

#### 8.4 批量删除收藏
**接口地址**: `DELETE /api/admin/collections`
**需要认证**: 是

### 9. 关注管理

#### 9.1 获取关注列表
**接口地址**: `GET /api/admin/follows`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| sortBy | string | 否 | 排序字段（id, follower_id, following_id, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 9.2 创建关注关系
**接口地址**: `POST /api/admin/follows`
**需要认证**: 是

#### 9.3 删除关注关系
**接口地址**: `DELETE /api/admin/follows/:id`
**需要认证**: 是

#### 9.4 批量删除关注关系
**接口地址**: `DELETE /api/admin/follows`
**需要认证**: 是

### 10. 通知管理

#### 10.1 获取通知列表
**接口地址**: `GET /api/admin/notifications`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| type | string | 否 | 通知类型筛选 |
| is_read | int | 否 | 已读状态（0=未读，1=已读） |
| sortBy | string | 否 | 排序字段（id, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 10.2 创建通知
**接口地址**: `POST /api/admin/notifications`
**需要认证**: 是

#### 10.3 更新通知
**接口地址**: `PUT /api/admin/notifications/:id`
**需要认证**: 是

#### 10.4 删除通知
**接口地址**: `DELETE /api/admin/notifications/:id`
**需要认证**: 是

#### 10.5 批量删除通知
**接口地址**: `DELETE /api/admin/notifications`
**需要认证**: 是

### 11. 会话管理

#### 11.1 获取会话列表
**接口地址**: `GET /api/admin/sessions`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| is_active | int | 否 | 活跃状态（0=非活跃，1=活跃） |
| sortBy | string | 否 | 排序字段（id, is_active, expires_at, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 11.2 创建会话
**接口地址**: `POST /api/admin/sessions`
**需要认证**: 是

#### 11.3 更新会话
**接口地址**: `PUT /api/admin/sessions/:id`
**需要认证**: 是

#### 11.4 删除会话
**接口地址**: `DELETE /api/admin/sessions/:id`
**需要认证**: 是

#### 11.5 批量删除会话
**接口地址**: `DELETE /api/admin/sessions`
**需要认证**: 是

### 12. 管理员管理

#### 12.1 测试接口
**接口地址**: `GET /api/admin/test-users`
**需要认证**: 是

**说明**: 临时测试接口，用于检查用户数据

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "user_id": "user_001",
      "nickname": "测试用户"
    }
  ]
}
```

#### 12.2 获取管理员列表
**接口地址**: `GET /api/admin/admins` 或 `GET /api/auth/admin/admins`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| username | string | 否 | 用户名搜索 |
| sortBy | string | 否 | 排序字段（username, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 12.2 创建管理员
**接口地址**: `POST /api/admin/admins` 或 `POST /api/auth/admin/admins`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 管理员用户名 |
| password | string | 是 | 管理员密码 |

#### 12.3 更新管理员
**接口地址**: `PUT /api/admin/admins/:id` 或 `PUT /api/auth/admin/admins/:id`
**需要认证**: 是

#### 12.4 删除管理员
**接口地址**: `DELETE /api/admin/admins/:id` 或 `DELETE /api/auth/admin/admins/:id`
**需要认证**: 是

#### 12.5 批量删除管理员
**接口地址**: `DELETE /api/admin/admins` 或 `DELETE /api/auth/admin/admins`
**需要认证**: 是

#### 12.6 修改管理员密码
**接口地址**: `PUT /api/auth/admin/admins/:id/password`
**需要认证**: 是（JWT）

#### 12.7 修改管理员状态
**接口地址**: `PUT /api/auth/admin/admins/:id/status`
**需要认证**: 是（JWT）

### 管理员接口使用示例

```bash
# 管理员登录
curl -X POST "http://localhost:3001/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# 获取用户列表
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# 获取管理员信息
curl -X GET "http://localhost:3001/api/auth/admin/me" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# 创建用户
curl -X POST "http://localhost:3001/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"user_id": "test_user", "nickname": "测试用户", "password": "123456"}'

# 删除笔记
curl -X DELETE "http://localhost:3001/api/admin/posts/1" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# 批量删除评论
curl -X DELETE "http://localhost:3001/api/admin/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"ids": [1, 2, 3]}'
```
