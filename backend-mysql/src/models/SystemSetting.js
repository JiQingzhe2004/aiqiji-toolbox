/**
 * 系统设置数据模型
 */

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  setting_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
    field: 'setting_key',
  },
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'setting_value',
  },
  setting_type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string',
    allowNull: false,
    field: 'setting_type',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'general',
    allowNull: false,
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'is_public',
  },
}, {
  tableName: 'system_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['setting_key']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_public']
    }
  ]
});

// 实例方法 - 获取格式化的值
SystemSetting.prototype.getFormattedValue = function() {
  if (!this.setting_value) return null;
  
  switch (this.setting_type) {
    case 'number':
      return Number(this.setting_value);
    case 'boolean':
      return this.setting_value === 'true';
    case 'json':
      try {
        return JSON.parse(this.setting_value);
      } catch (e) {
        return null;
      }
    default:
      return this.setting_value;
  }
};

// 类方法 - 根据key获取设置值
SystemSetting.getSettingValue = async function(key) {
  const setting = await this.findOne({
    where: { setting_key: key }
  });
  
  return setting ? setting.getFormattedValue() : null;
};

// 类方法 - 设置值
SystemSetting.setSetting = async function(key, value, type = 'string') {
  let stringValue;
  
  switch (type) {
    case 'boolean':
      stringValue = String(Boolean(value));
      break;
    case 'number':
      stringValue = String(Number(value));
      break;
    case 'json':
      stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      break;
    default:
      stringValue = String(value || '');
  }
  
  // 根据 setting_key 确定正确的 category
  const getCategory = (settingKey) => {
    const websiteKeys = [
      'site_name', 'site_url', 'site_icon', 'site_description', 
      'icp_number', 'show_icp', 'friend_links'
    ];
    return websiteKeys.includes(settingKey) ? 'website' : 'general';
  };
  
  const category = getCategory(key);
  
  const [setting, created] = await this.findOrCreate({
    where: { setting_key: key },
    defaults: {
      setting_key: key,
      setting_value: stringValue,
      setting_type: type,
      category: category,
      is_public: category === 'website' ? true : true  // 网站相关设置都设为公开
    }
  });
  
  if (!created) {
    await setting.update({
      setting_value: stringValue,
      setting_type: type,
      category: category,
      is_public: category === 'website' ? true : setting.is_public  // 网站设置强制公开，其他保持原值
    });
  }
  
  return setting;
};

// 类方法 - 获取公开设置
SystemSetting.getPublicSettings = async function() {
  const settings = await this.findAll({
    where: { is_public: true },
    attributes: ['setting_key', 'setting_value', 'setting_type']
  });
  
  const result = {};
  settings.forEach(setting => {
    result[setting.setting_key] = setting.getFormattedValue();
  });
  
  return result;
};

// 类方法 - 获取分类设置
SystemSetting.getSettingsByCategory = async function(category) {
  const settings = await this.findAll({
    where: { category },
    attributes: ['setting_key', 'setting_value', 'setting_type', 'description']
  });
  
  const result = {};
  settings.forEach(setting => {
    result[setting.setting_key] = {
      value: setting.getFormattedValue(),
      description: setting.description
    };
  });
  
  return result;
};

export default SystemSetting;
