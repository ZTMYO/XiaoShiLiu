<template>
  <CrudTable ref="tableRef" title="举报管理" entity-name="举报" api-endpoint="/admin/reports"
    :columns="columns" :form-fields="[]" :search-fields="searchFields" :custom-actions="customActions"
    :default-search-params="{ status: '0' }" :show-create-button="false" @custom-action="handleCustomAction" @close-filter="emit('closeFilter')">
    <template #cell-target_id="{ item }">
      <span class="target-link" :class="item.target_type === 1 ? 'post-link' : 'comment-link'"
        @click="jumpToTarget(item)" :title="item.target_type === 1 ? '查看笔记详情' : '定位到评论位置'">
        {{ item.target_id }}
      </span>
    </template>
  </CrudTable>

  <!-- 处理举报弹窗 -->
  <div v-if="showProcessModal" class="process-overlay" @click.self="closeProcessModal">
    <div class="process-modal">
      <div class="process-header">
        <h3 class="process-title">{{ processTitle }}</h3>
        <button class="process-close" aria-label="关闭" @click="closeProcessModal">
          <SvgIcon name="close" width="20" height="20" />
        </button>
      </div>
      <div class="process-body">
        <p class="process-message">{{ processMessage }}</p>
        <textarea v-model="processNote" class="process-note" maxlength="255" rows="3"
          placeholder="处理备注（选填）"></textarea>
        <span class="process-count">{{ processNote.length }}/255</span>
      </div>
      <div class="process-actions">
        <button class="btn btn-outline" @click="closeProcessModal">取消</button>
        <button class="btn" :class="pendingVerdict === 'violation' ? 'btn-danger' : 'btn-success'"
          :disabled="processing" @click="handleConfirmProcess">
          {{ processing ? '处理中...' : confirmText }}
        </button>
      </div>
    </div>
  </div>

  <!-- 消息提示 -->
  <MessageToast v-if="showToast" :message="toastMessage" :type="toastType" @close="handleToastClose" />
</template>

<script setup>
import { ref, computed } from 'vue'
import CrudTable from './components/CrudTable.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import MessageToast from '@/components/MessageToast.vue'
import { adminApi } from '@/api'

const tableRef = ref(null)
const emit = defineEmits(['closeFilter', 'report-processed'])

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const showProcessModal = ref(false)
const pendingProcess = ref(null)
const pendingVerdict = ref('')
const processNote = ref('')
const processing = ref(false)

const showMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

const handleToastClose = () => {
  showToast.value = false
}

// 跳转到被举报的笔记页面，评论举报则定位到评论位置
const jumpToTarget = (item) => {
  const isComment = item.target_type === 2
  const url = isComment
    ? `${window.location.origin}/post?id=${item.target_post_id}&targetCommentId=${item.target_id}`
    : `${window.location.origin}/post?id=${item.target_id}`
  window.open(url, '_blank')
}

const columns = [
  { key: 'id', label: '工单ID', sortable: true },
  { key: 'reporter_display_id', label: '举报人小石榴号', type: 'user-link', sortable: false },
  { key: 'reporter_nickname', label: '举报人昵称', sortable: false },
  { key: 'target_type', label: '目标类型', type: 'mapped', map: { 1: '笔记', 2: '评论' }, sortable: false },
  { key: 'target_id', label: '目标ID', type: 'slot', sortable: false },
  { key: 'target_summary', label: '内容', type: 'content', sortable: false },
  { key: 'reason', label: '举报原因', sortable: false },
  { key: 'detail', label: '补充说明', type: 'content', sortable: false },
  { key: 'status', label: '状态', type: 'status', statusMap: {
      0: { text: '待处理', class: 'status-pending' },
      1: { text: '违规', class: 'status-violated' },
      2: { text: '不违规', class: 'status-clean' }
    }, sortable: false },
  { key: 'created_at', label: '举报时间', type: 'date', sortable: true },
  { key: 'handle_note', label: '备注', type: 'content', sortable: false }
]

