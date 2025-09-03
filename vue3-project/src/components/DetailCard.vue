<template>
  <div :class="[pageMode ? 'detail-card-page' : 'detail-card-overlay', { 'animating': isAnimating && !pageMode }]"
    v-click-outside.mousedown="!pageMode ? closeModal : undefined" v-escape-key="!pageMode ? closeModal : undefined">
    <div class="detail-card" @click.stop :style="pageMode ? {} : { width: cardWidth + 'px', ...animationStyle }"
      :class="{ 'scale-in': isAnimating && !pageMode, 'page-mode': pageMode }">
      <button v-if="!pageMode" class="close-btn" @click="closeModal" @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false">
        <SvgIcon name="close" />
        <div v-if="showTooltip" class="tooltip">
          关闭 <span class="key-hint">Esc</span>
        </div>
      </button>

      <div class="detail-content">
        <div class="image-section" :style="{ width: imageSectionWidth + 'px' }" @mouseenter="showImageControls = true"
          @mouseleave="showImageControls = false">
          <div class="image-container">
            <div class="image-slider" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }">
              <img v-for="(image, index) in imageList" :key="index" :src="image" :alt="props.item.title || '图片'"
                @load="handleImageLoad($event, index)" :style="{ objectFit: 'contain' }"
                class="slider-image image-zoomable" @click="openImageViewer" />
            </div>
            <div v-if="hasMultipleImages" class="image-controls" :class="{ 'visible': showImageControls }">
              <div class="nav-btn-container prev-btn-container" @click.stop>
                <button class="nav-btn prev-btn" @click="prevImage" :disabled="currentImageIndex === 0"
                  v-show="currentImageIndex > 0">
                  <SvgIcon name="left" width="20" height="20" />
                </button>
              </div>

              <div class="nav-btn-container next-btn-container" @click.stop>
                <button class="nav-btn next-btn" @click="nextImage"
                  :disabled="currentImageIndex === imageList.length - 1"
                  v-show="currentImageIndex < imageList.length - 1">
                  <SvgIcon name="right" width="20" height="20" />
                </button>
              </div>

              <div class="image-counter">
                {{ currentImageIndex + 1 }}/{{ imageList.length }}
              </div>
            </div>
          </div>
        </div>

        <div class="content-section" :style="windowWidth > 768 ? { width: contentSectionWidth + 'px' } : {}">
          <div class="author-wrapper">
            <div class="author-info">
              <img :src="authorData.avatar" :alt="authorData.name" class="author-avatar "
                @click="onUserClick(authorData.id)" />
              <span class="author-name" @click="onUserClick(authorData.id)">{{ authorData.name }}</span>
            </div>
            <FollowButton v-if="!isCurrentUserPost" :is-following="authorData.isFollowing" :user-id="authorData.id"
              @follow="handleFollow" @unfollow="handleUnfollow" />
          </div>

          <div class="scrollable-content">
            <div v-if="imageList && imageList.length > 0" class="mobile-image-container">
              <div class="mobile-image-slider" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
                @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
                <img v-for="(image, index) in imageList" :key="index" :src="image" :alt="`图片 ${index + 1}`"
                  class="mobile-slider-image" @click="openImageViewer" />
              </div>


              <div v-if="hasMultipleImages" class="mobile-image-controls">
                <button class="mobile-nav-btn mobile-prev-btn" @click="prevImage" :disabled="currentImageIndex === 0">
                  <SvgIcon name="left" width="20" height="20" />
                </button>
                <button class="mobile-nav-btn mobile-next-btn" @click="nextImage"
                  :disabled="currentImageIndex === imageList.length - 1">
                  <SvgIcon name="right" width="20" height="20" />
                </button>
                <div class="mobile-image-counter">
                  {{ currentImageIndex + 1 }}/{{ imageList.length }}
                </div>
              </div>
            </div>
            <div v-if="imageList.length > 1" class="mobile-dots-indicator">
              <div class="mobile-dots">
                <span v-for="(image, index) in imageList" :key="index" class="mobile-dot"
                  :class="{ active: index === currentImageIndex }" @click="goToImage(index)"></span>
              </div>
            </div>
            <div class="note-content">
              <h2 class="note-title">{{ noteData.title }}</h2>
              <p class="note-text">
                <MentionText :text="noteData.content" />
              </p>
              <div class="note-tags">
                <span v-for="tag in noteData.tags" :key="tag" class="tag clickable-tag" @click="handleTagClick(tag)">#{{
                  tag }}</span>
              </div>
              <div class="note-meta">
                <span class="time">{{ noteData.time }}</span>
                <span class="location">{{ noteData.location }}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="comments-section">
              <div class="comments-header">
                <span class="comments-title">共 {{ commentTotal || commentCount }} 条评论</span>
              </div>

              <div v-if="loadingComments" class="comments-loading">
                <div class="loading-spinner"></div>
                <span>加载评论中...</span>
              </div>

              <div v-else class="comments-list">
                <div v-if="enhancedComments.length === 0" class="no-comments">
                  <span>暂无评论，快来抢沙发吧~</span>
                </div>
                <div v-for="comment in enhancedComments" :key="comment.id" class="comment-item">
                  <img :src="comment.avatar" :alt="comment.username" class="comment-avatar clickable-avatar"
                    @click="onUserClick(comment.user_id)" />
                  <div class="comment-content">
                    <div class="comment-header">
                      <div class="comment-user-info">
                        <span class="comment-username" @click="onUserClick(comment.user_id)">
                          <span v-if="isCurrentUserComment(comment)">我</span>
                          <span v-else>{{ comment.username }}</span>
                        </span>
                      </div>
                      <button v-if="isCurrentUserComment(comment)" class="comment-delete-btn"
                        @click="handleDeleteComment(comment)">
                        删除
                      </button>
                    </div>
                    <p class="comment-text">
                      <MentionText :text="comment.content" />
                    </p>
                    <span class="comment-time">{{ comment.time }} {{ comment.location }}</span>
                    <div class="comment-actions">
                      <div class="comment-like-container">
                        <LikeButton :is-liked="comment.isLiked" size="small"
                          @click="(willBeLiked) => toggleCommentLike(comment, willBeLiked)" />
                        <span class="like-count">{{ comment.likeCount }}</span>
                      </div>
                      <div class="comment-replay-container">
                        <SvgIcon name="chat" width="16" height="16" class="comment-replay-icon"
                          @click="handleReplyComment(comment)" />
                        <button class="comment-reply" @click="handleReplyComment(comment)">回复</button>
                      </div>
                    </div>

                    <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                      <div v-for="reply in getDisplayedReplies(comment.replies, comment.id)" :key="reply.id"
                        class="reply-item">
                        <img :src="reply.avatar" :alt="reply.username" class="reply-avatar "
                          @click="onUserClick(reply.user_id)" />
                        <div class="reply-content">
                          <div class="reply-header">
                            <div class="reply-user-info">
                              <span class="reply-username" @click="onUserClick(reply.user_id)">
                                <span v-if="isCurrentUserComment(reply)">我</span>
                                <span v-else>{{ reply.username }}</span>
                              </span>
                            </div>
                            <button v-if="isCurrentUserComment(reply)" class="comment-delete-btn"
                              @click="handleDeleteReply(reply, comment.id)">
                              删除
                            </button>
                          </div>
                          <p class="reply-text">
                            回复 <span class="reply-to">{{ reply.replyTo }}</span>：
                            <MentionText :text="reply.content" />
                          </p>
                          <span class="reply-time">{{ reply.time }} {{ reply.location }}</span>
                          <div class="reply-actions">
                            <div class="reply-like-container">
                              <LikeButton :is-liked="reply.isLiked" size="small"
                                @click="(willBeLiked) => toggleCommentLike(reply, willBeLiked)" />
                              <span class="like-count">{{ reply.likeCount }}</span>
                            </div>
                            <div class="reply-replay-container">
                              <SvgIcon name="chat" width="16" height="16" class="reply-replay-icon"
                                @click="handleReplyComment(reply, reply.id)" />
                              <button class="reply-reply" @click="handleReplyComment(reply, reply.id)">回复</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="comment.replies.length > 2" class="replies-toggle">
                        <button class="toggle-replies-btn" @click="toggleRepliesExpanded(comment.id)">
                          <template v-if="!isRepliesExpanded(comment.id)">
                            展开 {{ getHiddenRepliesCount(comment.replies, comment.id) }} 条回复
                          </template>
                          <template v-else>
                            收起回复
                          </template>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer-actions">
            <div class="input-container" :class="{ 'expanded': isInputFocused }">
              <div class="input-row">
                <div class="input-wrapper">
                  <div v-if="replyingTo" class="reply-status">
                    <div class="reply-status-content">
                      <div class="reply-first-line">
                        回复 <span class="reply-username">{{ replyingTo.username }}</span>
                      </div>
                      <div class="reply-second-line">
                        <MentionText :text="replyingTo.content" />
                      </div>
                    </div>
                  </div>
                  <ContentEditableInput ref="focusedInput" v-model="commentInput" :input-class="'comment-input'"
                    :placeholder="replyingTo ? `回复 ${replyingTo.username}：` : '说点什么...'" :enable-mention="true"
                    :mention-users="mentionUsers" @focus="handleInputFocus" @keydown="handleInputKeydown"
                    @mention="handleMentionInput" />
                </div>


                <div class="action-buttons">
                  <div class="action-btn" :class="{ active: isLiked }">
                    <LikeButton :is-liked="isLiked" size="large" @click="(willBeLiked) => toggleLike(willBeLiked)" />
                    <span>{{ likeCount }}</span>
                  </div>
                  <button class="action-btn collect-btn" :class="{ active: isCollected }" @click="toggleCollect">
                    <SvgIcon :name="isCollected ? 'collected' : 'collect'" />
                    <span>{{ collectCount }}</span>
                  </button>
                  <button class="action-btn comment-btn" @click="handleCommentButtonClick">
                    <SvgIcon name="chat" />
                    <span>{{ commentTotal || commentCount }}</span>
                  </button>
                  <button class="action-btn share-btn" @click="handleShare" @mouseleave="handleShareMouseLeave">
                    <SvgIcon :name="isShared ? 'tick' : 'share'" />
                  </button>
                </div>
              </div>


              <div class="focused-actions-section">
                <div class="emoji-section">
                  <button class="mention-btn" @click="toggleMentionPanel">
                    <SvgIcon name="mention" class="mention-icon" width="24" height="24" />
                  </button>
                  <button class="emoji-btn" @click="toggleEmojiPanel">
                    <SvgIcon name="emoji" class="emoji-icon" width="24" height="24" />
                  </button>
                </div>
                <div class="send-cancel-buttons">
                  <button class="send-btn" @click="handleSendComment"
                    :disabled="!commentInput || !commentInput.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || isSendingComment">
                    {{ replyingTo ? '回复' : '发送' }}
                  </button>
                  <button class="cancel-btn" @click="handleCancelInput" :disabled="isSendingComment">
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />



    <div v-if="showEmojiPanel" class="emoji-panel-overlay" v-click-outside="closeEmojiPanel">
      <div class="emoji-panel" @click.stop>
        <EmojiPicker @select="handleEmojiSelect" />
      </div>
    </div>

    <MentionModal :visible="showMentionPanel" @close="closeMentionPanel" @select="handleMentionSelect" />


    <Transition name="image-viewer" appear>
      <div v-if="showImageViewer" class="image-viewer-overlay" @click="closeImageViewer">
        <div class="image-viewer-container" @click.stop="onViewerContainerClick">

          <button class="image-viewer-close" @click="closeImageViewer">
            <SvgIcon name="close" width="24" height="24" />
          </button>


          <div v-if="imageList.length > 1" class="image-viewer-counter">
            {{ currentImageIndex + 1 }}/{{ imageList.length }}
          </div>


          <div class="image-viewer-content">
            <div class="image-viewer-slider" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
              @touchstart="handleViewerTouchStart" @touchmove="handleViewerTouchMove" @touchend="handleViewerTouchEnd">
              <img v-for="(image, index) in imageList" :key="index" :src="image" :alt="props.item.title || '图片'"
                class="viewer-image" />
            </div>
          </div>


          <div v-if="imageList.length > 1" class="image-viewer-nav">
            <button class="viewer-nav-btn viewer-prev-btn" @click="prevImageInViewer"
              :disabled="currentImageIndex === 0" v-show="currentImageIndex > 0">
              <SvgIcon name="left" width="24" height="24" />
            </button>

            <button class="viewer-nav-btn viewer-next-btn" @click="nextImageInViewer"
              :disabled="currentImageIndex === imageList.length - 1" v-show="currentImageIndex < imageList.length - 1">
              <SvgIcon name="right" width="24" height="24" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import SvgIcon from './SvgIcon.vue'
