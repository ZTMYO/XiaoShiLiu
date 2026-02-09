<template>
  <div :class="[pageMode ? 'detail-card-page' : 'detail-card-overlay', { 'animating': isAnimating && !pageMode }]"
    v-click-outside.mousedown="!pageMode ? closeModal : undefined" v-escape-key="!pageMode ? closeModal : undefined">
    <div class="detail-card" @click="handleDetailCardClick"
        :style="pageMode ? {} : { width: cardWidth + 'px', ...(isClosing ? {} : animationStyle) }"
        :class="{ 
          'scale-in': isAnimating && !pageMode && !isMobile, 
          'scale-out': isClosing && !pageMode && !isMobile,
          'slide-in': isAnimating && !pageMode && isMobile,
          'slide-out': isClosing && !pageMode && isMobile,
          'page-mode': pageMode 
        }"
        @animationend="handleAnimationEnd">
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
          <!-- 视频播放器（桌面端） -->
          <div v-if="props.item.type === 2" class="video-container">
            <div v-if="!isVideoLoaded" class="video-placeholder">
              <img 
                v-if="props.item.cover_url || (props.item.images && props.item.images[0])" 
                :src="props.item.cover_url || props.item.images[0]" 
                :alt="props.item.title || '视频封面'"
                class="video-cover-placeholder"
              />
            </div>
            <video 
              v-show="isVideoLoaded"
              ref="videoPlayer"
              :src="props.item.video_url" 
              :poster="props.item.cover_url || (props.item.images && props.item.images[0])"
              controls 
              preload="metadata"
              webkit-playsinline="true"
              playsinline="true"
              loop
              class="video-player"
              @loadedmetadata="handleVideoLoad"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
          <!-- 图片轮播（图文笔记） -->
          <div v-else class="image-container">
            <div class="image-slider" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }">
              <img v-for="(image, index) in imageList" :key="index" 
                :src="showContent ? image : (index === 0 ? props.item.image : '')" 
                :alt="props.item.title || '图片'"
                @load="handleImageLoad($event, index)" :style="{ objectFit: 'contain' }"
                class="slider-image image-zoomable" @click="openImageViewer" />
            </div>
            <div v-if="hasMultipleImages && showContent" class="image-controls" :class="{ 'visible': showImageControls }">
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

        <div class="content-section" ref="contentSection" :style="windowWidth > 768 ? { width: contentSectionWidth + 'px' } : {}">
          <div class="author-wrapper" ref="authorWrapper">
            <div class="author-info">
              <div class="author-avatar-container">
                <img :src="authorData.avatar" :alt="authorData.name" class="author-avatar "
                  @click="onUserClick(authorData.id)" v-user-hover="getAuthorUserHoverConfig()" 
                  @error="handleAvatarError" />
                <VerifiedBadge :verified="authorData.verified" size="medium" class="author-verified-badge" />
              </div>
              <div class="author-name-container">
                <span class="author-name" @click="onUserClick(authorData.id)"
                  v-user-hover="getAuthorUserHoverConfig()">{{ authorData.name }}</span>
              </div>
            </div>
            <FollowButton v-if="!isCurrentUserPost" :is-following="authorData.isFollowing" :user-id="authorData.id"
              @follow="handleFollow" @unfollow="handleUnfollow" />
          </div>

          <div class="scrollable-content" ref="scrollableContent">
            <!-- 视频播放器（移动端） -->
            <div v-if="props.item.type === 2" class="mobile-video-container">
              <div v-if="!isVideoLoaded" class="video-placeholder">
                <img 
                  v-if="props.item.cover_url || (props.item.images && props.item.images[0])" 
                  :src="props.item.cover_url || props.item.images[0]" 
                  :alt="props.item.title || '视频封面'"
                  class="video-cover-placeholder"
                />
                <div v-else class="placeholder-content">
                  <SvgIcon name="video" width="48" height="48" />
                  <p>视频加载中...</p>
                </div>
              </div>
              <video 
                v-show="isVideoLoaded"
                ref="mobileVideoPlayer"
                :src="props.item.video_url" 
                :poster="props.item.cover_url || (props.item.images && props.item.images[0])"
                controls 
                preload="metadata"
                webkit-playsinline="true"
                playsinline="true"
                class="mobile-video-player"
                @loadedmetadata="handleVideoLoad"
              >
                您的浏览器不支持视频播放
              </video>
            </div>
            <!-- 图片轮播（图文笔记） -->
            <div v-else-if="imageList && imageList.length > 0" class="mobile-image-container">
              <div class="mobile-image-slider" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }"
                @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
                <img v-for="(image, index) in imageList" :key="index" 
                  :src="showContent ? image : (index === 0 ? props.item.image : '')" 
                  :alt="`图片 ${index + 1}`"
                  class="mobile-slider-image" @click="openImageViewer" @load="handleImageLoad($event, index)" />
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
            <div class="post-content">
              <h2 class="post-title">{{ postData.title }}</h2>
              <p class="post-text">
                <ContentRenderer :text="postData.content" />
              </p>
              <div class="post-tags">
                <span v-for="tag in postData.tags" :key="tag" class="tag clickable-tag" @click="handleTagClick(tag)">#{{
                  tag }}</span>
              </div>
              <div class="post-meta">
                <span class="time">{{ postData.time }}</span>
                <span class="location">{{ postData.location }}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="comments-section">
              <div v-if="showContent" class="comments-header" @click="toggleSortMenu">
                <span class="comments-title">共 {{ commentCount }} 条评论</span>
                <SvgIcon name="down" width="16" height="16" class="sort-icon" />
                <div v-if="showSortMenu" class="sort-menu" @click.stop>
                  <div class="sort-option" :class="{ 'active': commentSortOrder === 'desc' }"
                    @click="setCommentSort('desc')">
                    <span>降序</span>
                    <SvgIcon v-if="commentSortOrder === 'desc'" name="tick" width="14" height="14" class="tick-icon" />
                  </div>
                  <div class="sort-option" :class="{ 'active': commentSortOrder === 'asc' }"
                    @click="setCommentSort('asc')">
                    <span>升序</span>
                    <SvgIcon v-if="commentSortOrder === 'asc'" name="tick" width="14" height="14" class="tick-icon" />
                  </div>
                </div>
              </div>

              <div v-if="loadingComments && showContent" class="comments-loading">
                <div class="loading-spinner"></div>
                <span>加载评论中...</span>
              </div>

              <div v-else-if="showContent" class="comments-list">
                <div v-if="enhancedComments.length === 0 && commentCount === 0 && !hasMoreCommentsToShow"
                  class="no-comments">
                  <span>暂无评论，快来抢沙发吧~</span>
                </div>

                <div v-for="comment in enhancedComments" :key="comment.id" class="comment-item"
                  :data-comment-id="String(comment.id)">
                  <div class="comment-avatar-container">
                    <img :src="comment.avatar" :alt="comment.username" class="comment-avatar clickable-avatar"
                      @click="onUserClick(comment.user_id)" @error="handleAvatarError"
                      v-user-hover="getCommentUserHoverConfig(comment)" />
                    <VerifiedBadge :verified="comment.verified || 0" size="small" class="comment-verified-badge" />
                  </div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <div class="comment-user-info">
                        <span class="comment-username" @click="onUserClick(comment.user_id)"
                          v-user-hover="getCommentUserHoverConfig(comment)">
                          <span v-if="isCurrentUserComment(comment)">我</span>
                          <span v-else>{{ comment.username }}</span>
                        </span>
                        <div v-if="isPostAuthorComment(comment)" class="author-badge author-badge--parent">
                          作者
                        </div>
                      </div>
                      <button v-if="isCurrentUserComment(comment)" class="comment-delete-btn"
                        @click="handleDeleteComment(comment)">
                        删除
                      </button>
                    </div>
                    <div class="comment-text">
                      <ContentRenderer :content="comment.content" @image-click="handleCommentImageClick" />
                    </div>
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
                        class="reply-item" :data-comment-id="String(reply.id)">
                        <div class="reply-avatar-container">
                          <img :src="reply.avatar" :alt="reply.username" class="reply-avatar "
                            @click="onUserClick(reply.user_id)" @error="handleAvatarError"
                            v-user-hover="getCommentUserHoverConfig(reply)" />
                          <VerifiedBadge :verified="reply.verified || 0" size="mini" class="reply-verified-badge" />
                        </div>
                        <div class="reply-content">
                          <div class="reply-header">
                            <div class="reply-user-info">
                              <span class="reply-username" @click="onUserClick(reply.user_id)"
                                v-user-hover="getCommentUserHoverConfig(reply)">
                                <span v-if="isCurrentUserComment(reply)">我</span>
                                <span v-else>{{ reply.username }}</span>
                              </span>
                              <div v-if="isPostAuthorComment(reply)" class="author-badge author-badge--reply">
                                作者
                              </div>
                            </div>
                            <button v-if="isCurrentUserComment(reply)" class="comment-delete-btn"
                              @click="handleDeleteReply(reply, comment.id)">
                              删除
                            </button>
                          </div>
                          <div class="reply-text">
                            回复 <span class="reply-to">{{ reply.replyTo }}</span>：
                            <ContentRenderer :content="reply.content" @image-click="handleCommentImageClick" />
                          </div>
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

                <!-- 加载更多提示 -->
                <div v-if="hasMoreCommentsToShow" class="load-more-comments">
                  <span>加载更多中...</span>
                </div>

                <!-- 没有更多评论提示 -->
                <div v-if="!hasMoreCommentsToShow && enhancedComments.length > 0" class="no-more-comments">
                  <span>没有更多评论了</span>
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
                        <ContentRenderer :content="replyingTo.content" @image-click="handleCommentImageClick" />
                      </div>
                    </div>
                  </div>
                  <ContentEditableInput ref="focusedInput" v-model="commentInput" :input-class="'comment-input'"
                    :placeholder="replyingTo ? `回复 ${replyingTo.username}：` : '说点什么...'" :enable-mention="true"
                    :mention-users="mentionUsers" :enable-ctrl-enter-send="true" @focus="handleInputFocus"
                    @mention="handleMentionInput" @paste-image="handlePasteImage" @send="handleSendComment" />
                </div>


                <div class="action-buttons">
                  <div class="action-btn" :class="{ active: isLiked }">
                    <LikeButton ref="likeButtonRef" :is-liked="isLiked" size="large"
                      @click="(willBeLiked) => toggleLike(willBeLiked)" />
                    <span>{{ likeCount }}</span>
                  </div>
                  <button class="action-btn collect-btn" :class="{ active: isCollected }" @click="toggleCollect">
                    <SvgIcon :name="isCollected ? 'collected' : 'collect'" />
                    <span>{{ collectCount }}</span>
                  </button>
                  <button class="action-btn comment-btn" @click="handleCommentButtonClick">
                    <SvgIcon name="chat" />
                    <span>{{ commentCount }}</span>
                  </button>
                  <button class="action-btn share-btn" @click="handleShare" @mouseleave="handleShareMouseLeave">
                    <SvgIcon :name="isShared ? 'tick' : 'share'" />
                  </button>
                </div>
              </div>

              <!-- 上传图片预览区域 -->
              <div v-if="uploadedImages.length > 0" class="uploaded-images-section">
                <div class="uploaded-images-grid">
                  <div v-for="(image, index) in uploadedImages" :key="index" class="uploaded-image-item">
                    <img :src="image.url || image.preview" :alt="`上传图片${index + 1}`" class="uploaded-image" />
                    <button class="remove-image-btn" @click="removeUploadedImage(index)">
                      <SvgIcon name="close" width="16" height="16" />
                    </button>
                  </div>
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
                  <button class="image-btn" @click="toggleImageUpload">
                    <SvgIcon name="imgNote" class="image-icon" width="24" height="24" />
                  </button>
                </div>
                <div class="send-cancel-buttons">
                  <button class="send-btn" @click="handleSendComment"
                    :disabled="(!commentInput || !commentInput.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()) && uploadedImages.length === 0 || !allImagesUploaded">
                    {{ uploadedImages.length > 0 && !allImagesUploaded ? '上传中' : '发送' }}
                  </button>
                  <button class="cancel-btn" @click="handleCancelInput">
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

    <!-- 图片上传模态框 -->
    <ImageUploadModal :visible="showImageUpload" :model-value="uploadedImages" @close="closeImageUpload"
      @confirm="handleImageUploadConfirm" @update:model-value="handleImageUploadChange" />

    <!-- 帖子图片查看器 -->
    <ImageViewer :visible="showImageViewer" :images="imageList" :initial-index="currentImageIndex" image-type="post"
      @close="closeImageViewer" @change="handleImageIndexChange" />

    <!-- 评论图片查看器 -->
    <ImageViewer :visible="showCommentImageViewer" :images="commentImages" :initial-index="currentCommentImageIndex"
      image-type="comment" @close="closeCommentImageViewer" @change="handleCommentImageIndexChange" />
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
import ContentRenderer from './ContentRenderer.vue'
import ContentEditableInput from './ContentEditableInput.vue'
import ImageUploadModal from './modals/ImageUploadModal.vue'
import ImageViewer from './ImageViewer.vue'
import VerifiedBadge from './VerifiedBadge.vue'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'
import { useLikeStore } from '@/stores/like.js'
import { useCollectStore } from '@/stores/collect.js'
import { useFollowStore } from '@/stores/follow.js'
import { useAuthStore } from '@/stores/auth'
import { useCommentStore } from '@/stores/comment'
import { useCommentLikeStore } from '@/stores/commentLike'
import { commentApi, userApi, postApi, imageUploadApi } from '@/api/index.js'
import { getPostDetail } from '@/api/posts.js'
import { useScrollLock } from '@/composables/useScrollLock'
import { formatTime } from '@/utils/timeFormat'
import defaultAvatar from '@/assets/imgs/avatar.png'

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
  },
  targetCommentId: {
    type: [String, Number],
    default: null
  }
})



