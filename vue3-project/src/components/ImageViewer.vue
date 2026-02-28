<template>
  <!-- 图片查看器覆盖层 -->
  <Transition name="fade" appear>
    <div v-if="visible" class="image-viewer-overlay" @click="handleOverlayClick" @keydown="handleKeydown" tabindex="0">
      <div class="image-viewer-container" @click.stop>
        <!-- 关闭按钮 -->
        <button type="button" class="close-btn" @click.stop="closeViewer" aria-label="关闭图片查看器">
          <SvgIcon name="close" :width="24" :height="24" />
        </button>

        <!-- 图片计数器 (多图时显示) -->
        <div v-if="images.length > 1" class="image-counter">
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>

        <!-- 图片内容区域 -->
        <div class="image-content" @click="handleImageClick" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
          @touchend="handleTouchEnd">
          <div class="image-slider" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
            <div v-for="(image, index) in images" :key="index" class="image-slide">
              <img :src="getImageSrc(image)" :alt="getImageAlt(image, index)" class="viewer-image"
                @load="preloadAdjacentImages(index)" @error="handleImageError(index)" />
            </div>
          </div>
        </div>

        <!-- 导航按钮 (多图时显示) -->
        <template v-if="images.length > 1">
          <button type="button" class="nav-btn prev-btn" :class="{ disabled: currentIndex === 0 }" @click.stop="prevImage"
            :disabled="currentIndex === 0" aria-label="上一张图片">
            <SvgIcon name="left" :width="24" :height="24" />
          </button>
          <button type="button" class="nav-btn next-btn" :class="{ disabled: currentIndex === images.length - 1 }" @click.stop="nextImage"
            :disabled="currentIndex === images.length - 1" aria-label="下一张图片">
            <SvgIcon name="right" :width="24" :height="24" />
          </button>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useScrollLock } from '@/composables/useScrollLock'
import { getImageUrl as utilGetImageSrc } from '@/utils/imageUtils'

const props = defineProps({
  // 是否显示图片查看器
  visible: {
    type: Boolean,
    default: false
  },
  // 图片数组，支持字符串数组或对象数组
  images: {
    type: Array,
    default: () => []
  },
  // 当前显示的图片索引
  initialIndex: {
    type: Number,
    default: 0
  },
  // 图片类型，用于不同的处理逻辑
  imageType: {
    type: String,
    default: 'post', // 'post' | 'comment' | 'avatar'
    validator: (value) => ['post', 'comment', 'avatar'].includes(value)
  },
  // 用户ID，用于头像图片的错误处理
  userId: {
    type: [String, Number],
    default: null
  },
  // 是否允许点击遮罩关闭
  closeOnOverlay: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'change'])

const { lock, unlock } = useScrollLock()
const currentIndex = ref(0)
const preloadedImages = ref(new Set())

// 触摸手势相关
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const minSwipeDistance = 50
const SWIPE_THRESHOLD = 10

// 监听visible变化，控制滚动锁定
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    lock()
    currentIndex.value = Math.max(0, Math.min(props.initialIndex, props.images.length - 1))
    nextTick(() => {
      // 预加载当前图片的相邻图片
      preloadAdjacentImages(currentIndex.value)
    })
  } else {
    unlock()
    preloadedImages.value.clear()
  }
})

// 监听当前索引变化
watch(currentIndex, (newIndex) => {
  emit('change', newIndex)
  preloadAdjacentImages(newIndex)
})

// 获取图片源地址
const getImageSrc = (image) => {
  if (typeof image === 'string') {
    return image
  }
  if (typeof image === 'object') {
    // 如果是对象，尝试获取URL字段
    const url = image.url || image.src || image.image_url || image.thumbnailUrl || image.hoverUrl
    if (url) {
      return url
    }
    // 如果对象包含thumbnailUrl和hoverUrl，使用utilGetImageSrc处理
    if (image.thumbnailUrl || image.hoverUrl) {
      return utilGetImageSrc(image, '')
    }
  }
  return ''
}

// 获取图片alt属性
const getImageAlt = (image, index) => {
  if (typeof image === 'object' && image.alt) {
    return image.alt
  }
  switch (props.imageType) {
    case 'avatar':
      return '用户头像'
    case 'comment':
      return `评论图片 ${index + 1}`
    case 'post':
    default:
      return `帖子图片 ${index + 1}`
  }
}

