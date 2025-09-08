/**
 * 图片相关工具函数
 */

/**
 * 获取完整的图标URL
 * 支持完整URL、相对路径和blob链接
 */
export function getIconUrl(iconUrl: string | undefined): string | undefined {
  if (!iconUrl) return undefined;
  
  // 如果已经是完整URL（包括blob链接），直接返回
  if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://') || iconUrl.startsWith('blob:')) {
    return iconUrl;
  }
  
  // 如果是data URL，直接返回
  if (iconUrl.startsWith('data:')) {
    return iconUrl;
  }
  
  // 如果是相对路径，添加API基础URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3001';
  return `${apiBaseUrl}${iconUrl}`;
}

/**
 * 验证图标URL是否有效
 */
export function validateIconUrl(iconUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!iconUrl) {
      resolve(false);
      return;
    }
    
    // 对于blob链接，尝试创建Image对象验证
    if (iconUrl.startsWith('blob:') || iconUrl.startsWith('data:')) {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = iconUrl;
      return;
    }
    
    // 对于其他URL，使用fetch验证
    fetch(iconUrl, { method: 'HEAD' })
      .then(response => resolve(response.ok))
      .catch(() => resolve(false));
  });
}

/**
 * 获取工具图标URL（兼容旧字段名）
 */
export function getToolIconUrl(tool: { icon_url?: string; logoUrl?: string }): string | undefined {
  const iconUrl = tool.icon_url || tool.logoUrl;
  return getIconUrl(iconUrl);
}
