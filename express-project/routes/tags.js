const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// 获取所有标签
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tags ORDER BY name ASC'
    );


    res.json({
      code: 200,
      message: 'success',
      data: rows
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 获取热门标签
router.get('/hot', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // 直接使用 use_count 字段获取热门标签
    const [rows] = await pool.execute(
      `SELECT * FROM tags
       WHERE use_count > 0
       ORDER BY use_count DESC, name ASC
       LIMIT ?`,
      [limit]
    );


    res.json({
      code: 200,
      message: 'success',
      data: rows
    });
  } catch (error) {
    console.error('获取热门标签失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;