import FollowButton from './FollowButton.vue'
import LikeButton from './LikeButton.vue'
import MessageToast from './MessageToast.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import MentionModal from '@/components/mention/MentionModal.vue'
import MentionText from './mention/MentionText.vue'
import ContentEditableInput from './ContentEditableInput.vue'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'
import { useLikeStore } from '@/stores/like.js'
import { useCollectStore } from '@/stores/collect.js'
import { useFollowStore } from '@/stores/follow.js'
import { useAuthStore } from '@/stores/auth'
import { useCommentStore } from '@/stores/comment'
import { useCommentLikeStore } from '@/stores/commentLike'
import { commentApi, postApi } from '@/api/index.js'
import { getPostDetail } from '@/api/posts.js'
import { useScrollLock } from '@/composables/useScrollLock'
import { formatTime } from '@/utils/timeFormat'

const router = useRouter()

const props = defineProps({
  disableAutoFetch: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    required: true
  },
  clickPosition: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  pageMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'follow', 'unfollow', 'like', 'collect'])

const themeStore = useThemeStore()
const userStore = useUserStore()
const likeStore = useLikeStore()
const collectStore = useCollectStore()
const followStore = useFollowStore()
const commentStore = useCommentStore()
const commentLikeStore = useCommentLikeStore()
const authStore = useAuthStore()

const { lock, unlock } = useScrollLock()
const { lock: lockImageViewer, unlock: unlockImageViewer } = useScrollLock()

