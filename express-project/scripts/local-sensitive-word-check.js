const mysql = require('mysql2/promise')
const fs = require('fs').promises
const path = require('path')

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const config = require('../config/config')

// 数据库连接配置
const dbConfig = {
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  port: config.database.port,
  charset: 'utf8mb4'
}

// 违规词库文件路径
const SENSITIVE_WORDS_FILE = path.join(__dirname, '违规词库.txt')

// 白名单用户（名单内用户的内容跳过违规词检测），由 SENSITIVE_WORD_CHECK_WHITELIST 配置
const USER_WHITELIST = config.sensitiveWordCheck.userWhitelist

// 违规词库
let sensitiveWords = []

async function loadSensitiveWords() {
  try {
    console.log('正在加载违规词库...')
    const content = await fs.readFile(SENSITIVE_WORDS_FILE, 'utf8')
    sensitiveWords = content.split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0)

    console.log(`违规词库加载完成，共 ${sensitiveWords.length} 个违规词`)
    if (USER_WHITELIST.length > 0) {
      console.log(`白名单用户：${USER_WHITELIST.join(', ')}（这些用户的内容将跳过检测）`)
    }
    return true
  } catch (error) {
    console.error('违规词库加载失败:', error.message)
    return false
  }
}

// 检测文本是否包含违规词
function checkSensitiveWord(text) {
  if (!text || text.trim() === '') {
    return { hasSensitive: false, originalText: text }
  }

  // 跳过已标记为违规的内容
  const violationMarks = ['违规昵称', '违规内容', '违规标题', '违规评论', '违规标签']
  if (violationMarks.includes(text.trim())) {
    return { hasSensitive: false, originalText: text }
  }

  // @提及是站内允许的写法，整体剔除后再剥离其余标签，
  // 避免把标签属性（如 mention 链接的 data-user-id）当成内容匹配
  const textForKeywords = text
    .replace(/<a[^>]*mention-link[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<[^>]*>/g, '')
  const textLower = textForKeywords.toLowerCase().replace(/\s+/g, '')

  for (const word of sensitiveWords) {
    if (word) {
      const wordLower = word.toLowerCase().replace(/\s+/g, '')
      if (textLower.includes(wordLower)) {
        return {
          hasSensitive: true,
          originalText: text,
          sensitiveWord: word
        }
      }
    }
  }

  return { hasSensitive: false, originalText: text }
}

// 生成10位随机字母数字混合码
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 检查小石榴号
async function checkUserIds(connection) {
  console.log('开始检查小石榴号...')

  const [users] = await connection.execute(
    'SELECT id, user_id FROM users WHERE user_id IS NOT NULL AND user_id != ""'
  )

  let updatedCount = 0

  for (const user of users) {
    // 跳过白名单用户
    if (USER_WHITELIST.includes(user.id)) {
      continue
    }

    const checkResult = checkSensitiveWord(user.user_id)

    if (checkResult.hasSensitive) {
      // 生成新的随机小石榴号，确保唯一性
      let newUserId
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 10) {
        newUserId = generateRandomCode()
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE user_id = ?',
          [newUserId]
        )

        if (existingUsers.length === 0) {
          isUnique = true
        }
        attempts++
      }

      if (isUnique) {
        await connection.execute(
          'UPDATE users SET user_id = ? WHERE id = ?',
          [newUserId, user.id]
        )

        console.log(`用户ID ${user.id} 的小石榴号 "${user.user_id}" 包含违规词 "${checkResult.sensitiveWord}"，已替换为 "${newUserId}"`)
        updatedCount++
      } else {
        console.error(`用户ID ${user.id} 的小石榴号生成失败，无法找到唯一的随机码`)
      }
    }
  }

  console.log(`小石榴号检查完成，共更新 ${updatedCount} 条记录`)
  return updatedCount
}

