/**
 * 空数据状态组件
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function EmptyState({ 
  title = "暂无数据", 
  description = "当前没有可显示的内容",
  showRefresh = false,
  onRefresh,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center space-y-6 p-8 ${className}`}>
      {/* 无数据图标 */}
      <div className="flex justify-center mb-8">
        <img 
          src="/无数据.svg" 
          alt="暂无数据"
          className="w-48 h-48 sm:w-64 sm:h-64 object-contain filter dark:brightness-90 dark:contrast-110"
        />
      </div>

      {/* 标题和描述 */}
      <div className="space-y-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
      </div>

      {/* 刷新按钮 */}
      {showRefresh && onRefresh && (
        <div className="pt-4">
          <Button
            onClick={onRefresh}
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重新加载
          </Button>
        </div>
      )}
    </div>
  );
}