// 处理视频加载
const handleVideoLoad = (event) => {
  const video = event.target
  const aspectRatio = video.videoWidth / video.videoHeight

  // 桌面端视频容器宽度计算
  if (window.innerWidth > 768) {
    const minWidth = 300
    const maxWidth = props.pageMode ? 500 : 750
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

  // 视频加载完成，隐藏封面并开始播放
  isVideoLoaded.value = true
  
  // 延迟一点时间确保视频完全准备好
  setTimeout(() => {
    autoPlayVideo()
  }, 100)
}

// 自动播放视频
const autoPlayVideo = () => {
  try {
    // 检查是否为移动端
    const isMobile = window.innerWidth <= 768
    const currentVideoPlayer = isMobile ? mobileVideoPlayer.value : videoPlayer.value
    
    if (currentVideoPlayer) {
      // 尝试自动播放
      const playPromise = currentVideoPlayer.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // 自动播放失败（通常是由于浏览器策略）
          console.log('视频自动播放失败，需要用户交互:', error.message)
        })
      }
    }
  } catch (error) {
    console.log('视频自动播放异常:', error.message)
  }
}

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

const commentInput = ref('')
const videoPlayer = ref(null)
const mobileVideoPlayer = ref(null)
const isLiked = computed(() => likeStore.getPostLikeState(props.item.id)?.liked || false)
const likeCount = computed(() => likeStore.getPostLikeState(props.item.id)?.likeCount || props.item.likeCount || props.item.like_count || 0)
const isCollected = computed(() => collectStore.getPostCollectState(props.item.id)?.collected || false)
const collectCount = computed(() => collectStore.getPostCollectState(props.item.id)?.collectCount || props.item.collectCount || props.item.collect_count || 0)

const showTooltip = ref(false)
const imageSectionWidth = ref(400)
const isInputFocused = ref(false)
const scrollableContent = ref(null)
const contentSection = ref(null)
const authorWrapper = ref(null)
const lastScrollTop = ref(0)

const currentImageIndex = ref(0)
const showImageControls = ref(false)
const showImageViewer = ref(false) // 图片查看器状态

// 评论图片查看器相关状态（完全独立）
const showCommentImageViewer = ref(false)
const commentImages = ref([])
const currentCommentImageIndex = ref(0)
const isViewingCommentImages = ref(false) // 标识当前是否在查看评论图片

// 用于mention功能的用户数据（实际使用中应该从 API 获取）
const mentionUsers = ref([])
const focusedInput = ref(null)
const likeButtonRef = ref(null)
const isAnimating = ref(true)
const showContent = ref(false) // 新增：控制内容显示
const isClosing = ref(false) // 新增：控制关闭动画状态
const isVideoLoaded = ref(false) // 视频加载状态

// 移动端检测
const isMobile = computed(() => windowWidth.value <= 768)

// 视频进度与音量记忆
const getStorageKeys = (url) => {
  const safeKey = url ? encodeURIComponent(url) : 'unknown'
  return {
    timeKey: `video_progress_${safeKey}`,
    volumeKey: 'video_volume_global'
  }
}

const restoreMediaStateFor = (el, url) => {
  if (!el) return
  const { timeKey, volumeKey } = getStorageKeys(url)
  try {
    // 恢复音量（默认 0.5）
    const savedVolume = localStorage.getItem(volumeKey)
    const volume = savedVolume !== null ? Number(savedVolume) : 0.5
    el.volume = Math.max(0, Math.min(1, isNaN(volume) ? 0.5 : volume))

    // 恢复进度
    const savedTime = localStorage.getItem(timeKey)
    if (savedTime !== null) {
      const targetTime = Number(savedTime)
      const seekOnMetadata = () => {
        el.currentTime = isNaN(targetTime) ? 0 : targetTime
        el.removeEventListener('loadedmetadata', seekOnMetadata)
      }
      if (el.readyState >= 1) {
        el.currentTime = isNaN(targetTime) ? 0 : targetTime
      } else {
        el.addEventListener('loadedmetadata', seekOnMetadata)
      }
    }
  } catch (_) {}
}

