<template>
  <div class="multi-image-upload">
    <div class="upload-grid" @dragover.prevent @drop.prevent="handleDrop">

      <div v-for="(imageItem, index) in imageList" :key="imageItem.id" class="image-item"
        :class="{ 'dragging': dragIndex === index }" draggable="true" @dragstart="handleDragStart(index, $event)"
        @dragenter.prevent="handleDragEnter(index)" @dragover.prevent @dragend="handleDragEnd">
        <div class="image-preview">
          <img :src="imageItem.preview" alt="预览图片" />
          <div class="image-overlay">
            <div class="image-actions">
              <button @click="removeImage(index)" class="action-btn remove-btn"
                :disabled="isUploading || (!props.allowDeleteLast && imageList.length <= 1)">
                <SvgIcon name="delete" />
              </button>
            </div>
            <div class="image-index">{{ index + 1 }}</div>
          </div>
        </div>
      </div>


      <div v-if="imageList.length < maxImages" class="upload-item" @click="!isUploading && triggerFileInput()"
        :class="{ 'drag-over': isDragOver, 'uploading': isUploading }"
        @dragover.prevent="!isUploading && (isDragOver = true)" @dragleave.prevent="isDragOver = false"
        @drop.prevent="!isUploading && handleFileDrop($event)">
        <input ref="fileInput" type="file" accept="image/*" multiple @change="handleFileSelect" style="display: none"
          :disabled="isUploading" />

        <div class="upload-placeholder">
          <SvgIcon name="publish" class="upload-icon" :class="{ 'uploading': isUploading }" />
          <p>{{ isUploading ? '上传中...' : '添加图片' }}</p>
          <p class="upload-hint">{{ imageList.length }}/{{ maxImages }}</p>
          <p v-if="!isUploading" class="drag-hint">或拖拽图片到此处</p>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="upload-tips">
      <p>• 最多上传{{ maxImages }}张图片</p>
      <p>• 支持 JPG、PNG 格式</p>
      <p>• 单张图片不超过5MB</p>
      <p>• 拖拽图片可调整顺序</p>
    </div>


    <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import MessageToast from '@/components/MessageToast.vue'
import { imageUploadApi } from '@/api/index.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxImages: {
    type: Number,
    default: 9
  },
  allowDeleteLast: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'error'])

const fileInput = ref(null)
const imageList = ref([])
const error = ref('')
const isDragOver = ref(false)
const isUploading = ref(false)

// 消息提示相关
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// 拖拽相关状态
const dragIndex = ref(-1)
const dragOverIndex = ref(-1)

// 生成唯一ID
const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9)

// 初始化图片列表（如果有外部传入的值）
const initializeImageList = (images) => {
  return images.map((image, index) => {
    if (typeof image === 'string') {
      // 如果是URL字符串，说明是已上传的图片
      return {
        id: generateId(),
        file: null,
        preview: image,
        uploaded: true,
        url: image
      }
    } else if (image.file) {
      // 如果是文件对象
      return {
        id: image.id || generateId(),
        file: image.file,
        preview: image.preview,
        uploaded: false,
        url: null
      }
    }
    return image
  })
}

// 用于防止循环更新的标志
let isInternalUpdate = false

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (isInternalUpdate) return // 如果是内部更新触发的，跳过

  if (newValue && newValue.length > 0) {
    imageList.value = initializeImageList(newValue)
  } else {
    imageList.value = []
  }
}, { immediate: true })

// 监听内部数组变化，同步到外部
watch(imageList, (newValue) => {
  if (isInternalUpdate) return // 防止循环更新

  isInternalUpdate = true

  // 将内部格式转换为外部格式
  const externalValue = newValue.map(item => ({
    id: item.id,
    file: item.file,
    preview: item.preview,
    uploaded: item.uploaded,
    url: item.url
  }))
  emit('update:modelValue', externalValue)

  // 在下一个tick重置标志
  nextTick(() => {
    isInternalUpdate = false
  })
}, { deep: true, flush: 'post' })

const triggerFileInput = () => {
  fileInput.value?.click()
}

const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

const addFiles = async (files) => {
  const fileArray = Array.from(files)

  // 检查数量限制
  const remainingSlots = props.maxImages - imageList.value.length
  if (fileArray.length > remainingSlots) {
    const errorMsg = `最多只能再添加${remainingSlots}张图片`
    error.value = errorMsg
    emit('error', errorMsg)
    return
  }

  // 验证所有文件
  for (const file of fileArray) {
    // 先检查文件大小
    if (file.size > 5 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const errorMsg = `图片大小为 ${fileSizeMB}MB，超过 5MB 限制，请选择更小的图片`

      // 显示Toast提示
      showMessage(errorMsg, 'error')

      // 同时设置错误状态
      error.value = errorMsg
      emit('error', errorMsg)
      return
    }

    const validation = imageUploadApi.validateImageFile(file)
    if (!validation.valid) {
      const errorMsg = `${file.name}: ${validation.error}`
      error.value = errorMsg
      emit('error', errorMsg)
      return
    }
  }

  error.value = ''

  try {
    // 为每个文件创建预览（先压缩再预览）
    for (const file of fileArray) {
      // 先压缩图片
      const compressedFile = await compressImage(file)
      const preview = await createImagePreview(compressedFile)
      const imageItem = {
        id: generateId(),
        file: compressedFile, // 使用压缩后的文件
        preview: preview,
        uploaded: false,
        url: null
      }
      imageList.value.push(imageItem)
    }
  } catch (err) {
    console.error('处理图片失败:', err)
    const errorMsg = '处理图片失败，请重试'
    error.value = errorMsg
    emit('error', errorMsg)
  }
}

