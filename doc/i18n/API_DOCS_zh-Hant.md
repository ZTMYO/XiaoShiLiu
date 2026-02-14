# 小石榴圖文社區 API 接口文檔

## 專案資訊
- **專案名稱**: 小石榴圖文社區
- **版本**: v1.3.1
- **基礎URL**: `http://localhost:3001`
- **數據庫**: xiaoshiliu (MySQL)
- **更新時間**: 2025-09-13

## 通用說明

### 响應格式
所有API接口統一返回JSON格式，結構如下：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 狀態碼說明
- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权，需要登录
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

### 認證說明
需要認證的接口需要在請求頭中攜帶JWT token：
```
Authorization: Bearer <your_jwt_token>
```

### 分頁參數
支持分頁的接口通用參數：
- `page`: 頁碼，默認為1
- `limit`: 每頁數量，默認為20

---

## 認證相關接口

### 1. 用戶註冊
**接口地址**: `POST /api/auth/register`

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| user_id | string | 是 | 用戶ID（唯一，3-15位字母數字下劃線） |
| nickname | string | 是 | 昵稱（少於10位） |
| password | string | 是 | 密碼（6-20位） |
| captchaId | string | 是 | 圖形驗證碼ID |
| captchaText | string | 是 | 圖形驗證碼內容 |
| email | string | 條件必填 | 郵箱地址（郵件功能啟用時必填） |
| emailCode | string | 條件必填 | 郵箱驗證碼（郵件功能啟用時必填） |
| avatar | string | 否 | 頭像URL |
| bio | string | 否 | 個人簡介 |
| location | string | 否 | 所在地（如不提供，系統將自動根據IP獲取屬地） |

**功能說明**:
- 系統會自動通過第三方API獲取用戶屬地信息
- 如果用戶手動提供了location參數，則優先使用用戶提供的值
- 對於本地環境，location將顯示為"本地"
- 系統不會儲存用戶的IP地址，僅獲取屬地信息用於顯示
- 當郵件功能啟用時（`EMAIL_ENABLED=true`），需要提供email和emailCode參數
- 當郵件功能禁用時（`EMAIL_ENABLED=false`），email和emailCode參數可選，註冊時不需要郵箱驗證

