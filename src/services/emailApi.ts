/**
 * 邮件API服务
 * 提供验证码发送、邮件测试等功能
 */

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
