<template>
  <div v-if="visible" class="modal-overlay" v-click-outside.mousedown="handleClose" v-escape-key="handleClose">
    <div class="modal" @mousedown.stop>
      <div class="modal-header">
        <h4>编辑资料</h4>
        <button @click="handleClose" class="close-btn">
          <SvgIcon name="close" width="20" height="20" />
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSave">

          <div class="form-group">
            <label class="form-label">头像:</label>
            <div class="avatar-upload-container">
              <div class="avatar-upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
                <div v-if="!uploading" class="avatar-preview">
                  <img :src="form.avatar" alt="头像" class="avatar-image" />
                  <SvgIcon class="overlay-icon" name="edit" width="30" height="30" />
                </div>
                <div v-else class="upload-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ uploadProgress }}%</span>
                </div>
              </div>
              <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" style="display: none;" />
            </div>
          </div>


          <div class="form-group">
            <label class="form-label">昵称:</label>
            <input v-model="form.nickname" type="text" placeholder="请输入昵称" maxlength="10" />
          </div>


          <div class="form-group">
            <label class="form-label">个人简介:</label>
            <div class="bio-input-wrapper">
              <ContentEditableInput ref="bioTextarea" v-model="form.bio" :input-class="'content-textarea'"
                :placeholder="'请输入个人简介'" :enable-mention="true" :mention-users="mentionUsers"
                @mention="handleMentionInput" @keydown="handleInputKeydown" />
              <div class="bio-actions">
                <button type="button" class="mention-btn" @click="toggleMentionPanel">
                  <SvgIcon name="mention" class="mention-icon" width="20" height="20" />
                </button>
                <button type="button" class="emoji-btn" @click="toggleEmojiPanel">
                  <SvgIcon name="emoji" class="emoji-icon" width="20" height="20" />
                </button>
              </div>
              <div class="char-count">{{ form.bio.length }}/200</div>
            </div>
          </div>





          <div class="form-group">
            <label class="form-label">性别:</label>
            <DropdownSelect v-model="form.gender" :options="genderOptions" placeholder="请选择性别" label-key="label"
              value-key="value" min-width="100%" />
          </div>


          <div class="form-group">
            <label class="form-label">星座:</label>
            <DropdownSelect v-model="form.zodiac_sign" :options="zodiacOptions" placeholder="请选择星座" label-key="label"
              value-key="value" min-width="100%" />
          </div>


          <div class="form-group">
            <label class="form-label">MBTI:</label>
            <MbtiPicker v-model="form.mbti" :dimensions="mbtiDimensions" />
          </div>


          <div class="form-group">
            <label class="form-label">学历:</label>
            <DropdownSelect v-model="form.education" :options="educationOptions" placeholder="请选择学历" label-key="label"
              value-key="value" min-width="100%" />
          </div>


          <div class="form-group">
            <label class="form-label">专业:</label>
            <input v-model="form.major" type="text" placeholder="请输入专业" maxlength="11" />
          </div>


          <div class="form-group">
            <label class="form-label">兴趣爱好:</label>
            <div class="interests-input">
              <div class="interest-tags">
                <span v-for="(interest, index) in form.interests" :key="index" class="interest-tag">
                  {{ interest }}
                  <button type="button" @click="removeInterest(index)" class="remove-tag-btn">
                    ×
                  </button>
                </span>
              </div>
              <div class="add-interest">
                <input v-model="newInterest" type="text" placeholder="输入兴趣爱好后按回车添加" @keyup.enter="addInterest"
                  @blur="addInterest" maxlength="8" />
                <button type="button" @click="addInterest" class="add-btn"
                  :disabled="!newInterest.trim() || form.interests.length >= 5 || (newInterest.trim() && form.interests.includes(newInterest.trim()))">添加</button>
              </div>
              <div class="interest-hint">
                最长8个字，最多5个
              </div>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn btn-outline">取消</button>
          <button type="submit" @click="handleSave" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>


  <div v-if="showCropModal" class="modal-overlay" v-click-outside.mousedown="closeCropModal"
    v-escape-key="closeCropModal">
    <div class="modal crop-modal" @mousedown.stop>
      <div class="modal-header">
        <h4>裁剪头像</h4>
        <button @click="closeCropModal" class="close-btn">
          <SvgIcon name="close" width="16" height="16" />
        </button>
      </div>
      <div class="modal-body">
        <div class="crop-container">
          <img ref="cropImage" :src="cropImageSrc" alt="待裁剪图片" />
        </div>
      </div>
      <div class="modal-footer">
        <div class="form-actions">
          <button type="button" @click="closeCropModal" class="btn btn-outline">取消</button>
          <button type="button" @click="confirmCrop" class="btn btn-primary">确认裁剪</button>
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


  <MentionModal :visible="showMentionPanel" @close="closeMentionPanel" @select="handleMentionSelect" />
