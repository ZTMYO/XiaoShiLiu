<template>
  <div>
    <CrudTable title="用户管理" entity-name="用户" api-endpoint="/admin/users" :columns="columns" :form-fields="formFields"
      :search-fields="searchFields" default-sort-field="id" default-sort-order="asc" :custom-actions="customActions"
      @custom-action="handleCustomAction" />
    
    <!-- 封禁用户表单模态框 -->
    <FormModal v-model:visible="banModalVisible" :title="banModalTitle" :form-fields="banFormFields"
      v-model:form-data="banFormData" confirm-text="确定封禁" :loading="isSubmitting"
      @submit="handleBanSubmit" @close="banModalVisible = false" />
    
    <!-- 编辑用户表单模态框 -->
    <FormModal v-model:visible="editModalVisible" :title="editModalTitle" :form-fields="editFormFields"
      v-model:form-data="editFormData" confirm-text="保存修改" :loading="isSubmitting"
      @submit="handleEditSubmit" @close="editModalVisible = false" />
    
    <!-- 删除确认弹窗 -->
    <ConfirmDialog v-model:visible="showDeleteModal" title="确认删除"
      :message="`确定要删除用户《${selectedItem?.nickname || selectedItem?.user_id}》吗？此操作不可撤销。`" type="warning"
      confirm-text="删除" cancel-text="取消" @confirm="handleConfirmDelete" @cancel="showDeleteModal = false" />
    
    <!-- 解封确认弹窗 -->
    <ConfirmDialog v-model:visible="showUnbanModal" title="确认解封"
      :message="unbanMessage" type="info"
      confirm-text="确认解封" cancel-text="取消" @confirm="handleConfirmUnban" @cancel="showUnbanModal = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CrudTable from '@/views/admin/components/CrudTable.vue'
import FormModal from '@/views/admin/components/FormModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import apiConfig from '@/config/api.js'
import messageManager from '@/utils/messageManager'
import { useConfirm } from './composables/useConfirm'

const { confirmState, handleConfirm, handleCancel, confirmDelete, showError } = useConfirm()

// 通用时间格式化函数
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 编辑和删除相关
const editModalVisible = ref(false)
const editModalTitle = ref('编辑用户')
const editFormData = ref({})
const showDeleteModal = ref(false)
const selectedItem = ref(null)

// 解封确认相关
const showUnbanModal = ref(false)
const unbanMessage = ref('')
const currentBanInfo = ref(null)

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'user_id', label: '小石榴号', type: 'user-link', sortable: false, maxLength: 15 },
  { key: 'nickname', label: '用户昵称', sortable: false },
  { key: 'avatar', label: '头像', type: 'image', sortable: false },
  { key: 'bio', label: '简介', type: 'content', sortable: false },
  { key: 'email', label: '邮箱', type: 'content', sortable: false },
  { key: 'location', label: 'IP属地', sortable: false },
  { key: 'personality_tags', label: '个性标签', type: 'personality-tags', sortable: false },
  { key: 'follow_count', label: '关注数', sortable: false },
  { key: 'fans_count', label: '粉丝数', sortable: true },
  { key: 'like_count', label: '获赞数', sortable: true },
  { key: 'is_active', label: '账号状态', type: 'boolean', sortable: false },
  { key: 'ban_status_display', label: '封禁状态', sortable: false },
  { key: 'created_at', label: '注册时间', type: 'date', sortable: true }
]

const customActions = [
  { key: 'ban', icon: 'ban', title: '封禁/解封用户' },
  { key: 'edit', icon: 'edit', title: '编辑用户' },
  { key: 'delete', icon: 'delete', title: '删除用户' }
]

// 封禁模态框相关
const banModalVisible = ref(false)
const banModalTitle = ref('封禁用户')
const banFormData = ref({ reason: '', end_time: '' })
const isSubmitting = ref(false)
const currentUserId = ref(null)

// 封禁表单字段
const banFormFields = [
  {
    key: 'reason',
    label: '封禁原因',
    type: 'textarea',
    placeholder: '请输入封禁原因',
    required: true
  },
  {
    key: 'end_time',
    label: '封禁结束时间',
    type: 'text',
    placeholder: '格式：YYYY-MM-DD HH:MM:SS，留空为永久封禁',
    required: false
  }
]

