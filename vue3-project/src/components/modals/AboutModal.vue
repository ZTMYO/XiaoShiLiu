<template>
  <div class="about-modal-overlay" v-click-outside.mousedown="closeModal" v-escape-key="closeModal"
    :class="{ 'animating': isAnimating }">
    <div class="about-modal" @click.stop :class="{ 'scale-in': isAnimating }">
      <div class="about-header">
        <div class="header-content">
          <div class="logo-section">
            <div class="about-logo"><img :src="logoUrl" alt="小石榴" /></div>

            <h2 class="about-title">关于小石榴</h2>
          </div>
          <p v-if="showGithubBadges" class="sheilds-section">
            <a href="https://github.com/ZTMYO/XiaoShiLiu/stargazers" target="_blank">
              <img
                src="https://img.shields.io/github/stars/ZTMYO/XiaoShiLiu?style=flat&logo=github&color=brightgreen&label=Stars">
            </a>
            <a href="https://github.com/ZTMYO/XiaoShiLiu" target="_blank">
              <img
                src="https://img.shields.io/badge/XiaoShiLiu-v1.3.3-brightgreen.svg?logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjE0MCIgaGVpZ2h0PSIxNDAiPgo8cGF0aCBkPSJNMCAwIEMwLjk4NDg0Mzc1IDAuNDAwODk4NDQgMS45Njk2ODc1IDAuODAxNzk2ODcgMi45ODQzNzUgMS4yMTQ4NDM3NSBDMjEuMTI2MDk3NSA5LjMyMjIxOTc0IDMyLjY5NTAzOTgyIDI0LjA4MjkxNDYgMzkuNjg3NSA0Mi4zMTI1IEM0NC42NTc3MjE4NyA1Ni4yNzY0NTY2NyA0NC4xNDU5OTEyNiA3NS4xNjgzMTI0IDM4LjUzNTE1NjI1IDg4Ljg1OTM3NSBDMzguMDI4NTU0NjkgODkuODk1NzgxMjUgMzcuNTIxOTUzMTMgOTAuOTMyMTg3NSAzNyA5MiBDMzYuNTAzNzEwOTQgOTMuMDM2NDA2MjUgMzYuMDA3NDIxODggOTQuMDcyODEyNSAzNS40OTYwOTM3NSA5NS4xNDA2MjUgQzI3LjgzMzg5MjI4IDEwOS41NDE4NzExNCAxNS40NzA5NTI1IDEyMS4zNzk0NjY2OSAwIDEyNyBDLTAuMDQxMjUgMTI2LjM4MTI1IC0wLjA4MjUgMTI1Ljc2MjUgLTAuMTI1IDEyNS4xMjUgQy0wLjQxMzc1IDEyNC40MjM3NSAtMC43MDI1IDEyMy43MjI1IC0xIDEyMyBDLTMuOTk2MTU5NDYgMTIxLjY5NTQzNDQgLTMuOTk2MTU5NDYgMTIxLjY5NTQzNDQgLTcgMTIxIEMtNyAxMTguMzYgLTcgMTE1LjcyIC03IDExMyBDLTYuMjg5NzI2NTYgMTEyLjczNDQ1MzEzIC01LjU3OTQ1MzEzIDExMi40Njg5MDYyNSAtNC44NDc2NTYyNSAxMTIuMTk1MzEyNSBDLTMuOTI4NTU0NjkgMTExLjg0MjEwOTM4IC0zLjAwOTQ1MzEyIDExMS40ODg5MDYyNSAtMi4wNjI1IDExMS4xMjUgQy0xLjE0NTk3NjU2IDExMC43NzY5NTMxMyAtMC4yMjk0NTMxMyAxMTAuNDI4OTA2MjUgMC43MTQ4NDM3NSAxMTAuMDcwMzEyNSBDMy4xNDk0MTA1NiAxMDkuMjE4MDkxNCAzLjE0OTQxMDU2IDEwOS4yMTgwOTE0IDQgMTA3IEM0LjA3NzMzNjExIDEwNS40NTkwMDYzMyA0LjEzNzM2OTIxIDEwMy45MTcxMTg0MyA0LjE4NzUgMTAyLjM3NSBDNC42OTA2NzUzOSA5Ni40OTA0MDY1MSA3LjI0Nzk2Nzk5IDkzLjM0ODk0NjE5IDExIDg5IEMxMS4zMyA4OC4zNCAxMS42NiA4Ny42OCAxMiA4NyBDMTYuMzM3MDYzODcgODguNzU1MDQwNjcgMTcuNTIyMjA4NTQgOTEuMjM1NzQ3NzEgMTkuNjU2MjUgOTUuMjIyNjU2MjUgQzIwLjg3MDQxMzY4IDk3LjE0MTg2OTIxIDIwLjg3MDQxMzY4IDk3LjE0MTg2OTIxIDIyLjk2ODc1IDk3LjgwODU5Mzc1IEMyNS4yMDIxMzAyNCA5OC4xNTY5NzU0NiAyNS4yMDIxMzAyNCA5OC4xNTY5NzU0NiAyOCA5NyBDMjguNDE4MzE0MDQgOTMuNzEwMDA3MTggMjguNDE4MzE0MDQgOTMuNzEwMDA3MTggMjggOTAgQzI1LjkxOTc1NjkxIDg3LjQ3ODQ5MzIyIDIzLjY3OTk1MDk5IDg1LjUzMTAzNjEgMjEuMTA5Mzc1IDgzLjUyMzQzNzUgQzE2LjE5MjYyMjc4IDc5LjMwNjIyMzE5IDE2LjE5MjYyMjc4IDc5LjMwNjIyMzE5IDE1LjYyNSA3NS40NTcwMzEyNSBDMTUuNjY3MzcwODkgNzMuNTc5NDcxMjkgMTUuNzQ5NDAxMDYgNzEuNzAyNDY1NyAxNS44NjcxODc1IDY5LjgyODEyNSBDMTYuMjkyMDg1NTYgNjAuNzgwMjk1NjMgMTIuOTExODg3NzUgNTIuMTI5MzYzMDIgNy40Njg3NSA0NC45OTIxODc1IEMyLjQxNzc5Mjk5IDM5LjQ4ODU1MDM4IC0zLjk3NzY3ODk1IDM2LjM0MDc3MzY4IC0xMSAzNCBDLTEwLjQzNjI4NTg2IDMwLjczMDQ1Nzk4IC05LjUwMDM3NzM0IDI5LjE3NDI0MTE3IC03IDI3IEMtOC45OCAyNi42NyAtMTAuOTYgMjYuMzQgLTEzIDI2IEMtMTIuMzQgMjMuNjkgLTExLjY4IDIxLjM4IC0xMSAxOSBDLTEzLjk3IDIwLjMyIC0xNi45NCAyMS42NCAtMjAgMjMgQy0yMC45OSAyMC4wMyAtMjAuOTkgMjAuMDMgLTIyIDE3IEMtMjIuNjYgMTcgLTIzLjMyIDE3IC0yNCAxNyBDLTI1LjM4OTM4MDc3IDE4Ljk2MTQ3ODc0IC0yNi43MjYwNDExIDIwLjk2MTY2NTc2IC0yOCAyMyBDLTMxLjMgMjEuNjggLTM0LjYgMjAuMzYgLTM4IDE5IEMtMzcuMzQgMjAuNjUgLTM2LjY4IDIyLjMgLTM2IDI0IEMtMzYgMjQuOTkgLTM2IDI1Ljk4IC0zNiAyNyBDLTM4LjMxIDI3LjMzIC00MC42MiAyNy42NiAtNDMgMjggQy00MS4zNSAyOS42NSAtMzkuNyAzMS4zIC0zOCAzMyBDLTM4LjU0NTI3MzQ0IDMzLjIxOTE0MDYzIC0zOS4wOTA1NDY4OCAzMy40MzgyODEyNSAtMzkuNjUyMzQzNzUgMzMuNjY0MDYyNSBDLTUwLjk2NTAyODY5IDM4LjQyMTE5MTU1IC01OC45MTExMTI2MiA0NC4xNDc4MzA1MiAtNjQuMzEyNSA1NS4zNzUgQy02Ni4yMjgwOTAwMyA2MC4zMzM5MDY0NSAtNjYuMjE5Mjg2OTIgNjUuMDEyNjg4OTYgLTY2LjMxMjUgNzAuMjUgQy02Ni40ODY4NzY5OSA3OC4xNzA4OTM4OCAtNjYuNDg2ODc2OTkgNzguMTcwODkzODggLTY4LjQzMzU5Mzc1IDgxLjMxNjQwNjI1IEMtNzAuMjE5MDkyOTEgODIuNzg3MDQzMTkgLTcxLjk3MDU0ODA3IDgzLjg5NzY4NzE2IC03NCA4NSBDLTc2Ljk2MDUwODc0IDg3LjI5MTk5NDAzIC03Ni45NjA1MDg3NCA4Ny4yOTE5OTQwMyAtNzkgOTAgQy03OS40MTgzMTQwNCA5My43MTAwMDcxOCAtNzkuNDE4MzE0MDQgOTMuNzEwMDA3MTggLTc5IDk3IEMtNzUuNjI1OTk0MjIgOTcuNDE3MjU2NzggLTc1LjYyNTk5NDIyIDk3LjQxNzI1Njc4IC03MiA5NyBDLTcwLjI2MzMzMjczIDk0LjgwMTY3Mjg3IC03MC4yNjMzMzI3MyA5NC44MDE2NzI4NyAtNjkgOTIgQy02Ny4zNzE2MzI2MiA5MC4yOTU4OTQ2IC02NS43MTIzMDI0OCA4OC42MTk3NDU1OSAtNjQgODcgQy02Mi45NzMzNDc4NyA4Ny45NzI2MTc4MSAtNjEuOTgyOTA5NjggODguOTgzMTk2ODkgLTYxIDkwIEMtNjAuMTU0Mzc1IDkwLjc4Mzc1IC01OS4zMDg3NSA5MS41Njc1IC01OC40Mzc1IDkyLjM3NSBDLTU1LjY3MDc1MTQ2IDk1LjU3NzMyOTk1IC01NS42Njk2NDU5OSA5OC40MjM0MjUzNiAtNTUuMzc1IDEwMi41NjI1IEMtNTUuMTIyODk3NzMgMTA1Ljk2NjE3NDQ1IC01NS4xMjI4OTc3MyAxMDUuOTY2MTc0NDUgLTU0IDEwOSBDLTUwLjU5NDY1MjM3IDExMS41OTU1MzkzNSAtNDcuMTA4OTgxOTEgMTEyLjg3OTk5MzIzIC00MyAxMTQgQy00MyAxMTYuMzEgLTQzIDExOC42MiAtNDMgMTIxIEMtNDMuOTQ4NzUgMTIxLjI0NzUgLTQ0Ljg5NzUgMTIxLjQ5NSAtNDUuODc1IDEyMS43NSBDLTQ5LjA5MTI5NTA2IDEyMi42NjIxMzc3NSAtNDkuMDkxMjk1MDYgMTIyLjY2MjEzNzc1IC01MC4xOTUzMTI1IDEyNS4wNzgxMjUgQy01MC40NjA4NTkzNyAxMjUuNzEyMzQzNzUgLTUwLjcyNjQwNjI1IDEyNi4zNDY1NjI1IC01MSAxMjcgQy02OC42OTU3Mjk2NyAxMTkuMTI0OTM3MDYgLTgxLjQzOTU5ODg0IDEwNi45NDczMzUyOCAtODkgODkgQy04OS40MTM3ODkwNiA4OC4wODYwNTQ2OSAtODkuODI3NTc4MTMgODcuMTcyMTA5MzggLTkwLjI1MzkwNjI1IDg2LjIzMDQ2ODc1IEMtOTUuNzUzMTk2OCA3MS45MTY5ODQyOSAtOTUuMTUyNTY5NTQgNTMuMjc2OTg2ODkgLTg5LjQ4MDQ2ODc1IDM5LjE1MjM0Mzc1IEMtODguOTkxOTE0MDYgMzguMTEyMDcwMzEgLTg4LjUwMzM1OTM4IDM3LjA3MTc5Njg3IC04OCAzNiBDLTg3LjU0MjM4MjgxIDM1LjAxMTI4OTA2IC04Ny4wODQ3NjU2MyAzNC4wMjI1NzgxMyAtODYuNjEzMjgxMjUgMzMuMDAzOTA2MjUgQy03Ny42MTMxNDg5MSAxNS4yMjU1NjI2NCAtNjMuMDQ2NjYwMSA0LjMxOTQ5MDIxIC00NC41MDc4MTI1IC0yLjIzODI4MTI1IEMtMzAuNzgxODIwODggLTYuNDA3MzkwODYgLTEzLjEwMDE0NTE2IC01LjgzNjUxNzE5IDAgMCBaICIgZmlsbD0iI2ZmZiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTYsNykiLz4KPHBhdGggZD0iTTAgMCBDMS4zMiAwIDIuNjQgMCA0IDAgQzQuMzMgMS4zMiA0LjY2IDIuNjQgNSA0IEM3LjMxIDQuMzMgOS42MiA0LjY2IDEyIDUgQzEyLjA2MDU4NTk0IDUuNzgyNDYwOTQgMTIuMTIxMTcxODggNi41NjQ5MjE4NyAxMi4xODM1OTM3NSA3LjM3MTA5Mzc1IEMxMi4zMDkyNzczNCA4Ljg4ODk2NDg0IDEyLjMwOTI3NzM0IDguODg4OTY0ODQgMTIuNDM3NSAxMC40Mzc1IEMxMi41MTg3MTA5NCAxMS40NDY4MzU5NCAxMi41OTk5MjE4OCAxMi40NTYxNzE4NyAxMi42ODM1OTM3NSAxMy40OTYwOTM3NSBDMTIuNzMyMTE0NjggMTUuOTM2NDA3NzkgMTIuNzMyMTE0NjggMTUuOTM2NDA3NzkgMTQgMTcgQzE2LjMyODE3OTY0IDE3LjM2NzYwNzMxIDE4LjY2MTgzODUgMTcuNzAyNDE1ODEgMjEgMTggQzIxIDE4LjY2IDIxIDE5LjMyIDIxIDIwIEMxNC40ODAzNjU4MyAyMS4xODE5NzY4NCA4LjA0OTU0ODc3IDIxLjE0ODEwNTU5IDEuNDM3NSAyMS4xMjUgQzAuMzI2OTcyNjYgMjEuMTI4ODY3MTkgLTAuNzgzNTU0NjkgMjEuMTMyNzM0MzcgLTEuOTI3NzM0MzggMjEuMTM2NzE4NzUgQy0zLjU0MzI1MTk1IDIxLjEzNDc4NTE2IC0zLjU0MzI1MTk1IDIxLjEzNDc4NTE2IC01LjE5MTQwNjI1IDIxLjEzMjgxMjUgQy02LjE2Mjc5NTQxIDIxLjEzMTY4NDU3IC03LjEzNDE4NDU3IDIxLjEzMDU1NjY0IC04LjEzNTAwOTc3IDIxLjEyOTM5NDUzIEMtMTEuMTU2NjU0MzcgMjAuOTkyOTI0ODYgLTE0LjAyODg1ODk1IDIwLjU1NDAxMTQ5IC0xNyAyMCBDLTE3IDE5LjM0IC0xNyAxOC42OCAtMTcgMTggQy0xNS44NjU2MjUgMTcuODU1NjI1IC0xNC43MzEyNSAxNy43MTEyNSAtMTMuNTYyNSAxNy41NjI1IEMtMTAuMTkyMjI3OTkgMTcuMzg4Mjg1MjIgLTEwLjE5MjIyNzk5IDE3LjM4ODI4NTIyIC05IDE2IEMtOC43NjYzNjExOSAxNC4xNTEwODA1NCAtOC41ODY5NjM2NSAxMi4yOTUxMTk2OSAtOC40Mzc1IDEwLjQzNzUgQy04LjM1MzcxMDk0IDkuNDI1NTg1OTQgLTguMjY5OTIxODggOC40MTM2NzE4OCAtOC4xODM1OTM3NSA3LjM3MTA5Mzc1IEMtOC4xMjMwMDc4MSA2LjU4ODYzMjgxIC04LjA2MjQyMTg3IDUuODA2MTcxODggLTggNSBDLTQuNTM1IDQuNTA1IC00LjUzNSA0LjUwNSAtMSA0IEMtMC42NyAyLjY4IC0wLjM0IDEuMzYgMCAwIFogIiBmaWxsPSIjZmZmIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg2OSwxMTcpIi8+Cjwvc3ZnPgo=">
            </a>
            <a href="https://gitee.com/ZTMYO/XiaoShiLiu/stargazers">
              <img src="https://gitee.com/ZTMYO/XiaoShiLiu/badge/star.svg?theme=dark">
            </a>
          </p>

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
              <li><strong>第三方库：</strong>VueUse、Cropper.js、svg-captcha等的集成与实践</li>
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
                <strong>图片上传：</strong>用户上传图片使用了 <a href="https://api.aa1.cn/doc/360tc.html" target="_blank"
                  class="api-link"><img :src="xiaRouUrl" alt="夏柔" class="api-icon">夏柔API</a>，确保图片上传的稳定性和速度。
              </p>
              <p>
                <strong>属地查询：</strong>IP属地查询服务使用 <a href="https://www.baidu.com/" target="_blank"
                  class="api-link"><img :src="baiduUrl" alt="百度" class="api-icon">百度opendata</a>，实现精准的IP属地定位功能。
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
                <strong>开源项目：</strong>本项目基于 AGPL-3.0 协议开源，仅供学习交流使用，不用于商业用途。所有代码遵循 AGPL-3.0 开源协议，欢迎技术交流与讨论。
              </p>
              <p>
                <strong>免责声明：</strong>本项目与小红书官方无任何关联，所有商标、品牌名称归其各自所有者所有。
              </p>
            </div>
            <div v-if="showGithubBadges" class="star-history-section">
              <h3>Star历史</h3>
              <div class="star-history-content">
                喜欢这个项目的朋友可以给它一个 star，您的支持是我前进的动力。
              </div>
              <a href="https://github.com/ZTMYO/XiaoShiLiu" target="_blank">
                <img :src="starHistoryUrl" alt="Star History Chart">
              </a>
            </div>
          </div>

          <div class="about-footer">
            <p>&copy; 2026 小石榴校园图文社区. Made with ❤️ by @ZTMYO</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useScrollLock } from '@/composables/useScrollLock'