const commentInput = ref('')
const isLiked = computed(() => likeStore.getPostLikeState(props.item.id)?.liked || false)
const likeCount = computed(() => likeStore.getPostLikeState(props.item.id)?.likeCount || props.item.likeCount || props.item.like_count || 0)
const isCollected = computed(() => collectStore.getPostCollectState(props.item.id)?.collected || false)
const collectCount = computed(() => collectStore.getPostCollectState(props.item.id)?.collectCount || props.item.collectCount || props.item.collect_count || 0)
const commentCount = ref(props.item.commentCount || props.item.comment_count || 0)
const showTooltip = ref(false)
const imageSectionWidth = ref(400)
const isInputFocused = ref(false)

const currentImageIndex = ref(0)
const showImageControls = ref(false)
const showImageViewer = ref(false) // 图片查看器状态

// 用于mention功能的用户数据（实际使用中应该从 API 获取）
const mentionUsers = ref([])
const focusedInput = ref(null)
const isAnimating = ref(true)
const isSendingComment = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const isShared = ref(false)

const replyingTo = ref(null)
const expandedReplies = ref(new Set())

const showEmojiPanel = ref(false)
const showMentionPanel = ref(false)

const contentSectionWidth = computed(() => {
  if (windowWidth.value <= 768) {
    return windowWidth.value
  }

  const maxTotalWidth = windowWidth.value * 0.95
  const minContentWidth = 350
  const maxContentWidth = 400

  const remainingWidth = maxTotalWidth - imageSectionWidth.value

  return Math.max(minContentWidth, Math.min(maxContentWidth, remainingWidth))
})

const cardWidth = computed(() => {
  return imageSectionWidth.value + contentSectionWidth.value
})

const animationStyle = computed(() => {
  if (!isAnimating.value) return {}

  const { x, y } = props.clickPosition
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  const translateX = (x - centerX) * 0.3
  const translateY = (y - centerY) * 0.3

  return {
    '--start-x': `${translateX}px`,
    '--start-y': `${translateY}px`
  }
})

const authorData = computed(() => {
  // 使用小石榴号进行用户跳转
  const userId = props.item.author_account || props.item.originalData?.userId || props.item.user_id
  const followState = followStore.getUserFollowState(userId)

  return {
    id: userId,
    name: props.item.nickname || props.item.author || '匿名用户',
    avatar: props.item.user_avatar || props.item.avatar || new URL('@/assets/imgs/未加载.png', import.meta.url).href,
    isFollowing: followState.followed
  }
})

// 判断当前用户是否为笔记作者
const isCurrentUserPost = computed(() => {
  if (!userStore.isLoggedIn || !userStore.userInfo) {
    return false
  }

  const currentUserId = userStore.userInfo.id // 当前用户的自增ID
  const authorId = props.item.author_auto_id // 笔记作者的自增ID

  return currentUserId === authorId
})

const noteData = computed(() => {
  const data = {
    title: props.item.title || '无标题',
    content: props.item.originalData?.content || props.item.content || '暂无内容',
    tags: props.item.originalData?.tags ?
      (Array.isArray(props.item.originalData.tags) ?
        props.item.originalData.tags.map(tag => typeof tag === 'object' ? tag.name : tag) :
        []) :
      (props.item.tags ?
        (Array.isArray(props.item.tags) ?
          props.item.tags.map(tag => typeof tag === 'object' ? tag.name : tag) :
          []) :
        []),
    time: formatTime(props.item.originalData?.createdAt || props.item.created_at || props.item.time),
    location: props.item.location || ''
  }
  return data
})

const imageList = computed(() => {
  if (props.item.originalData?.images && Array.isArray(props.item.originalData.images) && props.item.originalData.images.length > 0) {
    return props.item.originalData.images
  }
  if (props.item.images && Array.isArray(props.item.images) && props.item.images.length > 0) {
    return props.item.images
  }
  if (props.item.image) {
    return [props.item.image]
  }
  return [new URL('@/assets/imgs/未加载.png', import.meta.url).href]
})

const hasMultipleImages = computed(() => imageList.value.length > 1)



const comments = computed(() => commentStore.getComments(props.item.id).comments || [])
const loadingComments = computed(() => commentStore.getComments(props.item.id).loading || false)
const commentTotal = computed(() => commentStore.getComments(props.item.id).total || 0)

const enhancedComments = computed(() => {
  return comments.value.map(comment => {
    const commentLikeState = commentLikeStore.getCommentLikeState(comment.id)
    const enhancedReplies = comment.replies ? comment.replies.map(reply => {
      const replyLikeState = commentLikeStore.getCommentLikeState(reply.id)
      return {
        ...reply,
        isLiked: replyLikeState.liked,
        likeCount: replyLikeState.likeCount
      }
    }) : []

    return {
      ...comment,
      isLiked: commentLikeState.liked,
      likeCount: commentLikeState.likeCount,
      replies: enhancedReplies
    }
  })
})

watch(commentTotal, (newTotal) => {
  commentCount.value = newTotal

  if (props.item.commentCount !== newTotal) {
    props.item.commentCount = newTotal
  }
})

watch(() => props.item.id, () => {
  currentImageIndex.value = 0
})

const fetchComments = async () => {
  try {
    const result = await commentStore.fetchComments(props.item.id)
    await nextTick()
    const latestComments = comments.value
    if (latestComments && latestComments.length > 0 && userStore.isLoggedIn) {
      commentLikeStore.initCommentsLikeStates(latestComments)
    }
  } catch (error) {
    console.error(`获取笔记[${props.item.id}]评论失败:`, error)
    if (error.message && !error.message.includes('401') && !error.message.includes('未授权')) {
      showMessage('获取评论失败，请稍后重试', 'error')
    }
  }
}

const isCurrentUserComment = (comment) => {
  if (!userStore.isLoggedIn) {
    return false
  }

  let currentUser = userStore.userInfo
  if (!currentUser) {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        currentUser = JSON.parse(savedUserInfo)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        return false
      }
    } else {
      return false
    }
  }

  const commentUserId = comment.user_auto_id
  return commentUserId === currentUser.id
}

const handleDeleteComment = async (comment) => {
  if (!isCurrentUserComment(comment)) {
    showMessage('只能删除自己发布的评论', 'error')
    return
  }

  try {
    // 先调用后端API删除评论
    const response = await commentApi.deleteComment(comment.id)

    // 只有后端删除成功后，才更新前端状态
    const currentComments = commentStore.getComments(props.item.id)
    if (currentComments && currentComments.comments) {
      const updatedComments = currentComments.comments.filter(c => c.id !== comment.id)
      
      // 使用后端返回的删除数量来更新总数
      const deletedCount = response.data?.deletedCount || 1
      commentStore.updateComments(props.item.id, {
        comments: updatedComments,
        total: currentComments.total - deletedCount
      })
    }

    showMessage('评论已删除', 'success')
  } catch (error) {
    console.error('删除评论失败:', error)
    showMessage('删除评论失败，请重试', 'error')
  }
}

