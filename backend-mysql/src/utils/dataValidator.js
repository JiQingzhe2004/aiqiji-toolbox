/**
 * 数据验证和清理工具
 */

/**
 * 清理和验证工具数据
 */
export function cleanToolData(data) {
  const cleaned = { ...data };
  
  // 清理名称 - 移除多余的空格和特殊字符
  if (cleaned.name) {
    cleaned.name = cleaned.name.trim().replace(/\s+/g, ' ');
  }
  
  // 清理描述 - 处理换行符和特殊字符
  if (cleaned.description) {
    cleaned.description = cleaned.description
      .trim()
      .replace(/\r\n/g, '\n')  // 统一换行符
      .replace(/\r/g, '\n')    // 统一换行符
      .replace(/\n{3,}/g, '\n\n'); // 限制连续换行
  }
  
  // 清理标签数据
  if (cleaned.tags) {
    cleaned.tags = cleanTagsData(cleaned.tags);
  }
  
  // 清理URL
  if (cleaned.url) {
    cleaned.url = cleaned.url.trim();
    // 确保URL有协议
    if (!/^https?:\/\//i.test(cleaned.url)) {
      cleaned.url = 'https://' + cleaned.url;
    }
  }
  
  return cleaned;
}

/**
 * 清理标签数据
 */
export function cleanTagsData(tags) {
  let tagArray = [];
  
  if (Array.isArray(tags)) {
    tagArray = tags;
  } else if (typeof tags === 'string') {
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        tagArray = parsed;
      } else {
        // 不是数组，按逗号分割
        tagArray = tags.split(',');
      }
    } catch {
      // JSON解析失败，按逗号分割
      tagArray = tags.split(',');
    }
  }
  
  // 清理每个标签
  const cleanedTags = tagArray
    .map(tag => {
      if (typeof tag !== 'string') {
        return String(tag);
      }
      return tag.trim();
    })
    .filter(tag => tag && tag !== '[]' && tag !== '""') // 过滤空标签和错误格式
    .filter((tag, index, arr) => arr.indexOf(tag) === index); // 去重
  
  return cleanedTags;
}

/**
 * 验证工具数据
 */
export function validateToolData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('工具名称不能为空');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('工具描述不能为空');
  }
  
  if (!data.url || data.url.trim().length === 0) {
    errors.push('工具链接不能为空');
  }
  
  if (!data.category || data.category.trim().length === 0) {
    errors.push('工具分类不能为空');
  }
  
  // 验证URL格式
  if (data.url) {
    try {
      new URL(data.url.startsWith('http') ? data.url : `https://${data.url}`);
    } catch {
      errors.push('工具链接格式不正确');
    }
  }
  
  // 验证标签
  if (data.tags && Array.isArray(data.tags)) {
    const invalidTags = data.tags.filter(tag => 
      typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 20
    );
    if (invalidTags.length > 0) {
      errors.push('标签格式不正确或长度超出限制');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 处理文本编码问题
 */
export function fixTextEncoding(text) {
  if (typeof text !== 'string') return text;
  
  // 移除可能的BOM标记
  text = text.replace(/^\uFEFF/, '');
  
  // 处理可能的编码问题
  try {
    // 如果文本包含乱码，尝试修复
    if (/[��]/.test(text)) {
      console.warn('Detected potential encoding issues in text:', text.substring(0, 50));
    }
  } catch (error) {
    console.error('Error fixing text encoding:', error);
  }
  
  return text;
}
