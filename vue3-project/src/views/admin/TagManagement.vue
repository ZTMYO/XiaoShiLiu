<template>
  <CrudTable title="标签管理" entity-name="标签" api-endpoint="/admin/tags" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: '标签名称', sortable: false },
  { key: 'use_count', label: '使用次数', sortable: true },
  { key: 'created_at', label: '创建时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'name', label: '标签名称', type: 'text', required: true, placeholder: '请输入标签名称' }
]

const searchFields = [
  { key: 'name', label: '标签名称', placeholder: '搜索标签名称' }
]
</script>