</template>

<script setup>
import { ref, reactive, nextTick, watch, inject, computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { imageUploadApi } from '@/api/index.js'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import EmojiPicker from '@/components/EmojiPicker.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import MbtiPicker from '@/components/MbtiPicker.vue'
import MentionModal from '@/components/mention/MentionModal.vue'
import ContentEditableInput from '@/components/ContentEditableInput.vue'
import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'save'])

// 注入消息管理器
const $message = inject('$message')

// 滚动锁定
const { lock, unlock } = useScrollLock()

const defaultAvatar = new URL('@/assets/imgs/avatar.png', import.meta.url).href

// 表单数据
const form = reactive({
  avatar: '',
  nickname: '',
  bio: '',

  gender: '',
  zodiac_sign: '',
  mbti: '',
  education: '',
  major: '',
  interests: [],
  avatarBlob: null // 存储裁剪后的图片blob
})

// 兴趣爱好相关
const newInterest = ref('')

// 用于mention功能的用户数据
const mentionUsers = ref([
  { id: 1, user_id: 'user001', username: 'alice', nickname: '爱丽丝', avatar: 'https://picsum.photos/40/40?random=1' },
  { id: 2, user_id: 'user002', username: 'bob', nickname: '鲍勃', avatar: 'https://picsum.photos/40/40?random=2' },
  { id: 3, user_id: 'user003', username: 'charlie', nickname: '查理', avatar: 'https://picsum.photos/40/40?random=3' },
  { id: 4, user_id: 'user004', username: 'diana', nickname: '戴安娜', avatar: 'https://picsum.photos/40/40?random=4' },
  { id: 5, user_id: 'user005', username: 'eve', nickname: '夏娃', avatar: 'https://picsum.photos/40/40?random=5' }
])

// 头像上传相关
const fileInput = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const avatarError = ref('')
const saving = ref(false)

// 选项数据
const genderOptions = [
  { value: '', label: '暂不设置' },
  { value: '男', label: '男' },
  { value: '女', label: '女' }
]

const zodiacOptions = [
  { value: '', label: '暂不设置' },
  { value: '白羊座', label: '白羊座' },
  { value: '金牛座', label: '金牛座' },
  { value: '双子座', label: '双子座' },
  { value: '巨蟹座', label: '巨蟹座' },
  { value: '狮子座', label: '狮子座' },
  { value: '处女座', label: '处女座' },
  { value: '天秤座', label: '天秤座' },
  { value: '天蝎座', label: '天蝎座' },
  { value: '射手座', label: '射手座' },
  { value: '摩羯座', label: '摩羯座' },
  { value: '水瓶座', label: '水瓶座' },
  { value: '双鱼座', label: '双鱼座' }
]

const educationOptions = [
  { value: '', label: '暂不设置' },
  { value: '高中及以下', label: '高中及以下' },
  { value: '大专', label: '大专' },
  { value: '本科', label: '本科' },
  { value: '硕士', label: '硕士' },
  { value: '博士', label: '博士' }
]

const mbtiDimensions = [
  {
    key: 'dimension1',
    label: '外向/内向',
    options: [
      { value: 'E', label: 'E' },
      { value: 'I', label: 'I' }
    ]
  },
  {
    key: 'dimension2',
    label: '感觉/直觉',
    options: [
      { value: 'S', label: 'S' },
      { value: 'N', label: 'N' }
    ]
  },
  {
    key: 'dimension3',
    label: '思考/情感',
    options: [
      { value: 'T', label: 'T' },
      { value: 'F', label: 'F' }
    ]
  },
  {
    key: 'dimension4',
    label: '判断/知觉',
    options: [
      { value: 'J', label: 'J' },
      { value: 'P', label: 'P' }
    ]
  }
]

