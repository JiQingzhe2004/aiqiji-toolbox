/**
 * 邮件控制器
 * 处理邮件发送、验证码管理等功能
 */

import { EmailService } from '../services/EmailService.js';
import { VerificationCodeService } from '../services/VerificationCodeService.js';
import { SettingsService } from '../services/SettingsService.js';
import EmailTemplate from '../models/EmailTemplate.js';
import EmailLog from '../models/EmailLog.js';
import { Op } from 'sequelize';
import { AiService } from '../services/AiService.js';

export class EmailController {
  constructor() {
    this.emailService = new EmailService();
    this.verificationCodeService = new VerificationCodeService();
    this.settingsService = new SettingsService();
    this.aiService = new AiService();
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

  /**
   * 正式发送邮件（支持多收件人、模板、附件），并记录日志
   */
  async sendEmail(req, res) {
    try {
      const { recipients, subject, html, text, template_id } = req.body;

      // 解析收件人
      let to = [];
      if (Array.isArray(recipients)) to = recipients;
      else if (typeof recipients === 'string') {
        try {
          const parsed = JSON.parse(recipients);
          if (Array.isArray(parsed)) to = parsed;
          else to = recipients.split(/[\s,;\n]+/).filter(Boolean);
        } catch {
          to = recipients.split(/[\s,;\n]+/).filter(Boolean);
        }
      }

      if (!to.length) {
        return res.status(400).json({ success: false, message: '请提供至少一个收件人' });
      }

      // 模板处理（可被前端字段覆盖）
      let finalSubject = subject;
      let finalHtml = html;
      let finalText = text;
      if (template_id) {
        const tpl = await EmailTemplate.findByPk(template_id);
        if (tpl) {
          if (!finalSubject) finalSubject = tpl.subject;
          if (!finalHtml && tpl.html) finalHtml = tpl.html;
          if (!finalText && tpl.text) finalText = tpl.text;
        }
      }

      if (!finalSubject) {
        return res.status(400).json({ success: false, message: '邮件主题不能为空' });
      }

      // 处理附件
      const files = (req.files || []).map(f => ({ filename: f.originalname, path: f.path, contentType: f.mimetype }));

      // 发送
      const result = await this.emailService.sendEmail({ to, subject: finalSubject, html: finalHtml, text: finalText, attachments: files });

      // 记录日志
      const log = await EmailLog.create({
        recipients: JSON.stringify(to),
        subject: finalSubject,
        html: finalHtml || null,
        text: finalText || null,
        attachments: files.length ? JSON.stringify(files.map(f => ({ filename: f.filename, path: f.path, mime: f.contentType }))) : null,
        status: result.failCount === 0 ? 'success' : (result.successCount > 0 ? 'partial' : 'failed'),
        success_count: result.successCount,
        fail_count: result.failCount,
        error: result.errors ? result.errors.join('\n') : null
      });

      res.json({ success: true, data: { logId: log.id, success_count: result.successCount, fail_count: result.failCount } });
    } catch (error) {
      console.error('正式发送邮件失败:', error);
      res.status(500).json({ success: false, message: '发送失败', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
  }

  /** 模板列表 */
  async listTemplates(req, res) {
    try {
      const { q, page = 1, limit = 20, active } = req.query;
      const where = {};
      if (active === 'true') where.is_active = true;
      if (active === 'false') where.is_active = false;
      if (q) where.name = { [Op.like]: `%${q}%` };
      const offset = (Number(page) - 1) * Number(limit);
      const { rows, count } = await EmailTemplate.findAndCountAll({ where, order: [['created_at', 'DESC']], offset, limit: Number(limit) });
      res.json({ success: true, data: { items: rows, pagination: { total: count, page: Number(page), limit: Number(limit) } } });
    } catch (e) {
      res.status(500).json({ success: false, message: e?.message || '获取模板失败' });
    }
  }

  /** 新建模板 */
  async createTemplate(req, res) {
    try {
      const { name, subject, html, text, is_active = true } = req.body;
      if (!name || !subject) return res.status(400).json({ success: false, message: '名称与主题必填' });
      const exists = await EmailTemplate.findOne({ where: { name } });
      if (exists) return res.status(400).json({ success: false, message: '模板名称已存在' });
      const created = await EmailTemplate.create({ name, subject, html: html || null, text: text || null, is_active: !!is_active });
      res.json({ success: true, data: { template: created } });
    } catch (e) {
      res.status(500).json({ success: false, message: e?.message || '创建模板失败' });
    }
  }

  /** 更新模板 */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { name, subject, html, text, is_active } = req.body;
      const tpl = await EmailTemplate.findByPk(id);
      if (!tpl) return res.status(404).json({ success: false, message: '模板不存在' });
      if (name && name !== tpl.name) {
        const exists = await EmailTemplate.findOne({ where: { name } });
        if (exists) return res.status(400).json({ success: false, message: '模板名称已被占用' });
      }
      await tpl.update({
        ...(name !== undefined ? { name } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(html !== undefined ? { html } : {}),
        ...(text !== undefined ? { text } : {}),
        ...(is_active !== undefined ? { is_active: !!is_active } : {}),
      });
      res.json({ success: true, data: { template: tpl } });
    } catch (e) {
      res.status(500).json({ success: false, message: e?.message || '更新模板失败' });
    }
  }

  /** 删除模板 */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const tpl = await EmailTemplate.findByPk(id);
      if (!tpl) return res.status(404).json({ success: false, message: '模板不存在' });
      await tpl.destroy();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: e?.message || '删除模板失败' });
    }
  }

  /** 日志列表 */
  async listLogs(req, res) {
    try {
      const { page = 1, limit = 20, status, q, from, to } = req.query;
      const where = {};
      if (status) where.status = status;
      if (from || to) {
        where.created_at = {};
        if (from) where.created_at[Op.gte] = new Date(from);
        if (to) where.created_at[Op.lte] = new Date(to);
      }
      if (q) where.subject = { [Op.like]: `%${q}%` };
      const offset = (Number(page) - 1) * Number(limit);
      const { rows, count } = await EmailLog.findAndCountAll({ where, order: [['created_at', 'DESC']], offset, limit: Number(limit) });
      res.json({ success: true, data: { items: rows, pagination: { total: count, page: Number(page), limit: Number(limit) } } });
    } catch (e) {
      res.status(500).json({ success: false, message: e?.message || '获取日志失败' });
    }
  }

  /** 日志详情 */
  async getLog(req, res) {
    try {
      const { id } = req.params;
      const log = await EmailLog.findByPk(id);
      if (!log) return res.status(404).json({ success: false, message: '日志不存在' });
      res.json({ success: true, data: { log } });
    } catch (e) {
      res.status(500).json({ success: false, message: e?.message || '获取日志失败' });
    }
  }

  /** 导出日志为CSV */
  async exportLogs(req, res) {
    try {
      const { status, from, to } = req.query;
      const where = {};
      if (status) where.status = status;
      if (from || to) {
        where.created_at = {};
        if (from) where.created_at[Op.gte] = new Date(from);
        if (to) where.created_at[Op.lte] = new Date(to);
      }
      const rows = await EmailLog.findAll({ where, order: [['created_at', 'DESC']], limit: 5000 });
      const header = 'created_at,subject,recipients,success_count,fail_count,status,error\n';
      const esc = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
      const csv = header + rows.map(r => [r.created_at?.toISOString() || '', r.subject || '', (JSON.parse(r.recipients || '[]') || []).join('; '), r.success_count || 0, r.fail_count || 0, r.status || '', (r.error || '').replace(/\n/g, ' | ')].map(esc).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="email_logs.csv"');
      res.send('\ufeff' + csv);
    } catch (e) {
      res.status(500).json({ success: false, message: e?.message || '导出失败' });
    }
  }

  /** 使用AI将纯文本渲染为HTML */
  async aiRender(req, res) {
    try {
      const { subject, text } = req.body || {};
      const result = await this.aiService.renderEmailHTML({ subject, text });
      if (result && result.success) {
        return res.json({ success: true, data: { html: result.html } });
      }
      return res.status(400).json({ success: false, message: result?.message || 'AI 渲染失败' });
    } catch (e) {
      console.error('AI 渲染失败:', e);
      return res.status(500).json({ success: false, message: e?.message || 'AI 渲染失败' });
    }
  }

  /** 测试AI配置可用性（不做限流） */
  async aiTest(req, res) {
    try {
      const { base_url, api_key, model } = req.body || {};
      const result = await this.aiService.testConnection({ baseURL: base_url, apiKey: api_key, model });
      if (result.ok) {
        return res.json({ success: true, data: { ok: true, latency_ms: result.latency_ms } });
      }
      return res.status(400).json({ success: false, message: result.message || 'AI 测试失败' });
    } catch (e) {
      console.error('AI 测试失败:', e);
      return res.status(500).json({ success: false, message: e?.message || 'AI 测试失败' });
    }
  }
}
