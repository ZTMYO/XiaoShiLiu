<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteHeader from '@/components/site/SiteHeader.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { getDocs, getDocByName } from '@/api/system.js'
import { renderMarkdown } from '@/utils/markdown.js'
import { useSiteLang, DOC_LANGS } from '@/composables/useSiteLang'

const route = useRoute()
const router = useRouter()
const { lang, setLang } = useSiteLang()

// 带语言层访问时（/en/doc/api、/zh-Hant/doc/api）先按 URL 对齐语言，避免先按旧语言拉一次文档
const initialLang = route.params.lang
if (initialLang && initialLang !== lang.value && DOC_LANGS.some((item) => item.value === initialLang)) {
  setLang(initialLang)
}

const docs = ref([])
const docMeta = ref(null)
const html = ref('')
const toc = ref([])
const loading = ref(false)
const error = ref('')
const progress = ref(0)
const activeId = ref('')
const activeChapterId = ref('')
const mainRef = ref(null)
const menuOpen = ref(false)

// 左侧文档树：每篇文档展开后列出它的二级章节
const treeSections = ref({})
const treeLoading = ref({})
const expandedNames = ref({})
let pendingAnchor = ''

// 层级扁平、与右侧目录重复度高的文档不再拆分二级
const FLAT_DOCS = ['overview', 'database']
const isSplittable = (name) => !FLAT_DOCS.includes(name)

// /doc 不带文档名时落到总览
const DEFAULT_DOC = 'overview'

const isExpanded = (name) => !!expandedNames.value[name]
const isLoadingSections = (name) => !!treeLoading.value[name]
const sectionsOf = (name) => treeSections.value[name] || []

const currentName = computed(() => route.params.name || DEFAULT_DOC)

// 语言层前缀：URL 已带 /zh、/en 时保持，未带时不主动加
const langPrefix = computed(() => (route.params.lang ? `/${route.params.lang}` : ''))
const docPath = (name) => (name ? `${langPrefix.value}/doc/${name}` : `${langPrefix.value}/doc`)
const langLabel = computed(() => (DOC_LANGS.find((item) => item.value === lang.value) || {}).label || '')

const visibleToc = computed(() => toc.value.filter((item) => item.level > 1))

const chapters = computed(() => toc.value.filter((item) => item.level === 2))
const isPaged = computed(() => isSplittable(currentName.value) && chapters.value.length > 0)
const chapterIndex = computed(() => {
  const index = chapters.value.findIndex((item) => item.id === activeChapterId.value)
  return index === -1 ? 0 : index
})

const chapterPager = computed(() => {
  if (!isPaged.value) return { prev: null, next: null }
  const list = chapters.value
  const index = chapterIndex.value
  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null
  }
})

const activeH2 = computed(() => chapters.value.find((item) => item.id === activeChapterId.value) || null)

const sectionToc = computed(() => {
  const list = visibleToc.value
  // 不拆分的文档没有章节概念，直接列出全部二级标题
  if (!isSplittable(currentName.value)) return list.filter((item) => item.level === 2)
  const start = list.findIndex((item) => item.id === activeChapterId.value)
  if (start === -1) return []
  const items = []
  for (let i = start + 1; i < list.length; i++) {
    if (list[i].level === 2) break
    items.push(list[i])
  }
  return items
})

const tocTitle = computed(() => (isPaged.value && activeH2.value ? activeH2.value.text : '目录'))

// 文档翻页按左侧顺序，可拆分的文档读完最后一章才出现
const isLastChapter = computed(() => !isPaged.value || chapterIndex.value === chapters.value.length - 1)

const pager = computed(() => {
  const index = docs.value.findIndex((item) => item.name === currentName.value)
  return {
    prev: index > 0 ? docs.value[index - 1] : null,
    next: index > -1 && index < docs.value.length - 1 ? docs.value[index + 1] : null
  }
})

// 章节翻页与文档翻页共用同一行：读完最后一章时，左右两侧的「上/下一篇」才接管
const readingNav = computed(() => {
  const chapter = chapterPager.value
  const doc = pager.value
  const atLast = isLastChapter.value
  const asChapter = (item, label) => (item ? { label, href: `#${item.id}`, title: item.text, id: item.id } : null)
  const asDoc = (item, label) => (item ? { label, href: docPath(item.name), title: item.title, name: item.name } : null)
  return {
    prev: chapter.prev ? asChapter(chapter.prev, '上一章') : atLast ? asDoc(doc.prev, '上一篇') : null,
    next: !atLast && chapter.next ? asChapter(chapter.next, '下一章') : atLast ? asDoc(doc.next, '下一篇') : null
  }
})

