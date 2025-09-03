<template>
  <CrudTable title="通知管理" entity-name="通知" api-endpoint="/admin/notifications" :columns="columns"
    :form-fields="formFields" :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

// 通知类型映射
const notificationTypeMap = {
  '1': '1(点赞笔记)',
  '2': '2(点赞评论)',
  '3': '3(收藏笔记)',
  '4': '4(评论笔记)',
  '5': '5(回复评论)',
  '6': '6(关注)',
  '7': '7(提及)'
}

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'user_id', label: '接收者ID', sortable: false },
  { key: 'user_display_id', label: '收者账号', type: 'user-link', sortable: false },
  { key: 'sender_id', label: '发送者ID', sortable: false },
  { key: 'sender_display_id', label: '发者账号', type: 'user-link', sortable: false },
  { key: 'sender_nickname', label: '发送者昵称', sortable: false },
  { key: 'type', label: '通知类型', type: 'mapped', map: notificationTypeMap, sortable: false },
  { key: 'title', label: '标题', maxLength: 30, sortable: false },
  { key: 'target_id', label: '目标ID', sortable: false },
  { key: 'is_read', label: '已读状态', type: 'boolean', sortable: false },
  { key: 'created_at', label: '创建时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'user_id', label: '接收者ID', type: 'number', required: true, placeholder: '请输入接收者ID' },
  { key: 'sender_id', label: '发送者ID', type: 'number', required: true, placeholder: '请输入发送者ID' },
  {
    key: 'type',
    label: '通知类型',
    type: 'select',
    required: true,
    options: [
      { value: '1', label: '点赞笔记' },
      { value: '2', label: '点赞评论' },
      { value: '3', label: '收藏笔记' },
      { value: '4', label: '评论笔记' },
      { value: '5', label: '回复评论' },
      { value: '6', label: '关注' }
    ]
  },
  { key: 'title', label: '标题', type: 'text', required: true, placeholder: '请输入通知标题' },
  { key: 'target_id', label: '目标ID', type: 'number', placeholder: '请输入目标ID（笔记或评论ID）' },
  { key: 'comment_id', label: '评论ID', type: 'number', placeholder: '请输入评论ID（可选）' },
  { key: 'is_read', label: '已读状态', type: 'checkbox', checkboxLabel: '已读' }
]

const searchFields = [
  { key: 'user_id', label: '接收者ID', placeholder: '搜索接收者ID' },
  {
    key: 'type',
    label: '通知类型',
    type: 'select',
    placeholder: '通知类型',
    options: [
      { value: '', label: '全部类型' },
      { value: '1', label: '点赞笔记' },
      { value: '2', label: '点赞评论' },
      { value: '3', label: '收藏笔记' },
      { value: '4', label: '评论笔记' },
      { value: '5', label: '回复评论' },
      { value: '6', label: '关注' }
    ]
  },
  {
    key: 'is_read',
    label: '已读状态',
    type: 'select',
    placeholder: '已读状态',
    options: [
      { value: '', label: '全部状态' },
      { value: '1', label: '已读' },
      { value: '0', label: '未读' }
    ]
  },
  { key: 'title', label: '标题', placeholder: '搜索标题' }
]
</script>