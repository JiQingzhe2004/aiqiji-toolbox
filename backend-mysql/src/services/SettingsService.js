/**
 * 系统设置服务
 * 提供系统设置的读取和更新功能
 */

import sequelize from '../config/database.js';

export class SettingsService {
  constructor() {
    this.tableName = 'system_settings';
  }

  /**
   * 获取单个设置值
   */
  async getSettingValue(key) {
    try {
      const [results] = await sequelize.query(
        `SELECT setting_value, setting_type FROM ${this.tableName} WHERE setting_key = ? LIMIT 1`,
        {
          replacements: [key],
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (!results) {
        return null;
      }

      // 根据类型转换值
      return this.convertValue(results.setting_value, results.setting_type);
    } catch (error) {
      console.error(`获取设置 ${key} 失败:`, error);
      return null;
    }
  }

  /**
   * 获取多个设置值
   */
  async getSettings(keys) {
    try {
      const placeholders = keys.map(() => '?').join(',');
      const results = await sequelize.query(
        `SELECT setting_key, setting_value, setting_type FROM ${this.tableName} WHERE setting_key IN (${placeholders})`,
        {
          replacements: keys,
          type: sequelize.QueryTypes.SELECT
        }
      );

      const settings = {};
      results.forEach(row => {
        settings[row.setting_key] = this.convertValue(row.setting_value, row.setting_type);
      });

      return settings;
    } catch (error) {
      console.error('获取多个设置失败:', error);
      return {};
    }
  }

  /**
   * 获取所有设置
   */
  async getAllSettings() {
    try {
      const results = await sequelize.query(
        `SELECT setting_key, setting_value, setting_type, description, category, is_public FROM ${this.tableName}`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );

      const settings = {
        website: {},
        general: {},
        email: {}
      };

      results.forEach(row => {
        const category = row.category || 'general';
        if (!settings[category]) {
          settings[category] = {};
        }

        settings[category][row.setting_key] = {
          value: this.convertValue(row.setting_value, row.setting_type),
          description: row.description,
          type: row.setting_type,
          is_public: !!row.is_public
        };
      });

      return settings;
    } catch (error) {
      console.error('获取所有设置失败:', error);
      return { website: {}, general: {}, email: {} };
    }
  }

  /**
   * 获取公开设置
   */
  async getPublicSettings() {
    try {
      const results = await sequelize.query(
        `SELECT setting_key, setting_value, setting_type, description, category FROM ${this.tableName} WHERE is_public = 1`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );

      const settings = {};
      results.forEach(row => {
        const category = row.category || 'general';
        if (!settings[category]) {
          settings[category] = {};
        }

        settings[category][row.setting_key] = {
          value: this.convertValue(row.setting_value, row.setting_type),
          description: row.description,
          type: row.setting_type
        };
      });

      return settings;
    } catch (error) {
      console.error('获取公开设置失败:', error);
      return {};
    }
  }

  /**
   * 更新设置值
   */
  async updateSetting(key, value, type = 'string') {
    try {
      // 转换值为字符串存储
      const stringValue = this.valueToString(value, type);

      // 先尝试更新
      const [result] = await sequelize.query(
        `UPDATE ${this.tableName} SET setting_value = ?, setting_type = ?, updated_at = NOW() WHERE setting_key = ?`,
        {
          replacements: [stringValue, type, key]
        }
      );

      // 如果更新成功（受影响行数 > 0），直接返回
      if (result.affectedRows > 0) {
        return true;
      }

      // 如果更新失败（记录不存在），尝试插入
      // 注意：这里假设 setting_key 有唯一约束，如果没有，可能需要先检查
      try {
        const id = `${key}-${Date.now()}`;
        await sequelize.query(
          `INSERT INTO ${this.tableName} (id, setting_key, setting_value, setting_type, description, category, is_public, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          {
            replacements: [id, key, stringValue, type, this.getSettingDescription(key), this.getSettingCategory(key), this.getSettingIsPublic(key) ? 1 : 0]
          }
        );
        return true;
      } catch (insertError) {
        // 如果插入也失败（可能是唯一约束冲突），再次尝试更新
        // 这可能发生在并发情况下
        const [retryResult] = await sequelize.query(
          `UPDATE ${this.tableName} SET setting_value = ?, setting_type = ?, updated_at = NOW() WHERE setting_key = ?`,
          {
            replacements: [stringValue, type, key]
          }
        );
        return retryResult.affectedRows > 0;
      }
    } catch (error) {
      console.error(`更新设置 ${key} 失败:`, error);
      throw error;
    }
  }

  /**
   * 批量更新设置
   */
  async updateSettings(settings) {
    const transaction = await sequelize.transaction();
    
    try {
      for (const setting of settings) {
        const { setting_key, setting_value, setting_type = 'string' } = setting;
        const stringValue = this.valueToString(setting_value, setting_type);

        // 确定正确的分类
        const category = this.getSettingCategory(setting_key);

        // 先尝试更新，如果不存在则插入
        const [updateResult] = await sequelize.query(
          `UPDATE ${this.tableName} SET setting_value = ?, setting_type = ?, category = ?, updated_at = NOW() WHERE setting_key = ?`,
          {
            replacements: [stringValue, setting_type, category, setting_key],
            transaction
          }
        );

        // 如果更新没有影响行数（即记录不存在），则插入
        if (updateResult.affectedRows === 0) {
          const id = `${setting_key}-${Date.now()}`;
          await sequelize.query(
            `INSERT INTO ${this.tableName} (id, setting_key, setting_value, setting_type, category, description, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            {
              replacements: [id, setting_key, stringValue, setting_type, category, this.getSettingDescription(setting_key), this.getSettingIsPublic(setting_key)],
              transaction
            }
          );
        }
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('批量更新设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取设置的分类
   */
  getSettingCategory(settingKey) {
    const websiteKeys = [
      'site_name', 'site_url', 'site_icon', 'site_description', 
      'icp_number', 'show_icp', 'friend_links'
    ];
    
    const emailKeys = [
      'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass',
      'from_name', 'from_email', 'email_enabled'
    ];
    
    if (websiteKeys.includes(settingKey)) {
      return 'website';
    } else if (emailKeys.includes(settingKey)) {
      return 'email';
    }
    
    return 'general';
  }

  /**
   * 获取设置的描述
   */
  getSettingDescription(settingKey) {
    const descriptions = {
      'smtp_host': 'SMTP服务器地址',
      'smtp_port': 'SMTP端口',
      'smtp_secure': '是否启用SSL/TLS',
      'smtp_user': 'SMTP用户名',
      'smtp_pass': 'SMTP密码',
      'from_name': '发件人名称',
      'from_email': '发件人邮箱',
      'email_enabled': '是否启用邮件功能',
      'ai_models': 'AI模型预设列表'
    };
    
    return descriptions[settingKey] || '';
  }

  /**
   * 获取设置是否公开
   */
  getSettingIsPublic(settingKey) {
    const emailKeys = [
      'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass',
      'from_name', 'from_email', 'email_enabled'
    ];
    
    // 邮箱设置不公开
    return emailKeys.includes(settingKey) ? 0 : 1;
  }

  /**
   * 创建新设置
   */
  async createSetting(key, value, type = 'string', description = '', category = 'general', isPublic = false) {
    try {
      const stringValue = this.valueToString(value, type);
      const id = `${key}-${Date.now()}`;

      await sequelize.query(
        `INSERT INTO ${this.tableName} (id, setting_key, setting_value, setting_type, description, category, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [id, key, stringValue, type, description, category, isPublic ? 1 : 0]
        }
      );

      return true;
    } catch (error) {
      console.error(`创建设置 ${key} 失败:`, error);
      throw error;
    }
  }

  /**
   * 删除设置
   */
  async deleteSetting(key) {
    try {
      const [result] = await sequelize.query(
        `DELETE FROM ${this.tableName} WHERE setting_key = ?`,
        {
          replacements: [key]
        }
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error(`删除设置 ${key} 失败:`, error);
      throw error;
    }
  }

  /**
   * 检查设置是否存在
   */
  async settingExists(key) {
    try {
      const [results] = await sequelize.query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE setting_key = ?`,
        {
          replacements: [key],
          type: sequelize.QueryTypes.SELECT
        }
      );

      return results.count > 0;
    } catch (error) {
      console.error(`检查设置 ${key} 是否存在失败:`, error);
      return false;
    }
  }

  /**
   * 根据类型转换值
   */
  convertValue(value, type) {
    if (value === null || value === undefined) {
      return null;
    }

    switch (type) {
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return !!value;
      
      case 'number':
        return parseFloat(value);
      
      case 'json':
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (error) {
          console.error('JSON解析失败:', error);
          return null;
        }
      
      case 'string':
      default:
        return String(value);
    }
  }

  /**
   * 将值转换为字符串存储
   */
  valueToString(value, type) {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type) {
      case 'boolean':
        return value ? 'true' : 'false';
      
      case 'number':
        return String(value);
      
      case 'json':
        return typeof value === 'string' ? value : JSON.stringify(value);
      
      case 'string':
      default:
        return String(value);
    }
  }

  /**
   * 重置设置为默认值
   */
  async resetToDefaults() {
    // 这里可以实现重置逻辑
    // 根据需要恢复默认设置
    console.log('重置设置为默认值');
  }

  /**
   * 获取设置统计信息
   */
  async getStats() {
    try {
      const [results] = await sequelize.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_count,
          COUNT(CASE WHEN category = 'website' THEN 1 END) as website_count,
          COUNT(CASE WHEN category = 'email' THEN 1 END) as email_count,
          COUNT(CASE WHEN category = 'general' THEN 1 END) as general_count
         FROM ${this.tableName}`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );

      return results;
    } catch (error) {
      console.error('获取设置统计失败:', error);
      return {
        total: 0,
        public_count: 0,
        website_count: 0,
        email_count: 0,
        general_count: 0
      };
    }
  }
}

// 导出单例实例
export const settingsService = new SettingsService();
export default SettingsService;
