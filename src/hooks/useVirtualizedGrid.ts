import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Tool } from '@/types';

interface UseVirtualizedGridOptions {
  tools: Tool[];
  itemsPerPage?: number;
  searchQuery?: string;
}

interface VirtualizedGridState {
  visibleItems: Tool[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
  reset: () => void;
}

/**
 * 虚拟化网格 Hook
 * 实现分批加载，避免一次性渲染大量卡片
 */
export function useVirtualizedGrid({
  tools,
  itemsPerPage = 12, // 每批加载12个卡片
  searchQuery = ''
}: UseVirtualizedGridOptions): VirtualizedGridState {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 过滤后的工具列表
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    
    const query = searchQuery.toLowerCase();
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(query) ||
      tool.desc.toLowerCase().includes(query) ||
      tool.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      tool.category.toLowerCase().includes(query)
    );
  }, [tools, searchQuery]);

  // 当前可见的工具
  const visibleItems = useMemo(() => {
    return filteredTools.slice(0, currentPage * itemsPerPage);
  }, [filteredTools, currentPage, itemsPerPage]);

  // 是否还有更多数据
  const hasMore = useMemo(() => {
    return visibleItems.length < filteredTools.length;
  }, [visibleItems.length, filteredTools.length]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    // 模拟加载延迟，提供更好的用户体验
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoading(false);
    }, 300);
  }, [isLoading, hasMore]);

  // 重置到第一页（搜索时使用）
  const reset = useCallback(() => {
    setCurrentPage(1);
    setIsLoading(false);
  }, []);

  // 当搜索查询变化时重置
  useEffect(() => {
    reset();
  }, [searchQuery, reset]);

  return {
    visibleItems,
    hasMore,
    isLoading,
    loadMore,
    reset
  };
}
