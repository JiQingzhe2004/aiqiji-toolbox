/**
 * 系统设置 API 服务
 */

import { apiGet, apiPut, apiDelete, apiPost } from '@/lib/api';

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
  site_url: string;
  site_icon: string;
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
 * AI 模型预设类型定义
 * name: 预设名称（用于显示和识别）
 * provider: 提供商（如：openai, zhipu, etc.）
 * model: 模型名称（如：glm-4.5, gpt-4, etc.）- 这是实际使用的模型标识
 * base_url: API 基础地址
 * api_key: API 密钥
 * description: 预设描述（可选）
 */
export interface AiModelPreset {
  id?: string;
  name: string;
  provider: string;
  model: string;
  base_url: string;
  api_key: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
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

  /** ===== AI 模型预设管理 ===== */
  async getAiModels() {
    return apiGet<{ items: AiModelPreset[] }>(`${this.baseUrl}/ai-models`);
  }

  async createAiModel(preset: Omit<AiModelPreset, 'id' | 'created_at' | 'updated_at'>) {
    return apiPost(`${this.baseUrl}/ai-models`, preset);
  }

  async updateAiModel(id: string, patch: Partial<Omit<AiModelPreset, 'id' | 'created_at' | 'updated_at'>>) {
    return apiPut(`${this.baseUrl}/ai-models/${id}`, patch);
  }

  async deleteAiModel(id: string) {
    return apiDelete(`${this.baseUrl}/ai-models/${id}`);
  }

  async applyAiModel(id: string) {
    return apiPost(`${this.baseUrl}/ai-models/${id}/apply`, {});
  }

  /**
   * 获取网站基本信息
   */
  async getWebsiteInfo() {
    try {
      const response = await apiGet<WebsiteInfo>(`${this.baseUrl}/website`);
      if ((response as any)?.success && (response as any)?.data) {
        return (response as any).data as WebsiteInfo;
      }
      throw new Error('获取网站信息失败');
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
      const response = await apiPut(`${this.baseUrl}/batch`, settings);
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

  /**
   * 获取公开的网站信息
   */
  async getPublicWebsiteInfo(): Promise<WebsiteInfo> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'}/settings/public`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const settings = result.data;
        return {
          site_name: settings.site_name || '',
          site_url: settings.site_url || '',
          site_icon: settings.site_icon || '',
          site_description: settings.site_description || '',
          icp_number: settings.icp_number || '',
          show_icp: settings.show_icp || false,
          friend_links: settings.friend_links || []
        };
      }
      
      throw new Error('获取网站信息失败');
    } catch (error) {
      console.error('获取公开网站信息失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const settingsApi = new SettingsApi();
