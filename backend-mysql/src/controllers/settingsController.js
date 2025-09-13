/**
 * 系统设置控制器
 * 处理系统设置相关的HTTP请求
 */

import { SettingsService } from '../services/SettingsService.js';

/**
 * 获取公开的系统设置
 */
export const getPublicSettings = async (req, res) => {
  try {
    const settingsService = new SettingsService();
    const settings = await settingsService.getPublicSettings();
    
    res.json({
      success: true,
      data: settings,
      message: '获取公开设置成功'
    });
  } catch (error) {
    console.error('获取公开设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公开设置失败',
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
    const settingsService = new SettingsService();
    
    let settings;
    if (category) {
      // 如果指定了分类，只返回该分类的设置
      const allSettings = await settingsService.getAllSettings();
      settings = allSettings[category] || {};
    } else {
      // 返回所有设置，按分类分组
      settings = await settingsService.getAllSettings();
    }
    
    console.log('getAllSettings - 返回的设置数据:', JSON.stringify(settings, null, 2));
    
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
        message: 'setting_key 不能为空'
      });
    }
    
    const settingsService = new SettingsService();
    const success = await settingsService.updateSetting(setting_key, setting_value, setting_type);
    
    if (success) {
      res.json({
        success: true,
        message: '设置更新成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '设置更新失败'
      });
    }
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 批量更新系统设置
 */
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: '请求数据必须是数组格式'
      });
    }
    
    const settingsService = new SettingsService();
    
    console.log('updateSettings - 接收到的更新数据:', JSON.stringify(updates, null, 2));
    
    // 批量更新设置
    await settingsService.updateSettings(updates);
    
    res.json({
      success: true,
      data: updates,
      message: `批量更新 ${updates.length} 个设置成功`
    });
  } catch (error) {
    console.error('批量更新设置失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新设置失败',
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
    
    if (!setting_key) {
      return res.status(400).json({
        success: false,
        message: 'setting_key 不能为空'
      });
    }
    
    const settingsService = new SettingsService();
    const success = await settingsService.deleteSetting(setting_key);
    
    if (success) {
      res.json({
        success: true,
        message: '设置删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '设置不存在'
      });
    }
  } catch (error) {
    console.error('删除设置失败:', error);
    res.status(500).json({
      success: false,
      message: '删除设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取网站基本信息
 */
export const getWebsiteInfo = async (req, res) => {
  try {
    const settingsService = new SettingsService();
    const allSettings = await settingsService.getPublicSettings();
    
    // 从公开设置中提取网站信息
    const websiteInfo = {
      site_name: allSettings.website?.site_name?.value || '工具导航站点',
      site_url: allSettings.website?.site_url?.value || '',
      site_icon: allSettings.website?.site_icon?.value || '/favicon.ico',
      site_description: allSettings.website?.site_description?.value || '为开发者、设计师和效率工具爱好者精心收集的工具导航站点',
      icp_number: allSettings.website?.icp_number?.value || '',
      show_icp: allSettings.website?.show_icp?.value || false,
      friend_links: allSettings.website?.friend_links?.value || []
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