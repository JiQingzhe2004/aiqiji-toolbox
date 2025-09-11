/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

/**
 * 用户信息接口
 */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  createdAt: string;
}

/**
 * 登录请求接口
 */
export interface LoginRequest {
  username: string; // 支持用户名或邮箱
  password: string;
}

/**
 * 修改密码请求接口
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * 更新个人信息请求接口
 */
export interface UpdateProfileRequest {
  email?: string;
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  message?: string;
}

/**
 * 身份验证上下文接口
 */
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}
