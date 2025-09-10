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
 * 通过提醒页面打开外部链接
 * @param url 外部链接地址
 * @param toolName 工具名称
 * @param iconUrl 工具图标URL
 */
export function openExternalLinkWithWarning(url: string, toolName: string, iconUrl?: string): void {
  try {
    const validUrl = new URL(url);
    // 只允许 http 和 https 协议
    if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
      const currentOrigin = window.location.origin;
      let warningUrl = `${currentOrigin}/external-link?url=${encodeURIComponent(url)}&name=${encodeURIComponent(toolName)}`;
      if (iconUrl) {
        warningUrl += `&icon=${encodeURIComponent(iconUrl)}`;
      }
      
      const newWindow = window.open(warningUrl, '_blank', 'noopener,noreferrer');
      // 移除弹窗检测，因为现代浏览器的检测不够可靠
      // 如果真的被阻止，用户会看到浏览器自己的提示
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

/**
 * 根据工具名称生成唯一ID
 * @param name 工具名称
 * @returns 生成的工具ID
 */
export function generateToolId(name: string): string {
  if (!name.trim()) {
    return `tool-${Date.now()}`;
  }

  // 清理和转换名称
  const cleanName = name
    .trim()
    .toLowerCase()
    // 移除特殊字符，保留字母数字和空格
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
    // 将空格和连续空白字符替换为连字符
    .replace(/\s+/g, '-')
    // 移除开头和结尾的连字符
    .replace(/^-+|-+$/g, '');

  // 如果清理后为空，使用时间戳
  if (!cleanName) {
    return `tool-${Date.now()}`;
  }

  // 添加时间戳确保唯一性
  const timestamp = Date.now().toString().slice(-6); // 取后6位
  
  // 限制长度并添加时间戳
  const maxLength = 50 - timestamp.length - 1; // 减去时间戳和连字符的长度
  const truncatedName = cleanName.length > maxLength 
    ? cleanName.substring(0, maxLength) 
    : cleanName;

  return `${truncatedName}-${timestamp}`;
}

/**
 * 简单哈希函数（用于生成更短的ID）
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(36);
}