# Xiaoshiliu Image and Text Community API Documentation

## Project Information
- **Project Name**: Xiaoshiliu Image and Text Community
- **Version**: v1.3.1
- **Base URL**: `http://localhost:3001`
- **Database**: xiaoshiliu (MySQL)
- **Update Time**: 2025-09-13

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
Interfaces requiring authentication need to carry a JWT token in the request header:
```
Authorization: Bearer <your_jwt_token>
```

### Pagination Parameters
General parameters for interfaces that support pagination:
- `page`: Page number, default is 1
- `limit`: Number of items per page, default is 20

---

## Authentication-Related Interfaces

### 1. User Registration
**API Address**: `POST /api/auth/register`

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
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
      "nickname": "Xiaoshiliu",
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
**API Address**: `POST /api/auth/login`

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| user_id | string | Yes | Xiaoshiliu ID |
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
      "nickname": "Xiaoshiliu User",
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
**API Address**: `POST /api/auth/refresh`

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
**Interface Address**: `POST /api/auth/logout`
**Authentication Required**: Yes

**Response Example**:
```json
{
  "code": 200,
  "message": "Logout successful"
}
```

### 5. Get Current User Information
**Interface Address**: `GET /api/auth/me`
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
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

### 6. Send Email Verification Code
**Interface Address**: `POST /api/auth/send-email-code`

**Description**: Only available when email feature is enabled (`EMAIL_ENABLED=true`)

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
**Interface Address**: `GET /api/auth/email-config`

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
**Interface Address**: `POST /api/auth/bind-email`

**Description**: Bind email for current user, only available when email feature is enabled

**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
**Interface Address**: `DELETE /api/auth/unbind-email`

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
**Interface Address**: `POST /api/auth/send-reset-code`

**Description**: Send password reset verification code to email, only available when email feature is enabled

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
**Interface Address**: `POST /api/auth/verify-reset-code`

**Description**: Verify if the password reset code is correct, only available when email feature is enabled

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
**Interface Address**: `POST /api/auth/reset-password`

**Description**: Reset password using email verification code, only available when email feature is enabled

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
**Interface Address**: `GET /api/users`

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
**Interface Address**: `GET /api/users/:id`

**Path Parameter**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
    "created_at": "2025-08-30T00:00:00.000Z"
  }
}
```

### 3. Get User Collection List
**Interface Address**: `GET /api/users/:id/collections`

**Path Parameter**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | Integer | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | Integer | No | Page number, default 1 |
| limit | Integer | No | Number per page, default 20 |

### 4. Follow User
**Interface Address**: `POST /api/users/:id/follow`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
|-----------|------|----------|-------------|
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
|-----------|------|----------|-------------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
|-----------|------|----------|-------------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
|-----------|------|----------|-------------|
| keyword | string | Yes | Search keyword (supports nickname and Xiaosu ID search) |
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "user_id": "user_001",
    "nickname": "小石榴",
    "total_posts": 10,
    "total_likes": 50,
    "total_comments": 30,
    "total_follows": 20,
    "total_fans": 15,
    "average_likes_per_post": 5,
    "average_comments_per_post": 3,
    "average_comments_per_like": 1.2,
    "latest_post_time": "2025-08-30T12:00:00.000Z"
  }
}
```

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