**響應範例**:
```json
{
  "code": 200,
  "message": "註冊成功",
  "data": {
    "user": {
      "id": 1,
      "user_id": "user_001",
      "nickname": "小石榴",
      "avatar": "https://example.com/avatar.jpg",
      "bio": "这是個人簡介",
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

### 2. 用戶登錄
**接口地址**: `POST /api/auth/login`

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| user_id | string | 是 | 小石榴號 |
| password | string | 是 | 密碼 |

**響應範例**:
```json
{
  "code": 200,
  "message": "登錄成功",
  "data": {
    "user": {
      "id": 1,
      "user_id": "xiaoshiliu123",
      "nickname": "小石榴用户",
      "avatar": "http://example.com/avatar.jpg",
      "bio": "這是我的個人簡介",
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

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| refresh_token | 字串 | 是 | 刷新令牌 |

**回應範例**:
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

### 4. 退出登錄
**接口地址**: `POST /api/auth/logout`
**需要認證**: 是

**回應範例**:
```json
{
  "code": 200,
  "message": "退出成功"
}
```

### 5. 取得當前用戶信息
**接口地址**: `GET /api/auth/me`
**需要認證**: 是

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "小石榴",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "這是個人簡介",
    "location": "北京",
    "follow_count": 10,
    "fans_count": 20,
    "like_count": 100,
    "is_active": 1,
    "verified": 0,
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

### 6. 發送郵箱驗證碼
**接口地址**: `POST /api/auth/send-email-code`

**說明**: 僅在郵件功能啟用時可用（`EMAIL_ENABLED=true`）

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 郵箱地址（調用此接口時必填） |

**回應範例**:
```json
{
  "code": 200,
  "message": "驗證碼發送成功"
}
```

**錯誤回應**（郵件功能未啟用時）:
```json
{
  "code": 400,
  "message": "郵件功能未啟用"
}
```

### 7. 獲取郵件功能配置
**接口地址**: `GET /api/auth/email-config`

**說明**: 獲取當前郵件功能是否啟用，前端根據此配置決定是否顯示郵箱相關字段

**回應範例**:
```json
{
  "code": 200,
  "data": {
    "emailEnabled": true
  },
  "message": "success"
}
```

### 8. 綁定郵箱
**接口地址**: `POST /api/auth/bind-email`

**說明**: 為當前用戶綁定郵箱，僅在郵件功能啟用時可用

**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 郵箱地址 |
| emailCode | string | 是 | 郵箱驗證碼 |

**回應範例**:
```json
{
  "code": 200,
  "message": "郵箱綁定成功"
}
```

### 9. 解除郵箱綁定
**接口地址**: `DELETE /api/auth/unbind-email`

**說明**: 解除當前用戶的郵箱綁定，僅在郵件功能啟用時可用

**需要認證**: 是

**回應範例**:
```json
{
  "code": 200,
  "message": "郵箱解綁成功"
}
```

### 10. 發送找回密碼驗證碼
**接口地址**: `POST /api/auth/send-reset-code`

**說明**: 發送找回密碼用郵箱驗證碼，僅在郵件功能啟用時可用

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 已綁定的郵箱地址 |

**回應範例**:
```json
{
  "code": 200,
  "message": "驗證碼發送成功，請查收郵箱",
  "data": {
    "user_id": "xiaoshiliu"
  }
}
```

### 11. 驗證找回密碼驗證碼
**接口地址**: `POST /api/auth/verify-reset-code`

**說明**: 驗證找回密碼驗證碼是否正確，僅在郵件功能啟用時可用

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 郵箱地址 |
| emailCode | string | 是 | 郵箱驗證碼 |

**回應範例**:
```json
{
  "code": 200,
  "message": "驗證碼驗證成功"
}
```

### 12. 重置密碼
**接口地址**: `POST /api/auth/reset-password`

**說明**: 通過郵箱驗證碼重置密碼，僅在郵件功能啟用時可用

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 郵箱地址 |
| emailCode | string | 是 | 郵箱驗證碼 |
| newPassword | string | 是 | 新密碼（6-20位） |

**回應範例**:
```json
{
  "code": 200,
  "message": "密碼重置成功，請使用新密碼登錄"
}
```

---

## 用戶相關接口

### 1. 取得用戶列表
**接口地址**: `GET /api/users`

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | 整數 | 否 | 頁碼，默認1 |
| limit | 整數 | 否 | 每頁數量，默認20 |

**回應範例**:
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
        "bio": "這是個人簡介",
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

### 2. 取得用戶詳情
**接口地址**: `GET /api/users/:id`

**路徑參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | 整數 | 是 | 用戶ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "小石榴",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "這是個人簡介",
    "location": "北京",
    "follow_count": 10,
    "fans_count": 20,
    "like_count": 100,
    "verified": 0,
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

### 3. 取得用戶收藏列表
**接口地址**: `GET /api/users/:id/collections`

**路徑參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | 整數 | 是 | 用戶ID |

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | 整數 | 否 | 頁碼，默認1 |
| limit | 整數 | 否 | 每頁數量，默認20 |

### 4. 关注用戶
**接口地址**: `POST /api/users/:id/follow`
**需要認證**: 是

**路徑參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 被關注用戶ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "關注成功"
}
```

### 5. 取消關注用戶
**接口地址**: `DELETE /api/users/:id/follow`
**需要認證**: 是

**路徑參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 被關注用戶ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "取消關注成功"
}
```

### 6. 取得關注清單
**接口地址**: `GET /api/users/:id/following`

**路徑參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 用戶ID |

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "following": [
      {
        "id": 2,
        "user_id": "user_002",
        "nickname": "用戶2",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "個人簡介",
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

### 7. 取得粉絲清單
**接口地址**: `GET /api/users/:id/followers`

**路徑參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 用戶ID |

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "followers": [
      {
        "id": 3,
        "user_id": "user_003",
        "nickname": "用戶3",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "個人簡介",
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

### 8. 搜尋用戶
**接口地址**: `GET /api/users/search`

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| keyword | string | 是 | 搜尋關鍵詞（支持昵稱和小石榴號搜尋） |
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |

**回應範例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "likes": [
      {
        "id": 1,
        "post_id": 1,
        "user": {
          "id": 1,
          "user_id": "user_001",
          "nickname": "小石榴",
          "avatar": "https://example.com/avatar.jpg",
          "verified": 0
        },
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

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 2,
      "標題": "精彩的瞬間",
      "內容": "記錄生活中的美好",
      "圖片": ["https://example.com/image2.jpg"],
      "分類ID": 2,
      "標籤": ["生活", "記錄"],
      "喜歡數": 15,
      "評論數": 8,
      "收藏數": 5,
      "查看數": 150,
      "是否喜歡": true,
      "是否收藏": false,
      "喜歡時間": "2025-01-02T00:00:00.000Z",
      "創建時間": "2025-08-30T00:00:00.000Z",
      "用戶": {
        "id": 2,
        "用戶ID": "user_002",
        "暱稱": "用戶2",
        "頭像": "https://example.com/avatar2.jpg",
        "驗證": 0
      }
    }
  ],
  "分頁": {
    "頁碼": 1,
    "限制": 20,
    "總數": 3,
    "頁數": 1
  }
}
```

### 12. 查詢關注狀態
**接口地址**: `GET /api/users/:id/follow-status`
**需要認證**: 是

**路徑參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 目標用戶ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "isFollowing": true,
    "isMutual": false,
    "buttonType": "unfollow"
  }
}
```

### 13. 查詢互關列表
**接口地址**: `GET /api/users/:id/mutual-follows`

**路徑參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 用戶ID |

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| 頁碼 | int | 否 | 頁碼，預設1 |
| 每頁數量 | int | 否 | 每頁數量，預設20 |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "mutualFollows": [
      {
        "id": 3,
        "user_id": "user_003",
        "nickname": "用戶3",
        "avatar": "https://example.com/avatar3.jpg",
        "個人簡介": "個人簡介",
        "關注數": 8,
        "粉絲數": 15,
        "驗證": 0,
        "關注時間": "2025-08-30T00:00:00.000Z"
      }
    ],
    "分頁": {
      "頁碼": 1,
      "限制": 20,
      "總數": 5,
      "頁數": 1
    }
  }
}
```

### 14. 查詢用戶統計資訊
**接口地址**: `GET /api/users/:id/stats`

**路徑參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 用戶ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
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

### 15. 更新用戶資訊
**接口地址**: `PUT /api/users/:id`
**需要認證**: 是

**路徑參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 用戶ID |

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| nickname | 字串 | 否 | 昵稱 |
| avatar | 字串 | 否 | 头像URL |
| bio | 字串 | 否 | 個人簡介 |
| location | 字串 | 否 | 所在地 |

**回應範例**:
```json
{
  "code": 200,
  "message": "用戶信息更新成功",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "新昵稱",
    "avatar": "https://example.com/new_avatar.jpg",
    "bio": "新的個人情簡介",
    "location": "上海",
    "updated_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 16. 提交認證申請
**接口地址**: `POST /api/users/verification`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| type | 整數 | 是 | 認證類型：1-個人認證，2-企業認證 |
| real_name | 字串 | 是 | 真實姓名/企業名稱 |
| id_card | 字串 | 是 | 身份证號/營業執照號 |
| id_card_front | 字串 | 是 | 身份证正面/營業執照圖片URL |
| id_card_back | 字串 | 否 | 身份证背面圖片URL（個人認證必填） |
| business_license | 字串 | 否 | 營業執照圖片URL（企業認證必填） |
| contact_phone | 字串 | 是 | 聯繫電話 |
| contact_email | 字串 | 是 | 聯繫郵箱 |
| description | 字串 | 否 | 申請說明 |

**回應範例**:
```json
{
  "code": 200,
  "message": "認證申請提交成功，請等待審核",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "status": 0,
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 17. 获取認證申請狀態
**接口地址**: `GET /api/users/verification`
**需要認證**: 是

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "real_name": "張三",
    "id_card": "110101199001011234",
    "id_card_front": "https://example.com/id_front.jpg",
    "id_card_back": "https://example.com/id_back.jpg",
    "contact_phone": "13800138000",
    "contact_email": "zhangsan@example.com",
    "description": "申請個人認證",
    "status": 0,
    "audit_time": null,
    "reject_reason": null,
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

**狀態說明**:
- `0`: 待審核
- `1`: 已通過
- `2`: 已拒絕

### 18. 撤回認證申請
**接口地址**: `DELETE /api/users/verification`
**需要認證**: 是

**功能說明**:
- 可以撤回待審核、已通過或已拒絕的認證申請
- 撤回已通過的認證申請會同時取消用戶的認證狀態
- 撤回後可以重新提交認證申請

**回應範例**:
```json
{
  "code": 200,
  "message": "認證申請撤回成功"
}
```

---

## 分類管理接口

### 1. 获取分类列表
**接口地址**: `GET /api/categories`

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| sortField | 字串 | 否 | 排序字段，可選值：id、name、created_at、post_count，預設id |
| sortOrder | 字串 | 否 | 排序方式，可選值：asc、desc，預設asc |
| name | 字串 | 否 | 按分類名稱模糊搜尋 |
| category_title | 字串 | 否 | 按英文標題模糊搜尋 |

**回應範例**:
```json
{
  "code": 200,
  "message": "取得成功",
  "data": [
    {
      "id": 1,
      "name": "學習",
      "category_title": "study",
      "created_at": "2025-01-01T00:00:00.000Z",
      "post_count": 15
    },
    {
      "id": 2,
      "name": "校園",
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

### 2. 取得分類列表（管理員）
**接口地址**: `GET /api/admin/categories`
**需要認證**: 是（管理員權限）

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| page | 整數 | 否 | 頁碼，預設1 |
| limit | 整數 | 否 | 每頁數量，預設10 |
| sortField | 字串 | 否 | 排序字段，可選值：id、name、category_title、created_at、post_count，預設id |
| sortOrder | 字串 | 否 | 排序方式，可選值：asc、desc，預設asc |
| name | 字串 | 否 | 按分類名稱模糊搜尋 |
| category_title | 字串 | 否 | 按英文標題模糊搜尋 |

**回應範例**:
```json
{
  "code": 200,
  "message": "取得成功",
  "data": [
    {
      "id": 1,
      "name": "學習",
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

### 3. 取得單個分類（管理員）
**接口地址**: `GET /api/admin/categories/:id`
**需要認證**: 是（管理員權限）

**路徑參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| id | 整數 | 是 | 分類ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "取得成功",
  "data": {
    "id": 1,
    "name": "學習",
    "category_title": "study",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 4. 創建分類
**接口地址**: `POST /api/admin/categories`
**需要認證**: 是（管理員權限）

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| name | 字串 | 是 | 分類名稱 |
| category_title | 字串 | 是 | 英文標題，用於URL路由 |

**回應範例**:
```json
{
  "code": 200,
  "message": "分類創建成功",
  "data": {
    "id": 11,
    "name": "新分類",
    "category_title": "new_category",
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 5. 更新分類
**接口地址**: `PUT /api/admin/categories/:id`
**需要認證**: 是（管理員權限）

**路徑參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 分類ID |

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| name | string | 否 | 分類名稱 |
| category_title | string | 否 | 英文標題，用於URL路由 |

**回應範例**:
```json
{
  "code": 200,
  "message": "分類更新成功",
  "data": {
    "id": 1,
    "name": "更新後的分類名",
    "category_title": "updated_category",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 6. 刪除分類
**接口地址**: `DELETE /api/admin/categories/:id`
**需要認證**: 是（管理員權限）

**路徑參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 分類ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "分類刪除成功"
}
```

### 7. 批量刪除分類
**接口地址**: `DELETE /api/admin/categories`
**需要認證**: 是（管理員權限）

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| ids | array | 是 | 分類ID陣列 |

**請求範例**:
```json
{
  "ids": [1, 2, 3]
}
```

**回應範例**:
```json
{
  "code": 200,
  "message": "成功刪除3個分類",
  "data": {
    "deletedCount": 3
  }
}
```

**錯誤回應**:
- 400: 請求參數錯誤（無效的分類ID陣列）
- 400: 部分分類下還有筆記，無法刪除
- 404: 未找到要刪除的分類

---

## 筆記相關接口

### 1. 獲取筆記清單
**接口地址**: `GET /api/posts`

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，預設1 |
| limit | int | 否 | 每頁數量，預設20 |
| category | string | 否 | 分類ID過濾，支持"recommend"推薦頻道 |
| is_draft | int | 否 | 是否獲取草稿，1=草稿，0=已發布（預設） |
| user_id | int | 否 | 用戶ID過濾（查看草稿時會強制為當前用戶） |

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "user_id": 1,
        "title": "筆記標題",
        "content": "筆記內容",
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
            "name": "標籤名"
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

### 2. 獲取筆記詳情
**接口地址**: `GET /api/posts/:id`

**路徑參數**:
| 參數 | 過類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 笔記ID |

**說明**: 存取筆記詳情會自動增加瀏覽量

### 3. 創建筆記
**接口地址**: `POST /api/posts`
**需要認證**: 是

**請求參數**:
| 參數 | 過類型 | 必填 | 說明 |
|------|------|------|------|
| title | string | 否* | 笔記標題（發佈時必填，草稿時選擇） |
| content | string | 否* | 笔記內容（發佈時必填，草稿時選擇） |
| category_id | int | 否 | 分類ID |
| images | array | 否 | 圖片URL陣列 |
| tags | array | 否 | 標籤名稱陣列（字串陣列） |
| is_draft | boolean | 否 | 是否為草稿，默認false |

**請求範例**:
```json
{
  "title": "分享一個美好的下午",
  "content": "今天天氣很好，在公園裡散步...",
  "category_id": 5,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "tags": ["生活", "攝影", "分享"],
  "is_draft": false
}
```

### 4. 取得筆記評論
**接口地址**: `GET /api/posts/:id/comments`

**路徑參數**:
| 參數 | 過類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 笔記ID |

**請求參數**:
| 參數 | 過類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |

### 5. 收藏筆記
**接口地址**: `POST /api/posts/:id/collect`
**需要認證**: 是

**路徑參數**:
| 參數 | 過類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 笔記ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "收藏成功"
}
```

### 6. 搜尋筆記
**接口地址**: `GET /api/posts/search`

**請求參數**:
| 參數 | 過類型 | 必填 | 說明 |
|------|------|------|------|
| keyword | string | 是 | 搜尋關鍵詞（支持標題和內容搜尋） |
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| category_id | int | 否 | 分類ID過濾 |

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "美麗的風景",
        "content": "今天拍到了很美的風景",
        "images": ["https://example.com/image1.jpg"],
        "category": "photography",
        "tags": ["風景", "攝影"],
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

### 7. 更新筆記
**接口地址**: `PUT /api/posts/:id`
**需要認證**: 是

**路径參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 笔記ID |

---
### 8. 刪除筆記
**接口地址**: `DELETE /api/posts/:id`
**需要驗證**: 是

**路径參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 筆記ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "筆記刪除成功"
}
```

---
### 9. 取消收藏筆記
**接口地址**: `DELETE /api/posts/:id/collect`
**需要驗證**: 是

**路径參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 筆記ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "取消收藏成功"
}
```

---
### 10. 获取草稿列表
**接口地址**: `GET /api/posts/drafts`
**需要驗證**: 是

**请求参数**:
| 参数 | 类型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| keyword | string | 否 | 搜索關鍵詞 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "drafts": [
      {
        "id": 1,
        "title": "草稿標題",
        "content": "草稿內容",
        "category": "生活",
        "images": ["image1.jpg", "image2.jpg"],
        "tags": ["標籤1", "標籤2"],
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
### 4. 刪除評論
**接口地址**: `DELETE /api/comments/:id`
**需要驗證**: 是

**路径參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 評論ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "評論刪除成功"
}
```

---
### 4. 获取筆記評論
**接口地址**: `GET /api/posts/:id/comments`

**路徑參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 記錄ID |

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，預設1 |
| limit | int | 否 | 每頁數量，預設20 |

---

## 評論相關介面

### 1. 取得評論清單
**介面地址**: `GET /api/posts/:id/comments`
**需要認證**: 否（選擇性）

**路徑參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 記錄ID |

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，預設1 |
| limit | int | 否 | 每頁數量，預設20 |
| sort | string | 否 | 排序方式：desc（降序，預設）或 asc（升序） |

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "這是一條普通評論",
        "user_id": 1,
        "nickname": "張三",
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
        "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@攝影愛好者</a>&nbsp;你的作品真的很棒！</p>",
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

**說明**:
- `content` 欄位可能包含HTML格式的@用戶標籤
- 前端需要正確渲染HTML內容以顯示@用戶連結
- @用戶連結包含 `href`、`data-user-id`、`class` 等屬性用於前端處理
```

### 2. 創建評論
**介面地址**: `POST /api/posts/:id/comments`
**需要認證**: 是

**路徑參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 記錄ID |

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| content | string | 是 | 評論內容（支持@功能的HTML格式） |
| parent_id | int | 否 | 父評論ID（回覆評論時使用） |

**@功能說明**:
- 評論內容支持@用戶功能
- @用戶的HTML格式：`<a href="/user/{user_id}" data-user-id="{user_id}" class="mention-link" contenteditable="false">@{nickname}</a>`
- 系統會自動解析@用戶標籤並發送通知給被@的用戶
- 支持在一条評論中@多個用戶

**請求範例**:
```

```json
{
  "content": "这是一条普通评论",
  "parent_id": null
}
```

**包含@用户的請求示例**:
```json
{
  "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@攝影愛好者</a>&nbsp;你的作品真的很棒！</p>",
  "parent_id": null
}
```

**響應示例**:
```json
{
  "code": 200,
  "message": "評論創建成功",
  "data": {
    "id": 1,
    "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@攝影愛好者</a>&nbsp;你的作品真的很棒！</p>",
    "user_id": 1,
    "parent_id": null,
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

**@功能處理說明**:
- 當評論包含@用戶標籤時，系統會自動：
  1. 解析HTML中的`data-user-id`屬性獲取被@用戶的ID
  2. 驗證被@用戶是否存在
  3. 向被@用戶發送mention類型的通知
  4. 不會向自己發送@通知

### 3. 获取評論回覆
**接口地址**: `GET /api/comments/:id/replies`
**需要認證**: 否（選擇）

**路徑參數**:
| 參數 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 評論ID |

**請求參數**:
| 參數 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認10 |

**響應示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "replies": [
      {
        "id": 2,
        "content": "這是一條回复",
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

### 4. 刪除評論
**接口地址**: `DELETE /api/comments/:id`
**需要認證**: 是

**路徑參數**:
| 參數 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 評論ID |

**響應示例**:
```json
{
  "code": 200,
  "message": "評論刪除成功"
}
```

---

## 訊息相關接口

### 訊息類型說明
訊息系統支援以下類型：
- **1**: 赞好筆記
- **2**: 赞好評論
- **3**: 收藏筆記
- **4**: 評論筆記
- **5**: 回覆評論
- **6**: 关注用戶
- **7**: 評論提及（在評論中@用戶）
- **8**: 筆記提及（在筆記中@用戶）

### 1. 获取評論訊息
**接口地址**: `GET /api/notifications/comments`
**需要認證**: 是

**請求參數**:
| 參數 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |

**響應示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": 1,
        "user_id": 2,
        "nickname": "王五",
        "content": "你發佈的筆記被贊了",
        "created_at": "2025-08-30T00:00:00.000Z"
      },
      {
        "id": 2,
        "type": 2,
        "user_id": 3,
        "nickname": "趙六",
        "content": "你的評論被贊了",
        "created_at": "2025-08-30T01:00:00.000Z"
      }
    ]
  }
}
```

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "通知": [
      {
        "識別碼": 1,
        "類型": "評論",
        "發送者識別碼": 2,
        "發送者別名": "用戶2",
        "發送者頭像": "https://example.com/avatar2.jpg",
        "發送者驗證": 0,
        "貼文識別碼": 1,
        "貼文標題": "筆記標題",
        "評論內容": "評論內容",
        "是否已讀": 0,
        "創建時間": "2025-08-30T00:00:00.000Z"
      }
    ],
    "分頁": {
      "頁數": 1,
      "每頁限制": 20,
      "總數": 10,
      "頁數總數": 1
    }
  }
}
```

### 2. 取得讚同通知
**接口地址**: `GET /api/notifications/likes`
**需要認證**: 是

**請求參數**:
| 參數 | 種類 | 必填 | 說明 |
|------|------|------|------|
| 頁數 | int | 否 | 頁碼，默認1 |
| 每頁數量 | int | 否 | 每頁數量，默認20 |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "通知": [
      {
        "識別碼": 2,
        "類型": "讚同",
        "發送者識別碼": 3,
        "發送者別名": "用戶3",
        "發送者頭像": "https://example.com/avatar3.jpg",
        "發送者驗證": 0,
        "目標類型": "貼文",
        "貼文識別碼": 1,
        "貼文標題": "筆記標題",
        "是否已讀": 0,
        "創建時間": "2025-08-30T00:00:00.000Z"
      }
    ],
    "分頁": {
      "頁數": 1,
      "每頁限制": 20,
      "總數": 5,
      "頁數總數": 1
    }
  }
}
```

### 3. 取得關注通知
**接口地址**: `GET /api/notifications/follows`
**需要認證**: 是

**請求參數**:
| 參數 | 種類 | 必填 | 說明 |
|------|------|------|------|
| 頁數 | int | 否 | 頁碼，默認1 |
| 每頁數量 | int | 否 | 每頁數量，默認20 |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "通知": [
      {
        "識別碼": 3,
        "類型": "關注",
        "發送者識別碼": 4,
        "發送者別名": "用戶4",
        "發送者頭像": "https://example.com/avatar4.jpg",
        "發送者驗證": 0,
        "是否已讀": 0,
        "創建時間": "2025-08-30T00:00:00.000Z"
      }
    ],
    "分頁": {
      "頁數": 1,
      "每頁限制": 20,
      "總數": 3,
      "頁數總數": 1
    }
  }
}
```

### 4. 將通知標記為已讀
**接口地址**: `PUT /api/notifications/:id/read`
**需要認證**: 是

**路徑參數**:
| 參數 | 種類 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 通知識別碼 |

**回應範例**:
```json
{
  "code": 200,
  "message": "標記成功"
}
```

### 5. 取得收藏通知
**接口地址**: `GET /api/notifications/collections`
**需要認證**: 是

**請求參數**:
| 參數 | 種類 | 必填 | 說明 |
|------|------|------|------|
| 頁數 | int | 否 | 頁碼，默認1 |
| 每頁數量 | int | 否 | 每頁數量，默認20 |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "通知": [
      // 此處應包含收藏通知的相關資訊
    ],
    "分頁": {
      "頁數": 1,
      "每頁限制": 20,
      "總數": // 通知總數，
      "頁數總數": // 總頁數
    }
  }
}
```

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "通知": [
      {
        "id": 4,
        "型態": "收藏",
        "發送者ID": 5,
        "發送者昵稱": "用戶5",
        "發送者頭像": "https://example.com/avatar5.jpg",
        "發送者驗證": 0,
        "貼文ID": 1,
        "貼文標題": "筆記標題",
        "貼文圖片": "https://example.com/post_image.jpg",
        "是否已讀": 0,
        "建立時間": "2025-08-30T00:00:00.000Z"
      }
    ],
    "分頁": {
      "頁數": 1,
      "每頁數量": 20,
      "總數": 2,
      "頁數總數": 1
    }
  }
}
```

### 5. 獲取所有通知
**接口地址**: `GET /api/notifications`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |

**響應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "通知": [
      {
        "id": 1,
        "型態": "評論",
        "發送者ID": 2,
        "發送者昵稱": "用戶2",
        "發送者頭像": "https://example.com/avatar2.jpg",
        "發送者驗證": 0,
        "貼文ID": 1,
        "貼文標題": "筆記標題",
        "評論內容": "評論內容",
        "是否已讀": 0,
        "建立時間": "2025-08-30T00:00:00.000Z"
      }
    ],
    "分頁": {
      "頁數": 1,
      "每頁數量": 20,
      "總數": 15,
      "頁數總數": 1
    }
  }
}
```

### 6. 标记通知为已读
**接口地址**: `PUT /api/notifications/:id/read`
**需要认证**: 是

**路徑參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 通知ID |

**響應範例**:
```json
{
  "code": 200,
  "message": "標記成功"
}
```

### 7. 标记所有通知为已读
**接口地址**: `PUT /api/notifications/read-all`
**需要认证**: 是

**響應範例**:
```json
{
  "code": 200,
  "message": "全部標記成功"
}
```

### 8. 删除通知
**接口地址**: `DELETE /api/notifications/:id`
**需要认证**: 是

**路徑參數**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 通知ID |

**響應範例**:
```json
{
  "code": 200,
  "message": "刪除成功"
}
```

### 9. 获取未读通知数量
**接口地址**: `GET /api/notifications/unread-count`
**需要认证**: 是

**響應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "未讀通知數量": 5
  }
}
```

---

## 圖片上傳接口

### 1. 单圖片上傳
**接口地址**: `POST /api/upload/single`
**需要認證**: 是

**請求參數**:
- 使用 `multipart/form-data` 格式
- 文件字段名: `file`
- 支持格式: jpg, jpeg, png, webp
- 文件大小限制: 5MB

**響應範例**:
```json
{
  "code": 200,
  "message": "圖片上傳成功",
  "data": {
    "原始名稱": "image.jpg",
    "大小": 1024000,
    "網址": "https://img.example.com/1640995200000_image.jpg"
  }
}
```

### 2. 多圖片上傳
**接口地址**: `POST /api/upload/multiple`
**需要認證**: 是

**請求參數**:
- 使用 `multipart/form-data` 格式
- 文件欄位名: `files`
- 最多支持9個文件
- 支持格式: jpg, jpeg, png, webp
- 单文件大小限制: 5MB

**回應範例**:
```json
{
  "code": 200,
  "message": "文件上傳成功",
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



---

## 互動相關接口

### 1. 按讚/取消按讚
**接口地址**: `POST /api/likes`
**需要認證**: 是

**請求參數**:
| 參數 | 階別 | 必填 | 說明 |
|------|------|------|------|
| target_type | int | 是 | 目標類型（1:筆記, 2:評論） |
| target_id | int | 是 | 目標ID |

**功能說明**:
- 如果用戶未按讚，則執行按讚操作
- 如果用戶已按讚，則執行取消按讚操作

**請求範例**:
```json
{
  "target_type": 1,
  "target_id": 1
}
```

**回應範例**:
```json
{
  "code": 200,
  "message": "按讚成功",
  "data": {
    "liked": true
  }
}
```

### 1.1 取消按讚（備用接口）
**接口地址**: `DELETE /api/likes`
**需要認證**: 是

**請求參數**:
| 參數 | 階別 | 必填 | 說明 |
|------|------|------|------|
| target_type | int | 是 | 目標類型（1:筆記, 2:評論） |
| target_id | int | 是 | 目標ID |

**請求範例**:
```json
{
  "target_type": 1,
  "target_id": 1
}
```

**回應範例**:
```json
{
  "code": 200,
  "message": "取消按讚成功"
}
```

### 2. 收藏/取消收藏
**接口地址**: `POST /api/collections`
**需要認證**: 是

**請求參數**:
| 參數 | 階別 | 必填 | 說明 |
|------|------|------|------|
| post_id | int | 是 | 筆記ID |

**請求範例**:
```json
{
  "post_id": 1
}
```

**回應範例**:
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

## 標籤相關接口

### 1. 取得標籤列表
**接口地址**: `GET /api/tags`

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "生活",
      "description": "生活相關內容",
      "use_count": 100,
      "is_hot": 1,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

### 2. 取得熱門標籤
**接口地址**: `GET /api/tags/hot`

**說明**: 返回最多10個熱門標籤

---

## 標籤相關接口

### 1. 取得所有標籤
**接口地址**: `GET /api/tags`
**需要認證**: 否

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "攝影",
      "description": "攝影相關內容",
      "use_count": 150,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}

