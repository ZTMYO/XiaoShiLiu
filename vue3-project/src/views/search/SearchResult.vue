<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'
import { useEventStore } from '@/stores/event'
import TabContainer from '@/components/TabContainer.vue'
import TagContainer from './components/TagContainer.vue'
import UserList from './components/UserList.vue'
import WaterfallFlow from '@/components/WaterfallFlow.vue'
import LoadingSpinner from '@/components/spinner/LoadingSpinner.vue'
import SkeletonList from '@/components/skeleton/SkeletonList.vue'
import SearchFloatingBtn from './components/SearchFloatingBtn.vue'
import apiConfig from '@/config/api.js'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()
const eventStore = useEventStore()

const keyword = ref('')
const selectedTag = ref('')
const activeTab = ref('all')


const searchTabs = [
    { id: 'all', label: '全部' },
    { id: 'posts', label: '图文' },
    { id: 'videos', label: '视频' },
    { id: 'users', label: '用户' }
]

const searchResults = ref({})
const userResults = ref([])
const postResults = ref([])
const tagStats = ref([])
const loading = ref(false)

const cachedAllPosts = ref([])
const cachedKeyword = ref('')
const cachedPostsData = ref([])  // 缓存图文数据
const cachedVideosData = ref([]) // 缓存视频数据
const cachedAllTagStats = ref([])  // 缓存全部标签统计
const cachedPostsTagStats = ref([])  // 缓存图文标签统计
const cachedVideosTagStats = ref([])  // 缓存视频标签统计
const cachedTag = ref('') // 缓存标签参数

const isTagLoading = ref(false)
let eventListenerKey = null

// 计算属性：当前tab对应的标签统计数据
const currentTagStats = computed(() => {
    if (activeTab.value === 'all' && cachedAllTagStats.value.length > 0) {
        return cachedAllTagStats.value
    } else if (activeTab.value === 'posts' && cachedPostsTagStats.value.length > 0) {
        return cachedPostsTagStats.value
    } else if (activeTab.value === 'videos' && cachedVideosTagStats.value.length > 0) {
        return cachedVideosTagStats.value
    }
    return tagStats.value
})

// 计算属性：是否显示标签容器
const shouldShowTagContainer = computed(() => {
    // 用户tab不显示标签容器
    if (activeTab.value === 'users') {
        return false
    }
    // 用标签统计判断而不是笔记列表：换关键词时笔记列表会先清空，
    // 依赖它会让标签容器消失一下再重新出现
    return currentTagStats.value.length > 0
})

let currentSearchId = 0
// 上一次的搜索维度（tab + 关键词），用来判断这次是不是换了搜索条件。
// 点标签是在当前这批结果里筛选，不算换条件，不应该清空列表
let lastSearchKey = ''

