// 轻量级 Markdown → HTML 渲染器
// 覆盖本站 API 文档实际使用的语法：标题/段落/表格/列表/围栏代码块/行内样式等，
// 同时收集标题结构用于生成页面目录。

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] || ch)
}

export function slugify(text) {
  const slug = String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'section'
}

// 将行内文本转为纯文本（用于标题锚点、搜索匹配）
function inlineToPlain(text) {
  return String(text)
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)\s]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1$2')
    .replace(/~~([^~]+)~~/g, '$1')
    .trim()
}

// 渲染行内样式：行内代码/加粗/斜体/删除线/链接/图片
function renderInline(text) {
  const codeSpans = []
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code)
    return `\u0000${codeSpans.length - 1}\u0000`
  })
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<img src="$2" alt="$1" loading="lazy" />')
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  html = html.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return html.replace(/\u0000(\d+)\u0000/g, (_, index) => `<code>${codeSpans[Number(index)]}</code>`)
}

const LIST_RE = /^(\s*)([-*+]|\d{1,3}[.、)])\s+/
const TABLE_SEPARATOR_RE = /^\s*\|?[\s:|-]+\|?\s*$/
const HEADING_RE = /^(#{1,6})\s+(.*)$/

function splitLines(md) {
  return String(md).replace(/\r\n?/g, '\n').split('\n')
}

function isFenceLine(line) {
  return /^\s{0,3}(```|~~~)/.test(line)
}

function isTableStart(lines, i) {
  const line = lines[i]
  return line.includes('|') && i + 1 < lines.length && TABLE_SEPARATOR_RE.test(lines[i + 1])
}

function isBlockBoundary(lines, i) {
  const line = lines[i]
  return (
    !line.trim() ||
    isFenceLine(line) ||
    HEADING_RE.test(line) ||
    isTableStart(lines, i) ||
    LIST_RE.test(line) ||
    /^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)
  )
}

// 将整篇 Markdown 渲染为 HTML，并返回标题结构（用于目录与锚点跳转）
export function renderMarkdown(md) {
  const lines = splitLines(md)
  const total = lines.length
  const out = []
  const toc = []
  const usedIds = new Map()
  let i = 0

  const uniqueId = (base) => {
    const count = usedIds.get(base) || 0
    usedIds.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }

  const flushParagraph = (start) => {
    if (i <= start) return
    const content = lines.slice(start, i).join(' ').trim()
    if (content) out.push(`<p>${renderInline(content)}</p>`)
  }

  // 单元格里的 \| 是内容中的竖线（命令管道符常见），先换成占位符，避免被当成列分隔符
  const splitRow = (row) =>
    row
      .replace(/\\\|/g, '\u0001')
      .replace(/^\s*\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map((cell) => cell.trim().replace(/\u0001/g, '|'))

  const renderTable = (start) => {
    const tableLines = []
    while (i < total && lines[i].includes('|')) {
      tableLines.push(lines[i])
      i++
    }
    if (tableLines.length < 2) return
    const header = splitRow(tableLines[0])
    // 分隔行（|---|---|）只用来界定表头，不能当作数据行渲染
    const body = tableLines.slice(1).map(splitRow).filter((cells) => !isSeparatorRow(cells))
    out.push('<div class="table-wrap"><table>')
    out.push(`<thead><tr>${header.map((h) => `<th>${renderInline(h)}</th>`).join('')}</tr></thead>`)
    out.push(`<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`)
    out.push('</table></div>')
  }

  // 收集一段连续列表；支持列表项内的续行文本
  const renderList = (start) => {
    const ordered = /^\s*\d{1,3}[.、)]\s+/.test(lines[start])
    const tag = ordered ? 'ol' : 'ul'
    const items = []
    let current = []
    let baseIndent = (lines[start].match(/^\s*/) || [''])[0].length

    const closeItem = () => {
      if (!current.length) return
      items.push(`<li>${renderInline(current.join(' ').trim())}</li>`)
      current = []
    }

    while (i < total) {
      const line = lines[i]
      const marker = line.match(LIST_RE)
      if (!line.trim()) break
      if (isFenceLine(line) || HEADING_RE.test(line) || isTableStart(lines, i) || /^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) break
      if (marker) {
        const indent = marker[1].length
        if (indent < baseIndent) break
        if (indent === baseIndent) {
          closeItem()
          current.push(line.replace(LIST_RE, '').trim())
          i++
          continue
        }
      }
      current.push(line.trim())
      i++
    }
    closeItem()
    out.push(`<${tag}>${items.join('')}</${tag}>`)
  }

  while (i < total) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    if (isFenceLine(line)) {
      const lang = line.trim().replace(/^```|^~~~/, '').trim()
      const codeLines = []
      i++
      while (i < total && !isFenceLine(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      i++
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : ''
      out.push(`<pre class="code-block"><code${cls}>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    const heading = line.match(HEADING_RE)
    if (heading) {
      const level = heading[1].length
      const text = heading[2].trim()
      const plain = inlineToPlain(text)
      const id = uniqueId(slugify(plain))
      toc.push({ level, id, text: plain })
      out.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`)
      i++
      continue
    }

    if (/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr />')
      i++
      continue
    }

    if (isTableStart(lines, i)) {
      renderTable(i)
      continue
    }

    if (LIST_RE.test(line)) {
      renderList(i)
      continue
    }

    const paragraphStart = i
    i++
    while (i < total && !isBlockBoundary(lines, i)) {
      i++
    }
    flushParagraph(paragraphStart)
  }

  return { html: out.join('\n'), toc }
}

// 分隔行（|---|---|）只用来界定表头，不能当作数据行渲染
function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c))
}

export default renderMarkdown