const handleDeleteReply = async (reply, commentId) => {
  if (!isCurrentUserComment(reply)) {
    showMessage('只能删除自己发布的回复', 'error')
    return
  }

  try {
    // 先调用后端API删除回复
    const response = await commentApi.deleteComment(reply.id)

    // 只有后端删除成功后，才更新前端状态
    const currentComments = commentStore.getComments(props.item.id)
    if (currentComments && currentComments.comments) {
      const targetComment = currentComments.comments.find(c => c.id === commentId)
      if (targetComment) {
        targetComment.replies = targetComment.replies.filter(r => r.id !== reply.id)

        // 使用后端返回的删除数量来更新总数
        const deletedCount = response.data?.deletedCount || 1
        commentStore.updateComments(props.item.id, {
          comments: currentComments.comments,
          total: currentComments.total - deletedCount
        })

        showMessage('回复已删除', 'success')
      } else {
        showMessage('找不到对应评论，请刷新页面', 'error')
      }
    }
  } catch (error) {
    console.error('删除回复失败:', error)
    showMessage('删除回复失败，请重试', 'error')
  }
}

const closeModal = () => {
  unlock()
  emit('close')
}



const handleFollow = (userId) => {
  // FollowButton组件已经处理了关注逻辑和状态更新，这里只需要触发事件
  emit('follow', userId)
}

const handleUnfollow = (userId) => {
  // FollowButton组件已经处理了取消关注逻辑和状态更新，这里只需要触发事件
  emit('unfollow', userId)
}

const toggleLike = async (willBeLiked) => {
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    authStore.openLoginModal()
    return
  }

  try {
    // 获取当前状态
    const currentState = likeStore.getPostLikeState(props.item.id)
    const currentLiked = currentState.liked
    const currentLikeCount = currentState.likeCount

    // 使用全局store的点赞方法，传递当前状态
    await likeStore.togglePostLike(props.item.id, currentLiked, currentLikeCount)

    // 触发点赞事件，传递笔记ID和新的点赞状态
    emit('like', {
      postId: props.item.id,
      liked: !currentLiked
    })
  } catch (error) {
    console.error('点赞操作失败:', error)
    showMessage('操作失败，请重试', 'error')
  }
}

// 评论点赞处理
const toggleCommentLike = async (comment, willBeLiked) => {
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    authStore.openLoginModal()
    return
  }

  try {
    // 获取当前状态
    const currentState = commentLikeStore.getCommentLikeState(comment.id)
    const currentLiked = currentState.liked
    const currentLikeCount = currentState.likeCount

    // 使用全局store的评论点赞方法
    const result = await commentLikeStore.toggleCommentLike(comment.id, currentLiked, currentLikeCount)

    if (result.success) {
      showMessage(result.liked ? '点赞成功' : '取消点赞成功', 'success')
    } else {
      console.error(`评论${comment.id}点赞操作失败:`, result.error)
      showMessage('操作失败，请重试', 'error')
    }
  } catch (error) {
    console.error('评论点赞操作失败:', error)
    showMessage('操作失败，请重试', 'error')
  }
}

const toggleCollect = async () => {
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    authStore.openLoginModal()
    return
  }

  try {
    const postId = props.item.id

    // 从收藏状态管理器获取当前状态
    const currentState = collectStore.getPostCollectState(postId)

    // 使用收藏状态管理
    const result = await collectStore.togglePostCollect(
      postId,
      currentState.collected,
      currentState.collectCount
    )

    if (result.success) {
      showMessage(result.collected ? '收藏成功' : '取消收藏成功', 'success')

      // 触发收藏事件，传递笔记ID和新的收藏状态
      emit('collect', {
        postId: postId,
        collected: result.collected
      })
    } else {
      console.error('收藏操作失败:', result.error)
      showMessage('操作失败，请重试', 'error')
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    showMessage('操作失败，请重试', 'error')
  }
}

const handleShare = async () => {
  try {
    const shareUrl = `【${props.item.title}-${props.item.author}| 小石榴 - 你的校园图文部落】${window.location.origin}/post?id=${props.item.id}`

    // 检查是否支持现代剪贴板API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // 使用现代剪贴板API
      await navigator.clipboard.writeText(shareUrl)
    } else {
      // 降级方案：使用传统的document.execCommand
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    // 显示成功提示
    showMessage('复制成功，快去分享给好友吧', 'success')

    // 切换图标为tick
    isShared.value = true
  } catch (error) {
    console.error('复制失败:', error)
    showMessage('复制失败，请重试', 'error')
  }
}

const handleShareMouseLeave = () => {
  // 鼠标移开后恢复share图标
  isShared.value = false
}

// 处理标签点击
const handleTagClick = (tag) => {
  // 构建搜索页面URL
  const searchUrl = `${window.location.origin}/search_result?tag=${encodeURIComponent(tag)}`
  
  // 在新标签页打开搜索页面
  window.open(searchUrl, '_blank')
}

// 显示消息提示
const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

// 关闭消息提示
const handleToastClose = () => {
  showToast.value = false
}

// 输入框聚焦处理
const handleInputFocus = () => {
  isInputFocused.value = true
}

// 评论按钮点击处理
const handleCommentButtonClick = () => {
  // 聚焦到输入框
  if (focusedInput.value) {
    focusedInput.value.focus()
  }
}

// 艾特面板切换
const toggleMentionPanel = () => {
  // 如果要打开面板，先插入@符号
  if (!showMentionPanel.value && focusedInput.value && focusedInput.value.insertAtSymbol) {
    focusedInput.value.insertAtSymbol()
  }
  showMentionPanel.value = !showMentionPanel.value
}

const closeMentionPanel = () => {
  showMentionPanel.value = false
}

// 输入框键盘事件处理
const handleInputKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    // 回车键发送评论（不包括Shift+Enter）
    event.preventDefault()
    handleSendComment()
  } else if (event.key === 'Escape') {
    // ESC键取消输入
    event.preventDefault()
    handleCancelInput()
  } else if (event.key === 'Backspace' || event.key === 'Delete') {
    // 处理删除mention标签的逻辑
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)

      if (event.key === 'Backspace') {
        // Backspace: 优先处理正常的文本删除
        if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
          // 如果光标在文本节点中且不在开头，允许正常删除文本
          return
        }

        // 只有当光标紧邻mention标签且没有其他文本可删除时，才删除mention
        const prevNode = range.startContainer.previousSibling
        if (prevNode && prevNode.classList && prevNode.classList.contains('mention-link')) {
          // 检查是否有选中的文本，如果有则优先删除选中的文本
          if (range.startOffset !== range.endOffset) {
            return // 让浏览器处理选中文本的删除
          }
          event.preventDefault()
          prevNode.remove()
          commentInput.value = event.target.innerHTML
          return
        }

        // 如果光标在文本节点开头，检查前面的兄弟节点
        if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
          const textNode = range.startContainer
          const prevSibling = textNode.previousSibling
          if (prevSibling && prevSibling.classList && prevSibling.classList.contains('mention-link')) {
            event.preventDefault()
            prevSibling.remove()
            commentInput.value = event.target.innerHTML
            return
          }
        }
      } else if (event.key === 'Delete') {
        // Delete: 检查光标后面是否有mention标签
        const nextNode = range.endContainer.nextSibling
        if (nextNode && nextNode.classList && nextNode.classList.contains('mention-link')) {
          event.preventDefault()
          nextNode.remove()
          commentInput.value = event.target.innerHTML
          return
        }

        // 如果光标在文本节点末尾，检查后面的兄弟节点
        if (range.endContainer.nodeType === Node.TEXT_NODE &&
          range.endOffset === range.endContainer.textContent.length) {
          const textNode = range.endContainer
          const nextSibling = textNode.nextSibling
          if (nextSibling && nextSibling.classList && nextSibling.classList.contains('mention-link')) {
            event.preventDefault()
            nextSibling.remove()
            commentInput.value = event.target.innerHTML
            return
          }
        }
      }
    }
  }
}
// 开始回复评论
const handleReplyComment = (target, parentId = null) => {
  // 如果是回复评论，parentId为null，target就是comment对象
  // 如果是回复回复，parentId是被回复的回复ID，target是reply对象
  replyingTo.value = {
    ...target,
    commentId: parentId || target.id // parentId就是要设置为parent_id的值
  }

  // 聚焦到底部输入框
  isInputFocused.value = true
  nextTick(() => {
    if (focusedInput.value) {
      focusedInput.value.focus()
    }
  })
}

