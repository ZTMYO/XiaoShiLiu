<template>
  <div v-if="visible" class="modal-overlay" v-click-outside.mousedown="handleClose" v-escape-key="handleClose">
    <div class="modal" @mousedown.stop>
      <div class="modal-header">
        <h4>{{ title }}</h4>
        <button @click="handleClose" class="close-btn">
          <SvgIcon name="close" />
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div v-for="field in visibleFields" :key="field.key" class="form-group">
            <label>{{ field.label }}{{ field.required ? ' *' : '' }}:</label>
            <input v-if="field.type === 'text' || field.type === 'password'" :value="getInputValue(field)"
              @input="updateInputField(field, $event.target.value)" :type="field.type" :placeholder="field.placeholder"
              :required="field.required" :maxlength="field.maxlength" />
            <div v-else-if="field.type === 'textarea'" class="input-section">
              <div class="content-input-wrapper">
                <ContentEditableInput :ref="el => setContentEditableRef(field.key, el)" v-model="formData[field.key]"
                  :input-class="'content-textarea'" :placeholder="field.placeholder || '请输入内容'" :enable-mention="true"
                  :mention-users="mentionUsers" @mention="handleContentEditableMentionInput" />
                <div class="content-actions">
                  <button type="button" class="mention-btn" @click="toggleMentionPanel(field.key)">
                    <SvgIcon name="mention" class="mention-icon" width="20" height="20" />
                  </button>
                  <button type="button" class="emoji-btn" @click="toggleEmojiPanel(field.key)">
                    <SvgIcon name="emoji" class="emoji-icon" width="20" height="20" />
                  </button>
                </div>
              </div>
              <div v-if="field.maxLength" class="char-count">{{ getPlainTextLength(formData[field.key] || '') }}/{{
                field.maxLength }}</div>
            </div>
            <div v-else-if="field.type === 'textarea-with-emoji'" class="textarea-with-emoji-wrapper">
              <textarea :ref="el => setTextareaRef(field.key, el)" :value="getTextareaValue(field)"
                @input="updateTextareaField(field, $event.target.value)" :placeholder="field.placeholder"
                :required="field.required" rows="4" class="textarea-with-emoji"></textarea>
              <div class="textarea-actions">
                <button type="button" class="mention-btn" @click="toggleMentionPanel(field.key)">
                  <SvgIcon name="mention" class="mention-icon" width="20" height="20" />
                </button>
                <button type="button" class="emoji-btn" @click="toggleEmojiPanel(field.key)">
                  <SvgIcon name="emoji" class="emoji-icon" width="20" height="20" />
                </button>
                <div v-if="field.maxLength" class="char-count">{{ (getTextareaValue(field) || '').length }}/{{
                  field.maxLength }}</div>
              </div>
            </div>
            <div v-else-if="field.type === 'content-editable-input'" class="input-section">
              <div class="content-input-wrapper">
                <ContentEditableInput :ref="el => setContentEditableRef(field.key, el)" v-model="formData[field.key]"
                  :input-class="'content-textarea'" :placeholder="field.placeholder || '请输入内容'" :enable-mention="true"
                  :mention-users="mentionUsers" @mention="handleContentEditableMentionInput" />
                <div class="content-actions">
                  <button type="button" class="mention-btn" @click="toggleMentionPanel(field.key)">
                    <SvgIcon name="mention" class="mention-icon" width="20" height="20" />
                  </button>
                  <button type="button" class="emoji-btn" @click="toggleEmojiPanel(field.key)">
                    <SvgIcon name="emoji" class="emoji-icon" width="20" height="20" />
                  </button>
                </div>
              </div>
              <div v-if="field.maxLength" class="char-count">{{ getPlainTextLength(formData[field.key] || '') }}/{{
                field.maxLength }}</div>
            </div>
            <DropdownSelect v-else-if="field.type === 'select'"
              :model-value="formData[field.key] !== undefined && formData[field.key] !== null ? formData[field.key] : ''"
              @change="handleSelectChange(field.key, $event)" :options="field.options"
              :placeholder="field.required ? '请选择' : '请选择（可选）'" label-key="label" value-key="value" min-width="200px" />
            <input v-else-if="field.type === 'number'" :value="formData[field.key] || ''"
              @input="updateField(field.key, Number($event.target.value))" type="number"
              :placeholder="field.placeholder" :required="field.required" />
            <div v-else-if="field.type === 'checkbox'" class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" :checked="formData[field.key] || false"
                  @change="updateField(field.key, $event.target.checked)" />
                {{ field.checkboxLabel || '是' }}
              </label>
            </div>
            <div v-else-if="field.type === 'radio'" class="radio-group">
              <label v-for="option in field.options" :key="option.value" class="radio-label">
                <input type="radio" :name="field.key" :value="option.value"
                  :checked="formData[field.key] === option.value" @change="updateField(field.key, option.value)" />
                {{ option.label }}
              </label>
            </div>
            <div v-else-if="field.type === 'avatar-upload'" class="avatar-upload-field">
              <div class="avatar-upload-area" @click="triggerAvatarFileInput(field.key)" @dragover.prevent
                @drop.prevent="handleAvatarDrop($event, field.key)">
                <input :ref="el => setAvatarFileInputRef(field.key, el)" type="file" accept="image/*"
                  @change="handleAvatarFileSelect($event, field.key)" style="display: none" />

                <div v-if="!avatarUploading[field.key] && !formData[field.key]" class="avatar-upload-placeholder">
                  <SvgIcon name="publish" width="40" height="40" />
                  <p>{{ field.placeholder || '点击或拖拽上传头像' }}</p>
                  <p class="upload-hint">支持 JPG、PNG、GIF 格式，将自动裁剪为正方形</p>
                </div>

                <div v-if="avatarUploading[field.key]" class="avatar-upload-loading">
                  <SvgIcon name="loading" class="loading-icon" />
                  <p>上传中...</p>
                </div>

                <div v-if="formData[field.key] && !avatarUploading[field.key]" class="avatar-image-preview">
                  <img :src="formData[field.key]" alt="头像预览" />
                </div>
              </div>

              <div v-if="avatarErrors[field.key]" class="avatar-error-message">
                {{ avatarErrors[field.key] }}
              </div>
            </div>
            <MultiImageUpload v-else-if="field.type === 'multi-image-upload'"
              :ref="el => setMultiImageUploadRef(field.key, el)" :model-value="getMultiImageUploadValue(field.key)"
              @update:model-value="handleImageUploadChange" :max-images="field.maxImages || 9" />
            <TagSelector v-else-if="field.type === 'tags'" :model-value="formData[field.key] || []"
              @update:model-value="updateField(field.key, $event)" :max-tags="field.maxTags || 10" />
            <div v-else-if="field.type === 'interest-input'" class="interest-input-container">
              <div class="interest-input-row">
                <input v-model="interestInput[field.key]" type="text" :placeholder="field.placeholder"
                  @keydown.enter.prevent="addInterest(field.key)" class="interest-input" />
                <button type="button" @click="addInterest(field.key)" class="add-interest-btn"
                  :disabled="!interestInput[field.key] || !interestInput[field.key].trim()">添加</button>
              </div>
              <div v-if="formData[field.key] && formData[field.key].length > 0" class="interest-tags">
                <span v-for="(interest, index) in formData[field.key]" :key="index" class="interest-tag">
                  {{ interest }}
                  <button type="button" @click="removeInterest(field.key, index)" class="remove-interest-btn">×</button>
                </span>
              </div>
            </div>
            <MbtiPicker v-else-if="field.type === 'mbti-picker'" :model-value="formData[field.key] || ''"
              @update:model-value="updateField(field.key, $event)" :dimensions="field.dimensions" />
            <div v-else-if="field.type === 'video-upload'" class="video-upload-field">
              <!-- 视频上传组件 -->
              <VideoUpload :ref="el => setVideoUploadRef(field.key, el)" :model-value="formData[field.key]"
                @update:model-value="handleVideoUploadChange" @error="handleVideoUploadError"
                @change="handleVideoChange" />
            </div>

          </div>
        </form>
      </div>
      <div class="modal-footer">
        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn btn-outline">取消</button>
          <button type="button" @click="handleSubmit" class="btn btn-primary"
            :disabled="props.loading || isSubmitting || isUploadingImages || isUploadingVideo">
            {{ getButtonText() }}
          </button>
        </div>
      </div>
    </div>
  </div>


  <div v-if="showEmojiPanel" class="emoji-panel-overlay" v-click-outside.mousedown="closeEmojiPanel"
    v-escape-key="closeEmojiPanel">
    <div class="emoji-panel" @mousedown.stop>
      <EmojiPicker @select="handleEmojiSelect" />
    </div>
  </div>


  <MentionModal :visible="showMentionPanel" @close="closeMentionPanel" @select="handleContentEditableMentionSelect" />

  <CropModal :visible="showAvatarCropModal" :image-src="avatarCropImageSrc" :uploading="avatarCropUploading"
    @close="closeAvatarCropModal" @confirm="handleAvatarCropConfirm" />
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import CropModal from '@/views/user/components/CropModal.vue'
import MultiImageUpload from '@/components/MultiImageUpload.vue'
import VideoUpload from '@/components/VideoUpload.vue'
import TagSelector from '@/components/TagSelector.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import MbtiPicker from '@/components/MbtiPicker.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import MentionModal from '@/components/mention/MentionModal.vue'
import ContentEditableInput from '@/components/ContentEditableInput.vue'
import messageManager from '@/utils/messageManager'
// 移除uploadApi导入，改用MultiImageUpload组件的uploadAllImages方法
import { imageUploadApi } from '@/api/index.js'
import { useScrollLock } from '@/composables/useScrollLock'
import { sanitizeContent } from '@/utils/contentSecurity'
import { generateVideoThumbnail, blobToFile, generateThumbnailFilename } from '@/utils/videoThumbnail'
// import { getFriendsList } from '@/api/friends'

