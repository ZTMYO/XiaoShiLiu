<template>
  <div ref="inputRef" :class="inputClass" contenteditable="true" @input="handleInput" @focus="handleFocus"
    @blur="handleBlur" @keydown="handleKeydown" @click="handleClick" @paste="handlePaste" :placeholder="placeholder">
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { sanitizeText } from '@/utils/contentSecurity'

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
  },
  enableCtrlEnterSend: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'keydown', 'mention', 'paste-image', 'send'])

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
  // 将换行符转换为 HTML 格式（保持 mention 链接）
  const htmlContent = convertTextToMentionLinks(content || '')
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



// 将[@nickname:user_id]格式转换为HTML mention链接
const convertTextToMentionLinks = (text) => {
  if (!text) return ''

  // 保护已存在的HTML mention链接
  const mentionLinkRegex = /<a[^>]*class="[^"]*mention-link[^"]*"[^>]*data-user-id="([^"]*)"[^>]*>@([^<]*)<\/a>/g
  const existingLinks = []
  let linkIndex = 0
  
  // 提取并保护现有的mention链接
  text = text.replace(mentionLinkRegex, (match) => {
    const placeholder = `__MENTION_LINK_${linkIndex}__`
    existingLinks[linkIndex] = match
    linkIndex++
    return placeholder
  })

  // 解码HTML实体，避免重复编码问题
  const decodeHtmlEntities = (str) => {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = str
    return textarea.value
  }
  text = decodeHtmlEntities(text)

  // 历史数据可能残留块级标签，先归一化为换行，保证本函数幂等（不会层层嵌套 div）
  text = convertMentionLinksToText(text)

  // 处理[@nickname:user_id]格式（兼容旧格式）
  const mentionRegex = /\[@([^:]+):([^\]]+)\]/g
  text = text.replace(mentionRegex, (match, nickname, userId) => {
    return `<a href="/user/${userId}" data-user-id="${userId}" class="mention-link" contenteditable="false">@${nickname}</a>`
  })

  // 恢复保护的mention链接
  existingLinks.forEach((link, index) => {
    text = text.replace(`__MENTION_LINK_${index}__`, link)
  })

  // 处理换行符，转换为 div 结构（符合 contenteditable 默认行为）
  const lines = text.split('\n')
  
  // 每行统一用 div 包裹，使行内的 mention 链接始终处于块级容器中，
  // 这样在 mention 前后按回车时浏览器才能正确拆分段落
  return lines.map((line) => `<div>${line || '<br>'}</div>`).join('')
}

// 将HTML格式的mention链接转换为[@nickname:user_id]格式，保持换行
const convertMentionLinksToText = (html) => {
  if (!html) return ''

  // 创建临时div来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // 查找所有mention链接，保持HTML格式不变
  // 不再转换为[@nickname:user_id]格式，直接保持HTML a标签格式

  // 查找所有@符号标记并替换为纯文本@符号
  const atMarkers = tempDiv.querySelectorAll('span[data-at-marker]')
  atMarkers.forEach(marker => {
    const atText = document.createTextNode('@')
    marker.parentNode.replaceChild(atText, marker)
  })

  // 将div标签转换为换行符，保持文本格式
  const processNode = (node) => {
    let result = ''
    for (let child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'DIV') {
          // div标签表示换行，在前面添加换行符（除非是第一个div）
          if (result.length > 0) {
            result += '\n'
          }
          result += processNode(child)
        } else if (child.tagName === 'BR') {
          // 块内只有 <br> 时它只是空行的占位符，换行已由 DIV 分支计入
          const isPlaceholder = child.parentNode && child.parentNode.childNodes.length === 1
          if (!isPlaceholder) {
            result += '\n'
          }
        } else if (child.tagName === 'A' && child.classList.contains('mention-link')) {
          // 保持mention链接的HTML格式
          result += child.outerHTML
        } else {
          // 其他标签直接处理内容
          result += processNode(child)
        }
      }
    }
    return result
  }

  return processNode(tempDiv)
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
  const relatedTarget = event.relatedTarget
  if (
    relatedTarget &&
    (relatedTarget.tagName === 'INPUT' ||
      relatedTarget.tagName === 'TEXTAREA' ||
      relatedTarget.isContentEditable)
  ) {
    emit('blur', event)
    return
  }

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
    syncModelFromDom()
    return true
  }
  return false
}

