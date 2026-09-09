import request from './request.js'

// 获取系统 API 接口文档（原始 Markdown 内容由后端从 doc/API_DOCS.md 读取）
export const getApiDocs = () => request.get('/system/api-docs')
