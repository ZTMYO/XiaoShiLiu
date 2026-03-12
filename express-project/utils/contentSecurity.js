/**
 * 服务端内容安全过滤工具
 * 防止XSS攻击和恶意HTML注入
 */

const escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * 验证并清理 mention 链接
 * 确保链接只包含安全的属性和值
 */
const validateAndCleanMentionLink = (linkHtml) => {
  // 提取 href 和 data-user-id
  const hrefMatch = linkHtml.match(/href="([^"]*)"/)
  const userIdMatch = linkHtml.match(/data-user-id="([^"]*)"/)
  const textMatch = linkHtml.match(/>@([^<]*)</)

  if (!hrefMatch || !userIdMatch || !textMatch) {
    return null
  }

  const href = hrefMatch[1]
  const userId = userIdMatch[1]
  const nickname = textMatch[1]

  // 严格验证 href：必须是 /user/ 开头的相对路径
  if (!href.match(/^\/user\/[a-zA-Z0-9_-]+$/)) {
    return null
  }

  // 验证 data-user-id：只允许字母、数字、下划线和连字符
  if (!userId.match(/^[a-zA-Z0-9_-]+$/)) {
    return null
  }


  // 重新构建安全的 mention 链接
  return `<a href="/user/${userId}" class="mention-link" data-user-id="${userId}" contenteditable="false">@${nickname}</a>`
}

/**
 * 内容安全过滤函数
 * 保留安全的mention链接和换行，转义其他所有HTML标签
 */
const sanitizeContent = (content) => {
  if (!content) return ''

  // 1. 提取、验证并保护mention链接
  const mentionLinks = []
  let processedContent = ''
  let cursor = 0
  while (cursor < content.length) {
    const aStart = content.indexOf('<a', cursor)
    if (aStart === -1) {
      processedContent += content.slice(cursor)
      break
    }

    processedContent += content.slice(cursor, aStart)

    const aEnd = content.indexOf('>', aStart)
    if (aEnd === -1) {
      processedContent += content.slice(aStart)
      break
    }

    const closeTag = '</a>'
    const aClose = content.indexOf(closeTag, aEnd + 1)
    if (aClose === -1) {
      processedContent += content.slice(aStart)
      break
    }

    const fullLink = content.slice(aStart, aClose + closeTag.length)
    if (fullLink.includes('mention-link')) {
      const cleanedLink = validateAndCleanMentionLink(fullLink)
      if (cleanedLink) {
        const placeholder = `__MENTION_LINK_${mentionLinks.length}__`
        mentionLinks.push(cleanedLink)
        processedContent += placeholder
      } else {
        processedContent += fullLink
      }
    } else {
      processedContent += fullLink
    }

    cursor = aClose + closeTag.length
  }

  // 2. 保护换行符
  const lineBreaks = []
  processedContent = processedContent.replace(/\n/g, () => {
    const placeholder = `__LINE_BREAK_${lineBreaks.length}__`
    lineBreaks.push('<br>')
    return placeholder
  })

  // 3. 保护<br>标签
  const brTags = []
  processedContent = processedContent.replace(/<br\s*\/?>/gi, () => {
    const placeholder = `__BR_TAG_${brTags.length}__`
    brTags.push('<br>')
    return placeholder
  })

  // 4. 保护安全的<img>标签（允许http/https协议和本地相对路径）
  const imgTags = []
  processedContent = processedContent.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
    if (/\son\w+\s*=/i.test(match) || /javascript\s*:/i.test(match)) {
      return match
    }

    // 验证URL是否安全：允许http/https绝对路径和/api/开头的相对路径
    if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/api/'))) {
      const placeholder = `__IMG_TAG_${imgTags.length}__`
      const escapedSrc = src.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
      imgTags.push(`<img src="${escapedSrc}" alt="图片" class="comment-image" />`)
      return placeholder
    }
    return match
  })

  // 5. 转义所有剩余的HTML标签
  processedContent = escapeHtml(processedContent)

  // 6. 恢复被保护的内容
  brTags.forEach((tag, index) => {
    processedContent = processedContent.replace(`__BR_TAG_${index}__`, tag)
  })

  lineBreaks.forEach((tag, index) => {
    processedContent = processedContent.replace(`__LINE_BREAK_${index}__`, tag)
  })

  imgTags.forEach((tag, index) => {
    processedContent = processedContent.replace(`__IMG_TAG_${index}__`, tag)
  })

  mentionLinks.forEach((link, index) => {
    processedContent = processedContent.replace(`__MENTION_LINK_${index}__`, link)
  })

  return processedContent.trim()
}

/**
 * 验证内容是否包含危险标签
 */
const hasDangerousTags = (content) => {
  if (!content) return false
  
  const dangerousTags = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'link', 'meta', 'style', 'base', 'applet', 'frame', 'frameset'
  ]
  
  const tagRegex = new RegExp(`<\/?(?:${dangerousTags.join('|')})[^>]*>`, 'gi')
  return tagRegex.test(content)
}

/**
 * 验证内容是否包含危险属性
 */
const hasDangerousAttributes = (content) => {
  if (!content) return false
  
  const dangerousAttrs = [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'javascript:'
  ]
  
  return dangerousAttrs.some(attr =>
    content.toLowerCase().includes(attr.toLowerCase())
  )
}

module.exports = {
  sanitizeContent,
  hasDangerousTags,
  hasDangerousAttributes,
  escapeHtml
}

