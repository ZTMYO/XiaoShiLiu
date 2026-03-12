/**
 * Mention文本解析工具 - 后端版本
 * 处理[@nickname:user_id]格式的文本，提取被@的用户信息
 */

/**
 * 从文本中提取所有被@的用户ID
 * @param {string} text - 包含mention标记的文本
 * @returns {Array} - 用户ID数组
 */
function extractMentionedUsers(text) {
  if (!text) return []
  
  const mentionedUsers = []
  
  // 匹配HTML格式的mention链接（避免使用可能引发灾难性回溯的复杂正则，改为确定性的字符串扫描）
  let searchIndex = 0
  while (true) {
    const aStart = text.indexOf('<a', searchIndex)
    if (aStart === -1) break

    const aEnd = text.indexOf('>', aStart)
    if (aEnd === -1) break

    const closeTag = '</a>'
    const aClose = text.indexOf(closeTag, aEnd + 1)
    if (aClose === -1) break

    const tagHtml = text.slice(aStart, aEnd + 1)
    const innerText = text.slice(aEnd + 1, aClose)

    if (tagHtml.includes('mention-link') && tagHtml.includes('data-user-id="')) {
      const userIdKey = 'data-user-id="'
      const userIdStart = tagHtml.indexOf(userIdKey)
      if (userIdStart !== -1) {
        const userIdValueStart = userIdStart + userIdKey.length
        const userIdValueEnd = tagHtml.indexOf('"', userIdValueStart)
        if (userIdValueEnd !== -1) {
          const userId = tagHtml.slice(userIdValueStart, userIdValueEnd)
          const nickname = innerText.startsWith('@') ? innerText.slice(1) : innerText

          mentionedUsers.push({
            nickname,
            userId
          })
        }
      }
    }

    searchIndex = aClose + closeTag.length
  }
  
  // 兼容旧格式[@nickname:user_id]
  const mentionRegex = /\[@([^:]+):([^\]]+)\]/g
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const [, nickname, userId] = match
    // 避免重复添加
    if (!mentionedUsers.some(user => user.userId === userId)) {
      mentionedUsers.push({
        nickname,
        userId
      })
    }
  }
  
  return mentionedUsers
}

/**
 * 检查文本是否包含mention标记
 * @param {string} text - 要检查的文本
 * @returns {boolean} - 是否包含mention
 */
function hasMentions(text) {
  if (!text) return false
  
  // 检查HTML格式的mention链接
  if (text.includes('class="mention-link"') && text.includes('data-user-id="') && text.includes('</a>')) {
    return true
  }

  // 检查[@nickname:user_id]格式（兼容旧格式）
  const mentionRegex = /\[@([^:]+):([^\]]+)\]/
  return mentionRegex.test(text)
}

module.exports = {
  extractMentionedUsers,
  hasMentions
}