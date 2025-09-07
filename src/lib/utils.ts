import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 安全地打开外部链接
 */
export function openExternalLink(url: string, newTab: boolean = true): void {
  // 检查是否为有效的URL
  try {
    const validUrl = new URL(url);
    // 只允许 http 和 https 协议
    if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
      if (newTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    }
  } catch (error) {
    console.error('Invalid URL:', url);
  }
}

/**
 * 格式化日期为可读格式
 */
export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      return '未知日期';
    }

    // 使用中文本地化格式
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '日期格式错误';
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 高亮搜索匹配文本
 */
export function highlightMatch(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  
  try {
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 py-0 rounded">$1</mark>');
  } catch (error) {
    console.error('Error highlighting text:', error);
    return text;
  }
}