const mediaHandlersMap = new WeakMap()

const bindMediaListenersFor = (el, url) => {
  if (!el) return
  const { timeKey, volumeKey } = getStorageKeys(url)
  const handlers = {
    timeupdate: () => {
      try { localStorage.setItem(timeKey, String(el.currentTime || 0)) } catch (_) {}
    },
    volumechange: () => {
      try { localStorage.setItem(volumeKey, String(el.volume)) } catch (_) {}
    }
  }
  el.addEventListener('timeupdate', handlers.timeupdate)
  el.addEventListener('volumechange', handlers.volumechange)
  mediaHandlersMap.set(el, handlers)
}

const unbindMediaListenersFor = (el) => {
  if (!el) return
  const handlers = mediaHandlersMap.get(el)
  if (handlers) {
    el.removeEventListener('timeupdate', handlers.timeupdate)
    el.removeEventListener('volumechange', handlers.volumechange)
    mediaHandlersMap.delete(el)
  }
}

const setupMediaPersistence = () => {
  const url = props.item?.video_url || ''
  // 恢复
  restoreMediaStateFor(videoPlayer.value, url)
  restoreMediaStateFor(mobileVideoPlayer.value, url)
  // 绑定
  bindMediaListenersFor(videoPlayer.value, url)
  bindMediaListenersFor(mobileVideoPlayer.value, url)
}

const teardownMediaPersistence = () => {
  unbindMediaListenersFor(videoPlayer.value)
  unbindMediaListenersFor(mobileVideoPlayer.value)
}

// 动画完成后再显示复杂内容
const handleAnimationEnd = (event) => {
  // 只处理detail-card元素的动画结束事件，避免子元素动画干扰
  if (event.target.classList.contains('detail-card')) {
    if (isClosing.value) {
      // 关闭动画结束，立即触发关闭
      unlock()
      emit('close')
    } else {
      // 打开动画结束
      isAnimating.value = false
      showContent.value = true
      
      // 模态框模式下，动画结束后调整padding（确保DOM完全渲染）
      if (!props.pageMode) {
        nextTick(() => {
          adjustMobilePadding()
        })
      }
    }
  }
}

// 组件挂载时延迟显示内容
onMounted(() => {
  // 动画期间不显示复杂内容，减少渲染压力
  setTimeout(() => {
    if (!showContent.value) {
      showContent.value = true
      // pageMode 下，确保内容显示后立即调整padding
      if (props.pageMode) {
        nextTick(() => {
          adjustMobilePadding()
        })
      }
    }
  }, 400) // 与动画时长一致
})

// 当视频加载完成或引用可用时，恢复与绑定；URL 变更时重置
watch(() => isVideoLoaded.value, (loaded) => {
  if (loaded) {
    teardownMediaPersistence()
    setupMediaPersistence()
  }
})

watch(() => props.item?.video_url, () => {
  teardownMediaPersistence()
  nextTick(() => setupMediaPersistence())
})

// 首次默认音量 0.5（若未存过）
onMounted(() => {
  const url = props.item?.video_url || ''
  try {
    const { volumeKey } = getStorageKeys(url)
    const savedVolume = localStorage.getItem(volumeKey)
    if (savedVolume === null) {
      if (videoPlayer.value) videoPlayer.value.volume = 0.5
      if (mobileVideoPlayer.value) mobileVideoPlayer.value.volume = 0.5
    }
  } catch (_) {}
})

onUnmounted(() => {
  teardownMediaPersistence()
})

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const isShared = ref(false)

const replyingTo = ref(null)
const expandedReplies = ref(new Set())

const showEmojiPanel = ref(false)
const hasTriggeredBottom = ref(false) // 追踪是否已触发底部事件
// 加载状态（防止重复请求）
const isLoadingMore = ref(false)
const showMentionPanel = ref(false)
const showImageUpload = ref(false)
const uploadedImages = ref([])



