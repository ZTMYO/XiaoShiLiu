<script setup>
import SvgIcon from '@/components/SvgIcon.vue';
import { ref } from 'vue';
import { useScroll } from '@vueuse/core';

const emit = defineEmits(['reload'])

const { y: scrollY } = useScroll(window);
const isReloading = ref(false);

function goTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function reload() {
    isReloading.value = true;
    emit('reload')
    setTimeout(() => {
        isReloading.value = false;
    }, 1000);
    goTop();
}
</script>

<template>
    <div class="floating-btn-sets">
        <div id="button-1" class="btn-wrapper" :class="{ hidden: (scrollY < 260) }">
            <div class="btn" @click="goTop">
                <SvgIcon name="arrowTop" class="btn-icon" height="20" width="20" />
            </div>
            <div class="tooltip">回到顶部</div>
        </div>
        <div id="button-2" class="btn-wrapper">
            <div class="btn" @click="reload">
                <SvgIcon name="reload" class="btn-icon" height="20" width="20" />
            </div>
            <div class="tooltip">刷新</div>
        </div>
    </div>
</template>

<style scoped>
.floating-btn-sets {
    position: fixed;
    bottom: 60px;
    right: 12px;
    z-index: 999;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.btn-wrapper {
    position: relative;
    display: inline-block;
}

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

.btn-icon {
    color: var(--text-color-secondary);
}

.btn:hover {
    background-color: var(--bg-color-secondary);
}

.btn:hover .btn-icon {
    color: var(--text-color-primary);
}

/* Tooltip 样式 */
.tooltip {
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



.btn-wrapper:hover .tooltip {
    opacity: 1;
    visibility: visible;
}

.hidden {
    display: none;
}

.unshow {
    pointer-events: none;
    visibility: hidden;
}
</style>