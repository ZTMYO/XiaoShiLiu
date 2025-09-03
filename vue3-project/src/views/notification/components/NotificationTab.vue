<template>
  <div class="fixedTab" ref="fixedTabRef">
    <div v-for="(tab, index) in tabs" :key="tab.key" class="tab-item" :class="{ active: activeTab === tab.key }"
      @click="handleTabClick(tab.key)" ref="tabItems">
      <span class="tab-label">{{ tab.label }}</span>

      <div v-if="getUnreadCount(tab.key) > 0" class="unread-dot"></div>
    </div>
    <div class="tab-slider" :style="{
      left: sliderLeft + 'px',
      width: sliderWidth + 'px'
    }"></div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  activeTab: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true
  },
  unreadCounts: {
    type: Object,
    default: () => ({
      comments: 0,
      likes: 0,
      collections: 0,
      follows: 0
    })
  }
})

const emit = defineEmits(['update:activeTab'])

// 获取指定 tab 的未读数量
const getUnreadCount = (tabKey) => {
  return props.unreadCounts[tabKey] || 0
}

// Tab 元素引用和滑块状态
const tabItems = ref([])
const sliderLeft = ref(0)
const sliderWidth = ref(0)
const fixedTabRef = ref(null)

// Tab切换处理
const handleTabClick = (tabKey) => {
  emit('update:activeTab', tabKey)
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 更新滑块位置和宽度
const updateSlider = () => {
  nextTick(() => {
    const activeIndex = props.tabs.findIndex(tab => tab.key === props.activeTab)
    if (activeIndex === -1 || !tabItems.value[activeIndex]) return
    const tabRect = tabItems.value[activeIndex].getBoundingClientRect()
    const containerRect = fixedTabRef.value.getBoundingClientRect()
    // 计算滑块相对于容器的位置
    sliderLeft.value = tabRect.left - containerRect.left
    sliderWidth.value = tabRect.width
  })
}

// 监听activeTab变化
watch(() => props.activeTab, updateSlider)

// 组件挂载和卸载
onMounted(() => {
  // 初始化滑块位置
  nextTick(updateSlider)
  // 监听窗口大小变化，重新计算滑块位置
  window.addEventListener('resize', updateSlider)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSlider)
})

// 暴露更新滑块的方法，供父组件调用
defineExpose({
  updateSlider
})
</script>

<style scoped>
/* 固定的Tab导航 */
.fixedTab {
  position: fixed;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 700px;
  background: var(--bg-color-primary);
  display: flex;
  padding: 16px;
  z-index: 200;
  overflow-x: auto;
  scrollbar-width: none;
  margin-bottom: 0;
  transition: background-color 0.2s ease;
}

/* 大屏模式下的Tab定位调整 */
@media (min-width: 901px) {
  .fixedTab {
    left: calc(50% + 114px);
    transform: translateX(-50%);
    width: 100%;
  }
}

.fixedTab::-webkit-scrollbar {
  display: none;
}

.tab-item {
  padding: 0 10px;
  height: 40px;
  width: 68px;
  font-size: 16px;
  color: var(--text-color-secondary);
  cursor: pointer;
  background: transparent;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  position: relative;
  z-index: 2;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.tab-label {
  pointer-events: none;
}

.unread-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
  pointer-events: none;
}

.tab-item:last-child {
  margin-right: 0;
}

.tab-item:hover {
  color: var(--text-color-primary);
  transition: color 0.2s ease;
}

.tab-item.active {
  color: var(--text-color-primary);
  font-weight: bold;
  transition: color 0.2s ease;
}

/* 滑块指示器 */
.tab-slider {
  position: absolute;
  height: 40px;
  border-radius: 20px;
  background: var(--bg-color-secondary);
  transition: left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    background-color 0.2s ease;
  z-index: 1;
}
</style>