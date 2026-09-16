<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'
import DropdownMenu from '@/components/menu/DropdownMenu.vue'
import CommonMenu from '@/components/menu/CommonMenu.vue'
import SearchDropdown from './SearchDropdown.vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import router from '@/router'

const route = useRoute()
const searchHistoryStore = useSearchHistoryStore()

// 静态资源URL
const logoUrl = new URL('@/assets/imgs/小石榴.png', import.meta.url).href

const isLargeScreen = ref(window.innerWidth > 695)
const showSidebar = ref(window.innerWidth > 960)

const showSearch = ref(false)
const searchText = ref('')
const showSearchDropdown = ref(false)
const isSearchEditMode = ref(false)
const searchDropdownRef = ref(null)

watch(() => route.path, (newPath, oldPath) => {
    const isInSearchPage = newPath.startsWith('/search_result')
    const wasInSearchPage = oldPath?.startsWith('/search_result')

    if (isInSearchPage && !wasInSearchPage) {
        const keyword = route.query.keyword
        if (keyword) {
            searchText.value = keyword
        }
    } else if (!isInSearchPage && wasInSearchPage) {
        searchText.value = ''
    }
}, { immediate: true })

watch(() => route.query.keyword, (newKeyword) => {
    if (route.path.startsWith('/search_result')) {
        searchText.value = newKeyword || ''
    }
})

function handleSearchFocus() {
    showSearchDropdown.value = true
}

function handleSearchBlur() {
    if (isSearchEditMode.value) {
        return
    }

    setTimeout(() => {
        if (!isSearchEditMode.value) {
            showSearchDropdown.value = false
        }
    }, 200)
}

function handleResize() {
    isLargeScreen.value = window.innerWidth > 695
    showSidebar.value = window.innerWidth > 960
}

// 搜索结果页在移动端也常驻搜索框，不收起成图标
const isSearchResultPage = computed(() => route.path.startsWith('/search_result'))

const displaySearch = computed(() => {
    return isLargeScreen.value || showSearch.value || isSearchResultPage.value
})

function openSearch() {
    showSearch.value = true
}
function closeSearch() {
    showSearch.value = false
    showSearchDropdown.value = false
    searchText.value = ''
}
function clearInput() {
    searchText.value = ''
    // 点击清除图标时也显示下拉菜单
    showSearchDropdown.value = true
    // 聚焦到输入框
    nextTick(() => {
        const input = document.querySelector('.search-bar input')
        if (input) {
            input.focus()
        }
    })
}

// 搜索功能
function handleSearch(keyword = null) {
    // 如果传入的是事件对象，忽略它
    const searchKeyword = (typeof keyword === 'string' ? keyword : searchText.value).trim()

    // 跳转到搜索结果页面的all tab（即使搜索词为空也跳转）
    router.push({
        name: 'search_result_tab',
        params: { tab: 'all' },
        query: searchKeyword ? { keyword: searchKeyword } : {}
    })

    // 如果有搜索关键词，添加到搜索历史
    if (searchKeyword) {
        searchHistoryStore.addSearchRecord(searchKeyword)
        // 更新搜索框内容
        searchText.value = searchKeyword
    }

    // 隐藏下拉菜单
    showSearchDropdown.value = false

    // 小屏搜索完收起输入态；搜索结果页保持展开并回填刚搜的关键词
    if (!isLargeScreen.value) {
        showSearch.value = false
        showSearchDropdown.value = false
    }
}

// 处理搜索下拉菜单的搜索事件
function handleDropdownSearch(keyword) {
    handleSearch(keyword)
}

// 处理搜索历史编辑模式变化
function handleEditModeChange(isEditMode) {
    isSearchEditMode.value = isEditMode
}

// 处理聚焦搜索框事件
function handleFocusSearch() {
    nextTick(() => {
        const input = document.querySelector('.search-bar input')
        if (input) {
            input.focus()
        }
    })
}

// 处理搜索框键盘操作
function handleKeyDown(event) {
    if (event.key === 'Enter') {
        // 中文输入法选词的回车不触发搜索
        if (event.isComposing) return
        // 有高亮候选时回车选中候选，否则按当前输入搜索
        if (searchDropdownRef.value && searchDropdownRef.value.selectActive()) return
        handleSearch()
        return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (searchDropdownRef.value && searchDropdownRef.value.moveActive(event.key === 'ArrowDown' ? 1 : -1)) {
            event.preventDefault()
        }
        return
    }

    if (event.key === 'Escape') {
        showSearchDropdown.value = false
    }
}

// 点击外部关闭搜索下拉菜单
function handleClickOutside(event) {
    // 如果正在编辑模式，不关闭
    if (isSearchEditMode.value) {
        return
    }

    // 检查点击的元素是否在搜索区域内
    const searchContainer = event.target.closest('.search-bar-container')
    if (!searchContainer && showSearchDropdown.value) {
        showSearchDropdown.value = false
    }
}

