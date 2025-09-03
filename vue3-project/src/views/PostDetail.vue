<template>
  <div class="post-detail-page">

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>


    <div v-else>

      <button v-if="showBackButton" @click="goBack" class="back-home-btn">
        <SvgIcon name="close" />
      </button>

      <DetailCard :item="postData" :page-mode="true" :disable-auto-fetch="true" @follow="handleFollow"
        @unfollow="handleUnfollow" @like="handleLike" @collect="handleCollect" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail } from '@/api/posts'
import DetailCard from '@/components/DetailCard.vue'
import SvgIcon from '@/components/SvgIcon.vue'

const route = useRoute()
const router = useRouter()

const postData = ref(null)
const loading = ref(true)

// 响应式显示返回主页按钮（只在移动端显示）
const showBackButton = ref(false)

// 保存原始页面标题
const originalTitle = ref('')

const updateShowBackButton = () => {
  showBackButton.value = window.innerWidth <= 768
}




// 返回主页
const goBack = () => {
  router.push('/explore')
}

// 获取帖子详情
const fetchPostDetail = async (postId) => {
  try {
    loading.value = true
    const response = await getPostDetail(postId)

    if (response) {
      postData.value = response
      // 设置页面标题
      document.title = response.title || '帖子详情'
    } else {
      router.replace({ name: 'not_found' })
      return
    }
  } catch (error) {
    console.error('获取帖子详情出错:', error)
    router.replace({ name: 'not_found' })
    return
  } finally {
    loading.value = false
  }
}



// DetailCard事件处理函数
const handleFollow = (userId) => {
  console.log('关注用户:', userId)
  // 这里可以添加关注逻辑
}

const handleUnfollow = (userId) => {
  console.log('取消关注用户:', userId)
  // 这里可以添加取消关注逻辑
}

const handleLike = (postId) => {
  console.log('点赞帖子:', postId)
  // 这里可以添加点赞逻辑
}

const handleCollect = (postId) => {
  console.log('收藏帖子:', postId)
  // 这里可以添加收藏逻辑
}

// 组件挂载时获取帖子详情
onMounted(() => {
  // 保存原始页面标题
  originalTitle.value = document.title
  
  const postId = route.query.id
  if (postId) {
    fetchPostDetail(postId)
  } else {
    router.replace({ name: 'not_found' })
    loading.value = false
  }

  // 初始化返回按钮显示状态
  updateShowBackButton()
  window.addEventListener('resize', updateShowBackButton)
})

// 组件卸载时恢复原始标题
onUnmounted(() => {
  // 恢复原始页面标题
  if (originalTitle.value) {
    document.title = originalTitle.value
  }
  
  // 移除事件监听器
  window.removeEventListener('resize', updateShowBackButton)
})
</script>

<style scoped>
.post-detail-page {
  min-height: calc(100vh - 64px);
  margin: 10px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding-top: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 20px 20px 20px;
}

/* 中等屏幕适配 */
@media (max-width: 960px) {
  .post-detail-page {
    margin: 0;
    padding: 0;
    padding-top: 64px;
    width: 100vw;
    max-width: 100vw;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .post-detail-page {
    margin: 0;
    padding: 0;
    overflow-y: visible;
    overflow-x: hidden;
    width: 100vw;
    height: 100vh;
    min-height: 100vh;
    max-width: 100vw;
    display: block;
    border-radius: 0;
    box-shadow: none;
    align-items: normal;
    justify-content: normal;
  }
}

/* 返回主页按钮样式 */
.back-home-btn {
  position: fixed;
  top: calc(16px + env(safe-area-inset-top));
  left: 16px;
  z-index: 1001;
  background: transparent;
  color: var(--text-color-secondary);
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-home-btn:hover {
  background: rgba(144, 144, 144, 0.292);
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 中等屏幕和移动端的加载状态样式 */
@media (max-width: 960px) {
  .loading-container {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    min-height: calc(100vh - 64px);
    width: 100%;
  }
}

@media (max-width: 768px) {
  .loading-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transform: none;
    min-height: 100vh;
    width: 100vw;
    height: 100vh;
    padding: 20px;
    box-sizing: border-box;
    background: var(--bg-color-primary);
    z-index: 1000;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color-primary);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

/* 移动端加载动画 */
@media (max-width: 768px) {
  .loading-spinner {
    width: 48px;
    height: 48px;
    border-width: 5px;
    margin-bottom: 20px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>