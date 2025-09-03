<template>
  <div class="about-modal-overlay" v-click-outside.mousedown="closeModal" v-escape-key="closeModal"
    :class="{ 'animating': isAnimating }">
    <div class="about-modal" @click.stop :class="{ 'scale-in': isAnimating }">
      <div class="about-header">
        <div class="header-content">
          <div class="logo-section">
            <img :src="logoUrl" alt="小石榴" class="about-logo" />
            <h2 class="about-title">关于小石榴</h2>
          </div>
          <p class="version">v1.0.0</p>
        </div>
        <button class="close-btn" @click="closeModal">
          <SvgIcon name="close" />
        </button>
      </div>

      <div class="about-content">
        <div class="about-main">
          <div class="intro-section">
            <h3>项目简介</h3>
            <p>
              小石榴校园图文社区是一个面向开发者与学习者的开源示例项目，旨在提供从前端到后端的完整实践范本，帮助大家学习现代 Web 应用的架构设计、工程化与业务实现。
            </p>
          </div>
          <div class="author-section">
            <h3>开发者</h3>
            <a href="https://github.com/ZTMYO" target="_blank" class="author-link">
              <div class="author-info">
                <img class="author-avatar" :src="ztmyoUrl" alt="ZTMYO">
                <div class="author-details">
                  <p class="author-name">@ZTMYO</p>
                  <p class="author-desc">全栈开发者</p>
                </div>
              </div>
            </a>
          </div>
          <div class="features-section">
            <h3>项目亮点</h3>
            <ul class="features-list">
              <li><strong>前端：</strong>Vue 3+Vite+Pinia+Vue Router</li>
              <li><strong>后端：</strong>Node.js/Express+MySQL</li>
              <li><strong>工程化：</strong>环境配置、代码规范、构建与产物优化的完整流程</li>
              <li><strong>业务能力：</strong>鉴权流程、路由守卫、状态管理与接口封装</li>
              <li><strong>体验优化：</strong>骨架屏、懒加载、预加载、无障碍与响应式适配</li>
              <li><strong>组件与分层：</strong>可复用组件拆分、按领域分组与别名引入</li>
              <li><strong>后台管理：</strong>基础CRUD、数据管理与配置面板，支持后续扩展权限与统计</li>
              <li><strong>第三方库：</strong>VueUse、Cropper.js、vue3-emoji-picker 等的集成与实践</li>
            </ul>
          </div>

          <div class="api-section">
            <h3>接口服务</h3>
            <div class="api-content">
              <p>
                <strong>图片存储：</strong>灌装的示例图片来自 <a href="https://t.alcy.cc/" target="_blank" class="api-link"><img
                    :src="liciUrl" alt="栗次元" class="api-icon">栗次元图床</a>，提供稳定的图片存储服务。
              </p>
              <p>
                <strong>图片上传：</strong>用户上传图片使用了 <a href="https://api.aa1.cn/doc/xinyew_jdtc.html" target="_blank"
                  class="api-link"><img :src="xiaRouUrl" alt="夏柔" class="api-icon">夏柔API</a>，确保图片上传的稳定性和速度。
              </p>
              <p>
                <strong>属地查询：</strong>IP属地查询服务使用 <a href="https://api.pearktrue.cn/dashboard/detail/290" target="_blank"
                  class="api-link"><img :src="baoLuoUrl" alt="保罗" class="api-icon">保罗API</a>，实现精准的IP属地定位功能。
              </p>
            </div>
          </div>



          <div class="privacy-section">
            <h3>隐私声明</h3>
            <div class="privacy-content">
              <p>
                <strong>数据保护：</strong>我们承诺不收集或存储用户的IP地址信息，保护用户的隐私和匿名性。
              </p>
              <p>
                <strong>密码安全：</strong>用户密码采用SHA256加密算法进行哈希处理，确保密码信息的安全性，系统无法获取用户的明文密码。
              </p>
              <p>
                <strong>数据最小化：</strong>我们仅收集必要的用户信息用于基本功能实现，不会收集与服务无关的个人数据。
              </p>
              <p>
                <strong>本地存储：</strong>所有用户数据均存储在本地数据库中，不会上传至第三方服务器或云端。
              </p>
            </div>
          </div>

          <div class="copyright-section">
            <h3>版权声明</h3>
            <div class="copyright-content">
              <p>
                <strong>设计灵感：</strong>本校园图文社区的UI设计和交互体验参考了小红书平台，旨在为下载该开源项目的人员提供一个熟悉的项目体验。
              </p>
              <p>
                <strong>开源项目：</strong>本项目仅供学习交流使用，不用于商业用途。所有代码遵循开源协议，欢迎技术交流与讨论。
              </p>
              <p>
                <strong>免责声明：</strong>本项目与小红书官方无任何关联，所有商标、品牌名称归其各自所有者所有。
              </p>
            </div>
          </div>

          <div class="about-footer">
            <p>&copy; 2025 小石榴校园图文社区. Made with ❤️ by @ZTMYO</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useScrollLock } from '@/composables/useScrollLock'

