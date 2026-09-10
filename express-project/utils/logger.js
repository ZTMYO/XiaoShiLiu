const winston = require('winston');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// 确保日志目录存在（同步）
try {
  const logDir = path.join(process.cwd(), config.log.dir);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  console.error('创建日志目录失败:', error.message);
}

// 创建传输器数组
const transports = [
  // 控制台输出
  new winston.transports.Console({ 
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// 如果启用文件日志，添加文件传输器
if (config.log.enabled) {
  transports.push(
    new winston.transports.File({ 
      filename: path.join(process.cwd(), config.log.dir, config.log.filename),
      maxsize: config.log.maxSize,
      maxFiles: config.log.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

const logger = winston.createLogger({
  level: config.log.level,
  transports: transports
});

module.exports = { logger };