### 15. Update User Information
**API Endpoint**: `PUT /api/users/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | User ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
|-----------|------|----------|-------------|
| type | integer | Yes | Verification Type: 1-Individual Verification, 2-Enterprise Verification |
| real_name | string | Yes | Real Name/Enterprise Name |
| id_card | string | Yes | ID Card Number/Business License Number |
| id_card_front | string | Yes | ID Card Front/Business License Image URL |
| id_card_back | string | No | ID Card Back Image URL (required for individual verification) |
| business_license | string | No | Business License Image URL (required for enterprise verification) |
| contact_phone | string | Yes | Contact Phone |
| contact_email | string | Yes | Contact Email |
| description | string | No | Application Description |

**Response Example**:
```json
{
  "code": 200,
  "message": "Verification application submitted successfully, please wait for review",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "status": 0,
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

### 17. Get Verification Application Status
**API Endpoint**: `GET /api/users/verification`
**Authentication Required**: Yes

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
    "description": "Application for individual verification",
    "status": 0,
    "audit_time": null,
    "reject_reason": null,
    "created_at": "2025-01-02T00:00:00.000Z"
  }
}
```

**Status Description**:
- `0`: Pending review
- `1`: Approved
- `2`: Rejected

### 18. Withdraw Verification Application
**API Endpoint**: `DELETE /api/users/verification`
**Authentication Required**: Yes

**Function Description**:
- Can recall pending, approved, or rejected certification applications
- Recalling an approved certification application will also cancel the user's certification status
- After recalling, certification applications can be resubmitted

**Response Example**:
```json
{
  "code": 200,
  "message": "Certification application recall successful"
}
```

---

## Category Management Interface

### 1. Get Category List
**Interface Address**: `GET /api/categories`

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
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
**Interface Address**: `GET /api/admin/categories`
**Authentication Required**: Yes (Administrator Permission)

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
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
**Interface Address**: `GET /api/admin/categories/:id`
**Authentication Required**: Yes (Administrator Permission)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
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
**Interface Address**: `POST /api/admin/categories`
**Authentication Required**: Yes (Administrator Permission)

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|-------|----------|-------------|
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
|-----------|-------|----------|-------------|
| id | Int | Yes | Category ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|-------|----------|-------------|
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
|-----------|-------|----------|-------------|
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
|-----------|-------|----------|-------------|
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
|-----------|-------|----------|-------------|
| page | Int | No | Page number, default 1 |
| limit | Int | No | Number of items per page, default 20 |
| category | String | No | Category ID filter, supports "recommend" for recommended channel |
| is_draft | Int | No | Whether to get draft, 1=draft, 0=published (default) |
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

### 2. Retrieve Note Details
**API Endpoint**: `GET /api/posts/:id`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Note ID |

**Description**: Accessing note details will automatically increase the view count.

### 3. Create a Note
**API Endpoint**: `POST /api/posts`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | No* | Note Title (required when publishing, optional when drafting) |
| content | string | No* | Note Content (required when publishing, optional when drafting) |
| category_id | int | No | Category ID |
| images | array | No | Array of Image URLs |
| tags | array | No | Array of Tag Names (string array) |
| is_draft | boolean | No | Whether it is a draft, default false |

**Request Example**:
```json
{
  "title": "Share a Beautiful Afternoon",
  "content": "Today the weather is nice, walking in the park...",
  "category_id": 5,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "tags": ["Life", "Photography", "Share"],
  "is_draft": false
}
```

### 4. Get Note Comments
**API Endpoint**: `GET /api/posts/:id/comments`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Note ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

### 5. Collect a Note
**API Endpoint**: `POST /api/posts/:id/collect`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Note ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Collection successful"
}
```

### 6. Search Notes
**API Endpoint**: `GET /api/posts/search`

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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

### 7. Update Note
**API Endpoint**: `PUT /api/posts/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Note ID |

---
### 8. Delete Note
**API Endpoint**: `DELETE /api/posts/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Note ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Note deleted successfully"
}
```

---
### 9. Cancel Collecting Note
**API Endpoint**: `DELETE /api/posts/:id/collect`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Note ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Collect cancel successfully"
}
```

---
### 10. Get Draft List
**API Endpoint**: `GET /api/posts/drafts`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
### 4. Delete Comment
**API Endpoint**: `DELETE /api/comments/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Comment ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Comment deleted successfully"
}
```

---
### 4. Get Note Comments
**API Endpoint**: `GET /api/posts/:id/comments`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Record ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

---

## Review-related Interfaces

### 1. Retrieve Comment List
**Endpoint**: `GET /api/posts/:id/comments`
**Authentication Required**: No (optional)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Record ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| sort | string | No | Sorting method: desc (default) or asc |

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
```

### 2. Create Comment
**Endpoint**: `POST /api/posts/:id/comments`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Record ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| content | string | Yes | Comment content (supports HTML format with @functionality) |
| parent_id | int | No | Parent comment ID (used when replying to a comment) |

**@Functionality Description**:
- Comment content supports @user functionality
- HTML format for @user: `<a href="/user/{user_id}" data-user-id="{user_id}" class="mention-link" contenteditable="false">@{nickname}</a>`
- The system will automatically parse @user tags and send notifications to the mentioned users
- Supports mentioning multiple users in a single comment

**Request Example**:
```