const props = defineProps({
  visible: Boolean,
  title: String,
  formFields: {
    type: Array,
    default: () => []
  },
  formData: {
    type: Object,
    default: () => ({})
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  loading: Boolean
})

const emit = defineEmits(['update:visible', 'update:formData', 'submit', 'close', 'asyncUpdate'])

// 图片上传状态管理
const hasNewImages = ref(false)
const isUploadingImages = ref(false)
const uploadCompleted = ref(false)

// 视频上传状态管理
const hasNewVideo = ref(false)
const isUploadingVideo = ref(false)
const videoUploadCompleted = ref(false)

// 防滚动穿透
const { lock, unlock } = useScrollLock()

const multiImageUploadRefs = ref({})
const videoUploadRefs = ref({})
const interestInput = ref({})
const textareaRefs = ref({})
const contentEditableRefs = ref({})
const showEmojiPanel = ref(false)
const showMentionPanel = ref(false)
const currentEmojiField = ref('')
const currentMentionField = ref('')

// 头像上传相关
const avatarFileInputRefs = ref({})
const avatarUploading = ref({})
const avatarErrors = ref({})
const showAvatarCropModal = ref(false)
const avatarCropImageSrc = ref('')
const avatarCropUploading = ref(false)
const currentAvatarField = ref('')

// 视频上传相关
const videoFileInputRefs = ref({})
const videoUploading = ref({})
const videoErrors = ref({})

// 提及用户数据（实际使用中应该从 API 获取）
const mentionUsers = ref([])
const isSubmitting = ref(false)

// 计算可见字段
const visibleFields = computed(() => {
  return props.formFields.filter(field => {
    // 如果字段没有条件，直接显示
    if (!field.condition) return true

    // 检查条件是否满足
    const conditionField = field.condition.field
    const conditionValue = field.condition.value
    const currentValue = props.formData[conditionField]

    return currentValue === conditionValue
  })
})

const setMultiImageUploadRef = (fieldName, el) => {
  if (el) {
    multiImageUploadRefs.value[fieldName] = el
  } else {
    delete multiImageUploadRefs.value[fieldName]
  }
}

const setVideoUploadRef = (fieldName, el) => {
  if (el) {
    videoUploadRefs.value[fieldName] = el
  } else {
    delete videoUploadRefs.value[fieldName]
  }
}

const setTextareaRef = (fieldName, el) => {
  if (el) {
    textareaRefs.value[fieldName] = el
  } else {
    delete textareaRefs.value[fieldName]
  }
}

const setContentEditableRef = (fieldName, el) => {
  if (el) {
    contentEditableRefs.value[fieldName] = el
  } else {
    delete contentEditableRefs.value[fieldName]
  }
}

// 表情选择器相关方法
const toggleEmojiPanel = (fieldKey) => {
  currentEmojiField.value = fieldKey
  showEmojiPanel.value = !showEmojiPanel.value
}

const closeEmojiPanel = () => {
  showEmojiPanel.value = false
  currentEmojiField.value = ''
}

// mention选择器相关方法
const toggleMentionPanel = (fieldKey) => {
  // 如果要打开面板，先插入@符号
  if (!showMentionPanel.value) {
    const contentEditableRef = contentEditableRefs.value[fieldKey]
    if (contentEditableRef && contentEditableRef.insertAtSymbol) {
      contentEditableRef.insertAtSymbol()
    }
  }
  currentMentionField.value = fieldKey
  showMentionPanel.value = !showMentionPanel.value
}

const closeMentionPanel = () => {
  // 当关闭艾特选择模态框时，将输入框中带标记的@符号转换为纯文本
  const fieldKey = currentMentionField.value
  if (fieldKey) {
    const contentEditableRef = contentEditableRefs.value[fieldKey]
    if (contentEditableRef && contentEditableRef.convertAtMarkerToText) {
      contentEditableRef.convertAtMarkerToText()
    }
  }
  showMentionPanel.value = false
  currentMentionField.value = null
}


const handleEmojiSelect = (emoji) => {
  const emojiChar = emoji.i
  const fieldKey = currentEmojiField.value

  // 先尝试ContentEditableInput组件
  const contentEditableRef = contentEditableRefs.value[fieldKey]
  if (contentEditableRef && contentEditableRef.insertEmoji) {
    contentEditableRef.insertEmoji(emojiChar)
    closeEmojiPanel()
    return
  }

  // 如果不是ContentEditableInput，则处理普通textarea
  const inputElement = textareaRefs.value[fieldKey]
  if (inputElement && fieldKey) {
    const start = inputElement.selectionStart || 0
    const end = inputElement.selectionEnd || 0
    const currentValue = formData.value[fieldKey] || ''

    const newValue = currentValue.slice(0, start) + emojiChar + currentValue.slice(end)
    updateField(fieldKey, newValue)

    nextTick(() => {
      const newPosition = start + emojiChar.length
      // 确保元素获得焦点后再设置光标位置
      inputElement.focus()
      // 使用setTimeout确保DOM更新完成后设置光标位置
      setTimeout(() => {
        if (inputElement && typeof inputElement.setSelectionRange === 'function') {
          inputElement.setSelectionRange(newPosition, newPosition)
        }
      }, 0)
    })
  }

  closeEmojiPanel()
}

// 获取纯文本长度（去除HTML标签）
const getPlainTextLength = (htmlContent) => {
  if (!htmlContent) return 0
  // 创建临时div元素来获取纯文本内容
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent
  return tempDiv.textContent?.length || 0
}

const formData = computed(() => {
  return props.formData || {}
})

const hasImageUploadField = (key) => {
  return props.formFields.some(field =>
    field.key === key && (field.type === 'avatar-upload' || field.type === 'multi-image-upload')
  )
}

const getMultiImageUploadValue = (fieldKey) => {
  const value = formData.value[fieldKey]
  return Array.isArray(value) ? value : []
}

// 获取输入框的值
const getInputValue = (field) => {
  const value = formData.value[field.key]

  // 如果是头像URL字段且有对应的上传字段，显示当前头像URL
  if (field.key === 'avatar' && hasImageUploadField('avatar') && field.type === 'text') {
    return value || ''
  }

  return value || ''
}

// 获取文本域的值
const getTextareaValue = (field) => {
  const value = formData.value[field.key]
  return value || ''
}

// 更新输入框字段
const updateInputField = (field, value) => {
  const newData = { ...props.formData }
  newData[field.key] = value
  emit('update:formData', newData)
}

// 更新文本域字段
const updateTextareaField = (field, value) => {
  const newData = { ...props.formData }
  newData[field.key] = value
  emit('update:formData', newData)
}

const updateField = (key, value) => {
  const newData = { ...props.formData }
  newData[key] = value
  emit('update:formData', newData)
}

// 处理DropdownSelect组件的change事件
const handleSelectChange = (key, data) => {
  updateField(key, data.value)
}

// 防止循环更新的标志
let isUpdatingFromImageComponent = false
let isInitializing = false

// ContentEditableInput的mention选择处理
const handleContentEditableMentionSelect = (user) => {
  // 获取当前活动的ContentEditableInput组件引用
  const fieldKey = currentMentionField.value
  const contentEditableRef = contentEditableRefs.value[fieldKey]

  if (contentEditableRef && contentEditableRef.selectMentionUser) {
    contentEditableRef.selectMentionUser(user)
  }

  // 关闭mention面板
  showMentionPanel.value = false
  currentMentionField.value = null
}

// ContentEditableInput的@符号输入处理
const handleContentEditableMentionInput = () => {
  // 当用户输入@符号时，自动打开mention面板
  if (!showMentionPanel.value) {
    showMentionPanel.value = true
    // 设置当前活动的字段（假设只有一个content-editable-input字段）
    const contentEditableFields = Object.keys(contentEditableRefs.value)
    if (contentEditableFields.length > 0) {
      currentMentionField.value = contentEditableFields[0]
    }
  }
}

// 监听模态框可见性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 重置上传状态
    hasNewImages.value = false
    isUploadingImages.value = false
    uploadCompleted.value = false
    // 重置视频上传进行中状态，但不重置完成状态，让video_upload的watch来决定
    isUploadingVideo.value = false
    // 锁定滚动
    lock()

    // 当模态框打开时，根据是否有数据来决定处理方式
    nextTick(() => {
      const images = formData.value['images'] || []
      const videoUrl = formData.value['video_url']
      const coverUrl = formData.value['cover_url']

      // 处理图片数据
      if (images.length === 0) {
        // 如果没有图片数据，说明是新增操作，需要重置
        Object.values(multiImageUploadRefs.value).forEach(ref => {
          if (ref && ref.reset) {
            ref.reset()
          }
        })
      } else {
        // 如果有图片数据，说明是编辑操作，需要同步数据
        Object.values(multiImageUploadRefs.value).forEach(ref => {
          if (ref && ref.syncWithUrls) {
            ref.syncWithUrls(images)
          }
        })
      }

      // 处理视频数据：如果有video_url，构造video_upload对象用于显示
      if (videoUrl) {
        formData.value['video_upload'] = {
          url: videoUrl,
          coverUrl: coverUrl || '',
          uploaded: true
        }
        hasNewVideo.value = false
        videoUploadCompleted.value = true
      } else {
        // 没有视频数据，重置状态
        hasNewVideo.value = false
        videoUploadCompleted.value = false
      }
    })
  } else {
    // 解锁滚动
    unlock()
  }
}, { immediate: true })

