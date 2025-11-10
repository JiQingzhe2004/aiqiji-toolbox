/**
 * 邮件相关路由
 * 处理验证码发送、邮件测试等功能
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { EmailController } from '../controllers/EmailController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { uploadAttachments } from '../middleware/upload.js';

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '输入验证失败', errors: errors.array() });
    }
    await emailController.sendVerificationCode(req, res);
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ success: false, message: '发送验证码失败', error: error.message });
  }
});

/**
 * 正式发送邮件（支持多收件人、模板、附件）
 * POST /api/v1/email/send
 */
router.post('/send', authenticateToken, requireAdmin, (req, res, next) => {
  uploadAttachments(req, res, function(err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || '附件上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    await emailController.sendEmail(req, res);
  } catch (error) {
    console.error('正式发送邮件失败:', error);
    res.status(500).json({ success: false, message: '发送失败', error: error.message });
  }
});

/** 模板管理 */
router.get('/templates', authenticateToken, requireAdmin, async (req, res) => emailController.listTemplates(req, res));
router.post('/templates', authenticateToken, requireAdmin, [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('subject').isString().isLength({ min: 1, max: 200 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: '输入验证失败', errors: errors.array() });
  return emailController.createTemplate(req, res);
});
router.put('/templates/:id', authenticateToken, requireAdmin, async (req, res) => emailController.updateTemplate(req, res));
router.delete('/templates/:id', authenticateToken, requireAdmin, async (req, res) => emailController.deleteTemplate(req, res));

/** 日志管理 */
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => emailController.listLogs(req, res));
router.get('/logs/export', authenticateToken, requireAdmin, async (req, res) => emailController.exportLogs(req, res));
router.get('/logs/:id', authenticateToken, requireAdmin, async (req, res) => emailController.getLog(req, res));

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
 * 使用AI渲染HTML
 * POST /api/v1/email/ai-render
 */
router.post('/ai-render', authenticateToken, requireAdmin, [
  body('subject').optional().isString().isLength({ max: 200 }),
  body('text').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '输入验证失败', errors: errors.array() });
    }
    await emailController.aiRender(req, res);
  } catch (error) {
    console.error('AI渲染失败:', error);
    res.status(500).json({ success: false, message: 'AI渲染失败', error: error.message });
  }
});

/**
 * 使用AI流式渲染HTML (Server-Sent Events)
 * POST /api/v1/email/ai-render-stream
 */
router.post('/ai-render-stream', authenticateToken, requireAdmin, [
  body('subject').optional().isString().isLength({ max: 200 }),
  body('text').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '输入验证失败', errors: errors.array() });
    }
    await emailController.aiRenderStream(req, res);
  } catch (error) {
    console.error('AI流式渲染失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'AI流式渲染失败', error: error.message });
    }
  }
});

/**
 * 测试AI配置可用性
 * POST /api/v1/email/ai-test
 */
router.post('/ai-test', authenticateToken, requireAdmin, [
  body('base_url').optional().custom((value) => {
    if (value && value.trim() !== '') {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Base URL 必须是有效的URL');
      }
    }
    return true;
  }),
  body('api_key').optional().isString(),
  body('model').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '输入验证失败', errors: errors.array() });
    }
    await emailController.aiTest(req, res);
  } catch (error) {
    console.error('AI测试失败:', error);
    res.status(500).json({ success: false, message: 'AI测试失败', error: error.message });
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
