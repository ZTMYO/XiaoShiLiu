<template>
  <CrudTable title="认证管理" entity-name="认证申请" api-endpoint="/admin/audit" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" :custom-actions="customActions" @custom-action="handleCustomAction" />

  <!-- 消息提示 -->
  <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />

  <!-- 删除确认弹窗 -->
  <ConfirmDialog v-model:visible="showDeleteModal" title="确认删除"
    :message="`确定要删除用户《${selectedItem?.nickname || selectedItem?.user_id}》的认证申请吗？此操作不可撤销。`" type="warning"
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
    const response = await fetch(`${apiConfig.baseURL}/admin/audit/${selectedItem.value.id}`, {
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
  { key: 'user_display_id', label: '用户小石榴号', type: 'user-link', sortable: false },
  { key: 'nickname', label: '用户昵称', sortable: false },
  {
    key: 'type',
    label: '认证类型',
    type: 'status',
    sortable: false,
    statusMap: {
      1: { text: '官方认证', class: 'type-official' },
      2: { text: '个人认证', class: 'type-personal' }
    }
  },
  { key: 'content', label: '认证内容', type: 'content', sortable: false },
  {
    key: 'status',
    label: '审核状态',
    type: 'status',
    sortable: true,
    statusMap: {
      0: { text: '待审核', class: 'status-pending' },
      1: { text: '已通过', class: 'status-approved' },
      2: { text: '已拒绝', class: 'status-rejected' }
    }
  },
  { key: 'created_at', label: '申请时间', type: 'date', sortable: true },
  { key: 'audit_time', label: '审核时间', type: 'date', sortable: true }
]

// 表单字段定义
const formFields = computed(() => [
  { key: 'target_id', label: '用户ID', type: 'number', required: true, placeholder: '请输入用户ID' },
  {
    key: 'type',
    label: '认证类型',
    type: 'select',
    required: true,
    options: [
      { value: 1, label: '官方认证' },
      { value: 2, label: '个人认证' }
    ]
  },
  { key: 'content', label: '认证内容', type: 'textarea', required: true, placeholder: '请输入认证相关内容' },
  {
    key: 'status',
    label: '审核状态',
    type: 'select',
    required: false,
    options: [
      { value: 0, label: '待审核' },
      { value: 1, label: '已通过' },
      { value: 2, label: '已拒绝' }
    ]
  }
])

// 搜索字段定义
const searchFields = [
  { key: 'user_display_id', label: '用户小石榴号', placeholder: '搜索用户小石榴号' },
  {
    key: 'type',
    label: '认证类型',
    type: 'select',
    placeholder: '选择认证类型',
    options: [
      { value: '', label: '全部类型' },
      { value: '1', label: '官方认证' },
      { value: '2', label: '个人认证' }
    ]
  },
  {
    key: 'status',
    label: '审核状态',
    type: 'select',
    placeholder: '选择审核状态',
    options: [
      { value: '', label: '全部状态' },
      { value: '0', label: '待审核' },
      { value: '1', label: '已通过' },
      { value: '2', label: '已拒绝' }
    ]
  }
]

// 自定义操作按钮
const customActions = [
  { key: 'approve', icon: 'passed', title: '审核通过', class: 'btn-success' },
  { key: 'reject', icon: 'unpassed', title: '拒绝申请', class: 'btn-danger' },
  { key: 'delete', icon: 'delete', title: '删除', class: 'btn-outline' }
]

// 处理自定义操作
const handleCustomAction = async ({ action, item }) => {
  try {
    if (action === 'approve') {
      // 审核通过
      const response = await fetch(`${apiConfig.baseURL}/admin/audit/${item.id}/approve`, {
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
      // 拒绝申请
      const response = await fetch(`${apiConfig.baseURL}/admin/audit/${item.id}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.code === 200) {
        showMessage('拒绝申请成功')
        // 刷新页面数据
        location.reload()
      } else {
        showMessage('拒绝申请失败: ' + result.message, 'error')
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
:deep(.status-pending) {
  color: #f39c12;
}

:deep(.status-approved) {
  color: #4caf50;
}

:deep(.status-rejected) {
  color: #e74c3c;
}
</style>