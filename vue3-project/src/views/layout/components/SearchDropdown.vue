<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { searchApi } from '@/api'

const props = defineProps({
    searchText: {
        type: String,
        default: ''
    },
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['search', 'close', 'edit-mode-change', 'focus-search'])

const searchHistoryStore = useSearchHistoryStore()

// 编辑模式状态
const isEditMode = ref(false)

// 监听编辑模式变化，通知父组件
watch(isEditMode, (newValue) => {
    emit('edit-mode-change', newValue)
})

// 获取最近搜索记录
const recentSearches = computed(() => searchHistoryStore.getRecentSearches())

// 处理搜索历史点击
function handleHistoryClick(keyword) {
    if (!isEditMode.value) {
        emit('search', keyword)
    }
}

// 进入编辑模式
function enterEditMode() {
    isEditMode.value = true
}

// 退出编辑模式
function exitEditMode() {
    isEditMode.value = false
    // 退出编辑模式后聚焦到搜索框
    emit('focus-search')
}

// 删除单个历史记录
function handleDeleteHistory(keyword, event) {
    event.stopPropagation()
    searchHistoryStore.removeSearchRecord(keyword)

    // 如果删除后没有搜索记录了，自动退出编辑模式
    if (recentSearches.value.length === 0) {
        isEditMode.value = false
        emit('close')
    }
}

// 清空所有历史记录
function handleClearAll() {
    searchHistoryStore.clearSearchHistory()
    isEditMode.value = false
}

// ---------------------- 搜索联想 ----------------------

const DEBOUNCE_DELAY = 250
// 每组向服务端要的条数，最终只保留前 MAX_SUGGESTIONS 条
const SUGGEST_LIMIT = 10
const MAX_SUGGESTIONS = 10

const suggestions = ref({ tags: [], posts: [], users: [] })
const activeIndex = ref(-1)

// 输入非空时展示联想结果，历史记录让位
const isSearching = computed(() => props.searchText.trim().length > 0)

// 三类候选合并成一个列表，标签优先，笔记、用户依次在后，同名项只保留一条
const suggestionList = computed(() => {
    const { tags, posts, users } = suggestions.value
    const seen = new Set()
    const merged = []
    for (const item of [...tags, ...posts, ...users]) {
        if (!seen.has(item.text)) {
            seen.add(item.text)
            merged.push(item)
        }
    }
    return merged.slice(0, MAX_SUGGESTIONS)
})

// 有内容可展示才渲染下拉，避免出现空白浮层
const shouldShow = computed(() => !isSearching.value || suggestionList.value.length > 0)

let debounceTimer = null
let controller = null

function resetSuggestions() {
    suggestions.value = { tags: [], posts: [], users: [] }
    activeIndex.value = -1
}

async function fetchSuggestions(keyword) {
    // 取消上一次未完成的请求，防止慢响应覆盖新结果
    if (controller) controller.abort()
    controller = new AbortController()

    const result = await searchApi.getSuggest(keyword, SUGGEST_LIMIT, { signal: controller.signal })
    if (result.canceled) return

    if (result.success && result.data) {
        suggestions.value = {
            tags: result.data.tags || [],
            posts: result.data.posts || [],
            users: result.data.users || []
        }
    } else {
        suggestions.value = { tags: [], posts: [], users: [] }
    }
    activeIndex.value = -1
}

watch(() => props.searchText, (text) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    const keyword = (text || '').trim()
    if (!keyword) {
        if (controller) {
            controller.abort()
            controller = null
        }
        resetSuggestions()
        return
    }

    debounceTimer = setTimeout(() => fetchSuggestions(keyword), DEBOUNCE_DELAY)
})

onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (controller) controller.abort()
})

// 切出服务端实际命中的片段做高亮；分词命中的长句只亮关键词，拼音命中没有原文片段则整条不着色
function highlight(text, matched) {
    const target = matched || ''
    const position = target ? text.indexOf(target) : -1
    if (position === -1) return [{ text, match: false }]

    const parts = []
    if (position > 0) {
        parts.push({ text: text.slice(0, position), match: false })
    }
    parts.push({ text: text.slice(position, position + target.length), match: true })
    if (position + target.length < text.length) {
        parts.push({ text: text.slice(position + target.length), match: false })
    }
    return parts
}

// 点击候选项直接以该项文本执行搜索
function handleSuggestionClick(item) {
    emit('search', item.text)
}

// 供父组件在键盘事件中调用
function moveActive(step) {
    const total = suggestionList.value.length
    if (!total) return false
    activeIndex.value = (activeIndex.value + step + total) % total
    return true
}

