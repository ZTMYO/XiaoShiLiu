<template>
  <div v-if="visible" class="modal-overlay" v-click-outside.mousedown="close" v-escape-key="close">
    <div class="modal" @mousedown.stop>
      <div class="modal-header">
        <h4>{{ title }}</h4>
        <button @click="close" class="close-btn">
          <SvgIcon name="close" width="20" height="20" color="#000" />
        </button>
      </div>
      <div class="modal-body">
        <div v-if="tags && tags.length > 0" class="tags-container">
          <div v-for="tag in tags" :key="tag.id" class="tag-item">
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-id">ID: {{ tag.id }}</span>
          </div>
        </div>
        <div v-else class="no-tags">
          <SvgIcon name="tag" />
          <p>该笔记暂无标签</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SvgIcon from '@/components/SvgIcon.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '笔记标签'
  },
  tags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'update:visible'])

const close = () => {
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
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
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
  max-height: 400px;
  overflow-y: auto;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 14px;
  color: var(--text-color-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color-secondary);
  transition: transform 0.2s;
}

.tag-item:hover {
  transform: translateY(-2px);
  border: 1px solid var(--primary-color);
}

.tag-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.tag-id {
  font-size: 12px;
  opacity: 0.8;
}

.no-tags {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-color-tertiary);
}

.no-tags svg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-tags p {
  margin: 0;
  font-size: 16px;
}
</style>