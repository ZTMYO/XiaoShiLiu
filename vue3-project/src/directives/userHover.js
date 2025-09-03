import { createApp } from 'vue'
import UserInfoCard from '@/components/UserInfoCard.vue'
import messageManager from '@/utils/messageManager'
import router from '@/router'

// 检测是否为移动设备
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         ('ontouchstart' in window) || 
         (navigator.maxTouchPoints > 0)
}

// 用户信息卡片悬停指令
export const vUserHover = {
  mounted(el, binding) {
    // 在移动设备上禁用悬停功能
    if (isMobileDevice()) {
      return
    }

    let cardInstance = null
    let cardElement = null
    let hoverTimer = null
    let leaveTimer = null

    // 鼠标进入元素
    const handleMouseEnter = async (event) => {
      // 清除离开定时器
      if (leaveTimer) {
        clearTimeout(leaveTimer)
        leaveTimer = null
      }

      // 延迟显示卡片
      hoverTimer = setTimeout(async () => {
        try {
          // 获取用户信息
          const userInfo = await binding.value.getUserInfo()

          // 创建卡片实例
          if (!cardInstance) {
            const cardApp = createApp(UserInfoCard, {
              visible: true,
              userInfo: userInfo,
              onFollow: binding.value.onFollow || (() => { }),
              onUnfollow: binding.value.onUnfollow || (() => { }),
              onClick: () => {
                // 卡片被点击时立即隐藏
                hideCard()
              }
            })

            // 为动态创建的组件提供消息管理器和路由器
            cardApp.provide('$message', messageManager)
            cardApp.use(router)

            // 创建容器元素
            cardElement = document.createElement('div')
            document.body.appendChild(cardElement)

            // 挂载组件
            cardInstance = cardApp.mount(cardElement)
          }

          // 只在右侧显示
          const rect = el.getBoundingClientRect()
          const cardWidth = 360
          const cardHeight = 300 // 预估高度
          const gap = 12 // 与触发元素的间距
          const padding = 16 // 视窗边缘的最小距离

          let left = rect.right + gap
          let top = rect.top + rect.height / 2 - cardHeight / 2

          // 纠正上下越界
          if (top < padding) top = padding
          if (top + cardHeight > window.innerHeight - padding) {
            top = window.innerHeight - cardHeight - padding
          }


          // 设置卡片位置
          cardElement.style.position = 'fixed'
          cardElement.style.left = `${left}px`
          cardElement.style.top = `${top}px`
          cardElement.style.zIndex = '1000'

          // 添加卡片的鼠标事件
          cardElement.addEventListener('mouseenter', handleCardMouseEnter)
          cardElement.addEventListener('mouseleave', handleCardMouseLeave)

        } catch (error) {
          console.error('获取用户信息失败:', error)
        }
      }, binding.value.delay || 500)
    }

    // 鼠标离开元素
    const handleMouseLeave = () => {
      // 清除显示定时器
      if (hoverTimer) {
        clearTimeout(hoverTimer)
        hoverTimer = null
      }

      // 延迟隐藏卡片
      leaveTimer = setTimeout(() => {
        hideCard()
      }, 200)
    }

    // 鼠标进入卡片
    const handleCardMouseEnter = () => {
      if (leaveTimer) {
        clearTimeout(leaveTimer)
        leaveTimer = null
      }
    }

    // 鼠标离开卡片
    const handleCardMouseLeave = () => {
      leaveTimer = setTimeout(() => {
        hideCard()
      }, 200)
    }

    // 隐藏卡片
    const hideCard = () => {
      if (cardInstance && cardElement) {
        cardElement.removeEventListener('mouseenter', handleCardMouseEnter)
        cardElement.removeEventListener('mouseleave', handleCardMouseLeave)

        // 先隐藏卡片
        if (cardElement.firstChild) {
          cardElement.firstChild.style.display = 'none'
        }

        // 延迟销毁
        setTimeout(() => {
          if (cardElement && cardElement.parentNode) {
            cardElement.parentNode.removeChild(cardElement)
          }
          if (cardInstance && cardInstance.unmount) {
            cardInstance.unmount()
          }
          cardInstance = null
          cardElement = null
        }, 100)
      }
    }

    // 绑定事件
    el.addEventListener('mouseenter', handleMouseEnter)
    el.addEventListener('mouseleave', handleMouseLeave)

    // 保存清理函数
    el._userHoverCleanup = () => {
      el.removeEventListener('mouseenter', handleMouseEnter)
      el.removeEventListener('mouseleave', handleMouseLeave)

      if (hoverTimer) {
        clearTimeout(hoverTimer)
      }
      if (leaveTimer) {
        clearTimeout(leaveTimer)
      }

      hideCard()
    }
  },

  unmounted(el) {
    // 在移动设备上无需清理
    if (isMobileDevice()) {
      return
    }

    if (el._userHoverCleanup) {
      el._userHoverCleanup()
    }
  }
}