<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import SimpleSpinner from '@/components/spinner/SimpleSpinner.vue'
import SvgIcon from '@/components/SvgIcon.vue'

import MessageToast from '@/components/MessageToast.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import MentionModal from '@/components/mention/MentionModal.vue'
import MentionText from '@/components/mention/MentionText.vue'
import ContentEditableInput from '@/components/ContentEditableInput.vue'
import NotificationTab from './components/NotificationTab.vue'
import FollowButton from '@/components/FollowButton.vue'
import LikeButton from '@/components/LikeButton.vue'
import DetailCard from '@/components/DetailCard.vue'
import { getCommentNotifications, getLikeNotifications, getFollowNotifications, getCollectionNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/api/notification.js'
import { getPostDetail } from '@/api/posts.js'
import { postApi, userApi, commentApi } from '@/api/index.js'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useFollowStore } from '@/stores/follow'
import { useNotificationStore } from '@/stores/notification'
import { useThemeStore } from '@/stores/theme'
import { useCommentLikeStore } from '@/stores/commentLike'
import { formatTime } from '@/utils/timeFormat'

// Router实例
const router = useRouter()

// Store实例
const userStore = useUserStore()
const commentLikeStore = useCommentLikeStore()
const authStore = useAuthStore()
const followStore = useFollowStore()
const notificationStore = useNotificationStore()
const themeStore = useThemeStore()


// 常量定义
const TABS = [
  { key: 'comments', label: '评论和@' },
  { key: 'likes', label: '点赞' },
  { key: 'collections', label: '收藏' },
  { key: 'follows', label: '新增关注' }
]

// 响应式数据
const activeTab = ref('comments')
const isLoading = ref(true)
const notificationTabRef = ref(null)
const commentsData = ref([])
const likesData = ref([])
const collectionsData = ref([])
const followsData = ref([])

// 详情卡片相关状态
const showDetailCard = ref(false)
const selectedPost = ref(null)

// 数据加载状态跟踪
const loadedTabs = ref(new Set())

// 分页相关状态
const pagination = ref({
  comments: { page: 1, hasMore: true, loading: false },
  likes: { page: 1, hasMore: true, loading: false },
  collections: { page: 1, hasMore: true, loading: false },
  follows: { page: 1, hasMore: true, loading: false }
})

const PAGE_SIZE = 20 // 每页加载数量

// 懒加载相关
const loadMoreTriggers = ref({
  comments: null,
  likes: null,
  collections: null,
  follows: null
})
const observer = ref(null)

// 登录状态检查
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 回复相关状态
const replyInputRefs = ref({})
const showEmojiPanel = ref(false)
const showMentionPanel = ref(false)
const currentEmojiItem = ref(null)
const currentMentionItem = ref(null)

// 消息提示相关
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')



// 打开登录模态框
const openLoginModal = () => {
  authStore.openLoginModal()
}

// 工具函数
const scrollToTop = () => window.scrollTo(0, 0)

// 加载评论通知数据
async function loadCommentsData(isLoadMore = false) {
  const tabPagination = pagination.value.comments

  if (!isLoggedIn.value || tabPagination.loading) return
  if (!isLoadMore && loadedTabs.value.has('comments')) return
  if (isLoadMore && !tabPagination.hasMore) return

  tabPagination.loading = true

  try {
    const params = {
      page: isLoadMore ? tabPagination.page : 1,
      limit: PAGE_SIZE
    }

    const response = await getCommentNotifications(params)
    const notifications = response.data?.notifications || []

    // 批量转换数据，减少单个map操作
    const transformedData = notifications.map(item => {
      const isRead = item.is_read === 1
      const isReplyComment = item.type === 5 // 回复评论类型
      return {
        notificationId: item.id,
        id: item.from_user_id,
        autoId: item.from_user_auto_id,
        username: item.from_nickname || '未知用户',
        avatar: item.from_avatar || new URL('@/assets/imgs/avatar.png', import.meta.url).href,
        action: item.title || '评论了你的笔记',
        time: formatTime(item.created_at),
        content: item.comment_content || '原评论已删除',
        postImage: item.post_image || '/default-post.png',
        target_id: item.target_id,
        commentId: item.comment_id, // 评论ID，用于回复和点赞
        isLiked: item.comment_is_liked === 1, // 评论点赞状态
        likeCount: item.comment_like_count || 0, // 评论点赞数
        isRead,
        isFollowing: false,
        isReplyComment, // 是否为回复评论
        parentCommentContent: item.parent_comment_content || (isReplyComment ? '原评论已删除' : '') // 被回复的评论内容
      }
    })

    // 使用nextTick确保DOM更新不阻塞
    await nextTick()

    if (isLoadMore) {
      commentsData.value.push(...transformedData)
      tabPagination.page++
    } else {
      commentsData.value = transformedData
      tabPagination.page = 2
      loadedTabs.value.add('comments')
    }

    // 初始化评论点赞状态到store中
    transformedData.forEach(item => {
      if (item.commentId) {
        commentLikeStore.initCommentLikeState(item.commentId, item.isLiked, item.likeCount)
      }
    })

    tabPagination.hasMore = transformedData.length === PAGE_SIZE

  } catch (error) {
    console.error('加载评论通知失败:', error)
    if (!isLoadMore) {
      commentsData.value = []
    }
  } finally {
    tabPagination.loading = false
  }
}

