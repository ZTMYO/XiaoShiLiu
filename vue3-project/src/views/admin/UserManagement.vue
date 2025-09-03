<template>
  <CrudTable title="用户管理" entity-name="用户" api-endpoint="/admin/users" :columns="columns" :form-fields="formFields"
    :search-fields="searchFields" default-sort-field="id" default-sort-order="asc" />
</template>

<script setup>
import CrudTable from '@/views/admin/components/CrudTable.vue'
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'user_id', label: '小石榴号', type: 'user-link', sortable: false },
  { key: 'nickname', label: '用户昵称', sortable: false },
  { key: 'avatar', label: '头像', type: 'image', sortable: false },
  { key: 'bio', label: '个人简介', type: 'content', sortable: false },
  { key: 'location', label: 'IP属地', sortable: false },
  { key: 'personality_tags', label: '个性标签', type: 'personality-tags', sortable: false },
  { key: 'follow_count', label: '关注数', sortable: false },
  { key: 'fans_count', label: '粉丝数', sortable: true },
  { key: 'like_count', label: '获赞数', sortable: true },
  { key: 'is_active', label: '账号状态', type: 'boolean', sortable: false },
  { key: 'created_at', label: '注册时间', type: 'date', sortable: true }
]

const formFields = [
  { key: 'user_id', label: '小石榴号', type: 'text', required: true, placeholder: '请输入小石榴号', maxlength: 15 },
  { key: 'nickname', label: '昵称', type: 'text', required: true, placeholder: '请输入昵称', maxlength: 10 },
  { key: 'avatar', label: '头像', type: 'avatar-upload', placeholder: '上传头像' },
  { key: 'avatar', label: '头像URL', type: 'text', placeholder: '请输入头像URL或使用上方上传功能' },
  { key: 'bio', label: '个人简介', type: 'textarea', placeholder: '请输入个人简介' },
  { key: 'location', label: '属地', type: 'text', placeholder: '请输入属地' },
  { key: 'gender', label: '性别', type: 'select', options: [{ value: '', label: '请选择' }, { value: '男', label: '男' }, { value: '女', label: '女' }], placeholder: '请选择性别' },
  {
    key: 'zodiac_sign', label: '星座', type: 'select', options: [
      { value: '', label: '请选择' },
      { value: '白羊座', label: '白羊座' }, { value: '金牛座', label: '金牛座' }, { value: '双子座', label: '双子座' },
      { value: '巨蟹座', label: '巨蟹座' }, { value: '狮子座', label: '狮子座' }, { value: '处女座', label: '处女座' },
      { value: '天秤座', label: '天秤座' }, { value: '天蝎座', label: '天蝎座' }, { value: '射手座', label: '射手座' },
      { value: '摩羯座', label: '摩羯座' }, { value: '水瓶座', label: '水瓶座' }, { value: '双鱼座', label: '双鱼座' }
    ], placeholder: '请选择星座'
  },
  {
    key: 'mbti', label: 'MBTI', type: 'mbti-picker', dimensions: [
      {
        key: 'mbti_1',
        label: '外向/内向',
        options: [
          { value: 'E', label: 'E' },
          { value: 'I', label: 'I' }
        ]
      },
      {
        key: 'mbti_2',
        label: '感觉/直觉',
        options: [
          { value: 'S', label: 'S' },
          { value: 'N', label: 'N' }
        ]
      },
      {
        key: 'mbti_3',
        label: '思考/情感',
        options: [
          { value: 'T', label: 'T' },
          { value: 'F', label: 'F' }
        ]
      },
      {
        key: 'mbti_4',
        label: '判断/知觉',
        options: [
          { value: 'J', label: 'J' },
          { value: 'P', label: 'P' }
        ]
      }
    ], placeholder: '请选择MBTI类型'
  },
  {
    key: 'education', label: '学历', type: 'select', options: [
      { value: '', label: '请选择' },
      { value: '高中及以下', label: '高中及以下' }, { value: '大专', label: '大专' }, { value: '本科', label: '本科' },
      { value: '硕士', label: '硕士' }, { value: '博士', label: '博士' }
    ], placeholder: '请选择学历'
  },
  { key: 'major', label: '专业', type: 'text', placeholder: '请输入专业' },
  { key: 'interests', label: '兴趣爱好', type: 'interest-input', placeholder: '请输入兴趣爱好' },
  { key: 'is_active', label: '激活状态', type: 'checkbox', checkboxLabel: '激活' }
]

const searchFields = [
  { key: 'user_id', label: '小石榴号', placeholder: '搜索小石榴号' },
  { key: 'nickname', label: '昵称', placeholder: '搜索昵称' },
  { key: 'location', label: '属地', placeholder: '搜索属地' },
  {
    key: 'is_active',
    label: '账号状态',
    type: 'select',
    placeholder: '账号状态',
    options: [
      { value: '', label: '全部状态' },
      { value: '1', label: '激活' },
      { value: '0', label: '未激活' }
    ]
  }
]
</script>