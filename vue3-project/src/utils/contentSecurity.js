/**
 * 内容安全过滤工具函数
 * 统一管理危险标签过滤，防止XSS攻击
 */

const validateAndCleanMentionLink = (linkHtml) => {
  // 创建临时元素来解析链接
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = linkHtml
  const link = tempDiv.querySelector('a')
  
  if (!link) return null

  // 提取关键属性
  const href = link.getAttribute('href')
  const userId = link.getAttribute('data-user-id')
  const textContent = link.textContent

  // 严格验证 href：必须是 /user/ 开头的相对路径
  if (!href || !href.match(/^\/user\/[a-zA-Z0-9_-]+$/)) {
    return null
  }

  // 验证 data-user-id：只允许字母、数字、下划线和连字符
  if (!userId || !userId.match(/^[a-zA-Z0-9_-]+$/)) {
    return null
  }

  // 验证文本内容：必须是 @ 开头
  if (!textContent || !textContent.startsWith('@')) {
    return null
  }

  const nickname = textContent.substring(1) // 去掉@

  // 重新构建安全的 mention 链接，只包含必要的属性
  return `<a href="/user/${userId}" class="mention-link" data-user-id="${userId}" contenteditable="false">@${nickname}</a>`
}

/**
 * 内容安全过滤函数 - 用于渲染阶段
 * 保留安全的mention链接，将其他所有HTML标签转义为纯文本，同时保持换行
 * @param {string} content - 需要过滤的内容
 * @returns {string} - 过滤后的安全内容
 */
export const sanitizeContent = (content) => {
  if (!content) return ''

  // 1. 提取、验证并保护mention链接
  const mentionLinkRegex = /<a[^>]*class="[^"]*mention-link[^"]*"[^>]*>@[^<]*<\/a>/g
  const mentionLinks = []
  let processedContent = content.replace(mentionLinkRegex, (match) => {
    // 验证并清理 mention 链接
    const cleanedLink = validateAndCleanMentionLink(match)
    if (cleanedLink) {
      const placeholder = `__MENTION_LINK_${mentionLinks.length}__`
      mentionLinks.push(cleanedLink)
      return placeholder
    }
    // 如果验证失败，保持原样让后续步骤转义
    return match
  })

  // 2. 保护换行符
  const lineBreaks = []
  processedContent = processedContent.replace(/\n/g, () => {
    const placeholder = `__LINE_BREAK_${lineBreaks.length}__`
    lineBreaks.push('<br>')
    return placeholder
  })

  // 3. 将<br>标签也保护起来
  const brTags = []
  processedContent = processedContent.replace(/<br\s*\/?>/gi, () => {
    const placeholder = `__BR_TAG_${brTags.length}__`
    brTags.push('<br>')
    return placeholder
  })

  // 4. 先解码HTML实体，避免重复编码
  const decodeHtmlEntities = (text) => {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }
  
  // 5. 将所有剩余的HTML标签转义为纯文本（不解析DOM，只按字符转义，
  // 否则不换行空格会被浏览器序列化成 &nbsp;，后端再转义一次就变成 &amp;nbsp;，显示为字面 nbsp）
  const escapeHtml = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return text.replace(/[&<>"']/g, (char) => map[char])
  }
  
  // 先解码，再编码，避免重复编码问题
  processedContent = escapeHtml(decodeHtmlEntities(processedContent))

  // 6. 恢复被保护的内容
  // 先恢复<br>标签
  brTags.forEach((tag, index) => {
    processedContent = processedContent.replace(`__BR_TAG_${index}__`, tag)
  })

  // 恢复换行符
  lineBreaks.forEach((tag, index) => {
    processedContent = processedContent.replace(`__LINE_BREAK_${index}__`, tag)
  })

  // 最后恢复安全的mention链接
  mentionLinks.forEach((link, index) => {
    processedContent = processedContent.replace(`__MENTION_LINK_${index}__`, link)
  })

  return processedContent.trim()
}

/**
 * 简单的文本内容过滤函数
 * 移除所有HTML标签，只保留纯文本
 * @param {string} content - 需要过滤的内容
 * @returns {string} - 过滤后的纯文本内容
 */
export const sanitizeText = (content) => {
  if (!content) return ''
  return content.replace(/<[^>]*>/g, '')
}

/**
 * 验证内容是否包含危险标签
 * @param {string} content - 需要验证的内容
 * @returns {boolean} - 是否包含危险标签
 */
export const hasDangerousTags = (content) => {
  if (!content) return false

  // 危险标签列表
  const dangerousTags = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'link', 'meta', 'style', 'base', 'applet', 'frame', 'frameset'
  ]

  const tagRegex = new RegExp(`<\/?(?:${dangerousTags.join('|')})[^>]*>`, 'gi')
  return tagRegex.test(content)
}

/**
 * 验证内容是否包含危险属性
 * @param {string} content - 需要验证的内容
 * @returns {boolean} - 是否包含危险属性
 */
export const hasDangerousAttributes = (content) => {
  if (!content) return false

  // 危险属性列表
  const dangerousAttrs = [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'javascript:'
  ]

  return dangerousAttrs.some(attr =>
    content.toLowerCase().includes(attr.toLowerCase())
  )
}

/**
 * 完整的内容安全检查和过滤
 * @param {string} content - 需要处理的内容
 * @returns {object} - 包含是否安全和过滤后内容的对象
 */
export const securityCheck = (content) => {
  if (!content) {
    return {
      isSafe: true,
      sanitizedContent: '',
      warnings: []
    }
  }

  const warnings = []

  // 检查危险标签
  if (hasDangerousTags(content)) {
    warnings.push('检测到危险HTML标签')
  }

  // 检查危险属性
  if (hasDangerousAttributes(content)) {
    warnings.push('检测到危险HTML属性')
  }

  // 过滤内容
  const sanitizedContent = sanitizeContent(content)

  return {
    isSafe: warnings.length === 0,
    sanitizedContent,
    warnings
  }
}