// 裁剪相关
const showCropModal = ref(false)
const cropImageSrc = ref('')
const cropImage = ref(null)
const cropper = ref(null)

// 表情相关
const showEmojiPanel = ref(false)
const bioTextarea = ref(null)

// handleBioInput函数的功能已经被ContentEditableInput组件封装

// mention相关
const showMentionPanel = ref(false)
const currentMentionField = ref('')

// 监听visible变化，初始化表单数据
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 锁定滚动
    lock()

    // 初始化表单数据
    form.avatar = props.userInfo.avatar || defaultAvatar
    form.nickname = props.userInfo.nickname || ''
    form.bio = props.userInfo.bio || ''

    form.gender = props.userInfo.gender || ''
    form.zodiac_sign = props.userInfo.zodiac_sign || ''
    form.mbti = props.userInfo.mbti || ''
    form.education = props.userInfo.education || ''
    form.major = props.userInfo.major || ''
    // 处理兴趣爱好：支持JSON字符串、逗号分隔字符串和数组格式
    const interests = props.userInfo.interests || ''
    if (typeof interests === 'string') {
      if (interests.trim()) {
        try {
          // 尝试解析为JSON数组
          const parsed = JSON.parse(interests)
          form.interests = Array.isArray(parsed) ? parsed : []
        } catch {
          // 如果不是JSON格式，按逗号分割
          form.interests = interests.split(',').map(item => item.trim()).filter(item => item)
        }
      } else {
        form.interests = []
      }
    } else if (Array.isArray(interests)) {
      form.interests = [...interests]
    } else {
      form.interests = []
    }

    avatarError.value = ''
    newInterest.value = ''
  } else {
    // 解锁滚动
    unlock()
  }
})

// 监听裁剪模态框显示状态
watch(showCropModal, (newValue) => {
  if (!newValue && cropper.value) {
    cropper.value.destroy()
    cropper.value = null
  }
})

// 监听个人简介字数，限制在200字符内
watch(() => form.bio, (newValue) => {
  if (newValue && newValue.length > 200) {
    // 截断到200字符
    form.bio = newValue.substring(0, 200)
    // 如果有ContentEditableInput组件引用，同步更新其内容
    if (bioTextarea.value && bioTextarea.value.$el) {
      nextTick(() => {
        bioTextarea.value.$el.innerHTML = form.bio
      })
    }
  }
})

// 头像上传相关方法
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
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0) {
    showCropDialog(files[0])
  }
}

const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024

  if (!validTypes.includes(file.type)) {
    const errorMsg = '不填有效的图片格式 (JPEG, PNG, GIF, WebP)'
    avatarError.value = errorMsg
    $message.error(errorMsg)
    return false
  }

  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
    const errorMsg = `图片大小为 ${fileSizeMB}MB，超过 5MB 限制，不填更小的图片`

    avatarError.value = '图片大小不能超过 5MB'
    $message.error(errorMsg)
    return false
  }

  return true
}

