<template>
  <div ref="inputRef" :class="inputClass" contenteditable="true" @input="handleInput" @focus="handleFocus"
    @blur="handleBlur" @keydown="handleKeydown" @click="handleClick" @paste="handlePaste" :placeholder="placeholder">
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { parseMentions } from '@/utils/mentionParser'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  inputClass: {
    type: String,
    default: ''
  },
  maxLength: {
    type: Number,
    default: null
  },
  enableMention: {
    type: Boolean,
    default: false
  },
  mentionUsers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'keydown', 'mention'])

const inputRef = ref(null)
const isUserTyping = ref(false)
const cursorMarkerId = ref(null)

const ensureMentionLinksNonEditable = () => {
  if (!inputRef.value) return
  const mentionLinks = inputRef.value.querySelectorAll('.mention-link')
  mentionLinks.forEach(link => {
    link.contentEditable = false
  })
}

const updateHtmlContent = (content) => {
  if (!inputRef.value) return
  const htmlContent = parseMentions(content || '')
  if (inputRef.value.innerHTML !== htmlContent) {
    inputRef.value.innerHTML = htmlContent
    nextTick(ensureMentionLinksNonEditable)
  }
}

watch(() => props.modelValue, (newValue) => {
  if (!isUserTyping.value) {
    updateHtmlContent(newValue)
  }
})

onMounted(() => {
  updateHtmlContent(props.modelValue)
})

const sanitizeContent = (content) => {
  if (!content) return ''
  return content.replace(/<[^>]*>/g, '')
}

// 将HTML格式的mention链接转换为[@nickname:user_id]格式
const convertMentionLinksToText = (html) => {
  if (!html) return ''

  // 创建临时div来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // 查找所有mention链接并替换
  const mentionLinks = tempDiv.querySelectorAll('.mention-link')
  mentionLinks.forEach(link => {
    const userId = link.getAttribute('data-user-id')
    const nickname = link.textContent.replace('@', '')
    const mentionText = document.createTextNode(`[@${nickname}:${userId}]`)
    link.parentNode.replaceChild(mentionText, link)
  })

  // 过滤HTML标签
  return sanitizeContent(tempDiv.innerHTML)
}

// 处理输入事件
const handleInput = (event) => {
  isUserTyping.value = true

  let content = event.target.innerHTML

  // 如果内容为空，清空innerHTML以显示placeholder
  if (!content.trim() || content === '<br>' || content === '<div><br></div>') {
    content = ''
    event.target.innerHTML = content
  }

  if (props.enableMention && event.inputType === 'insertText' && event.data === '@') {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = range.startContainer
      if (container.nodeType === Node.TEXT_NODE) {
        const text = container.textContent
        const atIndex = text.lastIndexOf('@')

        if (atIndex !== -1) {
          const timestamp = Date.now()
          const atSymbol = document.createElement('span')
          atSymbol.setAttribute('data-at-marker', timestamp)
          atSymbol.textContent = '@'
      

          const beforeText = text.substring(0, atIndex)
          const afterText = text.substring(atIndex + 1)
          const beforeNode = beforeText ? document.createTextNode(beforeText) : null
          const afterNode = afterText ? document.createTextNode(afterText) : null

          const parent = container.parentNode
          if (beforeNode) parent.insertBefore(beforeNode, container)
          parent.insertBefore(atSymbol, container)
          if (afterNode) parent.insertBefore(afterNode, container)
          parent.removeChild(container)

          const newRange = document.createRange()
          newRange.setStartAfter(atSymbol)
          newRange.setEndAfter(atSymbol)
          selection.removeAllRanges()
          selection.addRange(newRange)
          content = event.target.innerHTML
        }
      }
    }

    nextTick(() => {
      emit('mention')
    })
  }

  ensureMentionLinksNonEditable()
  const textContent = convertMentionLinksToText(content)
  emit('update:modelValue', textContent)
  resetUserTypingFlag()
}

// 处理焦点事件
const handleFocus = (event) => {
  // 清理所有旧的光标标记节点，避免重复创建
  if (inputRef.value) {
    const oldMarkers = inputRef.value.querySelectorAll('span[data-cursor-marker]')
    oldMarkers.forEach(marker => marker.remove())
    cursorMarkerId.value = null
  }
  
  emit('focus', event)
}

