# 小石榴图文社区 API 接口文档

## 项目信息
- **项目名称**: 小石榴图文社区
- **版本**: v1.3.1
- **基础URL**: `http://localhost:3001`
- **数据库**: xiaoshiliu (MySQL)
- **更新时间**: 2026-2-20

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
| user_id | string | 是 | 用户ID（唯一，3-15位字母数字下划线） |
| nickname | string | 是 | 昵称（少于10位） |
| password | string | 是 | 密码（6-20位） |
| captchaId | string | 是 | 图形验证码ID |
| captchaText | string | 是 | 图形验证码内容 |
| email | string | 条件必填 | 邮箱地址（邮件功能启用时必填） |
| emailCode | string | 条件必填 | 邮箱验证码（邮件功能启用时必填） |
| avatar | string | 否 | 头像URL |
| bio | string | 否 | 个人简介 |
| location | string | 否 | 所在地（如不提供，系统将自动根据IP获取属地） |

**功能说明**:
- 系统会自动通过第三方API获取用户属地信息
- 如果用户手动提供了location参数，则优先使用用户提供的值
- 对于本地环境，location将显示为"本地"
- 系统不会存储用户的IP地址，仅获取属地信息用于显示
- 当邮件功能启用时（`EMAIL_ENABLED=true`），需要提供email和emailCode参数
- 当邮件功能禁用时（`EMAIL_ENABLED=false`），email和emailCode参数可选，注册时不需要邮箱验证

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
      "location": "北京",
      "verified": 0
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
      "like_count": 100,
      "verified": 0
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
    "verified": 0,
    "created_at": "2025-08-30T00:00:00.000Z",
    "ban": null
  }
}
```

**被封禁用户响应示例**:
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
    "verified": 0,
    "created_at": "2025-08-30T00:00:00.000Z",
    "ban": {
      "end_time": "2026-03-31 23:59:59",
      "reason": "违反社区规定",
      "created_at": "2026-02-20T10:00:00.000Z"
    }
  }
}
```

### 6. 发送邮箱验证码
**接口地址**: `POST /api/auth/send-email-code`

**说明**: 仅在邮件功能启用时可用（`EMAIL_ENABLED=true`）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址（调用此接口时必填） |

**响应示例**:
```json
{
  "code": 200,
  "message": "验证码发送成功"
}
```

**错误响应**（邮件功能未启用时）:
```json
{
  "code": 400,
  "message": "邮件功能未启用"
}
```

### 7. 获取邮件功能配置
**接口地址**: `GET /api/auth/email-config`

