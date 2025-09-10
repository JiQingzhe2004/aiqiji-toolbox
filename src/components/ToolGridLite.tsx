import React, { memo, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { LazyMagicCard } from './LazyMagicCard';
import { useVirtualizedGrid } from '@/hooks/useVirtualizedGrid';
import type { Tool } from '@/types';
import { cn } from '@/lib/utils';
import { Database } from 'lucide-react';

/**
 * ToolGrid组件属性接口
 */
interface ToolGridProps {
  tools: Tool[];
  searchQuery?: string;
  className?: string;
}

/**
 * 轻量级工具网格组件 - 无动画版本
 * 响应式布局：desktop 3-4列，tablet 2列，mobile 1列
 * 移除所有 framer-motion 动画以减少打包体积
 */
export const ToolGridLite = memo(function ToolGridLite({ 
  tools, 
  searchQuery, 
  className 
}: ToolGridProps) {
  // 使用虚拟化网格提升性能
  const {
    visibleItems,
    hasMore,
    loadMore,
    isLoading
  } = useVirtualizedGrid({
    tools: tools,
    itemsPerPage: 12,
    searchQuery: searchQuery
  });

  // 监听滚动到底部时自动加载更多
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, loadMore]);

  // 空状态组件
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center animate-fade-in-up">
      <div className="w-24 h-24 mx-auto">
        <div className="w-full h-full rounded-full bg-muted/30 flex items-center justify-center">
          <Database className="w-12 h-12 text-muted-foreground/50" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-muted-foreground">
          {searchQuery ? '未找到相关工具' : '暂无工具数据'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {searchQuery 
            ? `没有找到包含 "${searchQuery}" 的工具，请尝试其他关键词` 
            : '工具数据正在加载中，请稍后刷新页面'
          }
        </p>
      </div>
      
      {searchQuery && (
        <button
          className="mt-4 px-4 py-2 text-sm text-violet-600 dark:text-violet-400 hover:underline transition-colors"
          onClick={() => window.location.href = '/'}
        >
          清空搜索
        </button>
      )}
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      {visibleItems.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* 工具网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
            {visibleItems.map((tool, index) => (
              <div
                key={tool.id}
                className={`animate-fade-in-up animate-delay-${Math.min(index * 100, 400)}`}
                style={{
                  animationDelay: `${Math.min(index * 0.1, 0.4)}s`
                }}
              >
                <LazyMagicCard 
                  tool={tool} 
                  searchQuery={searchQuery}
                  className="h-full"
                />
              </div>
            ))}
          </div>

          {/* 加载更多触发器 */}
          {hasMore && (
            <div 
              ref={loadMoreRef} 
              className="col-span-full flex justify-center py-8 animate-fade-in animate-delay-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  <span className="text-sm">加载更多工具...</span>
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 rounded-lg transition-colors hover:scale-105"
                >
                  点击加载更多
                </button>
              )}
            </div>
          )}
        </>
      )}
      
      {/* 工具计数 */}
      {visibleItems.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in animate-delay-300">
          <span>
            已显示 {visibleItems.length} 个工具
            {tools.length > visibleItems.length && ` / 共 ${tools.length} 个`}
            {searchQuery && ` (搜索: "${searchQuery}")`}
          </span>
        </div>
      )}
    </div>
  );
});