// 拆出正文大标题，便于把语言与更新时间插到标题下方
const titleHtml = computed(() => {
  const end = html.value.indexOf('</h1>')
  return end === -1 ? '' : html.value.slice(0, end + 5)
})

// 面包屑中间层取文档自身标题，跟随语言版本变化
const currentDocTitle = computed(() => titleHtml.value.replace(/<[^>]+>/g, '').trim())

const bodyChunks = computed(() => {
  const end = html.value.indexOf('</h1>')
  const body = end === -1 ? html.value : html.value.slice(end + 5)
  // 第 0 块是导语，之后每块对应一个二级标题
  return body.split(/(?=<h2 id=")/)
})

// 可拆分的文档一次只渲染当前章节，其余文档整篇渲染
const pageHtml = computed(() => {
  const chunks = bodyChunks.value
  if (!isPaged.value) return chunks.join('')
  const index = chapterIndex.value
  const chunk = chunks[index + 1] || ''
  // 第一章连带导语一起展示
  const html = index === 0 ? (chunks[0] || '') + chunk : chunk
  // 分页后章节末尾原有的分隔线与翻页区上边框重复，去掉
  return html.replace(/(?:\s*<hr\s*\/?>)+\s*$/, '')
})

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('zh-CN') : '')

// 响应示例的标签段与其后的代码块合并成可折叠区域
const RESPONSE_EXAMPLE_RE = /<p><strong>([^<]*(?:响应示例|響應示例|Response Example))<\/strong>[:：]<\/p>\s*(<pre class="code-block">[\s\S]*?<\/pre>)/g

const foldResponseExamples = (html) =>
  html.replace(
    RESPONSE_EXAMPLE_RE,
    (_, label, block) => `<details class="fold"><summary><strong>${label}</strong>:</summary>${block}</details>`
  )

// 接口信息：请求方法 + 路径 + 认证要求，去掉「接口地址」「需要认证」这些标签文字
const HTTP_METHODS = 'GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS'
const API_ENDPOINT_ROW_RE = new RegExp(`<p><strong>[^<]*</strong>:\\s*<code>((${HTTP_METHODS})\\s+[^<]+)</code>([\\s\\S]*?)</p>`, 'g')
// 认证标签：中英繁三种写法都含「认证 / 認證 / Auth」
const API_AUTH_PAIR_RE = /<strong>[^<]*(?:认证|認證|Auth)[^<]*<\/strong>:\s*([^<]*?)\s*$/
const API_AUTH_ROW_RE = /<p><strong>[^<]*(?:认证|認證|Auth)[^<]*<\/strong>:\s*([^<]*?)<\/p>/g
const API_METHOD_CODE_RE = new RegExp(`<code>((${HTTP_METHODS})\\s+)([^<]+)<\\/code>`, 'g')

const AUTH_LABELS = {
  zh: { yes: '需要认证', no: '无需认证' },
  en: { yes: 'Auth Required', no: 'No Auth' },
  'zh-Hant': { yes: '需要認證', no: '無需認證' }
}

const authPill = (value) => {
  const labels = AUTH_LABELS[lang.value] || AUTH_LABELS.zh
  const required = /^(是|yes|true)/i.test((value || '').trim())
  return `<span class="api-auth${required ? ' required' : ''}">${required ? labels.yes : labels.no}</span>`
}

const methodPath = (method, path) => `<span class="api-method">${method.trim()}</span><code class="api-path">${path}</code>`

// 认证要求写成独立段落时（中间可能夹着功能说明），并入它所属的接口信息行
const mergeAuthRows = (html) => {
  const edits = []
  for (const match of html.matchAll(API_AUTH_ROW_RE)) {
    const divStart = html.lastIndexOf('<div class="api-meta">', match.index)
    if (divStart === -1) continue
    const divEnd = html.indexOf('</div>', divStart)
    // 找不到接口行，或接口行在认证段之后，说明这一段不属于任何接口
    if (divEnd === -1 || divEnd > match.index) continue
    edits.push({ from: match.index, to: match.index + match[0].length, at: divEnd, text: authPill(match[1]) })
  }
  // 从后往前写回，避免前面的下标失效
  for (let i = edits.length - 1; i >= 0; i--) {
    const { from, to, at, text } = edits[i]
    html = html.slice(0, from) + html.slice(to)
    html = html.slice(0, at) + text + html.slice(at)
  }
  return html
}

const formatApiMeta = (html) => {
  const out = html.replace(API_ENDPOINT_ROW_RE, (_, endpoint, __, tail) => {
    let rest = tail
    let auth = null
    const pair = rest.match(API_AUTH_PAIR_RE)
    if (pair) {
      auth = pair[1]
      rest = rest.slice(0, pair.index)
    }
    // 备用地址也拆成方法 tag + 路径
    rest = rest.replace(API_METHOD_CODE_RE, (_, __, method, path) => methodPath(method, path))
    const [method, ...paths] = endpoint.trim().split(/\s+/)
    return `<div class="api-meta">${methodPath(method, paths.join(' '))}${rest}${auth === null ? '' : authPill(auth)}</div>`
  })
  return mergeAuthRows(out)
}

async function loadDocs() {
  const res = await getDocs()
  if (res.success) {
    docs.value = res.data.items || []
  }
}

async function loadDoc() {
  loading.value = true
  error.value = ''
  const res = await getDocByName(currentName.value, lang.value)
  if (res.success) {
    docMeta.value = res.data
    const rendered = renderMarkdown(res.data.content)
    html.value = formatApiMeta(foldResponseExamples(rendered.html))
    toc.value = rendered.toc
    treeSections.value[currentName.value] = rendered.toc.filter((item) => item.level === 2)
  } else {
    error.value = res.message || '文档加载失败'
  }
  // hash 指向章节内的子标题时，先切到它所属的章节
  const anchor = pendingAnchor || readHash()
  pendingAnchor = ''
  activeChapterId.value = chapterIdOf(anchor)
  loading.value = false
  await nextTick()
  if (!anchor || !scrollToSection(anchor, { syncHash: false })) {
    if (mainRef.value) mainRef.value.scrollTop = 0
  }
  updateScrollState()
}

// 展开某篇文档时按需拉取原文，取它的二级标题作为子项
async function ensureSections(name) {
  if (treeSections.value[name]) return
  treeLoading.value[name] = true
  const res = await getDocByName(name, lang.value)
  treeLoading.value[name] = false
  if (!res.success) return
  treeSections.value[name] = renderMarkdown(res.data.content).toc.filter((item) => item.level === 2)
}

async function toggleDoc(name) {
  if (expandedNames.value[name]) {
    expandedNames.value[name] = false
    return
  }
  expandedNames.value[name] = true
  await ensureSections(name)
}

// 同文档内切换章节，跨文档则等目标文档渲染完再切
function goSection(name, id) {
  menuOpen.value = false
  if (name === currentName.value) {
    goChapter(id)
    return
  }
  pendingAnchor = id
  router.push({ path: docPath(name), hash: `#${id}` })
}

// 滚动进度条 + 章节内子标题高亮：以正文滚动容器为基准
function updateScrollState() {
  const el = mainRef.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  progress.value = max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0

  const containerTop = el.getBoundingClientRect().top
  let current = ''
  for (const item of visibleToc.value) {
    const target = document.getElementById(item.id)
    if (!target) continue
    if (target.getBoundingClientRect().top - containerTop > 64) break
    current = item.id
  }
  activeId.value = current
}

// 锚点所属的二级章节，找不到时归到第一章
function chapterIdOf(anchorId) {
  const list = visibleToc.value
  const stop = list.findIndex((item) => item.id === anchorId)
  if (stop === -1) return chapters.value.length ? chapters.value[0].id : ''
  for (let i = stop; i >= 0; i--) {
    if (list[i].level === 2) return list[i].id
  }
  return ''
}

// 章节翻页：一次只渲染当前章节，切换后回到页面顶部
function goChapter(id) {
  if (!id || id === activeChapterId.value) return
  activeChapterId.value = id
  nextTick(() => {
    if (mainRef.value) mainRef.value.scrollTop = 0
    updateScrollState()
  })
  if (readHash() !== id) {
    router.push({ path: docPath(currentName.value), hash: `#${id}` })
  }
}

// 翻页项：章节项切章节，文档项换文档
function goPager(item) {
  if (!item) return
  if (item.name) {
    router.push(docPath(item.name))
    return
  }
  goChapter(item.id)
}

// 面包屑首页：/doc 与 /doc/overview 指向同一篇总览，路由参数不变不会重新加载，需手动回到阅读起点
function onCrumbHome(event) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  if (route.params.name && route.params.name !== DEFAULT_DOC) return
  event.preventDefault()
  pendingAnchor = ''
  goChapter(chapters.value[0]?.id || '')
  if (mainRef.value) mainRef.value.scrollTop = 0
  updateScrollState()
  const target = docPath()
  if (route.fullPath !== target) router.replace(target)
}