function selectActive() {
    const target = suggestionList.value[activeIndex.value]
    if (!target) return false
    handleSuggestionClick(target)
    return true
}

defineExpose({ moveActive, selectActive })
</script>

<template>
    <div v-if="visible && shouldShow" class="search-dropdown">
        <div class="dropdown-content">

            <template v-if="isSearching">
                <div class="suggest-list">
                    <div v-for="(item, index) in suggestionList" :key="index" class="suggest-item"
                        :class="{ active: index === activeIndex }" @mouseenter="activeIndex = index"
                        @click="handleSuggestionClick(item)">
                        <span class="suggest-text">
                            <template v-for="(segment, segmentIndex) in highlight(item.text, item.matched)"
                                :key="segmentIndex">
                                <span v-if="segment.match" class="suggest-match">{{ segment.text }}</span>
                                <template v-else>{{ segment.text }}</template>
                            </template>
                        </span>
                    </div>
                </div>
            </template>

            <template v-else>

                <div v-if="recentSearches.length > 0" class="history-header">
                    <span class="history-title">历史记录</span>
                    <div class="header-actions">

                        <template v-if="!isEditMode">
                            <span class="action-btn icon-only-btn" @click="enterEditMode">
                                <SvgIcon name="delete" width="16" height="16" />
                            </span>
                        </template>
                        <template v-else>
                            <span class="action-btn" @click="handleClearAll">
                                <SvgIcon name="delete" width="16" height="16" />
                                <span class="action-text">清空</span>
                            </span>
                            <span class="action-btn" @click="exitEditMode">
                                <SvgIcon name="tick" width="16" height="16" />
                                <span class="action-text">完成</span>
                            </span>
                        </template>
                    </div>
                </div>


                <div v-if="recentSearches.length > 0" class="history-list">
                    <div v-for="keyword in recentSearches" :key="keyword" class="history-tag"
                        :class="{ 'edit-mode': isEditMode }" @click="handleHistoryClick(keyword)">
                        <span class="history-text">{{ keyword }}</span>

                        <span v-if="isEditMode" class="delete-btn" @click="handleDeleteHistory(keyword, $event)">
                            <SvgIcon name="close" width="12" height="12" />
                        </span>
                    </div>
                </div>


                <div v-else class="no-history">
                    <span class="no-history-text">暂无搜索记录</span>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-color-primary);
    border: 1px solid var(--border-color-primary);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    z-index: 1001;
    margin-top: 8px;
    max-height: 360px;
    overflow-y: auto;
}

.dropdown-content {
    padding: 12px;
}

.suggest-list {
    display: flex;
    flex-direction: column;
}

.suggest-item {
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
}

.suggest-item.active {
    background: var(--bg-color-secondary);
}

.suggest-text {
    display: block;
    font-size: 14px;
    color: var(--text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.suggest-match {
    color: var(--primary-color);
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.history-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-color-tertiary);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    color: var(--text-color-secondary);
}

.action-text {
    font-size: 13px;
    color: var(--text-color-secondary);
}

.action-btn:hover,
.action-btn:hover .action-text {
    color: var(--text-color-primary);
}

.icon-only-btn {
    padding: 4px;
    width: 24px;
    height: 24px;
    justify-content: center;
}


.history-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.history-tag {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: var(--bg-color-secondary);
    border-radius: 999px;
    cursor: pointer;
    max-width: 200px;
    position: relative;
}

.history-tag.edit-mode {
    background: transparent;
    border: 1px solid var(--border-color-secondary);
    padding-right: 32px;
}

.history-tag.edit-mode:hover {
    color: var(--text-color-primary);
}

.delete-btn {
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--text-color-secondary);
    cursor: pointer;
    border-radius: 50%;
}

.delete-btn:hover {
    color: var(--text-color-primary);
    background-color: var(--bg-color-secondary);
}



.history-text {
    font-size: 13px;
    color: var(--text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.history-text:hover {
    color: var(--text-color-primary);
}

.no-history {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px 12px;
}

.no-history-text {
    font-size: 14px;
    color: var(--text-color-secondary);
}

/* 滚动条样式 */
.search-dropdown::-webkit-scrollbar {
    width: 4px;
}

.search-dropdown::-webkit-scrollbar-track {
    background: transparent;
}

.search-dropdown::-webkit-scrollbar-thumb {
    background: var(--border-color-secondary);
    border-radius: 2px;
}

.search-dropdown::-webkit-scrollbar-thumb:hover {
    background: var(--border-color-primary);
}
</style>
