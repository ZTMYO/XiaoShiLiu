import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '@/router'
import { useEventStore } from './event'

export const useNavigationStore = defineStore('navigation', () => {
  // 当前路由信息
  const currentRoute = ref(null)

  // 滚动到顶部的通用函数
  const scrollToTop = (behavior = 'smooth') => {
    window.scrollTo({ top: 0, behavior })
  }

  // 发现页面刷新事件
  const triggerExploreRefresh = () => {
    const eventStore = useEventStore()
    eventStore.triggerFloatingBtnReloadRequest()
  }

  // 统一的发现按钮点击处理
  const handleExploreClick = (event, currentPath) => {
    if (event) {
      event.preventDefault()
    }

    // 如果当前已经在发现页面，触发刷新并滚动到顶部
    if (currentPath && currentPath.startsWith('/explore')) {
      scrollToTop()
      triggerExploreRefresh()
    } else {
      // 如果不在发现页面，正常跳转并滚动到顶部
      router.push('/explore').then(() => {
        scrollToTop()
      })
    }
  }

  // 导航到指定路径并滚动到顶部
  const navigateAndScrollToTop = (path, behavior = 'smooth') => {
    router.push(path).then(() => {
      scrollToTop(behavior)
    })
  }

  // 设置当前路由
  const setCurrentRoute = (route) => {
    currentRoute.value = route
  }

  return {
    currentRoute,
    scrollToTop,
    triggerExploreRefresh,
    handleExploreClick,
    navigateAndScrollToTop,
    setCurrentRoute
  }
})