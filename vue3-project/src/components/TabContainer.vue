<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    tabs: {
        type: Array,
        required: true,
        default: () => []
    },
    activeTab: {
        type: [String, Number],
        default: ''
    },
    enableDrag: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['tab-change'])

const containerRef = ref(null)
const tabItems = ref([])
const activeId = ref(props.activeTab || (props.tabs.length > 0 ? props.tabs[0].id : ''))
const sliderLeft = ref(0)
const sliderWidth = ref(0)

function tabSelected(item) {
    // 如果点击的是当前已激活的tab，不执行任何操作
    if (activeId.value === item.id) return

    activeId.value = item.id
    emit('tab-change', item)
    updateSlider()
}

// 更新滑块位置和宽度
const updateSlider = () => {
    nextTick(() => {
        const activeIndex = props.tabs.findIndex(tab => tab.id === activeId.value)
        if (activeIndex === -1 || !tabItems.value[activeIndex]) return

        const tabRect = tabItems.value[activeIndex].getBoundingClientRect()
        const containerRect = containerRef.value.getBoundingClientRect()

        if (containerRect.width === 0 || tabRect.width === 0) {
            setTimeout(updateSlider, 50)
            return
        }

        // 计算滑块相对于容器的位置
        sliderLeft.value = tabRect.left - containerRect.left + containerRef.value.scrollLeft
        sliderWidth.value = tabRect.width
    })
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
watch(() => props.activeTab, (newVal) => {
    activeId.value = newVal
    updateSlider()
})

// 监听容器可见性变化
let visibilityObserver = null

// 组件挂载和卸载
onMounted(() => {
    // 初始化滑块位置
    nextTick(updateSlider)
    // 监听窗口大小变化，重新计算滑块位置
    window.addEventListener('resize', updateSlider)
    // 监听容器滚动事件，实时更新滑块位置
    if (containerRef.value) {
        containerRef.value.addEventListener('scroll', updateSlider)
        visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 容器变为可见时，更新滑块位置
                    nextTick(updateSlider)
                }
            })
        })

        visibilityObserver.observe(containerRef.value)
    }
})

onUnmounted(() => {
    window.removeEventListener('resize', updateSlider)
    if (containerRef.value) {
        containerRef.value.removeEventListener('scroll', updateSlider)
    }
    if (visibilityObserver) {
        visibilityObserver.disconnect()
    }
})
</script>

<template>
    <div class="tab-container" ref="containerRef" @mousedown="onMouseDown" @mouseleave="onMouseLeave"
        @mouseup="onMouseUp" @mousemove="onMouseMove">
        <div v-for="(item, index) in tabs" :key="item.id" :id="item.id" :class="{ active: activeId === item.id }"
            class="tab-item" @click="tabSelected(item)" ref="tabItems">
            {{ item.label }}
        </div>
        <div class="tab-slider" :style="{
            left: sliderLeft + 'px',
            width: sliderWidth + 'px'
        }"></div>
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
    padding: 0 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    position: relative;
    z-index: 2;
}

.tab-item:hover {
    background: var(--bg-color-secondary);
    color: var(--text-color-primary);
}

/* 移动端禁用 hover 效果，避免点击后样式残留 */
@media (hover: none) {
    .tab-item:hover {
        background: transparent;
        color: var(--text-color-secondary);
    }

    .tab-item.active:hover {
        color: var(--text-color-primary);
    }
}

.tab-item.active {
    color: var(--text-color-primary);
    font-weight: bold;
    background: transparent;
    transition: color 0.2s ease;
}

/* 滑块指示器 */
.tab-slider {
    position: absolute;
    height: 40px;
    border-radius: 20px;
    background: var(--bg-color-secondary);
    transition: left 0.25s ease-out,
        width 0.25s ease-out,
        background-color 0.2s ease;
    z-index: 1;
    bottom: 22.5px;
}
</style>