```json
{
  "content": "This is a normal comment",
  "parent_id": null
}
```

**Request Example with @User Mention**:
```json
{
  "content": "This is a comment mentioning @Photography Lover and @Tech Enthusiast",
  "parent_id": null
}
```

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": 2,
        "user_id": 2,
        "nickname": "李四",
        "user_avatar": "https://img.example.com/avatar2.jpg",
        "content": "赞了你的评论",
        "related_id": 1,
        "created_at": "2025-08-30T02:00:00.000Z",
        "liked": false
      },
      {
        "id": 2,
        "type": 4,
        "user_id": 3,
        "nickname": "王五",
        "user_avatar": "https://img.example.com/avatar3.jpg",
        "content": "评论了你的笔记",
        "related_id": 2,
        "created_at": "2025-08-30T03:00:00.000Z",
        "liked": false
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
        "nickname": "Wang Wu",
        "content": "Your note has been liked",
        "created_at": "2025-08-30T00:00:00.000Z"
      },
      {
        "id": 2,
        "type": 2,
        "user_id": 3,
        "nickname": "Zhao Liu",
        "content": "Your comment has been liked",
        "created_at": "2025-08-30T01:00:00.000Z"
      }
    ]
  }
}
```

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "comment",
        "user_id": 2,
        "nickname": "User 2",
        "avatar": "https://example.com/avatar2.jpg",
        "verified": 0,
        "post_id": 1,
        "post_title": "Note Title",
        "comment_content": "Comment content",
        "is_read": 0,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page_number": 1,
      "per_page": 20,
      "total": 10,
      "total_pages": 1
    }
  }
}
```

### 2. Get Like Notifications
**API Endpoint**: `GET /api/notifications/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Page Number | int | No | Page number, default 1 |
| Per Page Quantity | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "notifications": [
      {
        "id": 2,
        "type": "like",
        "user_id": 3,
        "nickname": "User 3",
        "avatar": "https://example.com/avatar3.jpg",
        "verified": 0,
        "target_type": "post",
        "post_id": 1,
        "post_title": "Note Title",
        "is_read": 0,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page_number": 1,
      "per_page": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

### 3. Get Follow Notifications
**API Endpoint**: `GET /api/notifications/follows`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Page Number | int | No | Page number, default 1 |
| Per Page Quantity | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "notifications": [
      {
        "id": 3,
        "type": "follow",
        "user_id": 4,
        "nickname": "User 4",
        "avatar": "https://example.com/avatar4.jpg",
        "verified": 0,
        "is_read": 0,
        "created_at": "2025-08-30T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page_number": 1,
      "per_page": 20,
      "total": 3,
      "total_pages": 1
    }
  }
}
```

### 4. Mark Notifications as Read
**API Endpoint**: `PUT /api/notifications/:id/read`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Notification identifier |

**Response Example**:
```json
{
  "code": 200,
  "message": "Marked successfully"
}
```

### 5. Retrieve Collection Notifications
**API Endpoint**: `GET /api/notifications/collections`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Page | int | No | Page number, default 1 |
| Limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "Notifications": [
      // Here should include the relevant information of collection notifications
    ],
    "Pagination": {
      "Page Number": 1,
      "Items Per Page": 20,
      "Total Count": // Total number of notifications,
      "Total Page Count": // Total number of pages
    }
  }
}
```

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "Notifications": [
      {
        "id": 4,
        "type": "Collection",
        "senderID": 5,
        "senderNickname": "User5",
        "senderAvatar": "https://example.com/avatar5.jpg",
        "senderVerification": 0,
        "postID": 1,
        "postTitle": "Note Title",
        "postImage": "https://example.com/post_image.jpg",
        "isRead": 0,
        "creationTime": "2025-08-30T00:00:00.000Z"
      }
    ],
    "Pagination": {
      "Page Number": 1,
      "Items Per Page": 20,
      "Total Count": 2,
      "Total Page Count": 1
    }
  }
}
```