// 监听images字段的变化，同步更新图片组件
watch(() => formData.value['images'], (newImages, oldImages) => {
  // 如果是从图片组件触发的更新，跳过同步
  if (isUpdatingFromImageComponent) {
    return
  }

  // 如果是初始化阶段（oldImages为undefined），跳过同步，让组件自己初始化
  if (oldImages === undefined) {
    return
  }

  // 获取图片组件引用
  const imagesUploadRef = multiImageUploadRefs.value['images']
  if (imagesUploadRef && imagesUploadRef.syncWithUrls) {
    imagesUploadRef.syncWithUrls(newImages || [])
  }
}, { deep: true })

// 监听video_upload字段的变化，更新视频上传状态
watch(() => formData.value['video_upload'], (newVideoData, oldVideoData) => {
  if (newVideoData === undefined && oldVideoData) {
    return
  }

  // 更新视频上传状态
  if (newVideoData && typeof newVideoData === 'object' && (newVideoData.url || newVideoData.uploaded)) {
    // 有已上传的视频数据
    hasNewVideo.value = false
    videoUploadCompleted.value = true
  } else if (newVideoData && typeof newVideoData === 'string') {
    // 有新选择的视频文件名
    hasNewVideo.value = true
    videoUploadCompleted.value = false
  } else if (!newVideoData) {
    // 没有视频数据
    hasNewVideo.value = false
    videoUploadCompleted.value = false
  }
}, { deep: true, immediate: true })

