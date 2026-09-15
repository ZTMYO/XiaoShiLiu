const express = require('express');
const router = express.Router();
const { HTTP_STATUS, RESPONSE_CODES, ERROR_MESSAGES } = require('../constants');
const { pool } = require('../config/config');

// 获取所有标签（附带各标签下已发布笔记的浏览量总和，供发布页展示热度）
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, COALESCE(v.view_sum, 0) AS view_sum
         FROM tags t
         LEFT JOIN (
           SELECT pt.tag_id, SUM(p.view_count) AS view_sum
             FROM post_tags pt
             JOIN posts p ON p.id = pt.post_id AND p.status = 0
            GROUP BY pt.tag_id
         ) v ON v.tag_id = t.id
        ORDER BY t.name ASC`
    );


    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data: rows
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

// 热门标签候选池大小：先按浏览量取头部标签，再从池中加权随机抽取
const HOT_POOL_SIZE = 100
// 综合评分权重：浏览量代表内容被看到的规模，使用次数代表标签的普及度
const VIEW_WEIGHT = 0.6
const USE_WEIGHT = 0.4

/**
 * 按权重不放回抽样：分高的更容易被推荐，但每次抽出的组合都不同
 */
function weightedSample(items, k, weightOf) {
  const pool = items.map(item => ({ item, weight: Math.max(weightOf(item), 0) }))
  const picked = []
  while (picked.length < k && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0)
    let idx = 0
    if (total > 0) {
      let r = Math.random() * total
      while (idx < pool.length - 1 && r > pool[idx].weight) {
        r -= pool[idx].weight
        idx++
      }
    }
    picked.push(pool[idx].item)
    pool.splice(idx, 1)
  }
  return picked
}

// 获取热门标签：浏览量（权重更高）与使用次数综合评分后，加权随机抽若干个推荐
router.get('/hot', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await pool.execute(
      `SELECT t.id, t.name, t.use_count,
              SUM(p.view_count) AS view_sum
         FROM tags t
         JOIN post_tags pt ON pt.tag_id = t.id
         JOIN posts p ON p.id = pt.post_id AND p.status = 0
        GROUP BY t.id, t.name, t.use_count
       HAVING view_sum > 0
        ORDER BY view_sum DESC
        LIMIT ?`,
      [String(HOT_POOL_SIZE)]
    );

    // 浏览量十万级、使用次数百级，量纲差得远，先各自归一化再加权
    const maxView = Math.max(...rows.map(r => Number(r.view_sum) || 0), 1)
    const maxUse = Math.max(...rows.map(r => Number(r.use_count) || 0), 1)
    const scoreOf = (r) =>
      (Number(r.view_sum) || 0) / maxView * VIEW_WEIGHT +
      (Number(r.use_count) || 0) / maxUse * USE_WEIGHT

    const data = weightedSample(rows, limit, scoreOf).map(r => ({ id: r.id, name: r.name }));

    res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: 'success',
      data
    });
  } catch (error) {
    console.error('获取热门标签失败:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ code: RESPONSE_CODES.ERROR, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
});

module.exports = router;