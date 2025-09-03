<template>
  <div class="modal-overlay" v-if="visible" v-click-outside.mousedown="() => $emit('close')"
    v-escape-key="() => $emit('close')">
    <div class="carousel-modal" @mousedown.stop>
      <div class="carousel-header">
        <h4>图片预览 ({{ currentIndex + 1 }}/{{ images.length }})</h4>
        <button class="close-btn" @click="$emit('close')" type="button">
          <SvgIcon name="close" width="16" height="16" />
        </button>
      </div>

      <div class="carousel-body">
        <div v-if="images.length > 0">

          <div class="main-image-container">
            <img :src="images[currentIndex]?.image_url" :alt="`图片 ${currentIndex + 1}`" class="main-image"
              @load="handleImageLoad" @error="handleImageError" />
            <div v-if="loading" class="loading-overlay">
              <div class="loading-spinner"></div>
            </div>
            <div v-if="error" class="error-overlay">
              <p>图片加载失败</p>
            </div>
          </div>


          <div class="thumbnail-nav" v-if="images.length > 1">
            <div class="thumbnail-container">
              <div v-for="(image, index) in images" :key="image.id || index" class="thumbnail-item"
                :class="{ active: index === currentIndex }" @click="setCurrentIndex(index)">
                <img :src="image.image_url" :alt="`缩略图 ${index + 1}`" />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-images">
          <p>暂无图片</p>
        </div>
      </div>


      <button class="nav-btn prev-btn" @click="prevImage" :disabled="images.length <= 1" v-show="images.length > 1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15,18 9,12 15,6"></polyline>
        </svg>
      </button>

      <button class="nav-btn next-btn" @click="nextImage" :disabled="images.length <= 1" v-show="images.length > 1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  images: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const currentIndex = ref(0)
const loading = ref(false)
const error = ref(false)

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    currentIndex.value = props.initialIndex || 0
    loading.value = true
  }
})

watch(() => props.images, () => {
  currentIndex.value = 0
})

const prevImage = () => {
  if (props.images.length <= 1) return
  currentIndex.value = currentIndex.value === 0 ? props.images.length - 1 : currentIndex.value - 1
  loading.value = true
  error.value = false
}

const nextImage = () => {
  if (props.images.length <= 1) return
  currentIndex.value = currentIndex.value === props.images.length - 1 ? 0 : currentIndex.value + 1
  loading.value = true
  error.value = false
}

const setCurrentIndex = (index) => {
  currentIndex.value = index
  loading.value = true
  error.value = false
}

const handleImageLoad = () => {
  loading.value = false
  error.value = false
}

const handleImageError = () => {
  loading.value = false
  error.value = true
}



const handleKeydown = (event) => {
  if (!props.visible) return

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      prevImage()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextImage()
      break
  }
}

// 添加键盘事件监听
watch(() => props.visible, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.carousel-modal {
  background: var(--bg-color-primary);
  border-radius: 8px;
  width: 60vw;
  height: 90vh;
  max-width: 1200px;
  max-height: 800px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-color-primary);
  background-color: var(--bg-color-secondary);
  flex-shrink: 0;
}

.carousel-header h4 {
  margin: 0;
  color: var(--text-color-primary);
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  color: var(--text-color-secondary);
  transition: all 0.2s;
}



.carousel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-image-container {
  flex: 1;
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color-secondary);
  padding: 20px;
  overflow: hidden;
  position: relative;
}

.main-image {
  max-width: 100%;
  max-height: 60vh;
  min-width: 200px;
  min-height: 200px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-primary);
  z-index: 10;
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-color-tertiary);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

.thumbnail-nav {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color-primary);
  background-color: var(--bg-color-secondary);
  flex-shrink: 0;
}

.thumbnail-container {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.thumbnail-item {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.thumbnail-item:hover {
  border-color: var(--primary-color);
}

.thumbnail-item.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 156, 156, 0.25);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(248, 249, 250, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid var(--bs-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(248, 249, 250, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.no-images {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .carousel-modal {
    width: 95vw;
    height: 95vh;
  }

  .main-image-container {
    min-height: 300px;
  }

  .main-image {
    min-width: 150px;
    min-height: 150px;
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

  .thumbnail-item {
    width: 50px;
    height: 50px;
  }
}
</style>