// 加载赞通知数据
async function loadLikesData(isLoadMore = false) {
  const tabPagination = pagination.value.likes

  if (!isLoggedIn.value || tabPagination.loading) return
  if (!isLoadMore && loadedTabs.value.has('likes')) return
  if (isLoadMore && !tabPagination.hasMore) return

  tabPagination.loading = true

  try {
    const params = {
      page: isLoadMore ? tabPagination.page : 1,
      limit: PAGE_SIZE
    }

    const response = await getLikeNotifications(params)

    // 转换后端数据格式为前端期望的格式
    const transformedData = (response.data?.notifications || []).map(item => ({
      notificationId: item.id, // 通知ID，用于标记已读
      id: item.from_user_id, // 使用from_user_id字段（小石榴号）用于导航
      autoId: item.from_user_auto_id, // 自增ID，用于API调用
      username: item.from_nickname || '未知用户',
      avatar: item.from_avatar || new URL('@/assets/imgs/avatar.png', import.meta.url).href,
      action: item.title || '点赞了你的内容', // 使用后端返回的正确标题
      time: formatTime(item.created_at),
      postImage: item.post_image || '/default-post.png',
      target_id: item.target_id, // 添加笔记ID
      isRead: item.is_read === 1,
      isFollowing: false // 需要额外查询关注状态
    }))

    if (isLoadMore) {
      likesData.value.push(...transformedData)
      tabPagination.page++
    } else {
      likesData.value = transformedData
      tabPagination.page = 2
      loadedTabs.value.add('likes')
    }

    // 检查是否还有更多数据
    tabPagination.hasMore = transformedData.length === PAGE_SIZE

  } catch (error) {
    console.error('加载点赞通知失败:', error)
    if (!isLoadMore) {
      likesData.value = []
    }
  } finally {
    tabPagination.loading = false
  }
}

// 加载关注通知数据
async function loadFollowsData(isLoadMore = false) {
  const tabPagination = pagination.value.follows

  if (!isLoggedIn.value || tabPagination.loading) return
  if (!isLoadMore && loadedTabs.value.has('follows')) return
  if (isLoadMore && !tabPagination.hasMore) return

  tabPagination.loading = true

  try {
    const params = {
      page: isLoadMore ? tabPagination.page : 1,
      limit: PAGE_SIZE
    }

    const response = await getFollowNotifications(params)

    // 批量查询关注状态，减少API请求次数
    const userIds = (response.data?.notifications || []).map(item => item.from_user_auto_id || item.from_user_id)
    let followStatusMap = new Map()

    if (userIds.length > 0) {
      try {
        const batchSize = 5 // 限制并发请求数量
        for (let i = 0; i < userIds.length; i += batchSize) {
          const batch = userIds.slice(i, i + batchSize)
          const promises = batch.map(async userId => {
            try {
              const followStatus = await userApi.getFollowStatus(userId)
              return { userId, isFollowing: followStatus.data?.followed || followStatus.data?.isFollowing || false }
            } catch (error) {
              return { userId, isFollowing: false }
            }
          })
          const results = await Promise.all(promises)
          results.forEach(({ userId, isFollowing }) => {
            followStatusMap.set(userId, isFollowing)
          })
        }
      } catch (error) {
        console.error('批量查询关注状态失败:', error)
      }
    }

    // 转换后端数据格式为前端期望的格式
    const transformedData = (response.data?.notifications || []).map(item => {
      const userIdForQuery = item.from_user_auto_id || item.from_user_id
      const isFollowing = followStatusMap.get(userIdForQuery) || false

      // 根据关注状态生成动态文本
      let actionText = item.title || 'Ta关注了你' // 使用后端生成的title
      if (isFollowing) {
        actionText = 'Ta关注了你，你们已经互相关注了'
      }

      return {
        notificationId: item.id, // 通知ID，用于标记已读
        id: item.from_user_id, // 使用from_user_id字段（小石榴号）用于导航
        autoId: item.from_user_auto_id, // 自增ID，用于API调用
        username: item.from_nickname || '未知用户',
        avatar: item.from_avatar || new URL('@/assets/imgs/avatar.png', import.meta.url).href,
        action: actionText,
        time: formatTime(item.created_at),
        followCount: item.follow_count || 0,
        fansCount: item.fans_count || 0,
        isRead: item.is_read === 1,
        isFollowing: isFollowing
      }
    })

    if (isLoadMore) {
      followsData.value.push(...transformedData)
      tabPagination.page++
    } else {
      followsData.value = transformedData
      tabPagination.page = 2
      loadedTabs.value.add('follows')
    }

    // 检查是否还有更多数据
    tabPagination.hasMore = transformedData.length === PAGE_SIZE

  } catch (error) {
    console.error('加载关注通知失败:', error)
    if (!isLoadMore) {
      followsData.value = []
    }
  } finally {
    tabPagination.loading = false
  }
}

// 加载收藏通知数据
async function loadCollectionsData(isLoadMore = false) {
  const tabPagination = pagination.value.collections

  if (!isLoggedIn.value || tabPagination.loading) return
  if (!isLoadMore && loadedTabs.value.has('collections')) return
  if (isLoadMore && !tabPagination.hasMore) return

  tabPagination.loading = true

  try {
    const params = {
      page: isLoadMore ? tabPagination.page : 1,
      limit: PAGE_SIZE
    }

    const response = await getCollectionNotifications(params)

    // 转换后端数据格式为前端期望的格式
    const transformedData = (response.data?.notifications || []).map(item => ({
      notificationId: item.id, // 通知ID，用于标记已读
      id: item.from_user_id, // 使用from_user_id字段（小石榴号）用于导航
      autoId: item.from_user_auto_id, // 自增ID，用于API调用
      username: item.from_nickname || '未知用户',
      avatar: item.from_avatar || new URL('@/assets/imgs/avatar.png', import.meta.url).href,
      action: item.title || '收藏了你的笔记', // 使用后端返回的正确标题
      time: formatTime(item.created_at),
      postImage: item.post_image || '/default-post.png',
      target_id: item.target_id, // 添加笔记ID
      isRead: item.is_read === 1,
      isFollowing: false // 需要额外查询关注状态
    }))
    if (isLoadMore) {
      collectionsData.value.push(...transformedData)
      tabPagination.page++
    } else {
      collectionsData.value = transformedData
      tabPagination.page = 2
      loadedTabs.value.add('collections')
    }

    // 检查是否还有更多数据
    tabPagination.hasMore = transformedData.length === PAGE_SIZE

  } catch (error) {
    console.error('加载收藏通知失败:', error)
    if (!isLoadMore) {
      collectionsData.value = []
    }
  } finally {
    tabPagination.loading = false
  }
}



