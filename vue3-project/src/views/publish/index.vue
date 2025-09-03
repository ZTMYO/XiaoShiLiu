<template>
  <div class="publish-container">
    <div class="publish-header">
      <div class="header-left">

        <h1 class="page-title">发布笔记</h1>
      </div>
      <div class="header-right">
        <button class="draft-box-btn" @click="goToDraftBox">
          <SvgIcon name="draft" width="20" height="20" color="white" />
          <span>草稿箱</span>
        </button>
        <button class="manage-btn" @click="goToPostManagement">
          <SvgIcon name="note" width="20" height="20" />
          <span>笔记管理</span>
        </button>
      </div>
    </div>

    <div class="publish-content">
      <form @submit.prevent="handlePublish" class="publish-form">
        <div class="image-upload-section">
          <MultiImageUpload ref="multiImageUploadRef" v-model="form.images" :max-images="9" :allow-delete-last="true"
            @error="handleUploadError" />
        </div>

        <div class="input-section">
          <input v-model="form.title" type="text" class="title-input" placeholder="请输入标题" maxlength="100"
            @input="validateForm" />
          <div class="char-count">{{ form.title.length }}/100</div>
        </div>

        <div class="input-section">
          <div class="content-input-wrapper">
            <ContentEditableInput ref="contentTextarea" v-model="form.content" :input-class="'content-textarea'"
              placeholder="填写更全面的描述信息，让更多的人看到你吧!" :enable-mention="true" :mention-users="mentionUsers"
              @focus="handleContentFocus" @blur="handleContentBlur" @keydown="handleInputKeydown"
              @mention="handleMentionInput" />
            <div class="content-actions">
              <button type="button" class="mention-btn" @click="toggleMentionPanel">
                <SvgIcon name="mention" class="mention-icon" width="20" height="20" />
              </button>
              <button type="button" class="emoji-btn" @click="toggleEmojiPanel">
                <SvgIcon name="emoji" class="emoji-icon" width="20" height="20" />
              </button>
            </div>
          </div>
          <div class="char-count">{{ form.content.length }}/2000</div>

          <div v-if="showEmojiPanel" class="emoji-panel-overlay" v-click-outside="closeEmojiPanel">
            <div class="emoji-panel" @click.stop>
              <EmojiPicker @select="handleEmojiSelect" />
            </div>
          </div>

          <MentionModal :visible="showMentionPanel" @close="closeMentionPanel" @select="handleMentionSelect" />
        </div>

        <div class="category-section">
          <div class="section-title">分类</div>
          <DropdownSelect v-model="form.category" :options="categories" placeholder="请选择分类" label-key="name"
            value-key="id" max-width="300px" min-width="200px" @change="handleCategoryChange" />
        </div>

        <div class="tag-section">
          <div class="section-title">标签 (最多10个)</div>
          <TagSelector v-model="form.tags" :max-tags="10" />
        </div>
      </form>

      <div class="publish-actions">
        <button class="draft-btn" :disabled="!canSaveDraft || isSavingDraft" @click="handleSaveDraft">
          {{ isSavingDraft ? '保存中...' : '存草稿' }}
        </button>
        <button class="publish-btn" :disabled="!canPublish || isPublishing" @click="handlePublish">
          {{ isPublishing ? '发布中...' : '发布' }}
        </button>
      </div>
    </div>

    <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNavigationStore } from '@/stores/navigation'
import { createPost, getPostDetail, updatePost, deletePost } from '@/api/posts'
import { useScrollLock } from '@/composables/useScrollLock'
import { hasMentions, cleanMentions } from '@/utils/mentionParser'

import MultiImageUpload from '@/components/MultiImageUpload.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import TagSelector from '@/components/TagSelector.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import MessageToast from '@/components/MessageToast.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import MentionModal from '@/components/mention/MentionModal.vue'
import ContentEditableInput from '@/components/ContentEditableInput.vue'

const router = useRouter()
const route = useRoute()
const navigationStore = useNavigationStore()
const { lock, unlock } = useScrollLock()

const multiImageUploadRef = ref(null)
const contentTextarea = ref(null)

const isPublishing = ref(false)
const isSavingDraft = ref(false)
const showEmojiPanel = ref(false)
const showMentionPanel = ref(false)
const isContentFocused = ref(false)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const form = reactive({
  title: '',
  content: '',
  images: [],
  tags: [],
  category: ''
})

// 草稿相关状态
const currentDraftId = ref(null)
const isEditMode = ref(false)

const categories = ref([])

// 提及用户数据（实际使用中应该从 API 获取）
const mentionUsers = ref([])

