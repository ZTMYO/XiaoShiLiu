<template>
  <div class="ep-picker">
    <!-- 分类栏：三种 tab 共用，随内容滚动高亮，点击可跳到对应分组 -->
    <div
      ref="catsRef"
      class="ep-cats"
      :class="{ 'is-searching': isSearching }"
      :style="indicatorStyle"
      @wheel="onCatsWheel"
    >
      <button
        v-for="cat in cats"
        :key="cat.key"
        :ref="(el) => setRef(catRefs, cat.key, el)"
        type="button"
        class="ep-cat-btn"
        :class="{ active: cat.key === activeCat }"
        @click="scrollToCat(cat.key)"
      >
        {{ cat.title }}
      </button>
    </div>

    <!-- 表情（虚拟滚动） -->
    <div v-if="activeTab === 'emoji'" ref="listRef" class="ep-list" @scroll.passive="onEmojiScroll">
      <div class="ep-body" :style="{ height: `${totalHeight}px` }">
        <template v-for="item in visibleItems" :key="item.key">
          <div
            v-if="item.type === 'title'"
            class="ep-group-title"
            :style="{ height: `${item.height}px`, transform: `translateY(${item.top}px)` }"
          >
            {{ item.title }}
          </div>
          <div v-else class="ep-row" :style="{ transform: `translateY(${item.top}px)` }">
            <button
              v-for="emoji in item.emojis"
              :key="emoji.u"
              type="button"
              class="ep-item"
              :title="emoji.n[0]"
              @click="selectEmoji(emoji)"
            >
              {{ charOf(emoji, tone) }}
            </button>
          </div>
        </template>
        <div v-if="!groups.length" class="ep-empty">没有找到表情</div>
      </div>
    </div>

    <!-- 颜文字 -->
    <div
      v-else-if="activeTab === 'kaomoji'"
      ref="listRef"
      class="ep-list"
      @scroll.passive="onKaomojiScroll"
    >
      <template v-for="group in kaomojiGroups" :key="group.key">
        <div :ref="(el) => setRef(kaomojiRefs, group.key, el)" class="ep-section-title">
          {{ group.title }}
        </div>
        <div class="ep-kaomoji-grid">
          <button
            v-for="text in group.list"
            :key="text"
            type="button"
            class="ep-kaomoji-item"
            @click="selectKaomoji(text)"
          >
            {{ text }}
          </button>
        </div>
      </template>
      <div v-if="!kaomojiGroups.length" class="ep-empty">没有找到颜文字</div>
    </div>

    <!-- 表情包 -->
    <div v-else ref="listRef" class="ep-list" @scroll.passive="onStickerScroll">
      <template v-for="pack in stickerGroups" :key="pack.id">
        <div :ref="(el) => setRef(packRefs, pack.id, el)" class="ep-section-title">
          {{ pack.title }}
        </div>
        <div class="ep-sticker-grid">
          <button
            v-for="item in pack.items"
            :key="item.id"
            type="button"
            class="ep-sticker"
            :style="stickerStyle(pack, item)"
            :title="item.name"
            @click="selectSticker(pack, item)"
          ></button>
        </div>
      </template>
      <div v-if="!STICKER_PACKS.length" class="ep-soon">
        <p class="ep-soon-title">还没有表情包</p>
        <p class="ep-soon-desc">把雪碧图放进 public/stickers/ 并填好 stickers.json</p>
      </div>
      <div v-else-if="!stickerGroups.length" class="ep-empty">没有找到表情包</div>
    </div>

    <!-- 底部栏：左侧切换 tab，右侧肤色（仅表情页） -->
    <div class="ep-footer">
      <div class="ep-tabs">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          type="button"
          class="ep-tab-btn"
          :class="{ active: tab.key === activeTab }"
          :title="tab.title"
          @click="switchTab(tab.key)"
        >
          <SvgIcon :name="tab.icon" color="currentColor" width="18" height="18" />
        </button>
      </div>
      <div v-if="activeTab === 'emoji' && !disableSkinTones" class="ep-tones">
        <button
          v-for="item in SKIN_TONES"
          :key="item.key"
          type="button"
          class="ep-tone-btn"
          :class="{ active: item.key === tone }"
          :style="{ backgroundColor: item.color }"
          :title="item.label"
          @click="tone = item.key"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { GROUPS, SKIN_TONES, charOf, queryEmojis } from './emoji-picker/data'