// 检查用户昵称
async function checkUserNicknames(connection) {
  console.log('开始检查用户昵称...')

  const [users] = await connection.execute(
    'SELECT id, user_id, nickname FROM users WHERE nickname IS NOT NULL AND nickname != ""'
  )

  let updatedCount = 0

  for (const user of users) {
    // 跳过白名单用户
    if (USER_WHITELIST.includes(user.id)) {
      continue
    }

    const checkResult = checkSensitiveWord(user.nickname)

    if (checkResult.hasSensitive) {
      await connection.execute(
        'UPDATE users SET nickname = ? WHERE user_id = ?',
        ['违规昵称', user.user_id]
      )

      console.log(`用户ID ${user.user_id} 的昵称 "${user.nickname}" 包含违规词 "${checkResult.sensitiveWord}"，已替换为 "违规昵称"`)
      updatedCount++
    }
  }

  console.log(`用户昵称检查完成，共更新 ${updatedCount} 条记录`)
  return updatedCount
}

// 检查用户个人简介
async function checkUserBios(connection) {
  console.log('开始检查用户个人简介...')

  const [users] = await connection.execute(
    'SELECT id, user_id, bio FROM users WHERE bio IS NOT NULL AND bio != ""'
  )

  let updatedCount = 0

  for (const user of users) {
    // 跳过白名单用户
    if (USER_WHITELIST.includes(user.id)) {
      continue
    }

    const checkResult = checkSensitiveWord(user.bio)

    if (checkResult.hasSensitive) {
      await connection.execute(
        'UPDATE users SET bio = ? WHERE user_id = ?',
        ['违规内容', user.user_id]
      )

      console.log(`用户ID ${user.user_id} 的个人简介包含违规词 "${checkResult.sensitiveWord}"，已替换为 "违规内容"`)
      updatedCount++
    }
  }

  console.log(`用户个人简介检查完成，共更新 ${updatedCount} 条记录`)
  return updatedCount
}

// 检查标签名
async function checkTagNames(connection) {
  console.log('开始检查标签名...')

  const [tags] = await connection.execute(
    'SELECT id, name FROM tags WHERE name IS NOT NULL AND name != ""'
  )

  let updatedCount = 0

  for (const tag of tags) {
    const checkResult = checkSensitiveWord(tag.name)

    if (checkResult.hasSensitive) {
      const newTagName = `违规标签_${generateRandomCode()}`
      await connection.execute(
        'UPDATE tags SET name = ? WHERE id = ?',
        [newTagName, tag.id]
      )

      console.log(`标签ID ${tag.id} 的标签名 "${tag.name}" 包含违规词 "${checkResult.sensitiveWord}"，已替换为 "${newTagName}"`)
      updatedCount++
    }
  }

  console.log(`标签名检查完成，共更新 ${updatedCount} 条记录`)
  return updatedCount
}

// 检查帖子标题和内容
async function checkPostContent(connection) {
  console.log('开始检查帖子标题和内容...')

  const [posts] = await connection.execute(
    'SELECT id, user_id, title, content FROM posts WHERE (title IS NOT NULL AND title != "") OR (content IS NOT NULL AND content != "")'
  )

  let titleUpdatedCount = 0
  let contentUpdatedCount = 0
  let skippedCount = 0

  for (const post of posts) {
    // 跳过白名单用户的帖子
    if (USER_WHITELIST.includes(post.user_id)) {
      skippedCount++
      continue
    }

    // 检查标题
    if (post.title && post.title.trim() !== '') {
      const titleCheckResult = checkSensitiveWord(post.title)

      if (titleCheckResult.hasSensitive) {
        await connection.execute(
          'UPDATE posts SET title = ? WHERE id = ?',
          ['违规标题', post.id]
        )

        console.log(`帖子ID ${post.id} 的标题 "${post.title}" 包含违规词 "${titleCheckResult.sensitiveWord}"，已替换为 "违规标题"`)
        titleUpdatedCount++
      }
    }

    // 检查内容
    if (post.content && post.content.trim() !== '') {
      const contentCheckResult = checkSensitiveWord(post.content)

      if (contentCheckResult.hasSensitive) {
        await connection.execute(
          'UPDATE posts SET content = ? WHERE id = ?',
          ['违规内容', post.id]
        )

        console.log(`帖子ID ${post.id} 的内容包含违规词 "${contentCheckResult.sensitiveWord}"，已替换为 "违规内容"`)
        contentUpdatedCount++
      }
    }
  }

  console.log(`帖子检查完成，跳过白名单 ${skippedCount} 条，标题更新 ${titleUpdatedCount} 条，内容更新 ${contentUpdatedCount} 条记录`)
  return { titleUpdatedCount, contentUpdatedCount, skippedCount }
}