const canPublish = computed(() => {
  return form.title.trim() &&
    form.content.trim() &&
    form.images.length > 0 &&
    form.category &&
    form.category !== 'general'
})

const canSaveDraft = computed(() => {
  return form.images.length > 0
})

onMounted(async () => {
  navigationStore.scrollToTop('instant')
  loadCategories()

  // 检查是否是编辑草稿模式
  const draftId = route.query.draftId
  const mode = route.query.mode

  if (draftId && mode === 'edit') {
    await loadDraftData(draftId)
  }
})

onUnmounted(() => {
})

const loadCategories = () => {
  categories.value = [
    { id: 'study', name: '学习' },
    { id: 'campus', name: '校园' },
    { id: 'emotion', name: '情感' },
    { id: 'interest', name: '兴趣' },
    { id: 'life', name: '生活' },
    { id: 'social', name: '社交' },
    { id: 'help', name: '求助' },
    { id: 'opinion', name: '观点' },
    { id: 'graduation', name: '毕业' },
    { id: 'career', name: '职场' }
  ]
}

const validateForm = () => {
  return true
}

const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

const handleToastClose = () => {
  showToast.value = false
}

const handleBack = () => {
  router.back()
}

// 跳转到笔记管理页面
const goToPostManagement = () => {
  router.push('/post-management')
}

// 跳转到草稿箱页面
const goToDraftBox = () => {
  router.push('/draft-box')
}

const handleUploadError = (error) => {
  showMessage(error, 'error')
}

const handleCategoryChange = (data) => {
  form.category = data.value
}

const handleContentFocus = () => {
  isContentFocused.value = true
}

const handleContentBlur = () => {
  setTimeout(() => {
    isContentFocused.value = false
  }, 100)
}

const toggleEmojiPanel = () => {
  if (showEmojiPanel.value) {
    closeEmojiPanel()
  } else {
    showEmojiPanel.value = true
    lock()
  }
}

const closeEmojiPanel = () => {
  showEmojiPanel.value = false
  unlock()
}

const toggleMentionPanel = () => {
  // 如果要打开面板，先插入@符号
  if (!showMentionPanel.value && contentTextarea.value && contentTextarea.value.insertAtSymbol) {
    contentTextarea.value.insertAtSymbol()
  }
  showMentionPanel.value = !showMentionPanel.value
}

const closeMentionPanel = () => {
  showMentionPanel.value = false
  unlock()
}

// 处理@符号输入事件
const handleMentionInput = () => {
  // 当用户输入@符号时，自动打开mention面板
  if (!showMentionPanel.value) {
    showMentionPanel.value = true
  }
}

// 处理表情选择
const handleEmojiSelect = (emoji) => {
  const emojiChar = emoji.i
  const inputElement = contentTextarea.value

  if (inputElement && inputElement.insertEmoji) {
    // 使用ContentEditableInput组件的insertEmoji方法
    inputElement.insertEmoji(emojiChar)
  } else {
    // 备用方案：直接添加到末尾
    form.content += emojiChar
    nextTick(() => {
      if (inputElement) {
        inputElement.focus()
      }
    })
  }

  closeEmojiPanel()
}

// 处理好友选择
const handleMentionSelect = (friend) => {
  // 调用ContentEditableInput组件的selectMentionUser方法
  if (contentTextarea.value && contentTextarea.value.selectMentionUser) {
    contentTextarea.value.selectMentionUser(friend)
  }

  // 关闭mention面板
  closeMentionPanel()
}

// 处理contenteditable输入事件
// handleContentInput函数已移至ContentEditableInput组件中

// 处理键盘事件，实现mention标签整体删除
const handleInputKeydown = (event) => {
  if (event.key === 'Backspace') {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)

      // 如果没有选中内容且光标在mention链接后面
      if (range.collapsed) {
        const container = range.startContainer
        const offset = range.startOffset

        // 检查光标前面的节点是否是mention链接
        let prevNode = null
        if (container.nodeType === Node.TEXT_NODE && offset === 0) {
          prevNode = container.previousSibling
        } else if (container.nodeType === Node.ELEMENT_NODE && offset > 0) {
          prevNode = container.childNodes[offset - 1]
        }

        // 如果前面的节点是mention链接，删除整个链接
        if (prevNode && prevNode.nodeType === Node.ELEMENT_NODE &&
          prevNode.classList && prevNode.classList.contains('mention-link')) {
          event.preventDefault()
          prevNode.remove()

          // 更新form.content
          form.content = event.target.innerHTML
          return
        }
      }
    }
  }
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