// 通用用户表单字段
const userFormFields = [
  { key: 'user_id', label: '小石榴号', type: 'text', required: true, placeholder: '请输入小石榴号', maxlength: 15 },
  { key: 'nickname', label: '昵称', type: 'text', required: true, placeholder: '请输入昵称', maxlength: 10 },
  { key: 'avatar', label: '头像', type: 'avatar-upload', placeholder: '上传头像' },
  { key: 'avatar', label: '头像URL', type: 'text', placeholder: '请输入头像URL或使用上方上传功能' },
  { key: 'bio', label: '个人简介', type: 'textarea', placeholder: '请输入个人简介' },
  { key: 'email', label: '邮箱', type: 'text', placeholder: '请输入邮箱' },
  { key: 'location', label: '属地', type: 'text', placeholder: '请输入属地' },
  { key: 'gender', label: '性别', type: 'select', options: [{ value: '', label: '请选择' }, { value: '男', label: '男' }, { value: '女', label: '女' }], placeholder: '请选择性别' },
  {
    key: 'zodiac_sign', label: '星座', type: 'select', options: [
      { value: '', label: '请选择' },
      { value: '白羊座', label: '白羊座' }, { value: '金牛座', label: '金牛座' }, { value: '双子座', label: '双子座' },
      { value: '巨蟹座', label: '巨蟹座' }, { value: '狮子座', label: '狮子座' }, { value: '处女座', label: '处女座' },
      { value: '天秤座', label: '天秤座' }, { value: '天蝎座', label: '天蝎座' }, { value: '射手座', label: '射手座' },
      { value: '摩羯座', label: '摩羯座' }, { value: '水瓶座', label: '水瓶座' }, { value: '双鱼座', label: '双鱼座' }
    ], placeholder: '请选择星座'
  },
  {
    key: 'mbti', label: 'MBTI', type: 'mbti-picker', dimensions: [
      {
        key: 'mbti_1',
        label: '外向/内向',
        options: [
          { value: 'E', label: 'E' },
          { value: 'I', label: 'I' }
        ]
      },
      {
        key: 'mbti_2',
        label: '感觉/直觉',
        options: [
          { value: 'S', label: 'S' },
          { value: 'N', label: 'N' }
        ]
      },
      {
        key: 'mbti_3',
        label: '思考/情感',
        options: [
          { value: 'T', label: 'T' },
          { value: 'F', label: 'F' }
        ]
      },
      {
        key: 'mbti_4',
        label: '判断/知觉',
        options: [
          { value: 'J', label: 'J' },
          { value: 'P', label: 'P' }
        ]
      }
    ], placeholder: '请选择MBTI类型'
  },
  {
    key: 'education', label: '学历', type: 'select', options: [
      { value: '', label: '请选择' },
      { value: '高中及以下', label: '高中及以下' }, { value: '大专', label: '大专' }, { value: '本科', label: '本科' },
      { value: '硕士', label: '硕士' }, { value: '博士', label: '博士' }
    ], placeholder: '请选择学历'
  },
  { key: 'major', label: '专业', type: 'text', placeholder: '请输入专业' },
  { key: 'interests', label: '兴趣爱好', type: 'interest-input', placeholder: '请输入兴趣爱好' },
  { key: 'is_active', label: '激活状态', type: 'checkbox', checkboxLabel: '激活' },
  { key: 'verified', label: '认证状态', type: 'radio', options: [
    { value: 0, label: '无认证' },
    { value: 1, label: '官方认证' },
    { value: 2, label: '个人认证' }
  ] }
]

// 编辑表单字段（使用通用表单字段）
const editFormFields = userFormFields

