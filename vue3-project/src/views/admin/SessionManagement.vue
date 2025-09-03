<template>
  <CrudTable title="会话管理" entity-name="会话" api-endpoint="/admin/sessions" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'user_id', label: '用户ID', sortable: false },
  { key: 'user_display_id', label: '用户小石榴号', type: 'user-link', sortable: false },
  { key: 'user_agent', label: '用户代理', type: 'content', sortable: false },
  { key: 'is_active', label: '活跃状态', type: 'boolean', sortable: true },
  { key: 'expires_at', label: '过期时间', type: 'date', sortable: true },
  { key: 'created_at', label: '创建时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'user_id', label: '用户ID', type: 'number', required: true, placeholder: '请输入用户ID' },
  { key: 'user_agent', label: '用户代理', type: 'text', placeholder: '请输入用户代理' },
  { key: 'is_active', label: '活跃状态', type: 'checkbox', checkboxLabel: '活跃' }
]

const searchFields = [
  { key: 'user_id', label: '用户ID', placeholder: '搜索用户ID' },
  {
    key: 'is_active',
    label: '活跃状态',
    type: 'select',
    placeholder: '活跃状态',
    options: [
      { value: '', label: '全部状态' },
      { value: '1', label: '活跃' },
      { value: '0', label: '非活跃' }
    ]
  }
]
</script>