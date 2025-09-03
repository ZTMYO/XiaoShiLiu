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
          <div v-for="field in formFields" :key="field.key" class="form-group">
            <label>{{ field.label }}{{ field.required ? ' *' : '' }}:</label>
            <input v-if="field.type === 'text' || field.type === 'email' || field.type === 'password'"
              :value="getInputValue(field)" @input="updateInputField(field, $event.target.value)" :type="field.type"
              :placeholder="field.placeholder" :required="field.required" :maxlength="field.maxlength" />
            <textarea v-else-if="field.type === 'textarea'" :value="getTextareaValue(field)"
              @input="updateTextareaField(field, $event.target.value)" :placeholder="field.placeholder"
              :required="field.required" rows="4"></textarea>
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
            <DropdownSelect v-else-if="field.type === 'select'" :model-value="formData[field.key] || ''"
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
            <AvatarUpload v-else-if="field.type === 'avatar-upload'" :model-value="formData[field.key]"
              @update:model-value="updateField(field.key, $event)" :placeholder="field.placeholder" />
            <MultiImageUpload v-else-if="field.type === 'multi-image-upload'"
              :ref="el => setMultiImageUploadRef(field.key, el)" :model-value="getMultiImageUploadValue(field.key)"
              @update:model-value="handleImageUploadChange" :max-images="field.maxImages || 9" />
            <DynamicImageUrls v-else-if="field.type === 'dynamic-image-urls'" :model-value="formData[field.key] || []"
              @update:model-value="updateField(field.key, $event)" @remove-image="handleRemoveImageById"
              :max-images="field.maxImages || 9" />
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

          </div>
        </form>
      </div>
      <div class="modal-footer">
        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn btn-outline">取消</button>
          <button type="submit" @click="handleSubmit" class="btn btn-primary" :disabled="loading || isSubmitting">
            {{ loading || isSubmitting ? '提交中...' : confirmText }}
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
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import AvatarUpload from './AvatarUpload.vue'
import MultiImageUpload from '@/components/MultiImageUpload.vue'
import DynamicImageUrls from './DynamicImageUrls.vue'
import TagSelector from '@/components/TagSelector.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import MbtiPicker from '@/components/MbtiPicker.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import MentionModal from '@/components/mention/MentionModal.vue'
import ContentEditableInput from '@/components/ContentEditableInput.vue'
import messageManager from '@/utils/messageManager'
import { uploadApi } from '@/api/index.js'
import { useScrollLock } from '@/composables/useScrollLock'
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

// 防滚动穿透
const { lock, unlock } = useScrollLock()

const multiImageUploadRefs = ref({})
const interestInput = ref({})
const textareaRefs = ref({})
const contentEditableRefs = ref({})
const showEmojiPanel = ref(false)
const showMentionPanel = ref(false)
const currentEmojiField = ref('')
const currentMentionField = ref('')
// 提及用户数据（实际使用中应该从 API 获取）
const mentionUsers = ref([])
const isSubmitting = ref(false)

