<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScroll } from '@vueuse/core'
import { useNavigationStore } from '@/stores/navigation'
import TabContainer from '@/components/TabContainer.vue'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()

// 获取滚动信息
const { y: scrollY } = useScroll(window)

// 定义props
const props = defineProps({
  tagStats: {
    type: Array,
    default: () => []
  },
  activeTag: {
    type: String,
    default: ''
  },
  activeTab: {
    type: String,
    default: 'all'
  }
})

// 定义emit事件
const emit = defineEmits(['tag-reload'])

// 防抖相关状态
const isAnimating = ref(false)
const pendingTagId = ref(null)
const currentRequestTagId = ref(null)
const animationTimer = ref(null)

// 标签选项卡数据
const tagTabs = computed(() => {
  const tabs = [
    { id: '', label: '全部', count: 0 }
  ]

  if (props.tagStats && props.tagStats.length > 0) {
    tabs.push(...props.tagStats.map(tag => ({
      id: tag.id,
      label: tag.label,
      count: tag.count
    })))
  }

  return tabs
})

// 是否显示标签选项卡
const shouldShowTags = computed(() => {
  return tagTabs.value.length > 1 && (props.activeTab === 'all' || props.activeTab === 'posts')
})

function handleTagChange(item) {
  // 如果切换到相同标签，不执行任何操作
  if (props.activeTag === item.id) return
  // 立即返回顶部
  navigationStore.scrollToTop('instant')

  // 如果当前正在播放动画
  if (isAnimating.value) {
    // 进入防抖模式：只记录最后一次点击的标签，不发起新请求
    pendingTagId.value = item.id
    // 防抖模式：等待当前请求完成
    return
  }

  // 立即开始新的切换流程
  startTagSwitch(item)
}

function startTagSwitch(item) {
  // 设置动画状态
  isAnimating.value = true
  currentRequestTagId.value = item.id
  pendingTagId.value = null

  // 触发父组件的刷新动画
  emit('tag-reload')

  // 更新路由参数
  const query = { ...route.query }
  if (item.id) {
    query.tag = item.id
  } else {
    delete query.tag
  }

  // 立即执行路由跳转
  router.push({ query }).then(() => {
    // 设置动画计时器（700ms，与explore保持一致）
    animationTimer.value = setTimeout(() => {
      // 动画结束
      isAnimating.value = false

      // 检查是否有等待中的标签切换
      if (pendingTagId.value && pendingTagId.value !== currentRequestTagId.value) {
        // 有等待中的标签，开始第二次切换
        const targetTag = tagTabs.value.find(tag => tag.id === pendingTagId.value)
        if (targetTag) {
          startTagSwitch(targetTag)
          return
        }
      }

      // 没有等待中的标签，重置状态
      currentRequestTagId.value = null
      pendingTagId.value = null
    }, 700)
  })
}

// 组件卸载时清理计时器
onUnmounted(() => {
  if (animationTimer.value) {
    clearTimeout(animationTimer.value)
  }
})
</script>

<template>

  <template v-if="shouldShowTags">

    <div class="tag-container">
      <TabContainer :tabs="tagTabs" :activeTab="activeTag" :enableDrag="true" @tab-change="handleTagChange" />
    </div>


    <div class="fixed-tag-container" :class="{ hidden: scrollY < 100 }">
      <TabContainer :tabs="tagTabs" :activeTab="activeTag" :enableDrag="true" @tab-change="handleTagChange" />
    </div>
  </template>
</template>

<style scoped>
/* 普通的标签容器 */
.tag-container {
  background: var(--bg-color-primary);
  width: 100%;
  border-bottom: none;
  transition: background 0.2s ease;
}

/* 固定的标签容器 - 吸顶效果 */
.fixed-tag-container {
  position: fixed;
  top: 72px;
  left: 0;
  right: 0;
  z-index: 999;
  background: var(--bg-color-primary);
}

.hidden {
  display: none;
}

/* 大屏模式下，固定标签容器从侧边栏右侧开始 */
@media (min-width: 901px) {
  .fixed-tag-container {
    left: 250px;
  }
}
</style>