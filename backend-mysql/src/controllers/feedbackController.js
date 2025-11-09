/**
 * 意见反馈控制器
 * 处理意见反馈相关的HTTP请求
 */

import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../services/EmailService.js';
import { VerificationCodeService } from '../services/VerificationCodeService.js';

/**
 * 提交意见反馈
 */
export const submitFeedback = async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      content,
      verification_code
    } = req.body;

    // 基本验证
    if (!name || !email || !subject || !content || !verification_code) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段，包括验证码'
      });
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 验证码验证
    const verificationCodeService = new VerificationCodeService();
    const isValidCode = await verificationCodeService.verifyCode(email, verification_code, 'feedback');
    
    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期，请重新获取'
      });
    }

    // 标记验证码为已使用
    await verificationCodeService.markCodeAsUsed(email, verification_code, 'feedback');

    // 内容长度验证
    if (subject.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: '反馈主题至少需要3个字符'
      });
    }

    if (content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: '反馈内容至少需要10个字符'
      });
    }

    // 获取客户端信息
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    // 构建反馈数据
    const feedback = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      content: content.trim(),
      ip_address: ipAddress,
      user_agent: userAgent,
      submitted_at: new Date()
    };

    // 异步发送邮件通知（管理员通知 + 用户确认），不阻塞响应
    try {
      const emailService = new EmailService();
      // 发送管理员通知
      emailService
        .sendFeedbackEmail({ feedback })
        .catch(err => console.error('意见反馈管理员通知邮件发送失败:', err?.message || err));
      
      // 发送用户提交成功确认邮件
      emailService
        .sendFeedbackSuccessEmail({ feedback })
        .catch(err => console.error('意见反馈提交成功邮件发送失败:', err?.message || err));
    } catch (e) {
      console.error('触发意见反馈邮件失败:', e?.message || e);
    }

    res.status(201).json({
      success: true,
      data: {
        id: feedback.id,
        submitted_at: feedback.submitted_at
      },
      message: '意见反馈提交成功，我们会认真对待您的反馈'
    });

  } catch (error) {
    console.error('提交意见反馈失败:', error);
    res.status(500).json({
      success: false,
      message: '提交反馈失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