### 5. Retrieve All Notifications
**API Endpoint**: `GET /api/notifications`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Page | int | No | Page number, default 1 |
| Limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "Notifications": [
      {
        "id": 1,
        "type": "Comment",
        "senderID": 2,
        "senderNickname": "User2",
        "senderAvatar": "https://example.com/avatar2.jpg",
        "senderVerification": 0,
        "postID": 1,
        "postTitle": "Note Title",
        "commentContent": "Comment content",
        "isRead": 0,
        "creationTime": "2025-08-30T00:00:00.000Z"
      }
    ],
    "Pagination": {
      "Page Number": 1,
      "Items Per Page": 20,
      "Total Count": 15,
      "Total Page Count": 1
    }
  }
}
```

### 6. Mark Notifications as Read
**API Endpoint**: `PUT /api/notifications/:id/read`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
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
|-----------|------|----------|-------------|
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
    "Unread Notification Count": 5
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
- File size limit: 5MB

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
- Single file size limit: 5MB

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



---

## Interactive Related Interfaces

### 1. Like/Unlike
**API Endpoint**: `POST /api/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Level | Required | Description |
|-----------|-------|----------|-------------|
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
| Parameter | Level | Required | Description |
|-----------|-------|----------|-------------|
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
| Parameter | Level | Required | Description |
|-----------|-------|----------|-------------|
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

## Tag-related Interfaces

### 1. Get Tag List
**Interface Address**: `GET /api/tags`

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "Life",
      "description": "Content related to life",
      "use_count": 100,
      "is_hot": 1,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

### 2. Get Hot Tags
**Interface Address**: `GET /api/tags/hot`

**Description**: Returns up to 10 hot tags

---

## Tag-related Interfaces

### 1. Get All Tags
**Interface Address**: `GET /api/tags`
**Authentication Required**: No

**Response Example**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "Photography",
      "description": "Content related to photography",
      "use_count": 150,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}

### 2. Get Hot Tags
**Interface Location**: `GET /api/tags/hot`
**Authentication Required**: No

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| limit | int | No | Number of items to return, default 10 |

**Response Example**:
```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "name": "Photography",
      "description": "Content related to photography",
      "use_count": 150,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}
```

---

## Statistical-related Interfaces

### 1. Get System Statistical Information
**Interface Address**: `GET /api/stats`
**Authentication Required**: No

**Response Example**:
```json
{
  "code": 200,
  "message": "Successfully obtained statistical information",
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
**Interface Address**: `GET /api/health`
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
**Interface Address**: `GET /api/search`
**Authentication Required**: No (optional)

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| keyword | string | No | Search keyword |
| tag | string | No | Tag search |
| type | string | No | Search type: all (default), posts, users |
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |

**Response Example**:
```json

```json
{
  "code": 200,
  "message": "Success",
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
---
## Related APIs

### 1. Obtain Statistics Data
**API Endpoint**: `GET /api/stats`

**Response Example**:
```json
{
  "code": 200,
  "message": "Success",
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

## Error Code Explanation

| Error Code | Description |
|------------|-------------|
| 400 | Request parameters are incorrect |
| 404 | Resource does not exist |
| 500 | Internal server error |

## Usage Examples

### Testing APIs with curl

```bash
# User registration
curl -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "nickname": "Test User",
    "password": "123456"
  }'

# User login
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "password": "123456"
  }'

# Get current user information (requires authentication)
curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get user list
curl -X GET "http://localhost:3001/api/users?page=1&limit=10"

# Get post details
curl -X GET "http://localhost:3001/api/posts/1"

# Create post (requires authentication)
curl -X POST "http://localhost:3001/api/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Note",
    "content": "This is test content",
    "category_id": 1
  }'

# Create comment (requires authentication)
curl -X POST "http://localhost:3001/api/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "post_id": 1,
    "content": "This is a test comment"
  }'

# Like post (requires authentication)
curl -X POST "http://localhost:3001/api/posts/1/like" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

# Favorited Notes (requires authentication)
```bash
curl -X POST "http://localhost:3001/api/posts/1/collect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

# Follow a User (requires authentication)
```bash
curl -X POST "http://localhost:3001/api/users/2/follow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

# Upload a Single File (requires authentication)
```bash
curl -X POST "http://localhost:3001/api/upload/single" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/image.jpg"
```

# Get Notifications (requires authentication)
```bash
curl -X GET "http://localhost:3001/api/notifications/comments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

# Search Notes
```bash
curl -X GET "http://localhost:3001/api/search?keyword=life"
```

### Testing Interfaces with JavaScript

```javascript
// Set base URL and token
const API_BASE = 'http://localhost:3001';
let authToken = localStorage.getItem('auth_token');

// General request function
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

```javascript
// User Registration
async function register() {
  const result = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'test_user',
      nickname: 'Test User',
      password: '123456'
    })
  });
  
  if (result.code === 200) {
    authToken = result.data.tokens.access_token;
    localStorage.setItem('auth_token', authToken);
  }
  
  return result;
}

