<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'
import DropdownMenu from '@/components/menu/DropdownMenu.vue'
import DropdownItem from '@/components/menu/DropdownItem.vue'
import { useThemeStore } from '@/stores/theme'
import { useSiteLang, DOC_LANGS } from '@/composables/useSiteLang'

defineProps({
  // 传入滚动百分比时在 header 底部显示阅读进度条
  progress: {
    type: Number,
    default: null
  },
  // 页面自带底色时隐藏 header 的底色与下边框
  transparent: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const { lang, setLang } = useSiteLang()

const logoUrl = new URL('@/assets/imgs/小石榴.png', import.meta.url).href

const LANG_SHORT = { zh: '中', en: 'EN', 'zh-Hant': '繁' }

const currentLangLabel = computed(() => LANG_SHORT[lang.value] || '中')
const isDownloadPage = computed(() => route.path.startsWith('/download'))
// 文档页 URL 可能带语言层（/en/doc/api），按路径段判断
const isDocPage = computed(() => /\/doc(\/|$)/.test(route.path))
const docLink = computed(() => (route.params.lang ? `/${route.params.lang}/doc` : '/doc'))
</script>

<template>
  <header class="site-header" :class="{ transparent }">
    <div class="site-header-inner">
      <div class="logo" @click="router.push('/')">
        <img :src="logoUrl" alt="小石榴" />
      </div>

      <nav class="site-nav">
        <button class="site-nav-link" :class="{ active: isDownloadPage }" @click="router.push('/download')">
          <span>获取源码</span>
        </button>

        <button class="site-nav-link" :class="{ active: isDocPage }" @click="router.push(docLink)">
          <span>查看文档</span>
        </button>

        <div class="site-divider"></div>

        <DropdownMenu direction="down" menuClass="site-lang-menu">
          <template #trigger>
            <button class="site-icon-btn site-lang-btn">{{ currentLangLabel }}</button>
          </template>
          <template #menu>
            <DropdownItem v-for="item in DOC_LANGS" :key="item.value" @click="setLang(item.value)">
              {{ item.label }}
            </DropdownItem>
          </template>
        </DropdownMenu>

        <button class="site-icon-btn" @click="themeStore.toggleTwoTheme($event)">
          <SvgIcon :name="themeStore.isDark ? 'sun' : 'moon'" width="20" height="20" />
        </button>

        <slot name="actions"></slot>
      </nav>
    </div>

    <div v-if="progress !== null" class="site-progress" :style="{ width: `${progress}%` }"></div>
  </header>
</template>

<style scoped>
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  z-index: 1000;
  background: var(--bg-color-primary);
  border-bottom: 1px solid var(--border-color-primary);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.site-header.transparent {
  background: transparent;
  border-bottom-color: transparent;
}

.site-header-inner {
  max-width: 1280px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  width: 68.32px;
  height: 32px;
  color: var(--button-text-color);
  background: var(--primary-color);
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.logo img {
  width: 68.32px;
  height: 32px;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.site-nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.site-nav-link:hover,
.site-nav-link.active {
  color: var(--primary-color);
}

.site-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.site-icon-btn:hover {
  color: var(--primary-color);
}

.site-divider {
  width: 1px;
  height: 20px;
  margin: 0 8px;
  background: var(--border-color-primary);
}

.site-lang-btn {
  font-weight: 600;
}

.site-progress {
  position: absolute;
  left: 0;
  bottom: -1px;
  height: 1.5px;
  opacity: 0.4;
  background: var(--primary-color);
  transition: width 0.1s linear;

}

:deep(.site-lang-menu) {
  right: 0;
  left: auto;
  min-width: 140px;
}

/* 移动端收起分隔线与当前页自己的入口，语言、主题与页面自定义入口保留 */
@media (max-width: 640px) {
  .site-nav-link.active,
  .site-divider {
    display: none;
  }

  /* 点击区域与图标尺寸对齐主站移动端 header */
  .site-nav-link {
    height: 40px;
    padding: 0 12px;
    font-size: 15px;
  }

  .site-icon-btn {
    min-width: 40px;
    height: 40px;
    font-size: 15px;
  }
}
</style>
