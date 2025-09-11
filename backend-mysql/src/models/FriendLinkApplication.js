/**
 * 友链申请数据模型
 * 处理友链申请的数据库操作
 */

import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

const FriendLinkApplication = sequelize.define('FriendLinkApplication', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false
  },
  site_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '网站名称'
  },
  site_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '网站地址',
    validate: {
      isUrl: true
    }
  },
  site_description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '网站描述'
  },
  site_icon: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '网站图标地址',
    validate: {
      isUrl: {
        args: true,
        msg: '图标地址格式不正确'
      }
    }
  },
  admin_email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '管理员邮箱',
    validate: {
      isEmail: true
    }
  },
  admin_qq: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '管理员QQ'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
    defaultValue: 'pending',
    comment: '申请状态：pending-待审核，approved-已通过，rejected-已拒绝，expired-已过期'
  },
  admin_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '管理员备注'
  },
  processed_by: {
    type: DataTypes.STRING(36),
    allowNull: true,
    comment: '处理人ID'
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '申请人IP地址'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '申请人浏览器信息'
  },
  verification_token: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '验证令牌'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '申请过期时间'
  }
}, {
  tableName: 'friend_link_applications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['admin_email']
    },
    {
      fields: ['site_url']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['expires_at']
    }
  ]
});

// 静态方法：获取申请列表（分页）
FriendLinkApplication.getApplications = async function(options = {}) {
  const {
    page = 1,
    limit = 20,
    status = null,
    search = null,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = options;

  const offset = (page - 1) * limit;
  const where = {};

  // 状态筛选
  if (status && status !== 'all') {
    where.status = status;
  }

  // 搜索功能
  if (search) {
    where[Op.or] = [
      { site_name: { [Op.like]: `%${search}%` } },
      { site_url: { [Op.like]: `%${search}%` } },
      { admin_email: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows } = await this.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    attributes: {
      exclude: ['user_agent', 'verification_token']
    }
  });

  return {
    applications: rows,
    pagination: {
      current_page: parseInt(page),
      per_page: parseInt(limit),
      total: count,
      total_pages: Math.ceil(count / limit),
      has_next: page * limit < count,
      has_prev: page > 1
    }
  };
};

// 静态方法：获取统计信息
FriendLinkApplication.getStats = async function() {
  const [stats] = await sequelize.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_week,
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent_month
    FROM friend_link_applications
  `);

  return stats[0] || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    recent_week: 0,
    recent_month: 0
  };
};

// 实例方法：批准申请
FriendLinkApplication.prototype.approve = async function(adminId, note = null) {
  this.status = 'approved';
  this.processed_by = adminId;
  this.processed_at = new Date();
  if (note) {
    this.admin_note = note;
  }
  await this.save();
  return this;
};

// 实例方法：拒绝申请
FriendLinkApplication.prototype.reject = async function(adminId, note = null) {
  this.status = 'rejected';
  this.processed_by = adminId;
  this.processed_at = new Date();
  if (note) {
    this.admin_note = note;
  }
  await this.save();
  return this;
};

// 实例方法：检查是否过期
FriendLinkApplication.prototype.checkExpiry = function() {
  if (this.expires_at && new Date() > this.expires_at && this.status === 'pending') {
    this.status = 'expired';
    return true;
  }
  return false;
};

// 静态方法：清理过期申请
FriendLinkApplication.cleanupExpired = async function() {
  const expiredCount = await this.update(
    { status: 'expired' },
    {
      where: {
        status: 'pending',
        expires_at: {
          [Op.lt]: new Date()
        }
      }
    }
  );
  return expiredCount[0];
};

export default FriendLinkApplication;
