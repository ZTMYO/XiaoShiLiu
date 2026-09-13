import { ref } from 'vue'

const STORAGE_KEY = 'doc-lang'

// 文档可选语言，与后端 doc/i18n 目录下的版本一一对应
export const DOC_LANGS = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'zh-Hant', label: '繁體中文' }
]

const lang = ref(localStorage.getItem(STORAGE_KEY) || 'zh')

// 下载页与文档页共用一个 header，语言状态放在模块作用域，跨页面切换后保持一致
export function useSiteLang() {
  const setLang = (value) => {
    lang.value = value
    localStorage.setItem(STORAGE_KEY, value)
  }
  return { lang, setLang }
}
