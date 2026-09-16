# API Documentation

## Project Information
- **Project Name**: XiaoShiLiu UGC Community
- **Version**: v1.3.3
- **Base URL**: `http://localhost:3001`
- **Database**: xiaoshiliu (MySQL)
- **Update Time**: 2026-09-16

## General Instructions

### Response Format
All API interfaces return JSON format with the following structure:

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### Status Code Explanation
- `200`: Request successful
- `400`: Request parameter error
- `401`: Unauthorized, requires login
- `403`: Forbidden access
- `404`: Resource not found
- `500`: Internal server error

### Authentication Instructions
Interfaces that require authentication must carry an access token in the request header:
```
Authorization: Bearer <access_token>
```

**Token Types and Validity**

| Token | Description | Validity |
|------|------|--------|
| `access_token` | Credential for API calls, JWT format | 7 days, set by `JWT_EXPIRES_IN`, default `7d` |
| `refresh_token` | Used to exchange for a new token pair, JWT format | 30 days, set by `REFRESH_TOKEN_EXPIRES_IN`, default `30d` |
| Server-side session | Row in `user_sessions`, created on login | 7 days, reset on every token refresh |

> The effective lifetime is the shorter of the server-side session and the JWT validity. If the refresh endpoint is not called for 7 consecutive days, the session expires first and the refresh token can no longer be used even within its 30-day window.

**Refreshing Tokens**

After the access token expires, send the `refresh_token` to `POST /api/auth/refresh` to obtain a new token pair. A successful refresh resets the server-side session to 7 days and replaces the tokens stored in `user_sessions`.

**Authentication Failure Responses**

| Status | Message | Cause |
|--------|----------|----------|
| 401 | 访问令牌缺失 (Access token missing) | No `Authorization` header in the request |
| 401 | 无效的访问令牌 (Invalid access token) | Malformed token, signature verification failed, or token expired |
| 401 | 用户不存在或已被禁用 (User not found or disabled) | The user bound to the token was deleted or disabled |
| 401 | 会话已过期，请重新登录 (Session expired) | The session record is no longer valid (logout, re-login, or past its expiry) |
| 403 | 账户已被禁用 (Account disabled) | Login detected `is_active = 0` |

**Single-Session Policy**

Only one valid session is kept per user: calling the login endpoint invalidates all previous sessions of that user, so tokens on old devices immediately receive 401. Logout only invalidates the session of the current device.

**About `expires_in`**

The `expires_in` field returned by login and refresh is fixed at `3600`; the actual validity is determined by the `exp` claim in `access_token`.

### Pagination Parameters
General parameters for interfaces that support pagination:
- `page`: Page number, default is 1
- `limit`: Number of items per page, default is 20

---

## Authentication-Related Interfaces

### 1. User Registration
**API Endpoint**: `POST /api/auth/register`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| user_id | string | Yes | User ID (unique, 3-15 alphanumeric characters and underscores) |
| nickname | string | Yes | Nickname (less than 10 characters) |
| password | string | Yes | Password (6-20 characters) |
| captchaId | string | Yes | Captcha ID |
| captchaText | string | Yes | Captcha text |
| email | string | Conditional | Email address (required when email feature is enabled) |
| emailCode | string | Conditional | Email verification code (required when email feature is enabled) |
| avatar | string | No | Avatar URL |
| bio | string | No | Personal introduction |
| location | string | No | Location (if not provided, the system will automatically obtain the location based on IP) |

**Function Description**:
- The system will automatically obtain the user's location information through a third-party API
- If the user manually provides the location parameter, the value provided by the user will be used preferentially
- For local environments, location will display as "Local"
- The system will not store the user's IP address, only obtain the location information for display purposes
- When email feature is enabled (`EMAIL_ENABLED=true`), email and emailCode parameters are required
- When email feature is disabled (`EMAIL_ENABLED=false`), email and emailCode parameters are optional, no email verification required during registration

**Response Example**:
```json
{
  "code": 200,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "user_id": "user_001",
      "nickname": "XiaoShiLiu",
      "avatar": "https://example.com/avatar.jpg",
      "bio": "This is a personal introduction",
      "location": "Beijing",
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

### 2. User Login
**API Endpoint**: `POST /api/auth/login`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| user_id | string | Yes | XiaoShiLiu ID |
| password | string | Yes | Password |

**Response Example**:
```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "user_id": "xiaoshiliu123",
      "nickname": "XiaoShiLiu User",
      "avatar": "http://example.com/avatar.jpg",
      "bio": "This is my personal introduction",
      "location": "Beijing",
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

### 3. Refresh Token
**API Endpoint**: `POST /api/auth/refresh`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| refresh_token | String | Yes | Refresh token |

**Response Example**:
```json
{
  "code": 200,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### 4. Logout
**API Endpoint**: `POST /api/auth/logout`
**Authentication Required**: Yes

**Response Example**:
```json
{
  "code": 200,
  "message": "Logout successful"
}
```

### 5. Get Current User Information
**API Endpoint**: `GET /api/auth/me`
**Authentication Required**: Yes

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "Pear石榴",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "This is a personal introduction",
    "location": "Beijing",
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

**Banned User Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "Pear石榴",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "This is a personal introduction",
    "location": "Beijing",
    "follow_count": 10,
    "fans_count": 20,
    "like_count": 100,
    "is_active": 1,
    "verified": 0,
    "created_at": "2025-08-30T00:00:00.000Z",
    "ban": {
      "end_time": "2026-03-31 23:59:59",
      "reason": "Violation of community guidelines",
      "created_at": "2026-02-20T10:00:00.000Z"
    }
  }
}
```

### 6. Send Email Verification Code
**API Endpoint**: `POST /api/auth/send-email-code`

**Description**: Only available when email feature is enabled (`EMAIL_ENABLED=true`)

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| email | string | Yes | Email address (required when calling this API) |

**Response Example**:
```json
{
  "code": 200,
  "message": "Verification code sent successfully"
}
```

**Error Response** (when email feature is disabled):
```json
{
  "code": 400,
  "message": "Email feature is not enabled"
}
```

### 7. Get Email Feature Configuration
**API Endpoint**: `GET /api/auth/email-config`

**Description**: Get whether the email feature is currently enabled. Frontend uses this configuration to decide whether to display email-related fields.

**Response Example**:
```json
{
  "code": 200,
  "data": {
    "emailEnabled": true
  },
  "message": "success"
}
```

### 8. Bind Email
**API Endpoint**: `POST /api/auth/bind-email`

**Description**: Bind email for current user, only available when email feature is enabled

**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| email | string | Yes | Email address |
| emailCode | string | Yes | Email verification code |

**Response Example**:
```json
{
  "code": 200,
  "message": "Email bindingsuccessful"
}
```

### 9. Unbind Email
**API Endpoint**: `DELETE /api/auth/unbind-email`

**Description**: Unbind email for current user, only available when email feature is enabled

**Authentication Required**: Yes

**Response Example**:
```json
{
  "code": 200,
  "message": "Email unbinding successful"
}
```

### 10. Send Password Reset Code
**API Endpoint**: `POST /api/auth/send-reset-code`