// 预加载相邻图片
const preloadAdjacentImages = (index) => {
  const indicesToPreload = []

  // 预加载前一张
  if (index > 0) {
    indicesToPreload.push(index - 1)
  }

  // 预加载后一张
  if (index < props.images.length - 1) {
    indicesToPreload.push(index + 1)
  }

  indicesToPreload.forEach(i => {
    if (!preloadedImages.value.has(i)) {
      const img = new Image()
      img.src = getImageSrc(props.images[i])
      img.onload = () => preloadedImages.value.add(i)
    }
  })
}

// 处理图片加载错误
const handleImageError = (index) => {
  console.warn(`图片加载失败: ${getImageSrc(props.images[index])}`)
}

// 上一张图片
const prevImage = (event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 下一张图片
const nextImage = (event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  }
}

// 关闭查看器
const closeViewer = () => {
  emit('close')
}

// 处理遮罩点击
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    closeViewer()
  }
}

// 处理图片区域点击
const handleImageClick = (event) => {
  // 检查点击是否在导航按钮的安全区域内
  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  // 定义导航按钮的安全区域（左右各100px宽度，垂直居中区域）
  const safeZoneWidth = 100
  const centerY = rect.height / 2
  const safeZoneHeight = 100

  const isInLeftSafeZone = clickX < safeZoneWidth &&
    Math.abs(clickY - centerY) < safeZoneHeight / 2
  const isInRightSafeZone = clickX > (rect.width - safeZoneWidth) &&
    Math.abs(clickY - centerY) < safeZoneHeight / 2

  // 如果不在导航按钮安全区域内，则关闭图片查看器
  if (!isInLeftSafeZone && !isInRightSafeZone && props.closeOnOverlay) {
    closeViewer()
  }
}

// 处理键盘事件
const handleKeydown = (event) => {
  // 检查当前焦点是否在输入框元素上
  const activeElement = document.activeElement
  if (activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  )) {
    return // 不拦截用户在输入框中的操作
  }

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      event.stopPropagation()
      closeViewer()
      break
    case 'ArrowLeft':
      event.preventDefault()
      event.stopPropagation()
      prevImage(event)
      break
    case 'ArrowRight':
      event.preventDefault()
      event.stopPropagation()
      nextImage(event)
      break
  }
}

// 组件挂载时添加键盘监听
onMounted(() => {
  // 使用捕获阶段监听，并立即阻止事件传播
  document.addEventListener('keydown', handleKeydown, true)
})

// 触摸事件处理
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  const touchMoveX = e.touches[0].clientX
  const touchMoveY = e.touches[0].clientY

  const deltaX = Math.abs(touchMoveX - touchStartX.value)
  const deltaY = Math.abs(touchMoveY - touchStartY.value)

  // 仅当水平滑动幅度 > 垂直滑动幅度 + 阈值时，阻止默认行为
  if (deltaX > deltaY && deltaX > SWIPE_THRESHOLD) {
    e.preventDefault()
  }
}

const handleTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].clientX
  touchEndY.value = e.changedTouches[0].clientY

  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      prevImage()
    } else {
      nextImage()
    }
  }

  // 重置记录
  touchStartX.value = 0
  touchStartY.value = 0
}

// 组件卸载时移除键盘监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true)
})
</script>

<style scoped>
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(14px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.image-viewer-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 3001;
  background: rgba(152, 152, 152, 0.5);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.close-btn:hover {
  background: rgba(87, 87, 87, 0.7);
}

.image-counter {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 3001;
  background: rgba(152, 152, 152, 0.5);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.image-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-slider {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-image {
  width: 100%;
  height: 100vh;
  object-fit: contain;
  cursor: zoom-out;
  transition: none;
}

.viewer-image:hover {
  cursor: zoom-out;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(152, 152, 152, 0.5);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 3001;
  pointer-events: auto;
  opacity: 0.8;
}

.nav-btn:hover:not(.disabled) {
  background: rgba(87, 87, 87, 0.7);
  opacity: 1;
}

.nav-btn.disabled {
  opacity: 0.3;
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .image-viewer-container {
    width: 100vw;
    height: 100vh;
  }

  .close-btn {
    top: 8px;
    left: 8px;
    width: 40px;
    height: 40px;
  }

  .image-counter {
    top: 16px;
    right: 16px;
    padding: 6px 12px;
    font-size: 14px;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
  }

  .prev-btn {
    left: 10px;
  }

  .next-btn {
    right: 10px;
  }
}
</style>