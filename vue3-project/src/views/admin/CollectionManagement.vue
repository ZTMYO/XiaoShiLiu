<template>
  <CrudTable title="收藏管理" entity-name="收藏" api-endpoint="/admin/collections" :columns="columns"
    :form-fields="formFields" :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'user_id', label: '用户ID', sortable: false },
  { key: 'user_display_id', label: '用户小石榴号', type: 'user-link', sortable: false },
  { key: 'post_id', label: '笔记ID', sortable: false },
  { key: 'post_title', label: '笔记标题', type: 'content', sortable: false },
  { key: 'created_at', label: '收藏时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'user_id', label: '用户ID', type: 'number', required: true, placeholder: '请输入用户ID' },
  { key: 'post_id', label: '笔记ID', type: 'number', required: true, placeholder: '请输入笔记ID' }
]

const searchFields = [
  { key: 'user_id', label: '用户ID', placeholder: '搜索用户ID' },
  { key: 'post_id', label: '笔记ID', placeholder: '搜索笔记ID' }
]
</script>