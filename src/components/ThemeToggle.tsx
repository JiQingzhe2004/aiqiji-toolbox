import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

/**
 * 主题切换组件
 * 支持深色/浅色主题切换，带有流畅的动画效果
 * 符合提示词要求的主题持久化功能
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
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 180 : 0,
            opacity: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <Sun className="w-5 h-5 text-orange-500" />
        </motion.div>

        {/* 月亮图标 - 深色主题时显示 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -180,
            opacity: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <Moon className="w-5 h-5 text-blue-400" />
        </motion.div>
      </div>

      {/* 背景光效 */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        initial={false}
        animate={{
          background: isDark 
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
        }}
        transition={{ duration: 0.3 }}
      />
    </Button>
  );
}
