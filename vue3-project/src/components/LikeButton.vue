<template>
  <button :class="[
    'like-button',
    {
      'active': isLiked,
      'small': size === 'small',
      'medium': size === 'medium',
      'large': size === 'large'
    }
  ]" @click="handleClick">
    <span class="like-btn-wrapper">

      <span v-if="showRing" class="like-ring" @animationend="onRingEnd"></span>

      <SvgIcon :name="isLiked ? 'liked' : 'like'" :class="{
        liked: isLiked,
        scaling: scaling
      }" :width="iconSize" :height="iconSize" @animationend="onScaleEnd" />
    </span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import SvgIcon from './SvgIcon.vue'

// Props
const props = defineProps({
  // 是否已点赞
  isLiked: {
    type: Boolean,
    default: false
  },
  // 按钮尺寸
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

// Emits
const emit = defineEmits(['click'])

// 动画状态
const scaling = ref(false)
const showRing = ref(false)

// 计算图标尺寸
const iconSize = computed(() => {
  const sizeMap = {
    small: '16px',
    medium: '20px',
    large: '24px'
  }
  return sizeMap[props.size]
})

// 触发动画
const triggerAnimation = (willBeLiked) => {
  // 重置动画状态
  scaling.value = false
  showRing.value = false

  // 触发动画
  setTimeout(() => {
    scaling.value = true
    // 只有在点赞时才显示圆环动画
    if (willBeLiked) {
      showRing.value = true
    }
  }, 0)
}

// 处理点击事件
const handleClick = (event) => {
  const willBeLiked = !props.isLiked
  triggerAnimation(willBeLiked)
  emit('click', willBeLiked, event)
}

// 处理动画结束事件
const onScaleEnd = () => {
  scaling.value = false
}

const onRingEnd = () => {
  showRing.value = false
}
</script>

<style scoped>
.like-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color-secondary);
  transition: color 0.2s ease;
  padding: 4px;
  border-radius: 4px;
  padding: 2px;
}

.like-button:hover {
  color: var(--text-color-primary);
}

.like-btn-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 点赞动画样式 */
.scaling {
  animation: likeScale 0.5s linear both;
}

.like-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #ff4757;
  background: transparent;
  transform: translate(-50%, -50%) scale(0);
  animation: likeRing 0.6s ease-out;
  pointer-events: none;
}

/* 小尺寸的圆环 */
.like-button.small .like-ring {
  width: 16px;
  height: 16px;
}

/* 中尺寸的圆环 */
.like-button.medium .like-ring {
  width: 20px;
  height: 20px;
}

/* 大尺寸的圆环 */
.like-button.large .like-ring {
  width: 24px;
  height: 24px;
}

@keyframes likeScale {
  0% {
    transform: scale(1);
  }

  30% {
    transform: scale(0.5);
  }

  50% {
    transform: scale(1.2);
  }

  80% {
    transform: scale(0.9);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes likeRing {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}
</style>