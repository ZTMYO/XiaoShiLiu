<template>
  <CrudTable title="管理员会话管理" entity-name="管理员会话" api-endpoint="/admin/admin-sessions" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'admin_id', label: '管理员ID', sortable: false },
  { key: 'username', label: '管理员用户名', sortable: false },
  { key: 'user_agent', label: '用户代理', type: 'content', sortable: false },
  { key: 'is_active', label: '活跃状态', type: 'boolean' },
  { key: 'expires_at', label: '过期时间', type: 'date', sortable: true },
  { key: 'created_at', label: '创建时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'admin_id', label: '管理员ID', type: 'number', required: true, placeholder: '请输入管理员ID' },
  { key: 'user_agent', label: '用户代理', type: 'text', placeholder: '请输入用户代理' },
  { key: 'is_active', label: '活跃状态', type: 'checkbox', checkboxLabel: '活跃' }
]

const searchFields = [
  { key: 'username', label: '管理员用户名', placeholder: '搜索管理员用户名' },
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