// 章节 id 可能是中文，取 hash 时解码
function readHash() {
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

// 定位章节，同时把 hash 写进 URL 便于复制分享与前进后退
function scrollToSection(id, { syncHash = true } = {}) {
  const target = document.getElementById(id)
  if (!target) return false
  target.scrollIntoView({ block: 'start' })
  if (syncHash && readHash() !== id) {
    router.push({ path: docPath(currentName.value), hash: `#${id}` })
  }
  return true
}

// 前进后退切换 hash 时跟随定位，目标在其他章节则先切过去
function handleHashChange() {
  const id = readHash()
  if (!id) return
  const chapter = chapterIdOf(id)
  if (chapter && chapter !== activeChapterId.value) {
    activeChapterId.value = chapter
    nextTick(() => {
      scrollToSection(id, { syncHash: false })
      updateScrollState()
    })
    return
  }
  scrollToSection(id, { syncHash: false })
}

watch([currentName, lang], loadDoc, { immediate: true })

// URL 语言层与全局语言状态互相驱动：地址栏或前进后退带层时跟随 URL，切换语言时补上层级
const routeLang = computed(() => route.params.lang || '')
watch(routeLang, (value) => {
  if (value && value !== lang.value && DOC_LANGS.some((item) => item.value === value)) setLang(value)
})

watch(lang, (value) => {
  if (route.params.lang === value) return
  const anchor = readHash()
  router.replace({ path: `/${value}/doc/${currentName.value}`, hash: anchor ? `#${anchor}` : '' })
})

// 当前文档默认展开，便于直接看到它的章节
watch(currentName, (name) => {
  if (isSplittable(name)) expandedNames.value[name] = true
}, { immediate: true })

// 切换语言后章节标题会变，缓存失效后按需重取（当前文档由 loadDoc 一并刷新）
watch(lang, () => {
  treeSections.value = {}
  Object.keys(expandedNames.value).forEach((name) => {
    if (expandedNames.value[name] && name !== currentName.value) ensureSections(name)
  })
})

onMounted(() => {
  loadDocs()
  window.addEventListener('hashchange', handleHashChange)
  if (mainRef.value) {
    mainRef.value.addEventListener('scroll', updateScrollState, { passive: true })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleHashChange)
  if (mainRef.value) {
    mainRef.value.removeEventListener('scroll', updateScrollState)
  }
})
</script>

<template>
  <div class="doc-page">
    <SiteHeader :progress="progress">
      <template #actions>
        <button type="button" class="doc-menu-btn" aria-label="章节菜单" @click="menuOpen = !menuOpen">
          <SvgIcon name="menu" width="18" height="18" />
        </button>
      </template>
    </SiteHeader>

    <div class="doc-body">
      <aside class="doc-side" :class="{ open: menuOpen }">
        <p class="doc-side-title">文档</p>
        <div v-for="item in docs" :key="item.name" class="doc-group" :class="{ open: isExpanded(item.name) }">
          <div class="doc-group-head" :class="{ active: item.name === currentName, 'no-toggle': !isSplittable(item.name) }">
            <button v-if="isSplittable(item.name)" type="button" class="doc-group-toggle"
              :aria-expanded="isExpanded(item.name)" @click="toggleDoc(item.name)">
              <SvgIcon name="right" class="doc-group-arrow" width="12" height="12" />
            </button>
            <RouterLink class="doc-group-title" :to="docPath(item.name)" @click="menuOpen = false">{{ item.title }}</RouterLink>
          </div>
          <div v-show="isExpanded(item.name)" class="doc-group-sections">
            <p v-if="isLoadingSections(item.name) && !sectionsOf(item.name).length" class="doc-group-status">加载中…</p>
            <a v-for="sec in sectionsOf(item.name)" :key="sec.id" class="doc-sub-item"
              :class="{ active: item.name === currentName && sec.id === activeChapterId }" :href="`#${sec.id}`"
              @click.prevent="goSection(item.name, sec.id)">
              {{ sec.text }}
            </a>
          </div>
        </div>
      </aside>

      <div v-if="menuOpen" class="doc-backdrop" @click="menuOpen = false"></div>

      <aside class="doc-toc">
        <div class="doc-toc-inner">
          <p class="doc-side-title">{{ tocTitle }}</p>
          <a v-for="item in sectionToc" :key="item.id" class="toc-item" :class="[`level-${item.level}`, { active: item.id === activeId }]"
            :href="`#${item.id}`" @click.prevent="scrollToSection(item.id)">
            {{ item.text }}
          </a>
        </div>
      </aside>

      <main class="doc-main" ref="mainRef">
        <p v-if="loading" class="doc-status">加载中…</p>
        <p v-else-if="error" class="doc-status">{{ error }}</p>
        <template v-else>
          <article class="doc-article">
            <nav class="doc-crumb" aria-label="面包屑">
              <RouterLink class="crumb-home" :to="docPath()" aria-label="文档首页" @click="onCrumbHome">
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                  <path
                    d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"
                    fill="currentColor"
                  />
                </svg>
              </RouterLink>
              <SvgIcon class="crumb-sep" name="right" width="12" height="12" />
              <span class="crumb-item">{{ currentDocTitle }}</span>
              <template v-if="isPaged && activeH2">
                <SvgIcon class="crumb-sep" name="right" width="12" height="12" />
                <span class="crumb-now">{{ activeH2.text }}</span>
              </template>
            </nav>
            <div v-html="titleHtml"></div>
            <div class="doc-meta">
              <span>{{ langLabel }}</span>
              <span v-if="docMeta?.updatedAt">更新于 {{ formatDate(docMeta.updatedAt) }}</span>
            </div>
            <div class="doc-content" v-html="pageHtml"></div>

            <nav v-if="readingNav.prev || readingNav.next" class="page-nav">
              <a v-if="readingNav.prev" class="pager-item" :href="readingNav.prev.href"
                @click.prevent="goPager(readingNav.prev)">
                <span class="pager-label">
                  <SvgIcon name="leftArrow" width="12" height="12" />
                  {{ readingNav.prev.label }}
                </span>
                <span class="pager-title">{{ readingNav.prev.title }}</span>
              </a>
              <a v-if="readingNav.next" class="pager-item pager-item-next" :href="readingNav.next.href"
                @click.prevent="goPager(readingNav.next)">
                <span class="pager-label">
                  {{ readingNav.next.label }}
                  <SvgIcon name="right" width="12" height="12" />
                </span>
                <span class="pager-title">{{ readingNav.next.title }}</span>
              </a>
            </nav>
          </article>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.doc-page {
  padding-top: 64px;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--bg-color-primary);
}

