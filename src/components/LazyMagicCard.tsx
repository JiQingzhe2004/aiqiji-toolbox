import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { MagicCard } from './MagicCard';
import type { Tool } from '@/types';
import { cn } from '@/lib/utils';

interface LazyMagicCardProps {
  tool: Tool;
  searchQuery?: string;
  className?: string;
  showVpnIndicator?: boolean;
}

/**
 * 懒加载的 MagicCard 组件
 * 只有当卡片进入视口时才会渲染实际内容
 */
export const LazyMagicCard = memo(function LazyMagicCard({ 
  tool, 
  searchQuery = '', 
  className,
  showVpnIndicator = true
}: LazyMagicCardProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,  // 只触发一次，一旦加载就不再卸载
    threshold: 0.1,     // 当 10% 的元素可见时触发
    rootMargin: '100px' // 提前 100px 开始加载，提供更好的用户体验
  });

  return (
    <div ref={ref} className={cn("min-h-[400px]", className)}>
      {inView ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1.0] // 自然的缓动曲线
          }}
        >
          <MagicCard 
            tool={tool} 
            searchQuery={searchQuery}
            showVpnIndicator={showVpnIndicator}
          />
        </motion.div>
      ) : (
        // 占位符，保持布局稳定
        <motion.div 
          className="w-full h-[400px] bg-muted/20 rounded-lg border animate-pulse"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="aspect-video bg-muted/30 rounded-t-lg" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-muted/40 rounded w-3/4" />
            <div className="h-4 bg-muted/30 rounded w-full" />
            <div className="h-4 bg-muted/30 rounded w-2/3" />
            <div className="flex gap-2 mt-4">
              <div className="h-6 bg-muted/40 rounded px-2 flex-1" />
              <div className="h-6 bg-muted/30 rounded w-10" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
});