async function searchContent(type = 'all', page = 1, limit = 20) {
    if (!keyword.value.trim() && !selectedTag.value.trim()) {
        console.warn('搜索关键词和标签都为空')
        return
    }

    // 检查缓存数据
    if (keyword.value.trim() && keyword.value === cachedKeyword.value && selectedTag.value === cachedTag.value) {
        if (type === 'all' && cachedAllPosts.value.length > 0) {
            postResults.value = [...cachedAllPosts.value]
            tagStats.value = [...cachedAllTagStats.value]
            return
        } else if (type === 'posts' && cachedPostsData.value.length > 0) {
            postResults.value = [...cachedPostsData.value]
            tagStats.value = [...cachedPostsTagStats.value]
            return
        } else if (type === 'videos' && cachedVideosData.value.length > 0) {
            postResults.value = [...cachedVideosData.value]
            tagStats.value = [...cachedVideosTagStats.value]
            return
        }
    }

    // 竞态处理：为每次请求分配唯一ID
    const searchId = ++currentSearchId
    loading.value = true

    // 换了关键词或 tab 才清空笔记列表：清空后由骨架屏占位，
    // 避免旧内容先渲染一帧；点标签是在当前这批结果里筛选，清空反而会造成闪烁
    const searchKey = `${type}-${keyword.value}`
    if (page === 1 && searchKey !== lastSearchKey) {
        searchResults.value = {}
        userResults.value = []
        postResults.value = []
        lastSearchKey = searchKey
    }

    try {
        const params = new URLSearchParams({
            type,
            page: page.toString(),
            limit: limit.toString()
        })

        if (keyword.value.trim()) {
            params.append('keyword', keyword.value.trim())
        }

        if (selectedTag.value.trim()) {
            params.append('tag', selectedTag.value.trim())
        }

        const response = await fetch(`${apiConfig.baseURL}/search?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(res => res.json())

        // 竞态处理：如果不是最新的请求，直接丢弃结果
        if (searchId !== currentSearchId) {
            console.log('丢弃过时的请求结果:', type)
            return
        }

        if (response && response.code === 200 && response.data) {
            searchResults.value = response.data

            // 提取标签统计数据 - 始终优先使用后端返回的统计数据
            let currentTagStatsData = []
            if (response.data.tagStats) {
                currentTagStatsData = response.data.tagStats
            } else if (response.data.posts && response.data.posts.tagStats) {
                currentTagStatsData = response.data.posts.tagStats
            }
            
            // 更新当前显示的标签统计
            tagStats.value = currentTagStatsData

            if (type === 'users' || (type === 'all' && response.data.users)) {
                handleUserResults(response.data.users)
            }

            if (type === 'posts' || type === 'videos' || (type === 'all' && response.data.data)) {
                // 对于all类型，数据直接在response.data中；对于posts/videos类型，数据在response.data.posts中
                const postsData = type === 'all' ? response.data : response.data.posts
                handlePostResults(postsData)

                if (keyword.value.trim() && postsData && postsData.data && postsData.data.length > 0) {
                    // 根据类型分别缓存数据和标签统计
                    if (type === 'all') {
                        cachedAllPosts.value = postsData.data
                        cachedAllTagStats.value = currentTagStatsData
                    } else if (type === 'posts') {
                        cachedPostsData.value = postsData.data
                        cachedPostsTagStats.value = currentTagStatsData
                    } else if (type === 'videos') {
                        cachedVideosData.value = postsData.data
                        cachedVideosTagStats.value = currentTagStatsData
                    }
                    cachedKeyword.value = keyword.value
                    cachedTag.value = selectedTag.value
                }
            }
        } else {
            console.error('搜索失败:', response)
            searchResults.value = {}
            userResults.value = []
            postResults.value = []
            tagStats.value = []
            // 清空缓存，避免显示旧数据
            cachedAllPosts.value = []
            cachedPostsData.value = []
            cachedVideosData.value = []
            cachedAllTagStats.value = []
            cachedPostsTagStats.value = []
            cachedVideosTagStats.value = []
            cachedKeyword.value = ''
            cachedTag.value = ''
        }
    } catch (error) {
        console.error('搜索失败:', error)
        searchResults.value = {}
        userResults.value = []
        postResults.value = []
        tagStats.value = []
        // 清空缓存，避免显示旧数据
        cachedAllPosts.value = []
        cachedPostsData.value = []
        cachedVideosData.value = []
        cachedAllTagStats.value = []
        cachedPostsTagStats.value = []
        cachedVideosTagStats.value = []
        cachedKeyword.value = ''
        cachedTag.value = ''
    } finally {
        loading.value = false
    }
}

// 从实际的帖子数据中计算标签统计
function calculateTagStatsFromPosts(posts) {
    const tagMap = new Map()

    posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach(tag => {
                const tagName = tag.name || tag.id || tag.label
                if (tagName) {
                    tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1)
                }
            })
        }
    })

    // 转换为数组并按count排序，取前10个
    const tagStats = Array.from(tagMap.entries())
        .map(([name, count]) => ({
            id: name,
            label: name,
            count: count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

    return tagStats
}

function handleUserResults(usersData) {
    if (usersData && usersData.data) {
        userResults.value = usersData.data.map(user => {
            const transformedUser = {
                id: user.id,
                nickname: user.nickname,
                userId: user.user_id,
                avatar: user.avatar,
                verified: user.verified || 0,
                followers: user.fans_count || 0,
                posts: user.post_count || 0,
                isFollowing: user.isFollowing || false,
                buttonType: user.buttonType || 'follow',
                bio: user.bio,
                location: user.location
            }

            return transformedUser
        })
    } else {
        userResults.value = []
    }
}

function handlePostResults(postsData) {
    if (postsData && postsData.data && postsData.data.length > 0) {
        // 使用数组解构强制触发响应式更新
        postResults.value = [...postsData.data]
    } else {
        postResults.value = []
        // 如果搜索结果为空，清空对应的缓存（包括标签统计）
        if (activeTab.value === 'all') {
            cachedAllPosts.value = []
            cachedAllTagStats.value = []
        } else if (activeTab.value === 'posts') {
            cachedPostsData.value = []
            cachedPostsTagStats.value = []
        } else if (activeTab.value === 'videos') {
            cachedVideosData.value = []
            cachedVideosTagStats.value = []
        }
    }
}

function handleTabChange(item) {
    if (activeTab.value === item.id && !route.query.tag) return

    // 立即更新 UI 状态，确保视觉响应是实时的
    activeTab.value = item.id
    navigationStore.scrollToTop('instant')

    // 构造新的 query，确保状态清理彻底
    const newQuery = { ...route.query }
    
    // 切换tab时，重置标签选择为空
    if (item.id !== 'users') {
        selectedTag.value = ''
        delete newQuery.tag
    }

    router.replace({
        path: `/search_result/${item.id}`,
        query: newQuery
    })
}

function handleTagReload() {
    isTagLoading.value = true

    setTimeout(() => {
        isTagLoading.value = false
    }, 700)
}

function handleFloatingBtnReload() {
    isTagLoading.value = true

    eventStore.triggerFloatingBtnReload()

    // 触发强制重新检查图片加载事件
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('force-recheck'))
    }, 100)

    setTimeout(() => {
        isTagLoading.value = false
    }, 700)
}

function handleFloatingBtnReloadRequest() {
    // 清除所有缓存并重新搜索
    cachedAllPosts.value = []
    cachedPostsData.value = []
    cachedVideosData.value = []
    cachedAllTagStats.value = []
    cachedPostsTagStats.value = []
    cachedVideosTagStats.value = []
    cachedKeyword.value = ''
    cachedTag.value = ''

    // 调用刷新逻辑
    handleFloatingBtnReload()

    // 重新搜索当前内容
    setTimeout(() => {
        searchContent(activeTab.value)
    }, 100)
}


function handleUserClick(user) {
    const userUrl = `${window.location.origin}/user/${user.userId}`
    window.open(userUrl, '_blank')
}

function handleUserFollow(user) {
    console.log('关注用户:', user)
}

function handleUserUnfollow(user) {
    console.log('取消关注用户:', user)
}



// 添加标志位避免重复搜索
const isInitialLoad = ref(true)

watch(() => route.query, (newQuery, oldQuery) => {
    const newKeyword = newQuery.keyword || ''
    const newTag = newQuery.tag || ''
    const oldKeyword = oldQuery?.keyword || ''
    const oldTag = oldQuery?.tag || ''

    // 初始化时只同步，不重复请求（由 onMounted 统一触发首刷）
    if (isInitialLoad.value) {
        keyword.value = newKeyword
        selectedTag.value = newTag
        return
    }

    // 以路由前后值判断是否变化，避免本地状态提前变化导致漏请求
    const queryChanged = newKeyword !== oldKeyword || newTag !== oldTag
    if (!queryChanged) return

    keyword.value = newKeyword
    selectedTag.value = newTag

    // 关键词变化时清空缓存，确保不会吃到旧数据
    if (newKeyword !== oldKeyword) {
        cachedAllPosts.value = []
        cachedPostsData.value = []
        cachedVideosData.value = []
        cachedAllTagStats.value = []
        cachedPostsTagStats.value = []
        cachedVideosTagStats.value = []
        cachedKeyword.value = ''
        cachedTag.value = ''
    }

    navigationStore.scrollToTop('instant')
    const targetTab = route.params.tab || activeTab.value
    searchContent(targetTab)
}, { immediate: true })

watch(() => route.params.tab, (newTab, oldTab) => {
    if (newTab && ['all', 'posts', 'videos', 'users'].includes(newTab)) {
        activeTab.value = newTab

        // 非初始化阶段，tab 变化时强制请求，避免 URL 与内容不同步
        if (!isInitialLoad.value && newTab !== oldTab) {
            searchContent(newTab)
        }
    }
}, { immediate: true })

onMounted(() => {
    keyword.value = route.query.keyword || ''
    activeTab.value = route.params.tab || 'all'

    // 处理tag参数
    if (route.query.tag) {
        selectedTag.value = route.query.tag
        // 不需要清除tag参数，保持它在URL中
        // 直接开始搜索，包含标签过滤
        searchContent(activeTab.value)
        // 标记初始化完成，允许watch触发搜索
        isInitialLoad.value = false
    } else {
        // 没有tag参数，正常初始化
        selectedTag.value = ''
        if (keyword.value) {
            searchContent(activeTab.value)
        }
        // 标记初始化完成，允许watch触发搜索
        isInitialLoad.value = false
    }

    eventListenerKey = eventStore.addEventListener('floating-btn-reload-request', handleFloatingBtnReload)
})

onUnmounted(() => {
    if (eventListenerKey) {
        eventStore.removeEventListener(eventListenerKey)
    }
})
</script>

<template>
    <div class="search-container">

        <TabContainer :tabs="searchTabs" :activeTab="activeTab" @tab-change="handleTabChange" />


        <TagContainer v-if="shouldShowTagContainer" :tagStats="currentTagStats" :activeTag="selectedTag"
            :activeTab="activeTab" @tag-reload="handleTagReload" />


        <LoadingSpinner v-if="isTagLoading" />


        <div class="search-main" :class="{ 'with-loading': isTagLoading }">

            <div v-if="activeTab === 'users'">
                <UserList :users="userResults" :loading="loading" @follow="handleUserFollow"
                    @unfollow="handleUserUnfollow" @userClick="handleUserClick" />
            </div>


            <div v-else>
                <!-- 搜索中且还没有结果时用骨架屏占位：此时渲染 WaterfallFlow 会让它自己再请求一次，
                     拿到空数据就会闪一下「没有找到相关内容」 -->
                <SkeletonList v-if="loading && postResults.length === 0" :count="8" type="image-card"
                    layout="waterfall" image-height="random" :show-stats="false" :show-button="false"
                    list-class="waterfall-layout" />

                <WaterfallFlow v-else :key="`${activeTab}-${keyword}`" :searchKeyword="keyword"
                    :searchTag="selectedTag" :preloadedPosts="postResults" :type="activeTab" />
            </div>
        </div>
        <SearchFloatingBtn @reload="handleFloatingBtnReloadRequest" />
    </div>
</template>

<style scoped>
.search-container {
    padding-top: 72px;
    min-height: 100vh;
    background: var(--bg-color-primary);
    transition: background 0.2s ease;
}

.search-main {
    padding: 0px 10px calc(48px + constant(safe-area-inset-bottom)) 10px;
    padding: 0px 10px calc(48px + env(safe-area-inset-bottom)) 10px;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    background: var(--bg-color-primary);
    transition: margin-top 0.3s ease, background 0.2s ease;
}

.search-main.with-loading {
    margin-top: 40px;
}


@media (max-width: 768px) {
    .search-main {
        padding: 15px;
    }
}
</style>
