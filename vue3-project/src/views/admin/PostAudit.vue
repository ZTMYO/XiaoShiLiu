<template>
  <CrudTable title="笔记审核" entity-name="笔记" api-endpoint="/admin/posts-audit" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" :custom-actions="customActions" :show-create-button="false" @custom-action="handleCustomAction">
    <template #cell-preview="{ item }">
      <div>
        <span class="content-link" @click="openPreview(item, $event)" title="查看笔记预览">预览</span>
      </div>
    </template>
  </CrudTable>

  <div v-if="showPreview" class="audit-detailcard-readonly">
    <DetailCard :item="previewItem" :click-position="previewClickPosition" :page-mode="false"
      :disable-auto-fetch="true" @close="closePreview" />
  </div>

  <!-- 消息提示 -->
  <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />

  <!-- 删除确认弹窗 -->
  <ConfirmDialog v-model:visible="showDeleteModal" title="确认删除"
    :message="`确定要删除笔记《${selectedItem?.title || selectedItem?.id}》吗？此操作不可撤销。`" type="warning"
    confirm-text="删除" cancel-text="取消" @confirm="handleConfirmDelete" @cancel="showDeleteModal = false" />
</template>

<script setup>
import { computed, ref } from 'vue'
import CrudTable from './components/CrudTable.vue'
import DetailCard from '@/components/DetailCard.vue'
import MessageToast from '@/components/MessageToast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { apiConfig } from '@/config/api'

// 消息提示状态
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// 删除确认弹窗状态
const showDeleteModal = ref(false)
const selectedItem = ref(null)

// 消息提示方法
const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

const handleToastClose = () => {
  showToast.value = false
}