const handlePublish = async () => {
  // 使用与canPublish相同的验证逻辑
  if (!form.title.trim()) {
    showMessage('请输入标题', 'error')
    return
  }

  if (!form.content.trim()) {
    showMessage('请输入内容', 'error')
    return
  }

  if (form.images.length === 0) {
    showMessage('请至少上传一张图片', 'error')
    return
  }

  if (!form.category || form.category === '未知分类') {
    showMessage('请选择分类', 'error')
    return
  }

  const imageComponent = multiImageUploadRef.value
  if (!imageComponent) {
    showMessage('图片组件未初始化', 'error')
    return
  }

  isPublishing.value = true

  try {
    // 处理图片上传
    if (imageComponent.getImageCount() > 0) {
      showMessage('正在上传图片...', 'info')
      const uploadedImages = await imageComponent.uploadAllImages()

      if (uploadedImages.length === 0) {
        showMessage('图片上传失败', 'error')
        return
      }

      form.images = uploadedImages
    }

    // 对内容进行安全过滤
    const sanitizedContent = sanitizeContent(form.content)

    const postData = {
      title: form.title.trim(),
      content: sanitizedContent,
      images: form.images,
      tags: form.tags,
      category: form.category,
      is_draft: false // 发布状态
    }

    showMessage('正在发布笔记...', 'info')

    let response
    if (isEditMode.value && currentDraftId.value) {
      response = await updatePost(currentDraftId.value, postData)
    } else {
      // 普通发布
      response = await createPost(postData)
    }

    if (response.success) {
      showMessage('发布成功！', 'success')
      form.title = ''
      form.content = ''
      form.images = []
      form.tags = []
      form.category = ''
      imageComponent.reset()

      setTimeout(() => {
        router.push('/post-management')
      }, 1500)
    } else {
      showMessage(response.message || '发布失败', 'error')
    }
  } catch (err) {
    console.error('发布失败:', err)
    showMessage('发布失败，请重试', 'error')
  } finally {
    isPublishing.value = false
  }
}

// 加载草稿数据
const loadDraftData = async (draftId) => {
  try {
    const response = await getPostDetail(draftId)
    if (response && response.originalData) {
      const draft = response.originalData

      // 初始化表单数据
      form.title = response.title || ''
      form.content = draft.content || ''
      form.images = draft.images || []
      form.tags = draft.tags || []
      form.category = response.category || ''

      // 设置编辑模式
      currentDraftId.value = draftId
      isEditMode.value = true

      // 初始化图片组件
      if (form.images.length > 0 && multiImageUploadRef.value) {
        await nextTick()
        // 将图片数据转换为URL字符串数组
        const imageUrls = form.images.map(img => {
          if (typeof img === 'string') {
            return img
          } else if (img && img.url) {
            return img.url
          } else if (img && img.preview) {
            return img.preview
          }
          return null
        }).filter(url => url)
        multiImageUploadRef.value.syncWithUrls(imageUrls)
      }

      showMessage('草稿加载成功', 'success')
    } else {
      showMessage('草稿不存在或已被删除', 'error')
      router.push('/draft-box')
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
    showMessage('加载草稿失败', 'error')
    router.push('/draft-box')
  }
}

const handleSaveDraft = async () => {
  if (form.images.length === 0) {
    showMessage('请至少上传一张图片', 'error')
    return
  }

  isSavingDraft.value = true

  try {
    // 如果有图片，先上传图片
    let uploadedImages = []
    const imageComponent = multiImageUploadRef.value
    if (imageComponent && imageComponent.getImageCount() > 0) {
      showMessage('正在上传图片...', 'info')
      uploadedImages = await imageComponent.uploadAllImages()
      form.images = uploadedImages
    }

    // 对内容进行安全过滤
    const rawContent = form.content || ''
    const sanitizedContent = sanitizeContent(rawContent)

    const draftData = {
      title: form.title.trim() || '',
      content: sanitizedContent,
      images: uploadedImages,
      tags: form.tags || [],
      category: form.category || '',
      is_draft: true
    }

    showMessage('正在保存草稿...', 'info')

    let response
    if (isEditMode.value && currentDraftId.value) {
      // 更新现有草稿
      response = await updatePost(currentDraftId.value, draftData)
    } else {
      // 创建新草稿
      response = await createPost(draftData)
      if (response.success && response.data) {
        currentDraftId.value = response.data.id
        isEditMode.value = true
      }
    }

    if (response.success) {
      showMessage('草稿保存成功！', 'success')

      // 清空表单
      form.title = ''
      form.content = ''
      form.images = []
      form.tags = []
      form.category = ''

      // 重置编辑状态（在跳转前重置，避免影响当前保存逻辑）
      const shouldResetEditState = true
      if (shouldResetEditState) {
        currentDraftId.value = null
        isEditMode.value = false
      }

      // 重置图片组件
      const imageComponent = multiImageUploadRef.value
      if (imageComponent) {
        imageComponent.reset()
      }

      // 跳转到草稿箱页面
      setTimeout(() => {
        router.push('/draft-box')
      }, 1500)
    } else {
      showMessage(response.message || '草稿保存失败', 'error')
    }
  } catch (err) {
    console.error('草稿保存失败:', err)
    showMessage('草稿保存失败，请重试', 'error')
  } finally {
    isSavingDraft.value = false
  }
}
</script>

<style scoped>
.publish-container {
  min-height: 100vh;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  margin-top: 72px;
  transition: background 0.2s ease;

}

.publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-color-primary);
  border-bottom: 1px solid var(--border-color-primary);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.draft-box-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.draft-box-btn:hover {
  background: var(--primary-color-dark);
}

