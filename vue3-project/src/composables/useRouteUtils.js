import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'

/**
 * 通用的路由组合式函数
 * 提供路由相关的常用功能
 */
export function useRouteUtils() {
  const route = useRoute()
  const router = useRouter()
  const navigationStore = useNavigationStore()

  // 当前路径
  const currentPath = computed(() => route.path)

  // 是否在发现页面
  const isExplorePage = computed(() => route.path.startsWith('/explore'))

  // 是否在特定路径
  const isCurrentPath = (path) => computed(() => route.path === path)

  // 导航到指定路径
  const navigateTo = (path, scrollToTop = true) => {
    if (scrollToTop) {
      navigationStore.navigateAndScrollToTop(path)
    } else {
      router.push(path)
    }
  }

  // 发现按钮点击处理
  const handleExploreClick = (event) => {
    navigationStore.handleExploreClick(event, route.path)
  }

  return {
    route,
    router,
    currentPath,
    isExplorePage,
    isCurrentPath,
    navigateTo,
    handleExploreClick
  }
}