import { KAOMOJI_GROUPS, queryKaomoji } from './emoji-picker/kaomoji'
import { STICKER_PACKS, queryStickers, rowsOf } from './emoji-picker/stickers'
import { stickerMarker } from '@/utils/inlineSticker'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  // 搜索词由外层 header 的输入框控制，组件内只读写该值
  keyword: { type: String, default: '' },
  disableSkinTones: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'update:keyword', 'update:tab'])

const TABS = [
  { key: 'emoji', title: 'emoji', icon: 'emoji' },
  { key: 'sticker', title: '表情包', icon: 'sticker' },
  { key: 'kaomoji', title: '颜文字', icon: 'kaomoji' }
]

// 虚拟滚动尺寸：行高与标题高度固定，才能按位置算出可视区
const ROW_HEIGHT = 34
const TITLE_HEIGHT = 26
const GROUP_GAP = 8
const OVERSCAN = 3

const activeTab = ref('emoji')
const keyword = computed({
  get: () => props.keyword,
  set: (value) => emit('update:keyword', value)
})
const tone = ref('neutral')

const catsRef = ref(null)
const catRefs = {}
const listRef = ref(null)

// ===== 表情 =====
const activeGroup = ref(GROUPS[0].key)
const scrollTop = ref(0)
const viewHeight = ref(0)

const groups = computed(() => queryEmojis(keyword.value))

const layout = computed(() => {
  const items = []
  const groupTops = {}
  let offset = 0

  groups.value.forEach((group, index) => {
    const height = TITLE_HEIGHT + (index ? GROUP_GAP : 0)
    groupTops[group.key] = offset
    items.push({ type: 'title', key: `title-${group.key}`, title: group.title, top: offset, height })
    offset += height

    for (let i = 0; i < group.emojis.length; i += 8) {
      items.push({
        type: 'row',
        key: `${group.key}-${i}`,
        emojis: group.emojis.slice(i, i + 8),
        top: offset
      })
      offset += ROW_HEIGHT
    }
  })

  return { items, groupTops, total: offset }
})

const totalHeight = computed(() => layout.value.total)

const visibleItems = computed(() => {
  const from = scrollTop.value - OVERSCAN * ROW_HEIGHT
  const to = scrollTop.value + viewHeight.value + OVERSCAN * ROW_HEIGHT
  return layout.value.items.filter((item) => {
    const height = item.type === 'title' ? item.height : ROW_HEIGHT
    return item.top + height >= from && item.top <= to
  })
})

// ===== 颜文字 =====
const kaomojiGroup = ref(KAOMOJI_GROUPS[0]?.key || '')
const kaomojiRefs = {}
const kaomojiGroups = computed(() => queryKaomoji(keyword.value))

// ===== 表情包 =====
const STICKER_SIZE = 46
const activePackId = ref(STICKER_PACKS[0]?.id || '')
const packRefs = {}
const stickerGroups = computed(() => queryStickers(keyword.value))

// 雪碧图裁切：background-size 按单元格放大整张图，position 取行列偏移
function stickerStyle(pack, item) {
  return {
    backgroundImage: `url(${pack.sheet})`,
    backgroundSize: `${pack.columns * STICKER_SIZE}px ${rowsOf(pack) * STICKER_SIZE}px`,
    backgroundPosition: `-${item.x * STICKER_SIZE}px -${item.y * STICKER_SIZE}px`
  }
}

// ===== 分类栏 =====
// 三种 tab 的分类都来自当前过滤结果，因此搜索时只会留下命中的分组
const cats = computed(() => {
  if (activeTab.value === 'kaomoji') {
    return kaomojiGroups.value.map((group) => ({ key: group.key, title: group.title }))
  }
  if (activeTab.value === 'sticker') {
    return stickerGroups.value.map((pack) => ({ key: pack.id, title: pack.title }))
  }
  return groups.value.map((group) => ({ key: group.key, title: group.title }))
})

const activeCat = computed(() => {
  if (activeTab.value === 'kaomoji') return kaomojiGroup.value
  if (activeTab.value === 'sticker') return activePackId.value
  return activeGroup.value
})