// 评论排序相关
const showSortMenu = ref(false)
const commentSortOrder = ref('desc') // 默认降序

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
  const userId = props.item.author_account || props.item.user_id || props.item.originalData?.userId
  const followState = followStore.getUserFollowState(userId)
  return {
    id: userId,
    name: props.item.nickname || props.item.author || '匿名用户',
    avatar: props.item.user_avatar || props.item.avatar || new URL('@/assets/imgs/未加载.png', import.meta.url).href,
    verified: props.item.verified || props.item.author_verified || 0,
    isFollowing: followState.followed,
    buttonType: followState.buttonType
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

const postData = computed(() => {
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

// 评论图片查看器是否有多张图片
const commentHasMultipleImages = computed(() => {
  return commentImages.value.length > 1
})



const comments = computed(() => commentStore.getComments(props.item.id).comments || [])
const loadingComments = computed(() => commentStore.getComments(props.item.id).loading || false)
const commentCount = computed(() => commentStore.getComments(props.item.id).total || 0)

// 评论分页加载（不再需要displayedCommentsCount，直接显示所有已获取的评论）

// 判断是否还有更多评论可以显示
const hasMoreCommentsToShow = computed(() => {
  const commentData = commentStore.getComments(props.item.id)
  return commentData.hasMore || false
})

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

watch(commentCount, (newTotal) => {
  if (props.item.commentCount !== newTotal) {
    props.item.commentCount = newTotal
  }
})

watch(() => props.item.id, () => {
  currentImageIndex.value = 0
})

const fetchComments = async () => {
  try {
    const result = await commentStore.fetchComments(props.item.id, {
      page: 1,
      limit: 5,
      sort: commentSortOrder.value
    })
    await nextTick()
    const latestComments = comments.value
    if (latestComments && latestComments.length > 0) {
      // 无论是否登录都初始化评论点赞状态，未登录用户只显示点赞数量，不显示点赞状态
      commentLikeStore.initCommentsLikeStates(latestComments)
    }
  } catch (error) {
    console.error(`获取笔记[${props.item.id}]评论失败:`, error)
    if (error.message && !error.message.includes('401') && !error.message.includes('未授权')) {
      showMessage('获取评论失败，请稍后重试', 'error')
    }
  }
}

// 加载更多评论（从服务器获取更多数据）
const loadMoreComments = async () => {
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    authStore.openLoginModal()
    return
  }

  if (!hasMoreCommentsToShow.value || isLoadingMore.value) {
    return
  }

  // 设置加载状态
  isLoadingMore.value = true

  // 加载前：保存当前滚动位置
  // 移动端滚动容器是 contentSection，桌面端是 scrollableContent
  const scrollContainer = (window.innerWidth <= 768 && contentSection.value) ? contentSection.value : scrollableContent.value
  if (scrollContainer) {
    lastScrollTop.value = scrollContainer.scrollTop
  }

  try {
    // 获取当前分页状态
    const commentData = commentStore.getComments(props.item.id)
    const nextPage = (commentData.currentPage || 0) + 1

    await commentStore.fetchComments(props.item.id, {
      page: nextPage,
      limit: 5,
      loadMore: true,
      silentLoad: true,
      sort: commentSortOrder.value
    })

    // 加载后：DOM 更新完成后，恢复滚动位置
    nextTick(() => {
      const scrollContainer = (window.innerWidth <= 768 && contentSection.value) ? contentSection.value : scrollableContent.value
      if (scrollContainer) {
        scrollContainer.scrollTop = lastScrollTop.value
      }
    })
  } catch (error) {
    console.error('加载更多评论失败:', error)
  } finally {
    // 无论成功还是失败，都要重置加载状态
    isLoadingMore.value = false
  }
}

// 定位新发出的评论
const locateNewComment = async (commentId, replyingToInfo) => {
  if (!commentId) return

  try {
    // 如果是回复评论，需要确保父评论的回复列表展开
    if (replyingToInfo && replyingToInfo.commentId) {
      // 查找顶级父评论ID来展开回复列表
      let topLevelParentId = null

      // 首先检查是否直接回复顶级评论
      const directParent = comments.value.find(c => c.id === replyingToInfo.commentId)
      if (directParent) {
        topLevelParentId = replyingToInfo.commentId
      } else {
        // 如果不是直接回复顶级评论，说明是回复子评论，需要找到顶级父评论
        for (const comment of comments.value) {
          if (comment.replies && comment.replies.some(reply => reply.id === replyingToInfo.id)) {
            topLevelParentId = comment.id
            break
          }
        }
      }

      // 展开顶级父评论的回复列表
      if (topLevelParentId) {
        expandedReplies.value.add(topLevelParentId)
      }
    }

    await nextTick()

    // 查找新评论元素
    const targetId = String(commentId)
    let commentElement = document.querySelector(`[data-comment-id="${targetId}"]`)

    if (commentElement) {
      // 添加高亮样式
      commentElement.classList.add('comment-highlight')

      // 滚动到新评论
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 3秒后移除高亮样式
      setTimeout(() => {
        commentElement.classList.remove('comment-highlight')
      }, 3000)
    }
  } catch (error) {
    console.error('定位新评论失败:', error)
  }
}

// 定位目标评论
const locateTargetComment = async () => {
  if (!props.targetCommentId) {
    return
  }

  // 在移动端锁定页面滚动，避免定位过程中的滚动冲突
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    lock()
  }

  try {
    // 首先在当前已加载的评论中查找（支持递归搜索子评论）
    const findCommentInCurrent = () => {
      const currentComments = comments.value || []

      // 递归搜索函数，同时检查是否需要展开回复
      const searchComments = (commentList, parentCommentId = null) => {
        for (const comment of commentList) {
          // 检查当前评论是否为目标
          if (comment.id == props.targetCommentId) {
            // 如果目标评论是回复，且父评论有折叠的回复，需要展开
            if (parentCommentId && comment.replies && comment.replies.length > 2) {
              expandedReplies.value.add(parentCommentId)
            }
            return comment
          }
          // 检查子评论（如果有）
          if (comment.replies && comment.replies.length > 0) {
            const foundInReplies = searchComments(comment.replies, comment.id)
            if (foundInReplies) {
              // 如果在子评论中找到目标，且该评论有超过2个回复，需要展开
              if (comment.replies.length > 2) {
                expandedReplies.value.add(comment.id)
              }
              return foundInReplies
            }
          }
        }
        return null
      }

      return searchComments(currentComments)
    }

    let targetComment = findCommentInCurrent()

    // 如果在当前评论中没找到，需要加载更多评论
    if (!targetComment && hasMoreCommentsToShow.value) {
      let maxAttempts = 10 // 最多尝试加载10页
      let attempts = 0

      while (!targetComment && hasMoreCommentsToShow.value && attempts < maxAttempts) {
        await loadMoreComments()
        await nextTick()
        targetComment = findCommentInCurrent()
        attempts++
      }
    }

    // 如果找到了目标评论，进行定位和高亮
    if (targetComment) {
      await nextTick()

      // 查找目标评论元素
      const targetId = String(props.targetCommentId)
      let commentElement = document.querySelector(`[data-comment-id="${targetId}"]`)


      if (commentElement) {
        // 添加高亮样式
        commentElement.classList.add('comment-highlight')

        // 滚动到目标评论
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // 3秒后移除高亮样式
        setTimeout(() => {
          commentElement.classList.remove('comment-highlight')
        }, 3000)

      } else {

      }
    } else {

    }
  } finally {
    // 定位完成后，在移动端解锁页面滚动
    if (isMobile) {
      // 延迟解锁，确保滚动动画完成
      setTimeout(() => {
        unlock()
      }, 1000)
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

// 判断评论者是否为帖子作者
const isPostAuthorComment = (comment) => {
  if (!comment || !props.item) {
    return false
  }

  const postAuthorId = props.item.author_auto_id // 帖子作者的自增ID
  const commentUserId = comment.user_auto_id // 评论者的自增ID

  return postAuthorId && commentUserId && postAuthorId === commentUserId
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
  if (isClosing.value) return // 防止重复触发
  
  isClosing.value = true
  showContent.value = false // 立即隐藏内容
  
  // 不再使用setTimeout，改为依赖动画结束事件触发关闭
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
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    authStore.openLoginModal()
    if (focusedInput.value) {
      focusedInput.value.blur()
    }
    return
  }

  isInputFocused.value = true
}

// 切换排序菜单显示
const toggleSortMenu = () => {
  showSortMenu.value = !showSortMenu.value
}

// 点击DetailCard内部但menu外关闭排序菜单
const handleDetailCardClick = (event) => {
  if (showSortMenu.value && !event.target.closest('.comments-header') && !event.target.closest('.sort-menu')) {
    showSortMenu.value = false
  }
}

// 设置评论排序方式
const setCommentSort = async (order) => {
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    authStore.openLoginModal()
    showSortMenu.value = false
    return
  }

  commentSortOrder.value = order
  showSortMenu.value = false

  // 重新获取评论数据，重置为第一页
  try {
    await commentStore.fetchComments(props.item.id, {
      page: 1,
      limit: 5,
      sort: order,
      loadMore: false // 明确重置分页状态
    })

    // 重新初始化评论点赞状态
    const latestComments = comments.value
    if (latestComments && latestComments.length > 0) {
      commentLikeStore.initCommentsLikeStates(latestComments)
    }
  } catch (error) {
    console.error('重新排序评论失败:', error)
    showMessage('排序失败，请重试', 'error')
  }
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
  // 当关闭艾特选择模态框时，将输入框中带标记的@符号转换为纯文本
  if (focusedInput.value && focusedInput.value.convertAtMarkerToText) {
    focusedInput.value.convertAtMarkerToText()
  }
  showMentionPanel.value = false
}

// 图片上传面板切换
const toggleImageUpload = () => {
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    authStore.openLoginModal()
    return
  }

  showImageUpload.value = !showImageUpload.value
}

const closeImageUpload = () => {
  showImageUpload.value = false
}

// 处理图片上传确认
const handleImageUploadConfirm = async (images) => {
  // 先设置图片到uploadedImages
  uploadedImages.value = images
  showImageUpload.value = false

  // 只上传新添加的图片（没有uploaded标记或uploaded为false的图片）
  const newImages = images.filter(img => !img.uploaded)

  if (newImages.length > 0) {
    try {
      const files = newImages.map(img => img.file)
      const uploadResult = await imageUploadApi.uploadImages(files)

      if (uploadResult.success && uploadResult.data && uploadResult.data.uploaded) {
        // 更新新上传图片的状态和URL
        let uploadIndex = 0
        uploadedImages.value.forEach((img, index) => {
          if (!img.uploaded && uploadIndex < uploadResult.data.uploaded.length) {
            uploadedImages.value[index].uploaded = true
            uploadedImages.value[index].url = uploadResult.data.uploaded[uploadIndex].url
            uploadIndex++
          }
        })
        showMessage('图片上传成功', 'success')
      } else {
        throw new Error('图片上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      showMessage('图片上传失败，请重试', 'error')
      // 上传失败时只移除新添加的图片，保留已上传的图片
      uploadedImages.value = uploadedImages.value.filter(img => img.uploaded)
    }
  }
}

// 处理图片上传变化
const handleImageUploadChange = (images) => {
  uploadedImages.value = images
}

// 处理粘贴图片
const handlePasteImage = async (file) => {
  try {
    // 验证图片文件
    const validation = imageUploadApi.validateImageFile(file)
    if (!validation.valid) {
      showMessage(validation.error, 'error')
      return
    }

    // 创建图片预览
    const preview = await imageUploadApi.createImagePreview(file)

    // 添加到上传图片列表（先显示预览）
    const newImage = {
      file: file,
      preview: preview,
      uploaded: false,
      url: null
    }

    uploadedImages.value.push(newImage)
    showMessage('正在上传图片...', 'info')

    // 直接上传到图床
    const uploadResult = await imageUploadApi.uploadImage(file)
    if (uploadResult.success) {
      // 更新图片状态为已上传
      const imageIndex = uploadedImages.value.length - 1
      uploadedImages.value[imageIndex].uploaded = true
      uploadedImages.value[imageIndex].url = uploadResult.data.url
      showMessage('图片上传成功', 'success')
    } else {
      // 上传失败，移除图片
      uploadedImages.value.pop()
      showMessage(uploadResult.message || '图片上传失败', 'error')
    }
  } catch (error) {
    console.error('处理粘贴图片失败:', error)
    // 如果有添加的图片，移除它
    if (uploadedImages.value.length > 0) {
      uploadedImages.value.pop()
    }
    showMessage('处理图片失败，请重试', 'error')
  }
}

// 删除上传的图片
const removeUploadedImage = (index) => {
  uploadedImages.value.splice(index, 1)
  // 不需要调用handleImageUploadChange，因为uploadedImages已经是响应式的
  // ImageUploadModal会通过watch监听props.modelValue的变化自动同步
}

// 输入框键盘事件处理
const handleInputKeydown = (event) => {
  if (event.key === 'Escape') {
    // ESC键取消输入
    event.preventDefault()
    handleCancelInput()
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

// 获取评论用户悬停配置
const getCommentUserHoverConfig = (comment) => {
  if (!comment) return null

  return {
    getUserInfo: async () => {
      const userId = comment.user_id

      // 获取用户统计数据
      let userStats = {
        follow_count: 0,
        fans_count: 0,
        likes_and_collects: 0
      }

      try {
        const statsResponse = await userApi.getUserStats(userId)
        if (statsResponse.success) {
          userStats = statsResponse.data
        }
      } catch (error) {
        console.error('获取用户统计失败:', error)
      }

      // 获取关注状态 - 使用followStore保持状态一致性
      let followStatus = {
        followed: false,
        isMutual: false,
        buttonType: 'follow'
      }

      if (userStore.isLoggedIn) {
        // 优先使用followStore中的状态
        const storeState = followStore.getUserFollowState(userId)
        if (storeState.hasState) {
          followStatus = {
            followed: storeState.followed,
            isMutual: storeState.isMutual,
            buttonType: storeState.buttonType
          }
        } else {
          // 如果store中没有状态，则从API获取并更新store
          try {
            const followResponse = await userApi.getFollowStatus(userId)
            if (followResponse.success) {
              followStatus = followResponse.data
              // 更新store状态
              followStore.initUserFollowState(
                userId,
                followStatus.followed,
                followStatus.isMutual,
                followStatus.buttonType
              )
            }
          } catch (error) {
            console.error('获取关注状态失败:', error)
          }
        }
      }

      // 获取用户的前三个笔记封面图
      let userImages = []
      try {
        const postsResponse = await postApi.getUserPosts(userId, { page: 1, limit: 3 })

        if (postsResponse && postsResponse.data && postsResponse.data.posts) {
          // 收集每个笔记的第一张图片作为封面
          const coverImages = []
          postsResponse.data.posts.forEach((post) => {
            // 使用图片数组的第一张作为封面
            if (post.images && post.images.length > 0) {
              coverImages.push(post.images[0])
            }
          })
          // 取前3张封面图
          userImages = coverImages.slice(0, 3)
        }
      } catch (error) {
        console.error('获取用户笔记封面失败:', error)
      }

      // 获取完整的用户信息
      let userInfo = {
        avatar: comment.avatar || '',
        nickname: comment.username || `用户${userId}`,
        bio: '还没有简介'
      }

      try {
        const userInfoResponse = await userApi.getUserInfo(userId)
        if (userInfoResponse.success && userInfoResponse.data) {
          userInfo = {
            avatar: userInfoResponse.data.avatar || comment.avatar || '',
            nickname: userInfoResponse.data.nickname || comment.username || `用户${userId}`,
            bio: userInfoResponse.data.bio || '还没有简介'
          }
        }
      } catch (error) {
        console.error('获取用户详细信息失败:', error)
      }

      return {
        id: userId,
        avatar: userInfo.avatar,
        nickname: userInfo.nickname,
        bio: userInfo.bio,
        verified: comment.verified || false,
        followCount: userStats.follow_count || 0,
        fansCount: userStats.fans_count || 0,
        likeAndCollectCount: userStats.likes_and_collects || 0,
        isFollowing: followStatus.followed,
        isMutual: followStatus.isMutual,
        buttonType: followStatus.buttonType,
        images: userImages
      }
    },
    onFollow: async () => {
      if (!userStore.isLoggedIn) {
        showMessage('请先登录', 'error')
        return
      }
      try {
        const result = await followStore.toggleUserFollow(comment.user_id)
        if (result.success) {
          const newState = followStore.getUserFollowState(comment.user_id)
          if (newState.followed) {
            showMessage('关注成功', 'success')
          } else {
            showMessage('取消关注成功', 'success')
          }
        } else {
          showMessage(result.error || '操作失败，请重试', 'error')
        }
      } catch (error) {
        console.error('关注操作失败:', error)
        showMessage('操作失败，请重试', 'error')
      }
    },
    onUnfollow: async () => {
      if (!userStore.isLoggedIn) {
        showMessage('请先登录', 'error')
        return
      }
      try {
        const result = await followStore.toggleUserFollow(comment.user_id)
        if (result.success) {
          const newState = followStore.getUserFollowState(comment.user_id)
          if (newState.followed) {
            showMessage('关注成功', 'success')
          } else {
            showMessage('取消关注成功', 'success')
          }
        } else {
          showMessage(result.error || '操作失败，请重试', 'error')
        }
      } catch (error) {
        console.error('关注操作失败:', error)
        showMessage('操作失败，请重试', 'error')
      }
    },
    delay: 500
  }
}

// 获取作者用户悬停配置
const getAuthorUserHoverConfig = () => {
  if (!authorData.value) return null

  return {
    getUserInfo: async () => {
      const userId = authorData.value.id

      // 获取用户统计数据
      let userStats = {
        follow_count: 0,
        fans_count: 0,
        likes_and_collects: 0
      }

      try {
        const statsResponse = await userApi.getUserStats(userId)
        if (statsResponse.success) {
          userStats = statsResponse.data
        }
      } catch (error) {
        console.error('获取用户统计失败:', error)
      }

      // 优先使用followStore中的关注状态
      const storeState = followStore.getUserFollowState(userId)
      let followStatus = {
        followed: storeState.followed,
        isMutual: storeState.isMutual,
        buttonType: storeState.buttonType
      }

      // 如果store中没有状态且用户已登录，则从API获取并更新store
      if (!storeState.hasState && userStore.isLoggedIn) {
        try {
          const followResponse = await userApi.getFollowStatus(userId)
          if (followResponse.success) {
            followStatus = followResponse.data
            // 更新store状态
            followStore.initUserFollowState(
              userId,
              followStatus.followed,
              followStatus.isMutual,
              followStatus.buttonType
            )
          }
        } catch (error) {
          console.error('获取关注状态失败:', error)
        }
      }

      // 获取用户的前三个笔记封面图
      let userImages = []
      try {
        const postsResponse = await postApi.getUserPosts(userId, { page: 1, limit: 3 })

        if (postsResponse && postsResponse.data && postsResponse.data.posts) {
          // 收集每个笔记的第一张图片作为封面
          const coverImages = []
          postsResponse.data.posts.forEach((post) => {
            // 使用图片数组的第一张作为封面
            if (post.images && post.images.length > 0) {
              coverImages.push(post.images[0])
            }
          })
          // 取前3张封面图
          userImages = coverImages.slice(0, 3)
        }
      } catch (error) {
        console.error('获取用户笔记封面失败:', error)
      }

      // 获取完整的用户信息
      let userInfo = {
        avatar: authorData.value.avatar || '',
        nickname: authorData.value.name || `用户${userId}`,
        bio: '还没有简介'
      }

      try {
        const userInfoResponse = await userApi.getUserInfo(userId)
        if (userInfoResponse.success && userInfoResponse.data) {
          userInfo = {
            avatar: userInfoResponse.data.avatar || authorData.value.avatar || '',
            nickname: userInfoResponse.data.nickname || authorData.value.name || `用户${userId}`,
            bio: userInfoResponse.data.bio || '还没有简介'
          }
        }
      } catch (error) {
        console.error('获取用户详细信息失败:', error)
      }

      return {
        id: userId,
        avatar: userInfo.avatar,
        nickname: userInfo.nickname,
        bio: userInfo.bio,
        verified: authorData.value.verified || false,
        followCount: userStats.follow_count || 0,
        fansCount: userStats.fans_count || 0,
        likeAndCollectCount: userStats.likes_and_collects || 0,
        isFollowing: followStatus.followed,
        isMutual: followStatus.isMutual,
        buttonType: followStatus.buttonType,
        images: userImages
      }
    },
    onFollow: async () => {
      if (!userStore.isLoggedIn) {
        showMessage('请先登录', 'error')
        return
      }
      try {
        const result = await followStore.toggleUserFollow(authorData.value.id)
        if (result.success) {
          const newState = followStore.getUserFollowState(authorData.value.id)
          if (newState.followed) {
            showMessage('关注成功', 'success')
          } else {
            showMessage('取消关注成功', 'success')
          }
        } else {
          showMessage(result.error || '操作失败，请重试', 'error')
        }
      } catch (error) {
        console.error('关注操作失败:', error)
        showMessage('操作失败，请重试', 'error')
      }
    },
    onUnfollow: async () => {
      if (!userStore.isLoggedIn) {
        showMessage('请先登录', 'error')
        return
      }
      try {
        const result = await followStore.toggleUserFollow(authorData.value.id)
        if (result.success) {
          const newState = followStore.getUserFollowState(authorData.value.id)
          if (newState.followed) {
            showMessage('关注成功', 'success')
          } else {
            showMessage('取消关注成功', 'success')
          }
        } else {
          showMessage(result.error || '操作失败，请重试', 'error')
        }
      } catch (error) {
        console.error('关注操作失败:', error)
        showMessage('操作失败，请重试', 'error')
      }
    },
    delay: 500
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
    const maxWidth = props.pageMode ? 500 : 750

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

  // 移动端图片显示优化：以第一张图片为基准，所有图片使用相同的容器尺寸
  if (window.innerWidth <= 768) {
    // 只有第一张图片加载时才计算容器尺寸
    if (index === 0) {
      const img = event.target
      const aspectRatio = img.naturalWidth / img.naturalHeight
      const container = img.closest('.mobile-image-container')
      
      if (container) {
        const screenWidth = window.innerWidth
        const maxHeight = 565 // 最大高度限制
        const minHeight = 200 // 最小高度限制
        
        // 始终按宽度适配，高度按比例变化
        const containerWidth = window.innerWidth // 直接使用视口宽度
        const calculatedHeight = containerWidth * (img.naturalHeight / img.naturalWidth)
        
        let finalWidth = containerWidth
        let finalHeight = calculatedHeight
        let objectFit = 'contain' // 默认使用contain确保完整显示
        
        if (calculatedHeight > maxHeight) {
          finalHeight = maxHeight
          finalWidth = containerWidth // 容器宽度保持屏幕宽度
          objectFit = 'contain'
        } else if (calculatedHeight < minHeight) {
          finalHeight = minHeight
          finalWidth = containerWidth
          objectFit = 'contain'
        } else {
          finalWidth = containerWidth
          finalHeight = calculatedHeight
          objectFit = 'contain'
        }
        
        // 强制设置容器尺寸，覆盖CSS默认值
        container.style.width = '100vw' // 使用视口宽度确保占满屏幕
        container.style.height = finalHeight + 'px'
        container.style.minHeight = 'unset'
        container.style.margin = '0 0 16px 0' 
        container.style.maxWidth = 'none'
        container.style.left = '0'
        container.style.position = 'relative'
        const allImages = container.querySelectorAll('.mobile-slider-image')
        allImages.forEach(image => {
          image.style.objectFit = objectFit
        })
      }
    } else {
      // 非第一张图片加载时，只需要设置object-fit属性与第一张图片保持一致
      const img = event.target
      const container = img.closest('.mobile-image-container')
      if (container) {
        // 获取第一张图片的object-fit设置
        const firstImage = container.querySelector('.mobile-slider-image')
        if (firstImage && firstImage.style.objectFit) {
          img.style.objectFit = firstImage.style.objectFit
        }
      }
    }
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
  isViewingCommentImages.value = false
}

// 处理评论图片点击事件
const handleCommentImageClick = ({ images, index }) => {
  commentImages.value = images
  currentCommentImageIndex.value = index
  showCommentImageViewer.value = true
}

// 关闭评论图片查看器
const closeCommentImageViewer = () => {
  showCommentImageViewer.value = false
  commentImages.value = []
  currentCommentImageIndex.value = 0
}

// 处理帖子图片查看器索引变化
const handleImageIndexChange = (index) => {
  currentImageIndex.value = index
}

// 处理评论图片查看器索引变化
const handleCommentImageIndexChange = (index) => {
  currentCommentImageIndex.value = index
}





const closeImageViewer = () => {
  showImageViewer.value = false
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

// 发送评论
const handleSendComment = async () => {
  if (!userStore.isLoggedIn) {
    showMessage('请先登录', 'error')
    return
  }

  // 检查是否有内容或图片（使用与按钮相同的验证逻辑）
  const rawContent = commentInput.value || ''
  // 移除所有HTML标签和&nbsp;后检查是否为空
  const textContent = rawContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  if (!textContent && uploadedImages.value.length === 0) {
    showMessage('请输入评论内容或上传图片', 'error')
    return
  }

  // 检查图片是否都已上传完成
  if (uploadedImages.value.length > 0 && !allImagesUploaded.value) {
    showMessage('图片上传中，请稍候', 'error')
    return
  }

  // 立即反馈：折叠输入框
  isInputFocused.value = false

  // 保存原始输入和回复状态，用于失败时恢复
  const savedInput = commentInput.value
  const savedReplyingTo = replyingTo.value
  const savedUploadedImages = [...uploadedImages.value]

  // 清空输入状态
  commentInput.value = ''
  replyingTo.value = null
  uploadedImages.value = []
  showEmojiPanel.value = false
  showMentionPanel.value = false
  showImageUpload.value = false

  try {

    // 收集已上传的图片URL（从保存的数据中获取）
    const imageUrls = savedUploadedImages
      .filter(img => img.uploaded && img.url)
      .map(img => img.url)

    // 构建评论内容 - 直接使用原始内容，服务端会进行过滤
    let finalContent = savedInput.trim()
    if (imageUrls.length > 0) {
      const imageHtml = imageUrls.map(url => `<img src="${url}" alt="评论图片" class="comment-image" />`).join('')
      finalContent = finalContent ? `${finalContent}${imageHtml}` : imageHtml
    }

    const commentData = {
      post_id: props.item.id,
      content: finalContent,
      parent_id: savedReplyingTo ? savedReplyingTo.commentId : null
    }

    const response = await commentApi.createComment(commentData)

    if (response.success) {
      showMessage(savedReplyingTo ? '回复成功' : '评论成功', 'success')

      // 获取新评论的ID
      const newCommentId = response.data?.id

      // 清理图片缓存
      savedUploadedImages.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url)
        }
      })

      // 如果有新评论ID，直接添加到评论列表并定位
      if (newCommentId) {
        // 使用后端返回的完整评论数据，确保包含verified字段
        const newComment = {
          id: response.data.id,
          user_id: response.data.user_display_id || response.data.user_id,
          user_auto_id: response.data.user_auto_id || response.data.user_id,
          username: response.data.nickname || '匿名用户',
          avatar: response.data.user_avatar || new URL('@/assets/imgs/avatar.png', import.meta.url).href,
          verified: response.data.verified || 0, // 认证状态
          content: response.data.content,
          time: formatTime(response.data.created_at) || '刚刚',
          location: response.data.user_location || response.data.location || '',
          likeCount: response.data.like_count || 0,
          isLiked: response.data.liked || false,
          parent_id: response.data.parent_id,
          replies: [],
          reply_count: response.data.reply_count || 0,
          isReply: !!savedReplyingTo,
          replyTo: savedReplyingTo?.username
        }

        // 如果是回复评论，需要添加到对应父评论的replies数组中
        if (savedReplyingTo) {
          // 查找顶级父评论（可能是直接回复顶级评论，也可能是回复子评论）
          let topLevelParent = null

          // 首先尝试在顶级评论中查找
          topLevelParent = comments.value.find(c => c.id === savedReplyingTo.commentId)

          // 如果没找到，可能是回复子评论，需要在所有评论的replies中查找
          if (!topLevelParent) {
            for (const comment of comments.value) {
              if (comment.replies && comment.replies.some(reply => reply.id === savedReplyingTo.id)) {
                topLevelParent = comment
                break
              }
            }
          }

          if (topLevelParent) {
            // 找到顶级父评论，添加回复
            topLevelParent.replies.push(newComment)
            topLevelParent.reply_count = (topLevelParent.reply_count || 0) + 1
            // 更新commentStore中的数据以保持一致性
            const commentData = commentStore.getComments(props.item.id)
            commentStore.updateComments(props.item.id, {
              ...commentData,
              total: (commentData.total || 0) + 1
            })
          } else {
            // 父评论不在当前页面中（可能在其他分页），只更新总数不重新加载
            const commentData = commentStore.getComments(props.item.id)
            commentStore.updateComments(props.item.id, {
              ...commentData,
              total: (commentData.total || 0) + 1
            })
          }
        } else {
          // 如果是顶级评论，直接添加到评论列表
          commentStore.addComment(props.item.id, newComment)
        }

        // 使用setTimeout确保DOM完全更新后定位
        setTimeout(async () => {
          await locateNewComment(newCommentId, savedReplyingTo)
        }, 100)
      } else {
        // 没有新评论ID时，刷新评论列表
        await fetchComments()
      }
    } else {
      // 发送失败，清理图片缓存并恢复之前的状态
      savedUploadedImages.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url)
        }
      })


      commentInput.value = savedInput
      replyingTo.value = savedReplyingTo
      uploadedImages.value = savedUploadedImages
      isInputFocused.value = true
      showMessage(response.message || '发送失败，请重试', 'error')
    }
  } catch (error) {
    console.error('发送评论失败:', error)
    // 发送失败，清理图片缓存并恢复之前的状态
    savedUploadedImages.forEach(img => {
      if (img.url && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url)
      }
    })


    commentInput.value = savedInput
    replyingTo.value = savedReplyingTo
    uploadedImages.value = savedUploadedImages
    isInputFocused.value = true
    showMessage('发送失败，请重试', 'error')
  }
}