.manage-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.manage-btn:hover {
  background: var(--primary-color-dark);
}

.page-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.draft-btn {
  width: 20%;
  padding: 12px;
  background-color: var(--text-color-secondary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.draft-btn:hover:not(:disabled) {
  background: var(--text-color-primary);
}

.draft-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.publish-btn {
  width: 20%;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.publish-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.publish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-icon {
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

.publish-content {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.publish-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image-upload-section {
  margin-bottom: 0.5rem;
}

.input-section {
  position: relative;
}

.title-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.title-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.title-input::placeholder {
  color: var(--text-color-secondary);
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

.content-textarea {
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

.content-textarea:focus {
  outline: none;
}

.content-textarea:empty:before {
  content: attr(data-placeholder);
  color: var(--text-color-secondary);
  pointer-events: none;
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
  color: var(--text-color-secondary);
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
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.emoji-panel {
  background: var(--bg-color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: scaleIn 0.2s ease;
  max-width: 90vw;
  max-height: 80vh;
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

.char-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  background: var(--bg-color-primary);
  padding: 0.25rem;
  transition: background-color 0.2s ease;
}


.section-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color-primary);
  margin-bottom: 0.75rem;
}

.tag-input-wrapper {
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-primary);
  padding: 0.75rem;
  transition: border-color 0.2s ease;
}

.tag-input-wrapper:focus-within {
  border-color: var(--primary-color);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.6rem;
  background: var(--primary-color);
  color: #fff;
  border-radius: 16px;
  font-size: 0.8rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.remove-tag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  line-height: 1;
}

.remove-tag-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.tag-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-color-primary);
  font-size: 0.9rem;
  outline: none;
  padding: 0.25rem 0;
}

.tag-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-input::placeholder {
  color: var(--text-color-secondary);
}

.add-tag-btn {
  padding: 0.25rem 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-tag-btn:hover {
  background: var(--primary-color-dark);
}

.tag-suggestions {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-color-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color-primary);
}

.suggestions-title {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-suggestion {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--border-color-primary);
  border-radius: 16px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-suggestion:hover {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.recommended-tags {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-color-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color-primary);
}

.recommendations-title {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--border-color-primary);
  border-radius: 16px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-item:hover {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.tag-item.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.category-section {
  margin-bottom: 1rem;
}



.publish-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1rem;
  margin-top: 2rem;
  background: var(--bg-color-primary);
}

.publish-actions .cancel-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}



.publish-actions .loading-icon {
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



/* 响应式设计 */
@media (max-width: 768px) {
  .publish-header {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.1rem;
  }



  .publish-content {
    padding: 0.75rem;
  }

  .tag-input {
    min-width: 80px;
  }

  .publish-actions {
    padding: 1.5rem 0.75rem;
    gap: 0.75rem;
  }

  .publish-actions .cancel-btn,
  .publish-actions .publish-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.85rem;
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .publish-header {
    padding: 0.5rem;
  }

  .page-title {
    font-size: 1rem;
  }

  .header-actions {
    gap: 0.5rem;
  }

  .cancel-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .draft-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .publish-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .publish-content {
    padding: 0.5rem;
  }


  .tag-input {
    min-width: 60px;
    font-size: 0.85rem;
  }

  .publish-actions {
    padding: 1rem 0.5rem;
    gap: 0.5rem;
    flex-direction: column;
  }

  .publish-actions .cancel-btn,
  .publish-actions .draft-btn,
  .publish-actions .publish-btn {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.9rem;
    min-width: unset;
  }
}
</style>