// 根据当前tab加载对应数据
async function loadCurrentTabData() {
  // 如果未登录，直接返回，不显示加载状态
  if (!isLoggedIn.value) {
    isLoading.value = false
    return
  }

  // 检查当前tab是否已经加载过数据
  const currentTab = activeTab.value
  if (loadedTabs.value.has(currentTab)) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  scrollToTop()

  try {
    switch (currentTab) {
      case 'comments':
        await loadCommentsData()
        break
      case 'likes':
        await loadLikesData()
        break
      case 'collections':
        await loadCollectionsData()
        break
      case 'follows':
        await loadFollowsData()
        break
    }

    // 标记当前tab为已加载
    loadedTabs.value.add(currentTab)
  } catch (error) {
    console.error('加载数据失败:', error)
  }

  isLoading.value = false
}

// 统一的用户状态更新函数
function updateUserFollowStatus(userId, isFollowing) {
  const allDataSources = [followsData.value, commentsData.value, likesData.value, collectionsData.value]

  for (const dataSource of allDataSources) {
    const user = dataSource.find(item => item.id === userId)
    if (user) {
      user.isFollowing = isFollowing
      // 关注状态已更新
      return
    }
  }
}

// 处理关注/取消关注
const handleFollow = (userId) => updateUserFollowStatus(userId, true)
const handleUnfollow = (userId) => updateUserFollowStatus(userId, false)

// 标记单个通知为已读
async function markAsRead(notificationId) {
  try {
    await markNotificationAsRead(notificationId)

    // 更新本地数据状态
    const allDataSources = [commentsData.value, likesData.value, collectionsData.value, followsData.value]
    let wasUnread = false
    let notificationType = null

    for (const dataSource of allDataSources) {
      const notification = dataSource.find(item => item.notificationId === notificationId)
      if (notification) {
        wasUnread = !notification.isRead
        notification.isRead = true

        // 确定通知类型以更新对应的未读数量
        if (dataSource === commentsData.value) {
          notificationType = 'comments'
        } else if (dataSource === likesData.value) {
          notificationType = 'likes'
        } else if (dataSource === collectionsData.value) {
          notificationType = 'collections'
        } else if (dataSource === followsData.value) {
          notificationType = 'follows'
        }
        break
      }
    }

    // 如果这个通知之前是未读的，更新未读数量
    if (wasUnread && notificationType) {
      // 使用新方法更新特定类型的未读数量
      notificationStore.decrementUnreadCountByType(notificationType)
    }
  } catch (error) {
    console.error('标记通知已读失败:', error)
  }
}

// 鼠标悬停时标记为已读
function handleNotificationHover(item) {
  if (!item.isRead) {
    markAsRead(item.notificationId)
  }
}

// 标记所有通知为已读
async function markAllAsRead() {
  try {
    await markAllNotificationsAsRead()

    // 更新本地数据状态
    const allDataSources = [commentsData.value, likesData.value, collectionsData.value, followsData.value]
    for (const dataSource of allDataSources) {
      dataSource.forEach(item => {
        item.isRead = true
      })
    }
    // 清空未读数量
    notificationStore.clearUnreadCount()

    // 重新获取按类型的未读数量以确保数据同步
    await notificationStore.fetchUnreadCountByType()

    // 显示成功提示
    showToastMessage('已将所有通知标记为已读', 'success')
  } catch (error) {
    console.error('标记所有通知已读失败:', error)
    // 显示错误提示
    showToastMessage('操作失败，请稍后重试', 'error')
  }
}

// 点击通知项时的处理（移除已读逻辑，因为悬停时已经处理了）
function handleNotificationClick(item) {
  // 点击时不再处理已读状态，因为悬停时已经处理了
}

// 处理用户点击事件
const onUserClick = (userId, event) => {
  event.stopPropagation()
  const userUrl = `${window.location.origin}/user/${userId}`
  window.open(userUrl, '_blank')
}

// 点击图片弹出详情卡
const onImageClick = async (notification) => {
  if (notification.target_id) {
    try {
      // 使用正确的API获取笔记详情
      const postDetail = await getPostDetail(notification.target_id);

      if (postDetail) {
        selectedPost.value = postDetail;
        showDetailCard.value = true;

        // 修改页面标题
        const originalTitle = document.title
        document.title = postDetail.title || '帖子详情'

        // 使用History API添加历史记录并更新URL
        const newUrl = `/post?id=${notification.target_id}`
        window.history.pushState(
          {
            previousUrl: window.location.pathname + window.location.search,
            showDetailCard: true,
            postId: notification.target_id,
            originalTitle: originalTitle
          },
          postDetail.title || '帖子详情',
          newUrl
        )
      } else {
        console.error('获取笔记详情失败: 笔记不存在');
      }
    } catch (error) {
      console.error('获取笔记详情失败:', error);
    }
  }
};

// 关闭详情卡
const closeDetailCard = () => {
  showDetailCard.value = false;
  selectedPost.value = null;

  // 恢复原始页面标题
  if (window.history.state && window.history.state.originalTitle) {
    document.title = window.history.state.originalTitle
  }

  // 恢复原URL状态
  if (window.history.state && window.history.state.previousUrl) {
    window.history.replaceState(window.history.state, '', window.history.state.previousUrl)
  } else {
    // 如果没有前一个URL，回到当前页面的原始状态
    window.history.back()
  }
};