const isSearching = computed(() => !!keyword.value.trim())

const indicator = reactive({ left: 0, width: 0 })
const indicatorStyle = computed(() => ({
  '--active-tab-left': `${indicator.left}px`,
  '--active-tab-width': `${indicator.width}px`
}))

function setRef(map, key, el) {
  if (el) map[key] = el
  else delete map[key]
}

function updateIndicator() {
  const el = catRefs[activeCat.value]
  if (!el) return
  indicator.left = el.offsetLeft
  indicator.width = el.offsetWidth
}

// 让当前分类按钮在横向滚动的分类栏里保持可见
function revealCat(key) {
  const el = catRefs[key]
  const bar = catsRef.value
  if (!el || !bar) return
  const left = el.offsetLeft
  const right = left + el.offsetWidth
  if (left < bar.scrollLeft) {
    bar.scrollLeft = left - 4
  } else if (right > bar.scrollLeft + bar.clientWidth) {
    bar.scrollLeft = right - bar.clientWidth + 4
  }
}

// 让分类栏支持滚轮横向滚动；到两端后不再拦截，交回外层
function onCatsWheel(event) {
  const bar = catsRef.value
  if (!bar) return
  const max = bar.scrollWidth - bar.clientWidth
  if (max <= 0) return

  const scale = event.deltaMode === 1 ? 16 : 1
  const delta =
    (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * scale
  if (!delta) return
  if ((delta < 0 && bar.scrollLeft <= 0) || (delta > 0 && bar.scrollLeft >= max)) return

  event.preventDefault()
  bar.scrollLeft = Math.min(max, Math.max(0, bar.scrollLeft + delta))
}

// 点击分类跳到对应分组
function scrollToCat(key) {
  const list = listRef.value
  if (activeTab.value === 'emoji') {
    const top = layout.value.groupTops[key]
    if (typeof top === 'number' && list) list.scrollTop = top
    activeGroup.value = key
  } else {
    const el = (activeTab.value === 'kaomoji' ? kaomojiRefs : packRefs)[key]
    if (el && list) list.scrollTop = el.offsetTop
    if (activeTab.value === 'kaomoji') kaomojiGroup.value = key
    else activePackId.value = key
  }
  revealCat(key)
}

// 流式分组（颜文字 / 表情包）没有固定行高，按标题的 DOM 位置算出当前分类
function scrollCatOf(map) {
  const list = listRef.value
  if (!list) return ''
  const threshold = list.scrollTop + 8
  let current = cats.value[0]?.key || ''
  cats.value.forEach((cat) => {
    const el = map[cat.key]
    if (el && el.offsetTop <= threshold) current = cat.key
  })
  return current
}

function onKaomojiScroll() {
  const key = scrollCatOf(kaomojiRefs)
  if (key && key !== kaomojiGroup.value) {
    kaomojiGroup.value = key
    revealCat(key)
  }
}

function onStickerScroll() {
  const key = scrollCatOf(packRefs)
  if (key && key !== activePackId.value) {
    activePackId.value = key
    revealCat(key)
  }
}

// 切 tab 后各 tab 的首个分类即为激活项
function resetActiveCat() {
  if (activeTab.value === 'kaomoji') kaomojiGroup.value = kaomojiGroups.value[0]?.key || ''
  else if (activeTab.value === 'sticker') activePackId.value = stickerGroups.value[0]?.id || ''
  else activeGroup.value = groups.value[0]?.key || ''
}

function switchTab(key) {
  if (key === activeTab.value) return
  activeTab.value = key
  keyword.value = ''
  nextTick(() => {
    const list = listRef.value
    if (list) {
      list.scrollTop = 0
      viewHeight.value = list.clientHeight
    }
    scrollTop.value = 0
    resetActiveCat()
    updateIndicator()
  })
}

let scrollRaf = null
function onEmojiScroll() {
  if (scrollRaf) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null
    const list = listRef.value
    if (!list) return
    scrollTop.value = list.scrollTop

    const tops = layout.value.groupTops
    let current = ''
    Object.keys(tops).forEach((key) => {
      if (tops[key] <= list.scrollTop + 8) current = key
    })
    if (current && current !== activeGroup.value) {
      activeGroup.value = current
      revealCat(current)
    }
  })
}

