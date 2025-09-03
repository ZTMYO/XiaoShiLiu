<script setup>
import SvgIcon from '@/components/SvgIcon.vue';
import { computed } from 'vue';

// 接收动画持续时间参数，默认1.5秒
const props = defineProps({
    duration: {
        type: Number,
        default: 1.5 // 默认1.5秒
    }
});

// 计算动画持续时间的CSS变量
const animationStyle = computed(() => ({
    '--animation-duration': `${props.duration}s`
}));
</script>

<template>
    <div class="loading-spinner" :style="animationStyle">
        <SvgIcon name="loading" class="spinner-icon" width="28" height="28" />
    </div>
</template>

<style scoped>
.loading-spinner {
    padding: 5px 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: slideDown 1.5s ease-in-out;
    width: 100%;
    overflow-x: hidden;
    position: relative;
    top: 18px;
    z-index: 101;
    box-sizing: border-box;
}

.spinner-icon {
    color: var(--text-color-primary);
    animation: spinThreeStage 1.5s ease-in-out;
}

@keyframes slideDown {
    0% {
        transform: scale(0.7) translateY(-50%);
        opacity: 0.7;
    }

    33.33% {
        transform: scale(1) translateY(0);
        opacity: 1;
    }

    66.66% {
        transform: scale(1) translateY(0);
        opacity: 1;
    }

    100% {
        transform: scale(0.7) translateY(-50%);
        opacity: 0.7;
    }
}

@keyframes spinThreeStage {
    0% {
        transform: rotate(0deg);
    }

    33.33% {
        transform: rotate(360deg);
    }

    66.66% {
        transform: rotate(720deg);
    }

    100% {
        transform: rotate(1080deg);
    }
}
</style>