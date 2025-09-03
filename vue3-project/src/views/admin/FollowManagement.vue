<template>
  <CrudTable title="关注管理" entity-name="关注" api-endpoint="/admin/follows" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'follower_id', label: '关注者ID', sortable: false },
  { key: 'follower_display_id', label: '关注者小石榴号', type: 'user-link', sortable: false },
  { key: 'follower_nickname', label: '关注者昵称', sortable: false },
  { key: 'following_id', label: '被关注者ID', sortable: false },
  { key: 'following_display_id', label: '被关注者小石榴号', type: 'user-link', sortable: false },
  { key: 'following_nickname', label: '被关注者昵称', sortable: false },
  { key: 'created_at', label: '关注时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'follower_id', label: '关注者ID', type: 'number', required: true, placeholder: '请输入关注者ID' },
  { key: 'following_id', label: '被关注者ID', type: 'number', required: true, placeholder: '请输入被关注者ID' }
]

const searchFields = [
  { key: 'follower_id', label: '关注者ID', placeholder: '搜索关注者ID' },
  { key: 'following_id', label: '被关注者ID', placeholder: '搜索被关注者ID' }
]
</script>