### 2. 取得熱門標籤
**接口位置**: `GET /api/tags/hot`
**需要認證**: 否

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| limit | int | 否 | 返回數量，預設10 |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "name": "攝影",
      "description": "攝影相關內容",
      "use_count": 150,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

---

## 統計相關接口

### 1. 取得系統統計資訊
**接口位置**: `GET /api/stats`
**需要認證**: 否

**回應範例**:
```json
{
  "code": 200,
  "message": "取得統計資訊成功",
  "data": {
    "users": 1250,
    "posts": 3420,
    "comments": 8750,
    "likes": 15600
  }
}
```

---

## 健康檢查接口

### 1. 健康檢查
**接口位置**: `GET /api/health`
**需要認證**: 否

**回應範例**:
```json
{
  "code": 200,
  "message": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## 搜尋相關接口

### 1. 通用搜尋
**接口位置**: `GET /api/search`
**需要認證**: 否（選擇性）

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| keyword | string | 否 | 搜尋關鍵詞 |
| tag | string | 否 | 標籤搜尋 |
| type | string | 否 | 搜尋類型：all（預設）、posts、users |
| page | int | 否 | 頁碼，預設1 |
| limit | int | 否 | 每頁數量，預設20 |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "keyword": "生活",
    "tag": "",
    "type": "all",
    "data": {
      "posts": [
        {
          "id": 1,
          "title": "生活小記",
          "content": "今天的生活很美好",
          "author_id": 1,
          "author_name": "張三",
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
          "username": "張三",
          "nickname": "小張",
          "avatar": "https://img.example.com/avatar1.jpg",
          "bio": "熱愛生活",
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

## 統計相關接口

### 1. 取得統計數據
**接口位置**: `GET /api/stats`

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
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

## 錯誤碼說明

| 錯誤碼 | 說明 |
|--------|------|
| 400 | 請求參數錯誤 |
| 404 | 資源不存在 |
| 500 | 伺服器內部錯誤 |

## 使用範例

### 使用curl測試接口

```bash
# 使用者註冊
curl -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "nickname": "測試使用者",
    "password": "123456"
  }'

