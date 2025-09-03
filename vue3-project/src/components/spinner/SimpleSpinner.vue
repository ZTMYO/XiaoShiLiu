<script setup>
import SvgIcon from '@/components/SvgIcon.vue';

const props = defineProps({
    size: {
        type: String,
        default: '20'
    },
    color: {
        type: String,
        default: 'var(--text-color-secondary)'
    }
})
</script>

<template>
    <div class="simple-spinner">
        <SvgIcon name="loading" class="simple-spinner-icon" :width="props.size" :height="props.size"
            :style="{ color: props.color }" />
    </div>
</template>

<style scoped>
.simple-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
}

.simple-spinner-icon {
    animation: simpleRotate 1s linear infinite;
}

@keyframes simpleRotate {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>