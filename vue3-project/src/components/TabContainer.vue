<script setup>
import { ref } from 'vue'

const props = defineProps({
    tabs: {
        type: Array,
        required: true,
        default: () => []
    },
    activeTab: {
        type: String,
        default: ''
    },
    enableDrag: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['tab-change'])

const containerRef = ref(null)
const activeId = ref(props.activeTab || (props.tabs.length > 0 ? props.tabs[0].id : ''))

function tabSelected(item) {
    activeId.value = item.id
    emit('tab-change', item)
}

// 拖拽滑动逻辑（仅在enableDrag为true时启用）
let isDown = false
let startX = 0
let scrollLeft = 0

function onMouseDown(e) {
    if (!props.enableDrag) return
    isDown = true
    startX = e.pageX - containerRef.value.offsetLeft
    scrollLeft = containerRef.value.scrollLeft
    containerRef.value.classList.add('dragging')
}

function onMouseLeave() {
    if (!props.enableDrag) return
    isDown = false
    containerRef.value.classList.remove('dragging')
}

function onMouseUp() {
    if (!props.enableDrag) return
    isDown = false
    containerRef.value.classList.remove('dragging')
}

function onMouseMove(e) {
    if (!props.enableDrag || !isDown) return
    e.preventDefault()
    const x = e.pageX - containerRef.value.offsetLeft
    const walk = x - startX
    containerRef.value.scrollLeft = scrollLeft - walk
}

// 监听activeTab prop变化
import { watch } from 'vue'
watch(() => props.activeTab, (newVal) => {
    // 移除条件判断，允许空字符串也能更新activeId
    activeId.value = newVal
})
</script>

<template>
    <div class="tab-container" ref="containerRef" @mousedown="onMouseDown" @mouseleave="onMouseLeave"
        @mouseup="onMouseUp" @mousemove="onMouseMove">
        <div v-for="item in tabs" :key="item.id" :id="item.id" :class="{ active: activeId === item.id }"
            class="tab-item" @click="tabSelected(item)">
            {{ item.label }}
        </div>
    </div>
</template>

<style scoped>
.tab-container {
    position: relative;
    height: 85px;
    background: var(--bg-color-primary);
    display: flex;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    padding: 0px 12px;
    box-sizing: border-box;
    width: 100%;
    max-width: 100vw;
    margin-left: 12px;
    transition: background-color 0.2s ease;

}

.tab-container::-webkit-scrollbar {
    display: none;
}

.tab-container.dragging {
    cursor: grabbing;
}

.tab-item {
    width: 64px;
    height: 40px;
    font-size: 16px;
    color: var(--text-color-secondary);
    cursor: pointer;
    background: transparent;
    border-radius: 999px;
    text-align: center;
    line-height: 40px;
    display: inline-block;
    flex-shrink: 0;
    user-select: none;
    min-width: 64px;
}

.tab-item:hover {
    background: var(--bg-color-secondary);
    color: var(--text-color-primary);
}

.tab-item.active {
    color: var(--text-color-primary);
    font-weight: bold;
    background: var(--bg-color-secondary);
    transition: background-color 0.2s ease;
}
</style>