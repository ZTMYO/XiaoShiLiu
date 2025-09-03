<script setup>
import { ref, computed, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'

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
</script>

<template>
    <div v-if="visible" class="search-dropdown">
        <div class="dropdown-content">

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
    max-height: 300px;
    overflow-y: auto;
}

.dropdown-content {
    padding: 16px;
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