// 处理图片上传组件的变化
const handleImageUploadChange = (value) => {
  // 设置标志，防止循环更新
  isUpdatingFromImageComponent = true

  // 检测是否有新图片需要上传
  let hasNewImagesFlag = false
  if (value && Array.isArray(value) && value.length > 0) {
    hasNewImagesFlag = value.some(imageItem =>
      imageItem.file && !imageItem.uploaded
    )
  }
  hasNewImages.value = hasNewImagesFlag

  // 如果没有新图片，重置上传状态
  if (!hasNewImagesFlag) {
    uploadCompleted.value = false
  }

  // 创建新的数据对象，一次性更新多个字段
  const newData = { ...props.formData }

  if (value && Array.isArray(value) && value.length > 0) {
    const newImages = []

    value.forEach((imageItem) => {
      if (imageItem.uploaded && imageItem.url) {
        // 已上传的图片，直接使用其URL
        newImages.push(imageItem.url)
      }
      // 移除占位符逻辑，因为现在直接使用uploadAllImages方法上传
    })

    newData['images'] = newImages
  } else {
    // 如果没有图片，清空相关字段
    newData['images'] = []
  }

  // 一次性emit更新，避免多次触发
  emit('update:formData', newData)

  // 在下一个tick重置标志
  nextTick(() => {
    isUpdatingFromImageComponent = false
  })
}