const handleBlur = (event) => {
  // 检查输入框是否有实际内容
  const hasContent = inputRef.value && inputRef.value.textContent.trim().length > 0
  
  if (hasContent) {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      
      // 创建隐藏的标记节点
      const markerId = 'cursor-marker-' + Date.now()
      const marker = document.createElement('span')
      marker.id = markerId
      marker.style.display = 'none'
      marker.setAttribute('data-cursor-marker', 'true')
      
      // 在光标位置插入标记节点
      try {
        range.insertNode(marker)
        cursorMarkerId.value = markerId
      } catch (e) {
        // 插入失败时清空标记ID
        cursorMarkerId.value = null
      }
    } else {
      cursorMarkerId.value = null
    }
  } else {
    // 空内容时不创建标记，保持placeholder显示
    cursorMarkerId.value = null
  }
  
  emit('blur', event)
}

const handleClick = (event) => {
  const target = event.target
  if (target.classList.contains('mention-link')) {
    event.preventDefault()
    const userId = target.getAttribute('data-user-id')
    if (userId) {
      const userUrl = `${window.location.origin}/user/${userId}`
      window.open(userUrl, '_blank')
    }
  }
}

const removeMentionLink = (linkElement) => {
  if (linkElement && linkElement.classList && linkElement.classList.contains('mention-link')) {
    linkElement.remove()
    const textContent = convertMentionLinksToText(inputRef.value.innerHTML)
    emit('update:modelValue', textContent)
    return true
  }
  return false
}

const handleKeydown = (event) => {
  if (event.key === 'Backspace') {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (range.collapsed) {
        if (range.startContainer.nodeType === Node.TEXT_NODE &&
          range.startOffset === range.startContainer.textContent.length) {
          const textNode = range.startContainer
          const nextSibling = textNode.nextSibling
          if (removeMentionLink(nextSibling)) {
            event.preventDefault()
            return
          }
        }

        if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
          const textNode = range.startContainer
          const prevSibling = textNode.previousSibling
          if (removeMentionLink(prevSibling)) {
            event.preventDefault()
            return
          }
        }

        if (range.startContainer.parentNode &&
          range.startContainer.parentNode.classList &&
          range.startContainer.parentNode.classList.contains('mention-link')) {
          if (removeMentionLink(range.startContainer.parentNode)) {
            event.preventDefault()
            return
          }
        }
      }
    }
  }

  if (event.key === 'Delete') {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (range.collapsed) {
        if (range.endContainer.nodeType === Node.TEXT_NODE &&
          range.endOffset === range.endContainer.textContent.length) {
          const textNode = range.endContainer
          const nextSibling = textNode.nextSibling
          if (removeMentionLink(nextSibling)) {
            event.preventDefault()
            return
          }
        }

        if (range.startContainer.parentNode &&
          range.startContainer.parentNode.classList &&
          range.startContainer.parentNode.classList.contains('mention-link')) {
          if (removeMentionLink(range.startContainer.parentNode)) {
            event.preventDefault()
            return
          }
        }
      }
    }
  }

  emit('keydown', event)
}

const handlePaste = (event) => {
  event.preventDefault()
  const clipboardData = event.clipboardData || window.clipboardData
  const pastedText = clipboardData.getData('text/plain')
  if (!pastedText) return

  const sanitizedText = sanitizeContent(pastedText)
  const selection = window.getSelection()
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const textNode = document.createTextNode(sanitizedText)
    range.insertNode(textNode)
    range.setStartAfter(textNode)
    range.setEndAfter(textNode)
    selection.removeAllRanges()
    selection.addRange(range)
    const inputEvent = new Event('input', { bubbles: true })
    inputRef.value.dispatchEvent(inputEvent)
  }
}



const resetUserTypingFlag = () => {
  nextTick(() => {
    // 移除setTimeout，确保插入完成后再重置
    isUserTyping.value = false
  })
}