// 处理用户点击事件
const onUserClick = (userId) => {
  if (userId) {
    const userUrl = `${window.location.origin}/user/${userId}`
    window.open(userUrl, '_blank')
  }
}


const toggleRepliesExpanded = (commentId) => {
  if (expandedReplies.value.has(commentId)) {
    expandedReplies.value.delete(commentId)
  } else {
    expandedReplies.value.add(commentId)
  }
}

const isRepliesExpanded = (commentId) => {
  return expandedReplies.value.has(commentId)
}

const getDisplayedReplies = (replies, commentId) => {
  if (!replies || replies.length === 0) return []
  if (replies.length <= 2) return replies
  return isRepliesExpanded(commentId) ? replies : replies.slice(0, 2)
}

const getHiddenRepliesCount = (replies, commentId) => {
  if (!replies || replies.length <= 2) return 0
  return isRepliesExpanded(commentId) ? 0 : replies.length - 2
}

const handleImageLoad = (event, index) => {
  // 只有第一张图片需要计算容器宽度
  if (index === 0) {
    const img = event.target
    const aspectRatio = img.naturalWidth / img.naturalHeight

    const minWidth = 300
    const maxWidth = 750

    const containerHeight = Math.min(window.innerHeight * 0.9, 1020)

    const idealWidth = containerHeight * aspectRatio

    let optimalWidth = Math.max(minWidth, Math.min(maxWidth, idealWidth))

    if (aspectRatio <= 0.6) {
      optimalWidth = Math.min(optimalWidth, 500)
    } else if (aspectRatio <= 0.8) {
      optimalWidth = Math.min(optimalWidth, 600)
    } else if (aspectRatio >= 2.0) {
      optimalWidth = Math.max(optimalWidth, 600)
    } else if (aspectRatio >= 1.5) {
      optimalWidth = Math.max(optimalWidth, 550)
    }

    imageSectionWidth.value = optimalWidth
  }

  // 当前图片加载完成后，自动预加载下一张图片
  if (index === currentImageIndex.value && imageList.value.length > 1) {
    const nextIndex = index + 1
    if (nextIndex < imageList.value.length && imageList.value[nextIndex]) {
      preloadImage(imageList.value[nextIndex])
    }
  }
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const nextImage = () => {
  if (currentImageIndex.value < imageList.value.length - 1) {
    currentImageIndex.value++
  }
}

// 图片查看器相关方法
const openImageViewer = () => {
  showImageViewer.value = true
  // 防止背景滚动
  lockImageViewer()
  // 添加键盘事件监听
  document.addEventListener('keydown', handleViewerKeydown)
}

const closeImageViewer = () => {
  showImageViewer.value = false
  // 恢复滚动
  unlockImageViewer()
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleViewerKeydown)
}

// 图片查看器键盘事件处理
const handleViewerKeydown = (event) => {
  if (!showImageViewer.value) return

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closeImageViewer()
      break
    case 'ArrowLeft':
      event.preventDefault()
      prevImageInViewer()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextImageInViewer()
      break
  }
}

const prevImageInViewer = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const nextImageInViewer = () => {
  if (currentImageIndex.value < imageList.value.length - 1) {
    currentImageIndex.value++
  }
}

const preloadedImages = new Set()

const preloadImage = (imageUrl) => {
  if (!imageUrl || preloadedImages.has(imageUrl)) {
    return
  }

  const img = new Image()
  img.onload = () => {
    preloadedImages.add(imageUrl)

  }
  img.onerror = () => {
    console.warn(`预加载图片失败`)
  }
  img.src = imageUrl
}




const toggleEmojiPanel = () => {
  showEmojiPanel.value = !showEmojiPanel.value

  // 如果打开表情面板且输入框没有聚焦，先聚焦
  if (showEmojiPanel.value && !isInputFocused.value && focusedInput.value) {
    nextTick(() => {
      focusedInput.value.focus()
    })
  }
}

const closeEmojiPanel = () => {
  showEmojiPanel.value = false
}


const handleEmojiSelect = (emoji) => {
  const emojiChar = emoji.i

  // 确保输入框聚焦
  if (!isInputFocused.value && focusedInput.value) {
    focusedInput.value.focus()
  }

  // 插入表情
  nextTick(() => {
    if (focusedInput.value && focusedInput.value.insertEmoji) {
      focusedInput.value.insertEmoji(emojiChar)
    } else {
      commentInput.value += emojiChar
    }
  })

  closeEmojiPanel()
}

const handleMentionSelect = (friend) => {
  // 调用ContentEditableInput组件的selectMentionUser方法
  if (focusedInput.value && focusedInput.value.selectMentionUser) {
    focusedInput.value.selectMentionUser(friend)
  }

  // 关闭mention面板
  closeMentionPanel()
}

// 处理@符号输入事件
const handleMentionInput = () => {
  // 当用户输入@符号时，自动打开mention面板
  if (!showMentionPanel.value) {
    showMentionPanel.value = true
  }
}

// 处理取消输入
// 内容安全过滤函数
const sanitizeContent = (content) => {
  if (!content) return ''
  // 保留mention链接，但移除其他危险标签
  // 先保存mention链接
  const mentionLinks = []
  let processedContent = content.replace(/<a[^>]*class="mention-link"[^>]*>.*?<\/a>/g, (match) => {
    const placeholder = `__MENTION_${mentionLinks.length}__`
    mentionLinks.push(match)
    return placeholder
  })

  // 移除所有其他HTML标签
  processedContent = processedContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')

  // 恢复mention链接
  mentionLinks.forEach((link, index) => {
    processedContent = processedContent.replace(`__MENTION_${index}__`, link)
  })

  return processedContent.trim()
}

// 发送评论
const handleSendComment = async () => {
  if (!userStore.isLoggedIn) {
    showMessage('请先登录', 'error')
    return
  }

  // 对内容进行安全过滤
  const rawContent = commentInput.value || ''
  const sanitizedContent = sanitizeContent(rawContent)

  if (!sanitizedContent) {
    showMessage('请输入评论内容', 'error')
    return
  }

  if (isSendingComment.value) {
    return
  }

  try {
    isSendingComment.value = true

    const commentData = {
      post_id: props.item.id,
      content: sanitizedContent, // 使用过滤后的内容
      parent_id: replyingTo.value ? replyingTo.value.commentId : null
    }

    const response = await commentApi.createComment(commentData)

    if (response.success) {
      showMessage(replyingTo.value ? '回复成功' : '评论成功', 'success')

      // 清空输入框和重置状态
      handleCancelInput()

      // 重新获取评论列表
      await fetchComments()
    } else {
      showMessage(response.message || '发送失败，请重试', 'error')
    }
  } catch (error) {
    console.error('发送评论失败:', error)
    showMessage('发送失败，请重试', 'error')
  } finally {
    isSendingComment.value = false
  }
}

