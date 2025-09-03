<script setup>
import WaterfallFlow from '@/components/WaterfallFlow.vue'
import FloatingBtn from './FloatingBtn.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    category: {
        type: String,
        default: 'general'
    }
})

const refreshKey = ref(0)

function handleReload() {
    // 通知父组件显示加载动画
    window.dispatchEvent(new CustomEvent('floating-btn-reload-request'))
}

function handleFloatingBtnReload() {
    // 刷新按钮触发时更新内容
    refreshKey.value++
}

onMounted(() => {
    // 只监听刷新按钮事件
    window.addEventListener('floating-btn-reload', handleFloatingBtnReload)
})

onUnmounted(() => {
    window.removeEventListener('floating-btn-reload', handleFloatingBtnReload)
})
</script>

<template>
    <div class="explore-page">
        <WaterfallFlow :refresh-key="refreshKey" :category="category" />
        <FloatingBtn @reload="handleReload" />
    </div>
</template>

<style scoped>
.explore-page {
    position: relative;
    width: 100%;
    height: 100%;
}
</style>