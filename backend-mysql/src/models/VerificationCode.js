/**
 * 验证码数据模型
 */

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export class VerificationCode extends Model {}

VerificationCode.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '验证码ID'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '邮箱地址',
    validate: {
      isEmail: true
    }
  },
  code: {
    type: DataTypes.STRING(255), // 增加长度以存储bcrypt hash
    allowNull: false,
    comment: '验证码（bcrypt加密）'
  },
  code_type: {
    type: DataTypes.ENUM('register', 'login', 'reset_password', 'email_change'),
    allowNull: false,
    comment: '验证码类型'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '过期时间'
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已使用'
  },
  used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '使用时间'
  },
  send_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '发送次数'
  },
  last_send_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后发送时间'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '请求IP地址'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理信息'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  sequelize,
  modelName: 'VerificationCode',
  tableName: 'verification_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_email_type',
      fields: ['email', 'code_type']
    },
    {
      name: 'idx_code_type_used',
      fields: ['code', 'code_type', 'is_used']
    },
    {
      name: 'idx_expires_at',
      fields: ['expires_at']
    },
    {
      name: 'idx_created_at',
      fields: ['created_at']
    }
  ],
  comment: '邮箱验证码表'
});

export default VerificationCode;
