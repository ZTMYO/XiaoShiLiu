/**
 * 系统文档路由 - 提供 API 接口文档的 Markdown 原文
 * 文档源：仓库根目录 doc/API_DOCS.md（docker 部署时挂载为只读卷 /doc）
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants');

const router = express.Router();

const DOC_FILENAME = 'API_DOCS.md';

// 按部署形态探测 doc 目录位置：源码运行与 docker 挂载两种路径
function resolveDocFile() {
  const candidates = [
    path.resolve(__dirname, '../../doc', DOC_FILENAME),
    path.resolve(process.cwd(), 'doc', DOC_FILENAME),
    path.resolve('/app/doc', DOC_FILENAME)
  ];
  return candidates.find((filePath) => fs.existsSync(filePath)) || null;
}

// GET /api/system/api-docs
// 返回原始 Markdown，关闭缓存以便文档修改后刷新页面即可生效
router.get('/api-docs', (req, res) => {
  try {
    const filePath = resolveDocFile();
    if (!filePath) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: RESPONSE_CODES.NOT_FOUND,
        message: 'API文档文件不存在，请检查 doc/API_DOCS.md'
      });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);
    res.set('Cache-Control', 'no-store');
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: {
        fileName: DOC_FILENAME,
        content,
        updatedAt: stat.mtime.toISOString()
      }
    });
  } catch (error) {
    console.error('读取API文档失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '读取API文档失败'
    });
  }
});

module.exports = router;