const showCropDialog = async (file) => {
  if (!validateFile(file)) {
    return
  }

  avatarError.value = ''

  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      cropImageSrc.value = e.target.result
      showCropModal.value = true

      nextTick(() => {
        if (cropImage.value) {
          cropper.value = new Cropper(cropImage.value, {
            aspectRatio: 1,
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
      })
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('文件读取失败:', error)
    avatarError.value = '文件读取失败，请重试'
  }
}

const closeCropModal = () => {
  showCropModal.value = false
  cropImageSrc.value = ''
  if (cropper.value) {
    cropper.value.destroy()
    cropper.value = null
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const confirmCrop = async () => {
  if (!cropper.value) return

  uploading.value = true
  avatarError.value = ''

  try {
    const canvas = cropper.value.getCroppedCanvas({
      width: 300,
      height: 300,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })

    canvas.toBlob((blob) => {
      uploadCroppedImage(blob)
    }, 'image/png', 0.9)
  } catch (error) {
    console.error('裁剪失败:', error)
    avatarError.value = '裁剪失败，请重试'
    uploading.value = false
  }
}

const uploadCroppedImage = async (blob) => {
  try {
    // 将裁剪后的图片转换为base64，暂存在form中
    const reader = new FileReader()
    reader.onload = (e) => {
      form.avatar = e.target.result
      form.avatarBlob = blob // 保存blob用于后续上传
      closeCropModal()
      uploading.value = false
    }
    reader.readAsDataURL(blob)
  } catch (error) {
    console.error('处理图片失败:', error)
    avatarError.value = '处理图片失败，请重试'
    uploading.value = false
  }
}

// 表情相关方法
const toggleEmojiPanel = () => {
  showEmojiPanel.value = !showEmojiPanel.value
}

const closeEmojiPanel = () => {
  showEmojiPanel.value = false
}

// mention相关方法
const toggleMentionPanel = () => {
  // 如果要打开面板，先插入@符号
  if (!showMentionPanel.value && bioTextarea.value && bioTextarea.value.insertAtSymbol) {
    bioTextarea.value.insertAtSymbol()
  }
  showMentionPanel.value = !showMentionPanel.value
  currentMentionField.value = 'bio'
}

const closeMentionPanel = () => {
  showMentionPanel.value = false
  currentMentionField.value = ''
}

const handleMentionSelect = (friend) => {
  // 调用ContentEditableInput组件的selectMentionUser方法
  if (bioTextarea.value && bioTextarea.value.selectMentionUser) {
    bioTextarea.value.selectMentionUser(friend)
  }
  closeMentionPanel()
}

// 处理@符号输入触发提及面板
const handleMentionInput = () => {
  if (!showMentionPanel.value) {
    showMentionPanel.value = true
    currentMentionField.value = 'bio'
  }
}

// 处理键盘事件，实现mention链接整体删除
const handleInputKeydown = (event) => {
  if (event.key === 'Backspace') {
    // 处理mention链接的整体删除
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = range.startContainer

      // 检查光标是否在mention链接之后
      if (container.nodeType === Node.TEXT_NODE && container.previousSibling) {
        const prevElement = container.previousSibling
        if (prevElement.nodeType === Node.ELEMENT_NODE &&
          prevElement.tagName === 'A' &&
          prevElement.classList.contains('mention-link')) {
          // 如果光标在mention链接后的文本节点开始位置
          if (range.startOffset === 0) {
            event.preventDefault()
            // 删除整个mention链接
            prevElement.remove()
            // 更新form.bio的值
            form.bio = event.target.innerHTML

            // 重新设置光标位置
            nextTick(() => {
              const newRange = document.createRange()
              const newSelection = window.getSelection()
              if (container.textContent.length > 0) {
                newRange.setStart(container, 0)
                newRange.setEnd(container, 0)
              } else {
                newRange.selectNodeContents(event.target)
                newRange.collapse(false)
              }
              newSelection.removeAllRanges()
              newSelection.addRange(newRange)
            })
          }
        }
      }
    }
  }
}

const handleEmojiSelect = (emoji) => {
  const emojiChar = emoji.i
  const inputElement = bioTextarea.value

  if (inputElement && inputElement.insertEmoji) {
    // 使用ContentEditableInput组件的insertEmoji方法
    inputElement.insertEmoji(emojiChar)
  } else {
    // 备用方案：直接添加到末尾
    form.bio += emojiChar
    nextTick(() => {
      if (bioTextarea.value) {
        bioTextarea.value.focus()
      }
    })
  }

  closeEmojiPanel()
}

// 兴趣爱好相关方法
const addInterest = () => {
  const interest = newInterest.value.trim()
  if (interest && interest.length <= 8 && !form.interests.includes(interest) && form.interests.length < 5) {
    form.interests.push(interest)
    newInterest.value = ''
  }
}

const removeInterest = (index) => {
  form.interests.splice(index, 1)
}

// 模态框操作
const handleClose = () => {
  emit('update:visible', false)
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

const handleSave = async () => {
  if (!form.nickname.trim()) {
    console.error('请输入昵称')
    return
  }

  // 对个人简介进行安全过滤
  const sanitizedBio = sanitizeContent(form.bio)

  if (sanitizedBio.length > 200) {
    console.error('个人简介不能超过200字符')
    return
  }

  saving.value = true

  try {
    const formData = { ...form }
    formData.bio = sanitizedBio
    delete formData.avatarBlob
    delete formData.location
    if (form.avatarBlob) {
      uploadProgress.value = 0
      uploading.value = true

      try {
        const result = await imageUploadApi.uploadCroppedImage(form.avatarBlob, {
          filename: 'avatar.png'
        })

        if (result.success) {
          formData.avatar = result.data.url
          console.log('头像上传成功:', result.data.url)
        } else {
          console.error('头像上传失败:', result.message)
          avatarError.value = result.message || '头像上传失败，请重试'
          return
        }
      } catch (error) {
        console.error('头像上传异常:', error)
        avatarError.value = '头像上传失败，请重试'
        return
      } finally {
        uploading.value = false
        uploadProgress.value = 0
      }
    }

    // 触发保存事件并等待父组件处理完成
    emit('save', formData)
    console.log('资料更新成功')

    // 显示成功提示
    $message.success('资料更新成功')

    // 延迟关闭模态框，确保数据已更新
    setTimeout(() => {
      handleClose()
    }, 100)
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
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

.crop-modal {
  max-width: 600px;
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

.close-btn:hover {
  color: var(--text-color-primary);
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

/* 表单样式 */
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
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
  background-color: var(--bg-color-primary);
  color: var(--text-color-primary);
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group .content-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-group textarea,
.form-group .content-textarea {
  resize: vertical;
  min-height: 100px;
}

.content-textarea {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color-primary);
  background-color: var(--bg-color-secondary);
  box-sizing: border-box;
  caret-color: var(--primary-color);
}

.content-textarea:empty:before {
  content: attr(data-placeholder);
  color: var(--text-color-secondary);
  pointer-events: none;
}

.form-group .form-label {
  color: var(--text-color-primary);
}

/* ContentEditableInput样式 */
.bio-input-wrapper {
  position: relative;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-primary);
  transition: all 0.2s ease;
}

.bio-input-wrapper:focus-within {
  border-color: var(--primary-color);
}

.bio-input-wrapper :deep(.content-textarea) {
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

}

.bio-input-wrapper :deep(.content-textarea:focus) {
  outline: none;
}

.bio-input-wrapper :deep(.mention-link) {
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

.bio-input-wrapper :deep(.mention-link:hover) {
  color: var(--text-color-tag);
  opacity: 0.8;
}

.bio-input-wrapper :deep(.mention-link:active) {
  color: var(--text-color-tag);
  opacity: 0.6;
}

.bio-actions {
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

.char-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  background: var(--bg-color-primary);
  padding: 0.25rem;
  border-radius: 4px;
}



/* 兴趣爱好样式 */
.interests-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.remove-tag-btn {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  margin-left: 2px;
}

.remove-tag-btn:hover {
  color: var(--primary-color);
}

.add-interest {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-interest input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 4px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  font-size: 14px;
  caret-color: var(--primary-color);
}

.add-btn {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  background-color: var(--primary-color-dark);
}

.add-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.interest-hint {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 4px;
  text-align: right;
}


/* 头像上传样式 */
.avatar-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-upload-area {
  position: relative;
  width: 120px;
  height: 120px;
  border: 2px dashed #ddd;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;
}

.avatar-upload-area:hover {
  border-color: var(--primary-color);
}

.avatar-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.overlay-icon {
  position: absolute;
  opacity: 0;
  color: #dee2e6;
  transition: all 0.3s ease;
}

.avatar-upload-area:hover .overlay-icon {
  opacity: 1;
  transform: scale(1.2);
}

.avatar-upload-area:hover .avatar-image {
  filter: brightness(0.6);
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.progress-bar {
  width: 80px;
  height: 4px;
  background-color: #f3f3f3;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
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




/* 裁剪模态框样式 */
.crop-container {
  max-height: 400px;
  overflow: hidden;
  text-align: center;
}

.crop-container img {
  max-width: 100%;
  max-height: 400px;
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

@media (max-width: 480px) {
  .mbti-selector {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .add-interest {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    align-self: flex-end;
    width: fit-content;
  }

}
</style>