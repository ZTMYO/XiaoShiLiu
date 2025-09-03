<template>
  <div v-if="visible" class="confirm-dialog-overlay" v-click-outside="handleCancel" v-escape-key="handleCancel">
    <div class="confirm-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="close-btn" @click="handleCancel">
          <SvgIcon name="close" width="20" height="20" />
        </button>
      </div>

      <div class="dialog-content">
        <p class="dialog-message">{{ message }}</p>
      </div>

      <div class="dialog-actions">
        <div class="form-actions">
          <button v-if="showCancel" class="btn btn-outline" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button class="btn btn-primary" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useScrollLock } from '@/composables/useScrollLock'

const { lock, unlock } = useScrollLock()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'warning', // warning, error, info
    validator: (value) => ['warning', 'error', 'info'].includes(value)
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  showCancel: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:visible'])


const handleConfirm = () => {
  unlock()
  emit('confirm')
  emit('update:visible', false)
}

const handleCancel = () => {
  unlock()
  emit('cancel')
  emit('update:visible', false)
}

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    lock()
  } else {
    unlock()
  }
})
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.21);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: var(--bg-color-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid var(--border-color-primary);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color-primary);
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-color-primary);
}

.dialog-content {
  padding: 24px;
}

.dialog-message {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-color-primary);
}

.dialog-actions {
  padding: 16px 24px 24px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
  text-decoration: none;
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

.btn-outline:hover:not(:disabled) {
  background-color: var(--bg-color-secondary);
}
</style>