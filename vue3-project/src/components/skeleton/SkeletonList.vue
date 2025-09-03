<template>
  <div class="skeleton-list" :class="listClass">
    <BaseSkeleton v-for="index in count" :key="index" :type="type" :avatar-size="avatarSize"
      :image-height="getImageHeight(index)" :show-stats="showStats" :show-button="showButton" :wrapper-class="itemClass"
      :animation="animation">
      <slot v-if="type === 'custom'" :index="index"></slot>
    </BaseSkeleton>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseSkeleton from '@/components/skeleton/BaseSkeleton.vue'

const props = defineProps({
  // 骨架屏数量
  count: {
    type: Number,
    default: 6
  },
  // 骨架屏类型
  type: {
    type: String,
    default: 'user-card',
    validator: (value) => ['user-card', 'image-card', 'user-item', 'custom'].includes(value)
  },
  // 头像大小
  avatarSize: {
    type: String,
    default: '48px'
  },
  // 图片高度（仅用于image-card类型）
  imageHeight: {
    type: [String, Array],
    default: '200px'
  },
  // 是否显示统计信息
  showStats: {
    type: Boolean,
    default: true
  },
  // 是否显示按钮
  showButton: {
    type: Boolean,
    default: true
  },
  // 列表布局类型
  layout: {
    type: String,
    default: 'vertical',
    validator: (value) => ['vertical', 'grid', 'waterfall'].includes(value)
  },
  // 自定义列表类名
  listClass: {
    type: String,
    default: ''
  },
  // 自定义项目类名
  itemClass: {
    type: String,
    default: ''
  },
  // 动画类型
  animation: {
    type: String,
    default: 'shimmer',
    validator: (value) => ['shimmer', 'pulse', 'none'].includes(value)
  }
})

// 获取图片高度（支持随机高度）
const getImageHeight = (index) => {
  if (props.type !== 'image-card') return props.imageHeight

  if (Array.isArray(props.imageHeight)) {
    return props.imageHeight[index % props.imageHeight.length]
  }

  if (props.imageHeight === 'random') {
    // 根据屏幕宽度生成随机高度
    if (window.innerWidth <= 480) {
      const heights = ['120px', '140px', '160px', '180px', '150px', '170px']
      return heights[index % heights.length]
    } else if (window.innerWidth <= 768) {
      const heights = ['150px', '180px', '210px', '240px', '190px', '220px']
      return heights[index % heights.length]
    } else {
      const heights = ['180px', '220px', '260px', '300px', '240px', '280px']
      return heights[index % heights.length]
    }
  }

  return props.imageHeight
}
</script>

<style scoped>
.skeleton-list {
  padding: 0;
  margin: 0;
}

/* 垂直布局 */
.skeleton-list:not(.grid-layout):not(.waterfall-layout) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 网格布局 */
.skeleton-list.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

/* 瀑布流布局 */
.skeleton-list.waterfall-layout {
  column-count: 2;
  column-gap: 10px;
  list-style: none;
}

.skeleton-list.waterfall-layout>* {
  break-inside: avoid;
  margin-bottom: 10px;
}

@media (min-width: 960px) {
  .skeleton-list.waterfall-layout {
    column-count: 4;
    column-gap: 15px;
  }
}

@media (max-width: 480px) {
  .skeleton-list.grid-layout {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .skeleton-list:not(.grid-layout):not(.waterfall-layout) {
    gap: 8px;
  }
}
</style>