function selectEmoji(emoji) {
  emit('select', { ...emoji, t: tone.value, i: charOf(emoji, tone.value) })
}

function selectKaomoji(text) {
  emit('select', { i: text })
}

function selectSticker(pack, item) {
  emit('select', { i: stickerMarker(pack.id, item.id) })
}

watch(activeTab, (tab) => {
  emit('update:tab', tab)
  nextTick(updateIndicator)
})

watch(activeCat, () => nextTick(updateIndicator))

watch(keyword, () => {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = 0
    scrollTop.value = 0
    resetActiveCat()
    updateIndicator()
  })
})

onMounted(() => {
  if (listRef.value) viewHeight.value = listRef.value.clientHeight
  nextTick(updateIndicator)
})
</script>

<style scoped>
.ep-picker {
  width: 280px;
  height: 320px;
  padding: 0 10px 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-color-primary);
  border-radius: 10px;
  text-align: left;
}

.ep-cats {
  position: relative;
  display: flex;
  gap: 6px;
  padding: 6px 0;
  overflow-x: auto;
  border-bottom: 1px solid var(--border-color-secondary);
  scrollbar-width: none;
}

.ep-cats::-webkit-scrollbar {
  display: none;
}

.ep-cats::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: calc(var(--active-tab-left, 0px) + var(--active-tab-width, 0px) / 2);
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  border-radius: 1px;
  background: var(--text-color-primary);
  transition: left 0.2s ease;
}

.ep-cats.is-searching::after {
  opacity: 0;
}

.ep-cat-btn {
  flex: none;
  padding: 0 5px;
  border: none;
  background: transparent;
  color: var(--text-color-tertiary);
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease;
}

.ep-cat-btn:hover {
  color: var(--text-color-primary);
}

.ep-cat-btn.active {
  color: var(--text-color-primary);
  font-weight: 600;
}

.ep-list {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.ep-body {
  position: relative;
  flex: none;
}

.ep-group-title {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  padding: 0 2px 6px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-color-tertiary);
  user-select: none;
}

.ep-row {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 34px;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  grid-auto-rows: 30px;
  gap: 4px;
}

.ep-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.ep-item:hover {
  background: var(--bg-color-secondary);
  transform: translateY(-1px);
}

.ep-item:active {
  transform: translateY(0);
}

/* 流式分组的标题（颜文字 / 表情包），与虚拟滚动的 .ep-group-title 视觉一致 */
.ep-section-title {
  flex: none;
  padding: 4px 2px 6px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-color-tertiary);
  user-select: none;
}

.ep-kaomoji-grid {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 6px;
}

.ep-kaomoji-item {
  padding: 4px 8px;
  border: 1px solid var(--border-color-primary);
  border-radius: 6px;
  background: transparent;
  color: var(--text-color-primary);
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.ep-kaomoji-item:hover {
  background: var(--bg-color-secondary);
  border-color: var(--text-color-quaternary);
}

.ep-sticker-grid {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 5px;
  padding-bottom: 6px;
}

.ep-sticker {
  width: 46px;
  height: 46px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.ep-sticker:hover {
  background-color: var(--bg-color-secondary);
  transform: translateY(-1px);
}

.ep-soon {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.ep-soon-title {
  margin: 0;
  font-size: 13px;
  color: var(--text-color-secondary);
}

.ep-soon-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-color-tertiary);
}

.ep-empty {
  flex: none;
  width: 100%;
  padding: 24px 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-color-tertiary);
}

.ep-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--border-color-secondary);
}

.ep-tabs {
  display: flex;
  gap: 4px;
}

.ep-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-color-tertiary);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.ep-tab-btn:hover {
  color: var(--text-color-primary);
  background: var(--bg-color-secondary);
}

.ep-tab-btn.active {
  color: var(--text-color-primary);
  background: var(--bg-color-secondary);
}

.ep-tones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.ep-tone-btn {
  width: 15px;
  height: 15px;
  min-width: 15px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.ep-tone-btn:hover {
  border-color: var(--text-color-quaternary);
}

.ep-tone-btn:active {
  transform: translateY(1px);
}

.ep-tone-btn.active {
  border-color: var(--text-color-primary);
}
</style>
