import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSearchHistoryStore = defineStore('searchHistory', () => {
  // 搜索历史记录，最多保存5条
  const searchHistory = ref([])

  // 从localStorage加载搜索历史
  function loadSearchHistory() {
    try {
      const saved = localStorage.getItem('searchHistory')
      if (saved) {
        searchHistory.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
      searchHistory.value = []
    }
  }

  // 保存搜索历史到localStorage
  function saveSearchHistory() {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  }

  // 添加搜索记录
  function addSearchRecord(keyword) {
    if (!keyword || !keyword.trim()) return

    const trimmedKeyword = keyword.trim()

    // 移除已存在的相同记录
    const existingIndex = searchHistory.value.indexOf(trimmedKeyword)
    if (existingIndex > -1) {
      searchHistory.value.splice(existingIndex, 1)
    }

    // 添加到开头
    searchHistory.value.unshift(trimmedKeyword)

    // 保持最多5条记录
    if (searchHistory.value.length > 5) {
      searchHistory.value = searchHistory.value.slice(0, 5)
    }

    saveSearchHistory()
  }

  // 删除指定搜索记录
  function removeSearchRecord(keyword) {
    const index = searchHistory.value.indexOf(keyword)
    if (index > -1) {
      searchHistory.value.splice(index, 1)
      saveSearchHistory()
    }
  }

  // 清空所有搜索历史
  function clearSearchHistory() {
    searchHistory.value = []
    saveSearchHistory()
  }

  // 获取最近5条搜索记录
  function getRecentSearches() {
    return searchHistory.value.slice(0, 5)
  }

  // 初始化时加载历史记录
  loadSearchHistory()

  return {
    searchHistory,
    addSearchRecord,
    removeSearchRecord,
    clearSearchHistory,
    getRecentSearches
  }
})