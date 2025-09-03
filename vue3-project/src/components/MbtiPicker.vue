<template>
  <div class="mbti-picker">
    <div class="mbti-header">
      <span class="mbti-result">{{ displayValue }}</span>
      <button type="button" class="clear-btn" @click="clearSelection" title="清除选择">
        ×
      </button>
    </div>
    <div class="picker-container">
      <div v-for="(dimension, index) in dimensions" :key="dimension.key" class="dimension-picker">
        <div class="dimension-label">{{ dimension.label }}</div>
        <div class="picker-wheel" :ref="el => setPickerRef(dimension.key, el)">
          <div class="picker-options">
            <div v-for="option in dimension.options" :key="option.value" class="picker-option"
              :class="{ active: selectedValues[dimension.key] === option.value }"
              @click="selectOption(dimension.key, option.value)">
              {{ option.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  dimensions: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const pickerRefs = ref({})
const selectedValues = ref({})

const setPickerRef = (key, el) => {
  if (el) {
    pickerRefs.value[key] = el
  }
}

// 计算显示值
const displayValue = computed(() => {
  const hasSelection = props.dimensions.some(dimension =>
    selectedValues.value[dimension.key]
  )
  if (!hasSelection) {
    return '请选择MBTI类型'
  }
  const mbtiValues = props.dimensions.map(dimension =>
    selectedValues.value[dimension.key] || '_ '
  )
  return mbtiValues.join('')
})

// 清除选择
const clearSelection = () => {
  props.dimensions.forEach(dimension => {
    selectedValues.value[dimension.key] = ''
  })
  emit('update:modelValue', '')
}

// 初始化选中值
const initializeValues = () => {
  if (props.modelValue && props.modelValue.length === 4) {
    // 如果有现有值，解析MBTI字符串
    const mbtiChars = props.modelValue.split('')
    props.dimensions.forEach((dimension, index) => {
      if (mbtiChars[index]) {
        selectedValues.value[dimension.key] = mbtiChars[index]
      }
    })
  } else {
    // 如果没有现有值，保持空状态
    props.dimensions.forEach(dimension => {
      selectedValues.value[dimension.key] = ''
    })
  }
}

// 选择选项
const selectOption = (dimensionKey, value) => {
  selectedValues.value[dimensionKey] = value
  updateModelValue()
}

// 更新模型值
const updateModelValue = () => {
  const mbtiValues = props.dimensions.map(dimension =>
    selectedValues.value[dimension.key] || ''
  )
  const hasAllSelections = mbtiValues.every(value => value !== '')
  const mbtiString = hasAllSelections ? mbtiValues.join('') : ''
  emit('update:modelValue', mbtiString)
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.length === 4) {
    const mbtiChars = newValue.split('')
    props.dimensions.forEach((dimension, index) => {
      if (mbtiChars[index]) {
        selectedValues.value[dimension.key] = mbtiChars[index]
      }
    })
  } else {
    // 如果没有值，保持空状态
    props.dimensions.forEach(dimension => {
      selectedValues.value[dimension.key] = ''
    })
  }
}, { immediate: true })
</script>

<style scoped>
.mbti-picker {
  width: 60%;
  max-width: 400px;
  margin: 0 auto;
}

.mbti-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 2px 6px;
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
}

.mbti-result {
  font-size: 12px;
  color: var(--text-color-primary);
}

.clear-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--text-color-primary);
  transform: scale(1.1);
}



.clear-btn:active {
  transform: scale(0.95);
}

.picker-container {
  display: flex;
  gap: 20px;
  justify-content: space-between;
}

.dimension-picker {
  flex: 1;
  min-width: 0;
}

.dimension-label {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.picker-wheel {
  background: var(--bg-color-primary);
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  overflow: hidden;
}

.picker-options {
  display: flex;
  flex-direction: column;
}

.picker-option {
  padding: 10px 5px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 18px;
  font-weight: 500;
}

.picker-option:last-child {
  border-bottom: none;
}

.picker-option:hover {
  opacity: 0.8;
}

.picker-option.active {
  background: var(--primary-color);
  color: white;
}

.picker-option.active:hover {
  background: var(--primary-color);
  opacity: 0.9;
}

@media (max-width: 550px) {
  .mbti-picker {
    width: 80%;
    max-width: 300px;
    margin: 0 auto;
  }

  .picker-container {
    gap: 8px;
  }

  .picker-option {
    padding: 10px 6px;
    font-size: 13px;
  }

  .dimension-label {
    font-size: 11px;
  }
}
</style>