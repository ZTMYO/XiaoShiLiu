<template>
  <div
    ref="overlayRef"
    class="emoji-panel-overlay"
    :class="{ 'is-pinned': pinned }"
    @mousedown.self="close"
  >
    <div ref="panelRef" class="emoji-panel" :style="panelStyle">
      <div class="ep-header">
        <span class="ep-grip" aria-hidden="true" @mousedown="startDrag"></span>
        <input
          v-model="keyword"
          class="ep-search"
          type="text"
          :placeholder="placeholder"
          spellcheck="false"
        />
        <div class="ep-header-actions">
          <button
            type="button"
            class="ep-header-btn"
            :class="{ active: pinned }"
            :title="pinned ? '取消固定' : '固定：选中后不关闭面板'"
            @mousedown.stop
            @click="pinned = !pinned"
          >
            <SvgIcon
              name="pin"
              class="ep-pin"
              :class="{ active: pinned }"
              color="currentColor"
              width="16"
              height="16"
            />
          </button>
          <button type="button" class="ep-header-btn" title="关闭" @mousedown.stop @click="close">
            <SvgIcon name="close" color="currentColor" width="16" height="16" />
          </button>
        </div>
      </div>
      <EmojiPicker
        v-model:keyword="keyword"
        @update:tab="tab = $event"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'

const emit = defineEmits(['select', 'close'])

// 拖拽时面板边缘与容器之间保留的间距
const DRAG_EDGE_GAP = 8

const overlayRef = ref(null)
const panelRef = ref(null)
const offset = ref({ x: 0, y: 0 })
// 固定状态只存在组件生命周期内，面板卸载即丢失，下次打开回到默认居中位置且未固定
const pinned = ref(false)

const keyword = ref('')
const tab = ref('emoji')
const placeholder = computed(() => {
  if (tab.value === 'kaomoji') return '搜索颜文字'
  if (tab.value === 'sticker') return '搜索表情包'
  return '搜索表情'
})

const panelStyle = computed(() => ({
  transform: `translate3d(${offset.value.x}px, ${offset.value.y}px, 0)`
}))

const drag = { active: false, startX: 0, startY: 0, originX: 0, originY: 0, limitX: 0, limitY: 0 }

const clamp = (value, limit) => Math.min(limit, Math.max(-limit, value))

const stopDrag = () => {
  drag.active = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

const onDragMove = (event) => {
  // 在窗口外松手就收不到 mouseup 了，靠按键状态兜底回收，否则监听会一直挂着
  if (!drag.active || !event.buttons) {
    stopDrag()
    return
  }
  offset.value = {
    x: clamp(drag.originX + event.clientX - drag.startX, drag.limitX),
    y: clamp(drag.originY + event.clientY - drag.startY, drag.limitY)
  }
}

// 面板默认由 flex 居中，拖动量按「相对居中位置的偏移」记录，这样关掉再开天然回到默认位置
const startDrag = (event) => {
  const panel = panelRef.value
  const overlay = overlayRef.value
  if (event.button !== 0 || !panel || !overlay) return

  const panelRect = panel.getBoundingClientRect()
  const box = overlay.getBoundingClientRect()
  // 可偏移的极限就是「居中位置到容器边缘」的距离
  drag.limitX = Math.max(0, (box.width - panelRect.width) / 2 - DRAG_EDGE_GAP)
  drag.limitY = Math.max(0, (box.height - panelRect.height) / 2 - DRAG_EDGE_GAP)

  drag.active = true
  drag.startX = event.clientX
  drag.startY = event.clientY
  drag.originX = offset.value.x
  drag.originY = offset.value.y

  // 阻止默认才不会把焦点从输入框上抢走，也不会顺带选中面板里的文字
  event.preventDefault()
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', stopDrag)
}

const close = () => emit('close')

const handleSelect = (emoji) => {
  emit('select', emoji)
  // 固定后选中表情不关闭面板，方便连续输入；是否关闭由面板统一判断，调用方不必各自处理
  if (!pinned.value) emit('close')
}

onBeforeUnmount(stopDrag)
</script>

<style scoped>
.emoji-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 各调用点的层级不同，由使用方通过该变量覆盖 */
  z-index: var(--ep-overlay-z, 2000);
  animation: fadeIn 0.2s ease;
}

/* 固定后遮罩不再拦鼠标，否则点击会夺走输入框焦点且到不了下层 */
.emoji-panel-overlay.is-pinned {
  pointer-events: none;
}

.emoji-panel-overlay.is-pinned .emoji-panel {
  pointer-events: auto;
}

.emoji-panel {
  background: var(--bg-color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: scaleIn 0.2s ease;
  max-width: 90vw;
  max-height: 90vh;
}

.ep-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px 8px 10px;
  border-bottom: 1px solid var(--border-color-secondary);
  user-select: none;
}

.ep-grip {
  flex: none;
  box-sizing: content-box;
  position: relative;
  width: 8px;
  height: 13px;
  padding: 4px 6px;
  margin: -4px -6px;
  cursor: move;
}

.ep-grip::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 6px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  color: var(--text-color-tertiary);
  background: currentColor;
  opacity: 0.55;
  box-shadow: 5px 0 0 currentColor, 0 5px 0 currentColor, 5px 5px 0 currentColor, 0 10px 0 currentColor,
    5px 10px 0 currentColor;
}

.ep-search {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 10px;
  box-sizing: border-box;
  font-size: 12px;
  color: var(--text-color-primary);
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color-primary);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s ease;
}

.ep-search:focus {
  border-color: var(--primary-color);
}

.ep-header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.ep-header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-color-tertiary);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.ep-header-btn:hover {
  color: var(--text-color-primary);
  background: var(--bg-color-secondary);
}

.ep-header-btn.active {
  color: var(--primary-color);
  background: var(--bg-color-secondary);
}

/* 未固定时图钉倾斜，固定后回正 */
.ep-pin {
  transform-box: view-box;
  transform-origin: center;
  transform: rotate(45deg);
  transition: transform 0.15s ease;
}

.ep-pin.active {
  transform: rotate(0deg);
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
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
