/**
 * 工具类型定义
 * 根据提示词要求设计的Tool数据结构
 */
export interface Tool {
  /** 唯一标识符 */
  id: string;
  /** 工具名称 */
  name: string;
  /** URL slug (可选) */
  slug?: string;
  /** 简短描述 */
  desc: string;
  /** lucide-react 图标名或 SVG 字符串 */
  icon: string;
  /** 网站logo链接 (可选，优先于icon显示) */
  logoUrl?: string;
  /** logo主题适配方式: 'auto' | 'invert' | 'none' */
  logoTheme?: 'auto' | 'invert' | 'none';
  /** 分类：开发/设计/效率/AI/其它 */
  category: string | string[];
  /** 标签数组，如 ["在线","免费"] */
  tags?: string[];
  /** 外部链接 */
  url: string;
  /** 是否为推荐工具 */
  featured?: boolean;
  /** 创建时间 ISO 日期 */
  createdAt?: string;
}

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark';

/**
 * 分类类型
 */
export type Category = '全部' | '开发' | '设计' | '效率' | 'AI' | '其它';

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