// 检查评论内容
async function checkCommentContent(connection) {
  console.log('开始检查评论内容...')

  const [comments] = await connection.execute(
    'SELECT id, user_id, content FROM comments WHERE content IS NOT NULL AND content != ""'
  )

  let updatedCount = 0
  let skippedCount = 0

  for (const comment of comments) {
    // 跳过白名单用户的评论
    if (USER_WHITELIST.includes(comment.user_id)) {
      skippedCount++
      continue
    }

    const checkResult = checkSensitiveWord(comment.content)

    if (checkResult.hasSensitive) {
      await connection.execute(
        'UPDATE comments SET content = ? WHERE id = ?',
        ['违规评论', comment.id]
      )

      console.log(`评论ID ${comment.id} 的内容 "${comment.content}" 包含违规词 "${checkResult.sensitiveWord}"，已替换为 "违规评论"`)
      updatedCount++
    }
  }

  console.log(`评论检查完成，跳过白名单 ${skippedCount} 条，更新 ${updatedCount} 条记录`)
  return { updatedCount, skippedCount }
}

// 执行一次检测：命令行与后端进程内调度共用，不主动结束进程
async function runCheck() {
  if (!config.sensitiveWordCheck.enabled) {
    console.log('违规词检测未启用（SENSITIVE_WORD_CHECK_ENABLED=false），任务跳过')
    return null
  }

  let connection

  try {
    console.log('开始违规词检测任务...')
    console.log('任务开始时间:', new Date().toLocaleString())

    // 加载违规词库
    const wordsLoaded = await loadSensitiveWords()
    if (!wordsLoaded) {
      throw new Error('违规词库加载失败')
    }

    console.log('连接数据库...')
    connection = await mysql.createConnection(dbConfig)
    console.log('数据库连接成功')

    // 检查小石榴号
    const userIdUpdated = await checkUserIds(connection)

    // 检查用户昵称
    const nicknameUpdated = await checkUserNicknames(connection)

    // 检查用户个人简介
    const bioUpdated = await checkUserBios(connection)

    // 检查标签名
    const tagUpdated = await checkTagNames(connection)

    // 检查帖子内容
    const postResult = await checkPostContent(connection)

    // 检查评论内容
    const commentResult = await checkCommentContent(connection)

    console.log('\n=== 违规词检测任务完成 ===')
    console.log(`任务完成时间: ${new Date().toLocaleString()}`)
    console.log(`小石榴号更新: ${userIdUpdated} 条`)
    console.log(`用户昵称更新: ${nicknameUpdated} 条`)
    console.log(`用户个人简介更新: ${bioUpdated} 条`)
    console.log(`标签名更新: ${tagUpdated} 条`)
    console.log(`帖子标题更新: ${postResult.titleUpdatedCount} 条`)
    console.log(`帖子内容更新: ${postResult.contentUpdatedCount} 条`)
    console.log(`帖子跳过(白名单): ${postResult.skippedCount} 条`)
    console.log(`评论内容更新: ${commentResult.updatedCount} 条`)
    console.log(`评论跳过(白名单): ${commentResult.skippedCount} 条`)
    console.log(`总计更新: ${userIdUpdated + nicknameUpdated + bioUpdated + tagUpdated + postResult.titleUpdatedCount + postResult.contentUpdatedCount + commentResult.updatedCount} 条记录`)

    return {
      userAccountUpdated: userIdUpdated,
      nicknameUpdated,
      bioUpdated,
      tagUpdated,
      postTitleUpdated: postResult.titleUpdatedCount,
      postContentUpdated: postResult.contentUpdatedCount,
      commentUpdated: commentResult.updatedCount
    }
  } finally {
    if (connection) {
      await connection.end()
      console.log('数据库连接已关闭')
    }
  }
}

// 命令行入口：手动执行或 crontab 调用
async function main() {
  try {
    await runCheck()
  } catch (error) {
    console.error('违规词检测任务执行失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  loadSensitiveWords,
  checkSensitiveWord,
  generateRandomCode,
  checkUserIds,
  checkUserNicknames,
  checkUserBios,
  checkTagNames,
  checkPostContent,
  checkCommentContent,
  runCheck,
  main,
  USER_WHITELIST
}