const handleFileSelect = async (event) => {
  const files = event.target.files
  if (files.length === 0) return

  await addFiles(files)

  // 清空文件输入
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleFileDrop = async (event) => {
  isDragOver.value = false
  const files = event.dataTransfer.files
  if (files.length === 0) return

  await addFiles(files)
}

const removeImage = (index) => {
  // 如果不允许删除最后一张图片且只有一张图片，不允许删除
  if (!props.allowDeleteLast && imageList.value.length <= 1) {
    return
  }
  imageList.value.splice(index, 1)
  error.value = ''
}

// 拖拽排序相关方法
const handleDragStart = (index, event) => {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/html', event.target.outerHTML)
}

const handleDragEnter = (index) => {
  if (dragIndex.value !== -1 && dragIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const handleDragEnd = () => {
  if (dragIndex.value !== -1 && dragOverIndex.value !== -1) {
    // 执行排序
    const draggedItem = imageList.value[dragIndex.value]
    imageList.value.splice(dragIndex.value, 1)
    imageList.value.splice(dragOverIndex.value, 0, draggedItem)
  }

  // 重置状态
  dragIndex.value = -1
  dragOverIndex.value = -1
}

const handleDrop = (event) => {
  event.preventDefault()
  handleDragEnd()
}

// 获取所有图片数据（包括已有URL和新图片的base64）
const getAllImageData = async () => {
  const allImageData = []

  for (const item of imageList.value) {
    if (item.uploaded && item.url && !item.url.startsWith('data:')) {
      // 已上传的图片，直接使用URL
      allImageData.push(item.url)
    } else if (item.file && !item.uploaded) {
      // 新选择的图片，转换为base64
      try {
        const base64 = await fileToBase64(item.file)
        allImageData.push(base64)
      } catch (error) {
        console.error('转换图片为base64失败:', error)
        throw new Error(`图片 ${item.file.name} 处理失败`)
      }
    }
  }

  console.log('获取到的图片数据:', allImageData.map(data =>
    data.startsWith('data:') ? `base64数据(${data.substring(0, 50)}...)` : data
  ))
  return allImageData
}

// 压缩图片
const compressImage = (file, maxSizeMB = 0.8, quality = 0.4) => {
  return new Promise((resolve) => {
    // 对于800KB以下的文件不进行压缩
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 超过800KB的图片使用强力压缩
      const compressQuality = 0.4
      const maxDimension = 1200

      // 计算压缩后的尺寸，保持宽高比
      let { width, height } = img

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)

      // 转换为blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 创建新的File对象
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })

            resolve(compressedFile)
          } else {
            resolve(file) // 压缩失败，返回原文件
          }
        },
        file.type,
        compressQuality
      )
    }

    img.onerror = () => resolve(file) // 加载失败，返回原文件
    img.src = URL.createObjectURL(file)
  })
}

// 将文件转换为base64
const fileToBase64 = async (file) => {
  // 先压缩图片
  const compressedFile = await compressImage(file)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(compressedFile)
  })
}

// 暴露上传方法给父组件（保持兼容性）
const uploadAllImages = async () => {
  // 如果正在上传，防止重复上传
  if (isUploading.value) {
    console.log('正在上传中，请勿重复操作')
    return []
  }

  // 找出需要上传的图片（有file但还没上传的）
  const unuploadedImages = imageList.value.filter(item => !item.uploaded && item.file)

  // 如果没有需要上传的新图片，收集所有已有的URL并返回
  if (unuploadedImages.length === 0) {
    const existingUrls = imageList.value
      .filter(item => item.uploaded && item.url && !item.url.startsWith('data:'))
      .map(item => item.url)
    console.log('没有新图片需要上传，返回现有URL:', existingUrls)
    return existingUrls
  }


  isUploading.value = true
  error.value = ''

  try {
    // 上传新图片
    const files = unuploadedImages.map(item => item.file)
    console.log('准备上传的文件:', files.map(f => f.name))

    const result = await imageUploadApi.uploadImages(files)
    console.log('上传API返回结果:', result)

    if (result.success && result.data && result.data.uploaded && result.data.uploaded.length > 0) {


      // 更新上传成功的图片状态
      let uploadIndex = 0
      for (let i = 0; i < imageList.value.length; i++) {
        const item = imageList.value[i]
        if (!item.uploaded && item.file) {
          if (uploadIndex < result.data.uploaded.length) {
            const uploadedData = result.data.uploaded[uploadIndex]
            item.uploaded = true
            item.url = uploadedData.url

            uploadIndex++
          }
        }
      }

      // 收集所有图片URL（按照imageList的顺序）
      const allUrls = imageList.value
        .filter(item => item.uploaded && item.url && !item.url.startsWith('data:'))
        .map(item => item.url)

      console.log('最终返回的所有URL:', allUrls)
      return allUrls
    } else {
      const errorMsg = result.message || '上传失败，没有成功上传的图片'
      console.error('上传失败:', errorMsg, result)
      throw new Error(errorMsg)
    }
  } catch (err) {
    console.error('批量上传异常:', err)
    error.value = '上传失败: ' + (err.message || '未知错误')
    throw err
  } finally {
    isUploading.value = false
  }
}