const searchFields = [
  {
    key: 'status',
    label: '处理状态',
    type: 'select',
    placeholder: '全部',
    options: [
      { value: '', label: '全部' },
      { value: '0', label: '待处理' },
      { value: '1', label: '确认违规' },
      { value: '2', label: '确认不违规' }
    ]
  },
  {
    key: 'target_type',
    label: '目标类型',
    type: 'select',
    placeholder: '全部',
    options: [
      { value: '', label: '全部' },
      { value: '1', label: '笔记' },
      { value: '2', label: '评论' }
    ]
  }
]

const customActions = [
  { key: 'violation', icon: 'unpassed', title: '确认违规(转待审)', class: 'btn-danger' },
  { key: 'clean', icon: 'passed', title: '确认不违规', class: 'btn-success' }
]

const processTitle = ref('')
const processMessage = ref('')
const confirmText = computed(() => pendingVerdict.value === 'violation' ? '确认违规' : '确认不违规')

const handleCustomAction = ({ action, item }) => {
  if (action !== 'violation' && action !== 'clean') return
  if (item.status !== 0) {
    showMessage('该工单已被处理', 'error')
    return
  }
  pendingProcess.value = item
  pendingVerdict.value = action
  processNote.value = ''
  const targetLabel = item.target_type === 1 ? '笔记' : '评论'
  if (action === 'violation') {
    processTitle.value = '确认违规'
    processMessage.value = `确认该${targetLabel}（ID: ${item.target_id}）违规？确认后目标将转入待审核队列，由审核页二次确认后下架。`
  } else {
    processTitle.value = '确认不违规'
    processMessage.value = `确认该${targetLabel}（ID: ${item.target_id}）不违规并结单？`
  }
  showProcessModal.value = true
}

const closeProcessModal = () => {
  if (processing.value) return
  showProcessModal.value = false
  pendingProcess.value = null
  pendingVerdict.value = ''
  processNote.value = ''
}

const handleConfirmProcess = async () => {
  processing.value = true
  try {
    const res = await adminApi.processReport(pendingProcess.value.id, {
      verdict: pendingVerdict.value,
      note: processNote.value
    })
    if (res.success) {
      showMessage(res.message || (pendingVerdict.value === 'violation' ? '已确认违规' : '已确认不违规'))
      processing.value = false
      closeProcessModal()
      tableRef.value?.refreshData?.()
      emit('report-processed')
    } else {
      showMessage(res.message || '操作失败', 'error')
    }
  } catch (error) {
    console.error('处理举报失败:', error)
    showMessage('操作失败，请稍后重试', 'error')
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
/* 状态颜色 */
:deep(.status-pending) {
  color: #f39c12;
}

:deep(.status-violated) {
  color: #e74c3c;
}

:deep(.status-clean) {
  color: #4caf50;
}

.process-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.process-modal {
  background: var(--bg-color-primary);
  border-radius: 12px;
  width: 420px;
  max-width: 92vw;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid var(--border-color-primary);
  display: flex;
  flex-direction: column;
}

.process-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-primary);
}

.process-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.process-close {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.process-close:hover {
  color: var(--text-color-primary);
}

.process-body {
  padding: 16px 20px;
  overflow-y: auto;
}

.process-message {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color-primary);
}

.process-note {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--border-color-primary);
  border-radius: 6px;
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
}

.process-note:focus {
  border-color: var(--primary-color);
}

.process-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 4px;
}

.process-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px 16px;
  border-top: 1px solid var(--border-color-primary);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color-primary);
}

.btn-outline:hover {
  background-color: var(--bg-color-secondary);
}

.btn-danger {
  background-color: var(--danger-color, #e74c3c);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--danger-color-dark, #c0392b);
}

.btn-success {
  background-color: #52c41a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #389e0d;
}
</style>