// 计算属性：判断所有图片是否都已上传
const allImagesUploaded = computed(() => {
  if (uploadedImages.value.length === 0) return true
  return uploadedImages.value.every(img => img.uploaded && img.url)
})

const handleCancelInput = () => {
  commentInput.value = ''
  replyingTo.value = null
  uploadedImages.value = []
  isInputFocused.value = false
  showEmojiPanel.value = false
  showMentionPanel.value = false
  showImageUpload.value = false
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

      // 初始化作者的关注状态
      const authorId = postDetail.author_account || postDetail.user_id
      if (authorId && userStore.isLoggedIn) {
        try {
          const followResponse = await followStore.fetchFollowStatus(authorId)
          if (followResponse.success) {
            followStore.initUserFollowState(
              authorId,
              followResponse.data.followed,
              followResponse.data.isMutual,
              followResponse.data.buttonType
            )
          }
        } catch (error) {
          console.error('获取作者关注状态失败:', error)
        }
      }
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

// 移动端使用 sticky 定位，无需动态调整 padding
const adjustMobilePadding = () => {
  return
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
  adjustMobilePadding()
}

// 键盘快捷键处理
const handleKeydown = (event) => {
  // 如果正在输入评论，不处理快捷键
  if (isInputFocused.value) return

  // 如果认证模态框打开，不处理快捷键
  if (authStore.showAuthModal) return

  // 如果图片查看器打开，不处理这些快捷键（图片查看器有自己的键盘处理）
  if (showImageViewer.value) return

  // 检查当前焦点是否在input、textarea或contenteditable元素上
  const activeElement = document.activeElement
  if (activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  )) {
    return // 不拦截用户在输入框中的操作
  }

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      prevImage()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextImage()
      break
    case 's':
    case 'S':
      event.preventDefault()
      toggleCollect()
      break
    case 'd':
    case 'D':
      event.preventDefault()
      // 通过程序化点击LikeButton来触发动画效果
      if (likeButtonRef.value) {
        likeButtonRef.value.$el.click()
      } else {
        toggleLike()
      }
      break
  }
}