// 处理删除确认
const handleConfirmDelete = async () => {
  try {
    const response = await fetch(`${apiConfig.baseURL}/admin/posts/${selectedItem.value.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    const result = await response.json()
    if (result.code === 200) {
      showMessage('删除成功')
      // 刷新页面数据
      location.reload()
    } else {
      showMessage('删除失败: ' + result.message, 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showMessage('删除失败', 'error')
  } finally {
    showDeleteModal.value = false
    selectedItem.value = null
  }
}

// 获取认证头
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }

  const token = localStorage.getItem('admin_token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

// 表格列定义
const columns = [
  { key: 'id', label: 'ID', type: 'post-link', sortable: true },
  { key: 'user_display_id', label: '小石榴号', type: 'user-link', sortable: false },
  { key: 'nickname', label: '用户昵称', sortable: false },
  { key: 'preview', label: '预览', type: 'slot', sortable: false },
  { key: 'created_at', label: '发起时间', type: 'date', sortable: true }
]

const showPreview = ref(false)
const previewItem = ref(null)
const previewClickPosition = ref({ x: 0, y: 0 })

// 表单字段定义
const formFields = computed(() => [
  { key: 'user_id', label: '作者ID', type: 'number', required: true, placeholder: '请输入用户ID' },
  { key: 'title', label: '笔记标题', type: 'text', required: true, placeholder: '请输入笔记标题' },
  { key: 'content', label: '笔记内容', type: 'textarea', required: true, placeholder: '请输入笔记内容' },
  { key: 'category_id', label: '分类ID', type: 'number', required: true, placeholder: '请输入分类ID' },
  {
    key: 'status',
    label: '笔记状态',
    type: 'select',
    required: false,
    options: [
      { value: 0, label: '已发布' },
      { value: 1, label: '草稿' },
      { value: 2, label: '待审核' }
    ]
  }
])

// 搜索字段定义
const searchFields = [
  { key: 'keyword', label: '关键词', placeholder: '搜索标题或内容' },
  { key: 'user_display_id', label: '用户小石榴号', placeholder: '搜索用户小石榴号' }
]

// 自定义操作按钮
const customActions = [
  { key: 'approve', icon: 'passed', title: '审核通过', class: 'btn-success' },
  { key: 'reject', icon: 'unpassed', title: '拒绝发布', class: 'btn-danger' },
  { key: 'delete', icon: 'delete', title: '删除', class: 'btn-outline' }
]

// 处理自定义操作
const handleCustomAction = async ({ action, item }) => {
  try {
    if (action === 'approve') {
      // 审核通过
      const response = await fetch(`${apiConfig.baseURL}/admin/posts-audit/${item.id}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.code === 200) {
        showMessage('审核通过成功')
        // 刷新页面数据
        location.reload()
      } else {
        showMessage('审核通过失败: ' + result.message, 'error')
      }
    } else if (action === 'reject') {
      // 拒绝发布
      const response = await fetch(`${apiConfig.baseURL}/admin/posts-audit/${item.id}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.code === 200) {
        showMessage('拒绝发布成功')
        // 刷新页面数据
        location.reload()
      } else {
        showMessage('拒绝发布失败: ' + result.message, 'error')
      }
    } else if (action === 'delete') {
      // 显示删除确认弹窗
      selectedItem.value = item
      showDeleteModal.value = true
    }
  } catch (error) {
    console.error('操作失败:', error)
    showMessage('操作失败', 'error')
  }
}

// 打开预览
const openPreview = async (item, event) => {
  try {
    previewClickPosition.value = {
      x: event?.clientX || 0,
      y: event?.clientY || 0
    }

    const response = await fetch(`${apiConfig.baseURL}/admin/posts/${item.id}`, {
      headers: getAuthHeaders()
    })
    const result = await response.json()
    if (result.code === 200) {
      previewItem.value = result.data
      showPreview.value = true
    } else {
      showMessage('获取笔记详情失败: ' + result.message, 'error')
    }
  } catch (error) {
    console.error('获取笔记详情失败:', error)
    showMessage('获取笔记详情失败', 'error')
  }
}

// 关闭预览
const closePreview = () => {
  showPreview.value = false
  previewItem.value = null
}
</script>

<style scoped>
/* 审核预览：只读模式（不改DetailCard源码，直接在此处禁用交互） */
.audit-detailcard-readonly :deep(.footer-actions) {
  display: none;
}

.audit-detailcard-readonly :deep(.author-avatar),
.audit-detailcard-readonly :deep(.author-name),
.audit-detailcard-readonly :deep(.user-hover-card-trigger),
.audit-detailcard-readonly :deep(.comment-avatar),
.audit-detailcard-readonly :deep(.comment-username),
.audit-detailcard-readonly :deep(.reply-username) {
  pointer-events: none;
}

.audit-detailcard-readonly :deep(button),
.audit-detailcard-readonly :deep(input),
.audit-detailcard-readonly :deep(textarea),
.audit-detailcard-readonly :deep(.follow-btn),
.audit-detailcard-readonly :deep(.follow-button),
.audit-detailcard-readonly :deep(.like-button),
.audit-detailcard-readonly :deep(.collect-button),
.audit-detailcard-readonly :deep(.comment-reply),
.audit-detailcard-readonly :deep(.reply-reply),
.audit-detailcard-readonly :deep(.comment-delete-btn),
.audit-detailcard-readonly :deep(.toggle-replies-btn),
.audit-detailcard-readonly :deep(.sort-menu),
.audit-detailcard-readonly :deep(.sort-option),
.audit-detailcard-readonly :deep(.comment-replay-icon),
.audit-detailcard-readonly :deep(.reply-replay-icon) {
  pointer-events: none;
}

.audit-detailcard-readonly :deep(.close-btn) {
  pointer-events: auto;
}

.audit-detailcard-readonly :deep(.nav-btn),
.audit-detailcard-readonly :deep(.mobile-nav-btn),
.audit-detailcard-readonly :deep(.slider-image),
.audit-detailcard-readonly :deep(.mobile-slider-image),
.audit-detailcard-readonly :deep(.image-zoomable),
.audit-detailcard-readonly :deep(video) {
  pointer-events: auto;
}
</style>