const emit = defineEmits(['close'])

const { lock, unlock } = useScrollLock()

// 静态资源URL
const logoUrl = new URL('@/assets/imgs/logo.ico', import.meta.url).href
const ztmyoUrl = new URL('@/assets/imgs/ztmyo.png', import.meta.url).href
const liciUrl = new URL('@/assets/imgs/栗次元.ico', import.meta.url).href
const xiaRouUrl = new URL('@/assets/imgs/夏柔.ico', import.meta.url).href
const baoLuoUrl = new URL('@/assets/imgs/保罗.ico', import.meta.url).href

const isAnimating = ref(false)

const closeModal = () => {
  isAnimating.value = false
  unlock()
  setTimeout(() => {
    emit('close')
  }, 200)
}

onMounted(() => {
  lock()

  setTimeout(() => {
    isAnimating.value = true
  }, 10)
})
</script>

<style scoped>
.about-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(4px);
}

.about-modal-overlay.animating {
  opacity: 1;
}

.about-modal {
  background: var(--bg-color-primary);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  position: relative;
  transform: scale(0.9);
  transition: transform 0.2s ease;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.about-modal.scale-in {
  transform: scale(1);
}

.about-header {
  position: relative;
  background: var(--bg-color-primary);
  padding: 24px 32px;
  border-radius: 16px 16px 0 0;
  flex-shrink: 0;
}

.header-content {
  text-align: center;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: all 0.2s ease;
}

.close-btn:hover {
  opacity: 0.8;
  transform: scale(1.1);
}

.about-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.about-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.about-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color-primary);
  margin: 0;
}

.version {
  font-size: 14px;
  color: var(--text-color-secondary);
  background: var(--bg-color-secondary);
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
  margin: 0;
}

.about-main {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.intro-section h3,
.features-section h3,
.author-section h3,
.api-section h3,
.privacy-section h3,
.copyright-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 12px 0;
}

.intro-section p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-color-secondary);
  margin: 0;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.features-list li {
  font-size: 14px;
  color: var(--text-color-primary);
  padding: 8px 0;
}

.author-link {
  text-decoration: none;
  color: inherit;
  display: block;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
}

.author-link:hover {
  background-color: rgba(255, 95, 95, 0.05);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color-primary);
}



.author-details {
  flex: 1;
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 4px 0;
}

.author-desc {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin: 0;
}

.privacy-content p,
.copyright-content p {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color-secondary);
  margin: 0 0 12px 0;
}

.privacy-content p:last-child,
.copyright-content p:last-child {
  margin-bottom: 0;
}

.privacy-content strong,
.copyright-content strong {
  color: var(--text-color-primary);
}



.about-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
}

.about-footer p {
  font-size: 13px;
  color: var(--text-color-tertiary);
  margin: 0;
}

.api-content p {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color-secondary);
  margin: 0 0 12px 0;
}

.api-content p:last-child {
  margin-bottom: 0;
}

.api-content strong {
  color: var(--text-color-primary);
}

.api-link {
  color: var(--text-color-primary);
  font-weight: 450;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.api-link:hover {
  opacity: 0.8;
}

.api-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  vertical-align: middle;
  border-radius: 2px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .about-modal {
    width: 95%;
    max-height: 95vh;
  }

  .about-header {
    padding: 20px 24px;
  }

  .about-content {
    padding: 24px 20px;
  }

  .logo-section {
    flex-direction: column;
    gap: 12px;
  }

  .about-title {
    font-size: 24px;
  }

  .features-list {
    grid-template-columns: 1fr;
  }

  .author-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .contact-links {
    justify-content: center;
  }
}
</style>