const isMentionLinkNode = (node) => Boolean(
  node && node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('mention-link')
)

// 拆分、合并行块时浏览器会留下不显示的空文本节点，它占住 childNodes 的下标，
// 让"光标是否紧邻 mention"的判断失效，这里统一识别并跳过
const isEmptyTextNode = (node) => Boolean(node) && node.nodeType === Node.TEXT_NODE && node.textContent.length === 0

const removeEmptyTextNodes = (block) => {
  if (!block) return
  Array.from(block.childNodes).forEach((child) => {
    if (isEmptyTextNode(child)) child.remove()
  })
}

const skipEmptyTextNodes = (node, direction) => {
  let current = node
  while (isEmptyTextNode(current)) {
    current = direction === 'previous' ? current.previousSibling : current.nextSibling
  }
  return current
}

// 光标是否紧贴在 mention 链接的前面或后面
const isCaretNextToMention = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const { startContainer, startOffset } = selection.getRangeAt(0)

  let leftNode = null
  let rightNode = null

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = startContainer
    if (startOffset === 0) {
      leftNode = skipEmptyTextNodes(textNode.previousSibling, 'previous')
      rightNode = isEmptyTextNode(textNode) ? skipEmptyTextNodes(textNode.nextSibling, 'next') : textNode
    } else if (startOffset === textNode.textContent.length) {
      leftNode = textNode
      rightNode = skipEmptyTextNodes(textNode.nextSibling, 'next')
    }
  } else {
    leftNode = skipEmptyTextNodes(startContainer.childNodes[startOffset - 1], 'previous')
    rightNode = skipEmptyTextNodes(startContainer.childNodes[startOffset], 'next')
  }

  return isMentionLinkNode(leftNode) || isMentionLinkNode(rightNode)
}

// 在光标处把行块拆成两行，光标后（含 mention）的内容整体移入新行，光标落在新行开头。
// 不用 <br>：光标定位在 <br> 之后会被浏览器归一到 <br> 之前，导致光标留在上一行末尾
const splitLineAtCaret = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  if (!range.collapsed) return false

  let block = range.startContainer
  if (block.nodeType === Node.TEXT_NODE) block = block.parentNode
  while (block && block !== inputRef.value && block.nodeName !== 'DIV') {
    block = block.parentNode
  }
  if (!block || block === inputRef.value) return false

  const tail = document.createRange()
  tail.setStart(range.startContainer, range.startOffset)
  tail.setEnd(block, block.childNodes.length)

  const newBlock = document.createElement('div')
  newBlock.appendChild(tail.extractContents())
  removeEmptyTextNodes(newBlock)
  if (!newBlock.firstChild) newBlock.appendChild(document.createElement('br'))

  block.parentNode.insertBefore(newBlock, block.nextSibling)
  removeEmptyTextNodes(block)
  if (!block.firstChild) block.appendChild(document.createElement('br'))

  const caret = document.createRange()
  caret.setStart(newBlock, 0)
  caret.collapse(true)
  selection.removeAllRanges()
  selection.addRange(caret)
  return true
}

// 光标停在行首时把当前行并回上一行，光标落在两行内容的衔接处。
// 衔接处涉及 mention 时浏览器同样会丢光标，所以自己合并
const mergeLineBackward = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  if (!range.collapsed || range.startOffset !== 0) return false
  if (range.startContainer.nodeType !== Node.ELEMENT_NODE) return false

  const block = range.startContainer
  if (block === inputRef.value || block.nodeName !== 'DIV') return false

  const previous = block.previousElementSibling
  if (!previous || previous.nodeName !== 'DIV') return false

  // 只在衔接处涉及 mention 时接管，其余行交给浏览器默认行为
  if (!block.querySelector('.mention-link') &&
    !isMentionLinkNode(skipEmptyTextNodes(previous.lastChild, 'previous'))) return false

  const isPlaceholder = block.childNodes.length === 1 && block.firstChild.nodeName === 'BR'
  if (isPlaceholder) {
    block.remove()
    const caret = document.createRange()
    caret.setStart(previous, previous.childNodes.length)
    caret.collapse(true)
    selection.removeAllRanges()
    selection.addRange(caret)
    return true
  }

  // 上一行是空行占位时先移除占位 <br>，否则合并后会多出一个空行
  if (previous.childNodes.length === 1 && previous.firstChild.nodeName === 'BR') {
    previous.firstChild.remove()
  }

  removeEmptyTextNodes(previous)
  const junction = previous.childNodes.length
  Array.from(block.childNodes).forEach((child) => previous.appendChild(child))
  removeEmptyTextNodes(previous)
  block.remove()

  const caret = document.createRange()
  caret.setStart(previous, junction)
  caret.collapse(true)
  selection.removeAllRanges()
  selection.addRange(caret)
  return true
}

