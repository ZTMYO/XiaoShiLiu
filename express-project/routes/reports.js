const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const { HTTP_STATUS, RESPONSE_CODES, ERROR_MESSAGES } = require('../constants')
const { pool } = require('../config/config')
const { authenticateToken } = require('../middleware/auth')

const REPORT_REASONS = ['广告营销', '色情低俗', '人身攻击', '侵权盗图', '其他']
const DAILY_REPORT_LIMIT = 20
const DETAIL_MAX_LENGTH = 500

// 目标类型：1-笔记 2-评论
async function getTargetSnapshot(type, id) {
  if (type === 1) {
    const [rows] = await pool.execute('SELECT user_id, title, content FROM posts WHERE id = ?', [String(id)])
    if (rows.length === 0) return null
    return {
      ownerId: rows[0].user_id,
      snapshot: `${rows[0].title || ''}\n${rows[0].content || ''}`
    }
  }
  const [rows] = await pool.execute('SELECT user_id, content FROM comments WHERE id = ?', [String(id)])
  if (rows.length === 0) return null
  return { ownerId: rows[0].user_id, snapshot: rows[0].content || '' }
}

// 发起举报
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { target_type, target_id, reason, detail } = req.body
    const userId = req.user.id

    const type = parseInt(target_type)
    const targetId = parseInt(target_id)
    if (![1, 2].includes(type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '无效的目标类型' })
    }
    if (!targetId || targetId <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '无效的目标ID' })
    }
    if (!REPORT_REASONS.includes(reason)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '无效的举报原因' })
    }
    const cleanDetail = String(detail || '').replace(/<[^>]*>/g, '').trim().slice(0, DETAIL_MAX_LENGTH)

    const target = await getTargetSnapshot(type, targetId)
    if (!target) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ code: RESPONSE_CODES.NOT_FOUND, message: '举报目标不存在' })
    }
    if (String(target.ownerId) === String(userId)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ code: RESPONSE_CODES.VALIDATION_ERROR, message: '不能举报自己的内容' })
    }

    // 每日举报上限
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) AS n FROM reports WHERE reporter_id = ? AND created_at >= CURDATE()',
      [String(userId)]
    )
    if (countRows[0].n >= DAILY_REPORT_LIMIT) {
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        code: RESPONSE_CODES.TOO_MANY_REQUESTS,
        message: `今日举报已达上限（${DAILY_REPORT_LIMIT}条），请明天再试`
      })
    }

    const contentHash = crypto.createHash('md5').update(target.snapshot).digest('hex')

    try {
      const [result] = await pool.execute(
        'INSERT INTO reports (reporter_id, target_type, target_id, reason, detail, content_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [String(userId), type, String(targetId), reason, cleanDetail || null, contentHash]
      )
      return res.json({ code: RESPONSE_CODES.SUCCESS, message: '举报已提交，我们会尽快处理', data: { id: result.insertId } })
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.json({ code: RESPONSE_CODES.SUCCESS, message: '你已举报过该内容', data: { duplicate: true } })
      }
      throw error
    }
  } catch (error) {
    console.error('❌ 发起举报失败:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR })
  }
})

module.exports = router