# 使用者登錄
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "password": "123456"
  }'

# 獲取當前使用者信息（需要認證）
curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 獲取使用者列表
curl -X GET "http://localhost:3001/api/users?page=1&limit=10"

# 獲取筆記詳情
curl -X GET "http://localhost:3001/api/posts/1"

# 創建筆記（需要認證）
curl -X POST "http://localhost:3001/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "測試筆記",
    "content": "這是測試內容",
    "category_id": 1
  }'

# 創建評論（需要認證）
curl -X POST "http://localhost:3001/api/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "post_id": 1,
    "content": "這是一條測試評論"
  }'

# 按讚筆記（需要認證）
curl -X POST "http://localhost:3001/api/posts/1/like" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 收藏筆記（需要認證）
curl -X POST "http://localhost:3001/api/posts/1/collect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 关注使用者（需要認證）
curl -X POST "http://localhost:3001/api/users/2/follow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 上傳單個文件（需要認證）
curl -X POST "http://localhost:3001/api/upload/single" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/image.jpg"

# 獲取通知（需要認證）
curl -X GET "http://localhost:3001/api/notifications/comments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 搜尋筆記
curl -X GET "http://localhost:3001/api/search?keyword=生活"
```

### 使用JavaScript測試接口

```javascript
// 設置基礎URL和token
const API_BASE = 'http://localhost:3001';
let authToken = localStorage.getItem('auth_token');