const handleKeydown = (event) => {
  // 处理Enter键
  if (event.key === 'Enter') {
    if (event.ctrlKey && props.enableCtrlEnterSend) {
      // Ctrl+Enter发送
      event.preventDefault()
      emit('send')
      return
    }

    // 紧邻 mention 时自己拆行：交给浏览器拆段落会把不可编辑的链接挤进另一个块，
    // 形成"光标单独占一行、链接被挤到下一行"的三行结构
    if (isCaretNextToMention() && splitLineAtCaret()) {
      event.preventDefault()
      inputRef.value.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    // 其余情况沿用浏览器默认换行
  }

  // 阻止左右箭头键事件冒泡，避免触发父级的图片翻页功能
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.stopPropagation()
  }

  if (event.key === 'Backspace') {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (range.collapsed) {
        if (mergeLineBackward()) {
          event.preventDefault()
          inputRef.value.dispatchEvent(new Event('input', { bubbles: true }))
          return
        }

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

        // 光标停在块级容器（根节点或行 div）中、紧跟 mention 链接之后
        if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
          const prevChild = range.startContainer.childNodes[range.startOffset - 1]
          if (removeMentionLink(prevChild)) {
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

        // 光标停在块级容器中、紧邻 mention 链接之前
        if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
          const nextChild = range.startContainer.childNodes[range.startOffset]
          if (removeMentionLink(nextChild)) {
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

  // 检查是否有图片文件
  const items = clipboardData.items
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          // 发送图片文件给父组件处理
          emit('paste-image', file)
          return
        }
      }
    }
  }

  const selection = window.getSelection()
  if (selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  range.deleteContents()

  // 优先处理HTML格式的粘贴（保留换行和mention链接）
  const pastedHtml = clipboardData.getData('text/html')
  if (pastedHtml) {
    // 创建临时div解析HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = pastedHtml
    
    // 提取文本行，保留mention链接
    const lines = []
    let currentLine = document.createDocumentFragment()
    
    // 递归处理节点，按行组织内容
    const processNodeToLines = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent
        if (text) {
          // 检查文本中是否包含换行符
          if (text.includes('\n')) {
            // 按换行符拆分文本
            const textLines = text.split('\n')
            textLines.forEach((line, index) => {
              // 去除每行两端的空白，但保留行内空白
              const trimmedLine = line.trim()
              if (trimmedLine || index < textLines.length - 1) {
                if (index > 0) {
                  // 不是第一行，先保存当前行
                  lines.push(currentLine)
                  currentLine = document.createDocumentFragment()
                }
                if (trimmedLine) {
                  currentLine.appendChild(document.createTextNode(trimmedLine))
                }
              }
            })
          } else {
            // 没有换行符，直接添加
            const trimmedText = text.trim()
            if (trimmedText) {
              currentLine.appendChild(document.createTextNode(trimmedText))
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'BR') {
          // BR 标签表示换行
          lines.push(currentLine)
          currentLine = document.createDocumentFragment()
        } else if (node.tagName === 'DIV' || node.tagName === 'P') {
          // DIV 和 P 标签表示新的一行
          if (currentLine.childNodes.length > 0 || lines.length > 0) {
            lines.push(currentLine)
            currentLine = document.createDocumentFragment()
          }
          // 递归处理子节点
          Array.from(node.childNodes).forEach(processNodeToLines)
        } else if (node.classList && node.classList.contains('mention-link')) {
          // 保留mention链接
          const userId = node.getAttribute('data-user-id')
          const nickname = node.textContent.substring(1) // 去掉@符号
          if (userId && nickname) {
            const mentionLink = createMentionLink(userId, nickname)
            currentLine.appendChild(mentionLink)
          }
        } else {
          // 其他标签递归处理子节点
          Array.from(node.childNodes).forEach(processNodeToLines)
        }
      }
    }
    
    Array.from(tempDiv.childNodes).forEach(processNodeToLines)
    
    // 添加最后一行（如果有内容）
    if (currentLine.childNodes.length > 0) {
      lines.push(currentLine)
    }
    
    // 构建最终的 fragment，使用 div 标签来表示每一行（符合 contenteditable 默认行为）
    const fragment = document.createDocumentFragment()
    
    if (lines.length === 0) return
    
    lines.forEach((lineFragment, index) => {
      if (index === 0) {
        // 第一行直接添加内容，不用 div 包裹
        const clonedFragment = lineFragment.cloneNode(true)
        fragment.appendChild(clonedFragment)
      } else {
        // 后续行使用 div 包裹（符合 contenteditable 的默认换行行为）
        const lineDiv = document.createElement('div')
        const clonedFragment = lineFragment.cloneNode(true)
        
        // 如果行是空的，添加一个 <br> 以保持空行
        if (clonedFragment.childNodes.length === 0) {
          lineDiv.appendChild(document.createElement('br'))
        } else {
          lineDiv.appendChild(clonedFragment)
        }
        
        fragment.appendChild(lineDiv)
      }
    })
    
    // 插入处理后的内容
    if (fragment.childNodes.length > 0) {
      range.insertNode(fragment)
      
      // 将光标移到插入内容后面
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      
      // 触发input事件
      const inputEvent = new Event('input', { bubbles: true })
      inputRef.value.dispatchEvent(inputEvent)
    }
    return
  }

  // 降级处理：处理纯文本粘贴
  const pastedText = clipboardData.getData('text/plain')
  if (!pastedText) return

  // 将文本中的换行符转换为 div 标签（符合 contenteditable 默认行为）
  const lines = pastedText.split('\n')
  const fragment = document.createDocumentFragment()
  
  lines.forEach((line, index) => {
    const sanitizedLine = sanitizeText(line)
    
    if (index === 0) {
      // 第一行直接添加文本节点
      if (sanitizedLine) {
        fragment.appendChild(document.createTextNode(sanitizedLine))
      }
    } else {
      // 后续行使用 div 包裹
      const lineDiv = document.createElement('div')
      if (sanitizedLine) {
        lineDiv.textContent = sanitizedLine
      } else {
        // 空行添加 <br> 以保持高度
        lineDiv.appendChild(document.createElement('br'))
      }
      fragment.appendChild(lineDiv)
    }
  })
  
  range.insertNode(fragment)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
  
  const inputEvent = new Event('input', { bubbles: true })
  inputRef.value.dispatchEvent(inputEvent)
}



const resetUserTypingFlag = () => {
  nextTick(() => {
    // 移除setTimeout，确保插入完成后再重置
    isUserTyping.value = false
  })
}

// 以 DOM 为准同步模型：先标记为用户操作，避免 watch 重写 innerHTML 把光标弹到开头
const syncModelFromDom = () => {
  isUserTyping.value = true
  emit('update:modelValue', convertMentionLinksToText(inputRef.value.innerHTML))
  resetUserTypingFlag()
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

      syncModelFromDom()
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

  syncModelFromDom()
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

// 将带有data-at-marker属性的span标签转换为纯文本@符号
const convertAtMarkerToText = () => {
  if (!inputRef.value) return

  const atMarkers = inputRef.value.querySelectorAll('span[data-at-marker]')
  atMarkers.forEach(marker => {
    const atText = document.createTextNode('@')
    marker.parentNode.replaceChild(atText, marker)
  })

  // 触发更新事件
  if (atMarkers.length > 0) {
    syncModelFromDom()
  }
}

// 暴露方法给父组件
defineExpose({
  focus,
  blur,
  selectMentionUser,
  insertAtSymbol,
  insertEmoji,
  convertAtMarkerToText
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
  display: block;
  opacity: 0.6;
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