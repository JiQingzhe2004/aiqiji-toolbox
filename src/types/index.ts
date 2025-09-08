/**
 * 工具类型定义
 * 匹配后端API数据结构
 */
export interface Tool {
  /** 唯一标识符 */
  id: string;
  /** 工具名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** lucide-react 图标名 */
  icon?: string;
  /** 图标URL链接 */
  icon_url?: string;
  /** 上传的图标文件名 */
  icon_file?: string;
  /** 图标主题适配方式 */
  icon_theme?: 'auto' | 'light' | 'dark' | 'none';
  /** 分类：AI/效率/设计/开发/其他 */
  category: string;
  /** 标签数组 */
  tags: string[];
  /** 外部链接 */
  url: string;
  /** 是否为精选工具 */
  featured: boolean;
  /** 状态 */
  status: 'active' | 'inactive' | 'maintenance';
  /** 评分总和 */
  rating_sum: number;
  /** 评分次数 */
  rating_count: number;
  /** 排序权重 */
  sort_order: number;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  
  // 兼容旧版本字段（用于渲染）
  /** @deprecated 使用 description */
  desc?: string;
  /** @deprecated 使用 icon_url */
  logoUrl?: string;
  /** @deprecated 使用 icon_theme */
  logoTheme?: string;
  /** @deprecated 使用 created_at */
  createdAt?: string;
}

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark';

/**
 * 分类类型
 */
export type Category = '全部' | '开发' | '设计' | '效率' | 'AI' | '其他';

/**
 * 搜索和过滤相关接口
 */
export interface SearchFilters {
  query: string;
  category: Category;
  tags: string[];
}

/**
 * 组件通用Props类型
 */
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * 工具使用钩子返回类型
 */
export interface UseToolsReturn {
  tools: Tool[];
  filteredTools: Tool[];
  categories: Category[];
  searchQuery: string;
  activeCategory: Category;
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: Category) => void;
  highlightText: (text: string, query: string) => React.ReactNode;
}
