/**
 * 邮件API服务
 * 提供验证码发送、邮件测试等功能
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { AiModelPreset } from '@/services/settingsApi';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

/**
 * API响应接口
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 验证码发送请求接口
 */
interface SendVerificationCodeRequest {
  email: string;
  type: 'register' | 'login' | 'reset_password' | 'email_change' | 'feedback';
  template?: string;
}

/**
 * 验证码验证请求接口
 */
interface VerifyCodeRequest {
  email: string;
  code: string;
  type: 'register' | 'login' | 'reset_password' | 'email_change' | 'feedback';
}

/**
 * 测试邮件请求接口
 */
interface TestEmailRequest {
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
}

/**
 * 邮箱检查请求接口
 */
interface CheckEmailRequest {
  email: string;
}

/**
 * 用户名检查请求接口
 */
interface CheckUsernameRequest {
  username: string;
}

/**
 * 邮件API服务类
 */
export class EmailApiService {
  private baseUrl = `${API_BASE_URL}/email`;

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(request: SendVerificationCodeRequest): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }
      
      return data;
    } catch (error) {
      console.error('发送验证码失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '发送验证码失败',
      };
    }
  }

  /**
   * 正式发送邮件（支持多收件人、模板、附件）
   */
  async sendEmail(params: { recipients: string[]; subject: string; html?: string; text?: string; template_id?: string; attachments?: File[] }): Promise<ApiResponse<{ logId: string; success_count: number; fail_count: number }>> {
    try {
      const form = new FormData();
      form.append('recipients', JSON.stringify(params.recipients));
      form.append('subject', params.subject);
      if (params.html) form.append('html', params.html);
      if (params.text) form.append('text', params.text);
      if (params.template_id) form.append('template_id', params.template_id);
      if (params.attachments && params.attachments.length) {
        params.attachments.forEach(f => form.append('attachments', f));
      }
      const res = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
        },
        body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '发送失败');
      return data;
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : '发送失败' };
    }
  }

  // 模板管理
  async getTemplates(params?: { q?: string; page?: number; limit?: number; active?: boolean }): Promise<ApiResponse<{ items: any[]; pagination: any }>> {
    const qs = new URLSearchParams();
    if (params?.q) qs.append('q', params.q);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));
    if (params?.active !== undefined) qs.append('active', String(params.active));
    const res = await fetch(`${this.baseUrl}/templates${qs.toString() ? `?${qs.toString()}` : ''}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      }
    });
    return res.json();
  }

  async createTemplate(data: { name: string; subject: string; html?: string; text?: string; is_active?: boolean }): Promise<ApiResponse<{ template: any }>> {
    const res = await fetch(`${this.baseUrl}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async updateTemplate(id: string, data: Partial<{ name: string; subject: string; html: string; text: string; is_active: boolean }>): Promise<ApiResponse<{ template: any }>> {
    const res = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async deleteTemplate(id: string): Promise<ApiResponse> {
    const res = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'DELETE',
      headers: {
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      },
    });
    return res.json();
  }

  /**
   * AI生成邮件主题
   */
  async generateSubject(content: string): Promise<ApiResponse<{ subject: string }>> {
    const res = await fetch(`${this.baseUrl}/ai/generate-subject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      },
      body: JSON.stringify({ content })
    });
    return res.json();
  }

  // 日志
  async getLogs(params?: { page?: number; limit?: number; status?: string; q?: string; from?: string; to?: string }): Promise<ApiResponse<{ items: any[]; pagination: any }>> {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null) qs.append(k, String(v)); });
    const res = await fetch(`${this.baseUrl}/logs${qs.toString() ? `?${qs.toString()}` : ''}`, {
      headers: {
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      }
    });
    return res.json();
  }

  async exportLogs(params?: { status?: string; from?: string; to?: string }): Promise<Blob> {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null) qs.append(k, String(v)); });
    const res = await fetch(`${this.baseUrl}/logs/export${qs.toString() ? `?${qs.toString()}` : ''}`, {
      headers: {
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      }
    });
    const blob = await res.blob();
    return blob;
  }

  /** 使用AI将纯文本渲染为HTML */
  async renderEmailByAI(params: { subject?: string; text: string }): Promise<ApiResponse<{ html: string }>> {
    const res = await fetch(`${this.baseUrl}/ai-render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
      },
      body: JSON.stringify(params)
    });
    return res.json();
  }

  /**
   * 测试AI配置可用性
   */
  async testAI(params: { base_url?: string; api_key?: string; model?: string }): Promise<ApiResponse<{ ok: boolean; latency_ms?: number }>> {
    try {
      const res = await fetch(`${this.baseUrl}/ai-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}),
        },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'AI 测试失败');
      }
      return data;
    } catch (error) {
      console.error('测试AI配置失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '测试AI配置失败',
      };
    }
  }

  /** ===== AI 模型预设管理 ===== */
  /**
   * 获取AI模型预设列表
   */
  async getAiModels(): Promise<ApiResponse<{ items: AiModelPreset[] }>> {
    return apiGet<{ items: AiModelPreset[] }>('/settings/ai-models');
  }

  /**
   * 创建AI模型预设
   */
  async createAiModel(preset: Omit<AiModelPreset, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<{ preset: AiModelPreset }>> {
    try {
      console.log('发送创建预设请求:', preset);
      const response = await apiPost<{ preset: AiModelPreset }>('/settings/ai-models', preset);
      console.log('创建预设响应:', response);
      return response;
    } catch (error: any) {
      console.error('创建预设API调用失败:', error);
      // ApiError 会被 apiFetch 抛出，但我们应该让组件处理
      // 如果这里需要转换，确保错误信息正确传递
      if (error?.status && error?.message) {
        // 这是 ApiError
        return {
          success: false,
          message: error.message || '创建预设失败',
          error: error.message
        };
      }
      // 其他错误也转换为响应格式
      return {
        success: false,
        message: error?.message || '创建预设失败',
        error: error?.message || '未知错误'
      };
    }
  }

  /**
   * 更新AI模型预设
   */
  async updateAiModel(id: string, patch: Partial<Omit<AiModelPreset, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<{ preset: AiModelPreset }>> {
    return apiPut<{ preset: AiModelPreset }>(`/settings/ai-models/${id}`, patch);
  }

  /**
   * 删除AI模型预设
   */
  async deleteAiModel(id: string): Promise<ApiResponse> {
    return apiDelete(`/settings/ai-models/${id}`);
  }

  /**
   * 应用AI模型预设（将预设配置应用到系统设置）
   */
  async applyAiModel(id: string): Promise<ApiResponse> {
    return apiPost(`/settings/ai-models/${id}/apply`, {});
  }
  /**
   * 验证邮箱验证码
   */
  async verifyCode(request: VerifyCodeRequest): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify code');
      }
      
      return data;
    } catch (error) {
      console.error('验证码验证失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '验证码验证失败',
      };
    }
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(request: TestEmailRequest): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: request.to,
          subject: request.subject || '邮箱配置测试',
          text: request.text || '这是一封测试邮件，用于验证邮箱配置是否正确。',
          html: request.html,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send test email');
      }
      
      return data;
    } catch (error) {
      console.error('发送测试邮件失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '发送测试邮件失败',
      };
    }
  }

  /**
   * 获取邮箱配置状态
   */
  async getEmailStatus(): Promise<ApiResponse<{ enabled: boolean; configured: boolean }>> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get email status');
      }
      
      return data;
    } catch (error) {
      console.error('获取邮箱状态失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取邮箱状态失败',
      };
    }
  }

  /**
   * 检查邮箱是否已存在
   */
  async checkEmailExists(request: CheckEmailRequest): Promise<ApiResponse<{ exists: boolean; message: string; email: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check email');
      }
      
      return data;
    } catch (error) {
      console.error('检查邮箱失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查邮箱失败',
      };
    }
  }

  /**
   * 检查用户名是否已存在
   */
  async checkUsernameExists(request: CheckUsernameRequest): Promise<ApiResponse<{ exists: boolean; message: string; username: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check username');
      }
      
      return data;
    } catch (error) {
      console.error('检查用户名失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查用户名失败',
      };
    }
  }
}

// 导出单例实例
export const emailApi = new EmailApiService();

// 导出类型
export type {
  SendVerificationCodeRequest,
  VerifyCodeRequest,
  TestEmailRequest,
  CheckEmailRequest,
  CheckUsernameRequest
};

// 导出 AI 模型预设类型（从 settingsApi 重新导出以便使用）
export type { AiModelPreset } from '@/services/settingsApi';
