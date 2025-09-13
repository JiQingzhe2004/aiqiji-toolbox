/**
 * 身份验证上下文
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthApi } from '@/services/authApi';
import type { User, AuthContextType, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 从localStorage恢复认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');
        
        if (savedToken && savedUser) {
          const validation = await AuthApi.validateToken(savedToken);
          if (validation.valid && validation.user) {
            setToken(savedToken);
            setUser(validation.user);
          } else {
            // Token无效，清除本地存储
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await AuthApi.login({ username, password });
      
      if (response.success && response.data) {
        const { user: userData, token: userToken } = response.data;
        
        
        setUser(userData);
        setToken(userToken);
        
        // 保存到localStorage
        localStorage.setItem('auth_token', userToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error instanceof Error ? error.message : String(error));
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
    }
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === ('admin' as UserRole);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