// 生命周期钩子
onMounted(() => {
    window.addEventListener('resize', handleResize)
    document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
    <header>
        <div class="header-container">
            <template v-if="displaySearch">
                <div v-if="isLargeScreen" class="logo" @click="router.push('/')">
                    <img :src="logoUrl" alt="小石榴" />
                </div>
                <div class="search-row" :class="{ 'large-screen': isLargeScreen, 'small-screen': !isLargeScreen }">
                    <div class="search-bar-container">
                        <div class="search-bar">
                            <input v-model="searchText" type="text" placeholder="搜索小石榴" @keydown="handleKeyDown"
                                @focus="handleSearchFocus" @blur="handleSearchBlur" />
                            <div class="input-controls">
                                <div class="clear-btn" @click="clearInput"
                                    :style="{ visibility: searchText ? 'visible' : 'hidden' }">
                                    <SvgIcon name="close" class="btn-icon" height="20" width="20" />
                                </div>
                                <div class="search-btn" @click="handleSearch">
                                    <SvgIcon name="search" class="btn-icon" height="20" width="20" />
                                </div>
                            </div>
                        </div>
                        <SearchDropdown ref="searchDropdownRef" :visible="showSearchDropdown" :searchText="searchText"
                            @search="handleDropdownSearch" @edit-mode-change="handleEditModeChange"
                            @focus-search="handleFocusSearch" @close="showSearchDropdown = false" />
                    </div>
                    <div v-if="!isLargeScreen && !isSearchResultPage" class="cancel-btn" @click="closeSearch">取消</div>
                </div>
                <div v-if="isLargeScreen && !showSidebar" class="header-right">
                    <DropdownMenu direction="down" menuClass="header-dropdown">
                        <template #trigger>
                            <div class="circle-btn">
                                <SvgIcon name="menu" class="btn-icon" height="20" width="20" />
                            </div>
                        </template>
                        <template #menu>
                            <CommonMenu />
                        </template>
                    </DropdownMenu>
                </div>

            </template>

            <template v-else>
                <div class="logo" @click="router.push('/')">
                    <img :src="logoUrl" alt="小石榴" />
                </div>
                <div class="header-right">
                    <div @click="openSearch" class="circle-btn">
                        <SvgIcon name="search" class="btn-icon" height="20" width="20" />
                    </div>
                    <DropdownMenu v-if="!showSidebar" direction="down" menuClass="header-dropdown">
                        <template #trigger>
                            <div class="circle-btn">
                                <SvgIcon name="menu" class="btn-icon" height="20" width="20" />
                            </div>
                        </template>
                        <template #menu>
                            <CommonMenu />
                        </template>
                    </DropdownMenu>
                </div>
            </template>
        </div>
    </header>
</template>

<style scoped>
header {
    height: 72px;
    background: var(--bg-color-primary);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    width: 100%;
    transition: border-color 0.2s ease, background-color 0.2s ease;
}

.header-container {
    max-width: 1500px;
    margin: 0 auto;
    height: 100%;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    width: 100%;
}

.logo {
    width: 68.32px;
    height: 32px;
    color: var(--button-text-color);
    background: var(--primary-color);
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
}

img {
    width: 68.32px;
    height: 32px;
}

.header-right {
    display: flex;
    align-items: center;
}

/* 按钮基础样式 */
.btn-base,
.circle-btn,
.cancel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: transparent;
}

.btn-base:hover,
.circle-btn:hover,
.cancel-btn:hover {
    background: var(--bg-color-secondary);
}

.circle-btn {
    border-radius: 50%;
    width: 40px;
    height: 40px;
    border: none;
}

/* 通用的图标颜色样式 */
.btn-icon {
    color: var(--text-color-secondary);
}

.btn-icon:hover,
.circle-btn:hover .btn-icon {
    color: var(--text-color-primary);
}

.search-row {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    height: 40px;
}

.search-row.large-screen {
    width: 465px;
    max-width: 500px;
    margin: 0 auto;
    flex-grow: 0;
}


@media (min-width: 696px) {
    .header-container {
        justify-content: space-between;
        position: relative;
    }

    .header-right {
        margin-left: auto;
    }

    /* 大屏模式下搜索栏居中 */
    .search-row.large-screen {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1;
    }
}

.search-bar-container {
    flex: 1;
    min-width: 0;
    position: relative;
}

.search-bar {
    display: flex;
    align-items: center;
    background: var(--bg-color-secondary);
    border-radius: 999px;
    height: 40px;
    padding: 0 15px;
    position: relative;
    box-sizing: border-box;
    transition: background-color 0.2s ease;
}

.search-bar input {
    border: none;
    outline: none;
    background: transparent;
    flex: 1 1 0%;
    font-size: 16px;
    min-width: 0;
    color: var(--text-color-primary);
    caret-color: var(--primary-color);
    padding-right: 80px;
}

.search-bar input::placeholder {
    color: var(--text-color-quaternary);
}

.input-controls {
    position: absolute;
    right: 12px;
    display: flex;
    align-items: center;
    width: 60px;
}

/* 通用的图标按钮样式 */
.icon-btn,
.clear-btn,
.search-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.clear-btn {
    visibility: hidden;
    margin-right: 8px;
}

.search-btn {
    margin-left: auto;
}

.cancel-btn {
    text-align: center;
    width: 64px;
    height: 40px;
    font-size: 16px;
    color: var(--text-color-secondary);
    margin-left: 12px;
    border-radius: 999px;
    flex-shrink: 0;
}

.cancel-btn:hover {
    color: var(--text-color-primary);
}

/* 主题切换器容器样式 */
.theme-switcher-container {
    padding: 0;
}

.theme-label {
    font-size: 14px;
    color: var(--text-color-primary);
    font-weight: 500;
}

/* 头部下拉菜单右对齐 */
:deep(.header-dropdown) {
    right: 0;
    left: auto;
}
</style>