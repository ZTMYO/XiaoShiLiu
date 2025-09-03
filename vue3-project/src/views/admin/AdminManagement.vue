<template>
  <CrudTable title="管理员管理" entity-name="管理员" api-endpoint="/admin/admins" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

const columns = [
  { key: 'username', label: '账号', sortable: false },
  { key: 'password', label: '密码', sortable: false },
  { key: 'created_at', label: '创建时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'username', label: '账号', type: 'text', required: true, placeholder: '请输入账号' },
  { key: 'password', label: '密码', type: 'password', required: true, placeholder: '请输入密码' }
]

const searchFields = [
  { key: 'username', label: '账号', placeholder: '搜索账号' }
]
</script>