// 通用請求函數
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
```

// 用戶註冊
async function register() {
  const result = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'test_user',
      nickname: '測試用戶',
      password: '123456'
    })
  });
  
  if (result.code === 200) {
    authToken = result.data.tokens.access_token;
    localStorage.setItem('auth_token', authToken);
  }
  
  return result;
}

// 用戶登錄
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

// 獲取當前用戶信息
async function getCurrentUser() {
  return await apiRequest('/api/auth/me');
}

// 獲取筆記列表
async function getPosts(page = 1, limit = 10) {
  return await apiRequest(`/api/posts?page=${page}&limit=${limit}`);
}

// 創建筆記
async function createPost(postData) {
  return await apiRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  });
}

// 赞同筆記
async function likePost(postId) {
  return await apiRequest(`/api/posts/${postId}/like`, {
    method: 'POST'
  });
}

// 收藏筆記
async function collectPost(postId) {
  return await apiRequest(`/api/posts/${postId}/collect`, {
    method: 'POST'
  });
}

// 关注用戶
async function followUser(userId) {
  return await apiRequest(`/api/users/${userId}/follow`, {
    method: 'POST'
  });
}

// 上傳文件
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  return await apiRequest('/api/upload/single', {
    method: 'POST',
    headers: {
      // 不設定Content-Type，讓瀏覽器自動設定multipart/form-data
      Authorization: `Bearer ${authToken}`
    },
    body: formData
  });
}

// 獲取通知
async function getNotifications(type = 'comments', page = 1) {
  return await apiRequest(`/api/notifications/${type}?page=${page}`);
}

// 使用範例
async function example() {
  try {
    // 登錄
    const loginResult = await login();
    console.log('登錄結果:', loginResult);
    
    // 獲取筆記列表
    const posts = await getPosts();
    console.log('筆記列表:', posts);
    
    // 創建筆記
    const newPost = await createPost({
      title: '測試筆記',
      content: '這是測試內容',
      category_id: 1
    });
    console.log('創建筆記結果:', newPost);
    
    // 赞同筆記
    if (posts.data.posts.length > 0) {
      const likeResult = await likePost(posts.data.posts[0].id);
      console.log('赞同結果:', likeResult);
    }
    
  } catch (error) {
    console.error('API調用錯誤:', error);
  }
}

---

## 注意事項

1. **認證要求**: 需要認證的接口必须在請求頭中攜帶有效的JWT token
2. **Token管理**: 存取令牌有效期为1小時，刷新令牌有效期为7天
3. **請求格式**: 所有POST/PUT請求需要設置`Content-Type: application/json`（文件上傳除外）
4. **圖片上傳**: 圖片上傳接口使用`multipart/form-data`格式，支持jpg、jpeg、png、gif、webp格式，單圖片最大5MB
5. **狀態切換**: 按讚、收藏、關注等操作支持切換狀態（已按讚則取消按讚）
6. **自動更新**: 访問筆記詳情會自動增加瀏覽量，創建評論會自動更新筆記的評論數
7. **關係更新**: 關注操作會自動更新用戶的關注數和粉絲數
8. **搜索功能**: 搜索功能支持標題和內容的模糊匹配
9. **通知系統**: 評論、按讚、關注等操作會自動生成通知
10. **數據驗證**: 用戶註冊時會驗證用戶ID唯一性和密碼強度（6-20位）

---

## 管理員相關接口

### 認證說明
管理員接口使用JWT認證方式：
- 管理員需要先透過登錄接口獲取JWT token
- 在後續請求中在請求頭中攜帶 `Authorization: Bearer <token>`

### 1. 管理員登錄
**接口地址**: `POST /api/auth/admin/login`

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| username | string | 是 | 管理員用戶名 |
| password | string | 是 | 管理員密碼 |

**回應範例**:
```json
{
  "code": 200,
  "message": "登錄成功",
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

### 2. 取得當前管理員信息
**接口地址**: `GET /api/auth/admin/me`
**需要認證**: 是（JWT）

**回應範例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin"
  }
}

