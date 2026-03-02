<template>
  <div class="post-management-container">

    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="handleBack">
          <SvgIcon name="left" width="20" height="20" />
        </button>
        <h1 class="page-title">笔记管理</h1>
      </div>
      <div class="header-right">
        <span class="post-count">共 {{ totalPosts }} 篇笔记</span>
      </div>
    </div>


    <div class="filter-section">
      <div class="search-box">
        <SvgIcon name="search" width="16" height="16" class="search-icon" />
        <input v-model="searchKeyword" type="text" placeholder="搜索笔记标题或内容" @input="handleSearch" />
      </div>
      <div class="filter-options">
        <DropdownSelect v-model="selectedCategory" :options="categoryOptions" placeholder="全部分类" label-key="label"
          value-key="value" min-width="120px" max-width="150px" @change="handleCategoryChange" />
      </div>
    </div>


    <div class="posts-section">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="posts.length === 0" class="empty-state">
        <SvgIcon name="empty" width="80" height="80" class="empty-icon" />
        <p>暂无笔记</p>
        <button class="create-btn" @click="goToPublish">
          <SvgIcon name="publish" width="16" height="16" />
          发布第一篇笔记
        </button>
      </div>

      <div v-else class="posts-list">
        <PostItem 
          v-for="post in posts" 
          :key="post.id" 
          :post="post"
          @edit="editPost"
          @delete="confirmDelete"
          @view="handleViewPost"
        />
      </div>
    </div>

    <!-- DetailCard 详情卡片 -->
    <DetailCard
      v-if="showDetailCard"
      :item="selectedDetailPost"
      :click-position="clickPosition"
      @close="closeDetailCard"
    />


    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        上一页
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        下一页
      </button>
    </div>


    <EditPostModal v-if="showEditModal" :visible="showEditModal" :post="selectedPost"
      @update:visible="showEditModal = $event" @save="handlePostUpdate" />


    <!-- 删除确认弹窗 -->
    <ConfirmModal :visible="showDeleteModal" title="删除笔记" :message="`确定要删除笔记《${selectedPost?.title}》吗？此操作不可撤销。`"
      type="warning" confirm-text="删除" cancel-text="取消" @confirm="handleDelete" @cancel="showDeleteModal = false"
      @update:visible="showDeleteModal = $event" />


    <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getUserPosts, deletePost, updatePost } from '@/api/posts'
import { getCategories } from '@/api/categories'
import SvgIcon from '@/components/SvgIcon.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import PostItem from '@/components/PostItem.vue'
import EditPostModal from './components/EditPostModal.vue'
import ConfirmModal from '@/components/ConfirmDialog.vue'
import MessageToast from '@/components/MessageToast.vue'
import DetailCard from '@/components/DetailCard.vue'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const posts = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalPosts = ref(0)
const pageSize = 10
const categories = ref([])

// 模态框状态
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedPost = ref(null)

// DetailCard 相关状态
const showDetailCard = ref(false)
const selectedDetailPost = ref(null)
const clickPosition = ref({ x: 0, y: 0 })

// 消息提示
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// 下拉选择器选项
const categoryOptions = computed(() => {
  const options = [{ label: '全部分类', value: '' }]
  categories.value.forEach(category => {
    options.push({ label: category.name, value: category.id })
  })
  return options
})



// 显示消息
const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

// 关闭消息提示
const handleToastClose = () => {
  showToast.value = false
}

// 返回上一页
const handleBack = () => {
  router.push('/publish')
}

// 跳转到发布页面
const goToPublish = () => {
  router.push('/publish')
}

