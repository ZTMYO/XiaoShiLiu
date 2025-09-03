<template>
  <div v-if="visible" class="modal-overlay" v-click-outside.mousedown="closeModal" v-escape-key="closeModal">
    <div class="modal" @mousedown.stop>
      <div class="modal-header">
        <h4>个性标签</h4>
        <button @click="closeModal" class="close-btn">
          <SvgIcon name="close" />
        </button>
      </div>
      <div class="modal-body">
        <div class="tags-grid">
          <div class="tag-item">
            <div class="tag-label">性别</div>
            <div class="tag-value" :class="{ empty: !personalityTags?.gender }">{{ personalityTags?.gender || '未设置' }}
            </div>
          </div>
          <div class="tag-item">
            <div class="tag-label">星座</div>
            <div class="tag-value" :class="{ empty: !personalityTags?.zodiac_sign }">{{ personalityTags?.zodiac_sign ||
              '未设置' }}</div>
          </div>
          <div class="tag-item">
            <div class="tag-label">MBTI</div>
            <div class="tag-value" :class="{ empty: !personalityTags?.mbti }">{{ personalityTags?.mbti || '未设置' }}</div>
          </div>
          <div class="tag-item">
            <div class="tag-label">学历</div>
            <div class="tag-value" :class="{ empty: !personalityTags?.education }">{{ personalityTags?.education ||
              '未设置' }}</div>
          </div>
          <div class="tag-item">
            <div class="tag-label">专业</div>
            <div class="tag-value" :class="{ empty: !personalityTags?.major }">{{ personalityTags?.major || '未设置' }}
            </div>
          </div>
          <div class="tag-item">
            <div class="tag-label">兴趣爱好</div>
            <div class="tag-value" v-if="personalityTags?.interests && personalityTags.interests.length > 0">
              <div class="interests-list">
                <span v-for="interest in personalityTags.interests" :key="interest" class="interest-tag">
                  {{ interest }}
                </span>
              </div>
            </div>
            <div class="tag-value empty" v-else>未设置</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'close'])

const closeModal = () => {
  emit('update:visible', false)
  emit('close')
}

// 从userData中获取personalityTags数据
const personalityTags = computed(() => {
  return props.userData?.personalityTags || null
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-color-primary);
  border-radius: 4px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 0 2px 10px var(--shadow-color);
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

.close-btn svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 16px;
  max-height: calc(70vh - 80px);
  overflow-y: auto;
}

.tags-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tag-item {
  padding: 8px;
  border: 1px solid var(--border-color-primary);
  border-radius: 3px;
  background: transparent;
}

.tag-label {
  font-size: 11px;
  color: var(--text-color-secondary);
  margin-bottom: 2px;
  display: block;
}

.tag-value {
  font-size: 13px;
  color: var(--text-color-primary);
  word-break: break-word;
}

.interests-container {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}

.interest-tag {
  background: transparent;
  color: var(--text-color-primary);
  padding: 1px 6px;
  border: 1px solid var(--border-color-secondary);
  margin: 2px;
  border-radius: 12px;
  font-size: 11px;
}

@media (max-width: 768px) {
  .modal {
    width: 95%;
    margin: 10px;
  }

  .tags-grid {
    grid-template-columns: 1fr;
  }
}
</style>