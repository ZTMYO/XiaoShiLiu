/**
 * 推荐流 / 分类频道的排序。
 *
 *   1. 打分：互动量（点赞/收藏/评论/浏览）取 log 后加权 × 时间衰减，越老分越低
 *   2. 洗牌：按 seed 洗牌 —— 刷新换 seed 就换一批，翻页沿用同一个 seed 所以不会重复
 *   3. 打散：同页同一作者最多 MAX_PER_AUTHOR 篇，被挤掉的顺延到后面
 *   4. 候选池就是全部笔记，不设互动门槛，笔记再少也不会空页
 *
 * 阈值都在下面，要调改这里。
 */

const CANDIDATE_SIZE = 300        // 推荐流候选池大小（按热度取前 N 条）
const CATEGORY_POOL_LIMIT = 3000  // 分类频道池子上限（实际上等于该分类全部笔记，只是防爆）
const W_LIKE = 3                  // 各信号权重（log 空间）
const W_COLLECT = 4
const W_COMMENT = 3
const W_VIEW = 0.8
const DECAY_SCALE_DAYS = 30       // 时间衰减尺度
const GRAVITY = 0.8               // 衰减指数
const MAX_PER_AUTHOR = 2          // 同页同一作者最多几篇

/** 把任意 seed（字符串/数字）折成 32 位整数 */
function hashSeed(input) {
  let h = 2166136261
  const s = String(input)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32：小、快、可复现的伪随机 */
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 一条笔记的排序分（互动量取 log，免得浏览量把别的信号压死） */
function scoreOf(p, nowMs = Date.now()) {
  const view = Number(p.view_count) || 0
  const like = Number(p.like_count) || 0
  const collect = Number(p.collect_count) || 0
  const comment = Number(p.comment_count) || 0

  const quality = W_LIKE * Math.log1p(like)
    + W_COLLECT * Math.log1p(collect)
    + W_COMMENT * Math.log1p(comment)
    + W_VIEW * Math.log1p(view / 20)

  const createdMs = p.created_at ? new Date(p.created_at).getTime() : nowMs
  const ageDays = Math.max(0, (nowMs - createdMs) / 86400000)
  const decay = 1 / Math.pow(1 + ageDays / DECAY_SCALE_DAYS, GRAVITY)

  return quality * decay
}

/** 按 seed 洗牌（原地），同一 seed 结果一致 */
function shuffleBy(arr, seed) {
  const rand = mulberry32(seed)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
  }
  return arr
}

/** 洗牌 + 同页同作者打散 + 切出这一页（推荐流与分类流共用） */
function buildShuffledPage({ items, seed, limit, offset }) {
  const shuffled = shuffleBy(items.slice(), seed)

  const picked = []
  const deferred = []
  let authorCount = new Map()
  let windowSize = 0
  const take = (x) => {
    const author = Number(x.p.user_id)
    if ((authorCount.get(author) || 0) >= MAX_PER_AUTHOR) return false
    picked.push(x)
    authorCount.set(author, (authorCount.get(author) || 0) + 1)
    if (++windowSize >= limit) { windowSize = 0; authorCount = new Map() }
    return true
  }
  for (const x of shuffled) if (!take(x)) deferred.push(x)
  // 打散挤掉的顺延一轮后强制收下：一条都不能丢，丢了翻页会错位
  for (const x of deferred) {
    if (take(x)) continue
    picked.push(x)
    const author = Number(x.p.user_id)
    authorCount.set(author, (authorCount.get(author) || 0) + 1)
    if (++windowSize >= limit) { windowSize = 0; authorCount = new Map() }
  }

  return {
    ids: picked.slice(offset, offset + limit).map(x => x.p.id),
    total: items.length
  }
}

/**
 * 推荐流：打分 → 排序 → 洗牌切页
 * @param {object[]} opts.posts  候选池（SQL 侧已按热度截到 CANDIDATE_SIZE）
 * @param {number}   opts.seed   随机种子：刷新换一个，翻页沿用同一个
 */
function buildRecommendOrder({ posts, seed, limit, offset }) {
  if (!Array.isArray(posts) || posts.length === 0) return { ids: [], total: 0 }

  // 时间取整到小时且整轮只取一次：毫秒级差异会让几乎同分的笔记换个顺序，翻页就重复了
  const nowMs = Math.floor(Date.now() / 3600000) * 3600000

  const ranked = posts
    .map(p => ({ p, score: Math.round(scoreOf(p, nowMs) * 1e6) / 1e6 }))
    .sort((a, b) => b.score - a.score || (b.p.id - a.p.id))

  return buildShuffledPage({ items: ranked, seed, limit, offset })
}

/** 分类频道：基础顺序由 SQL 给（按时间倒序），这里只做洗牌与打散 */
function buildCategoryOrder({ posts, seed, limit, offset }) {
  if (!Array.isArray(posts) || posts.length === 0) return { ids: [], total: 0 }
  return buildShuffledPage({ items: posts.map(p => ({ p })), seed, limit, offset })
}

module.exports = {
  CANDIDATE_SIZE, CATEGORY_POOL_LIMIT, hashSeed, mulberry32, scoreOf, shuffleBy,
  buildShuffledPage, buildRecommendOrder, buildCategoryOrder
}
