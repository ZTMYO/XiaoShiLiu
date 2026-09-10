<template>
  <CrudTable title="笔记管理" entity-name="笔记" api-endpoint="/admin/posts" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCategories } from '@/api/categories'
import CrudTable from '@/views/admin/components/CrudTable.vue'

// 分类数据
const categories = ref([])

// 加载分类列表
const loadCategories = async () => {
  try {
    const response = await getCategories()
    categories.value = response.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 组件挂载时加载分类
onMounted(() => {
  loadCategories()
})

const columns = [
  { key: 'id', label: 'ID', type: 'post-link', sortable: true },
  { key: 'title', label: '标题', type: 'content', sortable: false },
  { key: 'user_display_id', label: '小石榴号', type: 'user-link', sortable: false },
  { key: 'category', label: '分类', sortable: false },
  { key: 'type', label: '类型', type: 'mapped', map: { 1: '图文', 2: '视频' }, sortable: false },
  { key: 'copyright', label: '版权', type: 'mapped', map: { 0: '原创', 1: '转载' }, sortable: false },
  {
    key: 'status',
    label: '状态',
    type: 'status',
    sortable: false,
    statusMap: {
      0: { text: '已发布', class: 'status-published' },
      1: { text: '草稿', class: 'status-draft' },
      2: { text: '待审核', class: 'status-pending' },
      3: { text: '未过审', class: 'status-unpassed' }
    }
  },
  { key: 'content', label: '内容', type: 'content', sortable: false },
  { key: 'tags', label: '标签', type: 'tags', sortable: false },
  { key: 'images', label: '媒体', type: 'image-gallery', sortable: false },
  { key: 'view_count', label: '浏览', sortable: true },
  { key: 'like_count', label: '点赞', sortable: true },
  { key: 'collect_count', label: '收藏', sortable: true },
  { key: 'comment_count', label: '评论', sortable: true },
  { key: 'created_at', label: '发布时间', type: 'date', sortable: true }
]

const formFields = computed(() => {
  const baseFields = [
    { key: 'user_id', label: '作者ID', type: 'number', required: true, placeholder: '请输入用户ID' },
    { key: 'title', label: '标题', type: 'text', required: true, placeholder: '请输入笔记标题' },
    { key: 'content', label: '内容', type: 'textarea', required: true, placeholder: '请输入笔记内容' },
    {
      key: 'category_id',
      label: '分类',
      type: 'select',
      required: true,
      options: categories.value.map(cat => ({ value: cat.id, label: cat.name }))
    },
    {
      key: 'type',
      label: '笔记类型',
      type: 'select',
      required: true,
      options: [
        { value: 1, label: '图文笔记' },
        { value: 2, label: '视频笔记' }
      ]
    },
    {
      key: 'copyright',
      label: '版权声明',
      type: 'select',
      required: true,
      options: [
        { value: 0, label: '原创' },
        { value: 1, label: '转载' }
      ],
      description: '0=原创, 1=转载'
    },
    {
      key: 'status',
      label: '笔记状态',
      type: 'select',
      required: true,
      options: [
        { value: 0, label: '已发布' },
        { value: 1, label: '草稿' },
        { value: 2, label: '待审核' },
        { value: 3, label: '未过审' }
      ],
      description: '0=发布, 1=草稿, 2=待审核, 3=未过审'
    },
    { key: 'view_count', label: '浏览量', type: 'number', required: false, placeholder: '请输入浏览量', min: 0 },
    { key: 'tags', label: '标签', type: 'tags', maxTags: 10 }
  ]

  // 根据笔记类型添加不同的媒体上传字段
  baseFields.push(
    { key: 'images', label: '图片上传', type: 'multi-image-upload', maxImages: 9, condition: { field: 'type', value: 1 } },
    { key: 'video_upload', label: '视频上传', type: 'video-upload', condition: { field: 'type', value: 2 } }
  )

  return baseFields
})

const searchFields = computed(() => [
  { key: 'title', label: '标题', placeholder: '搜索标题' },
  {
    key: 'category_id',
    label: '分类',
    type: 'select',
    placeholder: '选择分类',
    options: [
      { value: '', label: '全部分类' },
      { value: 'null', label: '未知' },
      ...categories.value.map(cat => ({ value: cat.id, label: cat.name }))
    ]
  },
  {
    key: 'type',
    label: '类型',
    type: 'select',
    placeholder: '选择类型',
    options: [
      { value: '', label: '全部类型' },
      { value: '1', label: '图文' },
      { value: '2', label: '视频' }
    ]
  },
  {
    key: 'copyright',
    label: '版权',
    type: 'select',
    placeholder: '选择版权',
    options: [
      { value: '', label: '全部版权' },
      { value: '0', label: '原创' },
      { value: '1', label: '转载' }
    ]
  },
  {
    key: 'status',
    label: '笔记状态',
    type: 'select',
    placeholder: '笔记状态',
    options: [
      { value: '', label: '全部状态' },
      { value: '0', label: '已发布' },
      { value: '1', label: '草稿' },
      { value: '2', label: '待审核' },
      { value: '3', label: '未过审' }
    ]
  },
  { key: 'user_display_id', label: '作者小石榴号', placeholder: '搜索作者小石榴号' }
])
</script>

<style scoped>
:deep(.status-pending) {
  color: #f39c12;
}

:deep(.status-unpassed) {
  color: #e74c3c;
}
</style>