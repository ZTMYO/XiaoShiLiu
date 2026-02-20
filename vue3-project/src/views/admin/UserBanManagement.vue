<template>
  <CrudTable title="用户封禁管理" entity-name="封禁记录" api-endpoint="/admin/user-ban" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" default-sort-field="created_at" default-sort-order="desc" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'user_id', label: '用户ID', sortable: true },
  { key: 'user_display_id', label: '小石榴号', sortable: false },
  { key: 'nickname', label: '用户昵称', sortable: false },
  { key: 'reason', label: '封禁原因', sortable: false, maxLength: 50 },
  { key: 'end_time', label: '封禁结束时间', type: 'date', sortable: true },
  { key: 'status', label: '状态', type: 'mapped', sortable: true, map: { 0: '封禁中', 1: '管理员解封', 2: '自动解封', 3: '永久封禁', 4: '封禁撤销' } },
  { key: 'operator', label: '操作人ID', sortable: true },
  { key: 'created_at', label: '创建时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'user_id', label: '用户ID', type: 'number', required: true, placeholder: '请输入用户ID' },
  { key: 'reason', label: '封禁原因', type: 'text', required: true, placeholder: '请输入封禁原因', maxlength: 255 },
  { key: 'end_time', label: '封禁结束时间', type: 'text', placeholder: '请输入封禁结束时间（留空表示永久封禁，格式：YYYY-MM-DD HH:MM:SS）' },
  { 
    key: 'status', 
    label: '状态', 
    type: 'select', 
    required: false, 
    placeholder: '请选择状态',
    defaultValue: '0',
    options: [
      { value: '0', label: '封禁中' },
      { value: '1', label: '管理员解封' }
    ]
  }
]

const searchFields = [
  { key: 'user_id', label: '用户ID', type: 'number', placeholder: '搜索用户ID' },
  { key: 'reason', label: '封禁原因', placeholder: '搜索封禁原因' },
  { 
    key: 'status', 
    label: '状态', 
    type: 'select', 
    placeholder: '选择状态',
    options: [
      { value: '', label: '全部状态' },
      { value: '0', label: '封禁中' },
      { value: '1', label: '管理员解封' },
      { value: '2', label: '自动解封' },
      { value: '3', label: '永久封禁' },
      { value: '4', label: '封禁撤销' }
    ]
  },
  { key: 'operator', label: '操作人ID', type: 'number', placeholder: '搜索操作人ID' }
]
</script>

<style scoped>
/* 自定义样式 */
</style>