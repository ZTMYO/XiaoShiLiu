<template>
  <div class="crud-table">

    <div class="table-header">
      <div class="header-left">

        <div class="search-bar" v-if="searchFields.length > 0">
          <div class="search-inputs">
            <!-- 下拉菜单字段 -->
            <div v-for="field in selectFields" :key="field.key" class="search-field">
              <div class="custom-select" @click="toggleDropdown(field.key)">
                <span class="select-value">{{ getSelectedLabel(field) || field.placeholder }}</span>
                <SvgIcon name="down" class="select-arrow" :class="{ rotated: openDropdown === field.key }" />
                <div v-if="openDropdown === field.key" class="select-options">
                  <div v-for="option in field.options" :key="option.value" class="select-option"
                    :class="{ selected: searchParams[field.key] === option.value }"
                    @click.stop="selectOption(field.key, option.value)">
                    {{ option.label }}
                  </div>
                </div>
              </div>
            </div>
            <!-- 输入框字段 -->
            <div v-for="field in inputFields" :key="field.key" class="search-field">
              <input v-model="searchParams[field.key]" :type="field.type || 'text'" :placeholder="field.placeholder" />
            </div>
          </div>
          <button @click="handleSearch" class="btn btn-outline btn-sm">筛选</button>
          <button @click="clearSearch" class="btn btn-outline btn-sm">清空</button>
        </div>
      </div>
      <div class="table-actions">
        <template v-if="!batchMode">
          <button @click="toggleBatchMode" class="btn btn-danger">
            <SvgIcon name="delete" />
            批量删除
          </button>
        </template>
        <template v-else>
          <button @click="batchDelete" class="btn btn-danger" :disabled="selectedItems.length === 0">
            <SvgIcon name="delete" />
            确认删除 ({{ selectedItems.length }})
          </button>
          <button @click="toggleBatchMode" class="btn btn-outline">
            取消
          </button>
        </template>
        <button @click="createItem" class="btn btn-primary">
          <SvgIcon name="publish" />
          新增{{ entityName }}
        </button>
        <button @click="refreshData" class="btn btn-secondary">
          <SvgIcon name="reload" />
          刷新
        </button>
      </div>
    </div>


    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th v-if="batchMode" class="checkbox-column">
              <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" />
            </th>
            <th v-for="column in columns" :key="column.key">
              <div class="th-content">
                <span>{{ column.label }}</span>
                <div v-if="column.sortable !== false" class="sort-buttons">
                  <button @click="handleSort(column.key, 'asc')"
                    :class="['sort-btn', { active: sortField === column.key && sortOrder === 'asc' }]" title="升序">
                    ▲
                  </button>
                  <button @click="handleSort(column.key, 'desc')"
                    :class="['sort-btn', { active: sortField === column.key && sortOrder === 'desc' }]" title="降序">
                    ▼
                  </button>
                </div>
              </div>
            </th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data" :key="item.id">
            <td v-if="batchMode" class="checkbox-column">
              <input type="checkbox" :value="item.id" v-model="selectedItems" />
            </td>
            <td v-for="column in columns" :key="column.key">
              <span v-if="column.type === 'image' && item[column.key]">
                <img :src="item[column.key]" alt="图片" class="table-image" @click="showImageModal(item[column.key])" />
              </span>
              <span v-else-if="column.type === 'image-gallery'">
                <span v-if="loadingGallery === item.id" class="loading-text">
                  加载中...
                </span>
                <span v-else class="content-link" @click="showImageGallery(item.id)" :title="'查看笔记图片'">
                  图片
                </span>
              </span>
              <span v-else-if="column.type === 'date'">
                {{ formatDate(item[column.key]) }}
              </span>
              <span v-else-if="column.type === 'mapped'">
                {{ column.map && column.map[item[column.key]] ? column.map[item[column.key]] : item[column.key] || '-'
                }}
              </span>
              <span v-else-if="column.type === 'boolean'">
                {{ item[column.key] ? (column.trueText || '是') : (column.falseText || '否') }}
              </span>
              <span v-else-if="column.type === 'array' && Array.isArray(item[column.key])">
                {{ item[column.key].join(', ') }}
              </span>
              <span v-else-if="column.type === 'user-link' && item[column.key]">
                <span class="user-link" @click="openUserProfile(item, column.key)" :title="'查看用户个人主页'">
                  {{ item[column.key] }}
                </span>
              </span>
              <span v-else-if="column.type === 'content' && item[column.key]">
                <span class="content-link" @click="showDetail(item, column)" :title="'查看' + column.label">
                  {{ column.label }}
                </span>
              </span>
              <span v-else-if="column.type === 'tags'">
                <span class="content-link" @click="showTags(item)" :title="'查看笔记标签'">
                  标签 ({{ item[column.key] ? item[column.key].length : 0 }})
                </span>
              </span>
              <span v-else-if="column.type === 'personality-tags'">
                <span class="content-link" @click="showPersonalityTags(item)" :title="'查看个性标签'">
                  个性标签
                </span>
              </span>
              <span v-else-if="column.maxLength && item[column.key] && item[column.key].length > column.maxLength">
                <span class="truncated-content" @click="showDetail(item, column)" :title="'查看' + column.label">
                  {{ item[column.key].substring(0, column.maxLength) }}...
                </span>
              </span>
              <span v-else>
                {{ item[column.key] || '-' }}
              </span>
            </td>
            <td>
              <SvgIcon name="edit" @click="editItem(item)" class="action-icon" />
              <SvgIcon name="delete" @click="deleteItem(item)" class="action-icon" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <div class="pagination" v-if="pagination.total > 0">
      <div class="pagination-info">
        共 {{ pagination.total }} 条记录，第 {{ pagination.page }} / {{ pagination.pages }} 页
      </div>
      <div class="pagination-controls">
        <button @click="changePage(pagination.page - 1)" @mouseenter="preloadPage(pagination.page - 1)"
          :disabled="pagination.page <= 1" class="btn btn-sm btn-outline">
          上一页
        </button>
        <span class="page-numbers">
          <button v-for="page in getPageNumbers()" :key="page" @click="changePage(page)" @mouseenter="preloadPage(page)"
            :class="['btn', 'btn-sm', page === pagination.page ? 'btn-primary' : 'btn-outline']">
            {{ page }}
          </button>
        </span>
        <button @click="changePage(pagination.page + 1)" @mouseenter="preloadPage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.pages" class="btn btn-sm btn-outline">
          下一页
        </button>
      </div>
    </div>


    <DetailModal v-model:visible="showDetailModal" :title="detailTitle" :content="detailContent"
      @close="closeDetailModal" />


    <ImageModal v-model:visible="showImageModalVisible" :image-url="currentImage" @close="closeImageModal" />


    <ImageCarousel v-model:visible="showImageCarouselVisible" :images="currentImages" @close="closeImageCarousel" />


    <TagsModal v-model:visible="showTagsModalVisible" :title="tagsModalTitle" :tags="currentTags"
      @close="closeTagsModal" />


    <PersonalityTagsModal v-model:visible="showPersonalityTagsModalVisible" :user-data="currentUserData"
      @close="closePersonalityTagsModal" />


    <FormModal v-model:visible="showFormModal" :title="`${showCreateModal ? '新增' : '编辑'}${entityName}`"
      :form-fields="formFields" v-model:form-data="formData" :confirm-text="showCreateModal ? '创建' : '更新'"
      :loading="formLoading" @submit="submitForm" @close="closeModals" />


    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <SvgIcon name="loading" />
        <span>加载中...</span>
      </div>
    </div>


    <ConfirmDialog v-model:visible="confirmState.visible" :title="confirmState.title" :message="confirmState.message"
      :type="confirmState.type" :confirm-text="confirmState.confirmText" :cancel-text="confirmState.cancelText"
      :show-cancel="confirmState.showCancel" @confirm="handleConfirm" @cancel="handleCancel" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, onUnmounted } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import DetailModal from './DetailModal.vue'
