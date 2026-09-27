<template>
  <div v-if="visible" class="report-modal-overlay" @click.self="closeModal">
    <div class="report-modal" @click.stop>
      <div class="report-modal-header">
        <h3 class="report-modal-title">{{ targetTypeLabel }}举报</h3>
        <button class="close-btn" @click="closeModal" aria-label="关闭">
          <SvgIcon name="close" width="20" height="20" />
        </button>
      </div>

      <div class="report-modal-body">
        <p class="report-tip">
          请选择举报原因，我们将尽快核实处理。恶意举报将影响账号正常使用。
        </p>

        <div class="reason-group">
          <label v-for="reason in reportReasons" :key="reason" class="reason-option"
            :class="{ 'selected': selectedReason === reason }">
            <input v-model="selectedReason" type="radio" name="report-reason" :value="reason" />
            <span class="reason-text">{{ reason }}</span>
          </label>
        </div>

        <div class="detail-group">
          <label class="detail-label">补充说明（选填）</label>
          <textarea v-model="detail" class="detail-textarea" rows="4" maxlength="500"
            placeholder="请详细描述违规内容，最多500字"></textarea>
          <span class="detail-count">{{ detail.length }}/500</span>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>

      <div class="report-modal-footer">
        <button class="btn btn-outline" @click="closeModal">取消</button>
        <button class="btn btn-primary" :disabled="submitting || !selectedReason" @click="handleSubmit">
          {{ submitting ? '提交中...' : '提交举报' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { reportApi } from '@/api/index.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  targetType: {
    type: Number,
    required: true
  },
  targetId: {
    type: [Number, String],
    required: true
  },
  targetName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'success'])

const reportReasons = ['广告营销', '色情低俗', '人身攻击', '侵权盗图', '其他']
const selectedReason = ref('')
const detail = ref('')
const submitting = ref(false)
const errorMessage = ref('')

const targetTypeLabel = computed(() => (props.targetType === 1 ? '内容' : '评论'))

watch(() => props.visible, (val) => {
  if (val) {
    selectedReason.value = ''
    detail.value = ''
    errorMessage.value = ''
  }
})

const closeModal = (force = false) => {
  if (submitting.value && !force) return
  emit('close')
}

const handleSubmit = async () => {
  if (!selectedReason.value) {
    errorMessage.value = '请选择举报原因'
    return
  }
  submitting.value = true
  errorMessage.value = ''
  try {
    const res = await reportApi.submitReport({
      target_type: props.targetType,
      target_id: props.targetId,
      reason: selectedReason.value,
      detail: detail.value
    })
    if (res.success) {
      emit('success', res.data)
      closeModal(true)
    } else {
      errorMessage.value = res.message || '举报提交失败，请稍后重试'
    }
  } catch (e) {
    errorMessage.value = '举报提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.report-modal-overlay {
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

.report-modal {
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

.report-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-primary);
}

.report-modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.close-btn {
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

.close-btn:hover {
  color: var(--text-color-primary);
}

.report-modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.report-tip {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-color-secondary);
}

.reason-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.reason-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--text-color-primary);
}

.reason-option input {
  accent-color: var(--primary-color);
}

.reason-option.selected {
  border-color: var(--primary-color);
  background-color: var(--primary-color-light, rgba(64, 128, 255, 0.08));
}

.detail-group {
  margin-bottom: 8px;
}

.detail-label {
  display: block;
  font-size: 13px;
  color: var(--text-color-secondary);
  margin-bottom: 6px;
}

.detail-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
}

.detail-textarea:focus {
  border-color: var(--primary-color);
}

.detail-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-top: 4px;
}

.error-message {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--error-color, #ff4d4f);
}

.report-modal-footer {
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

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-color-dark);
}

.btn-outline {
  background-color: transparent;
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color-primary);
}

.btn-outline:hover {
  background-color: var(--bg-color-secondary);
}
</style>