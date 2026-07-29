<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCategories } from '@/api/categories'
import ExplorePageTemplate from './components/ExplorePageTemplate.vue'

const route = useRoute()
const categories = ref([])

// 根据路由参数或路由名称获取频道类型
const channelType = computed(() => {
    if (route.params.channel) {
        return route.params.channel
    }
    return route.name || 'recommend'
})

// 动态生成频道配置映射
const channelConfig = computed(() => {
    const config = {
        'recommend': { category: 'recommend', title: '推荐' },
        'following': { category: 'following', title: '关注' }
    }
    
    categories.value.forEach(category => {
        // 使用英文标题作为路由参数的key
        config[category.category_title] = {
            category: category.id, // 使用分类ID
            title: category.name
        }
        // 为了兼容性，也保留分类ID作为key的映射
        config[category.id] = {
            category: category.id,
            title: category.name
        }
    })
    
    return config
})

// 获取当前频道配置
const currentChannel = computed(() => {
    return channelConfig.value[channelType.value] || channelConfig.value['recommend']
})

// 加载分类列表
const loadCategories = async () => {
    try {
        const response = await getCategories()
        if (response.success !== false && response.data) {
            categories.value = response.data
        }
    } catch (error) {
        console.error('加载分类失败:', error)
    }
}

onMounted(() => {
    loadCategories()
})
</script>

<template>
    <ExplorePageTemplate :category="currentChannel.category" />
</template>
