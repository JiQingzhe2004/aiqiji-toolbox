/**
 * 用户数据模型
 */

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  display_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100],
    },
    field: 'display_name',
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isValidUrl: function(value) {
        if (!value) return;
        // 允许相对路径（/static/...）或完整URL
        if (value.startsWith('/')) return;
        if (value.startsWith('http://') || value.startsWith('https://')) return;
        if (value.startsWith('data:image/')) return; // SVG data URLs
        throw new Error('头像链接格式不正确');
      }
    },
    field: 'avatar_url',
  },
  avatar_file: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'avatar_file',
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash', // 数据库字段名
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false,
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at',
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'login_attempts',
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'locked_until',
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['status']
    }
  ]
});

// 实例方法 - 检查账户是否被锁定
User.prototype.isLocked = function() {
  return this.locked_until && this.locked_until > Date.now();
};

// 实例方法 - 增加登录失败次数
User.prototype.incrementLoginAttempts = async function() {
  // 如果账户已锁定且锁定时间已过，重置计数器
  if (this.locked_until && this.locked_until < Date.now()) {
    return this.update({
      login_attempts: 1,
      locked_until: null
    });
  }

  const updates = { login_attempts: this.login_attempts + 1 };
  
  // 如果达到最大尝试次数，锁定账户
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30分钟
  
  if (this.login_attempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.locked_until = Date.now() + lockTime;
  }
  
  return this.update(updates);
};

// 实例方法 - 重置登录失败次数
User.prototype.resetLoginAttempts = async function() {
  return this.update({
    login_attempts: 0,
    locked_until: null,
    last_login_at: new Date()
  });
};

export default User;
