/**
 * 邮件相关路由
 * 处理验证码发送、邮件测试等功能
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { EmailController } from '../controllers/EmailController.js';

const router = express.Router();
const emailController = new EmailController();

/**
 * 发送验证码邮件
 * POST /api/v1/email/send-verification
 */
router.post('/send-verification', [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('type')
    .isIn(['register', 'login', 'reset_password', 'email_change', 'feedback'])
    .withMessage('验证码类型无效'),
  body('template')
    .optional()
    .isString()
    .withMessage('模板名称必须是字符串')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    await emailController.sendVerificationCode(req, res);
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({
      success: false,
      message: '发送验证码失败',
      error: error.message
    });
  }
});

/**
 * 验证邮箱验证码
 * POST /api/v1/email/verify-code
 */
router.post('/verify-code', [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('code')
    .isLength({ min: 6, max: 6 })
    .matches(/^[0-9A-Z]{6}$/)
    .withMessage('验证码必须是6位数字或大写字母'),
  body('type')
    .isIn(['register', 'login', 'reset_password', 'email_change', 'feedback'])
    .withMessage('验证码类型无效')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    await emailController.verifyCode(req, res);
  } catch (error) {
    console.error('验证码验证失败:', error);
    res.status(500).json({
      success: false,
      message: '验证码验证失败',
      error: error.message
    });
  }
});

/**
 * 发送测试邮件
 * POST /api/v1/email/test
 */
router.post('/test', [
  body('to')
    .optional()
    .isEmail()
    .withMessage('收件人邮箱地址无效')
    .normalizeEmail(),
  body('subject')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('邮件主题不能超过100个字符'),
  body('text')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('邮件内容不能超过1000个字符'),
  body('html')
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage('HTML内容不能超过5000个字符')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    await emailController.sendTestEmail(req, res);
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.status(500).json({
      success: false,
      message: '发送测试邮件失败',
      error: error.message
    });
  }
});

/**
 * 获取邮箱配置状态
 * GET /api/v1/email/status
 */
router.get('/status', async (req, res) => {
  try {
    await emailController.getEmailStatus(req, res);
  } catch (error) {
    console.error('获取邮箱状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取邮箱状态失败',
      error: error.message
    });
  }
});

export default router;