**Description**: Send password reset verification code to email, only available when email feature is enabled

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| email | string | Yes | Bound email address |

**Response Example**:
```json
{
  "code": 200,
  "message": "Verification code sent successfully",
  "data": {
    "user_id": "xiaoshiliu"
  }
}
```

### 11. Verify Password Reset Code
**API Endpoint**: `POST /api/auth/verify-reset-code`

**Description**: Verify if the password reset code is correct, only available when email feature is enabled

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| email | string | Yes | Email address |
| emailCode | string | Yes | Email verification code |

**Response Example**:
```json
{
  "code": 200,
  "message": "Verification code verified successfully"
}
```

### 12. Reset Password
**API Endpoint**: `POST /api/auth/reset-password`

**Description**: Reset password using email verification code, only available when email feature is enabled

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| email | string | Yes | Email address |
| emailCode | string | Yes | Email verification code |
| newPassword | string | Yes | New password (6-20 characters) |

**Response Example**:
```json
{
  "code": 200,
  "message": "Password reset successful, please login with new password"
}
```

---

## User-related Interfaces

### 1. Get User List
**API Endpoint**: `GET /api/users`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | Integer | No | Page number, default 1 |
| limit | Integer | No | Number per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "user_id": "user_001",
        "nickname": "Pear石榴",
        "avatar": "https://example.com/avatar.jpg",
        "bio": "This is a personal introduction",
        "location": "Beijing",
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

### 2. Get User Details
**API Endpoint**: `GET /api/users/:id`

**Path Parameter**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | Integer | Yes | User ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "Pear石榴",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "This is a personal introduction",
    "location": "Beijing",
    "follow_count": 10,
    "fans_count": 20,
    "like_count": 100,
    "verified": 0,
    "created_at": "2025-08-30T00:00:00.000Z",
    "ban": null
  }
}
```

**Banned User Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 2,
    "user_id": "user_002",
    "nickname": "Test User",
    "avatar": "https://example.com/avatar2.jpg",
    "bio": "Test user bio",
    "location": "Shanghai",
    "follow_count": 5,
    "fans_count": 8,
    "like_count": 20,
    "verified": 0,
    "created_at": "2025-08-31T00:00:00.000Z",
    "ban": {
      "end_time": "2026-03-31 23:59:59",
      "reason": "Violation of community guidelines",
      "created_at": "2026-02-20T10:00:00.000Z"
    }
  }
}
```

### 3. Get User Collection List
**API Endpoint**: `GET /api/users/:id/collections`

**Path Parameter**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | Integer | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | Integer | No | Page number, default 1 |
| limit | Integer | No | Number per page, default 20 |

### 4. Follow User
**API Endpoint**: `POST /api/users/:id/follow`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | The ID of the user being followed |

**Response Example**:
```json
{
  "code": 200,
  "message": "Follow successful"
}
```

### 5. Unfollow User
**API Endpoint**: `DELETE /api/users/:id/follow`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | The ID of the user being followed |

**Response Example**:
```json
{
  "code": 200,
  "message": "Unfollow successful"
}
```

### 6. Get Follow List
**API Endpoint**: `GET /api/users/:id/following`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "following": [
      {
        "id": 2,
        "user_id": "user_002",
        "nickname": "User 2",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "Personal introduction",
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

### 7. Get Follower List
**API Endpoint**: `GET /api/users/:id/followers`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "followers": [
      {
        "id": 3,
        "user_id": "user_003",
        "nickname": "User 3",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "Personal introduction",
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

### 8. Search User
**API Endpoint**: `GET /api/users/search`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| keyword | string | Yes | Search keyword (supports nickname and Xiaosu ID search) |
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
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
        "bio": "This is a personal bio",
        "location": "Beijing",
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

### 9. Get User Personality Tags
**API Endpoint**: `GET /api/users/:id/personality-tags`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "Photography Lover",
        "color": "#FF6B6B"
      },
      {
        "id": 2,
        "name": "Travel Expert",
        "color": "#4ECDC4"
      }
    ]
  }
}
```

### 10. Get User's Published Notes
**API Endpoint**: `GET /api/users/:id/posts`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | string | Yes | User's XiaoShiLiu ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| status | string | No | Status filter, `all` = published and pending review; if omitted, only published notes are returned |
| keyword | string | No | Search keyword (title or content) |
| category | string | No | Category ID filter |
| sort | string | No | Sort field (created_at, view_count, like_count, etc.), default created_at |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "Beautiful Scenery",
        "content": "Captured a beautiful view today",
        "images": ["https://example.com/image1.jpg"],
        "category_id": 1,
        "tags": ["Scenery", "Photography"],
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

### 11. Get Notes Liked by User
**API Endpoint**: `GET /api/users/:id/likes`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 2,
        "title": "Wonderful Moments",
        "content": "Recording the beauty of life",
        "images": ["https://example.com/image2.jpg"],
        "category_id": 2,
        "tags": ["Life", "Record"],
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
          "nickname": "User 2",
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

### 12. Get Follow Status
**API Endpoint**: `GET /api/users/:id/follow-status`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Target user ID |

**Response Example**:
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

### 13. Get Mutual Follows List
**API Endpoint**: `GET /api/users/:id/mutual-follows`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "mutualFollows": [
      {
        "id": 3,
        "user_id": "user_003",
        "nickname": "User 3",
        "avatar": "https://example.com/avatar3.jpg",
        "bio": "Personal bio",
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

### 14. Get User Statistics
**API Endpoint**: `GET /api/users/:id/stats`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Response Example**:
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

### 15. Update User Information
**API Endpoint**: `PUT /api/users/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| nickname | string | No | Nickname |
| avatar | string | No | Avatar URL |
| bio | string | No | Personal Bio |
| location | string | No | Location |

