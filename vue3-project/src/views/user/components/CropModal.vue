<template>
  <div v-if="visible" class="crop-modal-overlay" @click="handleClose">
    <div class="crop-modal" @click.stop>
      <div class="crop-header">
        <h3>裁剪头像</h3>
        <button @click="handleClose" class="close-btn">
          <SvgIcon name="close" width="24" height="24" />
        </button>
      </div>
      <div class="crop-body">
        <div class="crop-container">
          <img ref="cropImage" :src="imageSrc" alt="裁剪图片" style="max-width: 100%; max-height: 400px;" />
        </div>
      </div>
      <div class="crop-footer">
        <button @click="handleClose" class="cancel-btn">取消</button>
        <button @click="handleConfirm" class="confirm-btn" :disabled="uploading">
          {{ uploading ? '上传中...' : '确认裁剪' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/src/css/cropper.css'
import SvgIcon from '@/components/SvgIcon.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    default: ''
  },
  uploading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

const cropImage = ref(null)
const cropper = ref(null)

// 监听模态框显示状态，初始化和销毁Cropper实例
watch(() => props.visible, async (newValue) => {
  if (newValue) {
    await nextTick()
    if (cropImage.value) {
      cropper.value = new Cropper(cropImage.value, {
        aspectRatio: 1, // 正方形裁剪
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.8,
        restore: false,
        guides: false,
        center: false,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      })
    }
  } else {
    if (cropper.value) {
      cropper.value.destroy()
      cropper.value = null
    }
  }
})

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  if (!cropper.value) return

  try {
    // 获取裁剪后的canvas
    const canvas = cropper.value.getCroppedCanvas({
      width: 300,
      height: 300,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })

    // 将canvas转换为blob
    canvas.toBlob((blob) => {
      emit('confirm', blob)
    }, 'image/png', 0.9)
  } catch (error) {
    console.error('裁剪失败:', error)
    emit('error', '裁剪失败，请重试')
  }
}
</script>

<style scoped>
/* 裁剪模态框样式 */
.crop-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.crop-modal {
  background: var(--bg-color-primary);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.crop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color-primary);
}

.crop-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color-primary);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-color-secondary);
}

.crop-body {
  padding: 24px;
  max-height: 500px;
  overflow: hidden;
}

.crop-container {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.crop-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color-primary);
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
}

.cancel-btn:hover {
  background: var(--bg-color-secondary);
}

.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--primary-color);
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>