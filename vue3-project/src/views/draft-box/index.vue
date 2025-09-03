<template>
  <div class="draft-box-container">

    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="handleBack">
          <SvgIcon name="left" width="20" height="20" />
        </button>
        <h1 class="page-title">草稿箱</h1>
      </div>
      <div class="header-right">
        <span class="post-count">共 {{ totalDrafts }} 篇草稿</span>
      </div>
    </div>


    <div class="filter-section">
      <div class="search-box">
        <SvgIcon name="search" width="16" height="16" class="search-icon" />
        <input v-model="searchKeyword" type="text" placeholder="搜索草稿标题或内容" @input="handleSearch" />
      </div>
      <div class="filter-options">
        <DropdownSelect v-model="selectedCategory" :options="categoryOptions" placeholder="全部分类" label-key="name"
          value-key="id" min-width="120px" max-width="150px" @change="handleCategoryChange" />
      </div>
    </div>


    <div class="drafts-section">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="drafts.length === 0" class="empty-state">
        <SvgIcon name="empty" width="80" height="80" class="empty-icon" />
        <p>暂无草稿</p>
        <button class="create-btn" @click="goToPublish">
          <SvgIcon name="publish" width="16" height="16" />
          创建第一篇草稿
        </button>
      </div>

      <div v-else class="posts-list">
        <div v-for="draft in drafts" :key="draft.id" class="post-item">
          <div class="post-thumbnail">
            <img
              v-if="(draft.originalData?.images && draft.originalData.images.length > 0) || (draft.images && draft.images.length > 0)"
              :src="(draft.originalData?.images && draft.originalData.images[0]) || (draft.images && draft.images[0]) || draft.image"
              alt="草稿图片" @error="handleImageError" />
            <div v-else class="no-image">
              <SvgIcon name="image" width="24" height="24" />
            </div>
          </div>

          <div class="post-info">
            <h3 class="post-title">{{ draft.title }}</h3>
            <p class="post-content">{{ truncateContent(draft.content) }}</p>
            <div class="post-meta">
              <span class="category" v-if="draft.category">{{ getCategoryName(draft.category) }}</span>
              <span class="date">{{ formatDate(draft.originalData?.createdAt || draft.created_at) }}</span>
            </div>
          </div>

          <div class="post-actions">
            <button class="action-btn edit-btn" @click="editDraft(draft)">
              <SvgIcon name="edit" width="16" height="16" />
              编辑
            </button>
            <button class="action-btn delete-btn" @click="confirmDelete(draft)">
              <SvgIcon name="delete" width="16" height="16" />
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
          <SvgIcon name="left" width="16" height="16" />
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
          <SvgIcon name="right" width="16" height="16" />
        </button>
      </div>
    </div>



    <!-- 删除确认弹窗 -->
    <ConfirmModal :visible="showDeleteModal" title="确认删除" message="确定要删除这篇草稿吗？删除后无法恢复。" type="warning" confirm-text="删除"
      cancel-text="取消" @confirm="handleDelete" @cancel="showDeleteModal = false"
      @update:visible="showDeleteModal = $event" />

    <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getDraftPosts, deletePost, updatePost } from '@/api/posts'

import SvgIcon from '@/components/SvgIcon.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import MessageToast from '@/components/MessageToast.vue'
import ConfirmModal from '@/components/ConfirmDialog.vue'


const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const drafts = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalDrafts = ref(0)
const searchKeyword = ref('')
const selectedCategory = ref('')

// 弹窗状态
const showDeleteModal = ref(false)
const selectedDraft = ref(null)

// 消息提示
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// 分类数据
const categories = ref([
  { id: 'study', name: '学习' },
  { id: 'campus', name: '校园' },
  { id: 'emotion', name: '情感' },
  { id: 'interest', name: '兴趣' },
  { id: 'life', name: '生活' },
  { id: 'social', name: '社交' },
  { id: 'help', name: '求助' },
  { id: 'opinion', name: '观点' },
  { id: 'graduation', name: '毕业' },
  { id: 'career', name: '职场' }
])

// 下拉选择器选项
const categoryOptions = computed(() => [
  { id: '', name: '全部分类' },
  ...categories.value
])

// 消息提示方法
const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

const handleToastClose = () => {
  showToast.value = false
}

// 返回按钮 - 跳转到空表单的发布页面
const handleBack = () => {
  router.push('/publish')
}

