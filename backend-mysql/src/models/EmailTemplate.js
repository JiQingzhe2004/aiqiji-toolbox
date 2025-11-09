import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
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
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'email_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['is_active'] }
  ]
});

export default EmailTemplate;
