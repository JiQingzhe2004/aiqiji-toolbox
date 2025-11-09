/**
 * 邮件服务
 * 使用nodemailer发送邮件
 */

import nodemailer from 'nodemailer';
import { SettingsService } from './SettingsService.js';
import { getAdminNotificationEmail, getApplicantReceiptEmail, getAdminDecisionEmail, getApplicantDecisionEmail } from '../emailTemplates/friendLinkApplication.js';

export class EmailService {
  constructor() {
    this.settingsService = new SettingsService();
    this.transporter = null;
  }

  /**
   * 创建邮件传输器
   */
  async createTransporter() {
    try {
      const settings = await this.getEmailSettings();
      
      if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
        throw new Error('邮件配置不完整，请检查SMTP设置');
      }

      const port = parseInt(settings.smtp_port) || 587;
      
      // 根据端口自动配置安全选项
      let secure = false;
      let requireTLS = false;
      
      if (port === 465) {
        // 465端口使用直接SSL连接
        secure = true;
      } else if (port === 587 || port === 25) {
        // 587和25端口使用STARTTLS
        secure = false;
        requireTLS = true;
      } else {
        // 其他端口使用用户配置
        secure = settings.smtp_secure || false;
      }

      const config = {
        host: settings.smtp_host,
        port: port,
        secure: secure,
        requireTLS: requireTLS,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_pass,
        },
        // 添加连接选项
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 30000,
        socketTimeout: 30000,
        // 添加TLS选项以提高兼容性
        tls: {
          rejectUnauthorized: false, // 允许自签名证书
          minVersion: 'TLSv1.2'
        }
      };

      // 为常见邮件服务商添加特殊配置
      if (settings.smtp_host.includes('gmail.com')) {
        config.service = 'gmail';
      } else if (settings.smtp_host.includes('qq.com')) {
        config.service = 'QQ';
      } else if (settings.smtp_host.includes('163.com')) {
        config.service = '163';
      } else if (settings.smtp_host.includes('126.com')) {
        config.service = '126';
      }

