import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

/**
 * 主题切换组件 - 无动画版本
 * 移除所有过渡动画，实现即时切换
 */
export function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-2xl hover:bg-muted"
      aria-label={`切换到${isDark ? '浅色' : '深色'}主题`}
      title={`当前：${isDark ? '深色' : '浅色'}主题`}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
}