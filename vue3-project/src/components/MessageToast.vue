<template>
  <Teleport to="body">
    <Transition name="toast" appear>
      <div v-if="visible" class="message-toast">
        <div class="toast-content">
          {{ message }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 2000
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)

onMounted(() => {
  visible.value = true

  setTimeout(() => {
    visible.value = false
    setTimeout(() => {
      emit('close')
    }, 300) // 等待动画完成
  }, props.duration)
})
</script>

<style scoped>
.message-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  pointer-events: none;
}

.toast-content {
  padding: 12px 24px;
  background: var(--bg-color-inverse);
  color: var(--text-color-inverse);
  border-radius: 999px;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
}


.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}


@media (max-width: 480px) {
  .toast-content {
    padding: 10px 20px;
    font-size: 13px;
  }
}
</style>