const createMentionLink = (userId, nickname) => {
  const mentionLink = document.createElement('a')
  mentionLink.href = `/user/${userId}`
  mentionLink.className = 'mention-link'
  mentionLink.setAttribute('data-user-id', userId)
  mentionLink.textContent = `@${nickname}`
  mentionLink.contentEditable = false
  return mentionLink
}

const positionCursorAfterElement = (element) => {
  const selection = window.getSelection()
  const range = document.createRange()
  range.setStartAfter(element)
  range.setEndAfter(element)
  selection.removeAllRanges()
  selection.addRange(range)
}



const insertAtSymbol = () => {
  if (!inputRef.value) return
  
  // 查找标记节点
  if (cursorMarkerId.value) {
    const marker = document.getElementById(cursorMarkerId.value)
    if (marker) {
      // 创建@符号元素
      const timestamp = Date.now()
      const atSymbol = document.createElement('span')
      atSymbol.setAttribute('data-at-marker', timestamp)
      atSymbol.textContent = '@'

      
      // 直接在标记节点位置插入@符号
      marker.parentNode.insertBefore(atSymbol, marker)
      
      // 删除标记节点
      marker.remove()
      cursorMarkerId.value = null
      
      // 设置光标到@符号后面
      const selection = window.getSelection()
      const range = document.createRange()
      range.setStartAfter(atSymbol)
      range.setEndAfter(atSymbol)
      selection.removeAllRanges()
      selection.addRange(range)
      
      emit('update:modelValue', inputRef.value.innerHTML)
      return true
    }
  }
  
  // 如果没有标记节点，回退到原有逻辑（在末尾插入）
  inputRef.value.focus()
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(inputRef.value)
  range.collapse(false)
  
  const timestamp = Date.now()
  const atSymbol = document.createElement('span')
  atSymbol.setAttribute('data-at-marker', timestamp)
  atSymbol.textContent = '@'
  
  range.insertNode(atSymbol)
  range.setStartAfter(atSymbol)
  range.setEndAfter(atSymbol)
  selection.removeAllRanges()
  selection.addRange(range)
  
  emit('update:modelValue', inputRef.value.innerHTML)
  return true
}





// 选择提及用户
const selectMentionUser = (user) => {
  if (!inputRef.value || !user) {
    return
  }

  // 设置用户输入标志，防止watch重新渲染
  isUserTyping.value = true

  const targetUserId = user.user_id || user.id
  const targetNickname = user.nickname || user.username

  // 优先查找最近的@符号span进行替换
  let atMarker = null
  
  // 先查找所有@符号span
  const atMarkers = inputRef.value.querySelectorAll('span[data-at-marker]')
  if (atMarkers.length > 0) {
    // 取最后一个（最近插入的）@符号
    atMarker = atMarkers[atMarkers.length - 1]
  }
  
  if (atMarker) {
    // 创建mention链接并替换@符号
    const mentionLink = createMentionLink(targetUserId, targetNickname)
    atMarker.parentNode.replaceChild(mentionLink, atMarker)
    
    // 设置光标到mention链接后面
    const selection = window.getSelection()
    const range = document.createRange()
    range.setStartAfter(mentionLink)
    range.setEndAfter(mentionLink)
    selection.removeAllRanges()
    selection.addRange(range)
    
    // 触发更新事件
    emit('update:modelValue', convertMentionLinksToText(inputRef.value.innerHTML))
    
    resetUserTypingFlag()
    return
  }
  
  // 如果没有@符号，查找光标标记节点
  if (cursorMarkerId.value) {
    const marker = document.getElementById(cursorMarkerId.value)
    if (marker) {
      // 创建mention链接
      const mentionLink = createMentionLink(targetUserId, targetNickname)
      
      // 直接在标记节点位置插入mention链接
      marker.parentNode.insertBefore(mentionLink, marker)
      
      // 删除标记节点
      marker.remove()
      cursorMarkerId.value = null
      
      // 设置光标到mention链接后面
      const selection = window.getSelection()
      const range = document.createRange()
      range.setStartAfter(mentionLink)
      range.setEndAfter(mentionLink)
      selection.removeAllRanges()
      selection.addRange(range)
      
      // 触发更新事件
      emit('update:modelValue', convertMentionLinksToText(inputRef.value.innerHTML))
      
      resetUserTypingFlag()
      return
    }
  }

  resetUserTypingFlag()
}