// 加载笔记列表
const loadPosts = async () => {
  try {
    loading.value = true

    // 检查用户是否已登录
    if (!userStore.userInfo || !userStore.userInfo.user_id) {
      showMessage('请先登录', 'error')
      router.push('/user')
      return
    }

    const params = {
      page: currentPage.value,
      limit: pageSize,
      keyword: searchKeyword.value,
      category: selectedCategory.value,
      sort: 'created_at',
      user_id: userStore.userInfo.user_id, // 只获取当前用户的笔记
      status: 'all' // 获取所有状态的笔记（已发布和待审核）
    }

    const response = await getUserPosts(params)
    if (response.success) {
      posts.value = response.data.posts
      totalPages.value = response.data.pagination.pages
      totalPosts.value = response.data.pagination.total
    } else {
      showMessage(response.message || '加载失败', 'error')
    }
  } catch (error) {
    console.error('加载笔记失败:', error)
    showMessage('加载笔记失败', 'error')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadPosts()
}

// 分类筛选处理
const handleCategoryChange = (event) => {
  selectedCategory.value = event.value
  currentPage.value = 1
  loadPosts()
}



// 分页处理
const changePage = (page) => {
  currentPage.value = page
  loadPosts()
}

// 编辑笔记
const editPost = (post) => {
  selectedPost.value = post
  showEditModal.value = true
}

// 确认删除
const confirmDelete = (post) => {
  selectedPost.value = post
  showDeleteModal.value = true
}

// 处理删除
const handleDelete = async () => {
  try {
    const response = await deletePost(selectedPost.value.id)
    if (response.success) {
      showMessage('删除成功', 'success')
      showDeleteModal.value = false
      loadPosts() // 重新加载列表
    } else {
      showMessage(response.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showMessage('删除失败', 'error')
  }
}

// 处理笔记更新
const handlePostUpdate = () => {
  showEditModal.value = false
  loadPosts() // 重新加载列表
  showMessage('更新成功', 'success')
}

// 查看笔记详情 - 显示DetailCard
const handleViewPost = (post, event) => {
  // 记录点击位置
  clickPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  // 设置选中的笔记并显示详情卡片
  selectedDetailPost.value = JSON.parse(JSON.stringify(post))
  showDetailCard.value = true

  // 修改页面标题
  const originalTitle = document.title
  document.title = post.title || '笔记详情'

  // 使用History API添加历史记录并更新URL
  const newUrl = `/post?id=${post.id}`
  window.history.pushState(
    {
      previousUrl: window.location.pathname + window.location.search,
      showDetailCard: true,
      postId: post.id,
      originalTitle: originalTitle
    },
    post.title || '笔记详情',
    newUrl
  )
}

// 关闭详情卡片
const closeDetailCard = () => {
  showDetailCard.value = false
  selectedDetailPost.value = null

  // 恢复原始页面标题
  if (window.history.state && window.history.state.originalTitle) {
    document.title = window.history.state.originalTitle
  }

  // 恢复原URL状态
  if (window.history.state && window.history.state.previousUrl) {
    window.history.replaceState(window.history.state, '', window.history.state.previousUrl)
  } else {
    // 如果没有前一个URL，回到当前页面的原始状态
    window.history.back()
  }
}

// 加载分类数据
const loadCategories = async () => {
  try {
    const response = await getCategories()
    if (response.success && response.data) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  // 初始化用户信息
  userStore.initUserInfo()
  loadCategories()
  loadPosts()
})
</script>

<style scoped>
* {
  transition: background 0.2s ease, border-color 0.2s ease;
}

.post-management-container {
  min-height: 100vh;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  padding-bottom: calc(48px + constant(safe-area-inset-bottom));
  padding-bottom: calc(48px + env(safe-area-inset-bottom));
  margin: 72px auto;
  min-width: 700px;
  max-width: 700px;
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
  caret-color: var(--primary-color);
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



.posts-section {
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
  width: 40px;
  height: 40px;
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

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 1rem;
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 1rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color-primary);
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

@media (max-width: 960px) {
  .post-management-container {
    min-width: 100%;
    max-width: 100%;
    margin: 72px 0;
  }

  .page-header {
    padding: 0.75rem 1rem;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .search-box {
    max-width: none;
  }

  .filter-options {
    justify-content: flex-start;
    gap: 0.75rem;
  }

  .posts-section {
    padding: 0.75rem 1rem;
  }
}
</style>