// User Login
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

// Get Current User Information
async function getCurrentUser() {
  return await apiRequest('/api/auth/me');
}

// Get Note List
async function getPosts(page = 1, limit = 10) {
  return await apiRequest(`/api/posts?page=${page}&limit=${limit}`);
}

// Create a Note
async function createPost(postData) {
  return await apiRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  });
}

// Like a Note
async function likePost(postId) {
  return await apiRequest(`/api/posts/${postId}/like`, {
    method: 'POST'
  });
}

// Collect a Note
async function collectPost(postId) {
  return await apiRequest(`/api/posts/${postId}/collect`, {
    method: 'POST'
  });
}

// Follow a User
async function followUser(userId) {
  return await apiRequest(`/api/users/${userId}/follow`, {
    method: 'POST'
  });
}

// Upload a File
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  return await apiRequest('/api/upload/single', {
    method: 'POST',
    headers: {
      // Do not set Content-Type, let the browser automatically set multipart/form-data
      Authorization: `Bearer ${authToken}`
    },
    body: formData
  });
}

// Get Notifications
async function getNotifications(type = 'comments', page = 1) {
  return await apiRequest(`/api/notifications/${type}?page=${page}`);
}

// Example Usage
async function example() {
  try {
    // Login
    const loginResult = await login();
    console.log('Login Result:', loginResult);
    
    // Get Note List
    const posts = await getPosts();
    console.log('Note List:', posts);
    
    // Create a Note
    const newPost = await createPost({
      title: 'Test Note',
      content: 'This is test content',
      category_id: 1
    });
    console.log('Create Note Result:', newPost);
    
    // Like a Note
    if (posts.data.posts.length > 0) {
      const likeResult = await likePost(posts.data.posts[0].id);
      console.log('Like Result:', likeResult);
    }
    
  } catch (error) {
    console.error('API Call Error:', error);
  }
}

---

## Important Notes

1. **Authentication Requirement**: Interfaces requiring authentication must include a valid JWT token in the request header
```

2. **Token Management**: The validity period for token access is 1 hour, and the validity period for refresh tokens is 7 days.
3. **Request Format**: All POST/PUT requests need to set `Content-Type: application/json` (except for file upload).
4. **Image Upload**: The image upload interface uses the `multipart/form-data` format, supporting jpg, jpeg, png, gif, and webp formats, with a maximum file size of 5MB for a single image.
5. **Status Switching**: Operations such as liking, favoriting, and following support status switching (canceling a like if already liked).
6. **Automatic Update**: Visiting note details will automatically increase the number of views, and creating comments will automatically update the number of comments on the note.
7. **Relationship Update**: The follow operation will automatically update the user's number of followers and fans.
8. **Search Function**: The search function supports fuzzy matching of titles and content.
9. **Notification System**: Operations such as comments, likes, and follows will automatically generate notifications.
10. **Data Validation**: When registering, the uniqueness of the user ID and the strength of the password (6-20 characters) will be verified.

---

## Administrator-related Interfaces

### Authentication Instructions
Administrator interfaces use JWT authentication:
- Administrators need to obtain a JWT token through the login interface first
- In subsequent requests, carry `Authorization: Bearer <token>` in the request header.

### 1. Administrator Login
**API Endpoint**: `POST /api/auth/admin/login`

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| username | string | Yes | Administrator username |
| password | string | Yes | Administrator password |

**Response Example**:
```

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

### 2. Retrieve Current Administrator Information
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

### 3. User Management