// 处理视频上传组件的变化
const handleVideoUploadChange = (value) => {

  let processedValue = value

  // 检测视频上传状态
  if (value) {
    // 如果是文件名字符串，说明选择了新视频文件但还未上传
    if (typeof value === 'string') {
      hasNewVideo.value = true
      videoUploadCompleted.value = false
    } else if (typeof value === 'object' && value.file && !value.uploaded) {
      // 如果是包含file的对象但未上传，说明是新选择的视频
      hasNewVideo.value = true
      videoUploadCompleted.value = false
    } else if (typeof value === 'object' && (value.url || value.uploaded)) {
      // 如果是包含url的对象，或者已标记为uploaded，说明是已有视频
      hasNewVideo.value = false
      videoUploadCompleted.value = true

      // 清理数据，只保留后端需要的字段
      processedValue = {
        url: value.url,
        coverUrl: value.coverUrl || value.cover_url,
        uploaded: true
      }
    }
  } else {
    hasNewVideo.value = false
    videoUploadCompleted.value = false
  }
  // 更新表单数据
  const newData = { ...props.formData }
  newData['video_upload'] = processedValue
  emit('update:formData', newData)
}

// 处理视频变更
const handleVideoChange = (changeInfo) => {
  if (typeof changeInfo === 'string') {
    // 兼容原有的fieldKey参数调用
    const fieldKey = changeInfo
    // 清空当前视频数据，触发显示VideoUpload组件
    const newData = { ...props.formData }
    newData[fieldKey] = null
    emit('update:formData', newData)

    // 重置视频状态
    hasNewVideo.value = false
    videoUploadCompleted.value = false
  } else if (changeInfo && changeInfo.hasChanges) {
    // 处理VideoUpload组件的change事件
    if (changeInfo.type === 'video') {
      // 视频文件变更
      hasNewVideo.value = true
      videoUploadCompleted.value = false
    } else if (changeInfo.type === 'cover') {
      // 仅封面变更，不设置hasNewVideo为true
      // 这样在handleSubmit中会走到封面上传的逻辑
      videoUploadCompleted.value = false
    }
  }
}

// 处理从URL组件删除图片的请求
// 获取按钮文本
const getButtonText = () => {
  if (isUploadingImages.value || isUploadingVideo.value) {
    return '上传中...'
  }
  if (props.loading || isSubmitting.value) {
    return '提交中...'
  }

  // 检查是否有新图片需要上传
  if (hasNewImages.value && !uploadCompleted.value) {
    return '上传'
  }

  // 检查是否有新视频需要上传
  if (hasNewVideo.value && !videoUploadCompleted.value) {
    return '上传'
  }

  // 检查是否只有自定义封面需要上传
  const videoUploadRef = videoUploadRefs.value['video_upload']
  const hasCustomCoverOnly = videoUploadRef &&
    videoUploadRef.customCoverFile &&
    !hasNewVideo.value &&
    !videoUploadCompleted.value

  if (hasCustomCoverOnly) {
    return '上传'
  }

  return props.confirmText
}

const handleClose = () => {
  // 清理所有MultiImageUpload组件的引用
  Object.keys(multiImageUploadRefs.value).forEach(key => {
    const ref = multiImageUploadRefs.value[key]
    if (ref && ref.reset) {
      ref.reset()
    }
  })

  // 重置标志
  isUpdatingFromImageComponent = false

  emit('update:visible', false)
  emit('close')
}



// 兴趣输入相关方法
const addInterest = (fieldKey) => {
  const input = interestInput.value[fieldKey]
  if (!input || !input.trim()) return

  const currentInterests = formData.value[fieldKey] || []
  const newInterest = input.trim()

  // 检查是否已存在
  if (currentInterests.includes(newInterest)) {
    interestInput.value[fieldKey] = ''
    return
  }

  const newData = { ...props.formData }
  newData[fieldKey] = [...currentInterests, newInterest]
  emit('update:formData', newData)

  // 清空输入框
  interestInput.value[fieldKey] = ''
}

const removeInterest = (fieldKey, index) => {
  const currentInterests = formData.value[fieldKey] || []
  const newInterests = currentInterests.filter((_, i) => i !== index)

  const newData = { ...props.formData }
  newData[fieldKey] = newInterests
  emit('update:formData', newData)
}



const handleSubmit = async () => {
  if (isSubmitting.value) {
    return
  }

  // 如果有新图片需要上传，先上传图片
  if (hasNewImages.value && !uploadCompleted.value) {
    await handleImageUpload()
    return
  }

  // 检查是否只有封面需要上传（没有新视频但有自定义封面）
  const videoUploadRef = videoUploadRefs.value['video_upload']
  const hasCustomCoverOnly = videoUploadRef &&
    videoUploadRef.customCoverFile &&
    !hasNewVideo.value &&
    !videoUploadCompleted.value

  if (hasCustomCoverOnly) {
    await handleCoverOnlyUpload()
    return
  }

  // 如果有新视频需要上传，先上传视频
  if (hasNewVideo.value && !videoUploadCompleted.value) {
    await handleVideoUpload()
    return
  }

  // 如果没有新图片/视频或已上传完成，直接提交表单
  await handleFormSubmit()
}