.doc-body {
  max-width: 1400px;
  height: 100%;
  margin: 0 auto;
}

/* ===== 侧边栏 ===== */
.doc-side {
  position: fixed;
  top: 64px;
  left: max(calc(50% - 700px), 0px);
  width: 264px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 28px 16px 48px 24px;
  box-sizing: border-box;
  border-right: 1px solid var(--border-color-primary);
}

.doc-side-title {
  margin: 0 0 8px;
  padding-left: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--text-color-quaternary);
}

/* ===== 右侧章节目录 ===== */
.doc-toc {
  position: fixed;
  top: 64px;
  right: max(calc(50% - 700px), 0px);
  width: 264px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 28px 24px 48px 0;
  box-sizing: border-box;
}

/* 分隔线跟着目录内容高度走，不拉满整屏 */
.doc-toc-inner {
  padding-left: 16px;
  border-left: 1px solid var(--border-color-primary);
}

/* ===== 左侧文档树：一级为文档，二级为它的章节 ===== */
.doc-group-head {
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.doc-group-head:hover {
  background: var(--bg-color-secondary);
}

.doc-group-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 22px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-color-quaternary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.doc-group-toggle:hover {
  color: var(--primary-color);
}

.doc-group-arrow {
  transition: transform 0.2s ease;
}

.doc-group.open .doc-group-arrow {
  transform: rotate(90deg);
}

.doc-group-title {
  flex: 1;
  min-width: 0;
  padding: 8px 8px 8px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
}

/* 不可拆分的文档没有展开箭头，标题左移对齐 */
.doc-group-head.no-toggle .doc-group-title {
  padding-left: 12px;
}

.doc-group-head:hover .doc-group-title {
  color: var(--text-color-primary);
}

.doc-group-head.active .doc-group-title,
.doc-group-head.active .doc-group-toggle {
  color: var(--primary-color);
}

.doc-group-head.active .doc-group-title {
  font-weight: 600;
}

.doc-group-sections {
  margin: 2px 0 6px 11px;
  padding-left: 6px;
  border-left: 1px solid var(--border-color-primary);
}

.doc-group-status {
  margin: 0;
  padding: 6px 10px;
  color: var(--text-color-quaternary);
  font-size: 12px;
}

.doc-sub-item {
  display: block;
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--text-color-tertiary);
  font-size: 13px;
  line-height: 1.5;
  text-decoration: none;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.doc-sub-item:hover {
  color: var(--text-color-primary);
}

.doc-sub-item.active {
  background: var(--bg-color-secondary);
  color: var(--primary-color);
}

.toc-item {
  display: block;
  padding: 6px 12px;
  color: var(--text-color-tertiary);
  font-size: 13px;
  line-height: 1.5;
  text-decoration: none;
  transition: color 0.2s ease;
}

.toc-item.level-3 {
  padding-left: 24px;
}

.toc-item.level-4 {
  padding-left: 36px;
  font-size: 12px;
}

.toc-item:hover {
  color: var(--text-color-primary);
}

.toc-item.active {
  color: var(--primary-color);
}

/* ===== 正文：独立滚动容器，滚动内容不会与固定 header 叠加 ===== */
.doc-main {
  margin: 0 264px;
  height: 100%;
  overflow-y: auto;
  padding: 32px 48px 120px;
  box-sizing: border-box;
}

.doc-status {
  margin: 0;
  color: var(--text-color-tertiary);
  font-size: 14px;
}

.doc-meta {
  display: flex;
  gap: 12px;
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--text-color-quaternary);
}

