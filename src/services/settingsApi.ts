/**
 * 系统设置 API 服务
 */

import { apiGet, apiPut, apiDelete } from '@/lib/api';

// 系统设置类型定义
export interface SystemSetting {
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  category?: string;
  is_public?: boolean;
}

export interface WebsiteInfo {
  site_name: string;
  site_description: string;
  icp_number: string;
  show_icp: boolean;
  friend_links?: Array<{ name: string; url: string; icon?: string }>;
}

export interface SettingsUpdateData {
  setting_key: string;
  setting_value: any;
  setting_type?: 'string' | 'number' | 'boolean' | 'json';
}

/**
 * 系统设置 API 类
 */
export class SettingsApi {
  private baseUrl = '/settings';

  /**
   * 获取公开的系统设置
   */
  async getPublicSettings() {
    try {
      const response = await apiGet(`${this.baseUrl}/public`);
      return response;
    } catch (error) {
      console.error('获取公开设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取网站基本信息
   */
  async getWebsiteInfo() {
    try {
      const response = await apiGet<WebsiteInfo>(`${this.baseUrl}/website`);
      return response;
    } catch (error) {
      console.error('获取网站信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有系统设置（管理员）
   */
  async getAllSettings(category?: string) {
    try {
      const params = category ? { category } : {};
      const response = await apiGet(this.baseUrl, params);
      return response;
    } catch (error) {
      console.error('获取系统设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新单个系统设置
   */
  async updateSetting(settingData: SettingsUpdateData) {
    try {
      const response = await apiPut(this.baseUrl, settingData);
      return response;
    } catch (error) {
      console.error('更新系统设置失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新系统设置
   */
  async updateSettings(settings: SettingsUpdateData[]) {
    try {
      const response = await apiPut(`${this.baseUrl}/batch`, { settings });
      return response;
    } catch (error) {
      console.error('批量更新系统设置失败:', error);
      throw error;
    }
  }

  /**
   * 删除系统设置
   */
  async deleteSetting(settingKey: string) {
    try {
      const response = await apiDelete(`${this.baseUrl}/${settingKey}`);
      return response;
    } catch (error) {
      console.error('删除系统设置失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const settingsApi = new SettingsApi();
