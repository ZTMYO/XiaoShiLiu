import request from './request.js'

// 获取可读文档清单（含每篇文档已有的语言版本）
export const getDocs = () => request.get('/system/docs')

// 按文档名与语言获取 Markdown 原文
export const getDocByName = (name, lang = 'zh') =>
  request.get(`/system/docs/${name}`, { params: { lang } })
