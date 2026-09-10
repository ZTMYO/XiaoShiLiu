const express = require('express');
const router = express.Router();
const { validateImageFile, validateVideoFile } = require('../utils/fileHelpers');
const { HTTP_STATUS, RESPONSE_CODES } = require('../constants');

router.get('/images/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const result = await validateImageFile(filename);

    if (!result.valid) {
      return res.status(result.statusCode).json({
        code: result.statusCode,
        message: '图片访问失败'
      });
    }

    res.sendFile(result.filePath, {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=31536000'
      }
    }, (err) => {
      if (err) {
        console.error('文件发送错误:', err);
        if (!res.headersSent) {
          res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            code: RESPONSE_CODES.ERROR,
            message: '文件读取失败'
          });
        }
      }
    });
  } catch (error) {
    console.error('图片访问错误:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '服务器错误'
    });
  }
});

router.get('/videos/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const result = await validateVideoFile(filename);

    if (!result.valid) {
      return res.status(result.statusCode).json({
        code: result.statusCode,
        message: '视频访问失败'
      });
    }

    res.sendFile(result.filePath, {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=31536000'
      }
    }, (err) => {
      if (err) {
        console.error('文件发送错误:', err);
        if (!res.headersSent) {
          res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            code: RESPONSE_CODES.ERROR,
            message: '文件读取失败'
          });
        }
      }
    });
  } catch (error) {
    console.error('视频访问错误:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: RESPONSE_CODES.ERROR,
      message: '服务器错误'
    });
  }
});

module.exports = router;