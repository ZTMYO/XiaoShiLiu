<template>
  <span v-html="parsedText" @click="handleMentionClick"></span>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { parseMentions } from '@/utils/mentionParser'

const props = defineProps({
  text: {
    type: String,
    default: ''
  }
})


// 解析文本中的mention标记
const parsedText = computed(() => {
  return parseMentions(props.text)
})

// 处理mention链接点击事件
const handleMentionClick = (event) => {
  const target = event.target
  
  // 检查点击的是否是mention链接
  if (target.classList.contains('mention-link')) {
    event.preventDefault()
    const userId = target.getAttribute('data-user-id')
    
    if (userId) {
      // 在新标签页中打开用户主页
      const userUrl = `${window.location.origin}/user/${userId}`
      window.open(userUrl, '_blank')
    }
  }
}
</script>

<style scoped>
:deep(.mention-link) {
  color: var(--text-color-tag);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  background: none;
  border: none;
  padding: 0;
}

:deep(.mention-link:hover) {
  color: var(--text-color-tag);
  opacity: 0.8;
}

:deep(.mention-link:active) {
  color: var(--text-color-tag);
  opacity: 0.6;
}
:deep(.mention-link:focus) {
  outline: none;
  box-shadow: none;
  border: none;
}
</style>