// 处理仅封面上传的情况
const handleCoverOnlyUpload = async () => {
  if (isUploadingVideo.value) {
    return
  }

  isUploadingVideo.value = true
  isSubmitting.value = true

  try {
    // 获取视频组件引用
    const videoUploadRef = videoUploadRefs.value['video_upload']
    if (!videoUploadRef) {
      messageManager.error('视频组件未找到')
      return
    }

    // 检查是否有自定义封面需要上传
    const customCoverFile = videoUploadRef.customCoverFile
    if (!customCoverFile) {
      messageManager.warning('没有需要上传的封面')
      return
    }

    messageManager.info('正在上传封面...')

    // 上传封面到图床
    const coverUrl = await videoUploadRef.uploadCustomCover()

    if (coverUrl) {
      // 更新表单数据中的封面URL，但不构造video对象
      const processedData = { ...props.formData }
      processedData['cover_url'] = coverUrl

      emit('update:formData', processedData)

      // 标记上传完成
      hasNewVideo.value = false
      videoUploadCompleted.value = true

      messageManager.success('封面上传成功')

      // 自动提交表单
      await handleFormSubmit()
    } else {
      messageManager.error('封面上传失败，请重试')
    }
  } catch (error) {
    console.error('封面上传失败:', error)
    messageManager.error(`封面上传失败: ${error.message}`)
  } finally {
    isUploadingVideo.value = false
    isSubmitting.value = false
  }
}

// 处理视频上传
const handleVideoUpload = async () => {
  if (isUploadingVideo.value) {
    return
  }

  isUploadingVideo.value = true
  isSubmitting.value = true

  try {
    // 获取视频组件引用
    const videoUploadRef = videoUploadRefs.value['video_upload']
    if (!videoUploadRef) {
      messageManager.error('视频组件未找到')
      return
    }

    // 获取视频数据
    const videoData = videoUploadRef.getVideoData()

    if (videoData && videoData.file && !videoData.uploaded) {
      messageManager.info('正在上传视频...')

      // 调用视频组件的上传方法
      const uploadResult = await videoUploadRef.startUpload()

      if (uploadResult && uploadResult.success) {
        // 上传成功后，设置video对象用于后端处理（包含旧文件清理）
        const processedData = { ...props.formData }

        // 设置video对象，后端会根据此对象自动清理旧文件
        processedData['video'] = {
          url: uploadResult.data.url,
          coverUrl: uploadResult.data.coverUrl || uploadResult.data.thumbnailUrl || null
        }

        // 同时设置分离的字段用于兼容
        processedData['video_url'] = uploadResult.data.url
        processedData['cover_url'] = uploadResult.data.coverUrl || uploadResult.data.thumbnailUrl || ''

        // 同时更新video_upload用于组件显示
        processedData['video_upload'] = {
          url: uploadResult.data.url,
          coverUrl: uploadResult.data.coverUrl || uploadResult.data.thumbnailUrl,
          name: uploadResult.data.originalname || videoData.name,
          size: uploadResult.data.size || videoData.size,
          uploaded: true
        }

        emit('update:formData', processedData)

        // 标记视频上传完成
        hasNewVideo.value = false
        videoUploadCompleted.value = true

        messageManager.success('视频上传成功')

        // 自动提交表单
        await handleFormSubmit()
      } else {
        messageManager.error('视频上传失败，请重试')
      }
    } else {
      messageManager.warning('没有需要上传的视频')
    }
  } catch (error) {
    console.error('视频上传失败:', error)
    messageManager.error(`视频上传失败: ${error.message}`)
  } finally {
    isUploadingVideo.value = false
    isSubmitting.value = false
  }
}

// 处理图片上传
const handleImageUpload = async () => {
  if (isUploadingImages.value) {
    return
  }

  isUploadingImages.value = true
  isSubmitting.value = true

  try {
    // 处理图片数据
    const processedData = { ...props.formData }

    // 获取所有图片组件并上传图片
    for (const [fieldKey, ref] of Object.entries(multiImageUploadRefs.value)) {
      if (ref && ref.uploadAllImages) {
        try {
          // 检查是否有图片需要上传
          if (ref.getImageCount() > 0) {
            // 显示上传进度提示
            const imageCount = ref.getImageCount()
            if (imageCount > 3) {
              messageManager.info(`正在上传 ${imageCount} 张图片，请耐心等待...`)
            }

            // 使用MultiImageUpload组件的uploadAllImages方法上传图片
            const uploadedUrls = await ref.uploadAllImages()

            if (uploadedUrls && uploadedUrls.length > 0) {
              // 图片上传完成
              if (imageCount > 3) {
                messageManager.success(`成功上传 ${uploadedUrls.length} 张图片`)
              }

              // 更新对应的字段
              if (fieldKey === 'images') {
                // 设置images字段，用于后台管理系统
                processedData['images'] = uploadedUrls
              } else {
                processedData[fieldKey] = uploadedUrls
              }
            } else {
              // 如果没有上传成功的图片，设置为空数组
              processedData[fieldKey] = []
            }
          } else {
            // 如果没有图片，设置为空数组
            processedData[fieldKey] = []
          }
        } catch (error) {
          console.error(`${fieldKey} 图片上传失败:`, error)
          messageManager.error(`图片上传失败: ${error.message}`)
          throw new Error(`图片上传失败: ${error.message}`)
        }
      }
    }

    // 更新表单数据
    emit('update:formData', processedData)

    // 标记上传完成
    uploadCompleted.value = true
    hasNewImages.value = false

    // 自动提交表单
    await handleFormSubmit()

  } catch (error) {
    console.error('图片上传失败:', error)
    messageManager.error(`图片上传失败: ${error.message}`)
  } finally {
    isUploadingImages.value = false
    isSubmitting.value = false
  }
}

