<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ExplorePageTemplate from './components/ExplorePageTemplate.vue'

const route = useRoute()
// 根据路由参数或路由名称获取频道类型
const channelType = computed(() => {
    if (route.params.channel) {
        return route.params.channel
    }
    return route.name || 'recommend'
})

// 频道配置映射
const channelConfig = {
    'recommend': { category: 'recommend', title: '推荐' },
    'study': { category: 'study', title: '学习' },
    'campus': { category: 'campus', title: '校园' },
    'emotion': { category: 'emotion', title: '情感' },
    'interest': { category: 'interest', title: '兴趣' },
    'life': { category: 'life', title: '生活' },
    'social': { category: 'social', title: '社交' },
    'help': { category: 'help', title: '帮助' },
    'opinion': { category: 'opinion', title: '观点' },
    'graduation': { category: 'graduation', title: '毕业' },
    'career': { category: 'career', title: '职场' }
}

// 获取当前频道配置
const currentChannel = computed(() => {
    return channelConfig[channelType.value] || channelConfig['recommend']
})
</script>

<template>
    <ExplorePageTemplate :category="currentChannel.category" />
</template>
