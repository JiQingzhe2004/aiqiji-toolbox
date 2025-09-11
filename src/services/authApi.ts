/**
 * 身份验证API服务
 */

import { apiPost, apiGet, apiPut } from '@/lib/api';
import type { LoginRequest, LoginResponse, User, ChangePasswordRequest, UpdateProfileRequest } from '@/types/auth';

export class AuthApi {
  /**
   * 用户登录
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiPost('/auth/login', credentials);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            user: response.data.user,
            token: response.data.token
          },
          message: response.message
        };
      }
      
      return {
        success: false,
        message: response.message || '登录失败'
      };
    } catch (error) {
      console.error('Login API error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: '网络错误，请稍后重试'
      };
    }
  }

  /**
   * 验证token有效性
   */
  static async validateToken(token: string): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return {
          valid: result.data.valid,
          user: result.data.user
        };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('Token validation API error:', error instanceof Error ? error.message : String(error));
      return { valid: false };
    }
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 获取个人详细信息
   */
  static async getProfile(): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
      const response = await apiGet('/auth/profile');
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      }
      
      return {
        success: false,
        message: response.message || '获取个人信息失败'
      };
    } catch (error) {
      console.error('Get profile API error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: '网络错误，请稍后重试'
      };
    }
  }

  /**
   * 更新个人信息
   */
  static async updateProfile(data: UpdateProfileRequest): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
      const response = await apiPut('/auth/profile', data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      }
      
      return {
        success: false,
        message: response.message || '更新个人信息失败'
      };
    } catch (error) {
      console.error('Update profile API error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: '网络错误，请稍后重试'
      };
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiPost('/auth/change-password', data);
      
      return {
        success: response.success,
        message: response.message || (response.success ? '密码修改成功' : '密码修改失败')
      };
    } catch (error) {
      console.error('Change password API error:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: '网络错误，请稍后重试'
      };
    }
  }
}