// 处理表单提交
const handleFormSubmit = async () => {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    // 处理内容安全过滤
    const processedData = { ...props.formData }
    const contentFields = ['content', 'description', 'bio', 'introduction', 'summary']
    contentFields.forEach(field => {
      if (processedData[field]) {
        processedData[field] = sanitizeContent(processedData[field])
      }
    })

    // 视频数据处理：只对包含视频相关字段的表单进行处理
    const hasVideoFields = processedData.hasOwnProperty('video_url') || processedData.hasOwnProperty('video_upload')

    if (hasVideoFields) {
      // 移除临时的video_upload对象，但保留video对象用于后端清理旧文件
      if (processedData.video_upload) {
        delete processedData.video_upload
      }

      // 如果有视频URL，根据情况构建video对象发送给后端
      if (processedData.video_url) {
        // 检查是否有新的视频文件上传
        const hasNewVideoFile = hasNewVideo.value && videoUploadCompleted.value;

        if (hasNewVideoFile) {
          // 有新视频文件上传，构造完整的video对象用于文件清理
          processedData.video = {
            url: processedData.video_url,
            coverUrl: processedData.cover_url || null
          }
        } else {
          // 仅更新封面或其他字段，不构造video对象，避免误删视频文件
          processedData.video = null
        }
      } else {
        // 如果没有视频URL，确保video字段为null
        processedData.video = null
      }
    }

    emit('submit', processedData)

    // 如果有图片上传，在提交后触发异步更新
    const hasImageUploads = Object.keys(processedData).some(key =>
      key.includes('image') && Array.isArray(processedData[key]) && processedData[key].length > 0
    )

    if (hasImageUploads) {
      // 延迟触发异步更新，确保主要提交完成
      setTimeout(() => {
        emit('asyncUpdate', processedData)
      }, 100)
    }

  } catch (error) {
    console.error('表单提交失败:', error)
    messageManager.error(`提交失败: ${error.message}`)
  } finally {
    isSubmitting.value = false
  }
}
// 头像上传相关方法
const setAvatarFileInputRef = (fieldKey, el) => {
  if (el) {
    avatarFileInputRefs.value[fieldKey] = el
  }
}

const triggerAvatarFileInput = (fieldKey) => {
  avatarFileInputRefs.value[fieldKey]?.click()
}

// 处理视频上传错误
const handleVideoUploadError = (error) => {
  messageManager.error(error)
}

// 视频上传相关方法（保留原有方法以防其他地方使用）
const setVideoFileInputRef = (fieldKey, el) => {
  if (el) {
    videoFileInputRefs.value[fieldKey] = el
  }
}

const triggerVideoFileInput = (fieldKey) => {
  videoFileInputRefs.value[fieldKey]?.click()
}

const handleVideoFileSelect = async (event, fieldKey) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型和大小
  const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv']
  const maxSize = 100 * 1024 * 1024 // 100MB

  if (!validTypes.includes(file.type)) {
    videoErrors.value[fieldKey] = '请选择有效的视频格式 (MP4, AVI, MOV, WMV, FLV)'
    return
  }

  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
    videoErrors.value[fieldKey] = `视频大小为 ${fileSizeMB}MB，超过 100MB 限制，请选择更小的视频`
    return
  }

  videoErrors.value[fieldKey] = ''

  try {
    // 生成视频缩略图用于预览
    const thumbnailResult = await generateVideoThumbnail(file, {
      width: 640,
      height: 360,
      quality: 0.8,
      seekTime: 1
    })

    if (!thumbnailResult.success) {
      console.error('生成缩略图失败:', thumbnailResult.error)
      videoErrors.value[fieldKey] = '生成缩略图失败，请重试'
      return
    }

    // 创建缩略图URL用于预览
    const thumbnailUrl = URL.createObjectURL(thumbnailResult.blob)

    // 构造视频对象，包含文件和预览信息，但不上传到服务器
    const videoData = {
      file: file,
      name: file.name,
      size: file.size,
      coverUrl: thumbnailUrl,
      preview: URL.createObjectURL(file),
      uploaded: false,
      url: null
    }

    // 更新表单数据
    updateField(fieldKey, videoData)
  } catch (error) {
    console.error('处理视频文件失败:', error)
    videoErrors.value[fieldKey] = '处理视频文件失败，请重试'
  }
}

const handleAvatarFileSelect = (event, fieldKey) => {
  const file = event.target.files[0]
  if (file) {
    showAvatarCropDialog(file, fieldKey)
  }
}

const handleAvatarDrop = (event, fieldKey) => {
  const files = event.dataTransfer.files
  if (files.length > 0) {
    showAvatarCropDialog(files[0], fieldKey)
  }
}

const showAvatarCropDialog = async (file, fieldKey) => {
  // 验证文件
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024

  if (!validTypes.includes(file.type)) {
    avatarErrors.value[fieldKey] = '请选择有效的图片格式 (JPEG, PNG, GIF, WebP)'
    return
  }

  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
    avatarErrors.value[fieldKey] = `图片大小为 ${fileSizeMB}MB，超过 5MB 限制，请选择更小的图片`
    return
  }

  avatarErrors.value[fieldKey] = ''
  currentAvatarField.value = fieldKey

  try {
    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarCropImageSrc.value = e.target.result
      showAvatarCropModal.value = true
    }
    reader.readAsDataURL(file)
  } catch (err) {
    console.error('生成预览失败:', err)
    avatarErrors.value[fieldKey] = '文件读取失败，请重试'
  }
}

const closeAvatarCropModal = () => {
  showAvatarCropModal.value = false
  avatarCropImageSrc.value = ''
  currentAvatarField.value = ''
  // 清空文件输入框
  if (currentAvatarField.value && avatarFileInputRefs.value[currentAvatarField.value]) {
    avatarFileInputRefs.value[currentAvatarField.value].value = ''
  }
}

