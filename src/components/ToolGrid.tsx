import React, { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { LazyMagicCard } from './LazyMagicCard';
import { useVirtualizedGrid } from '@/hooks/useVirtualizedGrid';
import type { Tool } from '@/types';
import { cn } from '@/lib/utils';

/**
 * ToolGrid组件属性接口
 */
interface ToolGridProps {
  tools: Tool[];
  searchQuery?: string;
  className?: string;
}

/**
 * 工具网格组件
 * 响应式布局：desktop 3-4列，tablet 2列，mobile 1列
 * 支持动画效果和空状态处理
 */
export const ToolGrid = memo(function ToolGrid({ 
  tools, 
  searchQuery = '', 
  className 
}: ToolGridProps) {
  // 使用虚拟化网格 Hook
  const {
    visibleItems,
    hasMore,
    isLoading,
    loadMore
  } = useVirtualizedGrid({
    tools,
    itemsPerPage: 12,
    searchQuery
  });

  // 无限滚动触发器
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '200px'
  });

  // 当加载更多区域进入视口时触发加载
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, loadMore]);

  // 容器动画变体 - 为懒加载优化
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // 懒加载时错开动画更明显
        duration: 0.2,
        ease: "easeOut"
      },
    },
  };

  // 空状态组件
  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="col-span-full flex flex-col items-center justify-center py-16 text-center"
    >
      {/* 无数据图标 */}
      <div className="flex justify-center mb-8">
        <img 
          src="/无数据.svg" 
          alt="暂无数据"
          className="w-48 h-48 sm:w-56 sm:h-56 object-contain filter dark:brightness-90 dark:contrast-110"
        />
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {searchQuery ? '未找到匹配的工具' : '暂无工具'}
      </h3>
      
      <p className="text-muted-foreground max-w-md">
        {searchQuery 
          ? `没有找到包含"${searchQuery}"的工具，请尝试其他关键词`
          : '这个分类下还没有工具，请选择其他分类'
        }
      </p>
      
      {searchQuery && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 px-4 py-2 text-sm text-violet-600 dark:text-violet-400 hover:underline"
          onClick={() => window.location.reload()}
        >
          清空搜索
        </motion.button>
      )}
    </motion.div>
  );

  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {visibleItems.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* 工具网格 */}
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              'grid gap-8',
              'grid-cols-1', // mobile: 1列
              'sm:grid-cols-2', // small tablet: 2列
              'lg:grid-cols-3', // desktop: 3列
              'xl:grid-cols-3', // large desktop: 保持3列，让卡片更宽
              'auto-rows-fr', // 确保卡片高度一致
              'w-full max-w-7xl mx-auto' // 增加最大宽度
            )}
          >
            {visibleItems.map((tool, index) => (
              <motion.div
                key={tool.id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.4,
                      ease: [0.25, 0.1, 0.25, 1.0],
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    },
                  },
                }}
                // 移除内联style，减少重复计算
                className="will-change-transform"
              >
                <LazyMagicCard 
                  tool={tool} 
                  searchQuery={searchQuery}
                />
              </motion.div>
            ))}
          </motion.div>

            {/* 加载更多触发器 */}
            {hasMore && (
              <motion.div 
                ref={loadMoreRef} 
                className="col-span-full flex justify-center py-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {isLoading ? (
                  <motion.div 
                    className="flex items-center gap-2 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">加载更多工具...</span>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={loadMore}
                    className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 rounded-lg transition-colors"
                    whileHover={{ 
                      scale: 1.05,
                      borderColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary))"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    点击加载更多
                  </motion.button>
                )}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
      
      {/* 工具计数 */}
      {visibleItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <span className="text-sm text-muted-foreground">
            显示 <span className="font-medium text-foreground">{visibleItems.length}</span> / <span className="font-medium text-foreground">{tools.length}</span> 个工具
            {searchQuery && (
              <span className="ml-2">
                匹配 "<span className="font-medium text-violet-600 dark:text-violet-400">{searchQuery}</span>"
              </span>
            )}
          </span>
        </motion.div>
      )}
    </div>
  );
});
