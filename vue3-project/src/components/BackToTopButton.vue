<template>
    <div class="btn back-to-top" v-show="scrollY > threshold" @click="goTop">
        <SvgIcon name="arrowTop" class="btn-icon" width="20" height="20" />
        <div class="tooltip">{{ tooltip }}</div>
    </div>
</template>

<script setup>
import { useScroll } from '@vueuse/core'
import SvgIcon from '@/components/SvgIcon.vue'
import { useNavigationStore } from '@/stores/navigation'

const props = defineProps({
    threshold: { type: Number, default: 200 },
    tooltip: { type: String, default: '回到顶部' }
})

const { y: scrollY } = useScroll(window)
const navigationStore = useNavigationStore()

function goTop() {
    navigationStore.scrollToTop('smooth')
}
</script>

<style scoped>
.btn {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background-color: var(--bg-color-primary);
    border: var(--border-color-primary) 1px solid;
    cursor: pointer;
}

.back-to-top {
    position: fixed;
    right: 12px;
    bottom: 60px;
    z-index: 999;
}

.btn-icon {
    color: var(--text-color-secondary);
    transition: color 0.3s ease;
}

.btn:hover {
    background-color: var(--bg-color-secondary);
    transition: all 0.2s ease;
}

.btn:hover .btn-icon {
    color: var(--text-color-primary);
}

/* Tooltip */
.back-to-top .tooltip {
    position: absolute;
    right: 50px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--bg-color-primary);
    color: var(--text-color-primary);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border-color-primary);
    z-index: 10;
    pointer-events: none;
}

@media (max-width: 768px) {
    .back-to-top .tooltip {
        display: none;
    }
}

.back-to-top:hover .tooltip {
    opacity: 1;
    visibility: visible;
}
</style>