// 获取图片数量
const getImageCount = () => {
  return imageList.value.length
}

// 重置组件
const reset = () => {
  imageList.value = []
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 根据URL列表同步更新图片列表
const syncWithUrls = (urls) => {
  // 设置标志，防止触发外部更新
  isInternalUpdate = true

  if (!Array.isArray(urls)) {
    imageList.value = []
    nextTick(() => {
      isInternalUpdate = false
    })
    return
  }

  // 如果URL数组为空，清空图片列表
  if (urls.length === 0) {
    imageList.value = []
    nextTick(() => {
      isInternalUpdate = false
    })
    return
  }

  // 去重处理，确保URL数组中没有重复项
  const uniqueUrls = [...new Set(urls.filter(url => url && url.trim()))]

  // 重新构建图片列表，确保与URL数组完全一致
  const newImageList = []

  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i]

    // 只处理有效的URL，不处理任何占位符
    if (url && !url.startsWith('[待上传:')) {
      // 有效的URL，先检查是否已存在相同URL的图片项
      const existingImageWithSameUrl = imageList.value.find(item =>
        item.uploaded && item.url === url
      )

      if (existingImageWithSameUrl) {
        // 如果已存在相同URL的图片项，直接使用它
        newImageList.push(existingImageWithSameUrl)
      } else {
        // 如果不存在，创建新的已上传图片项
        newImageList.push({
          id: generateId(),
          file: null,
          preview: url,
          uploaded: true,
          url: url
        })
      }
    }
  }

  // 替换整个图片列表
  imageList.value = newImageList

  // 在下一个tick重置标志
  nextTick(() => {
    isInternalUpdate = false
  })
}

// 根据ID删除图片
const removeImageById = (imageId) => {
  const index = imageList.value.findIndex(item => item.id === imageId)
  if (index !== -1) {
    imageList.value.splice(index, 1)
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

// 暴露方法和属性给父组件
defineExpose({
  uploadAllImages,
  getAllImageData,
  getImageCount,
  reset,
  syncWithUrls,
  removeImageById,
  imageList,
  isUploading
})
</script>

<style scoped>
.multi-image-upload {
  width: 100%;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.image-item,
.upload-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 8px;
  align-self: flex-end;
}

.action-btn {
  background: rgba(255, 255, 255, 0.814);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.5;
}

.remove-btn:hover:not(:disabled) {
  opacity: 1;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(255, 255, 255, 0.3);
}

.action-btn svg {
  width: 12px;
  height: 12px;
}

.image-index {
  background: rgba(0, 0, 0, 0.534);
  color: white;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: bold;
  align-self: flex-start;
}

.upload-item {
  border: 2px dashed var(--border-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-color-primary);
}

.upload-item:hover,
.upload-item.drag-over {
  border-color: var(--primary-color);
}

.upload-item.uploading {
  border-color: var(--primary-color);
  background-color: rgba(255, 71, 87, 0.05);
  cursor: not-allowed;
  opacity: 0.7;
}

.upload-icon.uploading {
  animation: spin 1s linear infinite;
  color: var(--primary-color);
}

.image-item {
  transition: all 0.2s ease;
  cursor: move;
}

.image-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.upload-placeholder {
  text-align: center;
  color: var(--text-color-secondary);
}

.upload-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 5px;
  color: var(--text-color-secondary);
}

.upload-placeholder p {
  margin: 2px 0;
  font-size: 12px;
}

.upload-hint {
  color: var(--text-color-secondary);
  font-size: 10px !important;
}

.drag-hint {
  color: var(--text-color-secondary);
  font-size: 10px !important;
  margin-top: 4px;
}

.upload-loading {
  text-align: center;
  color: var(--primary-color);
}

.loading-icon {
  width: 20px;
  height: 20px;
  margin-bottom: 5px;
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

.upload-loading p {
  margin: 2px 0;
  font-size: 12px;
}

.error-message {
  color: var(--primary-color);
  font-size: 12px;
  margin-bottom: 10px;
}

.upload-tips {
  font-size: 12px;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.upload-tips p {
  margin: 2px 0;
}
</style>