import FormModal from './FormModal.vue'
import ImageModal from './ImageModal.vue'
import ImageCarousel from './ImageCarousel.vue'
import TagsModal from './TagsModal.vue'
import PersonalityTagsModal from './PersonalityTagsModal.vue'
import apiConfig from '@/config/api.js'
import { useConfirm } from '../composables/useConfirm'
import messageManager from '@/utils/messageManager'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  entityName: {
    type: String,
    required: true
  },
  apiEndpoint: {
    type: String,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  formFields: {
    type: Array,
    required: true
  },
  searchFields: {
    type: Array,
    default: () => []
  },
  defaultSortField: {
    type: String,
    default: ''
  },
  defaultSortOrder: {
    type: String,
    default: ''
  }
})

// 确认弹框
const { confirmState, handleConfirm, handleCancel, confirmDelete, showError } = useConfirm()



// 获取认证头
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }

  // 统一使用JWT token认证
  const adminToken = localStorage.getItem('admin_token')
  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`
  }

  return headers
}

const data = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const detailTitle = ref('')
const detailContent = ref('')
const showImageModalVisible = ref(false)
const currentImage = ref('')
const showImageCarouselVisible = ref(false)
const currentImages = ref([])
const loadingGallery = ref(null)
const showTagsModalVisible = ref(false)
const currentTags = ref([])
const tagsModalTitle = ref('')
const showPersonalityTagsModalVisible = ref(false)
const currentUserData = ref({})
const formData = ref({})
const editingItem = ref(null)
const formLoading = ref(false)
const searchParams = reactive({})
const sortField = ref(props.defaultSortField)
const sortOrder = ref(props.defaultSortOrder)
const openDropdown = ref(null)

// 分离下拉菜单和输入框字段
const selectFields = computed(() => {
  return props.searchFields.filter(field => field.type === 'select')
})

const inputFields = computed(() => {
  return props.searchFields.filter(field => field.type !== 'select')
})

// 批量删除相关
const batchMode = ref(false)
const selectedItems = ref([])

// 表单模态框显示控制
const showFormModal = computed({
  get: () => showCreateModal.value || showEditModal.value,
  set: (value) => {
    if (!value) {
      showCreateModal.value = false
      showEditModal.value = false
    }
  }
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

// 预加载缓存
const pageCache = ref(new Map())
const preloadingPages = ref(new Set())

// 初始化搜索参数
props.searchFields.forEach(field => {
  searchParams[field.key] = ''
})

// 重置表单数据的方法
const resetFormData = () => {
  // 直接创建一个全新的对象来替换
  const newFormData = {}

  // 为笔记类型初始化必要的字段
  if (props.apiEndpoint === '/admin/posts') {
    newFormData.image_urls = []
    newFormData.images = []
    newFormData.tags = []
  }

  // 完全替换formData的值
  formData.value = newFormData
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.custom-select')) {
    openDropdown.value = null
  }
}

onMounted(() => {
  loadData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const loadData = async (targetPage = null, useCache = true) => {
  const pageToLoad = targetPage || pagination.page

  // 生成缓存键
  const cacheKey = generateCacheKey(pageToLoad)

  // 如果使用缓存且缓存中有数据，直接使用缓存
  if (useCache && pageCache.value.has(cacheKey)) {
    const cachedData = pageCache.value.get(cacheKey)
    if (!targetPage) {
      // 只有当前页才更新显示数据
      data.value = cachedData.data
      Object.assign(pagination, cachedData.pagination)
    }
    return cachedData
  }

  if (!targetPage) {
    loading.value = true
  }

  try {
    const params = new URLSearchParams({
      page: pageToLoad,
      limit: pagination.limit,
      ...searchParams
    })

    // 添加排序参数
    if (sortField.value && sortOrder.value) {
      params.append('sortBy', sortField.value)
      params.append('sortOrder', sortOrder.value)
    }

    // 使用配置的API地址
    const response = await fetch(`${apiConfig.baseURL}${props.apiEndpoint}?${params}`, {
      headers: getAuthHeaders()
    })
    const result = await response.json()

    if (result.code === 200) {
      const responseData = {
        data: result.data.data || result.data,
        pagination: result.data.pagination || {
          page: pageToLoad,
          limit: pagination.limit,
          total: pagination.total,
          pages: pagination.pages
        }
      }

      // 缓存数据
      pageCache.value.set(cacheKey, responseData)

      if (!targetPage) {
        // 只有当前页才更新显示数据
        data.value = responseData.data
        Object.assign(pagination, responseData.pagination)
      }

      return responseData
    } else {
      console.error('加载数据失败:', result.message)
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    if (!targetPage) {
      loading.value = false
    }
  }
}

// 生成缓存键
const generateCacheKey = (page) => {
  const searchKey = Object.entries(searchParams)
    .filter(([key, value]) => value !== '')
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
  const sortKey = sortField.value && sortOrder.value ? `${sortField.value}:${sortOrder.value}` : ''
  return `${page}-${searchKey}-${sortKey}`
}

// 预加载页面数据
const preloadPage = async (page) => {
  // 检查页面是否有效
  if (typeof page !== 'number' || page < 1 || page > pagination.pages || page === pagination.page) {
    return
  }

  // 防止重复预加载
  if (preloadingPages.value.has(page)) {
    return
  }

  const cacheKey = generateCacheKey(page)

  // 如果已经缓存，不需要预加载
  if (pageCache.value.has(cacheKey)) {
    return
  }

  preloadingPages.value.add(page)

  try {
    await loadData(page, false)
  } catch (error) {
    console.error(`预加载第 ${page} 页失败:`, error)
  } finally {
    preloadingPages.value.delete(page)
  }
}

// 清除缓存
const clearCache = () => {
  pageCache.value.clear()
  preloadingPages.value.clear()
}

const refreshData = () => {
  clearCache()
  pagination.page = 1
  loadData()
}

const handleSearch = () => {
  clearCache()
  pagination.page = 1
  loadData()
}

const clearSearch = () => {
  props.searchFields.forEach(field => {
    searchParams[field.key] = ''
  })
  openDropdown.value = null
  clearCache()
  pagination.page = 1
  loadData()
}

// 下拉菜单相关方法
const toggleDropdown = (fieldKey) => {
  openDropdown.value = openDropdown.value === fieldKey ? null : fieldKey
}

const selectOption = (fieldKey, value) => {
  searchParams[fieldKey] = value
  openDropdown.value = null
  // 立即执行筛选
  handleSearch()
}

const getSelectedLabel = (field) => {
  const selectedValue = searchParams[field.key]
  if (!selectedValue) return ''
  const option = field.options.find(opt => opt.value === selectedValue)
  return option ? option.label : ''
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.pages) {
    pagination.page = page
    loadData()
  }
}

const getPageNumbers = () => {
  const pages = []
  const current = pagination.page
  const total = pagination.pages

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }

  return pages.filter(page => page !== '...' || pages.indexOf(page) === pages.lastIndexOf(page))
}

const createItem = () => {
  editingItem.value = null

  // 使用彻底重置方法清空表单数据
  resetFormData()

  showCreateModal.value = true
}

const editItem = async (item) => {
  editingItem.value = item

  // 如果是笔记编辑，需要先获取完整的笔记详情
  if (props.apiEndpoint === '/admin/posts') {
    try {
      const response = await fetch(`${apiConfig.baseURL}${props.apiEndpoint}/${item.id}`, {
        headers: getAuthHeaders()
      })
      const result = await response.json()

      if (result.code === 200) {
        const fullItem = result.data
        // 创建新的formData对象
        const newFormData = {}

        // 复制完整数据，特殊处理标签和图片字段
        Object.keys(fullItem).forEach(key => {
          if (key === 'tags') {
            // 确保标签是字符串数组格式，处理对象数组转换
            if (Array.isArray(fullItem[key])) {
              newFormData[key] = fullItem[key].map(tag =>
                typeof tag === 'object' ? tag.name : tag
              )
            } else {
              newFormData[key] = []
            }
          } else if (key === 'images') {
            // 对于MultiImageUpload组件，将images数组设置为image_urls
            const images = Array.isArray(fullItem[key]) ? fullItem[key] : []
            newFormData['image_urls'] = images
            // 不设置images字段，避免重复数据
          } else {
            newFormData[key] = fullItem[key]
          }
        })

        // 替换整个formData
        formData.value = newFormData
      } else {
        console.error('获取笔记详情失败:', result.message)
        // 如果获取失败，使用原有数据
        const newFormData = {}
        Object.keys(item).forEach(key => {
          if (key === 'tags') {
            // 确保标签是字符串数组格式，处理对象数组转换
            if (Array.isArray(item[key])) {
              newFormData[key] = item[key].map(tag =>
                typeof tag === 'object' ? tag.name : tag
              )
            } else {
              newFormData[key] = []
            }
          } else if (key === 'images') {
            // 对于MultiImageUpload组件，将images数组设置为image_urls
            const images = Array.isArray(item[key]) ? item[key] : []
            newFormData['image_urls'] = images
            // 不设置images字段，避免重复数据
          } else {
            newFormData[key] = item[key]
          }
        })
        formData.value = newFormData
      }
    } catch (error) {
      console.error('获取笔记详情失败:', error)
      // 如果获取失败，使用原有数据
      const newFormData = {}
      Object.keys(item).forEach(key => {
        if (key === 'tags') {
          // 确保标签是字符串数组格式，处理对象数组转换
          if (Array.isArray(item[key])) {
            newFormData[key] = item[key].map(tag =>
              typeof tag === 'object' ? tag.name : tag
            )
          } else {
            newFormData[key] = []
          }
        } else if (key === 'images') {
          // 对于MultiImageUpload组件，不设置images字段
          const images = Array.isArray(item[key]) ? item[key] : []
          newFormData['image_urls'] = images
        } else {
          newFormData[key] = item[key]
        }
      })
      formData.value = newFormData
    }
  } else {
    // 其他类型的编辑，直接复制数据
    const newFormData = {}
    Object.keys(item).forEach(key => {
      if (key === 'tags') {
        // 确保标签是字符串数组格式，处理对象数组转换
        if (Array.isArray(item[key])) {
          newFormData[key] = item[key].map(tag =>
            typeof tag === 'object' ? tag.name : tag
          )
        } else {
          newFormData[key] = []
        }
      } else if (key === 'interests') {
        // 处理interests字段：如果是字符串，尝试解析为数组
        if (typeof item[key] === 'string') {
          try {
            newFormData[key] = JSON.parse(item[key])
          } catch {
            // 如果解析失败，按逗号分割
            newFormData[key] = item[key] ? item[key].split(',').map(s => s.trim()).filter(s => s) : []
          }
        } else {
          newFormData[key] = Array.isArray(item[key]) ? item[key] : []
        }
      } else if (key === 'images') {
        // 对于MultiImageUpload组件，将images数组设置为image_urls
        const images = Array.isArray(item[key]) ? item[key] : []
        newFormData['image_urls'] = images
        // 不设置images字段，避免重复数据
      } else {
        newFormData[key] = item[key]
      }
    })
    formData.value = newFormData
  }

  showEditModal.value = true
}

const deleteItem = async (item) => {
  try {
    await confirmDelete(props.entityName)
    // 用户确认删除
    try {
      const response = await fetch(`${apiConfig.baseURL}${props.apiEndpoint}/${item.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const result = await response.json()
      if (result.code === 200) {
        // 清除缓存并刷新数据
        clearCache()
        loadData(null, false)
      } else {
        await showError('删除失败: ' + result.message)
      }
    } catch (error) {
      console.error('删除失败:', error)
      await showError('删除失败')
    }
  } catch (error) {
    // 用户取消删除，不做任何操作
  }
}