**Response Example**:
```json
{
  "code": 200,
  "message": "User information updated successfully",
  "data": {
    "id": 1,
    "user_id": "user_001",
    "nickname": "New Nickname",
    "avatar": "https://example.com/new_avatar.jpg",
    "bio": "New personal bio",
    "location": "Shanghai",
    "updated_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 16. Submit Verification Application
**API Endpoint**: `POST /api/users/verification`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| type | integer | Yes | Verification Type: 1=Official Verification, 2=Individual Verification |
| real_name | string | Yes | Real Name/Organization Name |
| id_card | string | Yes | ID Card Number/Business License Number |
| contact_name | string | No | Contact Name (required for official verification) |
| contact_phone | string | No | Contact Phone |
| title | string | No | Verification Title (Individual=Occupation/Identity, Official=Organization Name) |
| description | string | No | Verification Reason |

**Response Example**:
```json
{
  "code": 200,
  "message": "Verification application submitted successfully, please wait patiently for review",
  "data": {
    "verificationId": 1
  }
}
```

### 17. Get Verification Application Status
**API Endpoint**: `GET /api/users/verification/status`
**Authentication Required**: Yes

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "type": 2,
    "status": 0,
    "real_name": "Zhang San",
    "id_card": "110101199001011234",
    "contact_name": null,
    "contact_phone": "13800138000",
    "title": "Student",
    "audit_time": null,
    "remark": null,
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

**Status Description**:
- `0`: Pending review
- `1`: Approved
- `2`: Rejected

### 18. Withdraw Verification Application
**API Endpoint**: `DELETE /api/users/verification/revoke`
**Authentication Required**: Yes

**Function Description**:
- Can recall pending, approved, or rejected certification applications
- Recalling an approved certification application will also cancel the user's certification status
- After recalling, certification applications can be resubmitted

**Response Example**:
```json
{
  "code": 200,
  "message": "Verification application has been withdrawn"
}
```

---

## Category Management Interface

### 1. Get Category List
**API Endpoint**: `GET /api/categories`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| sortField | String | No | Sorting field, optional values: id, name, created_at, post_count, default id |
| sortOrder | String | No | Sorting order, optional values: asc, desc, default asc |
| name | String | No | Fuzzy search by category name |
| category_title | String | No | Fuzzy search by English title |

**Response Example**:
```json
{
  "code": 200,
  "message": "Successfully obtained",
  "data": [
    {
      "id": 1,
      "name": "Learning",
      "category_title": "study",
      "created_at": "2025-01-01T00:00:00.000Z",
      "post_count": 15
    },
    {
      "id": 2,
      "name": "Campus",
      "category_title": "campus",
      "created_at": "2025-01-01T00:00:00.000Z",
      "post_count": 8
    },
    {
      "id": 3,
      "name": "Emotion",
      "category_title": "emotion",
      "created_at": "2025-01-01T00:00:00.000Z",
      "post_count": 23
    }
  ]
}
```

### 2. Get Category List (Administrator)
**API Endpoint**: `GET /api/admin/categories`
**Authentication Required**: Yes (Administrator Permission)

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | Integer | No | Page number, default 1 |
| limit | Integer | No | Number of items per page, default 10 |
| sortField | String | No | Sorting field, optional values: id, name, category_title, created_at, post_count, default id |
| sortOrder | String | No | Sorting order, optional values: asc, desc, default asc |
| name | String | No | Fuzzy search by category name |
| category_title | String | No | Fuzzy search by English title |

**Response Example**:
```json
{
  "code": 200,
  "message": "Successfully obtained",
  "data": [
    {
      "id": 1,
      "name": "Learning",
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

### 3. Get Single Category (Administrator)
**API Endpoint**: `GET /api/admin/categories/:id`
**Authentication Required**: Yes (Administrator Permission)

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | Integer | Yes | Category ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Successfully obtained",
  "data": {
    "id": 1,
    "name": "Learning",
    "category_title": "study",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 4. Create Category
**API Endpoint**: `POST /api/admin/categories`
**Authentication Required**: Yes (Administrator Permission)

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| name | String | Yes | Category name |
| category_title | String | Yes | English title for URL routing |

**Response Example**:
```json
{
  "code": 200,
  "message": "Category created successfully",
  "data": {
    "id": 11,
    "name": "New Category",
    "category_title": "new_category",
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 5. Update Category
**API Endpoint**: `PUT /api/admin/categories/:id`
**Authentication Required**: Yes (Admin privileges)

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | Int | Yes | Category ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| name | String | No | Category name |
| category_title | String | No | English title for URL routing |

**Response Example**:
```json
{
  "code": 200,
  "message": "Category updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Category Name",
    "category_title": "updated_category",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 6. Delete Category
**API Endpoint**: `DELETE /api/admin/categories/:id`
**Authentication Required**: Yes (Admin privileges)

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | Int | Yes | Category ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Category deleted successfully"
}
```

### 7. Batch Delete Categories
**API Endpoint**: `DELETE /api/admin/categories`
**Authentication Required**: Yes (Admin privileges)

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| ids | Array | Yes | Array of category IDs |

**Request Example**:
```json
{
  "ids": [1, 2, 3]
}
```

**Response Example**:
```json
{
  "code": 200,
  "message": "Successfully deleted 3 categories",
  "data": {
    "deletedCount": 3
  }
}
```

**Error Responses**:
- 400: Request parameters error (invalid category ID array)
- 400: Some categories still have notes, cannot be deleted
- 404: Category to be deleted not found

---

## Note-related Interfaces

### 1. Get Note List
**API Endpoint**: `GET /api/posts`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | Int | No | Page number, default 1 |
| limit | Int | No | Number of items per page, default 20 |
| category | String | No | Category ID filter, supports "recommend" for recommended channel |
| status | Int | No | Post status filter, 0=published, 1=draft, 2=pending review, 3=review rejected (default 0) |
| user_id | Int | No | User ID filter (mandatory for viewing drafts) |

**Response Example**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "user_id": 1,
        "title": "Note Title",
        "content": "Note Content",
        "category_id": 2,
        "view_count": 100,
        "like_count": 10,
        "comment_count": 5,
        "collect_count": 3,
        "created_at": "2025-08-30T00:00:00.000Z",
        "nickname": "Xiao Shisui",
        "user_avatar": "https://example.com/avatar.jpg",
        "verified": 0,
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "tags": [
          {
            "id": 1,
            "name": "Tag Name"
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

### 2. Get Following Users' Notes
**API Endpoint**: `GET /api/posts/following`
**Authentication Required**: Yes

**Description**:
- Paginated retrieval of notes published by users the current user follows, sorted by publish time in descending order
- If the user is not logged in, returns an empty list and a `needLogin` flag

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "user_id": 2,
        "title": "Note from followed user",
        "content": "Note content",
        "category_id": 1,
        "view_count": 100,
        "like_count": 10,
        "comment_count": 5,
        "collect_count": 3,
        "created_at": "2025-08-30T00:00:00.000Z",
        "nickname": "User 2",
        "user_avatar": "https://example.com/avatar2.jpg",
        "verified": 0,
        "images": [
          "https://example.com/image1.jpg"
        ],
        "tags": [
          {
            "id": 1,
            "name": "Tag Name"
          }
        ]
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

### 3. Get Note Details
**API Endpoint**: `GET /api/posts/:id`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Note ID |

**Permission Description**:
- Published notes (status=0): visible to everyone
- Draft (status=1) and pending review (status=2) notes: only visible to the author

**Description**: Accessing note details will automatically increase the view count.

### 4. Create a Note
**API Endpoint**: `POST /api/posts`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| title | string | No* | Note Title (required when publishing, optional when drafting) |
| content | string | No* | Note Content (required when publishing, optional when drafting) |
| category_id | int | No | Category ID |
| type | int | No | Note type: 1 - image-text note (default), 2 - video note |
| images | array | No | Array of Image URLs (for image-text notes) |
| imageDescriptions | object | No | Map of image URL to description, written into post_images.description |
| video | object | No | Video info object (for video notes) |
| tags | array | No | Array of Tag Names (string array) |
| status | int | No | Post status, 0=published (approved), 1=draft, 2=pending review, 3=review rejected (default 2) |

**Video Object Structure**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| url | string | Yes | Video file URL |
| coverUrl | string | No | Video cover image URL |

**Request Example (Image-Text Note)**:
```json
{
  "title": "Share a Beautiful Afternoon",
  "content": "Today the weather is nice, walking in the park...",
  "category_id": 5,
  "type": 1,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "tags": ["Life", "Photography", "Share"],
  "status": 0
}
```

**Request Example (Video Note)**:
```json
{
  "title": "A Beautiful Scenery Video",
  "content": "Recording this beautiful moment...",
  "category_id": 5,
  "type": 2,
  "video": {
    "url": "https://video.example.com/video.mp4",
    "coverUrl": "https://img.example.com/video_cover.jpg"
  },
  "tags": ["Life", "Video", "Share"],
  "status": 0
}
```

### 5. Get Note Comments
**API Endpoint**: `GET /api/posts/:id/comments`

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Note ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

### 6. Collect a Note
**API Endpoint**: `POST /api/posts/:id/collect`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Note ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Collection successful"
}
```

### 7. Search Notes
**API Endpoint**: `GET /api/posts/search`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| keyword | string | Yes | Search keyword (supports title and content search) |
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| category_id | int | No | Category ID filter |

**Response Example**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "Beautiful Scenery",
        "content": "I took some beautiful scenery today",
        "images": ["https://example.com/image1.jpg"],
        "category": "Photography",
        "tags": ["Scenery", "Photography"],
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
          "nickname": "Xiao Shiliu",
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

### 8. Update Note
**API Endpoint**: `PUT /api/posts/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Note ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| title | string | No | Note Title (required when publishing, optional when drafting) |
| content | string | No | Note Content (required when publishing, optional when drafting) |
| category_id | int | No | Category ID (required when publishing, optional when drafting) |
| images | array | No | Array of Image URLs (for image-text notes) |
| imageDescriptions | object | No | Map of image URL to description, written into post_images.description. If omitted, the existing description is kept |
| video | object | No | Video info object (for video notes) |
| tags | array | No | Array of Tag Names (string array) |
| status | int | No | Post status, 0=published (approved), 1=draft, 2=pending review, 3=review rejected (default 2) |

**Video Object Structure**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| url | string | Yes | Video file URL |
| coverUrl | string | No | Video cover image URL |

**Request Example**:
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "category_id": 2,
  "images": [
    "https://example.com/new_image1.jpg"
  ],
  "tags": ["Life", "Daily", "Share"],
  "status": 0
}
```

**Response Example**:
```json
{
  "code": 200,
  "message": "Note updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Title",
    "content": "Updated content",
    "category": "Life",
    "updated_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 9. Delete Note
**API Endpoint**: `DELETE /api/posts/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Note ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Note deleted successfully"
}
```

### 10. Cancel Collecting Note
**API Endpoint**: `DELETE /api/posts/:id/collect`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Note ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Collect cancel successfully"
}
```

### 11. Get Draft List
**API Endpoint**: `GET /api/posts/drafts`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| keyword | string | No | Search keyword |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "drafts": [
      {
        "id": 1,
        "title": "Draft Title",
        "content": "Draft content",
        "category": "Life",
        "images": ["image1.jpg", "image2.jpg"],
        "tags": ["Tag1", "Tag2"],
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

## Review-related Interfaces

### 1. Get Comment List
**API Endpoint**: `GET /api/posts/:id/comments`
**Authentication Required**: No (optional)

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Record ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| sort | string | No | Sorting method: desc (default) or asc. Pinned comments are always displayed at the top |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "This is a normal comment",
        "user_id": 1,
        "nickname": "Zhang San",
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
        "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@Photography Lover</a>&nbsp;Your work is really great!</p>",
        "user_id": 2,
        "nickname": "Li Si",
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

**Description**:
- The `content` field may contain HTML-formatted @user mentions
- The frontend needs to correctly render HTML content to display @user links
- @user links contain `href`, `data-user-id`, `class` attributes for frontend processing

### 2. Create Comment
**API Endpoint**: `POST /api/posts/:id/comments`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Record ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| content | string | Yes | Comment content (supports HTML format with @functionality) |
| parent_id | int | No | Parent comment ID (used when replying to a comment) |

**@Functionality Description**:
- Comment content supports @user functionality
- HTML format for @user: `<a href="/user/{user_id}" data-user-id="{user_id}" class="mention-link" contenteditable="false">@{nickname}</a>`
- The system will automatically parse @user tags and send notifications to the mentioned users
- Supports mentioning multiple users in a single comment

**Request Example**:
```json
{
  "content": "This is a normal comment",
  "parent_id": null
}
```

**Request Example with @User Mention**:
```json
{
  "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@Photography Lover</a>&nbsp;Your work is really great!</p>",
  "parent_id": null
}
```

**Response Example**:
```json
{
  "code": 200,
  "message": "Comment created successfully",
  "data": {
    "id": 1,
    "content": "<p><a href=\"/user/user012\" data-user-id=\"user012\" class=\"mention-link\" contenteditable=\"false\">@Photography Lover</a>&nbsp;Your work is really great!</p>",
    "user_id": 1,
    "parent_id": null,
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

**@Functionality Processing Description**:
- When a comment contains @user tags, the system automatically:
  1. Parses the `data-user-id` attribute in the HTML to get the mentioned user's ID
  2. Verifies whether the mentioned user exists
  3. Sends a mention-type notification to the mentioned user
  4. Does not send a @notification to yourself

### 3. Get Comment Replies
**API Endpoint**: `GET /api/comments/:id/replies`
**Authentication Required**: No (optional)

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Comment ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 10 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "replies": [
      {
        "id": 2,
        "content": "This is a reply",
        "user_id": 2,
        "nickname": "Li Si",
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

### 4. Delete Comment
**API Endpoint**: `DELETE /api/comments/:id`
**Authentication Required**: Yes

**Description**: Both the comment author and the post author can delete a comment. Deleting a parent comment also removes all of its child replies.

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Comment ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Comment deleted successfully"
}
```

### 5. Pin/Unpin Comment
**API Endpoint**: `PUT /api/comments/:id/pin`
**Authentication Required**: Yes (post author only)

**Description**: The post author can pin or unpin a top-level comment. Pinned comments are always displayed first in the comment section.

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Comment ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| pinned | boolean | Yes | Whether to pin (true-pin, false-unpin) |

**Response Example**:
```json
{
  "code": 200,
  "message": "Comment pinned successfully",
  "data": {
    "id": 12,
    "pinned": true
  }
}
```

---

## Notification-related Interfaces

### Notification Type Description
The notification system supports the following types:
- **1**: Like a note
- **2**: Like a comment
- **3**: Collect a note
- **4**: Comment on a note
- **5**: Reply to a comment
- **6**: Follow a user
- **7**: Comment mention (mentioning a user in a comment)
- **8**: Note mention (mentioning a user in a note)

### 1. Get Comment Notifications
**API Endpoint**: `GET /api/notifications/comments`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
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
        "sender_nickname": "User 2",
        "sender_avatar": "https://example.com/avatar2.jpg",
        "sender_verified": 0,
        "post_id": 1,
        "post_title": "Note Title",
        "comment_content": "Comment content",
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

### 2. Get Like Notifications
**API Endpoint**: `GET /api/notifications/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
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
        "sender_nickname": "User 3",
        "sender_avatar": "https://example.com/avatar3.jpg",
        "sender_verified": 0,
        "target_type": "post",
        "post_id": 1,
        "post_title": "Note Title",
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

### 3. Get Follow Notifications
**API Endpoint**: `GET /api/notifications/follows`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
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
        "sender_nickname": "User 4",
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

### 4. Get Collection Notifications
**API Endpoint**: `GET /api/notifications/collections`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
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
        "sender_nickname": "User5",
        "sender_avatar": "https://example.com/avatar5.jpg",
        "sender_verified": 0,
        "post_id": 1,
        "post_title": "Note Title",
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

### 5. Get All Notifications
**API Endpoint**: `GET /api/notifications`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
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
        "sender_nickname": "User2",
        "sender_avatar": "https://example.com/avatar2.jpg",
        "sender_verified": 0,
        "post_id": 1,
        "post_title": "Note Title",
        "comment_content": "Comment content",
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

### 6. Mark Notifications as Read
**API Endpoint**: `PUT /api/notifications/:id/read`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Notification ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Marked successfully"
}
```

### 7. Mark All Notifications as Read
**API Endpoint**: `PUT /api/notifications/read-all`
**Authentication Required**: Yes

**Response Example**:
```json
{
  "code": 200,
  "message": "All marked successfully"
}
```

### 8. Delete Notification
**API Endpoint**: `DELETE /api/notifications/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Notification ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Deleted successfully"
}
```

### 9. Get Unread Notification Count
**API Endpoint**: `GET /api/notifications/unread-count`
**Authentication Required**: Yes

**Response Example**:
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "unread_count": 5
  }
}
```

---

## Image Upload Interface

### 1. Single Image Upload
**API Endpoint**: `POST /api/upload/single`
**Authentication Required**: Yes

**Request Parameters**:
- Use `multipart/form-data` format
- File field name: `file`
- Supported formats: jpg, jpeg, png, webp
- File size limit: 10MB

**Response Example**:
```json
{
  "code": 200,
  "message": "Image upload successful",
  "data": {
    "Original Name": "image.jpg",
    "Size": 1024000,
    "URL": "https://img.example.com/1640995200000_image.jpg"
  }
}
```

### 2. Multiple Images Upload
**API Endpoint**: `POST /api/upload/multiple`
**Authentication Required**: Yes

**Request Parameters**:
- Use `multipart/form-data` format
- File field name: `files`
- Up to 9 files supported
- Supported formats: jpg, jpeg, png, webp
- Single file size limit: 10MB

**Response Example**:
```json
{
  "code": 200,
  "message": "File upload successful",
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

### 3. Single Video Upload
**API Endpoint**: `POST /api/upload/video`
**Authentication Required**: Yes

**Request Parameters**:
- Use `multipart/form-data` format
- File field name: `file`
- Optional cover field name: `thumbnail` (an image file used as the video cover)
- Supported formats: mp4, avi, mov, wmv, flv, webm
- File size limit: 100MB

**Response Example**:
```json
{
  "code": 200,
  "message": "Upload successful",
  "data": {
    "originalname": "video.mp4",
    "size": 10240000,
    "url": "https://video.example.com/1640995200000_video.mp4",
    "filePath": "/uploads/videos/1640995200000_video.mp4",
    "coverUrl": "https://img.example.com/1640995200000_video_thumbnail.jpg"
  }
}
```

**Notes**:
- `url`: Access URL of the video file; where it is actually stored depends on `VIDEO_UPLOAD_STRATEGY` (`local` on the server disk, `r2` in a Cloudflare R2 bucket, `aliyun` in an Alibaba Cloud OSS bucket)
- `filePath`: Storage path of the video file on the server; only returned by the `local` strategy
- `coverUrl`: Cover image URL of the video, generated by the frontend from a video frame and uploaded together with the `thumbnail` field; null when not uploaded

---

## File Access Interface

### 1. Get Image File
**API Endpoint**: `GET /api/files/images/:filename`
**Authentication Required**: No

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| filename  | string | Yes     | Image filename |

**Description**:
- Access locally stored image files through API routes
- Supported formats: jpg, jpeg, png, gif, webp
- Automatically sets the correct Content-Type response header
- Supports browser caching (Cache-Control: public, max-age=31536000)

**Response**:
- Success: Returns image file binary data
- Failure: Returns JSON format error information

**Error Example**:
```json
{
  "code": 404,
  "message": "File access failed"
}
```

### 2. Get Video File
**API Endpoint**: `GET /api/files/videos/:filename`
**Authentication Required**: No

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| filename  | string | Yes     | Video filename |

**Description**:
- Access locally stored video files through API routes
- Supported formats: mp4, avi, mov, wmv, flv, webm
- Automatically sets the correct Content-Type response header
- Supports browser caching (Cache-Control: public, max-age=31536000)
- Uses streaming transfer to optimize memory usage when handling large files

**Response**:
- Success: Returns video file binary data
- Failure: Returns JSON format error information

**Error Example**:
```json
{
  "code": 404,
  "message": "File access failed"
}
```

**Security Features**:
- Filename validation (only letters, numbers, underscores, dots, and hyphens allowed)
- Path traversal attack prevention
- File type validation
- File size limit check
- File existence validation

---

## Interactive Related Interfaces

### 1. Like/Unlike
**API Endpoint**: `POST /api/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| target_type | int | Yes | Target Type (1: Note, 2: Comment) |
| target_id | int | Yes | Target ID |

**Function Description**:
- If the user has not liked, perform the like operation
- If the user has already liked, perform the unlike operation

**Request Example**:
```json
{
  "target_type": 1,
  "target_id": 1
}
```

**Response Example**:
```json
{
  "code": 200,
  "message": "Like successful",
  "data": {
    "liked": true
  }
}
```

### 1.1 Unlike (Backup Interface)
**API Endpoint**: `DELETE /api/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| target_type | int | Yes | Target Type (1: Note, 2: Comment) |
| target_id | int | Yes | Target ID |

**Request Example**:
```json
{
  "target_type": 1,
  "target_id": 1
}
```

**Response Example**:
```json
{
  "code": 200,
  "message": "Unlike successful"
}
```

### 2. Collect/Uncollect
**API Endpoint**: `POST /api/collections`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| post_id | int | Yes | Post ID |

**Request Example**:
```json
{
  "post_id": 1
}
```

**Response Example**:
```json
{
  "code": 200,
  "message": "Collect successful",
  "data": {
    "collected": true
  }
}
```

---

## Tag-related Interfaces

### 1. Get All Tags
**API Endpoint**: `GET /api/tags`
**Authentication Required**: No

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "Life",
      "use_count": 100,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

### 2. Get Hot Tags
**API Endpoint**: `GET /api/tags/hot`
**Authentication Required**: No

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| limit | int | No | Number of items to return, default 10 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "Life",
      "use_count": 150,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

---

## Statistical-related Interfaces

### 1. Get System Statistical Information
**API Endpoint**: `GET /api/stats`
**Authentication Required**: No

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": 1250,
    "posts": 3420,
    "comments": 8750,
    "likes": 15600
  }
}
```

---

## Health Check Interface

### 1. Health Check
**API Endpoint**: `GET /api/health`
**Authentication Required**: No

**Response Example**:
```json
{
  "code": 200,
  "message": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## Search-related Interfaces

### 1. General Search
**API Endpoint**: `GET /api/search`
**Authentication Required**: No (optional)

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| keyword | string | No | Search keyword (supports searching user ID, nickname, title, body content, tag name) |
| tag | string | No | Tag search (exact match of tag name) |
| type | string | No | Search type: all (default, all types), posts (image notes), videos (video notes), users (users) |
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "Life",
    "tag": "",
    "type": "all",
    "data": {
      "posts": [
        {
          "id": 1,
          "title": "Life Diary",
          "content": "Today's life is wonderful",
          "author_id": 1,
          "author_name": "Zhang San",
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
          "username": "Zhang San",
          "nickname": "Xiao Zhang",
          "avatar": "https://img.example.com/avatar1.jpg",
          "bio": "Loving life",
          "verified": 0,
          "is_following": false
        }
      ]
    },
    "tagStats": [
      {
        "name": "Life",
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

### 2. Search Suggestions

Candidate completion while typing in the search box. Candidates come from an in-process memory index on the server and do not query the database.

**Endpoint**: `GET /api/search/suggest`
**Authentication**: No
**Rate Limit**: 120 requests / 60 seconds / IP

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| q | string | No | Input text, length 1~100 (truncated if exceeded) |
| limit | int | No | Items per group, default 5, max 10 |

**Matching Rules**: The whole input is matched first; once it reaches 5 characters, keyword fragments extracted by Chinese word segmentation are used for extra recall (e.g. "啊啊美食啊啊" recalls "美食荒漠"). Candidates are ordered by matched fragment length descending, then by match type (word start first) and popularity descending. Chinese text is matched by substring; pure alphanumeric input is additionally matched by full pinyin prefix and initials prefix (e.g. `shipin` or `sp` both match "视频"). Each item carries a `matched` field holding the exact fragment of the candidate text that hit, used by the frontend for highlighting; pinyin or user-id matches cannot be located in the text, so the field is an empty string.

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tags": [
      {
        "text": "视频剪辑",
        "count": 128,
        "matched": "视频"
      }
    ],
    "posts": [
      {
        "text": "我的第一条视频",
        "id": 1024,
        "count": 45,
        "matched": "视频"
      }
    ],
    "users": [
      {
        "text": "小石榴",
        "userId": "shiliu001",
        "count": 320,
        "matched": ""
      }
    ]
  }
}
```

**Edge Behavior**: When `q` is empty, the index is not yet built, or an internal error occurs, all three groups return empty arrays instead of a 5xx.

---

## Administrator-related Interfaces

### Authentication Instructions
Administrator interfaces use JWT authentication:
- Administrators need to obtain a JWT token through the login interface first
- In subsequent requests, carry `Authorization: Bearer <token>` in the request header.
- Administrator tokens carry the `type: 'admin'` claim and their sessions are stored in the `admin_sessions` table; they are not interchangeable with user tokens
- An administrator session lasts 7 days and can be extended by calling `POST /api/auth/admin/refresh`

### 1. Administrator Login
**API Endpoint**: `POST /api/auth/admin/login`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| username | string | Yes | Administrator username |
| password | string | Yes | Administrator password |

**Response Example**:
```json
{
  "code": 200,
  "message": "Login successful",
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

### 2. Get Current Administrator Information
**API Endpoint**: `GET /api/auth/admin/me`
**Authentication Required**: Yes (JWT)

**Response Example**:
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

### 3. Administrator Refresh Token
**API Endpoint**: `POST /api/auth/admin/refresh`

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| refresh_token | string | Yes | Administrator refresh token |

**Response Example**:
```json
{
  "code": 200,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### 4. User Management

#### 4.1 Get User List
**API Endpoint**: `GET /api/admin/users`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Xiaosuiliu number search |
| nickname | string | No | Nickname search |
| status | int | No | Status filter (1=active, 0=disabled) |
| ban_status | string | No | Ban status filter (normal=normal, banned=banned) |
| sortField | string | No | Sorting field (id, fans_count, like_count, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 4.2 Create User
**API Endpoint**: `POST /api/admin/users`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| user_id | string | Yes | User ID |
| nickname | string | Yes | Nickname |
| password | string | Yes | Password |
| avatar | string | No | Avatar URL |
| bio | string | No | Personal introduction |
| location | string | No | Location |

#### 4.3 Update User
**API Endpoint**: `PUT /api/admin/users/:id`
**Authentication Required**: Yes

#### 4.4 Delete User
**API Endpoint**: `DELETE /api/admin/users/:id`
**Authentication Required**: Yes

#### 4.5 Batch Delete Users
**API Endpoint**: `DELETE /api/admin/users`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| ids | array | Yes | Array of user IDs |

#### 4.6 Ban User
**API Endpoint**: `POST /api/admin/users/:id/ban`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| reason | string | Yes | Ban reason |
| end_time | string | No | Ban end time (format: YYYY-MM-DD HH:MM:SS, leave empty for permanent ban) |

**Request Example**:
```json
{
  "reason": "Posting violating content",
  "end_time": "2026-03-31 23:59:59"
}
```

**Response Example**:
```json
{
  "code": 200,
  "message": "User banned successfully"
}
```

**Function Description**:
- Banning a user automatically sets the user's is_active to 0, preventing login
- The ban record is saved to the user_ban table
- If end_time is specified, the system automatically unbans and restores is_active upon expiration
- If end_time is not specified, the ban is permanent

#### 4.7 Unban User
**API Endpoint**: `POST /api/admin/users/:id/unban`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | User ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "User unbanned successfully"
}
```

**Function Description**:
- Unbanning a user automatically restores the user's is_active to 1, allowing login
- All active ban records are updated to the "unbanned by administrator" status
- Ban details (reason, end time, creation time) are displayed

### 5. Note Management

#### 5.1 Get Note List
**API Endpoint**: `GET /api/admin/posts`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| title | string | No | Title search |
| user_display_id | string | No | Filter by author display ID |
| category_id | int | No | Category ID filter |
| sortField | string | No | Sorting field (id, view_count, like_count, collect_count, comment_count, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 5.2 Get Note Detail
**API Endpoint**: `GET /api/admin/posts/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Note ID |

**Description**: Administrators can view notes in all statuses (including drafts and pending review)

#### 5.3 Create Note
**API Endpoint**: `POST /api/admin/posts`
**Authentication Required**: Yes

#### 5.4 Update Note
**API Endpoint**: `PUT /api/admin/posts/:id`
**Authentication Required**: Yes

#### 5.5 Delete Note
**API Endpoint**: `DELETE /api/admin/posts/:id`
**Authentication Required**: Yes

#### 5.6 Batch Delete Notes
**API Endpoint**: `DELETE /api/admin/posts`
**Authentication Required**: Yes

### 6. Post Audit Management

#### 6.1 Get Pending Review Records List
**API Endpoint**: `GET /api/admin/posts-audit`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| keyword | string | No | Search keyword (title or content) |
| user_display_id | string | No | Filter by author XiaoShiLiu number |
| category_id | int/string | No | Category ID filter, pass "null" to filter uncategorized records |

**Response Data**:
| Field | Type | Description |
|------|------|------|
| id | int | Record ID |
| title | string | Record title |
| content | string | Record content |
| type | int | Record type: 1-Image/Text, 2-Video |
| category | string | Category name |
| status | int | Record status: 2-Pending Review |
| user_display_id | string | Author XiaoShiLiu number |
| nickname | string | Author nickname |
| tags | array | Tag list |
| images | array | Image URL list |
| created_at | datetime | Creation time |

#### 6.2 Approve
**API Endpoint**: `PUT /api/admin/posts-audit/:id/approve`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Record ID |

**Description**: Update record status to published (status=0), and update audit record

#### 6.3 Reject
**API Endpoint**: `PUT /api/admin/posts-audit/:id/reject`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Record ID |

**Description**: Update record status to draft (status=1), and update audit record

#### 6.4 Batch Delete Pending Review Records
**API Endpoint**: `DELETE /api/admin/posts-audit`
**Authentication Required**: Yes

**Request Body**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| ids | array | Yes | Array of record IDs to delete |

### 7. Comment Management

#### 7.1 Get Comment List
**API Endpoint**: `GET /api/admin/comments`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| content | string | No | Content search |
| user_display_id | string | No | Filter by comment author's display ID |
| post_id | int | No | Filter by record ID |
| sortField | string | No | Sorting field (id, like_count, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 7.2 Create Comment

**API Endpoint**: `POST /api/admin/comments`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| content | string | Yes | Comment content |
| user_id | int | Yes | Commenter ID |
| post_id | int | Yes | Post ID |
| parent_id | int | No | Parent comment ID (used when replying to a comment) |

#### 7.3 Update Comment
**API Endpoint**: `PUT /api/admin/comments/:id`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| content | string | No | Comment content |

#### 7.4 Delete Comment
**API Endpoint**: `DELETE /api/admin/comments/:id`
**Authentication Required**: Yes

#### 7.5 Batch Delete Comments
**API Endpoint**: `DELETE /api/admin/comments`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| ids | array | Yes | Array of comment IDs |

#### 7.6 Get Single Comment Details
**API Endpoint**: `GET /api/admin/comments/:id`
**Authentication Required**: Yes

### 8. Tag Management

#### 8.1 Get Tag List
**API Endpoint**: `GET /api/admin/tags`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| name | string | No | Tag name search |
| sortField | string | No | Sorting field (id, use_count, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 8.2 Create Tag
**API Endpoint**: `POST /api/admin/tags`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| name | string | Yes | Tag name |
| description | string | No | Tag description |

#### 8.3 Update Tag
**API Endpoint**: `PUT /api/admin/tags/:id`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| name | string | No | Tag name |
| description | string | No | Tag description |

#### 8.4 Delete Tag
**API Endpoint**: `DELETE /api/admin/tags/:id`
**Authentication Required**: Yes

#### 8.5 Batch Delete Tags
**API Endpoint**: `DELETE /api/admin/tags`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| ids | array | Yes | Array of tag IDs |

#### 8.6 Get Single Tag Details
**API Endpoint**: `GET /api/admin/tags/:id`
**Authentication Required**: Yes

### 9. Certificate Audit Management

#### 9.1 Get Certificate Application List
**API Endpoint**: `GET /api/admin/audit`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| type | int | No | Certificate type filter (1-Individual Certificate, 2-Enterprise Certificate) |
| status | int | No | Audit status filter (0-Pending, 1-Approved, 2-Rejected) |
| user_display_id | string | No | User display ID search |
| real_name | string | No | Real name search |
| sortField | string | No | Sorting field (id, created_at, audit_time) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

**Response Example**:
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
        "real_name": "Zhang San",
        "id_card": "110101199001011234",
        "id_card_front": "https://example.com/id_front.jpg",
        "id_card_back": "https://example.com/id_back.jpg",
        "contact_phone": "13800138000",
        "contact_email": "zhangsan@example.com",
        "description": "Apply for individual certificate",
        "status": 0,
        "audit_time": null,
        "remark": null,
        "created_at": "2025-01-02T00:00:00.000Z",
        "user": {
          "id": 1,
          "user_id": "user_001",
          "nickname": "Zhang San",
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

#### 9.2 Get Certificate Application Detail
**API Endpoint**: `GET /api/admin/audit/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Certificate application ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "real_name": "Zhang San",
    "id_card": "110101199001011234",
    "id_card_front": "https://example.com/id_front.jpg",
    "id_card_back": "https://example.com/id_back.jpg",
    "contact_phone": "13800138000",
    "contact_email": "zhangsan@example.com",
    "description": "Apply for individual certificate",
    "status": 0,
    "audit_time": null,
    "reject_reason": null,
    "created_at": "2025-01-02T00:00:00.000Z",
    "user": {
      "id": 1,
      "user_id": "user_001",
      "nickname": "Zhang San",
      "avatar": "https://example.com/avatar.jpg",
      "verified": 0
    }
  }
}
```

#### 9.3 Approve Certificate Application
**API Endpoint**: `PUT /api/admin/audit/:id/approve`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Certificate application ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| remark | string | No | Audit remark |

**Function Description**:
- After approval, the user's certificate status is automatically updated to certified
- The system records the audit time and auditor
- The audit remark is optional

**Response Example**:
```json
{
  "code": 200,
  "message": "Certificate application approved"
}
```

#### 9.4 Reject Certificate Application
**API Endpoint**: `PUT /api/admin/audit/:id/reject`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Certificate application ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| remark | string | No | Audit remark |

**Function Description**:
- After rejection, the user can view the rejection reason
- The user can withdraw the application and resubmit it

**Response Example**:
```json
{
  "code": 200,
  "message": "Certificate application rejected"
}
```

### 10. Like Management

#### 10.1 Get Like List
**API Endpoint**: `GET /api/admin/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user display ID |
| target_type | int | No | Target type (1=Note, 2=Comment) |
| sortField | string | No | Sorting field (id, user_id, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 10.2 Create Like
**API Endpoint**: `POST /api/admin/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| user_id | int | Yes | User ID |
| target_id | int | Yes | Target ID (Note ID or Comment ID) |
| target_type | int | Yes | Target type (1=Note, 2=Comment) |

#### 10.3 Update Like
**API Endpoint**: `PUT /api/admin/likes/:id`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| target_type | int | No | Target type (1=Note, 2=Comment) |

#### 10.4 Delete Like
**API Endpoint**: `DELETE /api/admin/likes/:id`
**Authentication Required**: Yes

#### 10.5 Batch Delete Likes
**API Endpoint**: `DELETE /api/admin/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| ids | array | Yes | Array of Like IDs |

#### 10.6 Get Single Like Detail
**API Endpoint**: `GET /api/admin/likes/:id`
**Authentication Required**: Yes

### 11. Collection Management

#### 11.1 Get Collection List
**API Endpoint**: `GET /api/admin/collections`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user display ID |
| sortBy | string | No | Sorting field (id, user_id, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 11.2 Create Collection
**API Endpoint**: `POST /api/admin/collections`
**Authentication Required**: Yes

#### 11.3 Delete Collection
**API Endpoint**: `DELETE /api/admin/collections/:id`
**Authentication Required**: Yes

#### 11.4 Batch Delete Collections
**API Endpoint**: `DELETE /api/admin/collections`
**Authentication Required**: Yes

### 12. Follow Management

#### 12.1 Get Follow List
**API Endpoint**: `GET /api/admin/follows`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user display ID |
| sortField | string | No | Sorting field (id, follower_id, following_id, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 12.2 Create Follow Relationship
**API Endpoint**: `POST /api/admin/follows`
**Authentication Required**: Yes

#### 12.3 Delete Follow Relationship

**API Endpoint**: `DELETE /api/admin/follows/:id`
**Authentication Required**: Yes

#### 12.4 Batch Delete Follow Relationships
**API Endpoint**: `DELETE /api/admin/follows`
**Authentication Required**: Yes

### 13. Notification Management

#### 13.1 Get Notification List
**API Endpoint**: `GET /api/admin/notifications`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user display ID |
| type | string | No | Filter by notification type |
| is_read | int | No | Read status (0=Unread, 1=Read) |
| sortField | string | No | Sorting field (id, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 13.2 Create Notification
**API Endpoint**: `POST /api/admin/notifications`
**Authentication Required**: Yes

#### 13.3 Update Notification
**API Endpoint**: `PUT /api/admin/notifications/:id`
**Authentication Required**: Yes

#### 13.4 Delete Notification
**API Endpoint**: `DELETE /api/admin/notifications/:id`
**Authentication Required**: Yes

#### 13.5 Batch Delete Notifications
**API Endpoint**: `DELETE /api/admin/notifications`
**Authentication Required**: Yes

### 14. Session Management

#### 14.1 Get Session List
**API Endpoint**: `GET /api/admin/sessions`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user display ID |
| is_active | int | No | Active status (0=Inactive, 1=Active) |
| sortField | string | No | Sorting field (id, is_active, expires_at, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 14.2 Create Session
**API Endpoint**: `POST /api/admin/sessions`
**Authentication Required**: Yes

#### 14.3 Update Session
**API Endpoint**: `PUT /api/admin/sessions/:id`
**Authentication Required**: Yes

#### 14.4 Delete Session
**API Endpoint**: `DELETE /api/admin/sessions/:id`
**Authentication Required**: Yes

#### 14.5 Batch Delete Sessions
**API Endpoint**: `DELETE /api/admin/sessions`
**Authentication Required**: Yes

### 15. Administrator Management

#### 15.1 Test Interface
**API Endpoint**: `GET /api/admin/test-users`
**Authentication Required**: Yes

**Description**: Temporary test interface, used for checking user data

**Response Example**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "user_id": "user_001",
      "nickname": "Test User"
    }
  ]
}
```

#### 15.2 Get Admin List
**API Endpoint**: `GET /api/admin/admins` or `GET /api/auth/admin/admins`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| username | string | No | Username search |
| sortField | string | No | Sorting field (username, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 15.3 Create Admin
**API Endpoint**: `POST /api/admin/admins` or `POST /api/auth/admin/admins`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| username | string | Yes | Admin username |
| password | string | Yes | Admin password |

#### 15.4 Update Admin
**API Endpoint**: `PUT /api/admin/admins/:id` or `PUT /api/auth/admin/admins/:id`
**Authentication Required**: Yes

#### 15.5 Delete Admin
**API Endpoint**: `DELETE /api/admin/admins/:id` or `DELETE /api/auth/admin/admins/:id`
**Authentication Required**: Yes

#### 15.6 Bulk Delete Admins
**API Endpoint**: `DELETE /api/admin/admins`
**Authentication Required**: Yes

#### 15.7 Modify Admin Password
**API Endpoint**: `PUT /api/auth/admin/admins/:id/password`
**Authentication Required**: Yes (JWT)

### 16. Monitoring Management

#### 16.1 Get System Activity Monitoring
**API Endpoint**: `GET /api/admin/monitor/activities`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| date_from | string | No | Start date (YYYY-MM-DD) |
| date_to | string | No | End date (YYYY-MM-DD) |
| activity_type | string | No | Activity type filter |

**Response Example**:
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

### Example of Admin API Usage

```bash
# Admin login
curl -X POST "http://localhost:3001/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'

# Get user list
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Get admin information
curl -X GET "http://localhost:3001/api/auth/admin/me" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Creating a User
curl -X POST "http://localhost:3001/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"user_id": "test_user", "nickname": "Test User", "password": "123456"}'

# Deleting a Note
curl -X DELETE "http://localhost:3001/api/admin/posts/1" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Bulk Deleting Comments
curl -X DELETE "http://localhost:3001/api/admin/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{"ids": [1, 2, 3]}'
```

---

## Error Code Explanation

| Error Code | Description |
|------|------|
| 400 | Request parameters are incorrect |
| 404 | Resource does not exist |
| 500 | Internal server error |

---

## Usage Examples

### Testing APIs with curl

```bash
# User registration
curl -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user", "nickname": "Test User", "password": "123456"}'

# User login
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user", "password": "123456"}'

# Authenticated interfaces carry the JWT
curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Form requests (file upload) use multipart/form-data
curl -X POST "http://localhost:3001/api/upload/single" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/image.jpg"
```

### Testing Interfaces with JavaScript

```javascript
const API_BASE = 'http://localhost:3001';

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  return response.json();
}

async function example() {
  // Login and save the access token
  const login = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ user_id: 'test_user', password: '123456' })
  });
  const token = login.data.tokens.access_token;

  // Call a protected interface with the token
  const profile = await apiRequest('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(profile);
}

example();
```

---

## Important Notes

1. **Authentication Requirement**: Interfaces requiring authentication must include a valid JWT token in the request header

2. **Token Management**: The access token is valid for 7 days, the refresh token for 30 days, and the server-side session lasts 7 days and is extended on every token refresh. See "General Instructions - Authentication Instructions" for details.
3. **Request Format**: All POST/PUT requests need to set `Content-Type: application/json` (except for file upload).
4. **Image Upload**: The image upload interface uses the `multipart/form-data` format, supporting jpg, jpeg, png, gif, and webp formats, with a maximum file size of 10MB for a single image.
5. **Status Switching**: Operations such as liking, favoriting, and following support status switching (canceling a like if already liked).
6. **Automatic Update**: Visiting note details will automatically increase the number of views, and creating comments will automatically update the number of comments on the note.
7. **Relationship Update**: The follow operation will automatically update the user's number of followers and fans.
8. **Search Function**: The search function supports fuzzy matching of titles and content.
9. **Notification System**: Operations such as comments, likes, and follows will automatically generate notifications.
10. **Data Validation**: When registering, the uniqueness of the user ID and the strength of the password (6-20 characters) will be verified.

