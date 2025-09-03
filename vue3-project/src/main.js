/**
 * 小石榴校园图文社区 - Vue3前端应用
 * 
 * @author ZTMYO
 * @github https://github.com/ZTMYO
 * @description 基于Vue3+Vite+Pinia的现代化图文社区前端应用
 * @version 1.0.0
 * @license MIT
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'virtual:svg-icons-register'
// 全局css
import '@/assets/css/index.css'
import '@/assets/css/animations.css'
// 导入懒加载插件
import { lazyPlugin } from './directives'
// 导入主题工具函数
import { initTheme } from '@/utils/themeUtils'
// 导入消息管理器
import { install as messageInstall } from '@/utils/messageManager'
// 导入用户store
import { useUserStore } from '@/stores/user'

// 初始化主题系统（在应用创建之前）
initTheme()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(lazyPlugin) // 注册懒加载插件
app.use(messageInstall) // 注册消息管理器

// 初始化用户信息
const userStore = useUserStore()
// 先从localStorage恢复用户信息
userStore.initUserInfo()
// 如果有token，则获取最新的用户信息
if (userStore.token) {
  userStore.getCurrentUser().catch(error => {
    console.error('获取用户信息失败:', error)
  })
}

app.mount('#app')
