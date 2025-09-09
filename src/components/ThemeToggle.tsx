import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

/**
 * 主题切换组件 - 简化版
 * 移除 framer-motion，使用简单的 CSS 过渡动画
 */
export function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden rounded-2xl hover:bg-muted"
      aria-label={`切换到${isDark ? '浅色' : '深色'}主题`}
      title={`当前：${isDark ? '深色' : '浅色'}主题`}
    >
      <div className="relative w-6 h-6">
        {/* 太阳图标 - 浅色主题时显示 */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isDark 
              ? 'scale-0 rotate-90 opacity-0' 
              : 'scale-100 rotate-0 opacity-100'
          }`}
        >
          <Sun className="w-5 h-5" />
        </div>
        
        {/* 月亮图标 - 深色主题时显示 */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isDark 
              ? 'scale-100 rotate-0 opacity-100' 
              : 'scale-0 -rotate-90 opacity-0'
          }`}
        >
          <Moon className="w-5 h-5" />
        </div>
      </div>
    </Button>
  );
}