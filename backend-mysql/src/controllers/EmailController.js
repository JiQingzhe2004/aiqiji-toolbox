/**
 * 邮件控制器
 * 处理邮件发送、验证码管理等功能
 */

import { EmailService } from '../services/EmailService.js';
import { VerificationCodeService } from '../services/VerificationCodeService.js';
import { SettingsService } from '../services/SettingsService.js';

export class EmailController {
  constructor() {
    this.emailService = new EmailService();
    this.verificationCodeService = new VerificationCodeService();
    this.settingsService = new SettingsService();
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(req, res) {
    try {
      const { email, type, template } = req.body;

      // 检查邮件功能是否启用
      const emailEnabled = await this.settingsService.getSettingValue('email_enabled');
      if (!emailEnabled) {
        return res.status(400).json({
          success: false,
          message: '邮件功能未启用，请联系管理员'
        });
      }

      // 检查是否频繁发送
      const lastSendTime = await this.verificationCodeService.getLastSendTime(email, type);
      if (lastSendTime && Date.now() - lastSendTime < 60000) { // 60秒限制
        const remainingTime = Math.ceil((60000 - (Date.now() - lastSendTime)) / 1000);
        return res.status(429).json({
          success: false,
          message: `请等待 ${remainingTime} 秒后再次发送`
        });
      }

      // 生成验证码
      const verificationCode = await this.verificationCodeService.generateCode(email, type);

      // 发送邮件
      const emailResult = await this.emailService.sendVerificationCode({
        to: email,
        code: verificationCode,
        type,
        template
      });

      if (emailResult.success) {
        // 记录发送时间
        await this.verificationCodeService.recordSendTime(email, type);

        res.json({
          success: true,
          message: '验证码发送成功',
          data: {
            email,
            expires_in: 300 // 5分钟有效期
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: emailResult.message || '验证码发送失败'
        });
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      res.status(500).json({
        success: false,
        message: '发送验证码失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 验证邮箱验证码
   */
  async verifyCode(req, res) {
    try {
      const { email, code, type } = req.body;

      // 验证验证码
      const isValid = await this.verificationCodeService.verifyCode(email, code, type);

      if (isValid) {
        // 标记验证码为已使用
        await this.verificationCodeService.markCodeAsUsed(email, code, type);

        res.json({
          success: true,
          message: '验证码验证成功',
          data: {
            email,
            type,
            verified_at: new Date().toISOString()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: '验证码无效或已过期'
        });
      }
    } catch (error) {
      console.error('验证码验证失败:', error);
      res.status(500).json({
        success: false,
        message: '验证码验证失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(req, res) {
    try {
      const { to, subject, text, html } = req.body;

      // 检查邮件功能是否启用
      const emailEnabled = await this.settingsService.getSettingValue('email_enabled');
      if (!emailEnabled) {
        return res.status(400).json({
          success: false,
          message: '邮件功能未启用，请先在系统设置中启用并配置邮件服务'
        });
      }

      // 获取默认收件人
      const defaultRecipient = to || 
                              await this.settingsService.getSettingValue('from_email') ||
                              await this.settingsService.getSettingValue('smtp_user');

      if (!defaultRecipient) {
        return res.status(400).json({
          success: false,
          message: '请指定收件人邮箱或配置发件人邮箱'
        });
      }

      // 发送测试邮件
      const result = await this.emailService.sendTestEmail({
        to: defaultRecipient,
        subject: subject || '邮箱配置测试 - AiQiji工具箱',
        text: text || '这是一封测试邮件，用于验证邮箱配置是否正确。如果您收到这封邮件，说明邮箱配置成功！',
        html: html
      });

      if (result.success) {
        res.json({
          success: true,
          message: '测试邮件发送成功',
          data: {
            to: defaultRecipient,
            subject: subject || '邮箱配置测试 - AiQiji工具箱',
            sent_at: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || '测试邮件发送失败'
        });
      }
    } catch (error) {
      console.error('发送测试邮件失败:', error);
      res.status(500).json({
        success: false,
        message: '发送测试邮件失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取邮箱配置状态
   */
  async getEmailStatus(req, res) {
    try {
      const emailEnabled = await this.settingsService.getSettingValue('email_enabled');
      const smtpHost = await this.settingsService.getSettingValue('smtp_host');
      const smtpUser = await this.settingsService.getSettingValue('smtp_user');

      const configured = !!(smtpHost && smtpUser);

      res.json({
        success: true,
        data: {
          enabled: emailEnabled || false,
          configured: configured
        }
      });
    } catch (error) {
      console.error('获取邮箱状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取邮箱状态失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
