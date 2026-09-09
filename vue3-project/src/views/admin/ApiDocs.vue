<template>
  <div class="api-docs">
    <div class="docs-header">
      <h2>{{ docTitle }}</h2>
      <div class="docs-info">
        <span v-if="apiVersion" class="version">版本: {{ apiVersion }}</span>
        <span v-if="apiBaseUrl" class="base-url">基础URL: {{ apiBaseUrl }}</span>
        <span v-if="apiUpdatedTime" class="update-time">更新时间: {{ apiUpdatedTime }}</span>
      </div>
    </div>

    <div v-if="loading" class="docs-status">文档加载中...</div>
    <div v-else-if="loadError" class="docs-status error">
      <p>{{ loadError }}</p>
      <button class="retry-btn" @click="loadDocs">重新加载</button>
    </div>

    <div v-else class="docs-content">

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
          <input v-model="searchQuery" type="text" placeholder="搜索API接口（支持路径、标题、描述搜索）..." class="search-input" />
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
              <div v-for="api in group.apis" :key="`${api.method}-${api.path}`" class="api-item">
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
import SvgIcon from '@/components/SvgIcon.vue'
import { getApiDocs } from '@/api/system.js'
import { parseApiGroups, escapeHtml } from '@/utils/markdown.js'

const scrollY = ref(0)
const contentBodyElement = ref(null)
const SCROLL_POSITION_KEY = 'admin_api_docs_scroll_position'

const loading = ref(false)
const loadError = ref('')

const docTitle = ref('小石榴图文社区 API 接口文档')
const apiVersion = ref('')
const apiBaseUrl = ref('')
const apiUpdatedTime = ref('')

const responseFormat = ref('')
const statusCodes = ref([])

const apiGroups = ref([])
const searchQuery = ref('')

const DEFAULT_RESPONSE_FORMAT = `{
  "code": 200,
  "message": "success",
  "data": {}
}`

const DEFAULT_STATUS_CODES = [
  { code: 200, description: '请求成功' },
  { code: 400, description: '请求参数错误' },
  { code: 401, description: '未授权，需要登录' },
  { code: 403, description: '禁止访问' },
  { code: 404, description: '资源不存在' },
  { code: 500, description: '服务器内部错误' }
]

const pickMeta = (raw, pattern) => {
  const m = raw.match(pattern)
  return m ? m[1].replace(/`/g, '').trim() : ''
}

// 从「通用说明」节提取响应格式与状态码说明
const extractCommon = (raw) => {
  const start = raw.indexOf('## 通用说明')
  if (start < 0) {
    responseFormat.value = DEFAULT_RESPONSE_FORMAT
    statusCodes.value = DEFAULT_STATUS_CODES
    return
  }
  const after = raw.indexOf('\n## ', start + 10)
  const section = after < 0 ? raw.slice(start) : raw.slice(start, after)

  const jsonMatch = section.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
  responseFormat.value = jsonMatch ? jsonMatch[1].trim() : DEFAULT_RESPONSE_FORMAT

  const codesPart = section.split('### 状态码说明')[1] || ''
  const list = [...codesPart.matchAll(/^\s*[-*]\s*`?(\d+)`?\s*[:：]\s*(.+)$/gm)].map((m) => ({
    code: Number(m[1]),
    description: m[2].trim()
  }))
  statusCodes.value = list.length ? list : DEFAULT_STATUS_CODES
}

const loadDocs = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await getApiDocs()
    const data = res.data || {}
    if (!data.content) throw new Error('文档内容为空')
    const raw = data.content

    docTitle.value = pickMeta(raw, /^#\s+(.+)$/m) || '小石榴图文社区 API 接口文档'
    apiVersion.value = pickMeta(raw, /^\s*[-*]\s*\*\*版本\*\*\s*[:：]\s*(.+)$/m)
    apiBaseUrl.value = pickMeta(raw, /^\s*[-*]\s*\*\*基础URL\*\*\s*[:：]\s*(.+)$/m)
    apiUpdatedTime.value = pickMeta(raw, /^\s*[-*]\s*\*\*更新时间\*\*\s*[:：]\s*(.+)$/m)

    extractCommon(raw)
    apiGroups.value = parseApiGroups(raw)
  } catch (err) {
    loadError.value = err?.message || '文档加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const toggleApi = (api) => {
  api.expanded = !api.expanded
}

const clearSearch = () => {
  searchQuery.value = ''
}

// 搜索关键词高亮（先转义原文，防止特殊字符破坏正则或注入HTML）
const escapeReg = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const highlightText = (text) => {
  if (!text) return ''
  const query = searchQuery.value.trim()
  const html = escapeHtml(String(text))
  if (!query) return html
  const escaped = escapeHtml(query)
  return html.replace(new RegExp(`(${escapeReg(escaped)})`, 'gi'), '<mark>$1</mark>')
}

// 过滤后的API组
const filteredApiGroups = computed(() => {
  if (!searchQuery.value.trim()) {
    return apiGroups.value
  }

  const filtered = []
  const query = searchQuery.value.toLowerCase()

  apiGroups.value.forEach((group) => {
    const filteredApis = group.apis.filter((api) => {
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

const handleScroll = () => {
  scrollY.value = contentBodyElement.value ? contentBodyElement.value.scrollTop : 0
}

onMounted(() => {
  const contentBody = document.querySelector('.content-body')
  if (contentBody) {
    contentBodyElement.value = contentBody
    scrollY.value = contentBody.scrollTop
    contentBody.addEventListener('scroll', handleScroll)

    // 恢复之前保存的滚动位置
    const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY)
    if (savedScrollPosition) {
      const position = parseInt(savedScrollPosition, 10)
      setTimeout(() => {
        if (contentBodyElement.value) {
          contentBodyElement.value.scrollTop = position
          scrollY.value = position
        }
      }, 100)
    }
  }
  loadDocs()
})

onBeforeUnmount(() => {
  if (contentBodyElement.value) {
    contentBodyElement.value.removeEventListener('scroll', handleScroll)
    sessionStorage.setItem(SCROLL_POSITION_KEY, contentBodyElement.value.scrollTop.toString())
  }
})
</script>

<style scoped>
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
  border: 1.5px solid var(--border-color-primary);
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  caret-color: var(--primary-color);
  background-color: var(--bg-color-secondary);
  color: var(--text-color-primary);
}

.search-input::placeholder {
  color: var(--text-color-quaternary);
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
  background: var(--bg-color-secondary);
  padding: 12px 30px;
  border-left: 4px solid var(--primary-color-shadow);
  margin: 0;
  font-size: 14px;
  color: var(--text-color-primary);
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
  user-select: none;
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
  color: var(--text-color-secondary);
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

.docs-status {
  text-align: center;
  color: var(--text-color-tertiary);
  padding: 60px 20px;
  font-size: 14px;
}

.docs-status.error {
  color: var(--danger-color, #e74c3c);
}

.retry-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  background: var(--primary-color);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
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
