/**
 * 用户API服务
 */

import { apiGet, apiPut, apiPost } from '@/lib/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  avatar_file?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  display_name?: string;
  avatar_url?: string;
  avatar_file?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  verificationCode: string;
}

export interface ChangeEmailData {
  newEmail: string;
  verificationCode: string;
}

export const userApi = {
  /**
   * 获取用户资料
   */
  getProfile: async (): Promise<{ success: boolean; data?: UserProfile; message?: string }> => {
    try {
      return await apiGet('/auth/profile');
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取用户资料失败'
      };
    }
  },

  /**
   * 更新用户资料
   */
  updateProfile: async (data: UpdateProfileData): Promise<{ success: boolean; data?: UserProfile; message?: string }> => {
    try {
      return await apiPut('/auth/profile', data);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '更新用户资料失败'
      };
    }
  },

  /**
   * 上传头像
   */
  uploadAvatar: async (file: File): Promise<{ success: boolean; data?: { avatar_url: string; avatar_file: string }; message?: string }> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      return await apiPost('/auth/upload-avatar', formData);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '头像上传失败'
      };
    }
  },

  /**
   * 请求修改密码验证码
   */
  requestPasswordChangeCode: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      return await apiPost('/auth/request-password-change-code', {});
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送验证码失败'
      };
    }
  },

  /**
   * 修改密码
   */
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message?: string }> => {
    try {
      return await apiPost('/auth/change-password', data);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '修改密码失败'
      };
    }
  },

  /**
   * 保存头像URL（随机头像或QQ头像等）
   */
  saveAvatarUrl: async (avatarUrl: string): Promise<{ success: boolean; data?: UserProfile; message?: string }> => {
    try {
      return await apiPut('/auth/profile', { avatar_url: avatarUrl });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '保存头像失败'
      };
    }
  },

  /**
   * 请求邮箱修改验证码
   */
  requestEmailChangeCode: async (newEmail: string): Promise<{ success: boolean; message?: string }> => {
    try {
      return await apiPost('/auth/request-email-change-code', { newEmail });
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送验证码失败'
      };
    }
  },

  /**
   * 修改邮箱
   */
  changeEmail: async (data: ChangeEmailData): Promise<{ success: boolean; data?: UserProfile; message?: string }> => {
    try {
      return await apiPost('/auth/change-email', data);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '修改邮箱失败'
      };
    }
  },
};