#### 3.1 Get User List
**API Endpoint**: `GET /api/admin/users`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Xiaosuiliu number search |
| nickname | string | No | Nickname search |
| status | int | No | Status filter (1=active, 0=disabled) |
| sortField | string | No | Sorting field (id, fans_count, like_count, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 3.2 Create User
**API Endpoint**: `POST /api/admin/users`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | User ID |
| nickname | string | Yes | Nickname |
| password | string | Yes | Password |
| avatar | string | No | Avatar URL |
| bio | string | No | Personal introduction |
| location | string | No | Location |

#### 3.3 Update User
**API Endpoint**: `PUT /api/admin/users/:id`
**Authentication Required**: Yes

#### 3.4 Delete User
**API Endpoint**: `DELETE /api/admin/users/:id`
**Authentication Required**: Yes

#### 3.5 Batch Delete Users
**API Endpoint**: `DELETE /api/admin/users`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ids | array | Yes | Array of user IDs |

### 4. Record Management

#### 4.1 Get Record List
**API Endpoint**: `GET /api/admin/posts`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| title | string | No | Title search |
| user_display_id | string | No | Author Xiaosuiliu number filter |
| category_id | int | No | Category ID filter |
| sortField | string | No | Sorting field (id, view_count, like_count, collect_count, comment_count, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 4.2 Create Record
**API Endpoint**: `POST /api/admin/posts`
**Authentication Required**: Yes

#### 4.3 Update Record
**API Endpoint**: `PUT /api/admin/posts/:id`
**Authentication Required**: Yes

#### 4.4 Delete Record
**API Endpoint**: `DELETE /api/admin/posts/:id`
**Authentication Required**: Yes

#### 4.5 Batch Delete Records
**API Endpoint**: `DELETE /api/admin/posts`
**Authentication Required**: Yes

### 5. Comment Management

#### 5.1 Obtain Comment List
**Interface Address**: `GET /api/admin/comments`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| content | string | No | Content search |
| user_display_id | string | No | Filter by comment author's display ID |
| post_id | int | No | Filter by record ID |
| sortField | string | No | Sorting field (id, like_count, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 5.2 Create Comment

**Interface Location**: `POST /api/admin/comments`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| content | string | Yes | Comment content |
| user_id | int | Yes | Commenter ID |
| post_id | int | Yes | Post ID |
| parent_id | int | No | Parent comment ID (used when replying to a comment) |

#### 5.3 Update Comment
**Interface Location**: `PUT /api/admin/comments/:id`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| content | string | No | Comment content |

#### 5.4 Delete Comment
**Interface Location**: `DELETE /api/admin/comments/:id`
**Authentication Required**: Yes

#### 5.5 Batch Delete Comments
**Interface Location**: `DELETE /api/admin/comments`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ids | array | Yes | Array of comment IDs |

#### 5.6 Get Single Comment Details
**Interface Location**: `GET /api/admin/comments/:id`
**Authentication Required**: Yes

### 6. Tag Management

#### 6.1 Get Tag List
**Interface Location**: `GET /api/admin/tags`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| name | string | No | Tag name search |
| sortField | string | No | Sorting field (id, use_count, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 6.2 Create Tag
**Interface Location**: `POST /api/admin/tags`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Tag name |
| description | string | No | Tag description |

#### 6.3 Update Tag
**Interface Location**: `PUT /api/admin/tags/:id`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | No | Tag name |
| description | string | No | Tag description |

#### 6.4 Delete Tag
**Interface Location**: `DELETE /api/admin/tags/:id`
**Authentication Required**: Yes

#### 6.5 Batch Delete Tags
**Interface Location**: `DELETE /api/admin/tags`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ids | array | Yes | Array of tag IDs |

#### 6.6 Get Single Tag Details
**Interface Location**: `GET /api/admin/tags/:id`
**Authentication Required**: Yes

### 7. Certificate Audit Management

#### 7.1 Get Certificate Application List
**Interface Location**: `GET /api/admin/audit`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| type | int | No | Certificate type filter (1-Individual Certificate, 2-Enterprise Certificate) |
| status | int | No | Audit status filter (0-Pending, 1-Approved, 2-Rejected) |
| user_display_id | string | No | User WeChat ID search |
| real_name | string | No | Real name search |
| Sorting Column | String | No | Sorting Column (id, created_at, audit_time) |
| Sorting Order | String | No | Sorting Order (ASC, DESC) |

**Response Example**:
```

{
  "code": 200,
  "message": "Success",
  "data": {
    "Verification": [
      {
        "id": 1,
        "user_id": 1,
        "type": 1,
        "real_name": "Zhang San",
        "ID_card_number": "110101199001011234",
        "front_ID_card_image": "https://example.com/id_front.jpg",
        "back_ID_card_image": "https://example.com/id_back.jpg",
        "contact_phone": "13800138000",
        "contact_email": "zhangsan@example.com",
        "description": "Application for personal verification",
        "status": 0,
        "verification_time": null,
        "reject_reason": null,
        "creation_time": "2025-01-02T00:00:00.000Z",
        "user": {
          "id": 1,
          "user_ID": "user_001",
          "nickname": "Zhang San",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    ],
    "Pagination": {
      "page_number": 1,
      "limit": 20,
      "total_count": 1,
      "total_page_count": 1
    }
  }
}
```

#### 7.2 Obtain Verification Application Details
**Interface Location**: `GET /api/admin/audit/:id`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Verification Application ID |

**Response Example**:
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": 1,
    "real_name": "Zhang San",
    "ID_card_number": "110101199001011234",
    "front_ID_card_image": "https://example.com/id_front.jpg",
    "back_ID_card_image": "https://example.com/id_back.jpg",
    "contact_phone": "13800138000",
    "contact_email": "zhangsan@example.com",
    "description": "Application for personal verification",
    "status": 0,
    "verification_time": null,
    "reject_reason": null,
    "creation_time": "2025-01-02T00:00:00.000Z",
    "user": {
      "id": 1,
      "user_ID": "user_001",
      "nickname": "Zhang San",
      "avatar": "https://example.com/avatar.jpg",
      "verification": 0
    }
  }
}
```

#### 7.3 Verify Verification Application (Approve)
**Interface Location**: `PUT /api/admin/audit/:id/approve`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Verification Application ID |

**Function Description**:
- After verification is approved, the user's verification status will be automatically updated to verified
- The system will record the verification time

**Response Example**:
```json
{
  "code": 200,
  "message": "Verification application verified"
}
```

#### 7.4 Verify Verification Application (Reject)
**Interface Location**: `PUT /api/admin/audit/:id/reject`
**Authentication Required**: Yes

**Path Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| id | int | Yes | Verification Application ID |

**Request Parameters**:
| Parameter | Type | Required | Description |
|------|------|------|------|
| reject_reason | string | Yes | Reject reason |

**Function Description**:
- After verification is rejected, the user can view the reject reason
- The user can withdraw the application and resubmit it

**Response Example**:
```json
{
  "code": 200,
  "message": "Verification application rejected"
}
```

### 8. Like Management

#### 8.1 Obtain Like List
**Interface Location**: `GET /api/admin/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user display ID |
| target_type | int | No | Target type (1=Note, 2=Comment) |
| sortField | string | No | Sorting field (id, user_id, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 8.2 Create Like
**Interface Location**: `POST /api/admin/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | int | Yes | User ID |
| target_id | int | Yes | Target ID (Note ID or Comment ID) |
| target_type | int | Yes | Target type (1=Note, 2=Comment) |

#### 8.3 Update Like
**Interface Location**: `PUT /api/admin/likes/:id`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| target_type | int | No | Target type (1=Note, 2=Comment) |

#### 8.4 Delete Like
**Interface Location**: `DELETE /api/admin/likes/:id`
**Authentication Required**: Yes

#### 8.5 Batch Delete Likes
**Interface Location**: `DELETE /api/admin/likes`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ids | array | Yes | Array of Like IDs |

#### 8.6 Get Single Like Detail
**Interface Location**: `GET /api/admin/likes/:id`
**Authentication Required**: Yes

### 8. Collection Management

#### 8.1 Get Collection List
**Interface Location**: `GET /api/admin/collections`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user display ID |
| sortBy | string | No | Sorting field (id, user_id, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 8.2 Create Collection
**Interface Location**: `POST /api/admin/collections`
**Authentication Required**: Yes

#### 8.3 Delete Collection
**Interface Location**: `DELETE /api/admin/collections/:id`
**Authentication Required**: Yes

#### 8.4 Batch Delete Collections
**Interface Location**: `DELETE /api/admin/collections`
**Authentication Required**: Yes

### 9. Follow Management

#### 9.1 Get Follow List
**Interface Location**: `GET /api/admin/follows`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user display ID |
| sortField | string | No | Sorting field (id, follower_id, following_id, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 9.2 Create Follow Relationship
**Interface Location**: `POST /api/admin/follows`
**Authentication Required**: Yes

#### 9.3 Delete Follow Relationship

**Interface Location**: `DELETE /api/admin/follows/:id`
**Authentication Required**: Yes

#### 9.4 Batch Delete Follow Relationships
**Interface Location**: `DELETE /api/admin/follows`
**Authentication Required**: Yes

### 10. Notification Management

#### 10.1 Get Notification List
**Interface Location**: `GET /api/admin/notifications`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user's little peach ID |
| type | string | No | Filter by notification type |
| is_read | int | No | Read status (0=Unread, 1=Read) |
| sortField | string | No | Sorting field (id, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 10.2 Create Notification
**Interface Location**: `POST /api/admin/notifications`
**Authentication Required**: Yes

#### 10.3 Update Notification
**Interface Location**: `PUT /api/admin/notifications/:id`
**Authentication Required**: Yes

#### 10.4 Delete Notification
**Interface Location**: `DELETE /api/admin/notifications/:id`
**Authentication Required**: Yes

#### 10.5 Batch Delete Notifications
**Interface Location**: `DELETE /api/admin/notifications`
**Authentication Required**: Yes

### 11. Session Management

#### 11.1 Get Session List
**Interface Location**: `GET /api/admin/sessions`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| user_display_id | string | No | Filter by user's little peach ID |
| is_active | int | No | Active status (0=Inactive, 1=Active) |
| sortField | string | No | Sorting field (id, is_active, expires_at, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 11.2 Create Session
**Interface Location**: `POST /api/admin/sessions`
**Authentication Required**: Yes

#### 11.3 Update Session
**Interface Location**: `PUT /api/admin/sessions/:id`
**Authentication Required**: Yes

#### 11.4 Delete Session
**Interface Location**: `DELETE /api/admin/sessions/:id`
**Authentication Required**: Yes

#### 11.5 Batch Delete Sessions
**Interface Location**: `DELETE /api/admin/sessions`
**Authentication Required**: Yes

### 12. Administrator Management

#### 12.1 Test Interface
**Interface Location**: `GET /api/admin/test-users`
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

#### 12.2 Obtain Admin List
**API Endpoint**: `GET /api/admin/admins` or `GET /api/auth/admin/admins`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| page | int | No | Page number, default 1 |
| limit | int | No | Number of items per page, default 20 |
| username | string | No | Username search |
| sortField | string | No | Sorting field (username, created_at) |
| sortOrder | string | No | Sorting direction (ASC, DESC) |

#### 12.2 Create Admin
**API Endpoint**: `POST /api/admin/admins` or `POST /api/auth/admin/admins`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
| username | string | Yes | Admin username |
| password | string | Yes | Admin password |

#### 12.3 Update Admin
**API Endpoint**: `PUT /api/admin/admins/:id` or `PUT /api/auth/admin/admins/:id`
**Authentication Required**: Yes

#### 12.4 Delete Admin
**API Endpoint**: `DELETE /api/admin/admins/:id` or `DELETE /api/auth/admin/admins/:id`
**Authentication Required**: Yes

#### 12.5 Bulk Delete Admins
**API Endpoint**: `DELETE /api/admin/admins` or `DELETE /api/auth/admin/admins`
**Authentication Required**: Yes

#### 12.6 Modify Admin Password
**API Endpoint**: `PUT /api/auth/admin/admins/:id/password`
**Authentication Required**: Yes (JWT)

#### 12.7 Modify Admin Status
**API Endpoint**: `PUT /api/auth/admin/admins/:id/status`
**Authentication Required**: Yes (JWT)

### 13. Monitoring Management

#### 13.1 Obtain System Activity Monitoring
**API Endpoint**: `GET /api/admin/monitor/activities`
**Authentication Required**: Yes

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|------------|
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

# Obtain user list
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Obtain admin information
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