const handleCancelInput = () => {
  commentInput.value = ''
  replyingTo.value = null
  isInputFocused.value = false
  showEmojiPanel.value = false
  showMentionPanel.value = false
  // 确保输入框失去焦点
  if (focusedInput.value) {
    focusedInput.value.blur()
  }
}

const fetchPostDetail = async () => {
  try {
    // 使用经过transformPostData处理的getPostDetail函数
    const postDetail = await getPostDetail(props.item.id)

    if (postDetail) {
      // 更新props.item以包含完整的数据（包括author_auto_id）
      Object.assign(props.item, postDetail)

      likeStore.initPostLikeState(
        postDetail.id,
        postDetail.liked || false,
        postDetail.likeCount || postDetail.like_count || 0
      )

      collectStore.initPostCollectState(
        postDetail.id,
        postDetail.collected || false,
        postDetail.collectCount || postDetail.collect_count || 0
      )
    }
  } catch (error) {
    console.error(`❌ 获取笔记${props.item.id}详情失败:`, error)
    likeStore.initPostLikeState(
      props.item.id,
      props.item.liked || false,
      props.item.likeCount || props.item.like_count || 0
    )

    collectStore.initPostCollectState(
      props.item.id,
      props.item.collected || false,
      props.item.collectCount || props.item.collect_count || 0
    )
  }
}

const windowWidth = ref(window.innerWidth)

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  lock()

  window.addEventListener('resize', handleResize)

  setTimeout(() => {
    isAnimating.value = false
  }, 400)

  if (userStore.isLoggedIn && !userStore.userInfo) {
    userStore.initUserInfo()
  }

  if (!props.disableAutoFetch) {
    fetchPostDetail()
  }

  fetchComments()


})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 确保移除键盘事件监听器
  document.removeEventListener('keydown', handleViewerKeydown)
})

watch(isInputFocused, async (newValue) => {
  await nextTick()
  if (newValue) {
    if (focusedInput.value) {
      focusedInput.value.focus()
    }
  } else {
    if (focusedInput.value) {
      focusedInput.value.blur()
    }
  }
})

watch(currentImageIndex, (newIndex) => {
  // 当切换到新图片时，预加载下一张图片
  if (imageList.value.length > 1) {
    const nextIndex = newIndex + 1
    if (nextIndex < imageList.value.length && imageList.value[nextIndex]) {
      preloadImage(imageList.value[nextIndex])
    }
  }
})

const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const minSwipeDistance = 50
const SWIPE_THRESHOLD = 10 // 滑动判定阈值

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  const touchMoveX = e.touches[0].clientX
  const touchMoveY = e.touches[0].clientY

  const deltaX = Math.abs(touchMoveX - touchStartX.value)
  const deltaY = Math.abs(touchMoveY - touchStartY.value)

  // 仅当"水平滑动幅度 > 垂直滑动幅度 + 阈值"时，阻止默认行为（避免影响页面垂直滚动）
  if (deltaX > deltaY && deltaX > SWIPE_THRESHOLD) {
    e.preventDefault()
  }
}

const handleTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].clientX
  touchEndY.value = e.changedTouches[0].clientY

  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      prevImage()
    } else {
      nextImage()
    }
  }

  // 重置记录
  touchStartX.value = 0
  touchStartY.value = 0
}

// 图片查看器触摸事件处理
const handleViewerTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

const handleViewerTouchMove = (e) => {
  const touchMoveX = e.touches[0].clientX
  const touchMoveY = e.touches[0].clientY

  const deltaX = Math.abs(touchMoveX - touchStartX.value)
  const deltaY = Math.abs(touchMoveY - touchStartY.value)

  // 仅当"水平滑动幅度 > 垂直滑动幅度 + 阈值"时，阻止默认行为（避免影响页面垂直滚动）
  if (deltaX > deltaY && deltaX > SWIPE_THRESHOLD) {
    e.preventDefault()
  }
}

const handleViewerTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].clientX
  touchEndY.value = e.changedTouches[0].clientY

  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      prevImageInViewer()
    } else {
      nextImageInViewer()
    }
  }

  // 重置记录
  touchStartX.value = 0
  touchStartY.value = 0
}

const goToImage = (index) => {
  if (index >= 0 && index < imageList.value.length) {
    currentImageIndex.value = index
  }
}

// 当点击图片查看器容器的任意非控制区域时关闭预览
const onViewerContainerClick = (event) => {
  const target = event.target
  // 若点击在翻页按钮或关闭按钮上，保留原有行为
  if (target.closest && (target.closest('.viewer-nav-btn') || target.closest('.image-viewer-close'))) {
    return
  }
  closeImageViewer()
}
</script>

<style scoped>
.detail-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.333);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

.detail-card {
  max-width: 95vw;
  height: 90vh;
  max-height: 1020px;
  background: var(--bg-color-primary);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
}

/* 页面模式样式 */
.detail-card-page {
  width: 100%;
  min-height: calc(100vh - 64px);
  display: block;
  padding: 0;
  box-sizing: border-box;
}

.detail-card.page-mode {
  max-width: 1000px;
  width: 100%;
  height: calc(100vh - 100px);
  max-height: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: row;
  border-radius: 12px;
}


