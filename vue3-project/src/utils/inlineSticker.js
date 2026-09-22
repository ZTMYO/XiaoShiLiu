/**
 * 行内表情包
 *
 * 落库形态是纯文本标记 [st:packId/itemId]：可搜索；
 * 编辑器与渲染器再把标记换成 <img class="inline-sticker">，像 emoji 字符一样行内排版。
 * 复制/剪切时由 stickerClipboardPayload 改写剪贴板，两个负载都是同一份标记明文，
 * 粘回编辑器能重新渲染。
 * img 只借它的行内替换元素身份（原生选区、基线、退格整块删除），真图是用雪碧图裁切画在背景上的，
 * 所以不用为每个表情生成单图。尺寸与基线由 index.css 给，背景偏移按包现算。查不到的表情保留标记明文。
 */
import { findSticker, rowsOf } from '@/components/emoji-picker/stickers'

// 与 index.css 里 .inline-sticker 的尺寸保持一致（canvas 绘制也用这个倍数）
const SIZE_EM = 1.2

// src 必须是一张能加载出来的空图：留空或 404 时浏览器会显示 alt 破图，盖掉背景上的表情
const BLANK_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const MARKER_PATTERN = '\\[st:([a-z0-9_-]+)/([a-z0-9_-]+)\\]'
const MARKER_RE = new RegExp(MARKER_PATTERN, 'gi')
const SINGLE_MARKER_RE = new RegExp(`^${MARKER_PATTERN}$`, 'i')
const ANY_MARKER_RE = new RegExp(MARKER_PATTERN, 'i')

export const stickerMarker = (packId, itemId) => `[st:${packId}/${itemId}]`

// 整张雪碧图缩到 columns * SIZE_EM，一格正好等于 SIZE_EM
function styleOf(pack, item) {
  return [
    'background-repeat:no-repeat',
    `background-image:url(${pack.sheet})`,
    `background-size:${pack.columns * SIZE_EM}em ${rowsOf(pack) * SIZE_EM}em`,
    `background-position:${-item.x * SIZE_EM}em ${-item.y * SIZE_EM}em`
  ].join(';')
}

// 构造行内表情节点；表情不存在时返回 null，由调用方保留明文
export function createStickerImg(packId, itemId) {
  const found = findSticker(packId, itemId)
  if (!found) return null

  const img = document.createElement('img')
  img.className = 'inline-sticker'
  img.setAttribute('data-sticker', `${packId}/${itemId}`)
  img.src = BLANK_PIXEL
  // alt 就是标记明文：复制到纯文本场景拿到的就是它
  img.alt = stickerMarker(packId, itemId)
  // img 天然原子（光标进不去、退格一次删整块），不要设 contenteditable=false：
  // Chrome 里一次删除若同时涉及非编辑元素和文字，整条撤销记录会失效（Ctrl+X 后 Ctrl+Z 无反应）
  img.draggable = false
  img.style.cssText = styleOf(found.pack, found.item)
  return img
}

// data-sticker 存精简的「包/序号」，alt 存完整标记明文，两种格式都要认。
// 不能用 a || b 短路取值：拿标记正则去匹配精简格式必然失败，alt 就永远读不到了
const STICKER_PAIR_RE = /^([a-z0-9_-]+)\/([a-z0-9_-]+)$/i

// 从节点里认出是哪个表情：优先 data-sticker，退而取 alt
function matchStickerId(el) {
  const pair = STICKER_PAIR_RE.exec((el.getAttribute('data-sticker') || '').trim())
  if (pair) return pair
  return SINGLE_MARKER_RE.exec((el.getAttribute('alt') || '').trim())
}

// 从已有节点重建（可能来自别的页面，类名之外的属性样式一律丢弃）
export function stickerImgFromNode(el) {
  const matched = matchStickerId(el)
  return matched ? createStickerImg(matched[1], matched[2]) : null
}

// 节点对应的标记明文（编辑器落库用）
export function stickerMarkerFromNode(el) {
  const matched = matchStickerId(el)
  return matched ? stickerMarker(matched[1], matched[2]) : ''
}

// 整串就是一个标记时换成人节点，否则返回 null
export function stickerNodeFromText(text) {
  const matched = SINGLE_MARKER_RE.exec(text)
  return matched ? createStickerImg(matched[1], matched[2]) : null
}

// 把 root 里的标记明文换成行内表情，并重建已有的 .inline-sticker 节点
export function hydrateStickers(root) {
  if (!root || !root.querySelectorAll) return

  root.querySelectorAll('img.inline-sticker').forEach((el) => {
    const img = stickerImgFromNode(el)
    el.parentNode.replaceChild(img || document.createTextNode(el.alt || ''), el)
  })

  const textNodes = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    MARKER_RE.lastIndex = 0
    if (MARKER_RE.test(walker.currentNode.nodeValue)) textNodes.push(walker.currentNode)
  }

  textNodes.forEach((node) => {
    const source = node.nodeValue
    const fragment = document.createDocumentFragment()
    let cursor = 0

    MARKER_RE.lastIndex = 0
    source.replace(MARKER_RE, (match, packId, itemId, offset) => {
      if (offset > cursor) fragment.appendChild(document.createTextNode(source.slice(cursor, offset)))
      fragment.appendChild(createStickerImg(packId, itemId) || document.createTextNode(match))
      cursor = offset + match.length
      return match
    })
    if (cursor < source.length) fragment.appendChild(document.createTextNode(source.slice(cursor)))

    node.parentNode.replaceChild(fragment, node)
  })
}

// 名称里可用空格写同义词，取第一个当主名
function stickerName(packId, itemId) {
  return findSticker(packId, itemId)?.item.name.trim().split(/\s+/)[0] || ''
}

