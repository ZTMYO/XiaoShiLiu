<template>
  <CrudTable title="评论管理" entity-name="评论" api-endpoint="/admin/comments" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'content', label: '内容', type: 'content', sortable: false },
  { key: 'user_id', label: '评论者ID', sortable: false },
  { key: 'user_display_id', label: '评论者小石榴号', type: 'user-link', sortable: false },
  { key: 'post_id', label: '笔记ID', sortable: false },
  { key: 'parent_id', label: '父评论ID', sortable: false },
  { key: 'like_count', label: '点赞数', sortable: true },
  { key: 'created_at', label: '评论时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'post_id', label: '笔记ID', type: 'number', required: true, placeholder: '请输入笔记ID' },
  { key: 'content', label: '评论内容', type: 'textarea', required: true, placeholder: '请输入评论内容' },
  { key: 'parent_id', label: '父评论ID', type: 'number', placeholder: '回复评论时填写父评论ID' }
]

const searchFields = [
  { key: 'post_id', label: '笔记ID', placeholder: '搜索笔记ID' },
  { key: 'user_id', label: '用户ID', placeholder: '搜索用户ID' },
  { key: 'content', label: '内容', placeholder: '搜索评论内容' }
]
</script>