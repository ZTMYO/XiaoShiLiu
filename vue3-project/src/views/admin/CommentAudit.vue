<template>
  <CrudTable title="评论审核" entity-name="评论" api-endpoint="/admin/comments-audit"
    :columns="columns" :form-fields="[]" :search-fields="searchFields" :custom-actions="customActions"
    :show-create-button="false" @custom-action="handleCustomAction" @close-filter="emit('closeFilter')">
    <template #cell-diagnosis="{ item }">
      <div v-if="item.diagnosis && item.diagnosis.content" class="violation-tags">
        <span class="violation-tag" :title="`内容命中违规词：${item.diagnosis.content}`">内容违规</span>
      </div>
      <span v-else class="diagnosis-ok">非违规</span>
    </template>
    <template #cell-preview="{ item }">
      <div>
        <span class="content-link" @click="openPreview(item, $event)" title="查看该评论在笔记中的位置">预览</span>
      </div>
    </template>
  </CrudTable>

  <div v-if="showPreview" class="audit-detailcard-readonly">
    <DetailCard :item="previewItem" :click-position="previewClickPosition" :page-mode="false"
      :disable-auto-fetch="true" :target-comment-id="previewCommentId" :highlight-words="previewHighlightWords"
      @close="closePreview" />
  </div>

  <!-- 消息提示 -->
  <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />

  <!-- 删除确认弹窗 -->
  <ConfirmDialog v-model:visible="showDeleteModal" title="确认删除"
    :message="`确定要删除评论「${selectedItem?.content || selectedItem?.id}」吗？此操作不可撤销。`" type="warning"
    confirm-text="删除" cancel-text="取消" @confirm="handleConfirmDelete" @cancel="showDeleteModal = false" />
</template>

<script setup>
import { ref } from 'vue'
import CrudTable from './components/CrudTable.vue'
import DetailCard from '@/components/DetailCard.vue'
import MessageToast from '@/components/MessageToast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { apiConfig } from '@/config/api'
import { useCommentStore } from '@/stores/comment'
import { useCommentLikeStore } from '@/stores/commentLike'
import { formatTime } from '@/utils/timeFormat'

// CrudTable 在移动端应用筛选后会抛出 close-filter，这里转发给 AdminLayout 收起筛选面板
const emit = defineEmits(['closeFilter'])

const commentStore = useCommentStore()
const commentLikeStore = useCommentLikeStore()

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const showDeleteModal = ref(false)
const selectedItem = ref(null)

const showPreview = ref(false)
const previewItem = ref(null)
const previewCommentId = ref(null)
const previewHighlightWords = ref([])
const previewClickPosition = ref({ x: 0, y: 0 })

const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

const handleToastClose = () => {
  showToast.value = false
}

const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }

  const token = localStorage.getItem('admin_token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'user_display_id', label: '小石榴号', type: 'user-link', sortable: false },
  { key: 'nickname', label: '用户昵称', sortable: false },
  { key: 'content', label: '评论内容', type: 'content', sortable: false },
  { key: 'diagnosis', label: '违规诊断', type: 'slot', sortable: false },
  { key: 'preview', label: '预览', type: 'slot', sortable: false },
  { key: 'created_at', label: '评论时间', type: 'date', sortable: true }
]

const searchFields = [
  {
    key: 'diagnosis',
    label: '违规诊断',
    type: 'select',
    placeholder: '全部',
    options: [
      { value: '', label: '全部' },
      { value: '1', label: '违规' },
      { value: '0', label: '非违规' }
    ]
  },
  { key: 'post_id', label: '笔记ID', placeholder: '搜索笔记ID' },
  { key: 'user_display_id', label: '小石榴号', placeholder: '搜索用户小石榴号' },
  { key: 'content', label: '内容', placeholder: '搜索评论内容' }
]

const customActions = [
  { key: 'approve', icon: 'passed', title: '审核通过', class: 'btn-success' },
  { key: 'reject', icon: 'unpassed', title: '审核拒绝', class: 'btn-danger' },
  { key: 'delete', icon: 'delete', title: '删除', class: 'btn-outline' }
]