### 3. 用戶管理

#### 3.1 獲取用戶清單
**接口地址**: `GET /api/admin/users`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| user_display_id | string | 否 | 小石榴號搜索 |
| nickname | string | 否 | 昵稱搜索 |
| status | int | 否 | 狀態過濾（1=活躍，0=禁用） |
| sortField | string | 否 | 排序字段（id, fans_count, like_count, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 3.2 創建用戶
**接口地址**: `POST /api/admin/users`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| user_id | string | 是 | 用戶ID |
| nickname | string | 是 | 昵稱 |
| password | string | 是 | 密碼 |
| avatar | string | 否 | 头像URL |
| bio | string | 否 | 個人簡介 |
| location | string | 否 | 所在地 |

#### 3.3 更新用戶
**接口地址**: `PUT /api/admin/users/:id`
**需要認證**: 是

#### 3.4 刪除用戶
**接口地址**: `DELETE /api/admin/users/:id`
**需要認證**: 是

#### 3.5 批量刪除用戶
**接口地址**: `DELETE /api/admin/users`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| ids | array | 是 | 用戶ID陣列 |

### 4. 記錄管理

#### 4.1 獲取記錄清單
**接口地址**: `GET /api/admin/posts`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| title | string | 否 | 标題搜索 |
| user_display_id | string | 否 | 作者小石榴號過濾 |
| category_id | int | 否 | 分類ID過濾 |
| sortField | string | 否 | 排序字段（id, view_count, like_count, collect_count, comment_count, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 4.2 創建記錄
**接口地址**: `POST /api/admin/posts`
**需要認證**: 是

