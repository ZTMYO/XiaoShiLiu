<template>
  <div class="admin-monitor">
    <div class="monitor-content">
      <div class="activities-section">
        <div v-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="activities.length === 0" class="empty-state">
          <p>暂无动态</p>
        </div>

        <div v-else class="activities-list">
          <div v-for="activity in activities" :key="activity.id" class="activity-item"
            @click="handleActivityClick(activity)">
            <div class="activity-icon">
              <img :src="activity.avatar || getDefaultAvatar(activity.user_id)" alt="avatar" class="activity-avatar"
                @error="onAvatarError($event)" />
            </div>
            <div class="activity-content">
              <div class="activity-nickname">{{ activity.nickname }}</div>
              <div class="activity-meta">
                <span class="activity-type">{{ getActivityTypeText(activity.type) }}</span>
                <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
              </div>
              <div class="activity-body">
                <template v-if="activity.type === 'comment_publish'">
                  <div class="comment-description">{{ activity.description }}</div>
                  <ContentRenderer :content="activity.content" compact />
                </template>
                <ContentRenderer v-else :text="activity.description || activity.content" compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '@/api'
import defaultAvatar from '@/assets/imgs/avatar.png'
import { getDefaultAvatar } from '@/utils/imageUtils'
import ContentRenderer from '@/components/ContentRenderer.vue'
const router = useRouter()
const activities = ref([])
// const loading = ref(false) // 已移除，使用AdminLayout的全局加载状态
const error = ref('')
const onAvatarError = (e) => {
  e.target.src = defaultAvatar
}

// 获取活动数据
const fetchActivities = async () => {
  try {
    error.value = ''
    const response = await adminApi.getMonitorActivities()
    if (response && response.success) {
      activities.value = Array.isArray(response.data) ? response.data : []
    } else {
      error.value = (response && response.message) || '获取动态失败'
      activities.value = []
    }
  } catch (err) {
    console.error('获取动态失败:', err)
    error.value = '网络错误，请稍后重试'
    activities.value = []
  } finally {
    // loading状态已移除
  }
}



// 获取活动图标
const getActivityIcon = (type) => {
  const iconMap = {
    'user_register': 'user',
    'post_publish': 'post',
    'comment_publish': 'chat'
  }
  return iconMap[type] || 'data'
}

// 获取活动类型文本
const getActivityTypeText = (type) => {
  const typeMap = {
    'user_register': '用户注册',
    'post_publish': '发布笔记',
    'comment_publish': '发表评论'
  }
  return typeMap[type] || '未知活动'
}

// 格式化时间
const formatTime = (timeStr) => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now - time

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }

  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }

  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }

  // 超过7天显示具体日期
  return time.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 处理活动点击
const handleActivityClick = (activity) => {
  if (activity.type === 'user_register') {
    // 新窗口打开用户主页
    const url = `${window.location.origin}/user/${activity.user_id}`
    window.open(url, '_blank')
  } else if (activity.type === 'post_publish') {
    const url = `${window.location.origin}/post?id=${activity.target_id}`
    window.open(url, '_blank')
  } else if (activity.type === 'comment_publish') {
    const url = `${window.location.origin}/post?id=${activity.target_id}&targetCommentId=${activity.id}`
    window.open(url, '_blank')
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchActivities()
})
</script>

<style scoped>
.admin-monitor {
  padding: 12px;
  background-color: var(--bg-color-primary);
  min-height: 100%;
}

.monitor-content {
  max-width: 1200px;
  margin: 0 auto;
}

.activities-section {
  background-color: var(--bg-color-primary);
  border-radius: 12px;
  border: 1px solid var(--border-color-primary);
  overflow: hidden;
}




.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  color: var(--text-color-secondary);
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.activities-list {
  padding: 0;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 14px 32px 14px 16px;
  border-bottom: 1px solid var(--border-color-primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.activity-item:hover {
  background-color: var(--bg-color-secondary);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  flex-shrink: 0;
}

.activity-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color-primary);
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-nickname {
  font-weight: 600;
  color: var(--text-color-primary);
  font-size: 15px;
  margin-bottom: 2px;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.activity-type {
  padding: 2px 8px;
  background-color: var(--bg-color-secondary);
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.activity-time {
  font-size: 12px;
  color: var(--text-color-quaternary);
  white-space: nowrap;
}

.activity-body {
  font-size: 14px;
  color: var(--text-color-primary);
  line-height: 1.4;
}
</style>