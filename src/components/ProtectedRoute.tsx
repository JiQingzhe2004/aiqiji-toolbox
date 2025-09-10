/**
 * 受保护的路由组件
 * 用于需要身份验证的页面
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // 如果正在验证身份，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // 如果需要管理员权限但用户未登录或不是管理员，显示404内容但保持URL不变
  if (requireAdmin && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8">
          {/* 404图标 */}
          <div className="flex justify-center mb-8">
            <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-muted/20 flex items-center justify-center">
              <FileQuestion className="w-24 h-24 sm:w-32 sm:h-32 text-muted-foreground/50" />
            </div>
          </div>

          {/* 标题和描述 */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">页面未找到</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              抱歉，您访问的页面不存在或您没有权限访问。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回上页
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              回到首页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
