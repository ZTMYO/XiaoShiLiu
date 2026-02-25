<template>
  <div class="api-docs">
    <div class="docs-header">
      <h2>小石榴图文社区 API 接口文档</h2>
      <div class="docs-info">
        <span class="version">版本: v1.3.1</span>
        <span class="base-url">基础URL: http://localhost:3001/</span>
        <span class="update-time">更新时间: 2026-2-14</span>
      </div>
    </div>

    <div class="docs-content">

      <section class="docs-section">
        <h3>通用说明</h3>
        <div class="section-content">
          <h4>响应格式</h4>
          <pre class="code-block">{{ responseFormat }}</pre>

          <h4>状态码说明</h4>
          <table class="status-table">
            <thead>
              <tr>
                <th>状态码</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="status in statusCodes" :key="status.code">
                <td>{{ status.code }}</td>
                <td>{{ status.description }}</td>
              </tr>
            </tbody>
          </table>

          <h4>认证说明</h4>
          <p>需要认证的接口需要在请求头中携带JWT token：</p>
          <pre class="code-block">Authorization: Bearer &lt;your_jwt_token&gt;</pre>

          <h4>分页说明</h4>
          <p>支持分页的接口统一使用以下参数：</p>
          <ul>
            <li><code>page</code> - 页码，默认1</li>
            <li><code>limit</code> - 每页数量，默认20</li>
          </ul>
        </div>
      </section>


      <div class="sticky-search" :class="{ hidden: scrollY < 1000 && !searchQuery }">
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="搜索API接口（支持路径、标题、描述搜索）..." class="search-input"
            @input="handleSearch" />

          <SvgIcon name="search" class="search-icon" />
          <div v-if="searchQuery" class="clear-btn" @click="clearSearch">
            <SvgIcon name="close" />
          </div>
        </div>
      </div>

      <section class="docs-section">
        <h3>API接口列表</h3>
        <div class="api-groups">
          <div v-if="searchQuery && filteredApiGroups.length === 0" class="no-results">
            <p>未找到匹配的API接口</p>
            <p>请尝试其他关键词或清空搜索条件</p>
          </div>
          <div v-for="group in filteredApiGroups" :key="group.name" class="api-group">
            <h4>{{ group.name }}</h4>
            <div v-if="group.description" class="group-description">
              <p>{{ group.description }}</p>
            </div>
            <div class="api-list">
              <div v-for="api in group.apis" :key="api.path" class="api-item">
                <div class="api-header" @click="toggleApi(api)">
                  <span class="method" :class="api.method.toLowerCase()">{{ api.method }}</span>
                  <span class="path" v-html="highlightText(api.path)"></span>
                  <span class="title" v-html="highlightText(api.title)"></span>
                  <span class="toggle">
                    <SvgIcon :name="api.expanded ? 'down' : 'right'" :width="12" :height="12" />
                  </span>
                </div>
                <div v-if="api.expanded" class="api-details">
                  <div v-if="api.description" class="description">
                    <strong>描述：</strong><span v-html="highlightText(api.description)"></span>
                  </div>
                  <div v-if="api.auth" class="auth-required">
                    <strong>需要认证：</strong>是
                  </div>
                  <div v-if="api.params && api.params.length" class="params">
                    <strong>请求参数：</strong>
                    <table class="params-table">
                      <thead>
                        <tr>
                          <th>参数名</th>
                          <th>类型</th>
                          <th>必填</th>
                          <th>说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="param in api.params" :key="param.name">
                          <td>{{ param.name }}</td>
                          <td>{{ param.type }}</td>
                          <td>{{ param.required ? '是' : '否' }}</td>
                          <td>{{ param.description }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-if="api.example" class="example">
                    <strong>响应示例：</strong>
                    <pre class="code-block">{{ api.example }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useScroll } from '@vueuse/core'
import SvgIcon from '@/components/SvgIcon.vue'

// 获取滚动信息 - 在admin页面中，滚动容器是content-body而不是window
const scrollY = ref(0)
const contentBodyElement = ref(null)

// 保存滚动位置的key
const SCROLL_POSITION_KEY = 'admin_api_docs_scroll_position'

onMounted(() => {
  // 获取admin布局中的content-body滚动容器
  const contentBody = document.querySelector('.content-body')
  if (contentBody) {
    contentBodyElement.value = contentBody

    // 初始化scrollY值
    scrollY.value = contentBody.scrollTop

    // 监听滚动事件
    contentBody.addEventListener('scroll', () => {
      scrollY.value = contentBody.scrollTop
    })

    // 恢复之前保存的滚动位置
    const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY)
    if (savedScrollPosition) {
      const position = parseInt(savedScrollPosition, 10)
      // 使用setTimeout确保DOM完全渲染后再滚动
      setTimeout(() => {
        contentBody.scrollTop = position
        // 同步更新scrollY值
        scrollY.value = position
      },
        {
          method: 'GET',
          path: '/api/admin/verifications',
          title: '获取认证申请列表（管理员）',
          description: '管理员获取用户认证申请列表，支持分页、搜索和排序',
          auth: true,
          expanded: false,
          params: [
            { name: 'page', type: 'int', required: false, description: '页码，默认1' },
            { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
            { name: 'search', type: 'string', required: false, description: '搜索关键词（用户名或真实姓名）' },
            { name: 'status', type: 'int', required: false, description: '申请状态筛选（0=待审核，1=已通过，2=已拒绝）' },
            { name: 'type', type: 'int', required: false, description: '认证类型筛选（1=个人认证，2=企业认证）' },
            { name: 'sortField', type: 'string', required: false, description: '排序字段（id, created_at, updated_at）' },
            { name: 'order', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
          ]
        },
        {
          method: 'PUT',
          path: '/api/admin/verifications/:id/approve',
          title: '通过认证申请（管理员）',
          description: '管理员通过用户的认证申请',
          auth: true,
          expanded: false,
          params: [
            { name: 'id', type: 'int', required: true, description: '认证申请ID' },
            { name: 'admin_note', type: 'string', required: false, description: '管理员备注' }
          ]
        },
        {
          method: 'PUT',
          path: '/api/admin/verifications/:id/reject',
          title: '拒绝认证申请（管理员）',
          description: '管理员拒绝用户的认证申请',
          auth: true,
          expanded: false,
          params: [
            { name: 'id', type: 'int', required: true, description: '认证申请ID' },
            { name: 'admin_note', type: 'string', required: true, description: '拒绝原因' }
          ]
        },
        {
          method: 'DELETE',
          path: '/api/admin/verifications/:id',
          title: '删除认证申请（管理员）',
          description: '管理员删除认证申请记录',
          auth: true,
          expanded: false,
          params: [
            { name: 'id', type: 'int', required: true, description: '认证申请ID' }
          ]
        }, 100)
    }
  }
})

// 在组件卸载前保存滚动位置
onBeforeUnmount(() => {
  if (contentBodyElement.value) {
    const currentScrollPosition = contentBodyElement.value.scrollTop
    sessionStorage.setItem(SCROLL_POSITION_KEY, currentScrollPosition.toString())
  }
})

const responseFormat = `{
  "code": 200,
  "message": "success",
  "data": {}
}`

const statusCodes = [
  { code: 200, description: '请求成功' },
  { code: 400, description: '请求参数错误' },
  { code: 401, description: '未授权，需要登录' },
  { code: 403, description: '禁止访问' },
  { code: 404, description: '资源不存在' },
  { code: 500, description: '服务器内部错误' }
]

const apiGroups = ref([
  {
    name: '认证相关接口',
    apis: [
      {
        method: 'POST',
        path: '/api/auth/register',
        title: '用户注册',
        description: '用户注册接口，支持IP属地自动获取',
        expanded: false,
        params: [
          { name: 'user_id', type: 'string', required: true, description: '小石榴号（3-15位，字母数字下划线）' },
          { name: 'nickname', type: 'string', required: true, description: '昵称（2-10位）' },
          { name: 'password', type: 'string', required: true, description: '密码（6-20位）' },
          { name: 'avatar', type: 'string', required: false, description: '头像URL' },
          { name: 'bio', type: 'string', required: false, description: '个人简介' },
          { name: 'location', type: 'string', required: false, description: '所在地（默认使用IP属地）' }
        ],
        example: `{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "user_id": "test123",
      "nickname": "测试用户",
      "avatar": null,
      "bio": null,
      "location": "北京市",
      "verified": 0
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}`
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        title: '用户登录',
        description: '用户登录接口，返回JWT令牌',
        expanded: false,
        params: [
          { name: 'user_display_id', type: 'string', required: true, description: '小石榴号' },
          { name: 'password', type: 'string', required: true, description: '密码' }
        ],
        example: `{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "user_id": "test123",
      "nickname": "测试用户",
      "verified": 0
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600
    }
  }
}`
      },
      {
        method: 'POST',
        path: '/api/auth/refresh',
        title: '刷新令牌',
        description: '使用refresh_token刷新access_token',
        expanded: false,
        params: [
          { name: 'refresh_token', type: 'string', required: true, description: '刷新令牌' }
        ]
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        title: '退出登录',
        description: '用户退出登录，清除会话',
        auth: true,
        expanded: false
      },
      {
        method: 'GET',
        path: '/api/auth/me',
        title: '获取当前用户信息',
        description: '获取当前登录用户的详细信息',
        auth: true,
        expanded: false
      },
      {
        method: 'GET',
        path: '/api/auth/email-config',
        title: '获取邮件功能配置',
        description: '获取当前邮件功能是否启用',
        expanded: false
      },
      {
        method: 'POST',
        path: '/api/auth/send-email-code',
        title: '发送邮箱验证码',
        description: '发送注册用邮箱验证码（仅邮件功能启用时可用）',
        expanded: false,
        params: [
          { name: 'email', type: 'string', required: true, description: '邮箱地址' }
        ]
      },
      {
        method: 'POST',
        path: '/api/auth/bind-email',
        title: '绑定邮箱',
        description: '为当前用户绑定邮箱（仅邮件功能启用时可用）',
        auth: true,
        expanded: false,
        params: [
          { name: 'email', type: 'string', required: true, description: '邮箱地址' },
          { name: 'emailCode', type: 'string', required: true, description: '邮箱验证码' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/auth/unbind-email',
        title: '解除邮箱绑定',
        description: '解除当前用户的邮箱绑定（仅邮件功能启用时可用）',
        auth: true,
        expanded: false
      },
      {
        method: 'POST',
        path: '/api/auth/send-reset-code',
        title: '发送找回密码验证码',
        description: '发送找回密码用邮箱验证码（仅邮件功能启用时可用）',
        expanded: false,
        params: [
          { name: 'email', type: 'string', required: true, description: '已绑定的邮箱地址' }
        ]
      },
      {
        method: 'POST',
        path: '/api/auth/verify-reset-code',
        title: '验证找回密码验证码',
        description: '验证找回密码验证码是否正确（仅邮件功能启用时可用）',
        expanded: false,
        params: [
          { name: 'email', type: 'string', required: true, description: '邮箱地址' },
          { name: 'emailCode', type: 'string', required: true, description: '邮箱验证码' }
        ]
      },
      {
        method: 'POST',
        path: '/api/auth/reset-password',
        title: '重置密码',
        description: '通过邮箱验证码重置密码（仅邮件功能启用时可用）',
        expanded: false,
        params: [
          { name: 'email', type: 'string', required: true, description: '邮箱地址' },
          { name: 'emailCode', type: 'string', required: true, description: '邮箱验证码' },
          { name: 'newPassword', type: 'string', required: true, description: '新密码（6-20位）' }
        ]
      }
    ]
  },
  {
    name: '视频上传接口',
    apis: [
      {
        method: 'POST',
        path: '/api/upload/video',
        title: '视频上传',
        description: '上传视频文件，限制100MB，支持mp4、avi、mov格式',
        auth: true,
        expanded: false,
        params: [
          { name: 'video', type: 'file', required: true, description: '要上传的视频文件（mp4, avi, mov）' }
        ],
        example: `{
  "code": 200,
  "message": "视频上传成功",
  "data": {
    "originalname": "video.mp4",
    "size": 52428800,
    "url": "https://video.example.com/1234567890.mp4",
    "cover": "https://img.example.com/1234567890_cover.jpg",
    "duration": 120
  }
}`
      }
    ]
  },
  {
    name: '用户相关接口',
    apis: [
      {
        method: 'GET',
        path: '/api/users',
        title: '获取用户列表',
        description: '分页获取用户列表',
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/search',
        title: '搜索用户',
        description: '根据关键词搜索用户（昵称或小石榴号）',
        expanded: false,
        params: [
          { name: 'keyword', type: 'string', required: true, description: '搜索关键词' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id',
        title: '获取用户详情',
        description: '根据小石榴号获取用户详细信息',
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '小石榴号' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id/posts',
        title: '获取用户发布的笔记',
        description: '获取指定用户发布的笔记列表',
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '小石榴号' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id/collections',
        title: '获取用户收藏的笔记',
        description: '获取指定用户收藏的笔记列表',
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '小石榴号' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id/likes',
        title: '获取用户点赞的笔记',
        description: '获取指定用户点赞的笔记列表',
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '小石榴号' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'POST',
        path: '/api/users/:id/follow',
        title: '关注用户',
        description: '关注指定用户',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '被关注用户的小石榴号' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/users/:id/follow',
        title: '取消关注',
        description: '取消关注指定用户',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '被取消关注用户的小石榴号' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id/follow-status',
        title: '获取关注状态',
        description: '获取当前用户对指定用户的关注状态',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '目标用户的小石榴号' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id/following',
        title: '获取关注列表',
        description: '获取指定用户的关注列表',
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '小石榴号' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id/followers',
        title: '获取粉丝列表',
        description: '获取指定用户的粉丝列表',
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '小石榴号' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id/mutual-follows',
        title: '获取互相关注列表',
        description: '获取与指定用户互相关注的用户列表',
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '小石榴号' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/:id/stats',
        title: '获取用户统计信息',
        description: '获取指定用户的统计信息（关注数、粉丝数等）',
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '小石榴号' }
        ]
      },
      {
        method: 'POST',
        path: '/api/users/verification',
        title: '提交认证申请',
        description: '用户提交个人或企业认证申请',
        auth: true,
        expanded: false,
        params: [
          { name: 'type', type: 'int', required: true, description: '认证类型：1-个人认证，2-企业认证' },
          { name: 'real_name', type: 'string', required: true, description: '真实姓名/企业名称' },
          { name: 'id_card', type: 'string', required: true, description: '身份证号/营业执照号' },
          { name: 'id_card_front', type: 'string', required: true, description: '身份证正面/营业执照图片URL' },
          { name: 'id_card_back', type: 'string', required: false, description: '身份证背面图片URL（个人认证必填）' },
          { name: 'business_license', type: 'string', required: false, description: '营业执照图片URL（企业认证必填）' },
          { name: 'contact_phone', type: 'string', required: false, description: '联系电话' },
          { name: 'contact_email', type: 'string', required: false, description: '联系邮箱' },
          { name: 'description', type: 'string', required: false, description: '申请说明' }
        ]
      },
      {
        method: 'GET',
        path: '/api/users/verification',
        title: '获取认证申请状态',
        description: '获取当前用户的认证申请状态和详情',
        auth: true,
        expanded: false,
        params: []
      },
      {
        method: 'DELETE',
        path: '/api/users/verification',
        title: '撤回认证申请',
        description: '撤回当前的认证申请（支持待审核、已通过、已拒绝状态）',
        auth: true,
        expanded: false,
        params: []
      }
    ]
  },
  {
    name: '笔记相关接口',
    apis: [
      {
        method: 'GET',
        path: '/api/posts',
        title: '获取笔记列表',
        description: '分页获取笔记列表，支持分类筛选和草稿查看',
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'category', type: 'string', required: false, description: '分类ID筛选，支持"recommend"推荐频道' },
          { name: 'is_draft', type: 'int', required: false, description: '是否获取草稿，1=草稿，0=已发布（默认）' },
          { name: 'user_id', type: 'int', required: false, description: '用户ID筛选（查看草稿时会强制为当前用户）' }
        ]
      },
      {
        method: 'GET',
        path: '/api/posts/:id',
        title: '获取笔记详情',
        description: '根据笔记ID获取笔记详细信息，返回数据包含笔记基本信息、图片列表(images数组)、标签列表、作者信息、点赞收藏状态等',
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID' }
        ]
      },
      {
        method: 'POST',
        path: '/api/posts',
        title: '创建笔记',
        description: '发布新笔记或保存草稿，支持图文和视频两种类型',
        auth: true,
        expanded: false,
        params: [
          { name: 'title', type: 'string', required: false, description: '笔记标题（发布时必填，草稿时可选）' },
          { name: 'content', type: 'string', required: false, description: '笔记内容（发布时必填，草稿时可选）' },
          { name: 'category_id', type: 'int', required: false, description: '分类ID（发布时必填，草稿时可选）' },
          { name: 'type', type: 'int', required: false, description: '笔记类型：1-图文笔记（默认），2-视频笔记' },
          { name: 'images', type: 'array', required: false, description: '图片URL数组（图文笔记使用）' },
          { name: 'video', type: 'object', required: false, description: '视频信息对象（视频笔记使用）' },
          { name: 'tags', type: 'array', required: false, description: '标签名称数组（字符串数组）' },
          { name: 'is_draft', type: 'int', required: false, description: '是否为草稿，1=草稿，0=发布（默认0）' }
        ]
      },
      {
        method: 'GET',
        path: '/api/posts/search',
        title: '搜索笔记',
        description: '根据关键词搜索笔记',
        expanded: false,
        params: [
          { name: 'keyword', type: 'string', required: true, description: '搜索关键词（支持标题和内容搜索）' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'category_id', type: 'int', required: false, description: '分类ID筛选' }
        ]
      },
      {
        method: 'GET',
        path: '/api/posts/drafts',
        title: '获取草稿列表',
        description: '获取当前用户的草稿列表',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'keyword', type: 'string', required: false, description: '搜索关键词' }
        ]
      },
      {
        method: 'GET',
        path: '/api/posts/:id/comments',
        title: '获取笔记评论',
        description: '获取指定笔记的评论列表',
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID（路径参数）' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'sort', type: 'string', required: false, description: '排序方式：desc（降序，默认）或 asc（升序）' }
        ]
      },
      {
        method: 'POST',
        path: '/api/posts/:id/collect',
        title: '收藏笔记',
        description: '收藏指定笔记',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/posts/:id/collect',
        title: '取消收藏',
        description: '取消收藏指定笔记',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/posts/:id',
        title: '更新笔记',
        description: '更新指定笔记的信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID' },
          { name: 'title', type: 'string', required: false, description: '笔记标题（发布时必填，草稿时可选）' },
          { name: 'content', type: 'string', required: false, description: '笔记内容（发布时必填，草稿时可选）' },
          { name: 'category_id', type: 'int', required: false, description: '分类ID（发布时必填，草稿时可选）' },
          { name: 'images', type: 'array', required: false, description: '图片URL数组（图文笔记使用）' },
          { name: 'video', type: 'object', required: false, description: '视频信息对象（视频笔记使用）' },
          { name: 'tags', type: 'array', required: false, description: '标签名称数组（字符串数组）' },
          { name: 'is_draft', type: 'int', required: false, description: '是否为草稿，1=草稿，0=发布（默认0）' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/posts/:id',
        title: '删除笔记',
        description: '删除指定笔记',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID' }
        ]
      }
    ]
  },
  {
    name: '分类管理接口',
    apis: [
      {
        method: 'GET',
        path: '/api/categories',
        title: '获取分类列表',
        description: '获取所有分类列表，支持排序和筛选',
        expanded: false,
        params: [
          { name: 'sortField', type: 'string', required: false, description: '排序字段：id、name、created_at、post_count，默认id' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方式：asc、desc，默认asc' },
          { name: 'name', type: 'string', required: false, description: '按分类名称模糊搜索' },
          { name: 'category_title', type: 'string', required: false, description: '按英文标题模糊搜索' }
        ],
        example: `{
  "code": 200,
  "message": "获取成功",
  "data": [
     {
       "id": 1,
       "name": "生活",
       "category_title": "life",
       "created_at": "2025-08-30T00:00:00.000Z",
       "post_count": 15
     }
   ]
}`
      },
      {
        method: 'GET',
        path: '/api/admin/categories',
        title: '获取分类列表（管理员）',
        description: '管理员获取分类列表，支持分页、排序和筛选',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认10' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段：id、name、category_title、created_at、post_count，默认id' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方式：asc、desc，默认asc' },
          { name: 'name', type: 'string', required: false, description: '按分类名称模糊搜索' },
          { name: 'category_title', type: 'string', required: false, description: '按英文标题模糊搜索' }
        ],
        example: `{
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
}`
      },
      {
        method: 'GET',
        path: '/api/admin/categories/:id',
        title: '获取单个分类（管理员）',
        description: '管理员获取指定分类详情',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '分类ID' }
        ],
        example: `{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "学习",
    "category_title": "study",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}`
      },
      {
        method: 'POST',
        path: '/api/admin/categories',
        title: '创建分类（管理员）',
        description: '管理员创建新分类',
        auth: true,
        expanded: false,
        params: [
          { name: 'name', type: 'string', required: true, description: '分类名称' },
          { name: 'category_title', type: 'string', required: true, description: '英文标题，用于URL路由' }
        ],
        example: `{
  "code": 200,
  "message": "分类创建成功",
  "data": {
     "id": 3,
     "name": "旅游",
     "category_title": "travel"
   }
}`
      },
      {
        method: 'PUT',
        path: '/api/admin/categories/:id',
        title: '更新分类（管理员）',
        description: '管理员更新分类信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '分类ID' },
          { name: 'name', type: 'string', required: false, description: '分类名称' },
          { name: 'category_title', type: 'string', required: false, description: '英文标题，用于URL路由' }
        ],
        example: `{
  "code": 200,
  "message": "分类更新成功",
  "message": "更新成功"
}`
      },
      {
        method: 'DELETE',
        path: '/api/admin/categories/:id',
        title: '删除分类（管理员）',
        description: '管理员删除指定分类',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '分类ID' }
        ],
        example: `{
  "code": 200,
  "message": "分类删除成功"
}`
      },
      {
        method: 'DELETE',
        path: '/api/admin/categories',
        title: '批量删除分类（管理员）',
        description: '管理员批量删除多个分类',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '分类ID数组' }
        ],
        example: `{
  "code": 200,
  "message": "成功删除3个分类",
  "data": {
    "deletedCount": 3
  }
}`
      }
    ]
  },
  {
    name: '评论相关接口',
    apis: [
      {
        method: 'GET',
        path: '/api/posts/:id/comments',
        title: '获取评论列表',
        description: '获取指定笔记的评论列表',
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID（路径参数）' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'sort', type: 'string', required: false, description: '排序方式：desc（降序，默认）或 asc（升序）' }
        ]
      },
      {
        method: 'POST',
        path: '/api/posts/:id/comments',
        title: '发表评论',
        description: '对笔记发表评论或回复评论，会自动创建通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID（路径参数）' },
          { name: 'content', type: 'string', required: true, description: '评论内容（支持@功能的HTML格式）' },
          { name: 'parent_id', type: 'int', required: false, description: '父评论ID（回复评论时使用）' }
        ]
      },
      {
        method: 'GET',
        path: '/api/comments/:id/replies',
        title: '获取子评论列表',
        description: '获取指定评论的回复列表',
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '评论ID' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认10' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/comments/:id',
        title: '删除评论',
        description: '删除指定的评论',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '评论ID' }
        ]
      }
    ]
  },
  {
    name: '互动相关接口',
    apis: [
      {
        method: 'POST',
        path: '/api/likes',
        title: '点赞/取消点赞',
        description: '对笔记或评论进行点赞或取消点赞，会自动创建通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'target_type', type: 'int', required: true, description: '目标类型（1-笔记, 2-评论）' },
          { name: 'target_id', type: 'int', required: true, description: '目标ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/likes',
        title: '取消点赞（兼容接口）',
        description: '取消点赞的兼容接口',
        auth: true,
        expanded: false,
        params: [
          { name: 'target_type', type: 'int', required: true, description: '目标类型（1-笔记, 2-评论）' },
          { name: 'target_id', type: 'int', required: true, description: '目标ID' }
        ]
      },
      {
        method: 'POST',
        path: '/api/collections',
        title: '收藏/取消收藏',
        description: '收藏或取消收藏笔记，支持状态切换',
        auth: true,
        expanded: false,
        params: [
          { name: 'post_id', type: 'int', required: true, description: '笔记ID' }
        ]
      }
    ]
  },
  {
    name: '搜索相关接口',
    apis: [
      {
        method: 'GET',
        path: '/api/search',
        title: '通用搜索',
        description: '搜索笔记和用户，支持关键词和标签筛选，支持按类型过滤',
        expanded: false,
        params: [
          { name: 'keyword', type: 'string', required: false, description: '搜索关键词（支持搜索小石榴号、昵称、标题、正文内容、标签名称）' },
          { name: 'tag', type: 'string', required: false, description: '标签搜索（精确匹配标签名称）' },
          { name: 'type', type: 'string', required: false, description: '搜索类型：all（默认，所有类型）、posts（图文笔记）、videos（视频笔记）、users（用户）' },
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ],
        example: `{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "美丽的风景",
        "content": "今天拍摄的美丽风景照片",
        "author": {
          "id": 1,
          "user_id": "user123",
          "nickname": "摄影师",
          "avatar": "https://example.com/avatar.jpg",
          "verified": 0
        },
        "created_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "users": [
      {
        "id": 2,
        "user_id": "user456",
        "nickname": "旅行者",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "热爱旅行的摄影爱好者",
        "verified": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}`
      }
    ]
  },
  {
    name: '标签相关接口',
    apis: [
      {
        method: 'GET',
        path: '/api/tags',
        title: '获取所有标签',
        description: '获取所有标签列表',
        expanded: false,
        example: `{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "摄影",
      "use_count": 150,
      "created_at": "2025-08-30T00:00:00.000Z"
    }
  ]
}`
      },
      {
        method: 'GET',
        path: '/api/tags/hot',
        title: '获取热门标签',
        description: '获取热门标签列表，按使用次数排序',
        expanded: false,
        params: [
          { name: 'limit', type: 'int', required: false, description: '返回数量，默认10' }
        ],
        example: `{
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
}`
      }
    ]
  },
  {
    name: '统计相关接口',
    apis: [
      {
        method: 'GET',
        path: '/api/stats',
        title: '获取系统统计信息',
        description: '获取系统用户、笔记、评论、点赞等统计数据',
        expanded: false,
        example: `{
  "code": 200,
  "message": "获取统计信息成功",
  "data": {
    "users": 1250,
    "posts": 3420,
    "comments": 8750,
    "likes": 15600
  }
}`
      }
    ]
  },
  {
    name: '健康检查接口',
    apis: [
      {
        method: 'GET',
        path: '/api/health',
        title: '健康检查',
        description: '检查服务器运行状态和运行时间',
        expanded: false,
        example: `{
  "code": 200,
  "message": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600.5
}`
      }
    ]
  },
  {
    name: '监控管理接口',
    apis: [
      {
        method: 'GET',
        path: '/api/admin/monitor/activities',
        title: '获取系统活动监控',
        description: '获取系统活动监控数据，包括新用户、新笔记、新评论、新点赞等统计',
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'date_from', type: 'string', required: false, description: '开始日期（YYYY-MM-DD）' },
          { name: 'date_to', type: 'string', required: false, description: '结束日期（YYYY-MM-DD）' },
          { name: 'activity_type', type: 'string', required: false, description: '活动类型筛选' }
        ],
        example: `{
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
}`
      }
    ]
  },
  {
    name: '通知相关接口',
    description: '通知系统支持以下类型：1-点赞笔记，2-点赞评论，3-收藏，4-评论笔记，5-回复评论，6-关注用户，7-评论提及（在评论中提及用户），8-笔记提及（在笔记中提及用户）',
    apis: [
      {
        method: 'GET',
        path: '/api/notifications',
        title: '获取所有通知',
        description: '获取当前用户的所有通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/notifications/comments',
        title: '获取评论通知',
        description: '获取评论相关的通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ],
        example: `{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": 4,
        "sender_id": 2,
        "from_nickname": "用户2",
        "from_avatar": "https://example.com/avatar2.jpg",
        "from_verified": 0,
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
}`
      },
      {
        method: 'GET',
        path: '/api/notifications/likes',
        title: '获取点赞通知',
        description: '获取点赞相关的通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ],
        example: `{
  "code": 200,
  "message": "success",
  "data": {
    "notifications": [
      {
        "id": 2,
        "type": 1,
        "sender_id": 3,
        "from_nickname": "用户3",
        "from_avatar": "https://example.com/avatar3.jpg",
        "from_verified": 0,
        "post_title": "笔记标题",
        "post_author_id": "author_001",
        "target_type": 1,
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
}`
      },
      {
        method: 'GET',
        path: '/api/notifications/follows',
        title: '获取关注通知',
        description: '获取关注相关的通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/notifications/collections',
        title: '获取收藏通知',
        description: '获取收藏相关的通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'GET',
        path: '/api/notifications/unread-count',
        title: '获取未读通知数量',
        description: '获取当前用户的未读通知数量',
        auth: true,
        expanded: false
      },
      {
        method: 'PUT',
        path: '/api/notifications/:id/read',
        title: '标记通知为已读',
        description: '将指定通知标记为已读',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '通知ID' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/notifications/read-all',
        title: '标记所有通知为已读',
        description: '将所有通知标记为已读',
        auth: true,
        expanded: false
      },
      {
        method: 'DELETE',
        path: '/api/notifications/:id',
        title: '删除通知',
        description: '删除指定的通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '通知ID' }
        ]
      }
    ]
  },
  {
    name: '图片上传接口',
    apis: [
      {
        method: 'POST',
        path: '/api/upload/single',
        title: '单图片上传',
        description: '上传单个图片文件，限制5MB',
        auth: true,
        expanded: false,
        params: [
          { name: 'file', type: 'file', required: true, description: '要上传的图片文件（jpg, jpeg, png, webp）' }
        ],
        example: `{
  "code": 200,
  "message": "上传成功",
  "data": {
    "originalname": "image.jpg",
    "size": 1024000,
    "url": "https://img.example.com/1234567890.jpg"
  }
}`
      },
      {
        method: 'POST',
        path: '/api/upload/multiple',
        title: '多图片上传',
        description: '上传多个图片文件，最多9个，每个限制5MB',
        auth: true,
        expanded: false,
        params: [
          { name: 'files', type: 'file[]', required: true, description: '要上传的图片文件数组' }
        ],
        example: `{
  "code": 200,
  "message": "上传成功",
  "data": [
    {
      "originalname": "image1.jpg",
      "size": 1024000,
      "url": "https://img.example.com/1234567890.jpg"
    },
    {
      "originalname": "image2.jpg",
      "size": 2048000,
      "url": "https://img.example.com/1234567891.jpg"
    }
  ]
}`
      }
    ]
  },
  {
    name: '统计相关接口',
    apis: [
      {
        method: 'GET',
        path: '/api/stats',
        title: '获取统计数据',
        description: '获取平台整体统计数据',
        expanded: false,
        example: `{
  "code": 200,
  "message": "success",
  "data": {
    "users": 1250,
    "posts": 3420,
    "comments": 8960,
    "likes": 15680
  }
}`
      }
    ]
  },


  {
    name: '管理员相关接口',
    apis: [
      {
        method: 'POST',
        path: '/api/auth/admin/login',
        title: '管理员登录',
        description: '管理员登录接口，返回JWT令牌',
        expanded: false,
        params: [
          { name: 'username', type: 'string', required: true, description: '管理员用户名' },
          { name: 'password', type: 'string', required: true, description: '管理员密码' }
        ],
        example: `{
  "code": 200,
  "message": "登录成功",
  "data": {
    "admin": {
      "id": 1,
      "username": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}`
      },
      {
        method: 'GET',
        path: '/api/auth/admin/me',
        title: '获取当前管理员信息',
        description: '获取当前登录管理员的信息',
        auth: true,
        expanded: false,
        example: `{
  "code": 200,
  "message": "success",
  "data": {
    "username": "admin"
  }
}`
      },
      {
        method: 'GET',
        path: '/api/auth/admin/admins',
        title: '获取管理员列表（认证路由）',
        description: '通过认证路由获取管理员列表',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' }
        ]
      },
      {
        method: 'POST',
        path: '/api/auth/admin/admins',
        title: '创建管理员（认证路由）',
        description: '通过认证路由创建新管理员',
        auth: true,
        expanded: false,
        params: [
          { name: 'username', type: 'string', required: true, description: '管理员用户名' },
          { name: 'password', type: 'string', required: true, description: '管理员密码' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/auth/admin/admins/:id',
        title: '更新管理员（认证路由）',
        description: '通过认证路由更新管理员信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '管理员用户名' },
          { name: 'password', type: 'string', required: false, description: '新密码' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/auth/admin/admins/:id',
        title: '删除管理员（认证路由）',
        description: '通过认证路由删除指定管理员',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '管理员用户名' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/test-users',
        title: '测试接口（管理员）',
        description: '临时测试接口，用于检查用户数据',
        auth: true,
        expanded: false
      },
      {
        method: 'GET',
        path: '/api/admin/users',
        title: '获取用户列表（管理员）',
        description: '管理员获取用户列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（用户名或昵称）' },
          { name: 'user_display_id', type: 'string', required: false, description: '按小石榴号筛选' },
          { name: 'status', type: 'int', required: false, description: '状态筛选（1=活跃，0=禁用）' },
          { name: 'ban_status', type: 'string', required: false, description: '封禁状态筛选（normal=正常，banned=封禁）' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, fans_count, like_count, created_at）' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/users',
        title: '创建用户（管理员）',
        description: '管理员创建新用户',
        auth: true,
        expanded: false,
        params: [
          { name: 'user_id', type: 'string', required: true, description: '小石榴号' },
          { name: 'nickname', type: 'string', required: true, description: '昵称' },
          { name: 'password', type: 'string', required: true, description: '密码' },
          { name: 'avatar', type: 'string', required: false, description: '头像URL' },
          { name: 'bio', type: 'string', required: false, description: '个人简介' },
          { name: 'location', type: 'string', required: false, description: '所在地' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/users/:id',
        title: '更新用户（管理员）',
        description: '管理员更新用户信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '用户ID' },
          { name: 'nickname', type: 'string', required: false, description: '昵称' },
          { name: 'avatar', type: 'string', required: false, description: '头像URL' },
          { name: 'bio', type: 'string', required: false, description: '个人简介' },
          { name: 'location', type: 'string', required: false, description: '所在地' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/users/:id',
        title: '删除用户（管理员）',
        description: '管理员删除指定用户',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '用户ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/users',
        title: '批量删除用户（管理员）',
        description: '管理员批量删除用户',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '用户ID数组' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/users/:id/ban',
        title: '封禁用户（管理员）',
        description: '管理员封禁指定用户，自动设置is_active为0',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '用户ID' },
          { name: 'reason', type: 'string', required: true, description: '封禁原因' },
          { name: 'end_time', type: 'string', required: false, description: '封禁结束时间（格式：YYYY-MM-DD HH:MM:SS，留空为永久封禁）' }
        ],
        example: `{
  "code": 200,
  "message": "用户封禁成功"
}`
      },
      {
        method: 'POST',
        path: '/api/admin/users/:id/unban',
        title: '解封用户（管理员）',
        description: '管理员解封指定用户，自动恢复is_active为1',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '用户ID' }
        ],
        example: `{
  "code": 200,
  "message": "用户解封成功"
}`
      },
      {
        method: 'GET',
        path: '/api/admin/posts',
        title: '获取笔记列表（管理员）',
        description: '管理员获取笔记列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（标题或内容）' },
          { name: 'user_display_id', type: 'string', required: false, description: '按作者小石榴号筛选' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, like_count, comment_count, created_at）' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/posts',
        title: '创建笔记（管理员）',
        description: '管理员创建新笔记',
        auth: true,
        expanded: false,
        params: [
          { name: 'title', type: 'string', required: true, description: '笔记标题' },
          { name: 'content', type: 'string', required: true, description: '笔记内容' },
          { name: 'category_id', type: 'int', required: false, description: '分类ID' },
          { name: 'user_display_id', type: 'string', required: true, description: '发布用户小石榴号' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/posts/:id',
        title: '更新笔记（管理员）',
        description: '管理员更新笔记信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID' },
          { name: 'title', type: 'string', required: false, description: '笔记标题' },
          { name: 'content', type: 'string', required: false, description: '笔记内容' },
          { name: 'category_id', type: 'int', required: false, description: '分类ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/posts/:id',
        title: '删除笔记（管理员）',
        description: '管理员删除指定笔记',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '笔记ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/posts',
        title: '批量删除笔记（管理员）',
        description: '管理员批量删除笔记',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '笔记ID数组' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/comments',
        title: '获取评论列表（管理员）',
        description: '管理员获取评论列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（评论内容）' },
          { name: 'user_display_id', type: 'string', required: false, description: '按评论者小石榴号筛选' },
          { name: 'post_id', type: 'int', required: false, description: '按笔记ID筛选' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, like_count, created_at）' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/comments',
        title: '创建评论（管理员）',
        description: '管理员创建新评论',
        auth: true,
        expanded: false,
        params: [
          { name: 'post_id', type: 'int', required: true, description: '笔记ID' },
          { name: 'content', type: 'string', required: true, description: '评论内容' },
          { name: 'user_id', type: 'int', required: true, description: '评论用户ID' },
          { name: 'parent_id', type: 'int', required: false, description: '父评论ID' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/comments/:id',
        title: '更新评论（管理员）',
        description: '管理员更新评论内容',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '评论ID' },
          { name: 'content', type: 'string', required: true, description: '评论内容' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/comments/:id',
        title: '删除评论（管理员）',
        description: '管理员删除指定评论',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '评论ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/comments',
        title: '批量删除评论（管理员）',
        description: '管理员批量删除评论',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '评论ID数组' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/tags',
        title: '获取标签列表（管理员）',
        description: '管理员获取标签列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（标签名称）' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, use_count, created_at）' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/tags',
        title: '创建标签（管理员）',
        description: '管理员创建新标签',
        auth: true,
        expanded: false,
        params: [
          { name: 'name', type: 'string', required: true, description: '标签名称' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/tags/:id',
        title: '更新标签（管理员）',
        description: '管理员更新标签信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '标签ID' },
          { name: 'name', type: 'string', required: true, description: '标签名称' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/tags/:id',
        title: '删除标签（管理员）',
        description: '管理员删除指定标签',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '标签ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/tags',
        title: '批量删除标签（管理员）',
        description: '管理员批量删除标签',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '标签ID数组' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/audit',
        title: '获取认证申请列表（管理员）',
        description: '管理员获取认证申请列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'type', type: 'int', required: false, description: '认证类型筛选（1-个人认证，2-企业认证）' },
          { name: 'status', type: 'int', required: false, description: '审核状态筛选（0-待审核，1-已通过，2-已拒绝）' },
          { name: 'user_display_id', type: 'string', required: false, description: '用户小石榴号搜索' },
          { name: 'real_name', type: 'string', required: false, description: '真实姓名搜索' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, created_at, audit_time）' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/audit/:id',
        title: '获取认证申请详情（管理员）',
        description: '管理员获取指定认证申请的详细信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '认证申请ID' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/audit/:id/approve',
        title: '审核通过认证申请（管理员）',
        description: '管理员审核通过认证申请，用户认证状态将更新为已认证',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '认证申请ID' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/audit/:id/reject',
        title: '审核拒绝认证申请（管理员）',
        description: '管理员审核拒绝认证申请，需要提供拒绝原因',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '认证申请ID' },
          { name: 'reject_reason', type: 'string', required: true, description: '拒绝原因' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/likes',
        title: '获取点赞列表（管理员）',
        description: '管理员获取点赞列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（用户名）' },
          { name: 'user_display_id', type: 'string', required: false, description: '按用户小石榴号筛选' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, user_id, created_at）' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/likes',
        title: '创建点赞（管理员）',
        description: '管理员创建点赞记录',
        auth: true,
        expanded: false,
        params: [
          { name: 'user_display_id', type: 'string', required: true, description: '用户小石榴号' },
          { name: 'target_type', type: 'int', required: true, description: '目标类型（1-笔记, 2-评论）' },
          { name: 'target_id', type: 'int', required: true, description: '目标ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/likes/:id',
        title: '删除点赞（管理员）',
        description: '管理员删除指定点赞记录',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '点赞ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/likes',
        title: '批量删除点赞（管理员）',
        description: '管理员批量删除点赞记录',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '点赞ID数组' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/collections',
        title: '获取收藏列表（管理员）',
        description: '管理员获取收藏列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（用户名或笔记标题）' },
          { name: 'user_display_id', type: 'string', required: false, description: '按用户小石榴号筛选' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, user_id, created_at）' },
          { name: 'sortOrder', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/collections',
        title: '创建收藏（管理员）',
        description: '管理员创建收藏记录',
        auth: true,
        expanded: false,
        params: [
          { name: 'user_display_id', type: 'string', required: true, description: '用户小石榴号' },
          { name: 'post_id', type: 'int', required: true, description: '笔记ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/collections/:id',
        title: '删除收藏（管理员）',
        description: '管理员删除指定收藏记录',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '收藏ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/collections',
        title: '批量删除收藏（管理员）',
        description: '管理员批量删除收藏记录',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '收藏ID数组' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/follows',
        title: '获取关注列表（管理员）',
        description: '管理员获取关注列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（用户名）' },
          { name: 'user_display_id', type: 'string', required: false, description: '按用户小石榴号筛选' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, follower_id, following_id, created_at）' },
          { name: 'order', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/follows',
        title: '创建关注（管理员）',
        description: '管理员创建关注关系',
        auth: true,
        expanded: false,
        params: [
          { name: 'follower_id', type: 'int', required: true, description: '关注者ID' },
          { name: 'following_id', type: 'int', required: true, description: '被关注者ID' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/follows/:id',
        title: '更新关注（管理员）',
        description: '管理员更新关注关系',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '关注ID' },
          { name: 'following_id', type: 'int', required: true, description: '新的被关注者ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/follows/:id',
        title: '删除关注（管理员）',
        description: '管理员删除指定关注关系',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '关注ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/follows',
        title: '批量删除关注（管理员）',
        description: '管理员批量删除关注关系',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '关注ID数组' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/notifications',
        title: '获取通知列表（管理员）',
        description: '管理员获取通知列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（通知内容）' },
          { name: 'user_display_id', type: 'string', required: false, description: '按接收用户小石榴号筛选' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（username, created_at）' },
          { name: 'order', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/notifications',
        title: '创建通知（管理员）',
        description: '管理员创建系统通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'user_display_id', type: 'string', required: true, description: '接收用户小石榴号' },
          { name: 'type', type: 'string', required: true, description: '通知类型' },
          { name: 'content', type: 'string', required: true, description: '通知内容' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/notifications/:id',
        title: '更新通知（管理员）',
        description: '管理员更新通知信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '通知ID' },
          { name: 'content', type: 'string', required: false, description: '通知内容' },
          { name: 'is_read', type: 'boolean', required: false, description: '是否已读' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/notifications/:id',
        title: '删除通知（管理员）',
        description: '管理员删除指定通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '通知ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/notifications',
        title: '批量删除通知（管理员）',
        description: '管理员批量删除通知',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '通知ID数组' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/sessions',
        title: '获取会话列表（管理员）',
        description: '管理员获取用户会话列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（用户名或IP）' },
          { name: 'user_display_id', type: 'string', required: false, description: '按用户小石榴号筛选' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, created_at, last_activity）' },
          { name: 'order', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/sessions',
        title: '创建会话（管理员）',
        description: '管理员创建用户会话',
        auth: true,
        expanded: false,
        params: [
          { name: 'user_display_id', type: 'string', required: true, description: '用户小石榴号' },
          { name: 'user_agent', type: 'string', required: false, description: '用户代理' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/sessions/:id',
        title: '更新会话（管理员）',
        description: '管理员更新会话信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '会话ID' },
          { name: 'is_active', type: 'boolean', required: false, description: '是否活跃' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/sessions/:id',
        title: '删除会话（管理员）',
        description: '管理员删除指定会话',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'int', required: true, description: '会话ID' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/sessions',
        title: '批量删除会话（管理员）',
        description: '管理员批量删除会话',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '会话ID数组' }
        ]
      },
      {
        method: 'GET',
        path: '/api/admin/admins',
        title: '获取管理员列表',
        description: '获取管理员列表，支持分页、搜索和排序',
        auth: true,
        expanded: false,
        params: [
          { name: 'page', type: 'int', required: false, description: '页码，默认1' },
          { name: 'limit', type: 'int', required: false, description: '每页数量，默认20' },
          { name: 'search', type: 'string', required: false, description: '搜索关键词（用户名）' },
          { name: 'sortField', type: 'string', required: false, description: '排序字段（id, created_at）' },
          { name: 'order', type: 'string', required: false, description: '排序方向（asc, desc），默认desc' }
        ]
      },
      {
        method: 'POST',
        path: '/api/admin/admins',
        title: '创建管理员',
        description: '创建新的管理员账号',
        auth: true,
        expanded: false,
        params: [
          { name: 'username', type: 'string', required: true, description: '管理员用户名' },
          { name: 'password', type: 'string', required: true, description: '管理员密码' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/admin/admins/:id',
        title: '更新管理员',
        description: '更新管理员信息',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '管理员用户名' },
          { name: 'password', type: 'string', required: true, description: '新密码' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/admins/:id',
        title: '删除管理员',
        description: '删除指定管理员',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '管理员用户名' }
        ]
      },
      {
        method: 'DELETE',
        path: '/api/admin/admins',
        title: '批量删除管理员',
        description: '批量删除管理员账号',
        auth: true,
        expanded: false,
        params: [
          { name: 'ids', type: 'array', required: true, description: '管理员用户名数组' }
        ]
      },
      {
        method: 'PUT',
        path: '/api/auth/admin/admins/:id/password',
        title: '修改管理员密码',
        description: '修改指定管理员的密码',
        auth: true,
        expanded: false,
        params: [
          { name: 'id', type: 'string', required: true, description: '管理员用户名' },
          { name: 'password', type: 'string', required: true, description: '新密码' }
        ]
      }
    ]
  }
])

const toggleApi = (api) => {
  api.expanded = !api.expanded
}

// 搜索相关
const searchQuery = ref('')
const searchResults = ref([])

// 搜索处理函数
const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase()
  const results = []

  apiGroups.value.forEach(group => {
    group.apis.forEach(api => {
      const matchPath = api.path.toLowerCase().includes(query)
      const matchTitle = api.title.toLowerCase().includes(query)
      const matchDescription = api.description && api.description.toLowerCase().includes(query)

      if (matchPath || matchTitle || matchDescription) {
        results.push({
          ...api,
          groupName: group.name
        })
      }
    })
  })

  searchResults.value = results
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

// 高亮搜索关键词
const highlightText = (text) => {
  if (!searchQuery.value.trim() || !text) return text

  const query = searchQuery.value.trim()
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 过滤后的API组
const filteredApiGroups = computed(() => {
  if (!searchQuery.value.trim()) {
    return apiGroups.value
  }

  const filtered = []
  const query = searchQuery.value.toLowerCase()

  apiGroups.value.forEach(group => {
    const filteredApis = group.apis.filter(api => {
      const matchPath = api.path.toLowerCase().includes(query)
      const matchTitle = api.title.toLowerCase().includes(query)
      const matchDescription = api.description && api.description.toLowerCase().includes(query)

      return matchPath || matchTitle || matchDescription
    })

    if (filteredApis.length > 0) {
      filtered.push({
        ...group,
        apis: filteredApis
      })
    }
  })

  return filtered
})
</script>

<style scoped>
* {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.api-docs {
  margin: 0 auto;
}

.docs-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-shadow) 100%);
  color: white;
  padding: 30px;
  margin-bottom: 30px;
}

.docs-header h2 {
  margin: 0 0 15px 0;
  font-size: 28px;
}

.docs-info {
  display: flex;
  gap: 30px;
  font-size: 14px;
  opacity: 0.9;
  flex-wrap: wrap;
}

/* 吸顶搜索框样式 */
.sticky-search {
  position: fixed;
  top: 101px;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 15px 20px;
  transition: all 0.3s ease;
}

.sticky-search.hidden {
  display: none;
}

.search-box {
  position: relative;
  max-width: 400px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 10px 45px 10px 45px;
  border: 1px solid var(--border-color-primary);
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  caret-color: var(--primary-color);
  background-color: var(--bg-color-secondary);
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 5px var(--primary-color-shadow);
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-tertiary);
  font-size: 16px;
  pointer-events: none;
  width: 20px;
  height: 20px;
}

.clear-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-tertiary);
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-btn svg {
  width: 16px;
  height: 16px;
}

.clear-btn:hover {
  background-color: var(--bg-color-tertiary);
  color: var(--text-color-primary);
}

.no-results {
  text-align: center;
  color: var(--text-color-tertiary);
  padding: 40px 20px;
  font-size: 14px;
}

.no-results p {
  margin: 8px 0;
  line-height: 1.5;
}

.no-results p:first-child {
  font-weight: 500;
  color: var(--text-color-secondary);
}

.search-stats {
  text-align: center;
  color: #28a745;
  margin-top: 15px;
  font-size: 14px;
  font-weight: 500;
}

/* 高亮样式 */
mark {
  background-color: #fff3cd;
  color: #856404;
  padding: 1px 2px;
  border-radius: 2px;
}

.docs-content {
  background: var(--bg-color-primary);
  border-radius: 8px;
  overflow: hidden;
}

.docs-section {
  border-bottom: 1px solid var(--border-color-primary);
}

.docs-section:last-child {
  border-bottom: none;
}

.docs-section h3 {
  background-color: var(--bg-color-secondary);
  margin: 0;
  padding: 20px 30px;
  font-size: 20px;
  color: var(--text-color-primary);
  border-bottom: 1px solid var(--border-color-primary);
}

.section-content {
  padding: 30px;
}

.section-content h4 {
  color: var(--text-color-primary);
  margin: 20px 0 15px 0;
  font-size: 16px;
}

.section-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.section-content li {
  margin-bottom: 5px;
}

.code-block {
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  overflow-x: auto;
  margin: 10px 0;
  white-space: pre-wrap;
}

.status-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.status-table th,
.status-table td {
  border: 1px solid var(--border-color-primary);
  padding: 12px;
  text-align: left;
}

.status-table th {
  background-color: var(--bg-color-secondary);
  font-weight: 600;
}

.api-groups {
  padding: 0;
}

.api-group {
  margin-bottom: 0;
}

.api-group h4 {
  background-color: var(--bg-color-secondary);
  margin: 0;
  padding: 15px 30px;
  font-size: 18px;
  color: var(--text-color-primary);
  border-bottom: 1px solid var(--border-color-primary);
}

.group-description {
  background: #f0f8ff;
  padding: 12px 30px;
  border-left: 4px solid #007bff;
  margin: 0;
  font-size: 14px;
  color: #495057;
  border-bottom: 1px solid var(--border-color-primary);
}

.group-description p {
  margin: 0;
  line-height: 1.5;
}

.api-list {
  padding: 0;
}

.api-item {
  border-bottom: 1px solid var(--border-color-primary);
}

.api-item:last-child {
  border-bottom: none;
}

.api-header {
  display: flex;
  align-items: center;
  padding: 15px 30px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.api-header:hover {
  background-color: var(--bg-color-secondary);
}

.method {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  min-width: 60px;
  text-align: center;
  margin-right: 15px;
}

.method.get {
  background-color: #28a745;
}

.method.post {
  background-color: #007bff;
}

.method.put {
  background-color: #ffc107;
  color: #212529;
}

.method.delete {
  background-color: var(--primary-color);
}

.path {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: var(--text-color-primary);
  margin-right: 15px;
  min-width: 250px;
}

.title {
  flex: 1;
  color: var(--text-color-primary);
  font-weight: 500;
}



.api-details {
  padding: 20px 30px;
  background-color: var(--bg-color-secondary);
  border-top: 1px solid var(--border-color-primary);
}

.description,
.auth-required {
  margin-bottom: 15px;
  color: #495057;
}

.auth-required {
  color: var(--primary-color);
}

.params {
  margin-bottom: 20px;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 14px;
}

.params-table th,
.params-table td {
  border: 1px solid var(--text-color-tertiary);
  padding: 8px 12px;
  text-align: left;
}

.params-table th {
  background-color: var(--bg-color-secondary);
  font-weight: 600;
}

.example {
  margin-top: 20px;
}

.example .code-block {
  background-color: var(--bg-color-primary);
  border: 1px solid var(--border-color-primary);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .docs-header {
    padding: 20px 15px;
  }

  .docs-header h2 {
    font-size: 22px;
    margin-bottom: 10px;
  }

  .docs-info {
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
  }

  .section-content {
    padding: 20px 15px;
  }

  .docs-section h3 {
    padding: 15px 15px;
    font-size: 18px;
  }

  .api-group h4 {
    padding: 12px 15px;
    font-size: 16px;
  }

  .api-header {
    padding: 12px 15px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .path {
    min-width: auto;
    font-size: 12px;
    word-break: break-all;
    flex: 1;
    margin-right: 8px;
  }

  .title {
    font-size: 14px;
    width: 100%;
    margin-top: 4px;
  }

  .method {
    font-size: 10px;
    padding: 3px 6px;
    min-width: 50px;
    margin-right: 8px;
  }

  .api-details {
    padding: 15px;
  }

  .params-table,
  .status-table {
    font-size: 12px;
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  .params-table th,
  .params-table td,
  .status-table th,
  .status-table td {
    padding: 6px 8px;
  }

  .code-block {
    font-size: 12px;
    padding: 10px;
    overflow-x: auto;
  }

  .sticky-search {
    padding: 10px 15px;
  }

  .search-input {
    font-size: 14px;
    padding: 8px 40px 8px 40px;
  }

  .search-icon {
    width: 18px;
    height: 18px;
  }

  .clear-btn {
    width: 18px;
    height: 18px;
  }

  .clear-btn svg {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 480px) {
  .docs-header {
    padding: 15px 10px;
  }

  .docs-header h2 {
    font-size: 20px;
  }

  .section-content {
    padding: 15px 10px;
  }

  .docs-section h3 {
    padding: 12px 10px;
    font-size: 16px;
  }

  .api-group h4 {
    padding: 10px;
    font-size: 15px;
  }

  .api-header {
    padding: 10px;
  }

  .api-details {
    padding: 10px;
  }

  .sticky-search {
    padding: 8px 10px;
  }
}
</style>