<template>
  <div class="dynamic-image-urls">
    <div class="url-inputs">
      <div v-for="(url, index) in urls" :key="index" class="url-input-group">
        <div class="url-input-wrapper">
          <input type="text" :value="url" @input="updateUrl(index, $event.target.value)"
            :placeholder="`图片URL ${index + 1}`" class="url-input" :class="{ 'placeholder-input': isPlaceholder(url) }"
            :readonly="isPlaceholder(url)" :title="isPlaceholder(url) ? '这是文件上传的占位符，提交表单后会自动获取真实URL' : ''" />
          <button type="button" @click="removeUrl(index)" class="remove-btn" :disabled="urls.length <= 1">
            <SvgIcon name="delete" />
          </button>
        </div>
        <div v-if="isPlaceholder(url)" class="placeholder-hint">
          📁 此图片来自文件上传，提交后将自动获取URL
        </div>
      </div>
    </div>

    <div class="actions">
      <button type="button" @click="addUrl" class="add-btn" :disabled="urls.length >= maxImages">
        <SvgIcon name="publish" />
        添加图片URL ({{ urls.length }}/{{ maxImages }})
      </button>
    </div>

    <div class="tips">
      <p>• 最多添加{{ maxImages }}张图片</p>
      <p>• 请输入有效的图片URL</p>
      <p>• 支持 JPG、PNG、GIF 格式</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxImages: {
    type: Number,
    default: 9
  }
})

const emit = defineEmits(['update:modelValue', 'remove-image'])

// 初始化URLs数组，确保所有元素都是字符串
const initUrls = () => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.filter(url => typeof url === 'string').map(url => url.toString())
  }
  return []
}

const urls = ref(initUrls())

// 确保至少有一个输入框
if (urls.value.length === 0) {
  urls.value.push('')
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  // 确保newValue是数组，并且所有元素都是字符串
  if (Array.isArray(newValue)) {
    const filteredUrls = newValue.filter(url => typeof url === 'string').map(url => url.toString())
    // 只有当数组内容真正不同时才更新
    if (JSON.stringify(filteredUrls) !== JSON.stringify(urls.value.filter(url => url.trim()))) {
      urls.value = filteredUrls
      // 确保至少有一个输入框
      if (urls.value.length === 0) {
        urls.value.push('')
      }
    }
  } else if (urls.value.length === 0) {
    urls.value = ['']
  }
}, { immediate: true })

// 监听内部数组变化，同步到外部
watch(urls, (newValue) => {
  // 过滤掉空的URL，确保url是字符串类型
  const validUrls = newValue.filter(url => url && typeof url === 'string' && url.trim())
  // 只有当有效URL数组真正改变时才发射事件
  const currentValidUrls = Array.isArray(props.modelValue) ?
    props.modelValue.filter(url => url && typeof url === 'string' && url.trim()) : []

  if (JSON.stringify(validUrls) !== JSON.stringify(currentValidUrls)) {
    emit('update:modelValue', validUrls)
  }
}, { deep: true })

// 更新指定位置的URL
const updateUrl = (index, value) => {
  urls.value[index] = value
}

// 添加新的URL输入框
const addUrl = () => {
  if (urls.value.length < props.maxImages) {
    urls.value.push('')
  }
}

// 移除指定位置的URL
const removeUrl = (index) => {
  if (urls.value.length > 1) {
    const removedUrl = urls.value[index]
    urls.value.splice(index, 1)

    // 如果删除的是占位符，通知父组件删除对应的图片
    if (isPlaceholder(removedUrl)) {
      const imageId = extractImageIdFromPlaceholder(removedUrl)
      if (imageId) {
        emit('remove-image', imageId)
      }
    }
  }
}

// 判断是否为占位符
const isPlaceholder = (url) => {
  return typeof url === 'string' && url.startsWith('[待上传')
}

// 从占位符中提取图片ID
const extractImageIdFromPlaceholder = (placeholder) => {
  if (typeof placeholder === 'string' && placeholder.startsWith('[待上传:')) {
    const match = placeholder.match(/\[待上传:(.+)\]/)
    return match ? match[1] : null
  }
  return null
}


</script>

<style scoped>
.dynamic-image-urls {
  width: 100%;
}

.url-inputs {
  margin-bottom: 15px;
}

.url-input-group {
  margin-bottom: 15px;
}

.url-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  background-color: var(--bg-color-primary);
  color: var(--text-color-primary);
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.url-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.placeholder-input {
  background-color: var(--bg-color-secondary);
  color: var(--text-color-tertiary);
  border-color: var(--border-color-secondary);
  cursor: not-allowed;
}

.placeholder-input:focus {
  border-color: var(--border-color-secondary);
}

.remove-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  min-width: 36px;
  height: 36px;
}

.remove-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.remove-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.remove-btn svg {
  width: 16px;
  height: 16px;
}



.actions {
  margin-bottom: 15px;
}

.add-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.add-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.add-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.add-btn svg {
  width: 16px;
  height: 16px;
}

.tips {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.tips p {
  margin: 2px 0;
}

.placeholder-hint {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}
</style>