onMounted(async () => {
  lock()

  window.addEventListener('resize', handleResize)
  document.addEventListener('keydown', handleKeydown)

  // 滚动监听函数
  const handleScroll = () => {
    const scrollContainer = scrollableContent.value
    if (!scrollContainer || isLoadingMore.value || !hasMoreCommentsToShow.value) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer

    // 当滚动到距离底部100px时触发加载更多
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (!hasTriggeredBottom.value) {
        hasTriggeredBottom.value = true
        loadMoreComments()
      }
    } else {
      // 离开底部后重置触发状态，允许再次触发
      hasTriggeredBottom.value = false
    }
  }

  if (window.innerWidth <= 768) {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', adjustMobilePadding)
      window.visualViewport.addEventListener('scroll', adjustMobilePadding)
    }
    
    if (scrollableContent.value) {
      scrollableContent.value.addEventListener('scroll', handleScroll, { passive: true })
      scrollableContent.value.addEventListener('scroll', adjustMobilePadding)
      
      const cleanupScroll = () => {
        if (scrollableContent.value) {
          scrollableContent.value.removeEventListener('scroll', handleScroll)
          scrollableContent.value.removeEventListener('scroll', adjustMobilePadding)
        }
      }
      onUnmounted(cleanupScroll)
    }
  } else {
    // 监听scrollableContent的滚动事件
    if (scrollableContent.value) {
      scrollableContent.value.addEventListener('scroll', handleScroll, { passive: true })
      
      const cleanupScroll = () => {
        if (scrollableContent.value) {
          scrollableContent.value.removeEventListener('scroll', handleScroll)
        }
      }
      onUnmounted(cleanupScroll)
    }
  }

  setTimeout(() => {
    isAnimating.value = false
  }, 400)

  if (userStore.isLoggedIn && !userStore.userInfo) {
    userStore.initUserInfo()
  }

  if (!props.disableAutoFetch) {
    fetchPostDetail()
  }

  // 检查是否已有评论数据（预加载场景）
  const existingComments = commentStore.getComments(props.item.id)
  const hasPreloadedComments = existingComments && existingComments.comments && existingComments.comments.length > 0

  if (!hasPreloadedComments) {
    // 如果没有预加载数据，才进行评论加载
    await fetchComments()
  }

  // 如果有目标评论ID，进行定位
  if (props.targetCommentId) {
    nextTick(() => {
      locateTargetComment()
    })
  }

  // 自动播放视频
  if (props.item.type === 2 && props.item.video_url) {
    nextTick(() => {
      autoPlayVideo()
    })
  }

  adjustMobilePadding()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeydown)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', adjustMobilePadding)
    window.visualViewport.removeEventListener('scroll', adjustMobilePadding)
  }
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

