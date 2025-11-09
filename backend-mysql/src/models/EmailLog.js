import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  recipients: {
    // store as JSON string of string[]
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  html: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  text: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  attachments: {
    // JSON string of array: { filename, path, mime, size }
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('success', 'partial', 'failed'),
    defaultValue: 'success',
    allowNull: false,
  },
  success_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  fail_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  error: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  }
}, {
  tableName: 'email_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

export default EmailLog;
