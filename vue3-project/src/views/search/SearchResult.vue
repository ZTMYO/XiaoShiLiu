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
    { id: 'users', label: '用户' }
]

const searchResults = ref({})
const userResults = ref([])
const postResults = ref([])
const tagStats = ref([])
const loading = ref(false)

const cachedAllPosts = ref([])
const cachedKeyword = ref('')

const isTagLoading = ref(false)
let eventListenerKey = null

async function searchContent(type = 'all', page = 1, limit = 20) {
    if (!keyword.value.trim() && !selectedTag.value.trim()) {
        console.warn('搜索关键词和标签都为空')
        return
    }

    if (keyword.value.trim() && keyword.value === cachedKeyword.value && cachedAllPosts.value.length > 0 && (type === 'all' || type === 'posts')) {
        if (!selectedTag.value.trim()) {
            postResults.value = cachedAllPosts.value
            return
        } else {
            filterPostsByTag()
            return
        }
    }

    loading.value = true
    try {

        const params = new URLSearchParams({
            type,
            page: page.toString(),
            limit: limit.toString()
        })

        if (keyword.value.trim()) {
            params.append('keyword', keyword.value.trim())
        }

        if (selectedTag.value.trim() && (type === 'users' || !keyword.value.trim())) {
            params.append('tag', selectedTag.value.trim())
        }

        const response = await fetch(`${apiConfig.baseURL}/search?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(res => res.json())



        if (response && response.code === 200 && response.data) {
            searchResults.value = response.data

            if (response.data.tagStats) {
                tagStats.value = response.data.tagStats
            } else if (response.data.posts && response.data.posts.tagStats) {
                tagStats.value = response.data.posts.tagStats
            } else {
                tagStats.value = []
            }

            if (type === 'users' || (type === 'all' && response.data.users)) {
                handleUserResults(response.data.users)
            }

            if (type === 'posts' || (type === 'all' && response.data.posts)) {
                handlePostResults(response.data.posts)

                if (keyword.value.trim() && !selectedTag.value.trim() && response.data.posts && response.data.posts.data) {
                    cachedAllPosts.value = response.data.posts.data
                    cachedKeyword.value = keyword.value
                }
            }

            if (selectedTag.value && keyword.value === cachedKeyword.value && cachedAllPosts.value.length > 0 && (type === 'all' || type === 'posts')) {
                filterPostsByTag()
            }
        } else {
            console.error('搜索失败:', response)
            searchResults.value = {}
            userResults.value = []
            postResults.value = []
            tagStats.value = []
        }
    } catch (error) {
        console.error('搜索失败:', error)
        searchResults.value = {}
        userResults.value = []
        postResults.value = []
        tagStats.value = []
    } finally {
        loading.value = false
    }
}

function filterPostsByTag() {
    if (!selectedTag.value || !cachedAllPosts.value.length) {
        postResults.value = cachedAllPosts.value
        return
    }

    const filteredPosts = cachedAllPosts.value.filter(post => {
        return post.tags && post.tags.some(tag => tag.name === selectedTag.value)
    })

    postResults.value = filteredPosts
}

function handleUserResults(usersData) {
    if (usersData && usersData.data) {
        userResults.value = usersData.data.map(user => {
            const transformedUser = {
                id: user.id,
                nickname: user.nickname,
                userId: user.user_id,
                avatar: user.avatar,
                followers: user.fans_count || 0,
                notes: user.post_count || 0,
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
    if (postsData && postsData.data) {
        postResults.value = postsData.data
    } else {
        postResults.value = []
    }
}

function handleTabChange(item) {
    activeTab.value = item.id
    navigationStore.scrollToTop('instant')

    if (item.id === 'users') {
        searchContent(activeTab.value)
    } else {
        if (cachedAllPosts.value.length > 0 && cachedKeyword.value === keyword.value) {
            console.log('使用缓存数据')
            if (selectedTag.value && selectedTag.value.trim()) {
                filterPostsByTag()
            } else {
                postResults.value = [...cachedAllPosts.value] // 使用数组复制触发变化检测
            }
        } else {
            // 暂时统一使用 'all' 类型，让"全部"和"图文"使用完全相同的逻辑
            searchContent('all')
        }
    }
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

    setTimeout(() => {
        isTagLoading.value = false
    }, 700)
}

function handleFloatingBtnReloadRequest() {
    // 清除缓存并重新搜索
    cachedAllPosts.value = []
    cachedKeyword.value = ''

    // 调用现有的刷新逻辑
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



watch(() => route.query, (newQuery) => {
    const newKeyword = newQuery.keyword || ''
    const newTag = newQuery.tag || ''

    const keywordChanged = newKeyword !== keyword.value

    if (newKeyword !== keyword.value || newTag !== selectedTag.value) {
        keyword.value = newKeyword
        selectedTag.value = newTag

        if (keywordChanged) {
            cachedAllPosts.value = []
            cachedKeyword.value = ''
        }
        navigationStore.scrollToTop('instant')
        searchContent(activeTab.value)
    }
}, { immediate: true })

watch(() => route.params.tab, (newTab) => {
    if (newTab && ['all', 'posts', 'users'].includes(newTab)) {
        activeTab.value = newTab
        searchContent(activeTab.value)
    }
}, { immediate: true })

onMounted(() => {
    keyword.value = route.query.keyword || ''
    selectedTag.value = route.query.tag || ''
    activeTab.value = route.params.tab || 'all'

    if (keyword.value || selectedTag.value) {
        searchContent(activeTab.value)
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


        <TagContainer :tagStats="tagStats" :activeTag="selectedTag" :activeTab="activeTab"
            @tag-reload="handleTagReload" />


        <LoadingSpinner v-if="isTagLoading" />


        <div class="search-main" :class="{ 'with-loading': isTagLoading }">

            <div v-if="activeTab === 'users'">
                <UserList :users="userResults" :loading="loading" @follow="handleUserFollow"
                    @unfollow="handleUserUnfollow" @userClick="handleUserClick" />
            </div>


            <div v-else>
                <WaterfallFlow :searchKeyword="keyword" :searchTag="selectedTag" :preloadedPosts="postResults" />
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