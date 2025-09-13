/**
 * 头像服务
 * 提供多种头像获取方式的统一接口
 */

import CryptoJS from 'crypto-js';

/**
 * 获取完整的头像URL
 * 支持完整URL、相对路径和data URL
 */
function getFullAvatarUrl(avatarUrl: string): string {
  if (!avatarUrl) return '';
  
  // 如果已经是完整URL（包括data URL），直接返回
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
    return avatarUrl;
  }
  
  // 如果是相对路径（以/开头），添加API基础URL
  if (avatarUrl.startsWith('/')) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    return `${apiBaseUrl}${avatarUrl}`;
  }
  
  return avatarUrl;
}

/**
 * 生成邮箱的MD5哈希值
 */
function generateEmailMD5(email: string): string {
  if (!email) return '';
  return CryptoJS.MD5(email.toLowerCase().trim()).toString();
}

/**
 * 获取 Cravatar 头像链接
 */
function getCravatarUrl(email: string, size: number = 200): string {
  const emailMD5 = generateEmailMD5(email);
  return `https://cravatar.cn/avatar/${emailMD5}?s=${size}&d=404`;
}

/**
 * 检查是否为QQ邮箱
 */
function isQQEmail(email: string): boolean {
  if (!email) return false;
  const qqDomains = ['qq.com', 'vip.qq.com', 'foxmail.com'];
  const domain = email.toLowerCase().split('@')[1];
  return qqDomains.includes(domain);
}

/**
 * 获取QQ头像链接
 */
function getQQAvatarUrl(email: string, size: number = 200): string {
  if (!isQQEmail(email)) {
    throw new Error('非QQ邮箱');
  }
  
  const qqNumber = email.split('@')[0];
  // QQ头像API，size可选: 40, 100, 140
  const sizeParam = size <= 40 ? 40 : size <= 100 ? 100 : 140;
  return `https://q.qlogo.cn/headimg_dl?dst_uin=${qqNumber}&spec=${sizeParam}`;
}

/**
 * 获取随机头像链接
 */
async function getRandomAvatarUrl(): Promise<string> {
  try {
    const response = await fetch('https://v2.xxapi.cn/api/head?return=json');
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.data) {
        return data.data;
      }
    }
  } catch (error) {
    console.warn('获取随机头像失败:', error);
  }
  
  // 备用随机头像服务
  const fallbackServices = [
    'https://api.dicebear.com/7.x/avataaars/svg',
    'https://api.dicebear.com/7.x/miniavs/svg',
    'https://api.dicebear.com/7.x/micah/svg'
  ];
  
  return fallbackServices[Math.floor(Math.random() * fallbackServices.length)];
}

/**
 * 检查图片URL是否可访问
 */
async function checkImageAvailable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 生成用户默认头像URL
 * 新逻辑：用户自定义头像 > 文字头像（默认不自动获取外部头像）
 */
export async function getUserAvatarUrl(user: {
  avatar_url?: string;
  email?: string;
  username?: string;
  display_name?: string;
}, size: number = 200): Promise<string> {
  // 1. 如果用户有自定义头像，处理URL并返回
  if (user.avatar_url) {
    return getFullAvatarUrl(user.avatar_url);
  }
  
  // 2. 默认返回文字头像，不自动获取外部头像
  return generateLetterAvatar(user.display_name || user.username || 'U', size);
}

/**
 * 生成字母头像（SVG格式）
 */
function generateLetterAvatar(text: string, size: number = 200): string {
  const letter = text.charAt(0).toUpperCase();
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  const colorIndex = text.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" 
            font-size="${size * 0.4}" fill="white" font-weight="bold">${letter}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * 专门为头像组件设计的Hook式服务
 */
export class AvatarService {
  private cache = new Map<string, string>();
  
  /**
   * 获取头像URL（带缓存）
   */
  async getAvatarUrl(user: {
    avatar_url?: string;
    email?: string;
    username?: string;
    display_name?: string;
  }, size: number = 200): Promise<string> {
    const cacheKey = `${user.email || user.username}-${size}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const avatarUrl = await getUserAvatarUrl(user, size);
    this.cache.set(cacheKey, avatarUrl);
    
    return avatarUrl;
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// 导出单例实例
export const avatarService = new AvatarService();

/**
 * 手动获取随机头像（用于编辑资料页面）
 */
export async function fetchRandomAvatar(): Promise<string> {
  return await getRandomAvatarUrl();
}

/**
 * 手动获取QQ头像（用于编辑资料页面）
 */
export function fetchQQAvatar(email: string, size: number = 200): string {
  return getQQAvatarUrl(email, size);
}

/**
 * 检查邮箱是否为QQ邮箱（用于UI判断）
 */
export function checkIsQQEmail(email: string): boolean {
  return isQQEmail(email);
}

/**
 * 手动获取Cravatar头像（用于编辑资料页面）
 */
export function fetchCravatarAvatar(email: string, size: number = 200): string {
  return getCravatarUrl(email, size);
}

/**
 * 获取完整的头像URL（导出版本）
 */
export function getAvatarUrl(avatarUrl: string): string {
  return getFullAvatarUrl(avatarUrl);
}
