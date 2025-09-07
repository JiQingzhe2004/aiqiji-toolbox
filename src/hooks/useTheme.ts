import { useState, useEffect } from 'react';
import type { Theme } from '@/types';

/**
 * 主题管理Hook
 * 实现深色/浅色主题切换和持久化存储
 * 符合提示词要求：localStorage key = 'aiqiji:theme'
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  // 初始化主题 - 从localStorage读取或使用系统偏好
  useEffect(() => {
    const savedTheme = localStorage.getItem('aiqiji:theme') as Theme;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
    
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // 应用主题到DOM
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // 移除现有主题类
    root.classList.remove('light', 'dark');
    // 添加新主题类
    root.classList.add(newTheme);
    
    // 更新meta标签以适配移动设备状态栏
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', newTheme === 'dark' ? '#071027' : '#ffffff');
    }
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('aiqiji:theme', newTheme);
    applyTheme(newTheme);
  };

  // 设置特定主题
  const setSpecificTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('aiqiji:theme', newTheme);
    applyTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: theme === 'dark',
  };
}