// 换成中文名，给图片的 RAG 描述用，如「今天好开心[大笑]」
export function stickerMarkersToText(text) {
  if (!text) return ''
  return text.replace(MARKER_RE, (match, packId, itemId) => `[${stickerName(packId, itemId) || '表情'}]`)
}

export const hasStickerMarker = (text) => {
  if (!text || typeof text !== 'string') return false
  const pivot = text.indexOf('[st:')
  if (pivot === -1) return false
  const closeBracket = text.indexOf(']', pivot + 4)
  if (closeBracket === -1) return false
  const middle = text.slice(pivot + 4, closeBracket)
  const slashPos = middle.indexOf('/')
  if (slashPos === -1) return false
  return true
}

// 纯文本场景（标题这类）直接过滤掉标记
export function stripStickerMarkers(text) {
  if (!text) return ''
  return text.replace(MARKER_RE, '')
}

// ── 复制 / 剪切 ──
// 浏览器序列化选区时会把 <img> 丢掉，只有自己写剪贴板才能把表情带走。
// 两个负载都写落库明文标记 [st:packId/itemId]：包和格子都带上了，
// 粘回编辑器由 hydrateStickers 还原成小图，粘到别处（记事本、标题框）就是可读可过滤的明文。

const HTML_ESCAPE_RE = /[&<>"]/g
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

const escapeHtml = (text) => text.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPES[char])

// 把一个行块里的节点拆进 line 的三个累加器：html / text / 表情计数
function serializeForClipboard(node, line) {
  if (node.nodeType === Node.TEXT_NODE) {
    line.html.push(escapeHtml(node.nodeValue))
    line.text.push(node.nodeValue)
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return

  const tag = node.tagName

  if (tag === 'IMG') {
    const marker = stickerMarkerFromNode(node)
    if (!marker) return
    line.html.push(escapeHtml(marker))
    line.text.push(marker)
    line.stickers += 1
    return
  }

  if (tag === 'BR') {
    line.html.push('<br>')
    line.text.push('\n')
    return
  }

  // @提及在编辑器里是带属性的 <a>，重建时只留粘贴分支认得的字段
  if (tag === 'A' && node.classList.contains('mention-link')) {
    const userId = node.getAttribute('data-user-id')
    if (userId) {
      const id = escapeHtml(userId)
      line.html.push(`<a class="mention-link" data-user-id="${id}" href="/user/${id}" contenteditable="false">${escapeHtml(node.textContent)}</a>`)
    }
    line.text.push(node.textContent)
    return
  }

  Array.from(node.childNodes).forEach((child) => serializeForClipboard(child, line))
}

// 选区里没有行内表情时返回 null，由调用方把剪贴板交还浏览器原生行为。
// 逐行取选区与顶层行块的交集：cloneContents 只给内容不给行块包装，跨行选区直接用它会被粘成一行。
export function stickerClipboardPayload(root, range) {
  if (!root || !range || range.collapsed) return null

  const cloned = range.cloneContents()
  const hasStickersDirect =
    cloned.nodeType === Node.ELEMENT_NODE &&
    cloned.classList &&
    cloned.classList.contains('inline-sticker')
      ? 1
      : (cloned.querySelectorAll && cloned.querySelectorAll('img.inline-sticker').length)

  const lines = []
  if (!hasStickersDirect) {
    const topLevelBlocks = Array.from(root.childNodes)
    const hasLineBlocks = topLevelBlocks.some(
      (n) => n.nodeType === Node.ELEMENT_NODE && (n.tagName === 'DIV' || n.tagName === 'P')
    )
    if (!hasLineBlocks) return null

    topLevelBlocks.forEach((child) => {
      if (!range.intersectsNode(child)) return
      const lineRange = document.createRange()
      lineRange.selectNodeContents(child)
      if (child.contains(range.startContainer)) lineRange.setStart(range.startContainer, range.startOffset)
      if (child.contains(range.endContainer)) lineRange.setEnd(range.endContainer, range.endOffset)
      const line = { html: [], text: [], stickers: 0 }
      Array.from(lineRange.cloneContents().childNodes).forEach((node) => serializeForClipboard(node, line))
      lines.push(line)
    })
    if (!lines.some((line) => line.stickers)) return null
  } else {
    const line = { html: [], text: [], stickers: 0 }
    Array.from(cloned.childNodes).forEach((node) => serializeForClipboard(node, line))
    if (line.stickers === 0) return null
    lines.push(line)
  }

  return {
    html: lines.map((line) => `<div>${line.html.join('') || '<br>'}</div>`).join(''),
    text: lines.map((line) => line.text.join('')).join('\n')
  }
}

// 按标记拆成可逐段绘制/度量的片段
export function splitStickerSegments(line) {
  const segments = []
  let cursor = 0

  MARKER_RE.lastIndex = 0
  line.replace(MARKER_RE, (match, packId, itemId, offset) => {
    if (offset > cursor) segments.push({ type: 'text', value: line.slice(cursor, offset) })
    segments.push({ type: 'sticker', packId, itemId, raw: match })
    cursor = offset + match.length
    return match
  })
  if (cursor < line.length) segments.push({ type: 'text', value: line.slice(cursor) })
  return segments
}

// canvas 逐格抠雪碧图需要的信息
export function stickerDrawInfo(packId, itemId) {
  const found = findSticker(packId, itemId)
  if (!found) return null
  const { pack, item } = found
  return { sheet: pack.sheet, columns: pack.columns, rows: rowsOf(pack), x: item.x, y: item.y }
}

// 行内表情相对于字号的倍数，canvas 绘制与 CSS 共用同一个值
export const STICKER_EM = SIZE_EM
