<template>
  <div v-if="verified === 1" class="verified-badge verified-badge--official" :class="sizeClass">
    <SvgIcon name="overified" />
    <div class="tooltip">{{ badgeTitle }}</div>
  </div>
  <div v-else-if="verified === 2" class="verified-badge" :class="sizeClass">
    <SvgIcon name="pverified" />
    <div class="tooltip">{{ badgeTitle }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'

const props = defineProps({
  verified: {
    type: [Number, String],
    default: 0
  },
  title: {
    type: String,
    default: '官方认证账号'
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['mini', 'small', 'medium', 'large'].includes(value)
  }
})

const sizeClass = computed(() => {
  return `verified-badge--${props.size}`
})

const badgeTitle = computed(() => {
  if (props.verified === 1) {
    return '官方认证账号'
  } else if (props.verified === 2) {
    return '个人认证账号'
  }
  return props.title
})
</script>

<style scoped>
.verified-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  border-radius: 50%;
  margin-left: 4px;
  flex-shrink: 0;
  cursor: pointer;
  color: #fff;
  padding: 2px;
}

.verified-badge svg {
  width: 100% !important;
  height: 100% !important;
  max-width: 100%;
  max-height: 100%;
}

.verified-badge--mini {
  width: 7px;
  height: 7px;
  margin-left: 0px;
}

.verified-badge--small {
  width: 10px;
  height: 10px;
  margin-left: 0px;
}

.verified-badge--medium {
  width: 13px;
  height: 13px;
  margin-left: 0px;
}

.verified-badge--large {
  width: 16px;
  height: 16px;
}

.verified-badge--official {
  background-image: linear-gradient(90deg,
      transparent 0%,
      transparent 40%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 60%,
      transparent 100%);
  background-size: 200% 100%;
  background-repeat: no-repeat;
  animation: reflect 3s ease-in-out infinite;
  animation-delay: 1s;
}

@keyframes reflect {
  0% {
    background-position: -200% center;
  }

  50% {
    background-position: 200% center;
  }

  100% {
    background-position: 200% center;
  }
}

.verified-badge--personal {
  background-color: var(--secondary-color);
}

.verified-badge .tooltip {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 8px;
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
  z-index: 200;
  pointer-events: none;
}

@media (max-width: 768px) {
  .verified-badge .tooltip {
    display: none;
  }
}

.verified-badge:hover .tooltip {
  opacity: 1;
  visibility: visible;
}
</style>