<template>
  <div v-if="visible" class="modal-overlay" v-click-outside.mousedown="handleClose" v-escape-key="handleClose">
    <div class="image-modal" @mousedown.stop>
      <div class="image-modal-header">
        <h4>{{ title }}</h4>
        <button @click="handleClose" class="close-btn">
          <SvgIcon name="close" />
        </button>
      </div>
      <div class="image-modal-body">
        <img :src="imageUrl" :alt="alt" class="enlarged-image" @load="onImageLoad" @error="onImageError" />
        <div v-if="loading" class="loading-spinner">
          <SvgIcon name="loading" />
          <span>加载中...</span>
        </div>
        <div v-if="error" class="error-message">
          <span>图片加载失败</span>
        </div>
      </div>
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
  imageUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: '图片预览'
  },
  alt: {
    type: String,
    default: '放大图片'
  }
})

const emit = defineEmits(['update:visible', 'close'])

const loading = ref(false)
const error = ref(false)

// 监听图片URL变化，重置状态
watch(() => props.imageUrl, () => {
  if (props.imageUrl) {
    loading.value = true
    error.value = false
  }
})

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}





const onImageLoad = () => {
  loading.value = false
  error.value = false
}

const onImageError = () => {
  loading.value = false
  error.value = true
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.image-modal {
  background: var(--bg-color-primary);
  border-radius: 8px;
  width: 60vw;
  height: 90vh;
  max-width: 1200px;
  max-height: 800px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.image-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color-primary);
  background-color: var(--bg-color-secondary);
  flex-shrink: 0;
}

.image-modal-header h4 {
  margin: 0;
  color: var(--text-color-primary);
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--text-color-secondary);
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.image-modal-body {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color-secondary);
  padding: 20px;
  overflow: hidden;
  position: relative;
}

.enlarged-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
}

.loading-spinner svg {
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
}

.error-message {
  color: #f61c1c;
  font-size: 14px;
  text-align: center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>