.doc-article {
  max-width: 860px;
  margin: 0 auto;
  font-size: 15px;
  line-height: 1.85;
  color: var(--text-color-secondary);
  word-break: break-word;
}

.doc-crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.doc-crumb .crumb-home {
  display: inline-flex;
  align-items: center;
  color: var(--text-color-tertiary);
  transition: color 0.2s ease;
}

.doc-crumb .crumb-home:hover {
  color: var(--primary-color);
}

.doc-crumb .crumb-item {
  color: var(--text-color-tertiary);
}

.doc-crumb .crumb-now {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--primary-color);
}

[data-theme='dark'] .doc-crumb .crumb-now {
  background: rgba(255, 255, 255, 0.08);
}

.doc-crumb .crumb-sep {
  flex: none;
  color: var(--text-color-quaternary);
}

.doc-article :deep(h1),
.doc-article :deep(h2),
.doc-article :deep(h3),
.doc-article :deep(h4) {
  color: var(--text-color-primary);
  line-height: 1.4;
  scroll-margin-top: 32px;
}

.doc-article :deep(h1) {
  margin: 0 0 8px;
  font-size: 30px;
}

.doc-article :deep(h2) {
  margin: 48px 0 16px;
  padding-bottom: 10px;
  font-size: 23px;
  border-bottom: 1px solid var(--border-color-primary);
}

