/**
 * 前端数据验证和清理工具
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 清理工具表单数据
 */
export function cleanToolFormData(data: any) {
  const cleaned = { ...data };
  
  // 清理名称
  if (cleaned.name) {
    cleaned.name = cleaned.name.trim().replace(/\s+/g, ' ');
  }
  
  // 清理描述 - 处理换行符和多余空格
  if (cleaned.description) {
    cleaned.description = cleaned.description
      .trim()
      .replace(/\r\n/g, '\n')  // 统一换行符
      .replace(/\r/g, '\n')    // 统一换行符
      .replace(/\n{3,}/g, '\n\n') // 限制连续换行
      .replace(/[ \t]+/g, ' '); // 合并多余空格
  }
  
  // 清理标签
  if (cleaned.tags && Array.isArray(cleaned.tags)) {
    cleaned.tags = cleaned.tags
      .map((tag: any) => String(tag).trim())
      .filter((tag: string) => tag && tag !== '[]' && tag !== '""') // 过滤空标签和错误格式
      .filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index); // 去重
  }
  
  // 清理URL
  if (cleaned.url) {
    cleaned.url = cleaned.url.trim();
    // 确保URL有协议（除非是相对路径）
    if (cleaned.url && !/^https?:\/\//i.test(cleaned.url) && !cleaned.url.startsWith('/')) {
      cleaned.url = 'https://' + cleaned.url;
    }
  }
  
  return cleaned;
}

/**
 * 验证工具表单数据
 */
export function validateToolFormData(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('工具名称不能为空');
  } else if (data.name.trim().length > 100) {
    errors.push('工具名称长度不能超过100个字符');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('工具描述不能为空');
  } else if (data.description.trim().length > 1000) {
    errors.push('工具描述长度不能超过1000个字符');
  }
  
  if (!data.url || data.url.trim().length === 0) {
    errors.push('工具链接不能为空');
  } else {
    // 验证URL格式
    try {
      const url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
      new URL(url);
    } catch {
      errors.push('工具链接格式不正确');
    }
  }
  
  // 验证分类
  if (!data.category) {
    errors.push('请选择工具分类');
  } else if (Array.isArray(data.category)) {
    if (data.category.length === 0) {
      errors.push('请选择工具分类');
    }
  } else if (typeof data.category === 'string') {
    if (data.category.trim().length === 0) {
      errors.push('请选择工具分类');
    }
  } else {
    errors.push('工具分类格式不正确');
  }
  
  // 验证标签
  if (data.tags && Array.isArray(data.tags)) {
    if (data.tags.length > 10) {
      errors.push('标签数量不能超过10个');
    }
    
    const invalidTags = data.tags.filter((tag: any) => 
      typeof tag !== 'string' || 
      tag.trim().length === 0 || 
      tag.length > 20
    );
    
    if (invalidTags.length > 0) {
      errors.push('标签不能为空且长度不能超过20个字符');
    }
    
    // 检查重复标签
    const uniqueTags = [...new Set(data.tags)];
    if (uniqueTags.length !== data.tags.length) {
      errors.push('标签不能重复');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 清理文本中的特殊字符和格式问题
 */
export function cleanText(text: string): string {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    // 移除BOM标记
    .replace(/^\uFEFF/, '')
    // 统一换行符
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 移除多余的空白字符
    .replace(/[ \t]+/g, ' ')
    // 限制连续换行
    .replace(/\n{3,}/g, '\n\n')
    // 移除首尾空白
    .trim();
}

/**
 * 检测和修复常见的数据格式问题
 */
export function fixDataFormatIssues(data: any) {
  const fixed = { ...data };
  
  // 修复标签数据中的常见问题
  if (fixed.tags) {
    if (typeof fixed.tags === 'string') {
      try {
        // 尝试解析JSON字符串
        fixed.tags = JSON.parse(fixed.tags);
      } catch {
        // 如果不是JSON，按逗号分割
        fixed.tags = fixed.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      }
    }
    
    if (Array.isArray(fixed.tags)) {
      // 修复标签中的格式问题
      fixed.tags = fixed.tags
        .map((tag: any) => {
          if (typeof tag !== 'string') return String(tag);
          // 移除可能的引号包装
          return tag.replace(/^["']|["']$/g, '').trim();
        })
        .filter((tag: string) => tag && tag !== '[]' && tag !== 'null' && tag !== 'undefined');
    }
  }
  
  // 修复描述中的格式问题
  if (fixed.description) {
    fixed.description = cleanText(fixed.description);
  }
  
  // 修复名称中的格式问题
  if (fixed.name) {
    fixed.name = cleanText(fixed.name);
  }
  
  return fixed;
}

/**
 * 预处理表单数据，在提交前调用
 */
export function preprocessFormData(data: any) {
  // 修复格式问题
  const fixed = fixDataFormatIssues(data);
  
  // 清理数据
  const cleaned = cleanToolFormData(fixed);
  
  // 验证数据
  const validation = validateToolFormData(cleaned);
  
  return {
    data: cleaned,
    validation
  };
}
