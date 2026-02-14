<template>
  <div class="post-item">
    <!-- 上半部分：缩略图、标题内容、操作按钮 -->
    <div class="post-upper">
      <div class="post-thumbnail" @click="goToPostDetail">
        <img v-if="post.type === 2 && post.images && post.images.length > 0" :src="post.images[0]" :alt="post.title"
          @error="handleImageError" />
        <img
          v-else-if="post.type !== 2 && ((post.originalData?.images && post.originalData.images.length > 0) || (post.images && post.images.length > 0))"
          :src="(post.originalData?.images && post.originalData.images[0]) || (post.images && post.images[0]) || post.image"
          :alt="post.title" @error="handleImageError" />
        <div v-else-if="post.type === 2" class="video-thumbnail">
          <span>视频</span>
        </div>
        <div v-else class="no-image">
          <SvgIcon name="image" width="24" height="24" />
        </div>
      </div>

      <div class="post-text-content" @click="goToPostDetail">
        <h3 class="post-title">{{ post.title }}</h3>
        <p class="post-content">
          {{ truncateContent(post.content) }}
        </p>
      </div>

      <div class="post-actions">
        <button class="action-btn edit-btn" @click="handleEdit">
          <SvgIcon name="edit" width="16" height="16" />
          编辑
        </button>
        <button class="action-btn delete-btn" @click="handleDelete">
          <SvgIcon name="delete" width="16" height="16" />
          删除
        </button>
      </div>
    </div>

    <!-- 下半部分：meta标签和发布时间 -->
    <div class="post-lower">
      <div class="meta-row">
        <span class="category">{{ getCategoryName(post.category) }}</span>
        <span class="stats">
          <SvgIcon name="view" width="14" height="14" />
          {{ post.view_count }}
        </span>
        <span class="stats">
          <SvgIcon name="like" width="14" height="14" />
          {{ post.like_count }}
        </span>
        <span class="stats">
          <SvgIcon name="collect" width="14" height="14" />
          {{ post.collect_count }}
        </span>
        <span class="stats">
          <SvgIcon name="chat" width="14" height="14" />
          {{ post.comment_count }}
        </span>
      </div>
      <div class="date-row">
        <span class="date">{{ formatDate(post.originalData?.createdAt || post.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import SvgIcon from './SvgIcon.vue'
import defaultPlaceholder from '@/assets/imgs/未加载.png'

// Props定义
const props = defineProps({
  post: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

// 事件定义
const emit = defineEmits(['edit', 'delete', 'view'])

// 获取分类名称
const getCategoryName = (category) => {
  return category || '未知'
}

// 截断内容
const sanitizeContent = (rawContent) => {
  if (!rawContent) return ''
  const decodedContent = rawContent
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
  // 将换行标签转换为空格，避免直接显示出来
  const normalizedContent = decodedContent.replace(/<br\s*\/?>/gi, ' ')
  // 去除其他 HTML 标签，保持纯文本显示
  const withoutTags = normalizedContent.replace(/<\/?[^>]+>/g, ' ')
  // 规整多余空白字符
  return withoutTags.replace(/\s+/g, ' ').trim()
}

const truncateContent = (content) => {
  const plainText = sanitizeContent(content)
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) {
    return '未知时间'
  }

  const date = new Date(dateString)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '无效日期'
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 处理图片加载错误
const handleImageError = (event) => {
  const img = event.target
  // 直接替换为未加载图片
  img.src = defaultPlaceholder
  img.style.display = 'block'
}

// 处理编辑事件
const handleEdit = () => {
  emit('edit', props.post)
}

// 处理删除事件
const handleDelete = () => {
  emit('delete', props.post)
}

// 查看笔记详情 - 触发view事件而不是跳转
const goToPostDetail = (event) => {
  emit('view', props.post, event)
}
</script>

<style scoped>
.post-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-color-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color-primary);
  transition: all 0.2s ease;
}

.post-upper {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.post-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.post-text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  margin-right: 1rem;
  cursor: pointer;
}

.post-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
  flex-shrink: 0;
  width: 80px;
}

.post-lower {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-item:hover {
  border-color: var(--primary-color);
}

.post-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.no-image {
  width: 100%;
  height: 100%;
  background: var(--bg-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  background: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
  gap: 0.25rem;
}

.video-thumbnail span {
  font-size: 0.75rem;
}

.post-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color-primary);
  line-height: 1.4;
}

.post-content {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.date-row {
  margin-left: auto;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: nowrap;
}

.category {
  background: var(--primary-color);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.stats {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 12px;
}

.date {
  font-size: 0.8rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.edit-btn {
  background: var(--primary-color);
  color: white;
}

.edit-btn:hover {
  opacity: 0.8;
}

.delete-btn {
  background: var(--primary-color);
  color: white;
}

.delete-btn:hover {
  background: var(--primary-color-dark);
}

@media (max-width: 960px) {
  .post-item {
    padding: 0.75rem;
  }

  .post-upper {
    gap: 0.75rem;
  }

  .post-thumbnail {
    width: 60px;
    height: 60px;
  }

  .post-text-content {
    margin-right: 0.5rem;
  }

  .post-title {
    font-size: 0.9rem;
    line-height: 1.3;
  }

  .post-content {
    font-size: 0.8rem;
    line-height: 1.4;
    margin-bottom: 0.75rem;
  }

  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .date-row {
    margin-right: 0;
    order: 2;
  }

  .meta-row {
    order: 1;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>