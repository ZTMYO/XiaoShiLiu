<template>
  <div class="dropdown-selector" :style="{ maxWidth, minWidth }">
    <div class="dropdown-toggle" :class="{ active: isOpen }" @click="toggleDropdown">
      <div class="selected-content">
        <span v-if="selectedOption" class="selected-text">
          {{ getDisplayText(selectedOption) }}
        </span>
        <span v-else class="placeholder-text">{{ placeholder }}</span>
        <SvgIcon name="down" :width="14" :height="14" class="dropdown-arrow" :class="{ rotated: isOpen }" />
      </div>
      <div v-if="isOpen" class="dropdown-options">
        <div v-for="option in options" :key="getOptionKey(option)" class="dropdown-option"
          :class="{ selected: isSelected(option) }" @click.stop="selectOption(option)">
          <span class="option-text">{{ getDisplayText(option) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({
  // 选项数组
  options: {
    type: Array,
    default: () => []
  },
  // 当前选中的值
  modelValue: {
    type: [String, Number, Object],
    default: null
  },
  // 占位符文本
  placeholder: {
    type: String,
    default: '请选择'
  },
  // 显示文本的字段名（当选项是对象时）
  labelKey: {
    type: String,
    default: 'label'
  },
  // 值字段名（当选项是对象时）
  valueKey: {
    type: String,
    default: 'value'
  },
  // 最大宽度
  maxWidth: {
    type: String,
    default: '300px'
  },
  // 最小宽度
  minWidth: {
    type: String,
    default: '200px'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const { lock, unlock } = useScrollLock()

// 计算当前选中的选项
const selectedOption = computed(() => {
  if (!props.modelValue) return null

  return props.options.find(option => {
    if (typeof option === 'object') {
      return option[props.valueKey] === props.modelValue
    }
    return option === props.modelValue
  })
})

// 获取选项的显示文本
const getDisplayText = (option) => {
  if (!option) return ''

  if (typeof option === 'object') {
    return option[props.labelKey] || ''
  }
  return option
}

// 获取选项的唯一标识
const getOptionKey = (option) => {
  if (typeof option === 'object') {
    return option[props.valueKey]
  }
  return option
}

// 判断选项是否被选中
const isSelected = (option) => {
  if (!props.modelValue) return false

  if (typeof option === 'object') {
    return option[props.valueKey] === props.modelValue
  }
  return option === props.modelValue
}

// 切换下拉菜单
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

// 选择选项
const selectOption = (option) => {
  const value = typeof option === 'object' ? option[props.valueKey] : option

  emit('update:modelValue', value)
  emit('change', { option, value })
  isOpen.value = false
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  const dropdown = event.target.closest('.dropdown-selector')
  if (!dropdown) {
    isOpen.value = false
  }
}

// 监听下拉菜单状态变化，控制滚动锁定
watch(isOpen, (newValue) => {
  if (newValue) {
    lock()
  } else {
    unlock()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-selector {
  position: relative;
  width: fit-content;
  user-select: none;
}

.dropdown-toggle {
  position: relative;
  width: 100%;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-toggle:hover {
  border-color: var(--border-color-secondary);
}

.dropdown-toggle.active {
  border-color: #ff4757;
}

.dropdown-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.selected-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  font-size: 14px;
}

.selected-text {
  color: var(--text-color-primary);
  font-weight: 500;
}

.placeholder-text {
  color: var(--text-color-secondary);
}

.dropdown-arrow {
  color: var(--text-color-secondary);
  transition: transform 0.2s ease;
  user-select: none;
  display: flex;
  align-items: center;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-color-primary);
  border: 1px solid var(--border-color-primary);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}

.dropdown-option {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border-radius: 6px;
  margin-bottom: 4px;
}

.dropdown-option:last-child {
  margin-bottom: 0;
}

.dropdown-option:hover {
  background: var(--bg-color-secondary);
  border-radius: 6px;
}

.dropdown-option.selected {
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
  font-weight: 500;
  border-radius: 6px;
}

.option-text {
  font-size: 14px;
}

/* 滚动条样式 */
.dropdown-options::-webkit-scrollbar {
  width: 4px;
}

.dropdown-options::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-options::-webkit-scrollbar-thumb {
  background: var(--border-color-primary);
  border-radius: 2px;
}

.dropdown-options::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-secondary);
}
</style>