watch(showContent, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      adjustMobilePadding()
    }, 100)
  }
})

const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const minSwipeDistance = 50
const SWIPE_THRESHOLD = 10 // 滑动判定阈值
const isTouching = ref(false) // 添加触摸状态标记

const handleTouchStart = (e) => {
  // 确保只处理单指触摸
  if (e.touches.length !== 1) return
  
  isTouching.value = true
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  touchEndX.value = touchStartX.value
  touchEndY.value = touchStartY.value
}

const handleTouchMove = (e) => {
  // 如果不在触摸状态或多指触摸，直接返回
  if (!isTouching.value || e.touches.length !== 1) return
  
  const touchMoveX = e.touches[0].clientX
  const touchMoveY = e.touches[0].clientY

  const deltaX = Math.abs(touchMoveX - touchStartX.value)
  const deltaY = Math.abs(touchMoveY - touchStartY.value)

  // 仅当"水平滑动幅度 > 垂直滑动幅度 + 阈值"时，阻止默认行为（避免影响页面垂直滚动）
  if (deltaX > deltaY && deltaX > SWIPE_THRESHOLD) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  // 实时更新结束坐标
  touchEndX.value = touchMoveX
  touchEndY.value = touchMoveY
}

const handleTouchEnd = (e) => {
  // 如果不在触摸状态，直接返回
  if (!isTouching.value) return
  
  // 使用changedTouches获取最终坐标
  if (e.changedTouches.length > 0) {
    touchEndX.value = e.changedTouches[0].clientX
    touchEndY.value = e.changedTouches[0].clientY
  }

  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value

  // 检查是否为有效的水平滑动
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    e.preventDefault()
    e.stopPropagation()
    
    if (deltaX > 0) {
      prevImage()
    } else {
      nextImage()
    }
  }

  // 重置触摸状态，但不立即重置坐标
  isTouching.value = false
  
  // 延迟重置坐标，给浏览器更多时间处理事件
  setTimeout(() => {
    if (!isTouching.value) {
      touchStartX.value = 0
      touchStartY.value = 0
      touchEndX.value = 0
      touchEndY.value = 0
    }
  }, 100)
}



const goToImage = (index) => {
  if (index >= 0 && index < imageList.value.length) {
    currentImageIndex.value = index
  }
}

// 头像加载失败处理
function handleAvatarError(event) {
  event.target.src = defaultAvatar
}


</script>

<style scoped>
.detail-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: row;
  border-radius: 12px;
}


/* 缩放弹出动画 - 优化版 */
.detail-card.scale-in {
  animation: scaleInFromPoint 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center center;
  will-change: transform, opacity;
}

/* 缩放关闭动画 */
.detail-card.scale-out {
  animation: scaleOutToPoint 0.2s ease-out forwards;
  transform-origin: center center;
  will-change: transform, opacity;
}

/* 移动端水平滑入动画 */
@media (max-width: 768px) {
  .detail-card.slide-in {
    animation: slideInFromRight 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
  }
}

/* 移动端水平滑出动画 */
@media (max-width: 768px) {
  .detail-card.slide-out {
    animation: slideOutToRight 0.25s ease-out forwards;
    will-change: transform;
  }
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

@keyframes scaleOutToPoint {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 移动端滑入动画关键帧 */
@keyframes slideInFromRight {
  0% {
    transform: translateX(100%);
  }

  100% {
    transform: translateX(0);
  }
}

/* 移动端滑出动画关键帧 */
@keyframes slideOutToRight {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(100%);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: var(--overlay-bg);
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

/* 视频容器样式 */
.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-secondary);
}

.video-player {
  width: 100%;
  height: 100%;
  max-width: 1000px;
  object-fit: contain;
  background: #000;
}

/* 视频占位符样式 */
.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-secondary);
  color: var(--text-color-secondary);
}

.video-cover-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--bg-color-secondary);
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.placeholder-content p {
  margin: 0;
  font-size: 14px;
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
  cursor: zoom-in;
}

/* 图片悬停放大镜效果 */


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

