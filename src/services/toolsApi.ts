/**
 * 工具相关API服务
 */

import { apiGet, apiPost, apiPut, apiDelete, ApiResponse, PaginatedResponse, apiWithRetry } from '@/lib/api';
import type { Tool } from '@/types';

/**
 * 获取认证头
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * 工具查询参数
 */
export interface ToolsQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  limit?: number;
  /** 分类筛选 */
  category?: string;
  /** 是否精选 */
  featured?: boolean;
  /** 状态筛选 */
  status?: 'active' | 'inactive' | 'maintenance';
  /** 搜索关键词 */
  q?: string;
  /** 排序方式 */
  sort?: 'default' | 'name' | 'views' | 'clicks' | 'rating' | 'latest' | 'weight';
}

/**
 * 工具统计信息
 */
export interface ToolStats {
  totalTools: number;
  activeTools: number;
  featuredTools: number;
  categoryStats: Array<{
    category: string;
    count: number;
  }>;
  recentlyAdded: number;
}

/**
 * 工具创建/更新数据
 */
export interface ToolFormData {
  id: string;
  name: string;
  description: string;
  icon?: string;
  icon_url?: string;
  icon_theme?: 'auto' | 'auto-light' | 'auto-dark' | 'light' | 'dark' | 'none';
  category: string;
  tags?: string[];
  url: string;
  featured?: boolean;
  sort_order?: number;
}

/**
 * 工具API服务类
 */
export class ToolsApiService {
  /**
   * 获取工具列表
   */
  static async getTools(params?: ToolsQueryParams): Promise<ApiResponse<{
    tools: Tool[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>> {
    return apiWithRetry(() => apiGet<{
      tools: Tool[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>('/tools', params));
  }

  /**
   * 获取单个工具详情
   */
  static async getTool(id: string): Promise<ApiResponse<Tool>> {
    return apiWithRetry(() => apiGet<Tool>(`/tools/${id}`));
  }

  /**
   * 获取精选工具
   */
  static async getFeaturedTools(limit?: number): Promise<ApiResponse<Tool[]>> {
    const params = limit ? { limit } : undefined;
    return apiWithRetry(() => apiGet<Tool[]>('/tools/featured', params));
  }

  /**
   * 获取工具统计信息
   */
  static async getToolStats(): Promise<ApiResponse<ToolStats>> {
    return apiWithRetry(() => apiGet<ToolStats>('/tools/stats'));
  }

  /**
   * 创建工具
   */
  static async createTool(data: any, iconFile?: File): Promise<ApiResponse<Tool>> {
    const formData = new FormData();
    
    // 添加基础数据
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'tags' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // 添加图标文件
    if (iconFile) {
      formData.append('iconFile', iconFile);
    }

    // 使用fetch直接调用以支持认证头
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tools`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    
    const result = await response.json();
    return result;
  }

  /**
   * 更新工具
   */
  static async updateTool(id: string, data: Partial<ToolFormData>, iconFile?: File): Promise<ApiResponse<Tool>> {
    const formData = new FormData();
    
    // 添加基础数据
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'tags' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // 添加图标文件
    if (iconFile) {
      formData.append('iconFile', iconFile);
    }

    // 使用fetch直接调用以支持认证头
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tools/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: formData
    });
    
    const result = await response.json();
    return result;
  }

  /**
   * 删除工具
   */
  static async deleteTool(id: string): Promise<ApiResponse<void>> {
    // 使用fetch直接调用以支持认证头
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tools/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    const result = await response.json();
    return result;
  }


  /**
   * 工具评分
   */
  static async rateTool(id: string, rating: number): Promise<ApiResponse<void>> {
    return apiPost(`/tools/${id}/rate`, { rating });
  }

  /**
   * 上传工具图标
   */
  static async uploadIcon(file: File): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('iconFile', file);
    
    return apiPost<{ url: string; filename: string }>('/tools/upload/icon', formData);
  }
}

// 导出默认实例
export const toolsApi = ToolsApiService;