/* 分章渲染时 h2 就是正文首元素，贴着「更新于」那一行，不需要整段章节间距 */
.doc-content :deep(h2:first-child) {
  margin-top: 24px;
}

.doc-article :deep(h3) {
  margin: 32px 0 12px;
  font-size: 18px;
}

.doc-article :deep(h4) {
  margin: 24px 0 10px;
  font-size: 16px;
}

.doc-article :deep(p) {
  margin: 12px 0;
}

.doc-article :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.doc-article :deep(a:hover) {
  text-decoration: underline;
}

.doc-article :deep(ul),
.doc-article :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.doc-article :deep(li) {
  margin: 6px 0;
}

/* 行内代码：加粗 + 主题深色；只作用于非代码块内的 code */
.doc-article :deep(:not(pre) > code) {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--bg-color-secondary);
  color: var(--primary-color-dark);
  font-size: 0.9em;
  font-weight: 600;
}

.doc-article :deep(pre.code-block) {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid var(--border-color-primary);
  border-radius: 10px;
  background: var(--bg-color-secondary);
  overflow-x: auto;
}

.doc-article :deep(pre.code-block code) {
  padding: 0;
  background: transparent;
  font-size: 13px;
  line-height: 1.7;
}

.doc-article :deep(.api-meta) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 12px 0 16px;
}

