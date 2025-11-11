/**
 * 邮箱变更日志模型
 */

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailChangeLog = sequelize.define('EmailChangeLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '用户ID'
  },
  old_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '旧邮箱'
  },
  new_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '新邮箱'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'revoked'),
    defaultValue: 'pending',
    comment: '状态：pending-待确认期, confirmed-已确认, revoked-已撤销'
  },
  revoke_token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: '撤销令牌'
  },
  revoke_expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '撤销期限'
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '撤销时间'
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '确认时间（过了冷静期自动确认）'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '操作IP地址'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理'
  }
}, {
  tableName: 'email_change_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['revoke_token'] },
    { fields: ['status'] },
    { fields: ['revoke_expires_at'] }
  ]
});

export default EmailChangeLog;