.author-avatar-container {
  position: relative;
  display: inline-block;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.author-verified-badge {
  position: absolute;
  bottom: 0px;
  right: -6px;
  z-index: 2;
  border: 2px solid var(--bg-color-primary);
  border-radius: 50%;
}


.author-name-container {
  display: flex;
  align-items: center;
  gap: 4px;
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

.post-content {
  padding: 5px 16px 0 16px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
}

.post-text {
  color: var(--text-color-primary);
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 16px 0;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
}

.post-tags {
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


.post-meta {
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
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 14px;
  margin-bottom: 16px;
  cursor: pointer;
  position: relative;
  padding: 4px 0;
  border-radius: 4px;
}

.comments-header:hover {
  background-color: var(--bg-color-hover);
}

.comments-header:hover .comments-title {
  color: var(--text-color-primary);
}

.comments-header:hover .sort-icon {
  color: var(--text-color-primary);
}

.comments-title {
  font-size: 14px;
  color: var(--text-color-secondary);
  user-select: none;
}

/* 评论排序相关样式 */
.sort-icon {
  color: var(--text-color-secondary);
  transition: transform 0.2s ease, color 0.2s ease;
}

.sort-menu {
  position: absolute;
  top: 100%;
  left: 30px;
  background: var(--bg-color-primary);
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 80px;
  padding: 4px 2px;
  margin-top: 4px;
  user-select: none;
}

.sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-color-primary);
  transition: background-color 0.2s ease;
  border-radius: 8px;
}

.sort-option:hover {
  background-color: var(--bg-color-secondary);
}

.sort-option.active {
  background-color: var(--bg-color-active);
  color: var(--primary-color);
}

.tick-icon {
  color: var(--primary-color);
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
  padding: 6px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.comment-item.comment-highlight {
  background-color: var(--bg-color-secondary);
  animation: highlightFadeIn 0.5s ease-out, highlightFadeOut 5s ease-out 0.5s forwards;
}

.reply-item.comment-highlight {
  background-color: var(--bg-color-secondary);
  animation: highlightFadeIn 0.5s ease-out, highlightFadeOut 5s ease-out 0.5s forwards;
}

/* 高亮动画 */
@keyframes highlightFadeIn {
  from {
    background-color: transparent;
  }

  to {
    background-color: var(--bg-color-secondary);
  }
}

@keyframes highlightFadeOut {
  from {
    background-color: var(--bg-color-secondary);
  }

  to {
    background-color: transparent;
  }
}

.comment-avatar-container {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

.comment-verified-badge {
  position: absolute;
  bottom: -5px;
  right: -6px;
  z-index: 2;
  border: 2px solid var(--bg-color-primary);
  border-radius: 50%;
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

/* 作者标识样式 */
.author-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color-shadow);
  color: var(--primary-color);
  font-weight: 600;
  border-radius: 999px;
  font-size: 9px;
  white-space: nowrap;
  opacity: 0.7;
  flex-shrink: 0;
}

.author-badge--parent {
  padding: 2px 6px;
}

.author-badge--reply {
  padding: 1px 5px;
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
  padding: 4px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.reply-avatar-container {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.reply-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

.reply-verified-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  z-index: 2;
  border: 1px solid var(--bg-color-primary);
  border-radius: 50%;
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
.mention-btn,
.image-btn {
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
.mention-btn:hover,
.image-btn:hover {
  background: var(--bg-color-secondary);
}

.emoji-icon,
.mention-icon,
.image-icon {
  color: var(--text-color-secondary);
  transition: color 0.2s;
}

.emoji-btn:hover .emoji-icon,
.mention-btn:hover .mention-icon,
.image-btn:hover .image-icon {
  color: var(--text-color-primary);
}

/* 上传图片预览区域样式 */
.uploaded-images-section {
  padding: 0px 16px;
  background: transparent;
  margin: 8px 16px;
}

.uploaded-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.uploaded-image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: var(--overlay-bg);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-image-btn:hover {
  background: rgba(0, 0, 0, 0.8);
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
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.send-btn:disabled {
  opacity: 0.5;
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
  white-space: nowrap;
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

/* 图片上传模态框样式已移至独立组件 ImageUploadModal.vue */

/* 默认隐藏移动端图片容器 */
.mobile-image-container {
  display: none;
}

/* 默认隐藏移动端视频容器 */
.mobile-video-container {
  display: none;
}

/* 响应式设计 - 中等屏幕适配 (769px - 960px) */
@media (max-width: 960px) and (min-width: 769px) {
  .detail-card.page-mode {
    max-width: calc(100vw - 40px);
    width: calc(100vw - 40px);
    height: calc(100vh - 140px);
    max-height: calc(100vh - 140px);
    margin: 0 auto;
  }
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
    position: fixed;
    left: 0;
    right: 0;
    bottom: auto;
    /* 适配移动端浏览器UI */
    top: 0;
    top: constant(safe-area-inset-top);
    top: env(safe-area-inset-top);
    height: 100vh;
    height: calc(100vh - constant(safe-area-inset-top));
    height: calc(100vh - env(safe-area-inset-top));
    height: 100dvh;
  }

  .detail-card:not(.page-mode) {
    width: 100vw;
    height: 100%;
    max-width: 100vw;
    max-height: 100%;
    border-radius: 0;
    flex-direction: column;
    position: relative;
    overflow-x: hidden;
    flex: 1;
    box-sizing: border-box;
  }

  .close-btn {
    position: fixed;
    top: calc(16px + constant(safe-area-inset-top));
    top: calc(16px + env(safe-area-inset-top));
    left: 16px;
    z-index: 1001;
    background: transparent;
    color: var(--text-color-secondary);
    width: 36px;
    height: 36px;
  }

  .close-btn:hover {
    background: var(--bg-color-secondary);
  }

  .detail-content {
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* 移动端隐藏原来的图片区域和视频容器 */
  .image-section {
    display: none;
  }
  
  /* 移动端隐藏桌面端的视频容器 */
  .video-container {
    display: none;
  }

  .content-section {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg-color-primary);
    max-width: 100vw;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .author-wrapper {
    position: sticky !important;
    top: 0 !important;
    z-index: 1000 !important;
    min-height: 72px;
    padding: 12px 16px 0px 60px !important;
    background: var(--bg-color-primary) !important;
    border-bottom: 1px solid var(--border-color-primary) !important;
    box-sizing: border-box !important;
    width: 100% !important;
    flex-shrink: 0;
  }

  .scrollable-content {
    flex: 1;
    padding-top: 0;
    padding-bottom: 110px;
    padding-bottom: calc(110px + constant(safe-area-inset-bottom));
    padding-bottom: calc(110px + env(safe-area-inset-bottom));
    max-width: 100vw;
    box-sizing: border-box;
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
    /* margin-bottom: 16px; 和上面的空白问题有关系，不确定作用是什么但注释掉有效果 */
  }

  /* 图片容器在移动端的样式 */
  .mobile-image-container {
    display: block;
    /* 在移动端显示 */
    width: 100%;
    min-height: 200px;
    margin-bottom: 16px;
    position: relative;
    background: var(--bg-color-secondary);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  /* 移动端视频容器样式 */
  .mobile-video-container {
    display: flex;
    height: 40vh;
    width: 100%;
    min-height: 200px;
    margin-bottom: 16px;
    position: relative;
    background: var(--bg-color-secondary);
    overflow: hidden;
    align-items: center;
    justify-content: center;
  }

  .mobile-video-player {
    width: 100%;
    height: 100%;
    max-width: 1000px;
    object-fit: contain;
    background: #000;
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
    object-fit: cover; /* 默认使用cover，JavaScript会根据需要调整为contain */
    object-position: center;
    display: block;
    cursor: zoom-in;
    transition: object-fit 0.3s ease; /* 添加过渡效果 */
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
    background: var(--overlay-bg);
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


  .post-content {
    padding: 0 16px 16px 16px;
  }

  .post-title {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .post-text {
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
    /* 三层fallback确保跨平台兼容 */
    padding-bottom: 12px;
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

  /* 移动端回复头像保持更小尺寸以区分层级 */
  .reply-avatar {
    width: 28px;
    height: 28px;
  }

  /* 移动端回复头像容器也需要调整 */
  .reply-avatar-container {
    width: 28px;
    height: 28px;
  }

  .comment-content,
  .reply-content {
    margin-left: 12px;
  }

  /* 移动端头像和认证徽章调整 */
  .author-avatar {
    width: 36px;
    height: 36px;
  }

  .author-verified-badge {
    right: -4px;
    bottom: -1px;
    border-width: 1px;
  }

  .comment-verified-badge {
    right: -8px;
    bottom: -7px;
    border-width: 1px;
  }

  .reply-verified-badge {
    right: -2px;
    bottom: -1px;
    border-width: 1px;
  }

  /* 表情面板在移动端的调整 */
  .emoji-panel-overlay {
    padding: 0;
    z-index: 2500;
  }

  .action-buttons {
    gap: 1px;
  }
}


/* 加载更多提示样式 */
.load-more-comments {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.no-more-comments {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

/* 极小屏幕优化（宽度 < 360px） */
@media (max-width: 360px) {
  /* 减小按钮间距 */
  .send-cancel-buttons {
    gap: 8px;
  }

  /* 减小按钮内边距以适应小屏幕 */
  .send-btn,
  .cancel-btn {
    padding: 8px 14px;
    font-size: 15px;
  }
}
</style>