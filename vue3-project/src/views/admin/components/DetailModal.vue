<template>
  <div v-if="visible" class="modal-overlay" v-click-outside.mousedown="closeModal" v-escape-key="closeModal">
    <div class="modal detail-modal" @mousedown.stop>
      <div class="modal-header">
        <h4>{{ title }}</h4>
        <button @click="closeModal" class="close-btn">
          <SvgIcon name="close" />
        </button>
      </div>
      <div class="modal-body">
        <div class="detail-content">
          <pre><MentionText :text="content" /></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SvgIcon from '@/components/SvgIcon.vue'
import MentionText from '@/components/mention/MentionText.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '详细内容'
  },
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'close'])

const closeModal = () => {
  emit('update:visible', false)
  emit('close')
}




</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-color-primary);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-modal {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 10px 0px 30px;
}

.modal-header h4 {
  margin: 0;
  color: var(--text-color-primary);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--text-color-secondary);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-color-primary);
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 20px;
}

.detail-content {
  max-height: 400px;
  overflow-y: auto;
}

.detail-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 8px;
  border-radius: 2px;
  border: 1px solid var(--border-color-primary);

  font-size: 16px;
  line-height: 1.6;
  color: var(--text-color-primary);
}
</style>