// 用户悬停指令配置
const getUserHoverConfig = (userId) => {
  const getDataByTab = () => {
    const dataMap = {
      follows: followsData.value,
      comments: commentsData.value,
      likes: likesData.value,
      collections: collectionsData.value
    }
    return dataMap[activeTab.value] || []
  }

  return {
    getUserInfo: async () => {
      const currentUser = getDataByTab().find(item => item.id === userId)

      // 获取用户的autoId，优先使用数字ID来调用API以保持一致性
      const userAutoId = currentUser?.autoId || userId

      // 获取真实的用户统计数据
      let userStats = {
        follow_count: 0,
        fans_count: 0,
        likes_and_collects: 0
      }

      try {
        userStats = await userStore.getUserStats(userId)
      } catch (error) {
        console.error('获取用户统计数据失败:', error)
      }

      // 获取用户的前三个笔记封面图
      let userPostImages = []
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
          userPostImages = coverImages.slice(0, 3)
        }
      } catch (error) {
        console.error('获取用户笔记封面失败:', error)
      }

      // 获取最新的关注状态 - 使用autoId来保持与loadFollowsData的一致性
      let followStatus = { followed: false, isMutual: false, buttonType: 'follow' }
      try {
        const followResponse = await followStore.fetchFollowStatus(userAutoId)
        if (followResponse.success) {
          followStatus = followResponse.data
        } else {
          // 如果获取失败，尝试从store中获取
          const storeState = followStore.getUserFollowState(userAutoId)
          if (storeState.hasState) {
            followStatus = {
              followed: storeState.followed,
              isMutual: storeState.isMutual,
              buttonType: storeState.buttonType
            }
          } else {
            // 最后回退到通知列表数据
            followStatus.followed = currentUser?.isFollowing || false
          }
        }
      } catch (error) {
        console.error('获取关注状态失败:', error)
        // 回退到通知列表数据
        followStatus.followed = currentUser?.isFollowing || false
      }

      const baseInfo = {
        id: userId,
        avatar: currentUser?.avatar || '',
        nickname: currentUser?.username || `用户${userId}`,
        bio: currentUser ? '热爱生活，喜欢分享美好的事物' : '还没有简介',
        followCount: userStats.follow_count || 0,
        fansCount: userStats.fans_count || 0,
        likeAndCollectCount: userStats.likes_and_collects || 0,
        isFollowing: followStatus.followed,
        isMutual: followStatus.isMutual,
        buttonType: followStatus.buttonType,
        images: userPostImages
      }

      return baseInfo
    },
    onFollow: handleFollow,
    onUnfollow: handleUnfollow,
    delay: 500
  }
}

// 防抖定时器
let loadMoreDebounceTimer = null
let isLoadingMore = ref(false)

// 设置懒加载监听器
function setupLazyLoading() {
  nextTick(() => {
    // 清理之前的监听器
    cleanupLazyLoading()

    const currentTab = activeTab.value
    const trigger = loadMoreTriggers.value[currentTab]
    const tabPagination = pagination.value[currentTab]

    // 如果没有触发器或者没有更多数据，不设置监听器
    if (!trigger || !tabPagination.hasMore) return

    observer.value = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !isLoadingMore.value && tabPagination.hasMore) {
          // 添加防抖，避免频繁触发
          if (loadMoreDebounceTimer) {
            clearTimeout(loadMoreDebounceTimer)
          }
          loadMoreDebounceTimer = setTimeout(() => {
            if (!isLoadingMore.value && tabPagination.hasMore) {
              loadMoreData()
            }
          }, 300) // 增加防抖时间到300ms
        }
      },
      {
        rootMargin: '100px', // 减少提前加载距离
        threshold: 0.1
      }
    )

    observer.value.observe(trigger)
  })
}

// 加载更多数据
async function loadMoreData() {
  const currentTab = activeTab.value
  const tabPagination = pagination.value[currentTab]

  if (isLoadingMore.value || tabPagination.loading || !tabPagination.hasMore) {
    return
  }

  isLoadingMore.value = true

  try {
    switch (currentTab) {
      case 'comments':
        await loadCommentsData(true)
        break
      case 'likes':
        await loadLikesData(true)
        break
      case 'collections':
        await loadCollectionsData(true)
        break
      case 'follows':
        await loadFollowsData(true)
        break
    }
  } finally {
    isLoadingMore.value = false
  }
}

// 清理懒加载监听器
function cleanupLazyLoading() {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
  if (loadMoreDebounceTimer) {
    clearTimeout(loadMoreDebounceTimer)
    loadMoreDebounceTimer = null
  }
}

// 处理浏览器后退/前进按钮
const handlePopState = (event) => {
  if (event.state && event.state.showDetailCard && showDetailCard.value) {
    // 如果当前显示DetailCard且历史状态表明应该显示，不做处理
    return
  }

  if (showDetailCard.value) {
    // 如果当前显示DetailCard但历史状态不支持，关闭DetailCard
    showDetailCard.value = false
    selectedPost.value = null
  }
}

// 组件挂载
onMounted(async () => {
  scrollToTop()
  // 获取按类型的未读通知数量
  if (isLoggedIn.value) {
    await notificationStore.fetchUnreadCountByType()
  }
  await loadCurrentTabData()
  setupLazyLoading()
  nextTick(() => notificationTabRef.value?.updateSlider())
  // 添加浏览器后退/前进监听
  window.addEventListener('popstate', handlePopState)
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})

// 监听tab切换
watch(activeTab, async (newTab, oldTab) => {
  if (newTab !== oldTab) {
    await loadCurrentTabData()
    setupLazyLoading()
    nextTick(() => notificationTabRef.value?.updateSlider())
  }
})

// 监听登录状态变化
// 回复评论相关方法
const handleReplyComment = (item) => {
  if (!isLoggedIn.value) {
    openLoginModal()
    return
  }

  // 设置回复输入状态
  item.showReplyInput = true
  item.replyContent = ''

  // 聚焦输入框
  nextTick(() => {
    const inputRef = replyInputRefs.value[item.notificationId]
    if (inputRef) {
      inputRef.focus()
    }
  })
}

const handleCancelReply = (item) => {
  item.showReplyInput = false
  item.replyContent = ''
  showEmojiPanel.value = false
  currentEmojiItem.value = null
}

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

