<template>
  <div class="avatar-upload">
    <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" style="display: none" />

      <div v-if="!imageUrl && !uploading" class="upload-placeholder">
        <SvgIcon name="publish" width="40" height="40" />
        <p>点击或拖拽上传头像</p>
        <p class="upload-hint">支持 JPG、PNG、GIF 格式，将自动裁剪为正方形</p>
      </div>

      <div v-if="uploading" class="upload-loading">
        <SvgIcon name="loading" class="loading-icon" />
        <p>上传中...</p>
      </div>

      <div v-if="imageUrl && !uploading" class="image-preview">
        <img :src="imageUrl" alt="头像预览" />
      </div>
    </div>




    <div v-if="error" class="error-message">
      {{ error }}
    </div>


    <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />


    <div v-if="showCropModal" class="crop-modal-overlay" v-click-outside.mousedown="closeCropModal"
      v-escape-key="closeCropModal">
      <div class="crop-modal" @mousedown.stop>
        <div class="crop-header">
          <h3>裁剪头像</h3>
          <button @click="closeCropModal" class="close-btn">
            <SvgIcon name="close" />
          </button>
        </div>
        <div class="crop-body">
          <div class="crop-container">
            <img ref="cropImage" :src="cropImageSrc" alt="裁剪图片" style="max-width: 100%; max-height: 400px;" />
          </div>
        </div>
        <div class="crop-footer">
          <button @click="closeCropModal" class="cancel-btn">取消</button>
          <button @click="confirmCrop" class="confirm-btn" :disabled="uploading">
            {{ uploading ? '上传中...' : '确认裁剪' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/src/css/cropper.css'
import SvgIcon from '@/components/SvgIcon.vue'
import MessageToast from '@/components/MessageToast.vue'
import { imageUploadApi } from '@/api/index.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '上传头像'
  }
})

const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const cropImage = ref(null)
const imageUrl = ref(props.modelValue)
const uploading = ref(false)
const error = ref('')
const showCropModal = ref(false)
const cropImageSrc = ref('')
let cropper = null

// 消息提示相关
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

watch(() => props.modelValue, (newValue) => {
  if (newValue !== imageUrl.value) {
    imageUrl.value = newValue
  }
}, { immediate: true })

watch(imageUrl, (newValue) => {
  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue)
  }
})

// 监听裁剪模态框显示状态，初始化cropper
watch(showCropModal, async (newValue) => {
  if (newValue) {
    await nextTick()
    if (cropImage.value) {
      cropper = new Cropper(cropImage.value, {
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
    if (cropper) {
      cropper.destroy()
      cropper = null
    }
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    showCropDialog(file)
  }
}

const handleDrop = (event) => {
  const files = event.dataTransfer.files
  if (files.length > 0) {
    showCropDialog(files[0])
  }
}

const showCropDialog = async (file) => {
  // 使用新API验证文件
  const validation = imageUploadApi.validateImageFile(file)
  if (!validation.valid) {
    // 检查是否是文件大小超限
    if (file.size > 5 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const errorMsg = `图片大小为 ${fileSizeMB}MB，超过 5MB 限制，请选择更小的图片`

      // 显示Toast提示
      showMessage(errorMsg, 'error')
    } else {
      showMessage(validation.error, 'error')
    }

    error.value = validation.error
    return
  }

  error.value = ''

  try {
    // 使用新API生成预览
    const previewUrl = await imageUploadApi.createImagePreview(file)
    cropImageSrc.value = previewUrl
    showCropModal.value = true
  } catch (err) {
    console.error('生成预览失败:', err)
    error.value = '文件读取失败，请重试'
  }
}

const closeCropModal = () => {
  showCropModal.value = false
  cropImageSrc.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const confirmCrop = async () => {
  if (!cropper) return

  uploading.value = true
  error.value = ''

  try {
    // 获取裁剪后的canvas
    const canvas = cropper.getCroppedCanvas({
      width: 300,
      height: 300,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })

    // 将canvas转换为blob
    canvas.toBlob((blob) => {
      uploadCroppedImage(blob)
    }, 'image/png', 0.9)
  } catch (err) {
    console.error('裁剪失败:', err)
    error.value = '裁剪失败，请重试'
    uploading.value = false
  }
}

const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024

  if (!validTypes.includes(file.type)) {
    error.value = '请选择有效的图片格式 (JPEG, PNG, GIF, WebP)'
    return false
  }

  if (file.size > maxSize) {
    error.value = '图片大小不能超过 5MB'
    return false
  }

  return true
}

const generatePreview = () => {
  if (!cropper) return

  const canvas = cropper.getCroppedCanvas({
    width: 200,
    height: 200,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  })

  return canvas.toDataURL('image/jpeg', 0.8)
}

const uploadCroppedImage = async (blob) => {
  try {
    const result = await imageUploadApi.uploadCroppedImage(blob, {
      filename: 'avatar.png'
    })

    if (result.success) {
      imageUrl.value = result.data.url
      error.value = ''
      showCropModal.value = false
      cropImageSrc.value = ''
    } else {
      error.value = result.message
    }
  } catch (err) {
    console.error('上传失败:', err)
    error.value = '上传失败，请重试'
  } finally {
    uploading.value = false
  }
}



// 显示消息提示
const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

// 关闭消息提示
const handleToastClose = () => {
  showToast.value = false
}


</script>

<style scoped>
.avatar-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed var(--border-color-primary);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  max-width: 200px;
  margin: 0 auto;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background-color: var(--bg-color-secondary);
}

.upload-placeholder {
  color: var(--text-color-secondary);
}



.upload-hint {
  font-size: 12px;
  color: var(--text-color-tertiary);
  margin: 5px 0 0 0;
}

.upload-loading {
  color: var(--primary-color);
}

.loading-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.image-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}



.error-message {
  color: var(--primary-color);
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
}

/* 裁剪模态框样式 */
.crop-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.crop-modal {
  background: var(--bg-color-primary);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.crop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--border-color-primary);
}

.crop-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-color-primary);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--text-color-secondary);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: var(--bg-color-secondary);
  color: var(--text-color-primary);
}

.close-btn svg {
  width: 16px;
  height: 16px;
}





.crop-body {
  padding: 20px;
  flex: 1;
  overflow: hidden;
}

.crop-container {
  width: 100%;
  height: 400px;
  border-radius: 4px;
  overflow: hidden;
}

.crop-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--border-color-primary);
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: var(--bg-color-secondary);
  color: var(--text-color-secondary);
}

.cancel-btn:hover {
  background: var(--bg-color-tertiary);
}

.confirm-btn {
  background: var(--primary-color);
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.confirm-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>