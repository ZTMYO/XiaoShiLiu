/**
 * Mention文本解析工具
 * 将[@nickname:user_id]格式的文本转换为可点击的超链接
 */

/**
 * 解析文本中的mention标记，转换为HTML超链接
 * @param {string} text - 包含mention标记的文本
 * @returns {string} - 转换后的HTML字符串
 */
export function parseMentions(text) {
  if (!text) return ''

  // 匹配[@nickname:user_id]格式的正则表达式
  const mentionRegex = /\[@([^:]+):([^\]]+)\]/g

  return text.replace(mentionRegex, (match, nickname, userId) => {
    // 生成用户主页链接，使用小石榴号作为路由参数
    return `<a href="/user/${userId}" class="mention-link" data-user-id="${userId}" contenteditable="false">@${nickname}</a>`
  })
}

/**
 * 从文本中提取所有被@的用户ID
 * @param {string} text - 包含mention标记的文本
 * @returns {Array} - 用户ID数组
 */
export function extractMentionedUsers(text) {
  if (!text) return []

  const mentionRegex = /\[@([^:]+):([^\]]+)\]/g
  const mentionedUsers = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    const [, nickname, userId] = match
    mentionedUsers.push({
      nickname,
      userId
    })
  }

  return mentionedUsers
}

/**
 * 检查文本是否包含mention标记
 * @param {string} text - 要检查的文本
 * @returns {boolean} - 是否包含mention
 */
export function hasMentions(text) {
  if (!text) return false
  // 检查[@nickname:user_id]格式
  const mentionRegex = /\[@([^:]+):([^\]]+)\]/
  // 检查HTML格式的mention链接（匹配mention-link或mention class）
  const htmlMentionRegex = /<a[^>]*class="mention[^"]*"[^>]*data-user-id[^>]*>[^<]*@[^<]*<\/a>/
  return mentionRegex.test(text) || htmlMentionRegex.test(text)
}

/**
 * 清理文本中的mention标记，只保留昵称
 * @param {string} text - 包含mention标记的文本
 * @returns {string} - 清理后的文本
 */
export function cleanMentions(text) {
  if (!text) return ''

  // 清理[@nickname:user_id]格式
  const mentionRegex = /\[@([^:]+):([^\]]+)\]/g
  let cleanedText = text.replace(mentionRegex, '@$1')

  // 清理HTML格式的mention链接，提取@昵称部分（匹配mention-link或mention class）
  const htmlMentionRegex = /<a[^>]*class="mention[^"]*"[^>]*data-user-id[^>]*>([^<]*@[^<]*)<\/a>/g
  cleanedText = cleanedText.replace(htmlMentionRegex, '$1')

  // 移除所有HTML标签，只保留文本内容
  cleanedText = cleanedText.replace(/<[^>]*>/g, '')

  // 移除&nbsp;等HTML实体
  cleanedText = cleanedText.replace(/&nbsp;/g, ' ')

  return cleanedText
}