// 暴露focus和blur方法给父组件
const focus = () => {
  if (!inputRef.value) return

  inputRef.value.focus()

  // 等待DOM更新后恢复光标位置
  nextTick(() => {
    // 清理所有旧的光标标记节点，避免DOM污染
    const oldMarkers = inputRef.value.querySelectorAll('span[data-cursor-marker]')
    oldMarkers.forEach(marker => {
      if (marker.id !== cursorMarkerId.value) {
        marker.remove()
      }
    })
    
    const selection = window.getSelection()
    selection.removeAllRanges() // 清空现有选区

    if (cursorMarkerId.value) {
      // 查找标记节点
      const marker = document.getElementById(cursorMarkerId.value)
      if (marker) {
        try {
          // 在标记节点位置创建新的Range
          const range = document.createRange()
          range.setStartBefore(marker)
          range.setEndBefore(marker)
          selection.addRange(range)
          
          // 删除标记节点
          marker.remove()
        } catch (e) {
          // 异常处理：删除标记节点并聚焦到末尾
          marker.remove()
          const range = document.createRange()
          range.selectNodeContents(inputRef.value)
          range.collapse(false)
          selection.addRange(range)
        }
        // 清空标记ID
        cursorMarkerId.value = null
      } else {
        // 标记节点不存在，聚焦到末尾
        const range = document.createRange()
        range.selectNodeContents(inputRef.value)
        range.collapse(false)
        selection.addRange(range)
        cursorMarkerId.value = null
      }
    } else {
      // 无标记时，聚焦到末尾
      const range = document.createRange()
      range.selectNodeContents(inputRef.value)
      range.collapse(false)
      selection.addRange(range)
    }
  })
}

const blur = () => {
  if (inputRef.value) {
    inputRef.value.blur()
  }
}
const insertEmoji = (emojiChar) => {
  if (!inputRef.value) return
  isUserTyping.value = true

  // 查找标记节点
  if (cursorMarkerId.value) {
    const marker = document.getElementById(cursorMarkerId.value)
    if (marker) {
      // 直接在标记节点位置插入表情
      const textNode = document.createTextNode(emojiChar)
      marker.parentNode.insertBefore(textNode, marker)
      
      // 删除标记节点
      marker.remove()
      cursorMarkerId.value = null
      
      // 设置光标到表情后面
      const selection = window.getSelection()
      const range = document.createRange()
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      selection.removeAllRanges()
      selection.addRange(range)
      
      // 触发input事件同步内容
      const inputEvent = new Event('input', { bubbles: true })
      inputRef.value.dispatchEvent(inputEvent)
      
      resetUserTypingFlag()
      return
    }
  }
  
  // 如果没有标记节点，回退到原有逻辑（在末尾插入）
  inputRef.value.focus()
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(inputRef.value)
  range.collapse(false)
  
  const textNode = document.createTextNode(emojiChar)
  range.insertNode(textNode)
  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)
  
  const inputEvent = new Event('input', { bubbles: true })
  inputRef.value.dispatchEvent(inputEvent)
  
  resetUserTypingFlag()
}

// 暴露方法给父组件
defineExpose({
  focus,
  blur,
  selectMentionUser,
  insertAtSymbol,
  insertEmoji
})
</script>

<style scoped>
/* contenteditable元素的基础样式 */
[contenteditable] {
  outline: none;
  white-space: normal;
}

/* placeholder实现 - 当元素为空时显示 */
[contenteditable]:empty::before {
  content: attr(placeholder);
  color: var(--text-color-secondary, #999);
  pointer-events: none;
  position: absolute;
}

[contenteditable] :deep(p) {
  margin: 0;
  padding: 0;
  line-height: inherit;
}

/* mention链接样式 */
[contenteditable] :deep(.mention-link) {
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

[contenteditable] :deep(.mention-link:hover) {
  color: var(--text-color-tag);
  opacity: 0.8;
}

[contenteditable] :deep(.mention-link:active) {
  color: var(--text-color-tag);
  opacity: 0.6;
}
</style>