const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }
  const adminToken = localStorage.getItem('admin_token')
  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`
  }
  return headers
}

// 通用API请求处理函数
const handleApiRequest = async (url, method, data = null, successMessage, errorMessage, closeModal = null) => {
  isSubmitting.value = true
  try {
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : null
    })
    const result = await response.json()
    if (result.code === 200) {
      messageManager.success(successMessage)
      if (closeModal) {
        closeModal.value = false
      }
      // 刷新页面数据
      window.location.reload()
    } else {
      showError(result.message || errorMessage)
    }
  } catch (error) {
    console.error(errorMessage + ':', error)
    showError(errorMessage + '，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

const handleCustomAction = async (actionData) => {
  const { action, item } = actionData
  if (action === 'edit') {
    // 编辑用户
    // 重置表单数据
    editFormData.value = { ...item }
    currentUserId.value = item.id
    editModalTitle.value = `编辑用户 - ${item.nickname}`
    editModalVisible.value = true
  } else if (action === 'delete') {
    // 删除用户
    selectedItem.value = item
    showDeleteModal.value = true
  } else if (action === 'ban') {
    // 检查用户的封禁状态
    const isBanned = item.ban_status === 0 || item.ban_status === 3
    
    if (isBanned) {
      // 用户已被封禁，显示解封确认弹窗
      currentBanInfo.value = item
      // 构建解封确认消息，显示封禁的详细信息
      unbanMessage.value = `确定要解封用户《${item.nickname || item.user_id}》吗？\n\n`
      unbanMessage.value += `封禁原因：${item.ban_reason || '未记录'}\n`
      if (item.ban_end_time) {
        unbanMessage.value += `封禁结束时间：${formatDate(item.ban_end_time)}\n`
      } else {
        unbanMessage.value += `封禁时长：永久\n`
      }
      if (item.ban_created_at) {
        unbanMessage.value += `封禁时间：${formatDate(item.ban_created_at)}\n`
      }
      showUnbanModal.value = true
    } else {
      // 用户未被封禁，显示封禁模态框
      // 重置表单数据
      banFormData.value = { reason: '', end_time: '' }
      currentUserId.value = item.id
      banModalTitle.value = `封禁用户 - ${item.nickname}`
      banModalVisible.value = true
    }
  }
}

// 处理编辑提交
const handleEditSubmit = async (formData) => {
  if (!currentUserId.value) return
  
  await handleApiRequest(
    `${apiConfig.baseURL}/admin/users/${currentUserId.value}`,
    'PUT',
    formData,
    '用户编辑成功',
    '编辑失败',
    editModalVisible
  )
}

// 处理删除确认
const handleConfirmDelete = async () => {
  if (!selectedItem.value) return
  
  await handleApiRequest(
    `${apiConfig.baseURL}/admin/users/${selectedItem.value.id}`,
    'DELETE',
    null,
    '用户删除成功',
    '删除失败',
    showDeleteModal
  )
  selectedItem.value = null
}

// 处理解封确认
const handleConfirmUnban = async () => {
  if (!currentBanInfo.value) return
  
  await handleApiRequest(
    `${apiConfig.baseURL}/admin/users/${currentBanInfo.value.id}/unban`,
    'POST',
    null,
    '用户解封成功',
    '解封失败',
    showUnbanModal
  )
  currentBanInfo.value = null
}

const handleBanSubmit = async (formData) => {
  if (!currentUserId.value) return
  
  await handleApiRequest(
    `${apiConfig.baseURL}/admin/users/${currentUserId.value}/ban`,
    'POST',
    { reason: formData.reason, end_time: formData.end_time || null },
    '用户封禁成功',
    '封禁失败',
    banModalVisible
  )
}

// 创建表单字段（使用通用表单字段）
const formFields = userFormFields

const searchFields = [
  { key: 'user_id', label: '小石榴号', placeholder: '搜索小石榴号' },
  { key: 'nickname', label: '昵称', placeholder: '搜索昵称' },
  { key: 'location', label: '属地', placeholder: '搜索属地' },
  {
    key: 'is_active',
    label: '账号状态',
    type: 'select',
    placeholder: '账号状态',
    options: [
      { value: '', label: '全部状态' },
      { value: '1', label: '激活' },
      { value: '0', label: '未激活' }
    ]
  },
  {
    key: 'ban_status',
    label: '封禁状态',
    type: 'select',
    placeholder: '封禁状态',
    options: [
      { value: '', label: '全部状态' },
      { value: 'normal', label: '正常' },
      { value: 'banned', label: '封禁' }
    ]
  }
]
</script>