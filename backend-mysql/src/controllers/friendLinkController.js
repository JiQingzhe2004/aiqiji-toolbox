/**
 * 友链申请控制器
 * 处理友链申请相关的HTTP请求
 */

import { Op } from 'sequelize';
import FriendLinkApplication from '../models/FriendLinkApplication.js';
import SystemSetting from '../models/SystemSetting.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { EmailService } from '../services/EmailService.js';

/**
 * 提交友链申请
 */
export const submitApplication = async (req, res) => {
  try {
    const {
      site_name,
      site_url,
      site_description,
      site_icon,
      admin_email,
      admin_qq
    } = req.body;

    // 基本验证
    if (!site_name || !site_url || !site_description || !admin_email) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // URL格式验证
    try {
      new URL(site_url);
      if (site_icon) {
        new URL(site_icon);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: '网站地址格式不正确'
      });
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确'
      });
    }

    // 检查是否已存在相同网站的申请
    const existingApplication = await FriendLinkApplication.findOne({
      where: {
        [Op.or]: [
          { site_url: site_url },
          { admin_email: admin_email }
        ],
        status: { [Op.in]: ['pending', 'approved'] }
      }
    });

    if (existingApplication) {
      const message = existingApplication.site_url === site_url 
        ? '该网站已提交过申请' 
        : '该邮箱已提交过申请';
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    // 获取客户端信息
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    // 生成验证令牌和过期时间
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后过期

    // 创建申请记录
    const application = await FriendLinkApplication.create({
      id: uuidv4(),
      site_name,
      site_url,
      site_description,
      site_icon,
      admin_email,
      admin_qq,
      ip_address: ipAddress,
      user_agent: userAgent,
      verification_token: verificationToken,
      expires_at: expiresAt
    });

    // 异步发送邮件通知（管理员 + 申请人回执），不阻塞响应
    try {
      const emailService = new EmailService();
      // 仅传递必要字段，避免泄露敏感token
      const payload = {
        site_name,
        site_url,
        site_description,
        site_icon,
        admin_email,
        admin_qq
      };
      emailService
        .sendFriendLinkApplicationEmails({ application: payload })
        .catch(err => console.error('友链申请邮件发送失败:', err?.message || err));
    } catch (e) {
      console.error('触发友链申请邮件失败:', e?.message || e);
    }

    res.status(201).json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        expires_at: application.expires_at
      },
      message: '友链申请提交成功，我们会在30天内处理您的申请'
    });

  } catch (error) {
    console.error('提交友链申请失败:', error);
    res.status(500).json({
      success: false,
      message: '提交申请失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取申请列表（管理员）
 */
export const getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const result = await FriendLinkApplication.getApplications({
      page: parseInt(page),
      limit: parseInt(limit),
      status: status === 'all' ? null : status,
      search: search.trim() || null,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: result,
      message: '获取申请列表成功'
    });

  } catch (error) {
    console.error('获取申请列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取申请列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取申请统计（管理员）
 */
export const getApplicationStats = async (req, res) => {
  try {
    const stats = await FriendLinkApplication.getStats();

    res.json({
      success: true,
      data: stats,
      message: '获取申请统计成功'
    });

  } catch (error) {
    console.error('获取申请统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取申请统计失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取单个申请详情（管理员）
 */
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await FriendLinkApplication.findByPk(id, {
      attributes: {
        exclude: ['verification_token']
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申请不存在'
      });
    }

    res.json({
      success: true,
      data: application,
      message: '获取申请详情成功'
    });

  } catch (error) {
    console.error('获取申请详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取申请详情失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 批准友链申请
 */
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, addToFriendLinks = true } = req.body;
    const adminId = req.user.id;

    const application = await FriendLinkApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申请不存在'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能处理待审核的申请'
      });
    }

    // 批准申请
    await application.approve(adminId, note);

    // 如果选择添加到友链列表
    if (addToFriendLinks) {
      try {
        // 获取当前友链列表
        const friendLinksSettings = await SystemSetting.findOne({
          where: { setting_key: 'friend_links' }
        });

        let friendLinks = [];
        if (friendLinksSettings && friendLinksSettings.setting_value) {
          try {
            friendLinks = JSON.parse(friendLinksSettings.setting_value);
          } catch (e) {
            friendLinks = [];
          }
        }

        // 检查是否已存在
        const exists = friendLinks.some(link => 
          link.url === application.site_url || link.name === application.site_name
        );

        if (!exists) {
          // 添加新友链
          friendLinks.push({
            name: application.site_name,
            url: application.site_url,
            icon: application.site_icon,
            description: application.site_description
          });

          // 更新友链设置
          await SystemSetting.setSetting('friend_links', friendLinks, 'json');
        }
      } catch (error) {
        console.error('添加到友链列表失败:', error);
        // 不影响申请批准，只记录错误
      }
    }

    // 异步发送审核通过邮件（管理员 + 申请人），不阻塞响应
    try {
      const emailService = new EmailService();
      const payload = {
        site_name: application.site_name,
        site_url: application.site_url,
        site_description: application.site_description,
        site_icon: application.site_icon,
        admin_email: application.admin_email,
        admin_qq: application.admin_qq
      };
      emailService
        .sendFriendLinkDecisionEmails({ application: payload, decision: 'approved', note: note || '' })
        .catch(err => console.error('友链审核通过邮件发送失败:', err?.message || err));
    } catch (e) {
      console.error('触发友链审核通过邮件失败:', e?.message || e);
    }

    res.json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        processed_at: application.processed_at
      },
      message: '申请已批准'
    });

  } catch (error) {
    console.error('批准申请失败:', error);
    res.status(500).json({
      success: false,
      message: '批准申请失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 拒绝友链申请
 */
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user.id;

    const application = await FriendLinkApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申请不存在'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能处理待审核的申请'
      });
    }

    // 拒绝申请
    await application.reject(adminId, note);

    // 异步发送审核拒绝邮件（管理员 + 申请人），不阻塞响应
    try {
      const emailService = new EmailService();
      const payload = {
        site_name: application.site_name,
        site_url: application.site_url,
        site_description: application.site_description,
        site_icon: application.site_icon,
        admin_email: application.admin_email,
        admin_qq: application.admin_qq
      };
      emailService
        .sendFriendLinkDecisionEmails({ application: payload, decision: 'rejected', note: note || '' })
        .catch(err => console.error('友链审核拒绝邮件发送失败:', err?.message || err));
    } catch (e) {
      console.error('触发友链审核拒绝邮件失败:', e?.message || e);
    }

    res.json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        processed_at: application.processed_at
      },
      message: '申请已拒绝'
    });

  } catch (error) {
    console.error('拒绝申请失败:', error);
    res.status(500).json({
      success: false,
      message: '拒绝申请失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 批量处理申请
 */
export const batchProcessApplications = async (req, res) => {
  try {
    const { ids, action, note } = req.body;
    const adminId = req.user.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要处理的申请'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '操作类型不正确'
      });
    }

    const applications = await FriendLinkApplication.findAll({
      where: {
        id: ids,
        status: 'pending'
      }
    });

    if (applications.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有找到可处理的申请'
      });
    }

    const results = [];

    for (const application of applications) {
      try {
        if (action === 'approve') {
          await application.approve(adminId, note);
        } else {
          await application.reject(adminId, note);
        }

        // 异步发送审核结果邮件（批量）
        try {
          const emailService = new EmailService();
          const payload = {
            site_name: application.site_name,
            site_url: application.site_url,
            site_description: application.site_description,
            site_icon: application.site_icon,
            admin_email: application.admin_email,
            admin_qq: application.admin_qq
          };
          emailService
            .sendFriendLinkDecisionEmails({ application: payload, decision: action === 'approve' ? 'approved' : 'rejected', note: note || '' })
            .catch(err => console.error('友链批量审核结果邮件发送失败:', err?.message || err));
        } catch (e) {
          console.error('触发友链批量审核结果邮件失败:', e?.message || e);
        }

        results.push({
          id: application.id,
          site_name: application.site_name,
          success: true,
          status: application.status
        });
      } catch (error) {
        results.push({
          id: application.id,
          site_name: application.site_name,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      },
      message: `批量${action === 'approve' ? '批准' : '拒绝'}处理完成`
    });

  } catch (error) {
    console.error('批量处理申请失败:', error);
    res.status(500).json({
      success: false,
      message: '批量处理失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 删除申请记录（管理员）
 */
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await FriendLinkApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: '申请不存在'
      });
    }

    await application.destroy();

    res.json({
      success: true,
      message: '申请记录已删除'
    });

  } catch (error) {
    console.error('删除申请失败:', error);
    res.status(500).json({
      success: false,
      message: '删除申请失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 清理过期申请（定时任务或手动触发）
 */
export const cleanupExpiredApplications = async (req, res) => {
  try {
    const expiredCount = await FriendLinkApplication.cleanupExpired();

    res.json({
      success: true,
      data: {
        expired_count: expiredCount
      },
      message: `已清理 ${expiredCount} 个过期申请`
    });

  } catch (error) {
    console.error('清理过期申请失败:', error);
    res.status(500).json({
      success: false,
      message: '清理过期申请失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
