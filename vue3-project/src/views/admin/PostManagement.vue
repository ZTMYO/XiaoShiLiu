<template>
  <CrudTable title="笔记管理" entity-name="笔记" api-endpoint="/admin/posts" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'

// 分类映射
const categoryMap = {
  'study': '学习',
  'campus': '校园',
  'emotion': '情感',
  'interest': '兴趣',
  'life': '生活',
  'social': '社交',
  'help': '求助',
  'opinion': '观点',
  'graduation': '毕业',
  'career': '职场',
  'general': '未知'
}

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'title', label: '标题', type: 'content', sortable: false },
  { key: 'user_id', label: '作者ID', sortable: false },
  { key: 'user_display_id', label: '小石榴号', type: 'user-link', sortable: false },
  { key: 'category', label: '分类', sortable: false, type: 'mapped', map: categoryMap },
  { key: 'is_draft', label: '草稿', sortable: false, type: 'boolean', trueText: '是', falseText: '否' },
  { key: 'content', label: '内容', type: 'content', sortable: false },
  { key: 'tags', label: '标签', type: 'tags', sortable: false },
  { key: 'images', label: '图片', type: 'image-gallery', sortable: false },
  { key: 'view_count', label: '浏览', sortable: true },
  { key: 'like_count', label: '点赞', sortable: true },
  { key: 'collect_count', label: '收藏', sortable: true },
  { key: 'comment_count', label: '评论', sortable: true },
  { key: 'created_at', label: '发布时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'user_id', label: '作者ID', type: 'number', required: true, placeholder: '请输入用户ID' },
  { key: 'title', label: '标题', type: 'text', required: true, placeholder: '请输入笔记标题' },
  { key: 'content', label: '内容', type: 'textarea', required: true, placeholder: '请输入笔记内容' },
  {
    key: 'category',
    label: '分类',
    type: 'select',
    required: true,
    options: [
      { value: 'study', label: '学习' },
      { value: 'campus', label: '校园' },
      { value: 'emotion', label: '情感' },
      { value: 'interest', label: '兴趣' },
      { value: 'life', label: '生活' },
      { value: 'social', label: '社交' },
      { value: 'help', label: '求助' },
      { value: 'opinion', label: '观点' },
      { value: 'graduation', label: '毕业' },
      { value: 'career', label: '职场' }
    ]
  },
  { key: 'is_draft', label: '草稿', type: 'checkbox', required: false, description: '勾选表示保存为草稿，不勾选表示发布' },
  { key: 'view_count', label: '浏览量', type: 'number', required: false, placeholder: '请输入浏览量', min: 0 },
  { key: 'tags', label: '标签', type: 'tags', maxTags: 10 },
  { key: 'images', label: '图片上传', type: 'multi-image-upload', maxImages: 9 },
  { key: 'image_urls', label: '图片URL', type: 'dynamic-image-urls', maxImages: 9 }

]

const searchFields = [
  { key: 'title', label: '标题', placeholder: '搜索标题' },
  {
    key: 'category',
    label: '分类',
    type: 'select',
    placeholder: '选择分类',
    options: [
      { value: '', label: '全部分类' },
      { value: 'study', label: '学习' },
      { value: 'campus', label: '校园' },
      { value: 'emotion', label: '情感' },
      { value: 'interest', label: '兴趣' },
      { value: 'life', label: '生活' },
      { value: 'social', label: '社交' },
      { value: 'help', label: '求助' },
      { value: 'opinion', label: '观点' },
      { value: 'graduation', label: '毕业' },
      { value: 'career', label: '职场' }
    ]
  },
  {
    key: 'is_draft',
    label: '发布状态',
    type: 'select',
    placeholder: '发布状态',
    options: [
      { value: '', label: '全部状态' },
      { value: '0', label: '已发布' },
      { value: '1', label: '草稿' }
    ]
  },
  { key: 'user_id', label: '作者ID', placeholder: '搜索作者ID' }
]
</script>