<template>
  <div class="site-search-overlay" v-click-outside.mousedown="closeModal" v-escape-key="closeModal"
    :class="{ animating: isAnimating }">
    <div class="site-search-modal" @click.stop :class="{ 'scale-in': isAnimating }">
      <div class="site-search-bar">
        <SvgIcon class="site-search-bar-icon" name="search" width="18" height="18" />
        <input ref="inputRef" v-model="keyword" class="site-search-bar-input" type="text"
          placeholder="搜索文档内容" aria-label="搜索文档" @keydown="onKeydown" />
        <button v-if="keyword" type="button" class="site-search-clear" aria-label="清空输入"
          @click="clearKeyword">
          <SvgIcon name="close" width="16" height="16" />
        </button>
      </div>

      <div class="site-search-body">
        <template v-if="isSearching">
          <div v-if="loading" class="site-search-status">
            <SimpleSpinner size="18" color="var(--text-color-quaternary)" />
            <span>{{ docsReady ? '搜索中…' : '正在加载文档…' }}</span>
          </div>
          <div v-else-if="results.length" ref="resultsRef" class="site-search-results" role="listbox">
            <button v-for="(item, index) in results" :key="`${item.docName}-${item.id}-${index}`" type="button"
              role="option" :aria-selected="index === activeIndex" class="site-search-result"
              :class="{ active: index === activeIndex }" @mouseenter="activeIndex = index"
              @click="goToDoc(item)">
              <SvgIcon name="right" class="site-search-result-icon" width="14" height="14" />
              <span class="site-search-result-main">
                <span class="site-search-result-heading" v-html="highlightHtml(item.heading, keyword.trim())"></span>
                <span class="site-search-result-doc">{{ item.docTitle }}</span>
              </span>
              <span class="site-search-result-snippet" v-html="highlightHtml(item.snippet, keyword.trim())"></span>
            </button>
          </div>
          <div v-else class="site-search-status">
            <span>未找到相关内容，换个关键词试试</span>
          </div>
        </template>

        <div v-else class="site-search-status">
          <span>搜索「小石榴」文档中的标题与内容，如：部署、接口、数据库</span>
        </div>
      </div>

      <div class="site-search-footer">
        <span class="site-search-hint"><kbd>↑</kbd><kbd>↓</kbd>选择</span>
        <span class="site-search-hint"><kbd>Enter</kbd>打开</span>
        <span class="site-search-hint"><kbd>Esc</kbd>关闭</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'
import SimpleSpinner from '@/components/spinner/SimpleSpinner.vue'
import { getDocs, getDocByName } from '@/api/system.js'
import { escapeHtml, renderMarkdown } from '@/utils/markdown.js'
import { useSiteLang } from '@/composables/useSiteLang'
import { useScrollLock } from '@/composables/useScrollLock'

const emit = defineEmits(['close'])

const router = useRouter()
const { lang } = useSiteLang()
const { lock, unlock } = useScrollLock()

const keyword = ref('')
const activeIndex = ref(-1)
const results = ref([])
const loading = ref(false)
const docsReady = ref(false)
const isAnimating = ref(false)
const inputRef = ref(null)
const resultsRef = ref(null)

const isSearching = computed(() => keyword.value.trim().length > 0)

const MAX_RESULTS = 12
const MAX_PER_DOC = 3
const DEBOUNCE_DELAY = 150

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const FENCE_RE = /^\s{0,3}(```|~~~)/

// 去除 Markdown 标记，仅用于生成纯文本摘要
function stripMarkdown(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)\s]+\)/g, '$1')
    .replace(/[#>*_-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// 按标题切分文档，标题 ID 复用 renderMarkdown 的 toc，保证跳转锚点一致
function buildDocSections(content, toc) {
  const lines = content.split('\n')
  const sections = []
  let tocIndex = 0
  let current = null
  let inFence = false

  for (const line of lines) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence
      continue
    }
    const heading = !inFence && line.match(HEADING_RE)
    if (heading && toc[tocIndex]) {
      if (current) sections.push(current)
      current = { id: toc[tocIndex].id, heading: stripMarkdown(heading[2]), body: [] }
      tocIndex++
      continue
    }
    if (current) current.body.push(line)
  }
  if (current) sections.push(current)

  return sections.map((section) => ({ id: section.id, heading: section.heading, text: stripMarkdown(section.body.join(' ')) }))
}

let docsCache = null
let docsLoading = null

async function loadDocsForLang(langNow) {
  const list = await getDocs(langNow)
  if (!list.success || !list.data?.items) return []

  const docs = await Promise.all(
    list.data.items.map(async (item) => {
      if (!item.languages?.includes(langNow)) return null
      const res = await getDocByName(item.name, langNow)
      if (!res.success || !res.data?.content) return null
      const { toc } = renderMarkdown(res.data.content)
      return {
        name: item.name,
        title: res.data.title || item.title,
        sections: buildDocSections(res.data.content, toc)
      }
    })
  )
  return docs.filter(Boolean)
}

async function ensureDocsCache() {
  if (docsCache && docsCache.lang === lang.value) {
    docsReady.value = true
    return docsCache
  }
  if (!docsLoading) {
    const currentLang = lang.value
    docsLoading = loadDocsForLang(currentLang)
      .then((docs) => {
        docsCache = { lang: currentLang, docs }
        docsReady.value = true
        return docsCache
      })
      .finally(() => {
        docsLoading = null
      })
  }
  return docsLoading
}

function makeSnippet(text, query) {
  const lower = text.toLowerCase()
  const index = lower.indexOf(query)
  if (index === -1) return ''
  const start = Math.max(0, index - 22)
  const slice = text.slice(start, start + 76)
  return (start > 0 ? '…' : '') + slice + (start + 76 < text.length ? '…' : '')
}

function performSearch(query) {
  const q = query.toLowerCase().trim()
  const docs = docsCache?.docs || []
  const matched = []
  let total = 0

  for (const doc of docs) {
    let perDoc = 0
    for (const section of doc.sections) {
      const haystack = `${section.heading} ${section.text}`.toLowerCase()
      if (!haystack.includes(q)) continue
      matched.push({
        docName: doc.name,
        docTitle: doc.title,
        id: section.id,
        heading: section.heading,
        snippet: makeSnippet(section.text, q) || makeSnippet(section.heading, q)
      })
      perDoc++
      total++
      if (perDoc >= MAX_PER_DOC) break
    }
    if (total >= MAX_RESULTS) break
  }

  results.value = matched
  activeIndex.value = -1
}

function highlightHtml(text, query) {
  const q = (query || '').toLowerCase()
  if (!q) return escapeHtml(text)
  const lower = text.toLowerCase()
  let html = ''
  let cursor = 0
  while (cursor < text.length) {
    const index = lower.indexOf(q, cursor)
    if (index === -1) {
      html += escapeHtml(text.slice(cursor))
      break
    }
    html += escapeHtml(text.slice(cursor, index))
    html += `<b class="site-search-result-match">${escapeHtml(text.slice(index, index + q.length))}</b>`
    cursor = index + q.length
  }
  return html
}

let debounceTimer = null

watch(keyword, (text) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const kw = (text || '').trim()
  if (!kw) {
    results.value = []
    activeIndex.value = -1
    loading.value = false
    return
  }
  loading.value = true
  debounceTimer = setTimeout(async () => {
    await ensureDocsCache()
    performSearch(kw)
    loading.value = false
  }, DEBOUNCE_DELAY)
})

function goToDoc(item) {
  const prefix = lang.value === 'zh' ? '' : `/${lang.value}`
  router.push({ path: `${prefix}/doc/${item.docName}`, hash: `#${item.id}` })
  closeModal()
}

