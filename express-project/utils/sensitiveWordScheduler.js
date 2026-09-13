const config = require('../config/config')
const { runCheck } = require('../scripts/local-sensitive-word-check')

// 启动违规词检测服务：与自动解封服务一样在后端进程内定时执行
const startSensitiveWordCheckService = (interval = 24 * 60 * 60 * 1000) => {
  if (!config.sensitiveWordCheck.enabled) {
    console.log('● 违规词检测未启用')
    return null
  }

  const runTask = () => {
    runCheck().catch((error) => {
      console.error('违规词检测任务执行失败:', error)
    })
  }

  // 启动时先执行一次：监控脚本会定期重启后端，内存计时器随重启归零，只靠定时器会导致任务永不触发
  runTask()

  const intervalId = setInterval(runTask, interval)

  console.log(`● 违规词检测已启用，每 ${Math.floor(interval / (60 * 60 * 1000))} 小时执行一次`)

  return intervalId
}

module.exports = {
  startSensitiveWordCheckService
}
