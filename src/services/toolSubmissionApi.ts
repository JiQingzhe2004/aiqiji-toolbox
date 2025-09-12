import axios from 'axios';

// 创建API实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  timeout: 10000,
});

// 添加请求拦截器以自动添加认证头
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 添加响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除过期的token
      localStorage.removeItem('auth_token');
      // 可以在这里添加重定向到登录页面的逻辑
    }
    return Promise.reject(error);
  }
);

export interface ToolSubmission {
  id?: number;
  tool_id: string;
  name: string;
  description: string;
  url: string;
  category: string[];
  tags: string[];
  icon?: string;
  icon_url?: string;
  icon_file?: string;
  icon_theme?: 'auto' | 'auto-light' | 'auto-dark' | 'light' | 'dark' | 'none';
  submitter_name?: string;
  submitter_email?: string;
  submitter_contact?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'processing';
  reviewer_id?: number;
  review_comment?: string;
  reviewed_at?: string;
  priority?: number;
  source?: string;
  additional_info?: any;
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processing: number;
}

export interface SubmissionResponse {
  success: boolean;
  data?: {
    submission?: ToolSubmission;
    submissions?: ToolSubmission[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  message?: string;
  errors?: string[];
}

export interface BatchReviewResult {
  success: number;
  failed: number;
  errors: Array<{
    id: number;
    tool_id: string;
    error: string;
  }>;
}

export const toolSubmissionApi = {
  // 提交工具
  async submitTool(data: Partial<ToolSubmission>, iconFile?: File): Promise<SubmissionResponse> {
    try {
      const formData = new FormData();
      
      // 添加工具数据
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // 添加图标文件
      if (iconFile) {
        formData.append('icon', iconFile);
      }

      const response = await api.post('/tool-submissions/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('提交工具失败:', error);
      throw new Error(error.response?.data?.message || '提交工具失败');
    }
  },

  // 获取所有提交（管理员）
  async getAllSubmissions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sort?: string;
  }): Promise<SubmissionResponse> {
    try {
      const response = await api.get('/tool-submissions/admin/submissions', { params });
      return response.data;
    } catch (error: any) {
      console.error('获取提交列表失败:', error);
      throw new Error(error.response?.data?.message || '获取提交列表失败');
    }
  },

  // 获取提交详情
  async getSubmissionById(id: number): Promise<SubmissionResponse> {
    try {
      const response = await api.get(`/tool-submissions/admin/submissions/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('获取提交详情失败:', error);
      throw new Error(error.response?.data?.message || '获取提交详情失败');
    }
  },

  // 审核提交
  async reviewSubmission(
    id: number, 
    action: 'approve' | 'reject' | 'processing', 
    comment?: string
  ): Promise<SubmissionResponse> {
    try {
      const response = await api.post(`/tool-submissions/admin/submissions/${id}/review`, {
        action,
        comment
      });
      return response.data;
    } catch (error: any) {
      console.error('审核提交失败:', error);
      throw new Error(error.response?.data?.message || '审核提交失败');
    }
  },

  // 批量审核
  async batchReview(
    ids: number[], 
    action: 'approve' | 'reject' | 'processing', 
    comment?: string
  ): Promise<{ success: boolean; data: BatchReviewResult; message: string }> {
    try {
      const response = await api.post('/tool-submissions/admin/submissions/batch-review', {
        ids,
        action,
        comment
      });
      return response.data;
    } catch (error: any) {
      console.error('批量审核失败:', error);
      throw new Error(error.response?.data?.message || '批量审核失败');
    }
  },

  // 更新提交
  async updateSubmission(id: number, data: Partial<ToolSubmission>, iconFile?: File): Promise<SubmissionResponse> {
    try {
      const formData = new FormData();
      
      // 添加更新数据
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // 添加图标文件
      if (iconFile) {
        formData.append('icon', iconFile);
      }

      const response = await api.put(`/tool-submissions/admin/submissions/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('更新提交失败:', error);
      throw new Error(error.response?.data?.message || '更新提交失败');
    }
  },

  // 删除提交
  async deleteSubmission(id: number): Promise<SubmissionResponse> {
    try {
      const response = await api.delete(`/tool-submissions/admin/submissions/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('删除提交失败:', error);
      throw new Error(error.response?.data?.message || '删除提交失败');
    }
  },

  // 获取提交统计
  async getSubmissionStats(): Promise<{ success: boolean; data: SubmissionStats }> {
    try {
      const response = await api.get('/tool-submissions/admin/submissions/stats');
      return response.data;
    } catch (error: any) {
      console.error('获取提交统计失败:', error);
      throw new Error(error.response?.data?.message || '获取提交统计失败');
    }
  },

  // 检查重复工具
  async checkDuplicateTools(params: { name?: string; url?: string; excludeId?: number }): Promise<DuplicateCheckResult> {
    try {
      const queryParams = new URLSearchParams();
      if (params.name) queryParams.append('name', params.name);
      if (params.url) queryParams.append('url', params.url);
      if (params.excludeId) queryParams.append('excludeId', params.excludeId.toString());
      
      const response = await api.get(`/tool-submissions/check-duplicates?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('检查重复工具失败:', error);
      throw new Error(error.response?.data?.message || '检查重复工具失败');
    }
  },
};

// 检查重复工具的结果类型
export interface DuplicateCheckResult {
  existingTools: Array<{
    id: string;
    name: string;
    url: string;
    description: string;
  }>;
  pendingSubmissions: Array<{
    id: number;
    tool_id: string;
    name: string;
    url: string;
    description: string;
    status: string;
  }>;
  hasDuplicates: boolean;
}
