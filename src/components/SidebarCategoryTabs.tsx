/**
 * 侧边栏分类标签组件
 * 在滚动时固定显示在侧边
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Code2, 
  Wand, 
  Pickaxe, 
  Sparkles, 
  Boxes,
  MoreHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

// 分类图标映射
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '全部': Layers,
  '开发': Code2,
  '设计': Wand,
  '效率': Pickaxe,
  'AI': Sparkles,
  '其他': Boxes,
};

// 高纯度色彩配置 - 使用组件库的 chart 和 accent 色彩
const categoryColors: Record<string, { bg: string; hover: string; active: string; shadow: string }> = {
  '全部': {
    bg: 'bg-chart-1/10 hover:bg-chart-1/20',
    hover: 'hover:bg-chart-1/15 hover:border-chart-1/30',
    active: 'bg-chart-1 border-chart-1/50 shadow-chart-1/25',
    shadow: 'hover:shadow-chart-1/20'
  },
  '开发': {
    bg: 'bg-chart-2/10 hover:bg-chart-2/20',
    hover: 'hover:bg-chart-2/15 hover:border-chart-2/30',
    active: 'bg-chart-2 border-chart-2/50 shadow-chart-2/25',
    shadow: 'hover:shadow-chart-2/20'
  },
  '设计': {
    bg: 'bg-chart-3/10 hover:bg-chart-3/20',
    hover: 'hover:bg-chart-3/15 hover:border-chart-3/30',
    active: 'bg-chart-3 border-chart-3/50 shadow-chart-3/25',
    shadow: 'hover:shadow-chart-3/20'
  },
  '效率': {
    bg: 'bg-chart-4/10 hover:bg-chart-4/20',
    hover: 'hover:bg-chart-4/15 hover:border-chart-4/30',
    active: 'bg-chart-4 border-chart-4/50 shadow-chart-4/25',
    shadow: 'hover:shadow-chart-4/20'
  },
  'AI': {
    bg: 'bg-chart-5/10 hover:bg-chart-5/20',
    hover: 'hover:bg-chart-5/15 hover:border-chart-5/30',
    active: 'bg-chart-5 border-chart-5/50 shadow-chart-5/25',
    shadow: 'hover:shadow-chart-5/20'
  },
  '其他': {
    bg: 'bg-accent/50 hover:bg-accent/70',
    hover: 'hover:bg-accent/60 hover:border-accent-foreground/20',
    active: 'bg-accent border-accent-foreground/30 shadow-accent/25',
    shadow: 'hover:shadow-accent/20'
  },
};

interface SidebarCategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onChange: (category: string) => void;
  className?: string;
}

export function SidebarCategoryTabs({
  categories,
  activeCategory,
  onChange,
  className
}: SidebarCategoryTabsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 获取工具区域的位置
      const toolsSection = document.getElementById('tools-section');
      if (toolsSection) {
        const rect = toolsSection.getBoundingClientRect();
        // 当工具区域开始露出时显示侧边栏（哪怕只露出一点）
        const shouldShow = rect.top <= window.innerHeight - 50;
        setIsVisible(shouldShow);
      }
    };

    // 初始检查
    handleScroll();

    // 添加滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const sidebarVariants = {
    hidden: {
      x: 100,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }
    },
    exit: {
      x: 100,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'fixed right-6 z-40',
            'top-[35vh]', // 直接设置距离顶部35%的位置，视觉上更居中
            'hidden xl:flex flex-col items-center justify-center',
            // 确保在有侧边栏时调整位置
            'xl:right-8', // 在大屏时稍微远离右边缘
            className
          )}
        >
          {/* 主容器 - 使用组件库高纯度色彩样式 */}
          <div className="bg-card/98 backdrop-blur-md border border-primary/10 rounded-2xl p-3 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:bg-card hover:border-primary/20 hover:backdrop-blur-lg">
            {/* 标题区域 - 紧凑居中 */}
            <div className="flex items-center justify-center mb-3 px-1">
              <h3 className="text-xs font-bold text-primary bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                工具分类
              </h3>
            </div>
            
            {/* 分类按钮组 - 紧凑垂直居中布局 */}
            <TooltipProvider delayDuration={100}>
              <div className="flex flex-col items-center justify-center space-y-2">
                {categories.map((category) => {
                  const categoryKey = typeof category === 'string' ? category : (category as any)?.id || category;
                  const categoryName = typeof category === 'string' ? category : (category as any)?.name || category;
                  const categoryCount = typeof category === 'object' && (category as any)?.count ? (category as any).count : 0;
                  const IconComponent = categoryIcons[categoryKey] || MoreHorizontal;
                  const colors = categoryColors[categoryKey] || categoryColors['其他'];
                  
                  return (
                    <Tooltip key={categoryKey}>
                      <TooltipTrigger asChild>
                        <motion.div
                          className="group relative"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          {/* 分类按钮 - 完美图标居中 + 高纯度色彩 */}
                          <Button
                            onClick={() => onChange(categoryKey)}
                            variant="ghost"
                            className={cn(
                              'w-12 h-12 rounded-xl transition-all duration-500 ease-out',
                              'flex items-center justify-center p-0', // 移除默认padding，确保完美居中
                              'border border-transparent backdrop-blur-sm',
                              'transform-gpu', // GPU加速
                              activeCategory === categoryKey
                                ? cn(
                                    colors.active,
                                    'text-white shadow-lg',
                                    'hover:shadow-xl hover:scale-[1.02]'
                                  )
                                : cn(
                                    colors.bg,
                                    colors.hover,
                                    colors.shadow,
                                    'text-foreground/80 hover:text-foreground',
                                    'shadow-sm hover:shadow-lg',
                                    'hover:scale-[1.02] hover:-translate-y-0.5'
                                  )
                            )}
                          >
                            {/* 图标 - 完美居中 */}
                            <IconComponent className={cn(
                              'w-5 h-5 transition-all duration-300 ease-out',
                              activeCategory === categoryKey 
                                ? 'text-white drop-shadow-sm' 
                                : 'group-hover:scale-110 group-hover:rotate-3'
                            )} />
                          </Button>
                          
                          {/* 数量徽章 - 流畅动画 */}
                          {categoryCount > 0 && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0, y: 5 }}
                              animate={{ 
                                scale: 1, 
                                opacity: 1, 
                                y: 0,
                                transition: { 
                                  delay: 0.2, 
                                  type: "spring", 
                                  stiffness: 500, 
                                  damping: 25 
                                }
                              }}
                              className="absolute -top-2 -right-2"
                            >
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-xs px-1.5 py-0.5 font-bold shadow-lg backdrop-blur-sm',
                                  'border border-white/20',
                                  activeCategory === categoryKey 
                                    ? 'bg-white/20 text-white shadow-white/10' 
                                    : 'bg-primary/90 text-primary-foreground shadow-primary/20'
                                )}
                              >
                                {categoryCount}
                              </Badge>
                            </motion.div>
                          )}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="mr-2">
                        <p className="font-medium">{categoryName}</p>
                        {categoryCount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {categoryCount} 个工具
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