const handleSendReply = async (item) => {
  // 对内容进行安全过滤
  const rawContent = item.replyContent || ''
  const sanitizedContent = sanitizeContent(rawContent)

  if (!sanitizedContent) return

  try {
    // 对于回复评论通知，commentId是新评论的ID，我们需要回复的是这个评论
    // 对于评论笔记通知，commentId是评论的ID，我们也是回复这个评论
    const response = await commentApi.createComment({
      post_id: item.target_id,
      content: sanitizedContent, // 使用过滤后的内容
      parent_id: item.commentId // 使用通知中的comment_id作为parent_id
    })

    if (response.success) {
      // 显示成功提示
      showToastMessage('回复成功', 'success')

      // 重置回复状态
      handleCancelReply(item)

      // 可选：重新加载当前标签数据以显示最新回复
      // await loadCurrentTabData()
    } else {
      showToastMessage(response.message || '回复失败', 'error')
    }
  } catch (error) {
    console.error('回复评论失败:', error)
    showToastMessage('回复失败，请稍后重试', 'error')
  }
}



// 获取评论点赞状态（响应式）
const getCommentLikeStatus = (commentId) => {
  return commentLikeStore.getCommentLikeState(commentId).liked
}

// 处理评论点赞
const handleCommentLike = async (item, willBeLiked) => {
  if (!isLoggedIn.value) {
    openLoginModal()
    return
  }

  const commentId = item.commentId
  if (!commentId) {
    console.error('评论ID不存在:', item)
    showToastMessage('评论ID不存在，无法点赞', 'error')
    return
  }

  // 立即更新UI状态，给用户即时反馈
  const currentState = commentLikeStore.getCommentLikeState(commentId)
  commentLikeStore.updateCommentLikeState(commentId, willBeLiked, currentState.likeCount + (willBeLiked ? 1 : -1))

  // 异步调用后端API，不阻塞UI
  try {
    const response = willBeLiked
      ? await commentApi.likeComment(commentId)
      : await commentApi.unlikeComment(commentId)

    if (response.code === 200) {
      // 使用后端返回的准确数据更新store（如果有差异的话）
      if (response.data && response.data.likeCount !== undefined) {
        commentLikeStore.updateCommentLikeState(commentId, willBeLiked, response.data.likeCount)
      }
    }
  } catch (error) {
    // API调用失败时，在下次页面刷新时会从服务器获取正确状态
    console.warn('点赞操作失败，但UI已更新:', error)
  }
}

// 表情选择相关方法
const toggleEmojiPanel = (item) => {
  if (currentEmojiItem.value === item && showEmojiPanel.value) {
    showEmojiPanel.value = false
    currentEmojiItem.value = null
  } else {
    showEmojiPanel.value = true
    currentEmojiItem.value = item
  }
}

const handleEmojiSelect = (emoji) => {
  if (currentEmojiItem.value) {
    const item = currentEmojiItem.value
    const inputRef = replyInputRefs.value[item.notificationId]
    const emojiChar = emoji.i || emoji.native || emoji

    // 使用ContentEditableInput组件的insertEmoji方法
    if (inputRef && inputRef.insertEmoji) {
      inputRef.insertEmoji(emojiChar)
    } else {
      // 备用方案：直接添加到末尾
      item.replyContent = (item.replyContent || '') + emojiChar
      nextTick(() => {
        if (inputRef && inputRef.focus) {
          inputRef.focus()
        }
      })
    }
  }
  showEmojiPanel.value = false
  currentEmojiItem.value = null
}

// mention选择相关方法
const toggleMentionPanel = (item) => {
  if (currentMentionItem.value === item && showMentionPanel.value) {
    showMentionPanel.value = false
    currentMentionItem.value = null
  } else {
    // 如果要打开面板，先插入@符号
    const inputRef = replyInputRefs.value[item.notificationId]
    if (inputRef && inputRef.insertAtSymbol) {
      inputRef.insertAtSymbol()
    }
    showMentionPanel.value = true
    currentMentionItem.value = item
  }
}

const closeMentionPanel = () => {
  showMentionPanel.value = false
  currentMentionItem.value = null
}

const handleMentionSelect = (friend) => {
  if (currentMentionItem.value) {
    const item = currentMentionItem.value
    const inputRef = replyInputRefs.value[item.notificationId]

    // 调用ContentEditableInput组件的selectMentionUser方法
    if (inputRef && inputRef.selectMentionUser) {
      inputRef.selectMentionUser(friend)
    }
  }
  showMentionPanel.value = false
  currentMentionItem.value = null
}

// 消息提示方法
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// handleReplyInput函数已移除，其功能已封装在ContentEditableInput组件中

// 处理键盘事件，实现mention链接整体删除
const handleInputKeydown = (event) => {
  if (event.key === 'Backspace') {
    // 处理mention链接的整体删除
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = range.startContainer

      // 检查光标是否在mention链接之后
      if (container.nodeType === Node.TEXT_NODE && container.previousSibling) {
        const prevElement = container.previousSibling
        if (prevElement.nodeType === Node.ELEMENT_NODE &&
          prevElement.tagName === 'A' &&
          prevElement.classList.contains('mention-link')) {
          // 如果光标在mention链接后的文本节点开始位置
          if (range.startOffset === 0) {
            event.preventDefault()
            // 删除整个mention链接
            prevElement.remove()
            // 触发input事件更新数据
            const inputEvent = new Event('input', { bubbles: true })
            event.target.dispatchEvent(inputEvent)
          }
        }
      }
    }
  }
}

// 设置回复输入框引用
const setReplyInputRef = (notificationId, el) => {
  if (el) {
    replyInputRefs.value[notificationId] = el
  }
}