/* 缩放弹出动画 */
.detail-card.scale-in {
  animation: scaleInFromPoint 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleInFromPoint {
  0% {
    transform: translate(var(--start-x, 0), var(--start-y, 0)) scale(0.3);
    opacity: 0;
  }

  100% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: white;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.tooltip {
  position: absolute;
  top: 50px;
  left: 60%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 3px;
}

.tooltip::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 46%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid rgba(0, 0, 0, 0.8);
}

.key-hint {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.detail-content {
  display: flex;
  width: 100%;
  height: 100%;
}

.image-section {
  background: var(--bg-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-section img {
  width: 100%;
  height: 100%;
}

/* 图片容器和控制样式 */
.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-slider {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slider-image {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: var(--bg-color-secondary);
}

/* 图片悬停放大镜效果 */
.image-zoomable {
  cursor: zoom-in;
  transition: none;
}

.image-zoomable:hover {
  cursor: zoom-in;
}

.image-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

/* 导航按钮容器 */
.nav-btn-container {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  z-index: 10;
}

.prev-btn-container {
  left: 0;
}

.next-btn-container {
  right: 0;
}

.nav-btn {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
  pointer-events: auto;
  backdrop-filter: blur(2px);
  opacity: 0;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.prev-btn {
  transform: translateX(-20px);
}

.next-btn {
  transform: translateX(20px);
}

.image-controls.visible .prev-btn {
  transform: translateX(0);
  opacity: 1;
}

.image-controls.visible .next-btn {
  transform: translateX(0);
  opacity: 1;
}

.image-container:hover .prev-btn {
  transform: translateX(0);
  opacity: 1;
}

.image-container:hover .next-btn {
  transform: translateX(0);
  opacity: 1;
}

.image-container:hover .prev-btn:hover:not(:disabled) {
  transform: translateX(0) scale(1.1);
}

.image-container:hover .next-btn:hover:not(:disabled) {
  transform: translateX(0) scale(1.1);
}

.image-counter {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  z-index: 10;
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-controls.visible .image-counter {
  opacity: 1;
}

.image-container:hover .image-counter {
  opacity: 1;
}

.content-section {
  display: flex;
  flex-direction: column;
  background: var(--bg-color-primary);
}

.author-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg-color-primary);
  position: sticky;
  top: 0;
  z-index: 5;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}


.author-name {
  font-weight: 600;
  color: var(--text-color-primary);
  font-size: 16px;
  cursor: pointer;
}



.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  -webkit-overflow-scrolling: touch;
  touch-action: auto;
  overscroll-behavior: auto;
}

.note-content {
  padding: 5px 16px 0 16px;
}

.note-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
}

.note-text {
  color: var(--text-color-primary);
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 16px 0;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  color: var(--text-color-tag);
  font-size: 16px;
  cursor: pointer;
  text-decoration: none;
}

.clickable-tag {
  transition: color 0.2s ease, opacity 0.2s ease;
}

.clickable-tag:hover {
  opacity: 0.8;
}


.note-meta {
  display: flex;
  gap: 8px;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.divider {
  height: 1px;
  background: var(--border-color-secondary);
  margin: 20px 0;
}

.comments-section {
  padding: 0px 16px 0 16px;
}

.comments-header {
  margin-bottom: 16px;
}

.comments-title {
  font-size: 14px;
  color: var(--text-color-secondary);
}

/* 评论加载状态 */
.comments-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color-secondary);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 无评论状态 */
.no-comments {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
}



.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-user-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comment-username {
  color: var(--text-color-secondary);
  font-size: 14px;
  cursor: pointer;
}

.comment-time {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.comment-delete-btn {
  font-size: 12px;
  color: var(--text-color-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 8px;
  margin-left: 8px;
  transition: opacity 0.2s;
}

.comment-delete-btn:hover {
  color: var(--text-color-primary);
}

.comment-text {
  color: var(--text-color-primary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 2px 0;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
}

.comment-text :deep(p) {
  margin: 0;
  padding: 0 0 2px;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.comment-like-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-replay-container {
  display: flex;
  align-items: center;
  color: var(--text-color-secondary);
}


.comment-replay-icon {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 2px;
  border-radius: 4px;
}

.comment-replay-icon:hover {
  cursor: pointer;
  color: var(--text-color-primary);
}

.like-count {
  color: var(--text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.comment-reply {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.comment-reply:hover {
  color: var(--text-color-primary);
}

/* 回复列表样式 */
.replies-list {
  margin-top: 12px;
  padding-left: 20px;
  border-left: 2px solid var(--border-color-secondary);
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.reply-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
}





.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.reply-user-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reply-username {
  font-weight: 600;
  color: var(--text-color-primary);
  font-size: 12px;
  cursor: pointer;
}

.reply-time {
  color: var(--text-color-secondary);
  font-size: 11px;
}

.reply-text {
  color: var(--text-color-primary);
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 6px 0;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
}

.reply-text :deep(p) {
  margin: 0;
  padding: 0;
}

.reply-to {
  color: var(--text-color-secondary);
  font-weight: 500;
}

.reply-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reply-like-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reply-replay-container {
  display: flex;
  align-items: center;
  color: var(--text-color-secondary);
}

.reply-replay-icon:hover {
  cursor: pointer;
  color: var(--text-color-primary);
}

.reply-reply {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.reply-reply:hover {
  color: var(--text-color-primary);
}

/* 回复展开/折叠按钮样式 */
.replies-toggle {
  margin-top: 8px;
  padding-left: 32px;
  /* 与回复项对齐 */
}

.toggle-replies-btn {
  background: none;
  border: none;
  color: var(--text-color-tag);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  font-weight: 500;
}



/* 底部操作栏样式 */
.footer-actions {
  background: var(--bg-color-primary);
  border-top: 1px solid var(--border-color-secondary);
  padding: 0;
}

/* 输入框容器 - 统一管理上下两部分 */
.input-container {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 回复状态提示 */
.reply-status {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  background: var(--bg-color-secondary);
  border-radius: 6px;
  margin-bottom: 8px;
}

.reply-status-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reply-first-line {
  font-size: 12px;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.reply-second-line {
  font-size: 12px;
  color: var(--text-color-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.reply-username {
  color: var(--text-color-secondary);
}

/* 上半部分：输入框和按钮的行 */
.input-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-wrapper {
  flex: 1;
  margin-right: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: calc(100% - 200px);
  /* 初始状态限制最大宽度，为按钮留空间 */
  overflow: visible;
}

/* 展开状态下输入框占满整行 */
.input-container.expanded .input-wrapper {
  margin-right: 0;
  max-width: 100%;
  /* 展开时移除宽度限制 */
}

/* 展开状态下的输入行布局调整 */
.input-container.expanded .input-row {
  position: relative;
  /* 为了让按钮能够正确定位 */
}

.comment-input {
  width: 100%;
  min-height: 32px;
  max-height: 80px;
  /* 4行的最大高度 */
  border: none;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 14px;
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
  outline: none;
  caret-color: var(--primary-color);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  resize: none;
  overflow-y: auto;
  line-height: 20px;
  font-family: inherit;
}

/* 聚焦状态下的输入框样式 */
.comment-input.focused-input {
  min-height: 40px;
  max-height: 80px;
  /* 保持4行的最大高度 */
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 16px;
  background: var(--bg-color-secondary);
}

.comment-input::placeholder {
  color: var(--text-color-secondary);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  width: auto;
  position: relative;
}

/* 展开状态下隐藏action-buttons */
.input-container.expanded .action-buttons {
  opacity: 0;
  transform: translateX(50px);
  pointer-events: none;
  position: absolute;
  right: 16px;
}

/* 下半部分：聚焦状态的操作区域 */
.focused-actions-section {
  height: 0;
  opacity: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 展开状态下显示下半部分 */
.input-container.expanded .focused-actions-section {
  height: 60px;
  opacity: 1;
  padding: 0px 22px;
}

.emoji-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-btn,
.mention-btn {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover,
.mention-btn:hover {
  background: var(--bg-color-secondary);
}

.emoji-icon,
.mention-icon {
  color: var(--text-color-secondary);
  transition: color 0.2s;
}

.emoji-btn:hover .emoji-icon,
.mention-btn:hover .mention-icon {
  color: var(--text-color-primary);
}

.send-cancel-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.send-btn {
  background: var(--primary-color);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;
}

.send-btn:hover:not(:disabled) {
  background: #e01e3c;
}

.send-btn:disabled {
  background: #892030;
  color: #b0b0b0;
  cursor: not-allowed;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: none;
  border: 1px solid var(--border-color-secondary);
  color: var(--text-color-secondary);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: transparent;
  font-weight: bold;
  transition: all 0.2s;
}

.cancel-btn:hover {
  color: var(--text-color-primary);
  background-color: var(--bg-color-secondary);
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  padding: 2px;
  white-space: nowrap;
}

.action-btn:hover {
  color: var(--text-color-primary);
}




.action-btn svg {
  width: 24px;
  height: 24px;
}

/* 表情面板样式 */
.emoji-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.emoji-panel {
  background: var(--bg-color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: scaleIn 0.2s ease;
  max-width: 90vw;
  max-height: 80vh;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 默认隐藏移动端图片容器 */
.mobile-image-container {
  display: none;
}

/* 响应式设计 - 移动端适配 */
@media (max-width: 768px) {

  /* 移动端page-mode样式 */
  .detail-card.page-mode {
    max-width: 100vw;
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    margin: 0;
    box-shadow: none;
    border-radius: 0;
    overflow: hidden;
  }

  .detail-card.page-mode .detail-content {
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .detail-card.page-mode .content-section {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-color-primary);
    max-width: 100vw;
    box-sizing: border-box;
  }

  .detail-card-overlay {
    padding: 0;
    background: var(--bg-color-primary);
  }

  .detail-card {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    flex-direction: column;
    position: relative;
    overflow-x: hidden;
    flex: 1;
  }

  .close-btn {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1001;
    background: transparent;
    color: var(--text-color-secondary);
    width: 36px;
    height: 36px;
  }

  .close-btn:hover {
    background: rgba(144, 144, 144, 0.292);
  }

  .detail-content {
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* 移动端隐藏原来的图片区域 */
  .image-section {
    display: none;
  }

  .content-section {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-color-primary);
    max-width: 100vw;
    box-sizing: border-box;
  }

  /* 作者信息作为固定的页面header */
  .author-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: calc(72px + constant(safe-area-inset-top));
    height: calc(72px + env(safe-area-inset-top));
    padding: 12px 16px;
    padding-left: 60px;
    padding-top: constant(safe-area-inset-top);
    /* iOS 旧版 */
    padding-top: env(safe-area-inset-top);
    /* 现代浏览器 */
    background: var(--bg-color-primary);
    border-bottom: 1px solid var(--border-color-primary);
  }

  /* 可滚动内容区域包含图片和文本 */
  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-top: calc(100px + constant(safe-area-inset-top));
    padding-top: calc(100px + env(safe-area-inset-top));
    padding-bottom: calc(110px + constant(safe-area-inset-bottom));
    padding-bottom: calc(110px + env(safe-area-inset-bottom));
    max-width: 100vw;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
    touch-action: auto;
    overscroll-behavior: contain;
  }

  /* 在可滚动内容的开头添加图片 */
  .scrollable-content::before {
    content: '';
    display: block;
    width: 100%;
    height: 0;
    /* 将通过JavaScript动态设置 */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    margin-bottom: 16px;
  }

  /* 图片容器在移动端的样式 */
  .mobile-image-container {
    display: block;
    /* 在移动端显示 */
    width: 100%;
    height: 280px;
    /* 固定高度，形成长方形区域 */
    margin-bottom: 16px;
    position: relative;
    background: var(--bg-color-secondary);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-image-slider {
    display: flex;
    width: 100%;
    height: 100%;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-slider-image {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* 改为 contain 以确保完整显示 */
    object-position: center;
    display: block;
    cursor: zoom-in;
  }

  /* 移动端图片控制 */
  .mobile-image-controls {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .mobile-nav-btn {
    position: absolute;
    top: 50%;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 10;
    pointer-events: auto;
    backdrop-filter: blur(2px);
    opacity: 0.8;
    transform: translateY(-50%);
  }

  .mobile-nav-btn:hover {
    background: rgba(0, 0, 0, 0.5);
    opacity: 1;
  }

  .mobile-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .mobile-prev-btn {
    left: 12px;
  }

  .mobile-next-btn {
    right: 12px;
  }

  .mobile-image-counter {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.3);
    color: white;
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10;
    backdrop-filter: blur(4px);
    opacity: 1;
  }

  /* 移动端圆点指示器 */
  .mobile-dots-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .mobile-dots {
    display: flex;
    gap: 8px;
  }

  .mobile-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-color-quaternary);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .mobile-dot.active {
    background: var(--primary-color);
    transform: scale(1.2);
  }


  .note-content {
    padding: 0 16px 16px 16px;
  }

  .note-title {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .note-text {
    font-size: 16px;
    line-height: 1.7;
    margin-bottom: 20px;
  }

  .comments-section {
    padding: 16px;
    padding-bottom: 0;
  }

  .footer-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-color-primary);
    border-top: 1px solid var(--border-color-primary);
    z-index: 1000;
    padding: 12px 16px;
    padding-bottom: calc(12px + constant(safe-area-inset-bottom));
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }

  .input-container {
    margin: 0;
  }

  .input-row {
    padding: 0;
  }

  .input-wrapper {
    margin-right: 0;
  }

  .comment-input {
    font-size: 16px;
    padding: 12px 16px;
  }

  .action-buttons {
    gap: 12px;
  }

  .action-btn {
    font-size: 14px;
    padding: 8px;
  }

  .action-btn svg {
    width: 24px;
    height: 24px;
  }

  /* 聚焦状态的调整 */
  .input-container.expanded .focused-actions-section {
    height: 50px;
    padding: 8px 16px;
  }

  .send-btn,
  .cancel-btn {
    padding: 10px 20px;
    font-size: 16px;
  }

  /* 评论区域的移动端优化 */
  .comment-item,
  .reply-item {
    margin-bottom: 16px;
  }

  .comment-avatar,
  .reply-avatar {
    width: 36px;
    height: 36px;
  }

  .comment-content,
  .reply-content {
    margin-left: 12px;
  }

  /* 表情面板在移动端的调整 */
  .emoji-panel-overlay {
    padding: 0;
    z-index: 2500;
  }
}

/* 图片查看器样式 */
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: zoom-out;
}

.image-viewer-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-viewer-close {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 3001;
  background: rgba(152, 152, 152, 0.5);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.image-viewer-close:hover {
  background: rgba(87, 87, 87, 0.7);
}

.image-viewer-counter {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 3001;
  background: rgba(152, 152, 152, 0.5);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.image-viewer-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.image-viewer-slider {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.viewer-image {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  user-select: none;
  cursor: zoom-out;
}

.image-viewer-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 3001;
}

.viewer-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(152, 152, 152, 0.5);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 3001;
  pointer-events: auto;
  opacity: 0.8;
}

.viewer-nav-btn:hover {
  background: rgba(87, 87, 87, 0.7);
  opacity: 1;
  transform: translateY(-50%);
}

.viewer-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: translateY(-50%);
}

.viewer-prev-btn {
  left: 20px;
}

.viewer-next-btn {
  right: 20px;
}

/* 移动端图片查看器样式 */
@media (max-width: 768px) {
  .image-viewer-close {
    top: 16px;
    left: 16px;
    width: 40px;
    height: 40px;
  }

  .image-viewer-counter {
    top: 16px;
    right: 16px;
    padding: 6px 12px;
    font-size: 14px;
  }

  .viewer-nav-btn {
    width: 48px;
    height: 48px;
  }

  .image-viewer-nav {
    padding: 0 16px;
  }
}

/* 图片查看器动画 */
.image-viewer-enter-active,
.image-viewer-leave-active {
  transition: opacity 0.3s ease;
}

.image-viewer-enter-from,
.image-viewer-leave-to {
  opacity: 0;
}

.image-viewer-enter-to,
.image-viewer-leave-from {
  opacity: 1;
}
</style>