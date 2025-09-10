/**
 * 系统设置控制器
 * 处理系统设置相关的HTTP请求
 */

import SystemSetting from '../models/SystemSetting.js';

/**
 * 获取公开的系统设置
 */
export const getPublicSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.getPublicSettings();
    
    res.json({
      success: true,
      data: settings,
      message: '获取系统设置成功'
    });
  } catch (error) {
    console.error('获取公开设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取所有系统设置（管理员）
 */
export const getAllSettings = async (req, res) => {
  try {
    const { category } = req.query;
    
    let settings;
    if (category) {
      settings = await SystemSetting.getSettingsByCategory(category);
    } else {
      const allSettings = await SystemSetting.findAll({
        attributes: ['setting_key', 'setting_value', 'setting_type', 'description', 'category', 'is_public'],
        order: [['category', 'ASC'], ['setting_key', 'ASC']]
      });
      
      settings = {};
      allSettings.forEach(setting => {
        if (!settings[setting.category]) {
          settings[setting.category] = {};
        }
        settings[setting.category][setting.setting_key] = {
          value: setting.getFormattedValue(),
          description: setting.description,
          type: setting.setting_type,
          is_public: setting.is_public
        };
      });
    }
    
    res.json({
      success: true,
      data: settings,
      message: '获取系统设置成功'
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 更新系统设置
 */
export const updateSetting = async (req, res) => {
  try {
    const { setting_key, setting_value, setting_type = 'string' } = req.body;
    
    if (!setting_key) {
      return res.status(400).json({
        success: false,
        message: '设置键不能为空'
      });
    }
    
    const setting = await SystemSetting.setSetting(setting_key, setting_value, setting_type);
    
    res.json({
      success: true,
      data: {
        setting_key: setting.setting_key,
        setting_value: setting.getFormattedValue(),
        setting_type: setting.setting_type
      },
      message: '更新设置成功'
    });
  } catch (error) {
    console.error('更新系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新系统设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 批量更新系统设置
 */
export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: '设置数据格式不正确'
      });
    }
    
    const results = [];
    
    for (const { setting_key, setting_value, setting_type = 'string' } of settings) {
      if (!setting_key) continue;
      
      try {
        const setting = await SystemSetting.setSetting(setting_key, setting_value, setting_type);
        results.push({
          setting_key: setting.setting_key,
          setting_value: setting.getFormattedValue(),
          setting_type: setting.setting_type,
          success: true
        });
      } catch (error) {
        results.push({
          setting_key,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: results,
      message: '批量更新设置完成'
    });
  } catch (error) {
    console.error('批量更新系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新系统设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 删除系统设置
 */
export const deleteSetting = async (req, res) => {
  try {
    const { setting_key } = req.params;
    
    const setting = await SystemSetting.findOne({
      where: { setting_key }
    });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: '设置不存在'
      });
    }
    
    await setting.destroy();
    
    res.json({
      success: true,
      message: '删除设置成功'
    });
  } catch (error) {
    console.error('删除系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '删除系统设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取网站基本信息（用于前端展示）
 */
export const getWebsiteInfo = async (req, res) => {
  try {
    const websiteSettings = await SystemSetting.getSettingsByCategory('website');
    
    const websiteInfo = {
      site_name: websiteSettings.site_name?.value || 'AiQiji工具箱',
      site_description: websiteSettings.site_description?.value || '为开发者、设计师和效率工具爱好者精心收集的工具导航站点',
      icp_number: websiteSettings.icp_number?.value || '',
      show_icp: websiteSettings.show_icp?.value || false,
      friend_links: Array.isArray(websiteSettings.friend_links?.value) ? websiteSettings.friend_links.value : []
    };
    
    res.json({
      success: true,
      data: websiteInfo,
      message: '获取网站信息成功'
    });
  } catch (error) {
    console.error('获取网站信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取网站信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
