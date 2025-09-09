import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Tool, Category, UseToolsReturn } from '@/types';
import { highlightMatch, debounce } from '@/lib/utils';
import { toolsApi } from '@/services/toolsApi';

/**
 * 工具数据管理Hook
 * 实现搜索、分类过滤、数据加载等功能
 * 包含性能优化：缓存、防抖、内存化等
 */
export function useTools(externalSearchQuery?: string): UseToolsReturn {
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('全部');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 使用ref缓存数据，避免重复请求
  const cacheRef = useRef<Map<string, Tool[]>>(new Map());

  // 分类列表 - 使用常量避免重新创建
  const categories = useMemo<Category[]>(() => 
    ['全部', '开发', '设计', '效率', 'AI', '其他'], []
  );

  // 加载工具数据 - 优化版本，支持缓存和取消请求
  useEffect(() => {
    const loadTools = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 检查缓存
        const cached = cacheRef.current.get('tools');
        if (cached) {
          setTools(cached);
          setIsLoading(false);
          return;
        }

        // 从API加载数据，后端默认按权重排序
        const response = await toolsApi.getTools({ 
          limit: 1000, // 获取所有数据
          status: 'active' // 只获取活跃的工具
          // 注意：后端默认排序就是按权重(sort_order DESC, created_at DESC)
        });
        
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load tools data');
        }
        
        const toolsData = response.data.tools || response.data;
        
        // 数据验证
        if (!Array.isArray(toolsData)) {
          throw new Error('Invalid tools data format');
        }
        
        // 数据转换 - 添加兼容性字段
        // 注意：数据已经在后端按权重排序，前端无需再次排序
        const transformedTools: Tool[] = toolsData.map(tool => ({
          ...tool,
          // 添加兼容性字段
          desc: tool.description,
          logoUrl: tool.icon_url,
          logoTheme: tool.icon_theme,
          createdAt: tool.created_at,
        }));
        
        // 缓存数据
        cacheRef.current.set('tools', transformedTools);
        setTools(transformedTools);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Failed to load tools:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTools();
  }, []);

  // 使用外部搜索查询或内部搜索查询
  const effectiveSearchQuery = externalSearchQuery || searchQuery;

  // 过滤工具 - 优化版本，包含更好的搜索算法
  const filteredTools = useMemo(() => {
    let filtered = tools;

    // 分类过滤 - 提前返回空数组如果没有工具
    if (filtered.length === 0) return filtered;
    
    if (activeCategory !== '全部') {
      filtered = filtered.filter(tool => {
        const categories = Array.isArray(tool.category) ? tool.category : [tool.category];
        return categories.includes(activeCategory);
      });
    }

    // 搜索过滤 - 支持名称、描述、标签搜索，优化搜索算法
    if (effectiveSearchQuery.trim()) {
      const query = effectiveSearchQuery.toLowerCase().trim();
      const searchTerms = query.split(/\s+/); // 支持多词搜索
      
      filtered = filtered.filter(tool => {
        const searchText = [
          tool.name,
          tool.description || tool.desc || '',
          ...(tool.tags || [])
        ].join(' ').toLowerCase();
        
        // 所有搜索词都必须匹配
        return searchTerms.every(term => searchText.includes(term));
      });
    }

    // 返回过滤后的结果
    // 注意：由于原始数据已经在后端按权重排序，过滤操作会保持相对顺序
    return filtered;
  }, [tools, effectiveSearchQuery, activeCategory]);

  // 防抖搜索 - 使用useCallback优化
  const debouncedSetSearchQuery = useCallback(
    debounce((query: string) => setSearchQuery(query), 180),
    []
  );

  // 高亮匹配文本 - 优化性能
  const highlightText = useCallback((text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const highlightedHtml = highlightMatch(text, query);
    return React.createElement('span', {
      dangerouslySetInnerHTML: { __html: highlightedHtml },
      className: "[&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-900 [&_mark]:px-1 [&_mark]:rounded"
    });
  }, []);

  // 重置搜索 - 使用useCallback优化
  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setActiveCategory('全部');
  }, []);

  // 设置分类 - 使用useCallback优化
  const setActiveCategoryOptimized = useCallback((category: Category) => {
    setActiveCategory(category);
  }, []);

  return {
    tools,
    filteredTools,
    categories,
    searchQuery: effectiveSearchQuery,
    activeCategory,
    isLoading,
    error,
    setSearchQuery: debouncedSetSearchQuery,
    setActiveCategory: setActiveCategoryOptimized,
    highlightText,
    resetSearch,
  };
}

/**
 * 扩展UseToolsReturn接口以包含resetSearch方法
 */
declare module '@/types' {
  interface UseToolsReturn {
    resetSearch: () => void;
  }
}