// 跳转到发布页面
const goToPublish = () => {
  router.push('/publish')
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) return ''
  // 确保categoryId是字符串类型进行比较
  const categoryIdStr = String(categoryId)
  // 如果是general分类，显示为"未知分类"
  if (categoryIdStr === 'general') return '未知分类'
  const category = categories.value.find(c => c.id === categoryIdStr)
  return category ? category.name : categoryIdStr
}

// 截断内容
const truncateContent = (content) => {
  if (!content) return ''
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) {
    return '未知时间'
  }

  const date = new Date(dateString)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '未知时间'
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}分钟前`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}小时前`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

// 加载草稿列表
const loadDrafts = async () => {
  try {
    loading.value = true

    // 检查用户是否已登录
    if (!userStore.userInfo || !userStore.userInfo.id) {
      showMessage('请先登录', 'error')
      return
    }

    const params = {
      page: currentPage.value,
      limit: 10,
      keyword: searchKeyword.value,
      category: selectedCategory.value,
      sort: 'created_at',
      user_id: userStore.userInfo.id
    }

    const response = await getDraftPosts(params)
    if (response.success) {
      drafts.value = response.data.posts
      totalPages.value = response.data.pagination.pages
      totalDrafts.value = response.data.pagination.total
    } else {
      showMessage(response.message || '加载失败', 'error')
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
    showMessage('加载草稿失败', 'error')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadDrafts()
}

// 分类筛选处理
const handleCategoryChange = (event) => {
  selectedCategory.value = event.value
  currentPage.value = 1
  loadDrafts()
}

// 分页处理
const changePage = (page) => {
  currentPage.value = page
  loadDrafts()
}

// 编辑草稿 - 跳转到发布页面
const editDraft = (draft) => {
  // 跳转到发布页面并传递草稿数据
  router.push({
    path: '/publish',
    query: {
      draftId: draft.id,
      mode: 'edit'
    }
  })
}

// 确认删除
const confirmDelete = (draft) => {
  selectedDraft.value = draft
  showDeleteModal.value = true
}

// 处理删除
const handleDelete = async () => {
  try {
    const response = await deletePost(selectedDraft.value.id)
    if (response.success) {
      showMessage('删除成功', 'success')
      loadDrafts() // 重新加载列表
    } else {
      showMessage(response.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showMessage('删除失败，请重试', 'error')
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  const img = event.target
  const container = img.parentElement

  // 隐藏原图片
  img.style.display = 'none'

  // 如果容器中还没有占位符，则添加一个
  if (!container.querySelector('.error-placeholder')) {
    const placeholder = document.createElement('div')
    placeholder.className = 'error-placeholder no-image'
    placeholder.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>'
    container.appendChild(placeholder)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  // 初始化用户信息
  userStore.initUserInfo()
  loadDrafts()
})
</script>

<style scoped>
* {
  transition: background 0.2s ease, border-color 0.2s ease;
}

.draft-box-container {
  min-height: 100vh;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  margin-top: 72px;
  padding-bottom: calc(48px + constant(safe-area-inset-bottom));
  padding-bottom: calc(48px + env(safe-area-inset-bottom));
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-color-primary);
  border-bottom: 1px solid var(--border-color-primary);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-right {
  display: flex;
  align-items: center;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.back-btn:hover {
  background: var(--bg-color-secondary);
}

.page-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color-primary);
}

.post-count {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-color-primary);
  border-bottom: 1px solid var(--border-color-primary);
  gap: 1rem;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-secondary);
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.search-box input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-box input::placeholder {
  color: var(--text-color-secondary);
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.drafts-section {
  padding: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color-primary);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.create-btn:hover {
  background: var(--primary-color-dark);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-color-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color-primary);
  transition: all 0.2s ease;
}

.post-item:hover {
  border-color: var(--primary-color);
}

.post-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.post-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  background: var(--bg-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
}

.post-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color-primary);
  line-height: 1.4;
}

.post-content {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin: 0;
  line-height: 1.5;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.category {
  background: var(--primary-color);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.date {
  margin-left: auto;
}

.post-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.edit-btn {
  background: var(--primary-color);
  color: white;
}

.edit-btn:hover {
  opacity: 0.8;
}

.delete-btn {
  background: var(--primary-color);
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color-primary);
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}



/* 响应式设计 */
@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .search-box {
    max-width: none;
  }

  .filter-options {
    justify-content: flex-start;
  }

  .post-item {
    flex-direction: column;
  }

  .post-thumbnail {
    width: 100%;
    height: 200px;
  }

  .post-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 0.75rem;
  }

  .drafts-section {
    padding: 0.75rem;
  }

  .post-item {
    padding: 0.75rem;
  }


}
</style>