#### 4.3 更新記錄
**接口地址**: `PUT /api/admin/posts/:id`
**需要認證**: 是

#### 4.4 刪除記錄
**接口地址**: `DELETE /api/admin/posts/:id`
**需要認證**: 是

#### 4.5 批量刪除記錄
**接口地址**: `DELETE /api/admin/posts`
**需要認證**: 是

### 5. 評論管理

#### 5.1 獲取評論清單
**接口地址**: `GET /api/admin/comments`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| content | string | 否 | 內容搜索 |
| user_display_id | string | 否 | 評論者小石榴號過濾 |
| post_id | int | 否 | 記錄ID過濾 |
| sortField | string | 否 | 排序字段（id, like_count, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 5.2 創建評論
```

**接口位置**: `POST /api/admin/comments`
**需要驗證**: 是

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| content | string | 是 | 評論內容 |
| user_id | int | 是 | 評論者ID |
| post_id | int | 是 | 詩篇ID |
| parent_id | int | 否 | 父評論ID（回覆評論時使用） |

#### 5.3 更新評論
**接口位置**: `PUT /api/admin/comments/:id`
**需要驗證**: 是

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| content | string | 否 | 評論內容 |

#### 5.4 刪除評論
**接口位置**: `DELETE /api/admin/comments/:id`
**需要驗證**: 是

#### 5.5 批量刪除評論
**接口位置**: `DELETE /api/admin/comments`
**需要驗證**: 是

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| ids | array | 是 | 評論ID陣列 |

#### 5.6 獲取單個評論詳情
**接口位置**: `GET /api/admin/comments/:id`
**需要驗證**: 是

### 6. 標籤管理

#### 6.1 獲取標籤清單
**接口位置**: `GET /api/admin/tags`
**需要驗證**: 是

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| name | string | 否 | 標籤名稱搜索 |
| sortField | string | 否 | 排序字段（id, use_count, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 6.2 創建標籤
**接口位置**: `POST /api/admin/tags`
**需要驗證**: 是

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| name | string | 是 | 標籤名稱 |
| description | string | 否 | 標籤描述 |

#### 6.3 更新標籤
**接口位置**: `PUT /api/admin/tags/:id`
**需要驗證**: 是

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| name | string | 否 | 標籤名稱 |
| description | string | 否 | 標籤描述 |

#### 6.4 刪除標籤
**接口位置**: `DELETE /api/admin/tags/:id`
**需要驗證**: 是

#### 6.5 批量刪除標籤
**接口位置**: `DELETE /api/admin/tags`
**需要驗證**: 是

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| ids | array | 是 | 標籤ID陣列 |

#### 6.6 獲取單個標籤詳情
**接口位置**: `GET /api/admin/tags/:id`
**需要驗證**: 是

### 7. 證書審核管理

#### 7.1 獲取證書申請清單
**接口位置**: `GET /api/admin/audit`
**需要驗證**: 是

**請求參數**:
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| type | int | 否 | 證書類型篩選（1-個人證書，2-企業證書） |
| status | int | 否 | 审核狀態篩選（0-待審核，1-已通過，2-已拒絕） |
| user_display_id | string | 否 | 用戶小石榴號搜索 |
| real_name | string | 否 | 真實姓名搜索 |
| 排序欄位 | 字串 | 否 | 排序欄位（id, created_at, audit_time） |
| 排序順序 | 字串 | 否 | 排序順序（ASC, DESC） |

**回應範例**:
```

{
  "code": 200,
  "message": "成功",
  "data": {
    "核對": [
      {
        "id": 1,
        "user_id": 1,
        "型態": 1,
        "真實姓名": "張三",
        "身份證號": "110101199001011234",
        "身份證正面": "https://example.com/id_front.jpg",
        "身份證背面": "https://example.com/id_back.jpg",
        "聯繫電話": "13800138000",
        "聯繫電子郵件": "zhangsan@example.com",
        "說明": "申請個人認證",
        "狀態": 0,
        "核對時間": null,
        "拒絕原因": null,
        "建立時間": "2025-01-02T00:00:00.000Z",
        "使用者": {
          "id": 1,
          "使用者ID": "user_001",
          "暱稱": "張三",
          "頭像": "https://example.com/avatar.jpg"
        }
      }
    ],
    "分頁": {
      "頁數": 1,
      "限制": 20,
      "總數": 1,
      "頁數總計": 1
    }
  }
}
```

#### 7.2 取得認證申請詳情
**接口位置**: `GET /api/admin/audit/:id`
**需要認證**: 是

**路徑參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 認證申請ID |

**回應範例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "真實姓名": "張三",
    "身份證號": "110101199001011234",
    "身份證正面": "https://example.com/id_front.jpg",
    "身份證背面": "https://example.com/id_back.jpg",
    "聯繫電話": "13800138000",
    "聯繫電子郵件": "zhangsan@example.com",
    "說明": "申請個人認證",
    "狀態": 0,
    "核對時間": null,
    "拒絕原因": null,
    "建立時間": "2025-01-02T00:00:00.000Z",
    "使用者": {
      "id": 1,
      "使用者ID": "user_001",
      "暱稱": "張三",
      "頭像": "https://example.com/avatar.jpg",
      "驗證": 0
    }
  }
}
```

#### 7.3 核對認證申請（通過）
**接口位置**: `PUT /api/admin/audit/:id/approve`
**需要認證**: 是

**路徑參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 認證申請ID |

**功能說明**:
- 核對通過後，用戶的認證狀態會自動更新為已認證
- 系統會記錄核對時間

**回應範例**:
```json
{
  "code": 200,
  "message": "認證申請核對通過"
}
```

#### 7.4 核對認證申請（拒絕）
**接口位置**: `PUT /api/admin/audit/:id/reject`
**需要認證**: 是

**路徑參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| id | int | 是 | 認證申請ID |

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| reject_reason | string | 是 | 拒絕原因 |

**功能說明**:
- 核對拒絕後，用戶可以查看拒絕原因
- 用戶可以撤回申請後重新提交