const setMultiImageUploadRef = (fieldName, el) => {
  if (el) {
    multiImageUploadRefs.value[fieldName] = el
  } else {
    delete multiImageUploadRefs.value[fieldName]
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
  showMentionPanel.value = false
  currentMentionField.value = null
}

const handleMentionSelect = (friend) => {
  // 创建包含用户信息的mention标记，格式：[@nickname:user_id]
  const userId = friend.user_id || friend.username || friend.id
  const nickname = friend.nickname || friend.username || friend.user_id
  const mentionText = `[@${nickname}:${userId}] `
  const fieldKey = currentMentionField.value
  const inputElement = textareaRefs.value[fieldKey]

  if (inputElement && fieldKey) {
    const start = inputElement.selectionStart || 0
    const end = inputElement.selectionEnd || 0
    const currentValue = formData.value[fieldKey] || ''

    const newValue = currentValue.slice(0, start) + mentionText + currentValue.slice(end)
    updateField(fieldKey, newValue)

    nextTick(() => {
      const newPosition = start + mentionText.length
      inputElement.setSelectionRange(newPosition, newPosition)
      inputElement.focus()
    })
  }

  closeMentionPanel()
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
  if (fieldKey === 'images') {
    const imageUrls = formData.value['image_urls']
    if (Array.isArray(imageUrls)) {
      return imageUrls.filter(url => url && typeof url === 'string' && url.trim()).map(url => url.trim())
    }
    return []
  }

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

  // 如果是头像URL字段，直接更新
  if (field.key === 'avatar' && hasImageUploadField('avatar') && field.type === 'text') {
    newData[field.key] = value
  } else {
    newData[field.key] = value
  }

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

  // 如果是image_urls字段（URL输入），确保清理所有URL
  if (key === 'image_urls' && Array.isArray(value)) {
    newData[key] = value.map(url => {
      if (typeof url === 'string') {
        return url.trim().replace(/\`/g, '').replace(/\s+/g, '')
      }
      return url
    })
  } else {
    newData[key] = value
  }

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
  console.log('选择了用户:', user)
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
    // 锁定滚动
    lock()

    // 当模态框打开时，根据是否有数据来决定处理方式
    nextTick(() => {
      const imageUrls = formData.value['image_urls'] || []

      // 如果没有图片数据，说明是新增操作，需要重置
      if (imageUrls.length === 0) {
        Object.values(multiImageUploadRefs.value).forEach(ref => {
          if (ref && ref.reset) {
            ref.reset()
          }
        })
      } else {
        // 如果有图片数据，说明是编辑操作，需要同步数据
        Object.values(multiImageUploadRefs.value).forEach(ref => {
          if (ref && ref.syncWithUrls) {
            ref.syncWithUrls(imageUrls)
          }
        })
      }
    })
  } else {
    // 解锁滚动
    unlock()
  }
}, { immediate: true })

// 监听image_urls字段的变化，同步更新图片组件
watch(() => formData.value['image_urls'], (newUrls, oldUrls) => {
  // 如果是从图片组件触发的更新，跳过同步
  if (isUpdatingFromImageComponent) {
    return
  }

  // 如果是初始化阶段（oldUrls为undefined），跳过同步，让组件自己初始化
  if (oldUrls === undefined) {
    return
  }

  // 获取图片组件引用
  const imagesUploadRef = multiImageUploadRefs.value['images']
  if (imagesUploadRef && imagesUploadRef.syncWithUrls) {
    imagesUploadRef.syncWithUrls(newUrls || [])
  }
}, { deep: true })

// 处理图片上传组件的变化
const handleImageUploadChange = (value) => {
  // 设置标志，防止循环更新
  isUpdatingFromImageComponent = true

  // 创建新的数据对象，一次性更新多个字段
  const newData = { ...props.formData }

  if (value && Array.isArray(value) && value.length > 0) {
    const newImageUrls = []

    value.forEach((imageItem) => {
      if (imageItem.uploaded && imageItem.url) {
        // 已上传的图片，直接使用其URL
        newImageUrls.push(imageItem.url)
      }
      // 新选择的图片文件不在这里处理，留给上传时处理
    })

    newData['image_urls'] = newImageUrls
  } else {
    // 如果没有图片，清空相关字段
    newData['image_urls'] = []
  }

  // 一次性emit更新，避免多次触发
  emit('update:formData', newData)

  // 在下一个tick重置标志
  nextTick(() => {
    isUpdatingFromImageComponent = false
  })
}

// 处理从URL组件删除图片的请求
const handleRemoveImageById = (imageId) => {
  // 获取图片组件引用
  const imagesUploadRef = multiImageUploadRefs.value['images']
  if (imagesUploadRef && imagesUploadRef.removeImageById) {
    imagesUploadRef.removeImageById(imageId)
  }
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

// 内容安全过滤函数
const sanitizeContent = (content) => {
  if (!content) return ''

  // 保留mention链接，但移除其他危险标签
  // 先保存mention链接
  const mentionLinks = []
  let processedContent = content.replace(/<a[^>]*class="mention-link"[^>]*>.*?<\/a>/g, (match) => {
    const placeholder = `__MENTION_${mentionLinks.length}__`
    mentionLinks.push(match)
    return placeholder
  })

  // 移除所有其他HTML标签
  processedContent = processedContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')

  // 恢复mention链接
  mentionLinks.forEach((link, index) => {
    processedContent = processedContent.replace(`__MENTION_${index}__`, link)
  })

  return processedContent.trim()
}

const handleSubmit = async () => {
  if (isSubmitting.value) {
    console.log('正在提交中，请勿重复点击')
    return
  }

  isSubmitting.value = true

  try {
    console.log('开始处理表单提交...')

    // 处理图片数据和内容安全过滤
    const processedData = { ...props.formData }

    // 对可能包含用户输入内容的字段进行安全过滤
    const contentFields = ['content', 'description', 'bio', 'introduction', 'summary']
    contentFields.forEach(field => {
      if (processedData[field]) {
        processedData[field] = sanitizeContent(processedData[field])
      }
    })

    // 获取所有图片组件的图片数据（包括已有URL和新图片的base64）
    for (const [fieldKey, ref] of Object.entries(multiImageUploadRefs.value)) {
      if (ref && ref.getAllImageData) {
        try {
          const imageData = await ref.getAllImageData()
          // 收集base64数据准备上传

          // 分离已有URL和base64数据，同时保持原有顺序
          const base64Images = []
          const base64IndexMap = new Map() // 记录base64数据在原数组中的位置

          imageData.forEach((item, index) => {
            if (typeof item === 'string' && item.startsWith('data:image/')) {
              base64Images.push(item)
              base64IndexMap.set(base64Images.length - 1, index)
            }
          })

          // 准备上传图片到图床

          // 如果有base64图片需要上传
          let uploadedUrls = []
          if (base64Images.length > 0) {
            // 显示上传进度提示
            if (base64Images.length > 3) {
              messageManager.info(`正在上传 ${base64Images.length} 张图片，请耐心等待...`)
            }

            const uploadResult = await uploadApi.uploadBase64Images(base64Images)
            if (uploadResult.success) {
              uploadedUrls = uploadResult.data
              // 图片上传完成
              if (base64Images.length > 3) {
                messageManager.success(`成功上传 ${uploadedUrls.length} 张图片`)
              }
            } else {
              console.error('❌ 上传base64图片到图床失败:', uploadResult.message)
              messageManager.error(`图片上传失败: ${uploadResult.message}`)
              throw new Error(`图片上传失败: ${uploadResult.message}`)
            }
          }

          // 按原有顺序合并URL，将base64数据替换为上传后的URL
          const allImageUrls = []
          let uploadedIndex = 0

          imageData.forEach((item, index) => {
            if (typeof item === 'string') {
              if (item.startsWith('data:image/')) {
                // 用上传后的URL替换base64数据
                if (uploadedIndex < uploadedUrls.length) {
                  allImageUrls.push(uploadedUrls[uploadedIndex])
                  uploadedIndex++
                }
              } else {
                // 已有的URL直接使用
                allImageUrls.push(item)
              }
            }
          })

          console.log('合并后的图片列表（保持原有顺序）:', allImageUrls)

          // 更新对应的字段
          if (fieldKey === 'images') {
            processedData['images'] = allImageUrls
            processedData['image_urls'] = allImageUrls // 同时更新image_urls字段以兼容后端
          } else {
            processedData[fieldKey] = allImageUrls
          }

          console.log('图片处理完成')
        } catch (error) {
          console.error(`${fieldKey} 获取图片数据失败:`, error)
          messageManager.error(`图片处理失败: ${error.message}`)
          throw new Error(`图片处理失败: ${error.message}`)
        }
      }
    }

    console.log('提交表单数据:', processedData)
    console.log('提交表单数据类型检查:', {
      images: typeof processedData.images,
      image_urls: typeof processedData.image_urls,
      tags: typeof processedData.tags,
      imagesLength: Array.isArray(processedData.images) ? processedData.images.length : 'not array',
      tagsLength: Array.isArray(processedData.tags) ? processedData.tags.length : 'not array',
      tagsContent: processedData.tags
    })
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

.modal {
  background: var(--bg-color-primary);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color-primary);
  flex-shrink: 0;
  background: var(--bg-color-primary);
}

.modal-header h4 {
  margin: 0;
  color: var(--text-color-primary);
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
  color: white;
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
  background-color: #ccc;
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

.emoji-btn,
.mention-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.emoji-btn:hover,
.mention-btn:hover {
  background-color: var(--bg-color-secondary);
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.emoji-panel {
  background: var(--bg-color-primary);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}
</style>