watch(isLoggedIn, async (newValue, oldValue) => {
  if (newValue && !oldValue) {
    // 用户刚登录，清除已加载标记并重新加载数据
    loadedTabs.value.clear()
    await notificationStore.fetchUnreadCountByType()
    await loadCurrentTabData()
    setupLazyLoading()
    nextTick(() => notificationTabRef.value?.updateSlider())
  } else if (!newValue && oldValue) {
    // 用户登出后，清空所有数据
    commentsData.value = []
    likesData.value = []
    collectionsData.value = []
    followsData.value = []

    // 清空已加载记录
    loadedTabs.value.clear()

    // 重置分页状态
    Object.keys(pagination.value).forEach(key => {
      pagination.value[key] = {
        page: 1,
        hasMore: true,
        loading: false
      }
    })

    // 清理懒加载监听器
    cleanupLazyLoading()
  }
})
</script>
<template>
  <div class="content-container">
    <div class="notification-main">

      <NotificationTab v-model:activeTab="activeTab" :tabs="TABS" :unread-counts="notificationStore.unreadCountByType"
        ref="notificationTabRef" />


      <div v-if="isLoggedIn" class="floating-mark-read-btn-wrapper" @click="markAllAsRead">
        <div class="floating-mark-read-btn">
          <SvgIcon name="clear" class="btn-icon" width="20" height="20" />
        </div>
        <div class="tooltip">一键已读</div>
      </div>


      <div class="login-prompt" v-if="!isLoggedIn">
        <div class="prompt-content">
          <SvgIcon name="notification" width="48" height="48" class="prompt-icon" />
          <h3>请先登录</h3>
          <p>登录后即可查看评论、点赞和关注通知</p>
        </div>
      </div>


      <div v-if="isLoading && isLoggedIn" class="loading-container">
        <SimpleSpinner size="32" />
        <span class="loading-text">加载中...</span>
      </div>

      <div v-if="isLoggedIn" class="content-wrapper" :class="{ 'with-loading': isLoading }">

        <div class="main-content">
          <div class="content-section">

            <template v-if="activeTab === 'comments'">

              <div v-if="commentsData.length === 0 && !isLoading && loadedTabs.has('comments')" class="empty-state">
                <SvgIcon name="chat" width="48" height="48" class="empty-icon" />
                <h3>暂无评论通知</h3>
                <p>当有人评论或@你时，通知会显示在这里</p>
              </div>
              <div v-for="item in commentsData" :key="item.notificationId" class="notification-item"
                :class="{ 'unread': !item.isRead }" @mouseenter="handleNotificationHover(item)">
                <div class="left-section">
                  <a class="user-avatar clickable-avatar" v-user-hover="getUserHoverConfig(item.id)"
                    @click="onUserClick(item.id, $event)">
                    <img v-img-lazy="item.avatar" :alt="item.username" class="lazy-avatar" />
                  </a>
                  <div v-if="!item.isRead" class="unread-dot"></div>
                </div>
                <div class="right-section">
                  <div class="notification-content">
                    <a class="username clickable-name" v-user-hover="getUserHoverConfig(item.id)"
                      @click="onUserClick(item.id, $event)">{{ item.username }}</a>
                    <div class="interaction-hint">
                      <span class="action">{{ item.action }}</span>
                      <span class="time">{{ item.time }}</span>
                    </div>
                    <div class="notification-text" @click.stop="onImageClick(item)">
                      <MentionText :text="item.content" />

                      <div v-if="item.isReplyComment && item.parentCommentContent" class="replied-comment">
                        <MentionText :text="item.parentCommentContent" />
                      </div>
                    </div>

                    <div class="comment-actions"
                      v-if="item.content !== '原评论已删除' && (!item.isReplyComment || item.parentCommentContent !== '原评论已删除')">
                      <div v-if="!item.showReplyInput" class="action-buttons">

                        <div class="comment-reply-container">
                          <SvgIcon name="chat" width="22" height="22" class="comment-reply-icon"
                            @click="handleReplyComment(item)" />
                          <button class="comment-reply-btn" @click="handleReplyComment(item)">回复</button>
                        </div>
                        <div class="comment-like-container">
                          <LikeButton :is-liked="getCommentLikeStatus(item.commentId)" size="medium"
                            @click="(willBeLiked) => handleCommentLike(item, willBeLiked)" />
                        </div>

                      </div>

                      <div v-if="item.showReplyInput" class="reply-input-section">
                        <div class="reply-input-wrapper">
                          <div class="input-with-emoji">
                            <ContentEditableInput v-model="item.replyContent"
                              :input-class="'reply-input content-textarea'" :placeholder="`回复 ${item.username}：`"
                              :enable-mention="true" @mention="handleMentionSelect"
                              :ref="el => setReplyInputRef(item.notificationId, el)" />
                            <button class="mention-btn" @click="toggleMentionPanel(item)">
                              <SvgIcon name="mention" class="mention-icon" width="25" height="25" />
                            </button>
                            <button class="emoji-btn" @click="toggleEmojiPanel(item)">
                              <SvgIcon name="emoji" class="emoji-icon" width="25" height="25" />
                            </button>
                          </div>
                          <button v-if="item.replyContent && item.replyContent.trim()" class="send-btn"
                            @click="handleSendReply(item)" :disabled="item.isSending">
                            发送
                          </button>
                          <button class="cancel-btn" @click="handleCancelReply(item)" :disabled="item.isSending">
                            取消
                          </button>

                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="post-thumbnail">
                    <img v-img-lazy="item.postImage" alt="笔记图片" class="lazy-image" />
                  </div>
                </div>
              </div>

              <div v-if="pagination.comments.hasMore" :ref="el => loadMoreTriggers.comments = el"
                class="load-more-trigger"></div>
            </template>


            <template v-else-if="activeTab === 'likes'">

              <div v-if="likesData.length === 0 && !isLoading && loadedTabs.has('likes')" class="empty-state">
                <SvgIcon name="like" width="48" height="48" class="empty-icon" />
                <h3>暂无点赞通知</h3>
                <p>当有人为你的笔记或评论点赞时，通知会显示在这里</p>
              </div>
              <div v-for="item in likesData" :key="item.notificationId" class="notification-item"
                :class="{ 'unread': !item.isRead }" @mouseenter="handleNotificationHover(item)">
                <div class="left-section">
                  <a class="user-avatar clickable-avatar" v-user-hover="getUserHoverConfig(item.id)"
                    @click="onUserClick(item.id, $event)">
                    <img v-img-lazy="item.avatar" :alt="item.username" class="lazy-avatar" />
                  </a>
                  <div v-if="!item.isRead" class="unread-dot"></div>
                </div>
                <div class="right-section">
                  <div class="notification-content">
                    <a class="username clickable-name" v-user-hover="getUserHoverConfig(item.id)"
                      @click="onUserClick(item.id, $event)">{{ item.username }}</a>
                    <div class="interaction-hint">
                      <span class="action">{{ item.action }}</span>
                      <span class="time">{{ item.time }}</span>
                    </div>
                    <div class="notification-text" @click.stop="onImageClick(item)">点击查看笔记详情</div>
                  </div>
                  <div class="post-thumbnail">
                    <img v-img-lazy="item.postImage" alt="笔记图片" class="lazy-image" />
                  </div>
                </div>
              </div>

              <div v-if="pagination.likes.hasMore" :ref="el => loadMoreTriggers.likes = el" class="load-more-trigger">
              </div>
            </template>


            <template v-else-if="activeTab === 'collections'">

              <div v-if="collectionsData.length === 0 && !isLoading && loadedTabs.has('collections')"
                class="empty-state">
                <SvgIcon name="collect" width="48" height="48" class="empty-icon" />
                <h3>暂无收藏通知</h3>
                <p>当有人收藏你的笔记时，通知会显示在这里</p>
              </div>
              <div v-for="item in collectionsData" :key="item.notificationId" class="notification-item"
                :class="{ 'unread': !item.isRead }" @mouseenter="handleNotificationHover(item)">
                <div class="left-section">
                  <a class="user-avatar clickable-avatar" v-user-hover="getUserHoverConfig(item.id)"
                    @click="onUserClick(item.id, $event)">
                    <img v-img-lazy="item.avatar" :alt="item.username" class="lazy-avatar" />
                  </a>
                  <div v-if="!item.isRead" class="unread-dot"></div>
                </div>
                <div class="right-section">
                  <div class="notification-content">
                    <a class="username clickable-name" v-user-hover="getUserHoverConfig(item.id)"
                      @click="onUserClick(item.id, $event)">{{ item.username }}</a>
                    <div class="interaction-hint">
                      <span class="action">{{ item.action }}</span>
                      <span class="time">{{ item.time }}</span>
                    </div>
                    <div class="notification-text" @click.stop="onImageClick(item)">点击查看笔记详情</div>
                  </div>
                  <div class="post-thumbnail">
                    <img v-img-lazy="item.postImage" alt="笔记图片" class="lazy-image" />
                  </div>
                </div>
              </div>

              <div v-if="pagination.collections.hasMore" :ref="el => loadMoreTriggers.collections = el"
                class="load-more-trigger"></div>
            </template>


            <template v-else-if="activeTab === 'follows'">

              <div v-if="followsData.length === 0 && !isLoading && loadedTabs.has('follows')" class="empty-state">
                <SvgIcon name="follow" width="48" height="48" class="empty-icon" />
                <h3>暂无关注通知</h3>
                <p>当有人关注你时，通知会显示在这里</p>
              </div>
              <div v-for="item in followsData" :key="item.notificationId" class="notification-item"
                :class="{ 'unread': !item.isRead }" @mouseenter="handleNotificationHover(item)">
                <div class="left-section">
                  <a class="user-avatar clickable-avatar" v-user-hover="getUserHoverConfig(item.id)"
                    @click="onUserClick(item.id, $event)">
                    <img v-img-lazy="item.avatar" :alt="item.username" class="lazy-avatar" />
                  </a>
                  <div v-if="!item.isRead" class="unread-dot"></div>
                </div>
                <div class="right-section">
                  <div class="notification-content">
                    <a class="username clickable-name" v-user-hover="getUserHoverConfig(item.id)"
                      @click="onUserClick(item.id, $event)">{{ item.username }}</a>
                    <div class="interaction-hint">
                      <span class="action">{{ item.action }}</span>
                      <span class="time">{{ item.time }}</span>
                    </div>
                  </div>
                  <div class="follow-button">
                    <FollowButton :is-following="item.isFollowing || false" :user-id="item.id" follow-text="回关"
                      following-text="互相关注" @follow="handleFollow" @unfollow="handleUnfollow" />
                  </div>
                </div>
              </div>

              <div v-if="pagination.follows.hasMore" :ref="el => loadMoreTriggers.follows = el"
                class="load-more-trigger"></div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>


  <DetailCard v-if="showDetailCard && selectedPost" :item="selectedPost" @close="closeDetailCard" />


  <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="showToast = false" />


  <div v-if="showEmojiPanel && currentEmojiItem" class="emoji-panel-overlay" @click="showEmojiPanel = false">
    <div class="emoji-panel-container" @click.stop>
      <EmojiPicker :theme="themeStore.isDark ? 'dark' : 'light'" @select="handleEmojiSelect" :native="true"
        :hide-search="false" :hide-skin-tones="true" set="native" />
    </div>
  </div>


  <MentionModal :visible="!!(showMentionPanel && currentMentionItem)" @close="closeMentionPanel"
    @select="handleMentionSelect" />
