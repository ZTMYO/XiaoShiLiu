<template>
  <div class="layout-container">
    <Sidebar v-if="showSidebar" />
    <div class="main-content" :class="{ 'with-sidebar': showSidebar }">
      <LayoutHeader />
      <div class="content-wrapper">
        <router-view />
      </div>
      <LayoutFooter v-if="!showSidebar" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import LayoutHeader from './components/LayoutHeader.vue'
import LayoutFooter from './components/LayoutFooter.vue'

const showSidebar = ref(window.innerWidth > 960)
const handleResize = () => {
  showSidebar.value = window.innerWidth > 960
}
onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color-primary);
  min-width: 320px;
  margin: 0 auto;
  max-width: 1200px;
  width: 100%;
  overflow-x: hidden;
  position: relative;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
  
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
  transition: margin-left 0.3s;
  width: 100%;
  overflow-x: hidden;
}

/* 大屏模式下主内容区域留出侧边栏空间 */
.main-content.with-sidebar {
  margin-left: 228px;
  width: calc(100% - 228px);
}

.content-wrapper {
  flex: 1;
  margin: auto;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background-color: var(--bg-color-primary);
}

@media (max-width: 960px) {
  .main-content {
    margin-left: 0;
  }

  .content-wrapper {
    padding-bottom: 48px;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding-bottom: 48px;
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding-bottom: 48px;
  }
}

@media (min-width: 961px) {
  .content-wrapper {
    padding-bottom: 0;
  }
}
</style>