const handleAvatarCropConfirm = async (blob) => {
  const fieldKey = currentAvatarField.value
  if (!fieldKey) return

  avatarCropUploading.value = true
  avatarErrors.value[fieldKey] = ''

  try {
    // 调用实际的上传API
    const result = await imageUploadApi.uploadCroppedImage(blob, {
      filename: 'avatar.png'
    })

    if (result.success) {
      // 使用服务器返回的URL
      updateField(fieldKey, result.data.url)
    } else {
      console.error('头像上传失败:', result.message)
      avatarErrors.value[fieldKey] = result.message || '头像上传失败，请重试'
      return
    }

    showAvatarCropModal.value = false
    avatarCropImageSrc.value = ''
    currentAvatarField.value = ''
  } catch (err) {
    console.error('头像上传异常:', err)
    avatarErrors.value[fieldKey] = '头像上传失败，请重试'
  } finally {
    avatarCropUploading.value = false
  }
}

// 暴露给父组件的方法和数据
defineExpose({
  videoUploadRefs
})

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--overlay-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-color-primary);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-color 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color-primary);
  flex-shrink: 0;
  background: var(--bg-color-primary);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.modal-header h4 {
  margin: 0;
  color: var(--text-color-primary);
}

.close-btn {
  background: var(--bg-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--text-color-primary);
}

.close-btn:hover {
  color: var(--text-color-secondary);
  transform: scale(1.1);
  transition: all 0.2s ease;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  /* 确保flex子元素可以收缩 */
}

.modal-footer {
  flex-shrink: 0;
  background: var(--bg-color-primary);
  border-top: 1px solid var(--border-color-primary);
  padding: 20px 30px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: var(--text-color-primary);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background-color: var(--bg-color-primary);
  color: var(--text-color-primary);
  caret-color: var(--primary-color);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.form-group input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.form-group textarea {
  resize: vertical;
}

.checkbox-group {
  margin-top: 8px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
  cursor: pointer;
  padding: 6px 0;
  font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
  padding: 0;
  transform: scale(1.1);
  accent-color: var(--primary-color);
}

.radio-group {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
  cursor: pointer;
  padding: 6px 0;
  font-size: 14px;
}

.radio-label input[type="radio"] {
  width: auto;
  margin: 0;
  padding: 0;
  transform: scale(1.1);
  accent-color: var(--primary-color);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: 0;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-color-dark);
}

.btn-outline {
  background-color: transparent;
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color-primary);
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--bg-color-secondary);
}

/* 兴趣输入样式 */
.interest-input-container {
  width: 100%;
}

.interest-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.interest-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  font-size: 14px;
}

.add-interest-btn {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: var(--button-text-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.add-interest-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  opacity: 0.9;
}

.add-interest-btn:disabled {
  background-color: var(--disabled-bg);
  cursor: not-allowed;
}

.interest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.interest-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color-primary);
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-color-primary);
}

.remove-interest-btn {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  margin-left: 2px;
}

.remove-interest-btn:hover {
  color: var(--primary-color);
}

/* 带表情的textarea样式 */
.textarea-with-emoji-wrapper {
  position: relative;
  width: 100%;
}

.textarea-with-emoji {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  padding-bottom: 40px;
  /* 为底部操作栏留出空间 */
}

/* ContentEditableInput样式 */
.input-section {
  position: relative;
  width: 100%;
}

.content-input-wrapper {
  position: relative;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-primary);
  transition: all 0.2s ease;
}

.content-input-wrapper:focus-within {
  border-color: var(--primary-color);
}

.content-input-wrapper :deep(.content-textarea) {
  width: 100%;
  padding: 1rem;
  padding-bottom: 3rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-color-primary);
  font-size: 16px;
  line-height: 1.5;
  transition: all 0.2s ease;
  min-height: 120px;
  box-sizing: border-box;
  caret-color: var(--primary-color);
}

.content-input-wrapper :deep(.content-textarea:focus) {
  outline: none;
}

.content-input-wrapper :deep(.mention-link) {
  color: var(--text-color-tag);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  background: none;
  border: none;
  padding: 0;
  display: inline;
}

.content-input-wrapper :deep(.mention-link:hover) {
  color: var(--text-color-tag);
  opacity: 0.8;
}

.content-input-wrapper :deep(.mention-link:active) {
  color: var(--text-color-tag);
  opacity: 0.6;
}

.content-actions {
  position: absolute;
  bottom: 0.5rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-btn,
.mention-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-color-secondary, #999);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.emoji-btn:hover,
.mention-btn:hover {
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
}

.emoji-icon,
.mention-icon {
  width: 20px;
  height: 20px;
}

.input-section .char-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  background: var(--bg-color-primary);
  padding: 0.25rem;
  border-radius: 4px;
}

.textarea-actions {
  position: absolute;
  bottom: 8px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}



.emoji-icon,
.mention-icon {
  color: var(--text-color-secondary);
}

.char-count {
  font-size: 12px;
  color: var(--text-color-tertiary);
  white-space: nowrap;
}

/* 表情选择器面板样式 */
.emoji-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.emoji-panel {
  background: var(--bg-color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: scaleIn 0.2s ease;
  max-width: 90vw;
  max-height: 90vh;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 头像上传样式 */
.avatar-upload-field {
  width: 100%;
}

.avatar-upload-area {
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

.avatar-upload-area:hover {
  border-color: var(--primary-color);
  background-color: var(--bg-color-secondary);
}

.avatar-upload-placeholder {
  color: var(--text-color-secondary);
}

.upload-hint {
  font-size: 12px;
  color: var(--text-color-tertiary);
  margin: 5px 0 0 0;
}

.avatar-upload-loading {
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

.avatar-image-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.avatar-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.avatar-error-message {
  color: var(--primary-color);
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
}

/* 视频上传样式 */
.video-upload-field {
  width: 100%;
}
</style>