.doc-article :deep(.api-method) {
  padding: 2px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.doc-article :deep(.api-auth) {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--bg-color-secondary);
  color: var(--text-color-quaternary);
  font-size: 12px;
}

.doc-article :deep(.api-auth.required) {
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
}

.doc-article :deep(.fold) {
  margin: 16px 0;
  border: 1px solid var(--border-color-primary);
  border-radius: 10px;
  overflow: hidden;
}

.doc-article :deep(.fold > summary) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.doc-article :deep(.fold > summary::-webkit-details-marker) {
  display: none;
}

.doc-article :deep(.fold > summary::before) {
  content: '';
  width: 0;
  height: 0;
  border: 5px solid transparent;
  border-left-color: var(--text-color-quaternary);
  transition: transform 0.2s ease;
}

.doc-article :deep(.fold[open] > summary) {
  border-bottom: 1px solid var(--border-color-primary);
}

.doc-article :deep(.fold[open] > summary::before) {
  transform: rotate(90deg);
}

.doc-article :deep(.fold pre.code-block) {
  margin: 0;
  border: none;
  border-radius: 0;
}

.doc-article :deep(.table-wrap) {
  margin: 16px 0;
  overflow-x: auto;
}

.doc-article :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.doc-article :deep(th),
.doc-article :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--border-color-primary);
  text-align: left;
}

.doc-article :deep(th) {
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-weight: 600;
}

.doc-article :deep(hr) {
  margin: 32px 0;
  border: none;
  border-top: 1px solid var(--border-color-primary);
}

.doc-article :deep(img) {
  max-width: 100%;
}

/* ===== 章节 / 文档翻页 ===== */
.page-nav {
  display: flex;
  gap: 12px;
  margin-top: 56px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color-primary);
}

.pager-item {
  display: flex;
  flex: 0 1 50%;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 16px;
  border: 1px solid var(--border-color-primary);
  border-radius: 12px;
  text-decoration: none;
  transition: border-color 0.2s ease;
}

/* 正文链接的 hover 下划线不作用于翻页卡片 */
.doc-article .pager-item:hover {
  border-color: var(--primary-color);
  text-decoration: none;
}

.pager-item-next {
  align-items: flex-end;
  margin-left: auto;
  text-align: right;
}

.pager-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-color-quaternary);
  font-size: 12px;
}

.pager-title {
  max-width: 100%;
  overflow: hidden;
  color: var(--text-color-secondary);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.pager-item:hover .pager-title {
  color: var(--primary-color);
}

.doc-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 890;
  background: rgb(0 0 0 / 45%);
}

.doc-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.doc-menu-btn:hover {
  color: var(--primary-color);
}

/* 窄屏优先保证正文宽度，先收右栏再收左栏 */
@media (max-width: 1200px) {
  .doc-toc {
    display: none;
  }

  .doc-main {
    margin-right: 0;
  }
}

@media (max-width: 960px) {
  /* 侧栏收成左侧抽屉，由 header 菜单按钮滑入 */
  .doc-side {
    z-index: 900;
    background: var(--bg-color-primary);
    box-shadow: 0 0 24px var(--shadow-color);
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .doc-side.open {
    transform: translateX(0);
  }

  .doc-backdrop {
    display: block;
  }

  .doc-menu-btn {
    display: flex;
  }

  .doc-main {
    margin-left: 0;
    padding: 24px 20px 100px;
  }
}
</style>
