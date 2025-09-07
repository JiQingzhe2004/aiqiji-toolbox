import React from 'react';
import { motion } from 'framer-motion';
import { Code, Palette, Zap, Bot, Grid3X3 } from 'lucide-react';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

/**
 * BottomNavigation组件属性接口
 */
interface BottomNavigationProps {
  categories: Category[];
  activeCategory: Category;
  onChange: (category: Category) => void;
  className?: string;
}

/**
 * 底部固定分类导航组件
 * 在首页状态时固定显示在屏幕底部
 */
export function BottomNavigation({ 
  categories, 
  activeCategory, 
  onChange, 
  className 
}: BottomNavigationProps) {
  // 分类图标映射
  const categoryIcons: Record<string, React.ComponentType<any>> = {
    '全部': Grid3X3,
    '开发': Code,
    '设计': Palette,
    '效率': Zap,
    'AI': Bot,
    '其它': Grid3X3,
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-background/80 backdrop-blur-md border-t border-muted-foreground/10',
        'safe-area-pb', // 兼容iOS安全区域
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-2 max-w-md mx-auto">
          {categories.map((category, index) => {
            const IconComponent = categoryIcons[category] || Grid3X3;
            const isActive = activeCategory === category;
            
            return (
              <motion.button
                key={category}
                onClick={() => onChange(category)}
                className={cn(
                  'flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200',
                  'hover:bg-muted/50 active:scale-95',
                  isActive && 'bg-muted'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: 'easeOut'
                }}
                aria-label={`切换到${category}分类`}
              >
                {/* 图标容器 */}
                <div className={cn(
                  'relative p-2 rounded-lg transition-all duration-200',
                  isActive ? [
                    // 激活状态 - 渐变背景
                    'dark:bg-gradient-to-br dark:from-slate-600/20 dark:to-slate-700/20',
                    'bg-gradient-to-br from-orange-400/20 to-yellow-400/20',
                    'dark:border dark:border-slate-500/30',
                    'border border-orange-400/30'
                  ] : [
                    // 非激活状态
                    'bg-transparent'
                  ]
                )}>
                  <IconComponent 
                    className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? [
                        // 激活状态颜色
                        'dark:text-slate-300 text-orange-600'
                      ] : [
                        // 非激活状态颜色
                        'text-muted-foreground hover:text-foreground'
                      ]
                    )}
                  />
                  
                  {/* 激活状态的发光效果 */}
                  {isActive && (
                    <motion.div
                      className={cn(
                        "absolute inset-0 rounded-lg",
                        // 暗色主题：石板色发光
                        "dark:bg-gradient-to-br dark:from-slate-500/10 dark:to-slate-600/10",
                        // 浅色主题：橙黄色发光
                        "bg-gradient-to-br from-orange-400/10 to-yellow-400/10"
                      )}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
                
                {/* 分类名称 */}
                <span className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isActive ? [
                    'dark:text-slate-300 text-orange-600'
                  ] : [
                    'text-muted-foreground'
                  ]
                )}>
                  {category}
                </span>
                
                {/* 激活指示器 */}
                {isActive && (
                  <motion.div
                    className={cn(
                      "absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full",
                      // 暗色主题：石板色指示器
                      "dark:bg-slate-300",
                      // 浅色主题：橙色指示器
                      "bg-orange-500"
                    )}
                    layoutId="bottom-nav-indicator"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* 底部装饰线 */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-px",
        // 暗色主题：石板色装饰线
        "dark:bg-gradient-to-r dark:from-transparent dark:via-slate-500/50 dark:to-transparent",
        // 浅色主题：橙色装饰线
        "bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"
      )} />
    </motion.nav>
  );
}