function closeModal() {
  unlock()
  isAnimating.value = false
  setTimeout(() => emit('close'), 200)
}

function clearKeyword() {
  keyword.value = ''
  nextTick(() => inputRef.value?.focus())
}

// 上下移动高亮，回车打开选中项；中文输入法组合期间不打断
function onKeydown(event) {
  if (event.key === 'Enter') {
    if (event.isComposing) return
    event.preventDefault()
    const item = results.value[activeIndex.value >= 0 ? activeIndex.value : 0]
    if (item) goToDoc(item)
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const total = results.value.length
    if (!total) return
    event.preventDefault()
    const step = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = (activeIndex.value + step + total) % total
    nextTick(() => {
      resultsRef.value?.querySelector('.site-search-result.active')?.scrollIntoView({ block: 'nearest' })
    })
  }
}

onMounted(() => {
  lock()
  ensureDocsCache()
  setTimeout(() => {
    isAnimating.value = true
  }, 10)
  nextTick(() => inputRef.value?.focus())
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
.site-search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay-bg);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.site-search-overlay.animating {
  opacity: 1;
}

.site-search-modal {
  display: flex;
  flex-direction: column;
  width: 560px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 120px);
  border-radius: 16px;
  background: var(--bg-color-primary);
  box-shadow: 0 20px 40px var(--shadow-color);
  transform: scale(0.95);
  transition: transform 0.2s ease;
  overflow: hidden;
}

.site-search-modal.scale-in {
  transform: scale(1);
}

.site-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 44px;
  margin: 16px 16px 8px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--bg-color-secondary);
}

.site-search-bar-icon {
  flex-shrink: 0;
  color: var(--text-color-quaternary);
}

.site-search-bar-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--text-color-primary);
  caret-color: var(--primary-color);
}

.site-search-bar-input::placeholder {
  color: var(--text-color-quaternary);
}

.site-search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--bg-color-tertiary);
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.site-search-clear:hover {
  background: var(--text-color-quaternary);
  color: var(--bg-color-primary);
}

.site-search-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.site-search-results {
  display: flex;
  flex-direction: column;
}

.site-search-result {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-color-primary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.site-search-result.active,
.site-search-result:hover {
  background: var(--bg-color-secondary);
}

.site-search-result-icon {
  flex-shrink: 0;
  color: var(--text-color-quaternary);
}

.site-search-result-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.site-search-result-heading {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.site-search-result-doc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-color-tertiary);
}

.site-search-result-snippet {
  flex-shrink: 1;
  min-width: 0;
  max-width: 42%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-color-quaternary);
}

.site-search-result-match {
  color: var(--primary-color);
  font-weight: 600;
}

.site-search-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 12px;
  color: var(--text-color-quaternary);
  font-size: 13px;
}

.site-search-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  padding: 10px 16px;
  border-top: 1px solid var(--border-color-primary);
}

.site-search-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-color-quaternary);
  font-size: 12px;
}

.site-search-hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 1px solid var(--border-color-primary);
  border-radius: 5px;
  background: var(--bg-color-secondary);
  color: var(--text-color-tertiary);
  font-family: var(--font-family);
  font-size: 11px;
}

.site-search-body::-webkit-scrollbar {
  width: 4px;
}

.site-search-body::-webkit-scrollbar-track {
  background: transparent;
}

.site-search-body::-webkit-scrollbar-thumb {
  background: var(--border-color-secondary);
  border-radius: 2px;
}

@media (max-width: 640px) {
  .site-search-modal {
    width: calc(100vw - 24px);
  }

  .site-search-footer {
    display: none;
  }
}
</style>