</template>


<style scoped>
.content-container {
  background-color: var(--bg-color-primary);
  padding-top: 144px;
  transition: background 0.2s ease;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px 16px;
  flex-direction: row;
  position: fixed;
  top: 129px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 700px;
  z-index: 100;
  background-color: var(--bg-color-primary);
  transition: background 0.2s ease;

}

/* 大屏模式下的加载动画定位调整 */
@media (min-width: 901px) {
  .loading-container {
    left: calc(50% + 114px);
    width: 100%;
  }
}

.loading-text {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.notification-main {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 16px;
  background-color: var(--bg-color-primary);
  transition: background 0.2s ease;
}

/* 未登录状态样式 */
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.prompt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.prompt-icon {
  color: var(--text-color-quaternary);
  margin-bottom: 16px;
}

.prompt-content h3 {
  color: var(--text-color-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.prompt-content p {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* 一键已读按钮样式 */
.floating-mark-read-btn-wrapper {
  position: fixed;
  bottom: 60px;
  right: 12px;
  z-index: 999;
  display: inline-block;
}

.floating-mark-read-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--bg-color-primary);
  border: var(--border-color-primary) 1px solid;
  cursor: pointer;
  transition: all 0.2s ease;
}

.floating-mark-read-btn:hover {
  background-color: var(--bg-color-secondary);
}

.floating-mark-read-btn:hover .btn-icon {
  color: var(--text-color-primary);
}

.floating-mark-read-btn .btn-icon {
  color: var(--text-color-secondary);
  transition: color 0.2s ease;
}

/* Tooltip 样式 */
.floating-mark-read-btn-wrapper .tooltip {
  position: absolute;
  right: 50px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color-primary);
  z-index: 10;
  pointer-events: none;
}

.floating-mark-read-btn-wrapper:hover .tooltip {
  opacity: 1;
  visibility: visible;
}



/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--text-color-quaternary);
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--text-color-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

