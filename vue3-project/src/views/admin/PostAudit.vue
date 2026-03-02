<template>
  <CrudTable title="笔记审核" entity-name="笔记" api-endpoint="/admin/posts-audit" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" :custom-actions="customActions" @custom-action="handleCustomAction" />

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
import MessageToast from '@/components/MessageToast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { apiConfig } from '@/config/api'

// 声明组件事件
const emit = defineEmits(['closeFilter'])

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
  { key: 'id', label: 'ID', sortable: true },
  { key: 'title', label: '标题', type: 'content', sortable: false },
  { key: 'user_display_id', label: '小石榴号', type: 'user-link', sortable: false },
  { key: 'category', label: '分类', sortable: false },
  { key: 'type', label: '类型', type: 'mapped', map: { 1: '图文', 2: '视频' }, sortable: false },
  { key: 'status', label: '状态', sortable: false, type: 'mapped', map: { 0: '已发布', 1: '草稿', 2: '待审核' } },
  { key: 'content', label: '内容', type: 'content', sortable: false },
  { key: 'tags', label: '标签', type: 'tags', sortable: false },
  { key: 'images', label: '媒体', type: 'image-gallery', sortable: false },
  { key: 'created_at', label: '发布时间', type: 'date', sortable: true }
]

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
</script>

<style scoped>
/* 状态样式 */
</style>