const handleCustomAction = async ({ action, item }) => {
  try {
    if (action === 'approve' || action === 'reject') {
      const response = await fetch(`${apiConfig.baseURL}/admin/comments-audit/${item.id}/${action}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })
      const result = await response.json()
      if (result.code === 200) {
        showMessage(action === 'approve' ? '审核通过成功' : '审核拒绝成功')
        location.reload()
      } else {
        showMessage(result.message, 'error')
      }
    } else if (action === 'delete') {
      selectedItem.value = item
      showDeleteModal.value = true
    }
  } catch (error) {
    console.error('操作失败:', error)
    showMessage('操作失败', 'error')
  }
}

const handleConfirmDelete = async () => {
  try {
    const response = await fetch(`${apiConfig.baseURL}/admin/comments/${selectedItem.value.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    const result = await response.json()
    if (result.code === 200) {
      showMessage('删除成功')
      location.reload()
    } else {
      showMessage('删除失败: ' + result.message, 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showMessage('删除失败', 'error')
  } finally {
    showDeleteModal.value = false
    selectedItem.value = null
  }
}

// 按ID取单条评论（含用户信息）
const fetchCommentRow = async (id) => {
  const response = await fetch(`${apiConfig.baseURL}/admin/comments?id=${id}`, {
    headers: getAuthHeaders()
  })
  const result = await response.json()
  if (result.code !== 200) return null
  return result.data?.data?.[0] || null
}

const toCommentData = (row, isReply = false, parentRow = null) => ({
  id: row.id,
  user_id: row.user_display_id || row.user_id,
  user_auto_id: row.user_auto_id || row.user_id,
  username: row.nickname || '匿名用户',
  avatar: row.user_avatar || new URL('@/assets/imgs/avatar.png', import.meta.url).href,
  verified: row.verified || 0,
  content: row.content,
  time: formatTime(row.created_at),
  location: row.user_location,
  likeCount: row.like_count || 0,
  isLiked: false,
  pinned: row.is_pinned == 1,
  status: row.status,
  parent_id: row.parent_id,
  replyTo: isReply ? (parentRow?.nickname || '未知用户') : undefined,
  replies: [],
  reply_count: isReply ? 0 : 1,
  isReply
})

// 打开预览：待审评论不在前台评论接口的可见范围内，需先注入评论数据再渲染
const openPreview = async (item, event) => {
  try {
    if (!item.post_id) {
      showMessage('该评论所属笔记不存在', 'error')
      return
    }

    previewClickPosition.value = {
      x: event?.clientX || 0,
      y: event?.clientY || 0
    }

    const postResponse = await fetch(`${apiConfig.baseURL}/admin/posts/${item.post_id}`, {
      headers: getAuthHeaders()
    })
    const postResult = await postResponse.json()
    if (postResult.code !== 200) {
      showMessage('获取笔记详情失败: ' + postResult.message, 'error')
      return
    }

    const post = postResult.data

    // 使目标评论渲染在其父评论之下
    let rootRow = null
    let parentRow = null
    if (item.parent_id) {
      parentRow = await fetchCommentRow(item.parent_id)
      rootRow = parentRow
      let guard = 0
      while (rootRow && rootRow.parent_id && guard < 5) {
        const upperRow = await fetchCommentRow(rootRow.parent_id)
        if (!upperRow) break
        rootRow = upperRow
        guard++
      }
    }

    const injectedComments = rootRow
      ? [{ ...toCommentData(rootRow), replies: [toCommentData(item, true, parentRow)] }]
      : [toCommentData(item)]

    commentStore.updateComments(post.id, {
      comments: injectedComments,
      loading: false,
      loaded: true,
      total: post.comment_count || 0,
      hasMore: false,
      currentPage: 1
    })
    commentLikeStore.initCommentsLikeStates(injectedComments)

    previewItem.value = post
    previewCommentId.value = item.id
    previewHighlightWords.value = item.diagnosis?.words || []
    showPreview.value = true
  } catch (error) {
    console.error('获取评论预览失败:', error)
    showMessage('获取评论预览失败', 'error')
  }
}

const closePreview = () => {
  showPreview.value = false
  previewItem.value = null
  previewCommentId.value = null
  previewHighlightWords.value = []
}
</script>

<style scoped>
.violation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.violation-tag {
  padding: 2px 8px;
  font-size: 12px;
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.12);
  border-radius: 999px;
  cursor: default;
}

.diagnosis-ok {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  color: #52c41a;
  background-color: rgba(82, 196, 26, 0.12);
  border-radius: 999px;
  cursor: default;
}

/* 审核预览：只读模式（不改DetailCard源码，直接在此处禁用交互） */
.audit-detailcard-readonly :deep(.footer-actions) {
  display: none;
}

.audit-detailcard-readonly :deep(.author-avatar),
.audit-detailcard-readonly :deep(.author-name),
.audit-detailcard-readonly :deep(.user-hover-card-trigger),
.audit-detailcard-readonly :deep(.comment-avatar),
.audit-detailcard-readonly :deep(.comment-username),
.audit-detailcard-readonly :deep(.reply-username) {
  pointer-events: none;
}

.audit-detailcard-readonly :deep(button),
.audit-detailcard-readonly :deep(input),
.audit-detailcard-readonly :deep(textarea),
.audit-detailcard-readonly :deep(.follow-btn),
.audit-detailcard-readonly :deep(.follow-button),
.audit-detailcard-readonly :deep(.like-button),
.audit-detailcard-readonly :deep(.collect-button),
.audit-detailcard-readonly :deep(.comment-reply),
.audit-detailcard-readonly :deep(.reply-reply),
.audit-detailcard-readonly :deep(.comment-delete-btn),
.audit-detailcard-readonly :deep(.toggle-replies-btn),
.audit-detailcard-readonly :deep(.sort-menu),
.audit-detailcard-readonly :deep(.sort-option),
.audit-detailcard-readonly :deep(.comment-replay-icon),
.audit-detailcard-readonly :deep(.reply-replay-icon) {
  pointer-events: none;
}

.audit-detailcard-readonly :deep(.close-btn) {
  pointer-events: auto;
}

.audit-detailcard-readonly :deep(.nav-btn),
.audit-detailcard-readonly :deep(.mobile-nav-btn),
.audit-detailcard-readonly :deep(.slider-image),
.audit-detailcard-readonly :deep(.mobile-slider-image),
.audit-detailcard-readonly :deep(.image-zoomable),
.audit-detailcard-readonly :deep(video) {
  pointer-events: auto;
}
</style>
