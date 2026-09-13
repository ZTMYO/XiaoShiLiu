const config = require('../config/config')
const { runCheck } = require('../scripts/local-sensitive-word-check')

// 启动违规词检测服务：与自动解封服务一样在后端进程内定时执行
const startSensitiveWordCheckService = (interval = 24 * 60 * 60 * 1000) => {
  if (!config.sensitiveWordCheck.enabled) {
    console.log('● 违规词检测未启用')
    return null
  }

  // 不在启动时立即执行，避免频繁重启触发重复的全表扫描
  const intervalId = setInterval(() => {
    runCheck().catch((error) => {
      console.error('违规词检测任务执行失败:', error)
    })
  }, interval)

  console.log(`● 违规词检测已启用，每 ${Math.floor(interval / (60 * 60 * 1000))} 小时执行一次`)

  return intervalId
}

module.exports = {
  startSensitiveWordCheckService
}
