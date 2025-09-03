<template>
  <div class="tag-selector">

    <div class="tag-input-container">
      <input v-model="tagInput" @keydown.enter.prevent="addTag" @keydown.comma.prevent="addTag" @input="onTagInput"
        class="tag-input" placeholder="输入标签名称，按回车添加" maxlength="20" />
      <button type="button" @click="addTag" class="add-tag-btn" :disabled="!tagInput.trim()">
        添加
      </button>
    </div>


    <div v-if="selectedTags.length > 0" class="selected-tags">
      <div class="selected-tags-header">
        <span>已选标签 ({{ selectedTags.length }}/{{ maxTags }})</span>
      </div>
      <div class="tags-list">
        <div v-for="(tag, index) in selectedTags" :key="index" class="tag-item selected">
          <span class="tag-name">{{ tag }}</span>
          <button type="button" @click="removeTag(tag)" class="remove-tag-btn">
            <SvgIcon name="close" />
          </button>
        </div>
      </div>
    </div>


    <div v-if="filteredSuggestions.length > 0" class="tag-suggestions">
      <div class="suggestions-header">标签建议</div>
      <div class="suggestions-list">
        <div v-for="tag in filteredSuggestions" :key="tag.id" @click="selectSuggestion(tag)" class="tag-item suggestion"
          :class="{ disabled: isTagSelected(tag) }">
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-usage">{{ tag.use_count || 0 }}次使用</span>
        </div>
      </div>
    </div>


    <div v-if="hotTags.length > 0" class="hot-tags">
      <div class="hot-tags-header">热门标签</div>
      <div class="tags-list">
        <div v-for="tag in hotTags" :key="tag.id" @click="selectSuggestion(tag)" class="tag-item hot"
          :class="{ disabled: isTagSelected(tag) }">
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-usage">{{ tag.use_count || 0 }}次</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import request from '@/api/request.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxTags: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:modelValue'])

// 响应式数据
const tagInput = ref('')
const allTags = ref([])
const hotTags = ref([])
const loading = ref(false)

// 计算属性
const selectedTags = computed(() => {
  const value = props.modelValue
  return Array.isArray(value) ? value : []
})

const filteredSuggestions = computed(() => {
  if (!tagInput.value.trim()) return []

  const input = tagInput.value.toLowerCase()
  return allTags.value
    .filter(tag =>
      tag.name.toLowerCase().includes(input) &&
      !isTagSelected(tag)
    )
    .slice(0, 10)
})

const loadAllTags = async () => {
  try {
    loading.value = true
    const response = await request.get('/tags')
    if (response.success) {
      allTags.value = response.data
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadHotTags = async () => {
  try {
    const response = await request.get('/tags/hot?limit=5')
    if (response.success) {
      hotTags.value = response.data
    }
  } catch (error) {
    console.error('获取热门标签失败:', error)
  }
}

const isTagSelected = (tag) => {
  // 检查标签名称是否已存在
  return selectedTags.value.includes(tag.name)
}

const addTag = () => {
  const input = tagInput.value.trim()
  if (!input) return

  if (selectedTags.value.length >= props.maxTags) {
    console.warn(`最多只能选择${props.maxTags}个标签`)
    return
  }

  // 检查标签是否已存在
  if (selectedTags.value.includes(input)) {
    tagInput.value = ''
    return
  }

  // 添加新标签
  const newTags = [...selectedTags.value, input]
  emit('update:modelValue', newTags)
  tagInput.value = ''
}

const removeTag = (tagToRemove) => {
  // 移除指定标签
  const newTags = selectedTags.value.filter(tag => tag !== tagToRemove)
  emit('update:modelValue', newTags)
}

const selectSuggestion = (tag) => {
  if (isTagSelected(tag)) return

  if (selectedTags.value.length >= props.maxTags) {
    alert(`最多只能选择${props.maxTags}个标签`)
    return
  }

  // 添加建议标签
  const newTags = [...selectedTags.value, tag.name]
  emit('update:modelValue', newTags)
  tagInput.value = ''
}

const onTagInput = () => {
  // 输入时的处理逻辑
}

// 生命周期
onMounted(() => {
  loadAllTags()
  loadHotTags()
})
</script>

<style scoped>
.tag-selector {
  width: 100%;
}

.tag-input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  max-width: 100%;
}

.tag-input {
  flex: 1;
  max-width: 300px;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  caret-color: var(--primary-color);
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
}

.tag-input:focus {
  border-color: var(--primary-color);
}

.add-tag-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: var(--text-color-inverse);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.add-tag-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.add-tag-btn:disabled {
  background: var(--text-color-quaternary);
  cursor: not-allowed;
}

.selected-tags,
.tag-suggestions,
.hot-tags {
  margin-bottom: 16px;
}

.selected-tags-header,
.suggestions-header,
.hot-tags-header {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary);
  margin-bottom: 8px;
}

.tags-list,
.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.tag-item.selected {
  background: var(--primary-color);
  color: #e7e7e7;
  cursor: default;
}

.tag-item.suggestion {
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color-primary);
  color: var(--text-color-secondary);
}

.tag-item.suggestion:hover:not(.disabled) {
  border-color: var(--primary-color);
}

.tag-item.hot {
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color-primary);
  color: var(--text-color-tag);
}

.tag-item.hot:hover:not(.disabled) {
  border-color: var(--primary-color);
}

.tag-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-name {
  flex: 1;
}

.tag-usage {
  font-size: 12px;
  opacity: 0.7;
  margin-left: 8px;
}

.remove-tag-btn {
  background: none;
  border: none;
  color: #e7e7e7;
  cursor: pointer;
  padding: 2px;
  margin-left: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.remove-tag-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.remove-tag-btn svg {
  width: 12px;
  height: 12px;
}
</style>