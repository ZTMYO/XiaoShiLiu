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
  
  // 匹配[@nickname:user_id]格式的正则表达式
  const mentionRegex = /\[@([^:]+):([^\]]+)\]/g
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const [, nickname, userId] = match
    mentionedUsers.push({
      nickname,
      userId
    })
  }
  
  // 匹配HTML格式的mention链接
  const htmlMentionRegex = /<a[^>]*class="mention[^"]*"[^>]*data-user-id="([^"]+)"[^>]*>@([^<]+)<\/a>/g
  
  while ((match = htmlMentionRegex.exec(text)) !== null) {
    const [, userId, nickname] = match
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
  
  // 检查[@nickname:user_id]格式
  const mentionRegex = /\[@([^:]+):([^\]]+)\]/
  // 检查HTML格式的mention链接
  const htmlMentionRegex = /<a[^>]*class="mention[^"]*"[^>]*data-user-id[^>]*>[^<]*@[^<]*<\/a>/
  
  return mentionRegex.test(text) || htmlMentionRegex.test(text)
}

module.exports = {
  extractMentionedUsers,
  hasMentions
}