      console.log('创建邮件传输器配置:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        requireTLS: config.requireTLS,
        auth: { user: config.auth.user, pass: '***' }
      });

      this.transporter = nodemailer.createTransport(config);

      // 验证配置
      await this.transporter.verify();
      console.log('邮件服务器连接验证成功');
      
      return this.transporter;
    } catch (error) {
      console.error('创建邮件传输器失败:', error);
      throw new Error(`邮件服务器配置错误: ${error.message}`);
    }
  }

  /**
   * 获取邮件配置
   */
  async getEmailSettings() {
    const settings = {
      smtp_host: await this.settingsService.getSettingValue('smtp_host'),
      smtp_port: await this.settingsService.getSettingValue('smtp_port'),
      smtp_secure: await this.settingsService.getSettingValue('smtp_secure'),
      smtp_user: await this.settingsService.getSettingValue('smtp_user'),
      smtp_pass: await this.settingsService.getSettingValue('smtp_pass'),
      from_name: await this.settingsService.getSettingValue('from_name'),
      from_email: await this.settingsService.getSettingValue('from_email'),
      email_enabled: await this.settingsService.getSettingValue('email_enabled')
    };

    return settings;
  }

  /**
   * 生成发件人地址
   */
  async getFromAddress() {
    const settings = await this.getEmailSettings();
    const fromName = settings.from_name || 'AiQiji工具箱';
    const fromEmail = settings.from_email || settings.smtp_user;
    
    return `"${fromName}" <${fromEmail}>`;
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode({ to, code, type, template }) {
    try {
      const transporter = await this.createTransporter();
      const fromAddress = await this.getFromAddress();

      // 根据类型生成邮件内容
      const emailContent = this.generateVerificationEmailContent(code, type, template);

      const mailOptions = {
        from: fromAddress,
        to: to,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };

      console.log('发送验证码邮件:', { to, subject: emailContent.subject });

      const result = await transporter.sendMail(mailOptions);
      
      console.log('验证码邮件发送成功:', { messageId: result.messageId, to });

      return {
        success: true,
        messageId: result.messageId,
        message: '验证码邮件发送成功'
      };
    } catch (error) {
      console.error('发送验证码邮件失败:', error);
      return {
        success: false,
        message: error.message || '发送验证码邮件失败'
      };
    }
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail({ to, subject, text, html }) {
    try {
      const transporter = await this.createTransporter();
      const fromAddress = await this.getFromAddress();

      const mailOptions = {
        from: fromAddress,
        to: to,
        subject: subject,
        text: text,
        html: html || this.generateTestEmailHTML(text)
      };

      console.log('发送测试邮件:', { to, subject });

      const result = await transporter.sendMail(mailOptions);
      
      console.log('测试邮件发送成功:', { messageId: result.messageId, to });

      return {
        success: true,
        messageId: result.messageId,
        message: '测试邮件发送成功'
      };
    } catch (error) {
      console.error('发送测试邮件失败:', error);
      return {
        success: false,
        message: error.message || '发送测试邮件失败'
      };
    }
  }

  /**
   * 生成验证码邮件内容
   */
  generateVerificationEmailContent(code, type, template) {
    const typeTexts = {
      register: '注册',
      login: '登录',
      reset_password: '重置密码',
      email_change: '更换邮箱'
    };

    const typeName = typeTexts[type] || '验证';
    const subject = `您的${typeName}验证码 - AiQiji工具箱`;

    const text = `
您好！

您正在进行${typeName}操作，您的验证码是：${code}

验证码有效期为5分钟，请及时使用。如果您没有进行此操作，请忽略此邮件。

感谢您使用AiQiji工具箱！

---
AiQiji工具箱团队
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, hsl(0 0% 96.1%) 0%, hsl(0 0% 89.8%) 100%);
            color: hsl(0 0% 3.9%);
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: hsl(0 0% 100%);
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .header { 
            background: linear-gradient(135deg, hsl(0 0% 9%) 0%, hsl(0 0% 14.9%) 100%); 
            padding: 32px 24px; 
            text-align: center; 
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, hsl(0 0% 98%), transparent);
        }
        .header h1 { 
            color: hsl(0 0% 98%); 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
            letter-spacing: -0.025em;
        }
        .content { 
            padding: 40px 32px; 
            text-align: center; 
        }
        .content h2 {
            color: hsl(0 0% 9%);
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 16px 0;
            letter-spacing: -0.025em;
        }
        .code { 
            background: linear-gradient(135deg, hsl(0 0% 96.1%) 0%, hsl(0 0% 89.8%) 100%);
            border: 1px solid hsl(0 0% 89.8%);
            border-radius: 0.5rem; 
            padding: 24px; 
            margin: 32px 0; 
            position: relative;
            overflow: hidden;
        }
        .code::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, hsl(0 0% 9%), hsl(0 0% 45.1%), hsl(0 0% 9%));
        }
        .code-value { 
            font-size: 36px; 
            font-weight: 700; 
            color: hsl(0 0% 9%); 
            letter-spacing: 6px; 
            margin: 16px 0;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .code-desc {
            margin: 0; 
            color: hsl(0 0% 45.1%); 
            font-size: 14px; 
            font-weight: 500;
        }
        .message { 
            color: hsl(0 0% 45.1%); 
            line-height: 1.6; 
            margin: 24px 0;
            font-size: 16px;
        }
        .footer { 
            background: linear-gradient(135deg, hsl(0 0% 96.1%) 0%, hsl(0 0% 89.8%) 100%); 
            padding: 24px 32px; 
            text-align: center; 
            color: hsl(0 0% 45.1%); 
            font-size: 14px;
            border-top: 1px solid hsl(0 0% 89.8%);
        }
        .warning { 
            background: linear-gradient(135deg, hsl(38 92% 95%) 0%, hsl(45 93% 93%) 100%); 
            border: 1px solid hsl(38 92% 85%); 
            border-radius: 0.5rem; 
            padding: 16px 20px; 
            margin: 24px 0; 
            color: hsl(25 95% 27%);
            text-align: left;
            position: relative;
            font-size: 14px;
        }
        .warning::before {
            content: '⚠️';
            position: absolute;
            left: 16px;
            top: 16px;
            font-size: 16px;
        }
        .warning-content {
            margin-left: 24px;
        }
        .footer p {
            margin: 8px 0;
        }
        .brand-name {
            background: linear-gradient(135deg, hsl(0 0% 9%), hsl(0 0% 45.1%));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 600;
        }
        @media (prefers-color-scheme: dark) {
            body { 
                background: linear-gradient(135deg, hsl(0 0% 14.9%) 0%, hsl(0 0% 3.9%) 100%);
                color: hsl(0 0% 98%);
            }
            .container { 
                background: hsl(0 0% 3.9%);
                border: 1px solid hsl(0 0% 14.9%);
            }
            .content h2 { color: hsl(0 0% 98%); }
            .code { 
                background: linear-gradient(135deg, hsl(0 0% 14.9%) 0%, hsl(0 0% 10%) 100%);
                border-color: hsl(0 0% 14.9%);
            }
            .code-value { color: hsl(0 0% 98%); }
            .footer { 
                background: linear-gradient(135deg, hsl(0 0% 14.9%) 0%, hsl(0 0% 10%) 100%);
                border-top-color: hsl(0 0% 14.9%);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="brand-name">AiQiji工具箱</span></h1>
        </div>
        <div class="content">
            <h2>您的${typeName}验证码</h2>
            <p class="message">您正在进行${typeName}操作，请使用以下验证码完成验证：</p>
            
            <div class="code">
                <div class="code-value">${code}</div>
                <p class="code-desc">验证码有效期：5分钟</p>
            </div>
            
            <div class="warning">
                <div class="warning-content">
                    <strong>安全提醒：</strong>如果您没有进行此操作，请忽略此邮件。请勿将验证码告诉他人。
                </div>
            </div>
        </div>
        <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>&copy; ${new Date().getFullYear()} <strong>AiQiji工具箱</strong> · 保留所有权利</p>
        </div>
    </div>
</body>
</html>
    `;

    return { subject, text, html };
  }

  /**
   * 生成测试邮件HTML
   */
  generateTestEmailHTML(text) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮箱配置测试 - AiQiji工具箱</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, hsl(0 0% 96.1%) 0%, hsl(0 0% 89.8%) 100%);
            color: hsl(0 0% 3.9%);
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: hsl(0 0% 100%);
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .header { 
            background: linear-gradient(135deg, hsl(0 0% 9%) 0%, hsl(0 0% 14.9%) 100%); 
            padding: 32px 24px; 
            text-align: center; 
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, hsl(0 0% 98%), transparent);
        }
        .header h1 { 
            color: hsl(0 0% 98%); 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
            letter-spacing: -0.025em;
        }
        .content { 
            padding: 40px 32px; 
            text-align: center; 
        }
        .content h2 {
            color: hsl(0 0% 9%);
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 16px 0;
            letter-spacing: -0.025em;
        }
        .success { 
            background: linear-gradient(135deg, hsl(120 50% 95%) 0%, hsl(120 60% 92%) 100%); 
            border: 1px solid hsl(120 45% 85%); 
            border-radius: 0.5rem; 
            padding: 24px; 
            margin: 24px 0; 
            color: hsl(120 40% 20%);
            position: relative;
            overflow: hidden;
        }
        .success::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, hsl(120 45% 50%), hsl(120 55% 45%), hsl(120 45% 50%));
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 16px;
            display: block;
        }
        .success-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: hsl(120 40% 15%);
        }
        .success-desc {
            font-size: 14px;
            color: hsl(120 30% 30%);
            line-height: 1.5;
        }
        .message { 
            color: hsl(0 0% 45.1%); 
            line-height: 1.6; 
            margin: 24px 0;
            font-size: 16px;
            padding: 16px;
            background: hsl(0 0% 98%);
            border-radius: 0.5rem;
            border: 1px solid hsl(0 0% 89.8%);
        }
        .footer { 
            background: linear-gradient(135deg, hsl(0 0% 96.1%) 0%, hsl(0 0% 89.8%) 100%); 
            padding: 24px 32px; 
            text-align: center; 
            color: hsl(0 0% 45.1%); 
            font-size: 14px;
            border-top: 1px solid hsl(0 0% 89.8%);
        }
        .footer p {
            margin: 8px 0;
        }
        .test-info {
            background: hsl(0 0% 96.1%);
            padding: 12px 16px;
            border-radius: 0.25rem;
            margin: 16px 0;
            border-left: 3px solid hsl(0 0% 45.1%);
        }
        .brand-name {
            background: linear-gradient(135deg, hsl(0 0% 9%), hsl(0 0% 45.1%));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 600;
        }
        @media (prefers-color-scheme: dark) {
            body { 
                background: linear-gradient(135deg, hsl(0 0% 14.9%) 0%, hsl(0 0% 3.9%) 100%);
                color: hsl(0 0% 98%);
            }
            .container { 
                background: hsl(0 0% 3.9%);
                border: 1px solid hsl(0 0% 14.9%);
            }
            .content h2 { color: hsl(0 0% 98%); }
            .success { 
                background: linear-gradient(135deg, hsl(120 25% 15%) 0%, hsl(120 20% 10%) 100%);
                border-color: hsl(120 25% 25%);
                color: hsl(120 40% 80%);
            }
            .success-title { color: hsl(120 40% 85%); }
            .message { 
                background: hsl(0 0% 10%);
                border-color: hsl(0 0% 20%);
                color: hsl(0 0% 80%);
            }
            .footer { 
                background: linear-gradient(135deg, hsl(0 0% 14.9%) 0%, hsl(0 0% 10%) 100%);
                border-top-color: hsl(0 0% 14.9%);
            }
            .test-info {
                background: hsl(0 0% 10%);
                border-left-color: hsl(0 0% 63.9%);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="brand-name">AiQiji工具箱</span></h1>
        </div>
        <div class="content">
            <h2>📧 邮箱配置测试</h2>
            <div class="success">
                <div class="success-icon">✅</div>
                <div class="success-title">邮箱配置测试成功！</div>
                <div class="success-desc">如果您收到这封邮件，说明您的邮箱服务器配置已经正确设置，可以正常收发邮件。</div>
            </div>
            
            <div class="message">
                <strong>📝 测试内容：</strong><br>
                ${text || '邮件服务运行正常，SMTP配置有效，可以正常发送系统通知邮件。'}
            </div>
            
            <div class="test-info">
                <strong>🕐 测试时间：</strong> ${new Date().toLocaleString('zh-CN', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: 'Asia/Shanghai'
                })}
            </div>
        </div>
        <div class="footer">
            <p>此邮件由系统自动发送，用于验证邮箱配置。</p>
            <p>&copy; ${new Date().getFullYear()} <strong>AiQiji工具箱</strong> · 保留所有权利</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * 发送友链申请相关邮件（管理员通知 + 申请人回执）
   */
  async sendFriendLinkApplicationEmails({ application }) {
    try {
      const settings = await this.getEmailSettings();

      if (!settings.email_enabled) {
        console.log('邮件未启用（email_enabled = false），跳过发送友链申请邮件');
        return { success: true, skipped: true };
      }

      const transporter = await this.createTransporter();
      const fromAddress = await this.getFromAddress();

      // 读取网站信息用于邮件抬头/落款
      const siteName = (await this.settingsService.getSettingValue('site_name')) || 'AiQiji工具箱';
      const siteUrl = (await this.settingsService.getSettingValue('site_url')) || '';

      // 管理员通知接收邮箱：优先 from_email，其次 smtp_user
      const adminTo = settings.from_email || settings.smtp_user;

      const { subject: adminSubject, html: adminHtml } = getAdminNotificationEmail({
        application,
        siteName,
        siteUrl
      });

      const { subject: applicantSubject, html: applicantHtml } = getApplicantReceiptEmail({
        application,
        siteName,
        siteUrl
      });

      // 发送管理员通知
      if (adminTo) {
        await transporter.sendMail({
          from: fromAddress,
          to: adminTo,
          subject: adminSubject,
          html: adminHtml
        });
        console.log('友链申请管理员通知已发送:', { to: adminTo });
      } else {
        console.warn('未找到管理员接收邮箱（from_email/smtp_user），跳过管理员通知');
      }

      // 发送申请人回执
      if (application.admin_email) {
        await transporter.sendMail({
          from: fromAddress,
          to: application.admin_email,
          subject: applicantSubject,
          html: applicantHtml
        });
        console.log('友链申请回执已发送给申请人:', { to: application.admin_email });
      }

      return { success: true };
    } catch (error) {
      console.error('发送友链申请相关邮件失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 发送友链审核结果邮件（管理员记录 + 申请人通知）
   */
  async sendFriendLinkDecisionEmails({ application, decision, note }) {
    try {
      const settings = await this.getEmailSettings();

      if (!settings.email_enabled) {
        console.log('邮件未启用（email_enabled = false），跳过发送友链审核结果邮件');
        return { success: true, skipped: true };
      }

      const transporter = await this.createTransporter();
      const fromAddress = await this.getFromAddress();

      const siteName = (await this.settingsService.getSettingValue('site_name')) || 'AiQiji工具箱';
      const siteUrl = (await this.settingsService.getSettingValue('site_url')) || '';

      const adminTo = settings.from_email || settings.smtp_user;

      const { subject: adminSubject, html: adminHtml } = getAdminDecisionEmail({
        application,
        siteName,
        siteUrl,
        decision,
        note: note || ''
      });

      const { subject: applicantSubject, html: applicantHtml } = getApplicantDecisionEmail({
        application,
        siteName,
        siteUrl,
        decision,
        note: note || ''
      });

      if (adminTo) {
        await transporter.sendMail({
          from: fromAddress,
          to: adminTo,
          subject: adminSubject,
          html: adminHtml
        });
        console.log('友链审核结果通知已发送给管理员:', { to: adminTo, decision });
      }

      if (application.admin_email) {
        await transporter.sendMail({
          from: fromAddress,
          to: application.admin_email,
          subject: applicantSubject,
          html: applicantHtml
        });
        console.log('友链审核结果通知已发送给申请人:', { to: application.admin_email, decision });
      }

      return { success: true };
    } catch (error) {
      console.error('发送友链审核结果邮件失败:', error);
      return { success: false, message: error.message };
    }
  }
}
