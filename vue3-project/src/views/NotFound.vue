<template>
  <div class="not-found-page">
    <div class="error-container">
      <div class="error-content">

        <div class="error-icon">
          <svg width="120px" height="120px" viewBox="0 -15.89 87.181 87.181" xmlns="http://www.w3.org/2000/svg">
            <g id="Planet" transform="translate(-355.391 -272.962)">
              <g id="Group_18" data-name="Group 18">
                <circle id="Ellipse_4" data-name="Ellipse 4" cx="4.92" cy="4.92" r="4.92"
                  transform="translate(355.391 287.812) rotate(-45)" />
              </g>
              <g id="Group_19" data-name="Group 19">
                <path id="Path_18" data-name="Path 18"
                  d="M442.279,287.352c-2.261-7.09-15.761-6.48-21.731-5.85a27.744,27.744,0,0,0-47.44,15.14c-5.24,2.94-16.6,10.25-14.34,17.34,1.62,5.08,8.98,6.2,15.22,6.2a59.677,59.677,0,0,0,6.51-.37,27.7,27.7,0,0,0,47.42-15.11C433.148,301.772,444.539,294.442,442.279,287.352Zm-78.271,24.96c-.529-1.64,3.5-5.62,8.93-9.14a27.892,27.892,0,0,0,3.64,11.42C370.118,314.882,364.539,313.962,364.008,312.312Zm43.26,9.5a22.166,22.166,0,0,1-19.63-3.05,136.488,136.488,0,0,0,33.82-10.77A22.169,22.169,0,0,1,407.268,321.812Zm-4.01-12.58a134.339,134.339,0,0,1-20.5,4.76,22.284,22.284,0,0,1-3.38-6.58,22.183,22.183,0,0,1,14.4-27.89,22.173,22.173,0,0,1,23.45,6.5,2.336,2.336,0,0,1,.24.29l.039.04a22.31,22.31,0,0,1,5.2,14.91A136.28,136.28,0,0,1,403.258,309.232Zm24.85-11.07a26.83,26.83,0,0,0-1.19-5.91,27.3,27.3,0,0,0-2.439-5.51c6.449-.28,12.029.63,12.56,2.28S433.548,294.642,428.108,298.162Z" />
              </g>
              <g id="Group_20" data-name="Group 20">
                <path id="Path_19" data-name="Path 19" d="M400.4,283.954" stroke="#e54b50" stroke-linecap="round"
                  stroke-linejoin="round" stroke-width="5.5" />
              </g>
              <g id="Group_21" data-name="Group 21">
                <path id="Path_20" data-name="Path 20"
                  d="M416.111,299.381a2.751,2.751,0,0,1-2.59-1.825,15.278,15.278,0,0,0-4.807-6.7,2.75,2.75,0,0,1,3.463-4.274A20.791,20.791,0,0,1,418.7,295.7a2.752,2.752,0,0,1-2.59,3.677Z" />
              </g>
              <g id="Group_22" data-name="Group 22">
                <path id="Path_21" data-name="Path 21"
                  d="M402.912,287.813a2.765,2.765,0,0,1-.6-.066,15.41,15.41,0,0,0-1.972-.307,2.75,2.75,0,1,1,.494-5.478,20.862,20.862,0,0,1,2.676.417,2.75,2.75,0,0,1-.6,5.434Z" />
              </g>
            </g>
          </svg>
        </div>

        <h2>你访问的页面不见了</h2>
        <p>{{ countdownText }}</p>
        <button @click="goBack" class="back-btn">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const countdown = ref(5)
const countdownText = ref('5秒后将自动返回首页')

// 返回首页
const goBack = () => {
  router.push('/explore')
}

// 倒计时逻辑
let timer = null
const startCountdown = () => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value > 0) {
      countdownText.value = `${countdown.value}秒后将自动返回首页`
    } else {
      countdownText.value = '正在返回首页...'
      clearInterval(timer)
      router.push('/explore')
    }
  }, 1000)
}

// 自动跳转
onMounted(() => {
  startCountdown()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.not-found-page {
  min-height: calc(100vh - 64px);
  margin: 10px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding-top: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 20px 20px 20px;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.back-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.back-btn:hover {
  opacity: 0.9;
}

.error-content h2 {
  color: var(--text-color-primary);
  margin-bottom: 8px;
}

.error-content p {
  color: var(--text-color-secondary);
  margin-bottom: 16px;
}

.error-icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.error-icon svg {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}
</style>