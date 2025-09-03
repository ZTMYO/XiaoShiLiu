<template>
  <CrudTable title="点赞管理" entity-name="点赞" api-endpoint="/admin/likes" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

// 目标类型映射
const targetTypeMap = {
  1: '1(笔记)',
  2: '2(评论)'
}

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'user_id', label: '用户ID', sortable: false },
  { key: 'user_display_id', label: '用户小石榴号', type: 'user-link', sortable: false },
  { key: 'target_type', label: '目标类型', type: 'mapped', map: targetTypeMap, sortable: false },
  { key: 'target_id', label: '目标ID', sortable: false },
  { key: 'created_at', label: '点赞时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'user_id', label: '用户ID', type: 'number', required: true, placeholder: '请输入用户ID' },
  {
    key: 'target_type',
    label: '目标类型',
    type: 'select',
    required: true,
    options: [
      { value: 1, label: '笔记' },
      { value: 2, label: '评论' }
    ]
  },
  { key: 'target_id', label: '目标ID', type: 'number', required: true, placeholder: '请输入目标ID' }
]

const searchFields = [
  { key: 'user_id', label: '用户ID', placeholder: '搜索用户ID' },
  {
    key: 'target_type',
    label: '目标类型',
    type: 'select',
    placeholder: '目标类型',
    options: [
      { value: '', label: '全部类型' },
      { value: '1', label: '笔记' },
      { value: '2', label: '评论' }
    ]
  },
  { key: 'target_id', label: '目标ID', placeholder: '搜索目标ID' }
]
</script>