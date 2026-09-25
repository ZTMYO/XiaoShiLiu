<script setup>
import { useRouter } from 'vue-router'
import SiteHeader from '@/components/site/SiteHeader.vue'
import SvgIcon from '@/components/SvgIcon.vue'

const router = useRouter()

const GITHUB_URL = 'https://github.com/ZTMYO/XiaoShiLiu'

const openGithub = () => window.open(GITHUB_URL, '_blank', 'noopener')
</script>

<template>
  <div class="download-page">
    <SiteHeader transparent />

    <div class="blur-balls" aria-hidden="true">
      <span class="ball ball-1"></span>
      <span class="ball ball-2"></span>
      <span class="ball ball-3"></span>
      <span class="ball ball-4"></span>
      <span class="ball ball-5"></span>
    </div>

    <main class="download-main">
      <h1 class="download-title">小石榴图文社区</h1>
      <p class="download-desc">
        让你的创作、分享与交流简单、清晰、高效
      </p>

      <div class="download-actions">
        <button class="action-btn action-btn-primary" @click="openGithub">
          <span>获取源码</span>
        </button>
        <button class="action-btn" @click="router.push('/doc')">
          <span>查看文档</span>
        </button>
      </div>

      <ul class="download-meta">
        <li>
          <SvgIcon name="tag" width="14" height="14" />
          <span>版本 v1.3.3</span>
        </li>
        <li>
          <SvgIcon name="code" width="14" height="14" />
          <span>Vue3 + Express + MySQL</span>
        </li>
        <li>
          <SvgIcon name="scale" width="14" height="14" />
          <span>AGPL-3.0 开源协议</span>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.download-page {
  position: relative;
  height: 100vh;
  width: 100%;
  padding-top: 64px;
  box-sizing: border-box;
  display: flex;
  overflow: hidden;
  background: var(--bg-color-primary);
}

/* ===== 背景虚化小球 ===== */
.blur-balls {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ball {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.45;
  will-change: transform;
}

.ball-1 {
  width: 420px;
  height: 420px;
  top: -80px;
  left: -60px;
  background: var(--primary-color);
  animation: ball-drift-a 22s ease-in-out infinite alternate;
}

.ball-2 {
  width: 300px;
  height: 300px;
  top: 12%;
  right: 6%;
  background: #7aa2ff;
  animation: ball-drift-b 26s ease-in-out infinite alternate;
}

.ball-3 {
  width: 220px;
  height: 220px;
  bottom: 8%;
  left: 12%;
  background: #7ee0c0;
  animation: ball-drift-c 19s ease-in-out infinite alternate;
}

.ball-4 {
  width: 340px;
  height: 340px;
  bottom: -100px;
  right: 18%;
  background: var(--primary-color);
  opacity: 0.3;
  animation: ball-drift-b 30s ease-in-out infinite alternate-reverse;
}

.ball-5 {
  width: 160px;
  height: 160px;
  top: 42%;
  left: 42%;
  background: #ffc46b;
  opacity: 0.35;
  animation: ball-drift-a 24s ease-in-out infinite alternate-reverse;
}

@keyframes ball-drift-a {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(90px, 60px, 0) scale(1.12);
  }
  100% {
    transform: translate3d(-40px, 120px, 0) scale(0.95);
  }
}

@keyframes ball-drift-b {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-120px, 80px, 0) scale(0.9);
  }
  100% {
    transform: translate3d(60px, -60px, 0) scale(1.15);
  }
}

@keyframes ball-drift-c {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(70px, -90px, 0) scale(1.18);
  }
  100% {
    transform: translate3d(-80px, 40px, 0) scale(0.92);
  }
}

/* ===== 主内容 ===== */
.download-main {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 720px;
  margin: auto;
  max-height: 100%;
  overflow-y: auto;
  padding: 24px 24px 48px;
  box-sizing: border-box;
  text-align: center;
}

.download-title {
  margin: 0;
  font-size: 44px;
  line-height: 1.2;
  color: var(--text-color-primary);
  letter-spacing: 0.02em;
}

.download-desc {
  margin: 20px auto 0;
  max-width: 560px;
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-color-secondary);
}

.download-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 160px;
  height: 48px;
  padding: 0 28px;
  border: 1px solid var(--border-color-primary);
  border-radius: 12px;
  background: var(--bg-color-primary);
  color: var(--text-color-primary);
  font-size: 16px;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.action-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.action-btn-primary {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: var(--button-text-color);
}

.action-btn-primary:hover {
  border-color: color-mix(in srgb, var(--primary-color) 85%, #ffffff);
  background: color-mix(in srgb, var(--primary-color) 85%, #ffffff);
  color: var(--button-text-color);
}

.download-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px 28px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  color: var(--text-color-tertiary);
}

.download-meta li {
  display: flex;
  align-items: center;
  gap: 6px;
}

[data-theme="dark"] .ball {
  opacity: 0.3;
}

@media (max-width: 640px) {
  .download-title {
    font-size: 32px;
  }

  .download-actions {
    gap: 12px;
  }

  .action-btn {
    min-width: 0;
    padding: 0 20px;
  }

  .download-meta {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