**说明**: 获取当前邮件功能是否启用，前端根据此配置决定是否显示邮箱相关字段

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "emailEnabled": true
  },
  "message": "success"
}
```

### 8. 绑定邮箱
**接口地址**: `POST /api/auth/bind-email`

**说明**: 为当前用户绑定邮箱，仅在邮件功能启用时可用

**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| emailCode | string | 是 | 邮箱验证码 |

**响应示例**:
```json
{
  "code": 200,
  "message": "邮箱绑定成功"
}
```

### 9. 解除邮箱绑定
**接口地址**: `DELETE /api/auth/unbind-email`

**说明**: 解除当前用户的邮箱绑定，仅在邮件功能启用时可用

**需要认证**: 是

**响应示例**:
```json
{
  "code": 200,
  "message": "邮箱解绑成功"
}
```

### 10. 发送找回密码验证码
**接口地址**: `POST /api/auth/send-reset-code`

**说明**: 发送找回密码用邮箱验证码，仅在邮件功能启用时可用

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 已绑定的邮箱地址 |

**响应示例**:
```json
{
  "code": 200,
  "message": "验证码发送成功，请查收邮箱",
  "data": {
    "user_id": "xiaoshiliu"
  }
}
```

### 11. 验证找回密码验证码
**接口地址**: `POST /api/auth/verify-reset-code`

**说明**: 验证找回密码验证码是否正确，仅在邮件功能启用时可用

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| emailCode | string | 是 | 邮箱验证码 |

**响应示例**:
```json
{
  "code": 200,
  "message": "验证码验证成功"
}
```

### 12. 重置密码
**接口地址**: `POST /api/auth/reset-password`

**说明**: 通过邮箱验证码重置密码，仅在邮件功能启用时可用

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| emailCode | string | 是 | 邮箱验证码 |
| newPassword | string | 是 | 新密码（6-20位） |

**响应示例**:
```json
{
  "code": 200,
  "message": "密码重置成功，请使用新密码登录"
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
        "verified": 0,
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
    "verified": 0,
    "created_at": "2025-08-30T00:00:00.000Z",
    "ban": null
  }
}
```

**被封禁用户响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 2,
    "user_id": "user_002",
    "nickname": "测试用户",
    "avatar": "https://example.com/avatar2.jpg",
    "bio": "测试用户简介",
    "location": "上海",
    "follow_count": 5,
    "fans_count": 8,
    "like_count": 20,
    "verified": 0,
    "created_at": "2025-08-31T00:00:00.000Z",
    "ban": {
      "end_time": "2026-03-31 23:59:59",
      "reason": "违反社区规定",
      "created_at": "2026-02-20T10:00:00.000Z"
    }
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
        "verified": 0,
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
        "verified": 0,
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
        "verified": 0,
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

### 10. 获取用户发布的笔记
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
        "category_id": 1,
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
          "avatar": "https://example.com/avatar.jpg",
          "verified": 0
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

### 11. 获取用户点赞的笔记
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
        "category_id": 2,
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
          "avatar": "https://example.com/avatar2.jpg",
          "verified": 0
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
        "verified": 0,
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

### 16. 提交认证申请
**接口地址**: `POST /api/users/verification`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | int | 是 | 认证类型：1-个人认证，2-企业认证 |
| real_name | string | 是 | 真实姓名/企业名称 |
| id_card | string | 是 | 身份证号/营业执照号 |
| id_card_front | string | 是 | 身份证正面/营业执照图片URL |
| id_card_back | string | 否 | 身份证背面图片URL（个人认证必填） |
| business_license | string | 否 | 营业执照图片URL（企业认证必填） |
| contact_phone | string | 否 | 联系电话 |
| contact_email | string | 否 | 联系邮箱 |
| description | string | 否 | 申请说明 |

**响应示例**:
```json
{
  "code": 200,
  "message": "认证申请提交成功，请等待审核",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "status": 0,
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 17. 获取认证申请状态
**接口地址**: `GET /api/users/verification`
**需要认证**: 是

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "real_name": "张三",
    "id_card": "110101199001011234",
    "id_card_front": "https://example.com/id_front.jpg",
    "id_card_back": "https://example.com/id_back.jpg",
    "contact_phone": "13800138000",
    "contact_email": "zhangsan@example.com",
    "description": "申请个人认证",
    "status": 0,
    "audit_time": null,
    "reject_reason": null,
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

**状态说明**:
- `0`: 待审核
- `1`: 已通过
- `2`: 已拒绝

### 18. 撤回认证申请
**接口地址**: `DELETE /api/users/verification`
**需要认证**: 是

**功能说明**:
- 可以撤回待审核、已通过或已拒绝的认证申请
- 撤回已通过的认证申请会同时取消用户的认证状态
- 撤回后可以重新提交认证申请

**响应示例**:
```json
{
  "code": 200,
  "message": "认证申请撤回成功"
}
```

---

## 分类管理接口

### 1. 获取分类列表
**接口地址**: `GET /api/categories`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sortField | string | 否 | 排序字段，可选值：id、name、created_at、post_count，默认id |
| sortOrder | string | 否 | 排序方式，可选值：asc、desc，默认asc |
| name | string | 否 | 按分类名称模糊搜索 |
| category_title | string | 否 | 按英文标题模糊搜索 |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "学习",
      "category_title": "study",
      "created_at": "2025-01-01T00:00:00.000Z",
      "post_count": 15
    },
    {
      "id": 2,
      "name": "校园",
      "category_title": "campus",
      "created_at": "2025-01-01T00:00:00.000Z",
      "post_count": 8
    },
    {
      "id": 3,
      "name": "情感",
      "category_title": "emotion",
      "created_at": "2025-01-01T00:00:00.000Z",
      "post_count": 23
    }
  ]
}
```

### 2. 获取分类列表（管理员）
**接口地址**: `GET /api/admin/categories`
**需要认证**: 是（管理员权限）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认10 |
| sortField | string | 否 | 排序字段，可选值：id、name、category_title、created_at、post_count，默认id |
| sortOrder | string | 否 | 排序方式，可选值：asc、desc，默认asc |
| name | string | 否 | 按分类名称模糊搜索 |
| category_title | string | 否 | 按英文标题模糊搜索 |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "学习",
      "category_title": "study",
      "created_at": "2025-01-01T00:00:00.000Z",
      "post_count": 15
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### 3. 获取单个分类（管理员）
**接口地址**: `GET /api/admin/categories/:id`
**需要认证**: 是（管理员权限）

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 分类ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "学习",
    "category_title": "study",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 4. 创建分类
**接口地址**: `POST /api/admin/categories`
**需要认证**: 是（管理员权限）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 |
| category_title | string | 是 | 英文标题，用于URL路由 |

**响应示例**:
```json
{
  "code": 200,
  "message": "分类创建成功",
  "data": {
    "id": 11,
    "name": "新分类",
    "category_title": "new_category",
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 5. 更新分类
**接口地址**: `PUT /api/admin/categories/:id`
**需要认证**: 是（管理员权限）

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 分类ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 分类名称 |
| category_title | string | 否 | 英文标题，用于URL路由 |

**响应示例**:
```json
{
  "code": 200,
  "message": "分类更新成功",
  "data": {
    "id": 1,
    "name": "更新后的分类名",
    "category_title": "updated_category",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 6. 删除分类
**接口地址**: `DELETE /api/admin/categories/:id`
**需要认证**: 是（管理员权限）

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 分类ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "分类删除成功"
}
```

### 7. 批量删除分类
**接口地址**: `DELETE /api/admin/categories`
**需要认证**: 是（管理员权限）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 分类ID数组 |

**请求示例**:
```json
{
  "ids": [1, 2, 3]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "成功删除3个分类",
  "data": {
    "deletedCount": 3
  }
}
```

**错误响应**:
- 400: 请求参数错误（无效的分类ID数组）
- 400: 部分分类下还有笔记，无法删除
- 404: 没有找到要删除的分类

---

## 笔记相关接口

### 1. 获取笔记列表
**接口地址**: `GET /api/posts`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| category | string | 否 | 分类ID筛选，支持"recommend"推荐频道 |
| is_draft | int | 否 | 是否获取草稿，1=草稿，0=已发布（默认） |
| user_id | int | 否 | 用户ID筛选（查看草稿时会强制为当前用户） |

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
        "category_id": 2,
        "view_count": 100,
        "like_count": 10,
        "comment_count": 5,
        "collect_count": 3,
        "created_at": "2025-08-30T00:00:00.000Z",
        "nickname": "小石榴",
        "user_avatar": "https://example.com/avatar.jpg",
        "verified": 0,
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
| title | string | 否* | 笔记标题（发布时必填，草稿时可选） |
| content | string | 否* | 笔记内容（发布时必填，草稿时可选） |
| category_id | int | 否 | 分类ID |
| type | int | 否 | 笔记类型：1-图文笔记（默认），2-视频笔记 |
| images | array | 否 | 图片URL数组（图文笔记使用） |
| video | object | 否 | 视频信息对象（视频笔记使用） |
| tags | array | 否 | 标签名称数组（字符串数组） |
| is_draft | boolean | 否 | 是否为草稿，默认false |

**video对象结构**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 视频文件URL |
| coverUrl | string | 否 | 视频封面图片URL |

**请求示例（图文笔记）**:
```json
{
  "title": "分享一个美好的下午",
  "content": "今天天气很好，在公园里散步...",
  "category_id": 5,
  "type": 1,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "tags": ["生活", "摄影", "分享"],
  "is_draft": false
}
```

**请求示例（视频笔记）**:
```json
{
  "title": "美丽的风景视频",
  "content": "记录下这美好的一刻...",
  "category_id": 5,
  "type": 2,
  "video": {
    "url": "https://video.example.com/video.mp4",
    "coverUrl": "https://img.example.com/video_cover.jpg"
  },
  "tags": ["生活", "视频", "分享"],
  "is_draft": false
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
| category_id | int | 否 | 分类ID筛选 |

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
          "avatar": "https://example.com/avatar.jpg",
          "verified": 0
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
| title | string | 否 | 笔记标题（发布时必填，草稿时可选） |
| content | string | 否 | 笔记内容（发布时必填，草稿时可选） |
| category_id | int | 否 | 分类ID（发布时必填，草稿时可选） |
| images | array | 否 | 图片URL数组（图文笔记使用） |
| video | object | 否 | 视频信息对象（视频笔记使用） |
| tags | array | 否 | 标签名称数组（字符串数组） |
| is_draft | int | 否 | 是否为草稿，1=草稿，0=发布（默认0） |

**video对象结构**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 视频文件URL |
| coverUrl | string | 否 | 视频封面图片URL |

**请求示例**:
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "category_id": 2,
  "images": [
    "https://example.com/new_image1.jpg"
  ],
  "tags": ["生活", "日常", "分享"],
  "is_draft": 0
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
**接口地址**: `GET /api/posts/:id/comments`
**需要认证**: 否（可选）

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| sort | string | 否 | 排序方式：desc（降序，默认）或 asc（升序） |

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
        "verified": 0,
        "user_auto_id": 1,
        "user_display_id": "user123",
        "post_id": 1,
        "parent_id": null,
        "created_at": "2025-08-30T00:00:00.000Z",
        "reply_count": 2,
        "liked": false
      },
      {
        "id": 2,
        "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@摄影爱好者</a>&nbsp;你的作品真的很棒！</p>",
        "user_id": 2,
        "nickname": "李四",
        "user_avatar": "https://img.example.com/avatar2.jpg",
        "verified": 0,
        "user_auto_id": 2,
        "user_display_id": "user456",
        "post_id": 1,
        "parent_id": null,
        "created_at": "2025-08-30T01:00:00.000Z",
        "reply_count": 0,
        "liked": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
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
**接口地址**: `POST /api/posts/:id/comments`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 笔记ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 评论内容（支持@功能的HTML格式） |
| parent_id | int | 否 | 父评论ID（回复评论时使用） |

**@功能说明**:
- 评论内容支持@用户功能
- @用户的HTML格式：`<a href="/user/{user_id}" data-user-id="{user_id}" class="mention-link" contenteditable="false">@{nickname}</a>`
- 系统会自动解析@用户标签并发送通知给被@的用户
- 支持在一条评论中@多个用户

**请求示例**:
```json
{
  "content": "这是一条普通评论",
  "parent_id": null
}
```

**包含@用户的请求示例**:
```json
{
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
        "verified": 0,
        "parent_id": 1,
        "created_at": "2025-08-30T01:00:00.000Z",
        "liked": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
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

### 通知类型说明
通知系统支持以下类型：
- **1**: 点赞笔记
- **2**: 点赞评论
- **3**: 收藏笔记
- **4**: 评论笔记
- **5**: 回复评论
- **6**: 关注用户
- **7**: 评论提及（在评论中@用户）
- **8**: 笔记提及（在笔记中@用户）

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
        "sender_verified": 0,
        "post_id": 1,
        "post_title": "笔记标题",
        "post_author_id": "author_001",
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
        "sender_verified": 0,
        "target_type": "post",
        "post_id": 1,
        "post_title": "笔记标题",
        "post_author_id": "author_001",
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
        "sender_verified": 0,
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
        "sender_verified": 0,
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
        "sender_verified": 0,
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

## 图片上传接口

### 1. 单图片上传
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
  "message": "图片上传成功",
  "data": {
    "originalname": "image.jpg",
    "size": 1024000,
    "url": "https://img.example.com/1640995200000_image.jpg"
  }
}
```

### 2. 多图片上传
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

### 3. 单视频上传
**接口地址**: `POST /api/upload/video`
**需要认证**: 是

**请求参数**:
- 使用 `multipart/form-data` 格式
- 文件字段名: `file`
- 支持格式: mp4, avi, mov, wmv, flv, webm
- 文件大小限制: 100MB

**响应示例**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "originalname": "video.mp4",
    "size": 10240000,
    "url": "https://video.example.com/1640995200000_video.mp4",
    "filePath": "/uploads/videos/1640995200000_video.mp4",
    "coverUrl": "https://img.example.com/1640995200000_video_thumbnail.jpg"
  }
}
```

**说明**:
- `url`: 视频文件的访问URL
- `filePath`: 视频文件在服务器上的存储路径
- `coverUrl`: 视频封面图片URL（如果FFmpeg可用则自动生成，否则为null）
- 视频封面图片会自动从视频第一帧提取，尺寸为640x360
- 如果系统未安装FFmpeg，视频仍可正常上传，但不会生成封面图片



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

## 标签相关接口

### 1. 获取所有标签
**接口地址**: `GET /api/tags`
**需要认证**: 否

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "摄影",
      "description": "摄影相关内容",
      "use_count": 150,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

### 2. 获取热门标签
**接口地址**: `GET /api/tags/hot`
**需要认证**: 否

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | int | 否 | 返回数量，默认10 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "摄影",
      "description": "摄影相关内容",
      "use_count": 150,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

---

## 统计相关接口

### 1. 获取系统统计信息
**接口地址**: `GET /api/stats`
**需要认证**: 否

**响应示例**:
```json
{
  "code": 200,
  "message": "获取统计信息成功",
  "data": {
    "users": 1250,
    "posts": 3420,
    "comments": 8750,
    "likes": 15600
  }
}
```

---

## 健康检查接口

### 1. 健康检查
**接口地址**: `GET /api/health`
**需要认证**: 否

**响应示例**:
```json
{
  "code": 200,
  "message": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## 搜索相关接口

### 1. 通用搜索
**接口地址**: `GET /api/search`
**需要认证**: 否（可选）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词（支持搜索小石榴号、昵称、标题、正文内容、标签名称） |
| tag | string | 否 | 标签搜索（精确匹配标签名称） |
| type | string | 否 | 搜索类型：all（默认，所有类型）、posts（图文笔记）、videos（视频笔记）、users（用户） |
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
          "verified": 0,
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
    "password": "123456"
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
    "category_id": 1
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
      password: '123456'
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
      category_id: 1
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
4. **图片上传**: 图片上传接口使用`multipart/form-data`格式，支持jpg、jpeg、png、gif、webp格式，单图片最大5MB
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

### 15. 管理员刷新令牌
**接口地址**: `POST /api/auth/admin/refresh`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 管理员刷新令牌 |

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

### 3. 用户管理

#### 3.1 获取用户列表
**接口地址**: `GET /api/admin/users`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| user_display_id | string | 否 | 小石榴号搜索 |
| nickname | string | 否 | 昵称搜索 |
| status | int | 否 | 状态筛选（1=活跃，0=禁用） |
| ban_status | string | 否 | 封禁状态筛选（normal=正常，banned=封禁） |
| sortField | string | 否 | 排序字段（id, fans_count, like_count, created_at） |
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

#### 3.6 封禁用户
**接口地址**: `POST /api/admin/users/:id/ban`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 封禁原因 |
| end_time | string | 否 | 封禁结束时间（格式：YYYY-MM-DD HH:MM:SS，留空为永久封禁） |

**请求示例**:
```json
{
  "reason": "发布违规内容",
  "end_time": "2026-03-31 23:59:59"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "用户封禁成功"
}
```

**功能说明**:
- 封禁用户会自动设置用户的 is_active 为 0，禁止用户登录
- 封禁记录会保存到 user_ban 表
- 如果指定了 end_time，系统会在到期时自动解封并恢复 is_active
- 如果不指定 end_time，则为永久封禁

#### 3.7 解封用户
**接口地址**: `POST /api/admin/users/:id/unban`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 用户ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "用户解封成功"
}
```

**功能说明**:
- 解封用户会自动恢复用户的 is_active 为 1，允许用户登录
- 所有活跃的封禁记录状态会更新为"管理员解封"
- 会显示封禁的详细信息（原因、结束时间、创建时间）

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
| user_display_id | string | 否 | 作者小石榴号筛选 |
| category_id | int | 否 | 分类ID筛选 |
| sortField | string | 否 | 排序字段（id, view_count, like_count, collect_count, comment_count, created_at） |
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
| user_display_id | string | 否 | 评论者小石榴号筛选 |
| post_id | int | 否 | 笔记ID筛选 |
| sortField | string | 否 | 排序字段（id, like_count, created_at） |
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
| sortField | string | 否 | 排序字段（id, use_count, created_at） |
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

### 7. 认证审核管理

#### 7.1 获取认证申请列表
**接口地址**: `GET /api/admin/audit`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| type | int | 否 | 认证类型筛选（1-个人认证，2-企业认证） |
| status | int | 否 | 审核状态筛选（0-待审核，1-已通过，2-已拒绝） |
| user_display_id | string | 否 | 用户小石榴号搜索 |
| real_name | string | 否 | 真实姓名搜索 |
| sortField | string | 否 | 排序字段（id, created_at, audit_time） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "audits": [
      {
        "id": 1,
        "user_id": 1,
        "type": 1,
        "real_name": "张三",
        "id_card": "110101199001011234",
        "id_card_front": "https://example.com/id_front.jpg",
        "id_card_back": "https://example.com/id_back.jpg",
        "contact_phone": "13800138000",
        "contact_email": "zhangsan@example.com",
        "description": "申请个人认证",
        "status": 0,
        "audit_time": null,
        "reject_reason": null,
        "created_at": "2025-01-02T00:00:00.000Z",
        "user": {
          "id": 1,
          "user_id": "user_001",
          "nickname": "张三",
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

#### 7.2 获取认证申请详情
**接口地址**: `GET /api/admin/audit/:id`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 认证申请ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "real_name": "张三",
    "id_card": "110101199001011234",
    "id_card_front": "https://example.com/id_front.jpg",
    "id_card_back": "https://example.com/id_back.jpg",
    "contact_phone": "13800138000",
    "contact_email": "zhangsan@example.com",
    "description": "申请个人认证",
    "status": 0,
    "audit_time": null,
    "reject_reason": null,
    "created_at": "2025-01-02T00:00:00.000Z",
    "user": {
      "id": 1,
      "user_id": "user_001",
      "nickname": "张三",
      "avatar": "https://example.com/avatar.jpg",
      "verified": 0
    }
  }
}
```

#### 7.3 审核认证申请（通过）
**接口地址**: `PUT /api/admin/audit/:id/approve`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 认证申请ID |

**功能说明**:
- 审核通过后，用户的认证状态会自动更新为已认证
- 系统会记录审核时间

**响应示例**:
```json
{
  "code": 200,
  "message": "认证申请审核通过"
}
```

#### 7.4 审核认证申请（拒绝）
**接口地址**: `PUT /api/admin/audit/:id/reject`
**需要认证**: 是

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 认证申请ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reject_reason | string | 是 | 拒绝原因 |

**功能说明**:
- 审核拒绝后，用户可以查看拒绝原因
- 用户可以撤回申请后重新提交

**响应示例**:
```json
{
  "code": 200,
  "message": "认证申请已拒绝"
}
```

### 8. 点赞管理

#### 8.1 获取点赞列表
**接口地址**: `GET /api/admin/likes`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| user_display_id | string | 否 | 用户小石榴号筛选 |
| target_type | int | 否 | 目标类型（1=笔记，2=评论） |
| sortField | string | 否 | 排序字段（id, user_id, created_at） |
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
| user_display_id | string | 否 | 用户小石榴号筛选 |
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
| user_display_id | string | 否 | 用户小石榴号筛选 |
| sortField | string | 否 | 排序字段（id, follower_id, following_id, created_at） |
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
| user_display_id | string | 否 | 用户小石榴号筛选 |
| type | string | 否 | 通知类型筛选 |
| is_read | int | 否 | 已读状态（0=未读，1=已读） |
| sortField | string | 否 | 排序字段（id, created_at） |
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
| user_display_id | string | 否 | 用户小石榴号筛选 |
| is_active | int | 否 | 活跃状态（0=非活跃，1=活跃） |
| sortField | string | 否 | 排序字段（id, is_active, expires_at, created_at） |
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
| sortField | string | 否 | 排序字段（username, created_at） |
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

### 13. 监控管理

#### 13.1 获取系统活动监控
**接口地址**: `GET /api/admin/monitor/activities`
**需要认证**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认20 |
| date_from | string | 否 | 开始日期（YYYY-MM-DD） |
| date_to | string | 否 | 结束日期（YYYY-MM-DD） |
| activity_type | string | 否 | 活动类型筛选 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "activities": [
      {
        "date": "2025-01-15",
        "new_users": 25,
        "new_posts": 120,
        "new_comments": 350,
        "new_likes": 890
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "pages": 2
    }
  }
}
```

### 管理员接口使用示例

```bash
# 管理员登录
curl -X POST "http://localhost:3001/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'

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
