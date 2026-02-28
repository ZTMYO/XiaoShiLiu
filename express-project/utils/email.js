/**
 * 小石榴校园图文社区 - 邮件发送工具
 * 封装基于Nodemailer的邮件发送功能
 * 
 * @author ZTMYO
 * @github https://github.com/ZTMYO
 * @description 提供邮件发送服务，主要用于邮箱验证
 * @version v1.3.2
 */

const nodemailer = require('nodemailer');
const { email } = require('../config/config');

// 创建SMTP传输器
const transporter = nodemailer.createTransport({
  host: email.smtp.host,
  port: email.smtp.port,
  secure: email.smtp.secure,
  auth: email.smtp.auth
});

/**
 * 发送邮件
 * @param {Object} mailOptions - 邮件选项
 * @returns {Promise<Object>} - 发送结果
 */
async function sendMail(mailOptions) {
  try {
    // 设置默认发件人
    const options = {
      from: `${email.from.name} <${email.from.email}>`,
      ...mailOptions
    };

    // 发送邮件
    const info = await transporter.sendMail(options);
    console.log('邮件发送成功:', info.messageId);
    return info;
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw error;
  }
}

/**
 * 发送邮箱验证码
 * @param {string} to - 收件人邮箱
 * @param {string} code - 验证码
 * @returns {Promise<Object>} - 发送结果
 */
async function sendEmailCode(to, code) {
  const mailOptions = {
    to,
    subject: '【小石榴校园图文社区】邮箱验证',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h1 style="color: #333; text-align: center;">小石榴校园图文社区</h1>
        <p style="color: #666; font-size: 16px;">您的邮箱验证码是：</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #000000; letter-spacing: 5px;">${code}</span>
        </div>
        <p style="color: #666; font-size: 16px;">请在10分钟内使用此验证码完成注册。</p>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">如果您没有请求此验证码，请忽略此邮件。</p>
      </div>
    `
  };

  return await sendMail(mailOptions);
}

module.exports = {
  sendMail,
  sendEmailCode
};
