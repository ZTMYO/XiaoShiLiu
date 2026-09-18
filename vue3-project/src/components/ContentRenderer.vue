<template>
  <div class="content-renderer" :class="{ compact }">
    <!-- 文字内容 -->
    <div v-if="text" class="content-text">
      <span class="mention-text" v-html="parsedText" @click="handleMentionClick"></span>
    </div>

    <!-- 图片内容 -->
    <div v-if="images && images.length > 0" class="content-images">
      <div class="images-grid" :class="getGridClass()">
        <div v-for="(image, index) in images" :key="index" class="image-item"
          @click="$emit('image-click', { images: images, index })">
          <img :src="image" :alt="`图片${index + 1}`" class="content-image" @error="handleImageError" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import defaultPlaceholder from '@/assets/imgs/未加载.png'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  },
  highlightWords: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['image-click'])

// 获取实际内容，优先使用content，其次使用text
const actualContent = computed(() => {
  return props.content || props.text || ''
})

// 解析content内容，提取文字和图片
const parsedContent = computed(() => {
  if (!actualContent.value) return { text: '', images: [] }

  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = actualContent.value

  // 提取图片
  const imgElements = tempDiv.querySelectorAll('img')
  const images = Array.from(imgElements).map(img => img.src)

  // 移除图片元素，获取文本（保留mention链接的HTML格式）
  imgElements.forEach(img => img.remove())

  // 保留mention链接的HTML格式，只处理其他标签
  let htmlContent = tempDiv.innerHTML
  
  // 保护mention链接
  const mentionLinkRegex = /<a[^>]*class="[^"]*mention-link[^"]*"[^>]*>.*?<\/a>/g
  const mentionLinks = []
  let linkIndex = 0
  
  // 提取并保护mention链接
  htmlContent = htmlContent.replace(mentionLinkRegex, (match) => {
    const placeholder = `__MENTION_LINK_${linkIndex}__`
    mentionLinks[linkIndex] = match
    linkIndex++
    return placeholder
  })
  
  // 处理其他HTML标签
  htmlContent = htmlContent.replace(/<br\s*\/?>/gi, '\n')
  htmlContent = htmlContent.replace(/<\/div><div>/gi, '\n')
  htmlContent = htmlContent.replace(/<div>/gi, '')
  htmlContent = htmlContent.replace(/<\/div>/gi, '')
  htmlContent = htmlContent.replace(/<\/p><p>/gi, '\n')
  htmlContent = htmlContent.replace(/<p>/gi, '')
  htmlContent = htmlContent.replace(/<\/p>/gi, '')
  
  // 恢复mention链接
  mentionLinks.forEach((link, index) => {
    htmlContent = htmlContent.replace(`__MENTION_LINK_${index}__`, link)
  })

  return { text: htmlContent.trim(), images }
})

const text = computed(() => parsedContent.value.text)
const images = computed(() => parsedContent.value.images)

const escapeRegExp = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// 解析文本中的mention标记
const parsedText = computed(() => {
  // 由于text现在已经包含HTML格式的mention链接，直接返回
  // 服务端已经进行了安全过滤，这里信任数据库的数据
  if (!props.highlightWords.length) return text.value

  // 逐段处理：标签片段（如mention链接）原样保留，仅对文本片段做高亮包裹
  const pattern = new RegExp(`(${props.highlightWords.map(escapeRegExp).join('|')})`, 'gi')
  return text.value
    .split(/(<[^>]*>)/)
    .map(part => part.startsWith('<') ? part : part.replace(pattern, '<span class="sensitive-word">$1</span>'))
    .join('')
})

// 处理mention链接点击事件
const handleMentionClick = (event) => {
  const target = event.target

  // 检查点击的是否是mention链接
  if (target.classList.contains('mention-link')) {
    event.preventDefault()
    const userId = target.getAttribute('data-user-id')

    if (userId) {
      // 在新标签页中打开用户主页
      const userUrl = `${window.location.origin}/user/${userId}`
      window.open(userUrl, '_blank')
    }
  }
}

// 根据图片数量决定网格布局
const getGridClass = () => {
  const count = images.value.length
  if (count === 1) return 'single'
  if (count === 2) return 'double'
  if (count === 3) return 'triple'
  if (count === 4) return 'quad'
  return 'multiple'
}

// 图片加载失败处理
const handleImageError = (event) => {
  event.target.src = defaultPlaceholder
}
</script>

<style scoped>
.content-renderer {
  width: 100%;
}

.content-text {
  margin-bottom: 8px;
  line-height: 1.5;
  word-wrap: break-word;
}

.mention-text {
  white-space: pre-wrap;
  word-wrap: break-word;
}

:deep(.mention-link) {
  color: var(--text-color-tag);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  background: none;
  border: none;
  padding: 0;
}

:deep(.mention-link:hover) {
  color: var(--text-color-tag);
  opacity: 0.8;
}

:deep(.mention-link:active) {
  color: var(--text-color-tag);
  opacity: 0.6;
}

:deep(.mention-link:focus) {
  outline: none;
  box-shadow: none;
  border: none;
}

:deep(.sensitive-word) {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.12);
  border-radius: 2px;
}

.content-images {
  margin-top: 8px;
}

.images-grid {
  display: grid;
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
}

.images-grid.single {
  display: flex;
  max-width: 200px;
}

.images-grid.double {
  grid-template-columns: 1fr 1fr;
  max-width: 200px;
}

.images-grid.triple {
  grid-template-columns: 1fr 1fr 1fr;
  max-width: 240px;
}

.images-grid.quad {
  grid-template-columns: 1fr 1fr;
  max-width: 200px;
}

.images-grid.multiple {
  grid-template-columns: repeat(3, 1fr);
  max-width: 240px;
}

.image-item {
  position: relative;
  cursor: zoom-in;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.image-item:hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

.images-grid:not(.single) .image-item {
  aspect-ratio: 1;
}

.images-grid.single .image-item {
  overflow: hidden;
  border-radius: 8px;
  cursor: zoom-in;
  width: fit-content;
}

.images-grid.single .content-image {
  display: block;
  max-width: 100%;
  max-height: 160px;
  width: auto;
  height: auto;
}

.content-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .images-grid.single {
    max-width: 150px;
  }

  .images-grid.double {
    max-width: 150px;
  }

  .images-grid.triple {
    max-width: 180px;
  }

  .images-grid.quad {
    max-width: 150px;
  }

  .images-grid.multiple {
    max-width: 180px;
  }
}

.content-renderer.compact .images-grid {
  max-width: 140px;
}
</style>