**回應範例**:
```json
{
  "code": 200,
  "message": "認證申請已拒絕"
}

### 8. 按讚管理

#### 8.1 獲取按讚清單
**接口位置**: `GET /api/admin/likes`
**需要驗證**: 是

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，預設1 |
| limit | int | 否 | 每頁數量，預設20 |
| user_display_id | string | 否 | 使用者小石榴號過濾 |
| target_type | int | 否 | 目標類型（1=筆記，2=評論） |
| sortField | string | 否 | 排序字段（id, user_id, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 8.2 建立按讚
**接口位置**: `POST /api/admin/likes`
**需要驗證**: 是

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| user_id | int | 是 | 用戶ID |
| target_id | int | 是 | 目標ID（筆記ID或評論ID） |
| target_type | int | 是 | 目標類型（1=筆記，2=評論） |

#### 8.3 更新按讚
**接口位置**: `PUT /api/admin/likes/:id`
**需要驗證**: 是

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| target_type | int | 否 | 目標類型（1=筆記，2=評論） |

#### 8.4 刪除按讚
**接口位置**: `DELETE /api/admin/likes/:id`
**需要驗證**: 是

#### 8.5 批量刪除按讚
**接口位置**: `DELETE /api/admin/likes`
**需要驗證**: 是

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| ids | array | 是 | 按讚ID陣列 |

#### 8.6 獲取單個按讚詳情
**接口位置**: `GET /api/admin/likes/:id`
**需要驗證**: 是

### 8. 收藏管理

#### 8.1 獲取收藏清單
**接口位置**: `GET /api/admin/collections`
**需要驗證**: 是

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，預設1 |
| limit | int | 否 | 每頁數量，預設20 |
| user_display_id | string | 否 | 使用者小石榴號過濾 |
| sortBy | string | 否 | 排序字段（id, user_id, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 8.2 建立收藏
**接口位置**: `POST /api/admin/collections`
**需要驗證**: 是

#### 8.3 刪除收藏
**接口位置**: `DELETE /api/admin/collections/:id`
**需要驗證**: 是

#### 8.4 批量刪除收藏
**接口位置**: `DELETE /api/admin/collections`
**需要驗證**: 是

### 9. 关注管理

#### 9.1 獲取關注清單
**接口位置**: `GET /api/admin/follows`
**需要驗證**: 是

**請求參數**:
| 參數 | 型態 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，預設1 |
| limit | int | 否 | 每頁數量，預設20 |
| user_display_id | string | 否 | 使用者小石榴號過濾 |
| sortField | string | 否 | 排序字段（id, follower_id, following_id, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 9.2 建立關注關係
**接口位置**: `POST /api/admin/follows`
**需要驗證**: 是

#### 9.3 刪除關注關係
```

**接口位置**: `DELETE /api/admin/follows/:id`
**需要驗證**: 是

#### 9.4 批量刪除關注關係
**接口位置**: `DELETE /api/admin/follows`
**需要驗證**: 是

### 10. 通知管理

#### 10.1 獲取通知列表
**接口位置**: `GET /api/admin/notifications`
**需要驗證**: 是

**請求參數**:
| 參數 | 項目類型 | 必填 | 說明 |
|------|----------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| user_display_id | string | 否 | 使用者小石榴號篩選 |
| type | string | 否 | 通知類型篩選 |
| is_read | int | 否 | 已讀狀態（0=未讀，1=已讀） |
| sortField | string | 否 | 排序字段（id, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 10.2 創建通知
**接口位置**: `POST /api/admin/notifications`
**需要驗證**: 是

#### 10.3 更新通知
**接口位置**: `PUT /api/admin/notifications/:id`
**需要驗證**: 是

#### 10.4 刪除通知
**接口位置**: `DELETE /api/admin/notifications/:id`
**需要驗證**: 是

#### 10.5 批量刪除通知
**接口位置**: `DELETE /api/admin/notifications`
**需要驗證**: 是

### 11. 会话管理

#### 11.1 獲取會話列表
**接口位置**: `GET /api/admin/sessions`
**需要驗證**: 是

**請求參數**:
| 參數 | 項目類型 | 必填 | 說明 |
|------|----------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| user_display_id | string | 否 | 使用者小石榴號篩選 |
| is_active | int | 否 | 活躍狀態（0=非活躍，1=活躍） |
| sortField | string | 否 | 排序字段（id, is_active, expires_at, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 11.2 創建會話
**接口位置**: `POST /api/admin/sessions`
**需要驗證**: 是

#### 11.3 更新會話
**接口位置**: `PUT /api/admin/sessions/:id`
**需要驗證**: 是

#### 11.4 刪除會話
**接口位置**: `DELETE /api/admin/sessions/:id`
**需要驗證**: 是

#### 11.5 批量刪除會話
**接口位置**: `DELETE /api/admin/sessions`
**需要驗證**: 是

### 12. 管理員管理

#### 12.1 測試接口
**接口位置**: `GET /api/admin/test-users`
**需要驗證**: 是

**說明**: 临时測試接口，用於檢查使用者數據

**回應範例**:
```

{
  "code": 200,
  "data": [
    {
      "id": 1,
      "user_id": "user_001",
      "nickname": "測試用戶"
    }
  ]
}
```

#### 12.2 獲取管理員清單
**接口地址**: `GET /api/admin/admins` 或 `GET /api/auth/admin/admins`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| username | string | 否 | 用戶名搜索 |
| sortField | string | 否 | 排序字段（username, created_at） |
| sortOrder | string | 否 | 排序方向（ASC, DESC） |

#### 12.2 創建管理員
**接口地址**: `POST /api/admin/admins` 或 `POST /api/auth/admin/admins`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| username | string | 是 | 管理員用戶名 |
| password | string | 是 | 管理員密碼 |

#### 12.3 更新管理員
**接口地址**: `PUT /api/admin/admins/:id` 或 `PUT /api/auth/admin/admins/:id`
**需要認證**: 是

#### 12.4 刪除管理員
**接口地址**: `DELETE /api/admin/admins/:id` 或 `DELETE /api/auth/admin/admins/:id`
**需要認證**: 是

#### 12.5 批量刪除管理員
**接口地址**: `DELETE /api/admin/admins` 或 `DELETE /api/auth/admin/admins`
**需要認證**: 是

#### 12.6 修改管理員密碼
**接口地址**: `PUT /api/auth/admin/admins/:id/password`
**需要認證**: 是（JWT）

#### 12.7 修改管理員狀態
**接口地址**: `PUT /api/auth/admin/admins/:id/status`
**需要認證**: 是（JWT）

### 13. 監控管理

#### 13.1 獲取系統活動監控
**接口地址**: `GET /api/admin/monitor/activities`
**需要認證**: 是

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | int | 否 | 頁碼，默認1 |
| limit | int | 否 | 每頁數量，默認20 |
| date_from | string | 否 | 開始日期（YYYY-MM-DD） |
| date_to | string | 否 | 結束日期（YYYY-MM-DD） |
| activity_type | string | 否 | 活動類型篩選 |

**響應範例**:
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

### 管理員接口使用範例

```bash
# 管理員登錄
curl -X POST "http://localhost:3001/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'

# 獲取用戶清單
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# 獲取管理員信息
curl -X GET "http://localhost:3001/api/auth/admin/me" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# 建立用戶
curl -X POST "http://localhost:3001/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"user_id": "test_user", "nickname": "測試用戶", "password": "123456"}'

# 刪除筆記
curl -X DELETE "http://localhost:3001/api/admin/posts/1" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# 批量刪除評論
curl -X DELETE "http://localhost:3001/api/admin/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"ids": [1, 2, 3]}'
```