const submitForm = async (data) => {
  formLoading.value = true
  try {
    // interests字段已经是数组格式，无需额外处理

    const url = showCreateModal.value
      ? `${apiConfig.baseURL}${props.apiEndpoint}`
      : `${apiConfig.baseURL}${props.apiEndpoint}/${editingItem.value.id}`

    const method = showCreateModal.value ? 'POST' : 'PUT'

    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (result.code === 200) {
      // 显示成功提示
      const action = showCreateModal.value ? '创建' : '更新'
      messageManager.success(`${props.entityName}${action}成功`)
      closeModals()
      // 清除缓存并刷新数据
      clearCache()
      loadData(null, false)
    } else {
      await showError('操作失败: ' + result.message)
    }
  } catch (error) {
    console.error('操作失败:', error)
    await showError('操作失败')
  } finally {
    formLoading.value = false
  }
}

const updateFormData = (newData) => {
  // 直接替换整个对象
  if (newData && typeof newData === 'object') {
    formData.value = { ...newData }
  } else {
    formData.value = {}
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingItem.value = null

  // 使用彻底重置方法清空表单数据
  resetFormData()
}

const showDetail = (item, column) => {
  detailTitle.value = `查看${column.label} - ${props.entityName} ID: ${item.id}`
  detailContent.value = item[column.key] || ''
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  detailTitle.value = ''
  detailContent.value = ''
}

const showImageModal = (imageUrl) => {
  currentImage.value = imageUrl
  showImageModalVisible.value = true
}

const closeImageModal = () => {
  showImageModalVisible.value = false
  currentImage.value = ''
}

const showImageGallery = async (postId) => {
  loadingGallery.value = postId
  try {
    const response = await fetch(`${apiConfig.baseURL}/posts/${postId}`, {
      headers: getAuthHeaders()
    })
    const result = await response.json()

    if (result.code === 200) {
      // 从笔记详情中提取图片信息，转换为原来的格式
      const images = result.data.images.map((imageUrl, index) => ({
        id: index + 1,
        image_url: imageUrl
      }))
      currentImages.value = images
      showImageCarouselVisible.value = true
    } else {
      console.error('获取笔记图片失败:', result.message)
      await showError('获取笔记图片失败: ' + result.message)
    }
  } catch (error) {
    console.error('获取笔记图片失败:', error)
    await showError('获取笔记图片失败: ' + error.message)
  } finally {
    loadingGallery.value = null
  }
}

const closeImageCarousel = () => {
  showImageCarouselVisible.value = false
  currentImages.value = []
}

const showTags = (item) => {
  currentTags.value = item.tags || []
  tagsModalTitle.value = `笔记标签 - ${item.title || 'ID: ' + item.id}`
  showTagsModalVisible.value = true
}

const closeTagsModal = () => {
  showTagsModalVisible.value = false
  currentTags.value = []
  tagsModalTitle.value = ''
}

const showPersonalityTags = async (item) => {
  try {
    // 调用API获取个性标签数据
    const response = await fetch(`${apiConfig.baseURL}/users/${item.id}/personality-tags`, {
      headers: getAuthHeaders()
    })

    if (response.ok) {
      const result = await response.json()
      if (result.code === 200) {
        currentUserData.value = {
          ...item,
          personalityTags: result.data
        }
      } else {
        console.error('获取个性标签失败:', result.message)
        currentUserData.value = {
          ...item,
          personalityTags: null
        }
      }
    } else {
      console.error('API请求失败:', response.status)
      currentUserData.value = {
        ...item,
        personalityTags: null
      }
    }
  } catch (error) {
    console.error('获取个性标签出错:', error)
    currentUserData.value = {
      ...item,
      personalityTags: null
    }
  }

  showPersonalityTagsModalVisible.value = true
}

const closePersonalityTagsModal = () => {
  showPersonalityTagsModalVisible.value = false
  currentUserData.value = {}
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 打开用户个人主页
const openUserProfile = async (item, fieldKey) => {
  try {
    let userDisplayId = null

    // 根据点击的字段获取对应的小石榴号
    if (fieldKey) {
      userDisplayId = item[fieldKey]
    } else {
      // 兼容旧的调用方式
      if (props.apiEndpoint === '/admin/users') {
        userDisplayId = item.user_id
      } else {
        userDisplayId = item.user_display_id || item.sender_display_id
      }
    }

    if (userDisplayId) {
      // 构建主站用户个人主页URL
      const userProfileUrl = `${window.location.origin}/user/${userDisplayId}`
      // 在新标签页中打开
      window.open(userProfileUrl, '_blank')
    } else {
      console.error('无法获取用户的小石榴号，字段:', fieldKey, '数据:', item)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const handleSort = (field, order) => {
  clearCache()
  sortField.value = field
  sortOrder.value = order
  pagination.page = 1
  loadData()
}

const getSelectedOptionLabel = (field, value) => {
  if (!field.options || !value) return ''
  const option = field.options.find(opt => opt.value === value)
  return option ? option.label : value
}

// 批量删除相关方法
const toggleBatchMode = () => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    selectedItems.value = []
  }
}

const isAllSelected = computed(() => {
  return data.value.length > 0 && selectedItems.value.length === data.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = data.value.map(item => item.id)
  }
}

const batchDelete = async () => {
  if (selectedItems.value.length === 0) {
    await showError('请选择要删除的项目')
    return
  }

  try {
    await confirmDelete(props.entityName, selectedItems.value.length)
    // 用户确认删除
    try {
      const response = await fetch(`${apiConfig.baseURL}${props.apiEndpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ids: selectedItems.value
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.code === 200) {
        selectedItems.value = []
        batchMode.value = false
        // 清除缓存并刷新数据
        clearCache()
        loadData(null, false)
      } else {
        throw new Error(result.message || '删除失败')
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      await showError('批量删除失败: ' + error.message)
    }
  } catch (error) {
    // 用户取消删除，不做任何操作
  }
}
</script>

<style scoped>
.crud-table {
  background: var(--bg-color-primary);
  border-radius: 0;
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 30px;
  border-bottom: 1px solid var(--border-color-primary);
  background-color: var(--bg-color-secondary);
  gap: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
}

.table-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.search-bar {
  display: flex;
  align-items: flex-end;
  gap: 15px;
  flex-wrap: wrap;
}

.search-actions {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.search-actions .btn {
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.search-inputs {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-field input {
  padding: 6px 10px;
  border: 1px solid var(--border-color-secondary);
  background-color: var(--bg-color-secondary);
  border-radius: 999px;
  font-size: 12px;
  min-width: 120px;
  height: 32px;
  color: var(--text-color-primary);
  box-sizing: border-box;
}

.search-field input:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* 下拉菜单样式 */
.custom-select {
  position: relative;
  display: inline-block;
  min-width: 120px;
  height: 34px;
  cursor: pointer;
  justify-content: center;
}

.select-value {
  display: flex;
  align-items: center;
  padding: 6px 30px 6px 10px;
  border: 1px solid var(--border-color-secondary);
  background-color: var(--bg-color-secondary);
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 32px;
  box-sizing: border-box;
}

.custom-select:hover .select-value {
  border-color: var(--primary-color);
}

.select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  color: var(--text-color-secondary);
  transition: transform 0.2s;
  pointer-events: none;
}

.select-arrow.rotated {
  transform: translateY(-50%) rotate(180deg);
}

.select-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-color-primary);
  border: 1px solid var(--border-color-secondary);
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 2px;
}

.select-option {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-color-primary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-option:hover {
  background-color: var(--bg-color-secondary);
}

.select-option.selected {
  background-color: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-weight: 500;
}

.table-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color-primary);
  word-wrap: break-word;
  vertical-align: top;
}

.data-table th {
  background-color: var(--bg-color-secondary);
  font-weight: 600;
  color: var(--text-color-primary);
  width: auto;
}

.data-table tr:hover {
  background-color: var(--bg-color-secondary);
}

/* checkbox列样式 */
.checkbox-column {
  width: 50px !important;
  text-align: center;
  padding: 12px 8px !important;
}

/* 操作列样式 */
.data-table th:last-child,
.data-table td:last-child {
  width: 50px;
  text-align: center;
  white-space: nowrap;
}

.checkbox-column input[type="checkbox"] {
  cursor: pointer;
  transform: scale(1.2);
}

.checkbox-column input[type="checkbox"]:checked {
  accent-color: var(--primary-color);
}

.table-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.table-image:hover {
  transform: scale(1.1);
}

.pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 20px 30px;
  border-top: 1px solid var(--border-color-primary);
  background-color: var(--bg-color-secondary);
}

.pagination-info {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.pagination-controls button,
.page-numbers button {
  user-select: none;
  transition: all 0.2s ease;
}

.pagination-controls button:hover:not(:disabled),
.page-numbers button:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: var(--text-color-inverse);
  transform: translateY(-1px);
}

.page-numbers button.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-color);
  opacity: 0.9;
}



.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--overlay-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-color-secondary);
}

.loading-spinner svg {
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-color-dark);
}

.btn-secondary {
  background-color: var(--text-color-tertiary);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--text-color-secondary);
}

.btn-outline {
  background-color: transparent;
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color-primary);
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--bg-color-secondary);
}

.btn-danger {
  background-color: #f61c1c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn svg {
  width: 14px;
  height: 14px;
}

.action-icon {
  width: 24px;
  height: 24px;
  color: var(--text-color-secondary);
  cursor: pointer;
}

.action-icon:hover:not(:disabled) {
  background-color: var(--bg-color-secondary);
  color: var(--primary-color);
}

/* 详情相关样式 */
.truncated-content,
.content-link,
.user-link {
  color: var(--text-color-secondary);
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

.truncated-content:hover,
.content-link:hover,
.user-link:hover {
  color: var(--primary-color);
}

.loading-text {
  color: var(--text-color-tertiary);
  font-style: italic;
}

/* 表格头部排序样式 */
.th-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.sort-buttons {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}

.sort-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  color: var(--text-color-secondary);
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1;
  border-radius: 2px;
  width: 16px;
  height: 12px;
}

.sort-btn:hover {
  color: var(--primary-color);
  background-color: var(--bg-color-tertiary);
}

.sort-btn.active {
  color: var(--primary-color);
  background-color: var(--bg-color-tertiary);
}
</style>