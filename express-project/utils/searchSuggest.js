/**
 * 搜索联想索引
 * 候选词在服务启动后加载进进程内存，查询时只做字符串匹配，不访问数据库
 */
const { pool } = require('../config/config')
const { pinyin } = require('pinyin-pro')
const { Segment, useDefault } = require('segmentit')

const REFRESH_INTERVAL = 10 * 60 * 1000
const MAX_TAGS = 30000
const MAX_POSTS = 5000
const MAX_USERS = 5000
const MAX_KEYWORD_LENGTH = 100
// 输入达到该长度才启用分词：长句靠切出的关键词召回，短关键词仍按整串匹配
const SEGMENT_MIN_LENGTH = 5
const MIN_FRAGMENT_LENGTH = 2
const MAX_FRAGMENTS = 20

// 纯字母数字视为拼音输入，额外尝试全拼与首字母前缀匹配
const PINYIN_INPUT = /^[a-z0-9]+$/

// 召回类型优先级，数值越小排得越前
const REASON_TEXT_PREFIX = 0
const REASON_TEXT_INCLUDE = 1
const REASON_PINYIN_FULL = 2
const REASON_PINYIN_INITIALS = 3

let index = { tags: [], posts: [], users: [] }
let ready = false
let refreshing = false
let timer = null
let segmenter = null

// 分词器词典体积不小，延迟到服务启动后再加载，避免拖慢 require
function getSegmenter() {
  if (!segmenter) segmenter = useDefault(new Segment())
  return segmenter
}

function toPinyin(text) {
  return {
    full: pinyin(text, { toneType: 'none', type: 'array' }).join('').toLowerCase(),
    initials: pinyin(text, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase()
  }
}

// 长句拆出关键词片段：整串优先，再按分词结果补充分片（叠字噪音丢弃）
function extractFragments(query) {
  if (query.length < SEGMENT_MIN_LENGTH) return [query]

  const fragments = [query]
  const words = getSegmenter().doSegment(query, { simple: true }) || []
  for (const word of words) {
    if (word.length < MIN_FRAGMENT_LENGTH) continue
    if (/^(.)\1+$/.test(word)) continue
    if (fragments.includes(word)) continue
    fragments.push(word)
  }

  // 长片段更贴近用户原意，命中长片段的候选排在前面
  return fragments.sort((a, b) => b.length - a.length).slice(0, MAX_FRAGMENTS)
}

// 取最长的一次命中；matched 是候选文本里被命中的原文，供前端高亮
function matchItem(item, fragments, query, isPinyinInput) {
  const text = item.text.toLowerCase()
  for (const fragment of fragments) {
    const position = text.indexOf(fragment)
    if (position !== -1) {
      return {
        reason: position === 0 ? REASON_TEXT_PREFIX : REASON_TEXT_INCLUDE,
        length: fragment.length,
        matched: item.text.slice(position, position + fragment.length)
      }
    }

    // 命中同时匹配小石榴号，账号不出现在展示文本里，无从高亮
    const altPosition = item.alt ? item.alt.indexOf(fragment) : -1
    if (altPosition !== -1) {
      return {
        reason: altPosition === 0 ? REASON_TEXT_PREFIX : REASON_TEXT_INCLUDE,
        length: fragment.length,
        matched: ''
      }
    }
  }

  if (!isPinyinInput) return null
  if (item.full.startsWith(query)) return { reason: REASON_PINYIN_FULL, length: query.length, matched: '' }
  if (item.initials.startsWith(query)) return { reason: REASON_PINYIN_INITIALS, length: query.length, matched: '' }
  return null
}

function search(list, fragments, query, isPinyinInput, limit) {
  // 组内按文本去重，保留热度更高的一条
  const matched = new Map()
  for (const item of list) {
    const hit = matchItem(item, fragments, query, isPinyinInput)
    if (!hit) continue
    const existing = matched.get(item.text)
    if (!existing || item.count > existing.item.count) {
      matched.set(item.text, { item, ...hit })
    }
  }

  const hits = Array.from(matched.values())
  hits.sort((a, b) =>
    b.length - a.length ||
    a.reason - b.reason ||
    b.item.count - a.item.count ||
    a.item.text.length - b.item.text.length ||
    (a.item.text < b.item.text ? -1 : a.item.text > b.item.text ? 1 : 0)
  )
  return hits.slice(0, limit)
}

async function loadCandidates() {
  const [tagResult, postResult, userResult] = await Promise.all([
    // 只加载有效标签：至少被一篇已发布笔记（posts.status=0）使用，避免推荐出点了搜不到结果的空标签
    pool.query(
      `SELECT t.name, t.use_count
         FROM tags t
        WHERE EXISTS (
          SELECT 1 FROM post_tags pt
            JOIN posts p ON p.id = pt.post_id
           WHERE pt.tag_id = t.id AND p.status = 0
        )
        ORDER BY t.use_count DESC
        LIMIT ?`,
      [MAX_TAGS]
    ),
    pool.query("SELECT id, title, like_count FROM posts WHERE status = 0 AND title <> '' ORDER BY like_count DESC LIMIT ?", [MAX_POSTS]),
    pool.query('SELECT user_id, nickname, fans_count FROM users WHERE is_active = 1 ORDER BY id LIMIT ?', [MAX_USERS])
  ])

  const tags = tagResult[0].map(row => ({
    text: row.name,
    count: row.use_count || 0,
    ...toPinyin(row.name)
  }))

  const posts = postResult[0].map(row => ({
    text: row.title,
    id: row.id,
    count: row.like_count || 0,
    ...toPinyin(row.title)
  }))

  const users = userResult[0].map(row => ({
    text: row.nickname,
    userId: row.user_id,
    alt: (row.user_id || '').toLowerCase(),
    count: row.fans_count || 0,
    ...toPinyin(row.nickname)
  }))

  return { tags, posts, users }
}

async function refresh() {
  if (refreshing) return
  refreshing = true
  try {
    // 先构建完整索引再整体替换，避免读到半成品
    const next = await loadCandidates()
    index = next
    ready = true
  } catch (err) {
    console.error('搜索联想索引构建失败:', err)
  } finally {
    refreshing = false
  }
}

function startSuggestService() {
  getSegmenter()
  refresh()
  if (timer) clearInterval(timer)
  timer = setInterval(refresh, REFRESH_INTERVAL)
}

function getSuggestions(keyword, limit = 5) {
  const empty = { tags: [], posts: [], users: [] }
  try {
    const query = String(keyword || '').trim().toLowerCase().slice(0, MAX_KEYWORD_LENGTH)
    if (!query || !ready) return empty

    const size = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10)
    const isPinyinInput = PINYIN_INPUT.test(query)
    const fragments = extractFragments(query)

    return {
      tags: search(index.tags, fragments, query, isPinyinInput, size)
        .map(hit => ({ text: hit.item.text, count: hit.item.count, matched: hit.matched })),
      posts: search(index.posts, fragments, query, isPinyinInput, size)
        .map(hit => ({ text: hit.item.text, id: hit.item.id, count: hit.item.count, matched: hit.matched })),
      users: search(index.users, fragments, query, isPinyinInput, size)
        .map(hit => ({ text: hit.item.text, userId: hit.item.userId, count: hit.item.count, matched: hit.matched }))
    }
  } catch (err) {
    console.error('搜索联想查询失败:', err)
    return empty
  }
}

module.exports = {
  startSuggestService,
  getSuggestions
}
