/**
 * 友链申请API服务
 * 处理友链申请相关的API调用
 */

const API_BASE = '/api/v1/friend-links';

export interface FriendLinkApplicationData {
  site_name: string;
  site_url: string;
  site_description: string;
  site_icon?: string;
  admin_email: string;
  admin_qq?: string;
}

export interface FriendLinkApplication {
  id: string;
  site_name: string;
  site_url: string;
  site_description: string;
  site_icon?: string;
  admin_email: string;
  admin_qq?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  admin_note?: string;
  processed_by?: string;
  processed_at?: string;
  ip_address?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  recent_week: number;
  recent_month: number;
}

export interface ApplicationsResponse {
  applications: FriendLinkApplication[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

class FriendLinkApi {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  /**
   * 提交友链申请
   */
  async submitApplication(applicationData: FriendLinkApplicationData) {
    return this.request('/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  /**
   * 获取申请列表（管理员）
   */
  async getApplications(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/applications?${queryString}` : '/applications';
    
    return this.request(endpoint);
  }

  /**
   * 获取申请统计（管理员）
   */
  async getApplicationStats() {
    return this.request('/applications/stats');
  }

  /**
   * 获取单个申请详情（管理员）
   */
  async getApplicationById(id: string) {
    return this.request(`/applications/${id}`);
  }

  /**
   * 批准友链申请
   */
  async approveApplication(id: string, data: { note?: string; addToFriendLinks?: boolean }) {
    return this.request(`/applications/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 拒绝友链申请
   */
  async rejectApplication(id: string, data: { note?: string }) {
    return this.request(`/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 批量处理申请
   */
  async batchProcessApplications(data: {
    ids: string[];
    action: 'approve' | 'reject';
    note?: string;
  }) {
    return this.request('/applications/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 删除申请记录
   */
  async deleteApplication(id: string) {
    return this.request(`/applications/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * 清理过期申请
   */
  async cleanupExpiredApplications() {
    return this.request('/cleanup-expired', {
      method: 'POST',
    });
  }
}

export const friendLinkApi = new FriendLinkApi();
