/**
 * 系统文档路由 - 提供站点文档的 Markdown 原文
 * 文档源：仓库根目录 doc/，多语言版本位于 doc/i18n/（docker 部署时挂载为只读卷 /doc）
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants');

const router = express.Router();

// 可对外提供的文档清单，name 同时作为路由参数白名单，避免路径穿越
// 数组顺序即左侧文档树的展示顺序，第一项为 /doc 的默认落地页
const DOC_ITEMS = [
  { name: 'overview', title: '文档总览', file: 'OVERVIEW.md' },
  { name: 'api', title: '接口文档', file: 'API_DOCS.md' },
  { name: 'deployment', title: '部署指南', file: 'DEPLOYMENT.md' },
  { name: 'structure', title: '项目结构', file: 'PROJECT_STRUCTURE.md' },
  { name: 'database', title: '数据库设计', file: 'DATABASE_DESIGN.md' }
];

// 语言代码 → 文件名后缀，中文为默认文件
const LANG_SUFFIX = { zh: '', en: '_En', 'zh-Hant': '_zh-Hant' };
const DEFAULT_LANG = 'zh';

// 按部署形态探测 doc 目录位置：源码运行与 docker 挂载两种路径
function resolveDocDir() {
  const candidates = [
    path.resolve(__dirname, '../../doc'),
    path.resolve(process.cwd(), 'doc'),
    '/app/doc'
  ];
  return candidates.find((dir) => fs.existsSync(dir)) || null;
}

// 中文取 doc/xxx.md，其它语言取 doc/i18n/xxx_En.md
function resolveDocFile(docItem, lang) {
  const dir = resolveDocDir();
  if (!dir) return null;
  const suffix = LANG_SUFFIX[lang];
  const fileName = suffix
    ? path.join('i18n', docItem.file.replace(/\.md$/, `${suffix}.md`))
    : docItem.file;
  const filePath = path.join(dir, fileName);
  return fs.existsSync(filePath) ? filePath : null;
}

function readDoc(docItem, lang) {
  const filePath = resolveDocFile(docItem, lang);
  if (!filePath) return null;
  return {
    content: fs.readFileSync(filePath, 'utf8'),
    updatedAt: fs.statSync(filePath).mtime.toISOString()
  };
}

// GET /api/system/docs
// 返回可读文档清单及各文档已存在的语言版本
router.get('/docs', (req, res) => {
  try {
    const items = DOC_ITEMS.map((docItem) => {
      const languages = Object.keys(LANG_SUFFIX).filter((lang) => resolveDocFile(docItem, lang));
      const doc = readDoc(docItem, DEFAULT_LANG);
      return {
        name: docItem.name,
        title: docItem.title,
        file: docItem.file,
        languages,
        updatedAt: doc ? doc.updatedAt : null
      };
    });

    res.set('Cache-Control', 'no-store');
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: { items }
    });
  } catch (error) {
    console.error('读取文档清单失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '读取文档清单失败'
    });
  }
});

// GET /api/system/docs/:name?lang=zh
// 返回指定文档的 Markdown 原文
router.get('/docs/:name', (req, res) => {
  const docItem = DOC_ITEMS.find((item) => item.name === req.params.name);
  if (!docItem) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      code: RESPONSE_CODES.NOT_FOUND,
      message: '文档不存在'
    });
  }

  const lang = req.query.lang || DEFAULT_LANG;
  if (!Object.prototype.hasOwnProperty.call(LANG_SUFFIX, lang)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      code: RESPONSE_CODES.VALIDATION_ERROR,
      message: '不支持的语言版本'
    });
  }

  try {
    const doc = readDoc(docItem, lang);
    if (!doc) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        code: RESPONSE_CODES.NOT_FOUND,
        message: '该文档暂无此语言版本'
      });
    }

    res.set('Cache-Control', 'no-store');
    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: {
        name: docItem.name,
        title: docItem.title,
        lang,
        content: doc.content,
        updatedAt: doc.updatedAt
      }
    });
  } catch (error) {
    console.error('读取文档失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '读取文档失败'
    });
  }
});

module.exports = router;