/* 未读通知样式 */
.notification-item.unread {
  background: var(--bg-color-secondary);
  border-radius: 8px;
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  margin-bottom: 5px;
  transition: background 0.2s ease;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
}

.left-section {
  flex-shrink: 0;
  margin-right: 24px;
  position: relative;
}

.content-wrapper {
  transition: margin-top 0.3s ease;
}

.content-wrapper.with-loading {
  margin-top: 40px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding-top: 20px;
}

.right-section {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--bg-color-secondary);
  transition: border-color 0.2s ease;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  display: block;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 懒加载图片样式 */
.lazy-image,
.lazy-avatar {
  transition: opacity 0.5s ease;
  opacity: 0;
}

.lazy-image.fade-in,
.lazy-avatar.fade-in {
  opacity: 1;
}

.notification-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: bold;
  color: var(--text-color-primary);
  font-size: 16px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  width: fit-content;
}

.clickable-avatar {
  cursor: pointer;
}

.clickable-name {
  cursor: pointer;
  transition: color 0.2s ease;
}



.interaction-hint {
  display: flex;
  gap: 8px;
}

.action,
.time {
  color: var(--text-color-tertiary);
  font-size: 14px;
}

.notification-text {
  color: var(--text-color-primary);
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
}

.replied-comment {
  margin-top: 7px;
  padding: 1px 12px;
  font-size: 12px;
  color: var(--text-color-tertiary);
  border-left: 3px solid var(--bg-color-tertiary);
  line-height: 1.3;
  max-width: 100%;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.post-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  margin-left: 12px;
  flex-shrink: 0;
}

.post-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.follow-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-left: 12px;
}

/* 懒加载相关样式 */
.load-more-trigger {
  height: 1px;
  width: 100%;
}

/* 评论操作样式 */
.comment-actions {
  margin-top: 12px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 16px;
}

.comment-like-container {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border-color-secondary);
  width: 40px;
  height: 40px;
  transition: border-color 0.2s ease;
}

.comment-like-container:hover {
  background: var(--bg-color-secondary);
  border-color: var(--border-color-primary);
  transition: all 0.2s ease;
}

.comment-reply-container {
  display: flex;
  align-items: center;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--border-color-secondary);
  gap: 4px;
  height: 40px;
  padding: 0 15px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.comment-reply-container:hover {
  background: var(--bg-color-secondary);
  border-color: var(--border-color-primary);
  transition: all 0.2s ease;
}

.comment-reply-container:hover .comment-reply-icon,
.comment-reply-container:hover .comment-reply-btn {
  color: var(--text-color-primary);
}


.comment-reply-icon {
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.comment-reply-btn {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  font-size: 16px;

  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}





/* 回复输入框样式 */

.reply-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 5px;
}

.input-with-emoji {
  position: relative;
  display: flex;
  align-items: flex-end;
  flex: 1;
  max-width: 60%;
}

.reply-input {
  width: 100%;
  min-height: 40px;
  max-height: 80px;
  padding: 10px 72px 10px 16px;
  border: none;
  border-radius: 20px;
  background-color: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-size: 16px;
  line-height: 20px;
  resize: none;
  outline: none;
  caret-color: var(--primary-color);
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
  overflow-y: auto;
  transition: background 0.2s ease, border-color 0.2s ease;

}

.reply-input.content-textarea:empty:before {
  content: attr(data-placeholder);
  color: var(--text-color-secondary);
  font-size: 14px;
  pointer-events: none;
}

.reply-input::placeholder {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.mention-btn {
  position: absolute;
  right: 40px;
  top: 55%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color-tertiary);
  cursor: pointer;
  padding: 4px;
  transition: all 0.2s ease;
  z-index: 1;
}

.mention-btn:hover {
  color: var(--text-color-secondary);
}

.emoji-btn {
  position: absolute;
  right: 8px;
  top: 55%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color-tertiary);
  cursor: pointer;
  padding: 4px;
  transition: all 0.2s ease;
  z-index: 1;
}

.emoji-btn:hover {
  color: var(--text-color-secondary);
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

.cancel-btn {
  background: none;
  border: 1px solid var(--border-color-secondary);
  color: var(--text-color-secondary);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;

}

.cancel-btn:hover {
  color: var(--text-color-primary);
  background-color: var(--bg-color-secondary);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 表情面板样式 */
.emoji-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.emoji-panel-container {
  background-color: var(--bg-color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 90vw;
  max-height: 90vh;
}

@media (min-width: 901px) {
  .notification-main {
    max-width: 700px;
    margin: 0 auto;
    padding: 0;
  }
}
</style>
