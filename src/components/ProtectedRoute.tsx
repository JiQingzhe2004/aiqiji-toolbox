/**
 * 受保护的路由组件
 * 用于需要身份验证的页面
 */

import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from './LoginModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 如果正在验证身份，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // 如果需要管理员权限但用户未登录或不是管理员，显示无权限页面
  if (requireAdmin && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8">
          {/* 无权限图标 */}
          <div className="flex justify-center mb-8">
            <img 
              src="/无权限.svg" 
              alt="无权限访问"
              className="w-64 h-64 sm:w-80 sm:h-80 object-contain filter dark:brightness-90 dark:contrast-110"
            />
          </div>

          {/* 标题和描述 */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-destructive">访问被拒绝</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {!isAuthenticated 
                ? "请先登录管理员账户才能访问此页面。" 
                : "抱歉，您没有权限访问此页面。该页面仅限管理员访问。"
              }
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="pt-6 space-y-4">
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg transition-colors"
                >
                  管理员登录
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="inline-flex items-center px-6 py-3 border border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black rounded-lg transition-colors"
                >
                  返回首页
                </button>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-6 py-3 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg transition-colors"
              >
                返回首页
              </button>
            )}
          </div>
        </div>

        {/* 登录弹窗 */}
        <LoginModal 
          open={showLoginModal} 
          onOpenChange={setShowLoginModal} 
        />
      </div>
    );
  }

  return <>{children}</>;
}