import { useThemeStore } from '@/stores/theme'

const emit = defineEmits(['close'])

const { lock, unlock } = useScrollLock()
const themeStore = useThemeStore()
const showGithubBadges = import.meta.env.VITE_SHOW_GITHUB_BADGES === 'true'

// 静态资源URL
const logoUrl = new URL('@/assets/imgs/小石榴.png', import.meta.url).href
const ztmyoUrl = new URL('@/assets/imgs/ztmyo.png', import.meta.url).href
const liciUrl = new URL('@/assets/imgs/栗次元.ico', import.meta.url).href
const xiaRouUrl = new URL('@/assets/imgs/夏柔.ico', import.meta.url).href
const baiduUrl = new URL('@/assets/imgs/百度.ico', import.meta.url).href

// 根据主题动态生成图片URL
const starHistoryUrl = computed(() => {
  const baseUrl = 'https://api.star-history.com/svg?repos=ZTMYO/XiaoShiLiu&type=Date'
  return themeStore.isDark ? `${baseUrl}&theme=dark` : baseUrl
})

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
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  transition: opacity 0.2s ease;
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
  box-shadow: 0 20px 40px var(--shadow-color);
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
  padding: 24px 32px 12px 32px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
}

.about-logo img {
  width: 120%;
  height: 100%;
  object-fit: contain;
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
  background-color: var(--bg-color-secondary);
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

.sheilds-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

/* 移动端适配 - 全屏显示 */
@media (max-width: 768px) {
  .about-modal {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    transform: scale(1);
  }

  .about-modal.scale-in {
    transform: scale(1);
  }

  .close-btn {
    position: fixed;
    top: 40px;
    left: 16px;
    z-index: 2001;
    background: transparent;
    color: var(--text-color-secondary);
    width: 36px;
    height: 36px;
  }

  .close-btn:hover {
    background: rgba(144, 144, 144, 0.292);
    transform: scale(1);
  }

  .about-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2000;
    height: calc(72px + constant(safe-area-inset-top));
    height: calc(72px + env(safe-area-inset-top));
    padding: 24px 32px;
    padding-left: 60px;
    background: var(--bg-color-primary);
    border-bottom: 1px solid var(--border-color-primary);
    border-radius: 0;
  }

  .about-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-top: calc(100px + constant(safe-area-inset-top));
    padding-top: calc(100px + env(safe-area-inset-top));
    padding-bottom: calc(32px + constant(safe-area-inset-bottom));
    padding-bottom: calc(32px + env(safe-area-inset-bottom));
    padding-left: 16px;
    padding-right: 16px;
    max-width: 100vw;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
    touch-action: auto;
    overscroll-behavior: contain;
  }

  .logo-section {
    flex-direction: row;
    padding-top: 12px;
    gap: 12px;
    margin-bottom: -7px;
  }

  .about-title {
    font-size: 24px;
  }

  .features-list {
    grid-template-columns: 1fr;
  }

  .contact-links {
    justify-content: center;
  }
}

.star-history-section {
  margin-top: 24px;
}

.star-history-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 12px 0;
}

.star-history-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color-secondary);
  margin-bottom: 16px;
}

.star-history-section a {
  display: block;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.star-history-section a:hover {
  opacity: 0.8;
}

.star-history-section img {
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color-primary);
  background: var(--bg-color-secondary);
  cursor: pointer;
}
</style>