import React from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Code2, 
  Wand, 
  Pickaxe, 
  Sparkles, 
  Boxes
} from 'lucide-react';
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
  // 分类图标映射 - 与桌面端保持一致
  const categoryIcons: Record<string, React.ComponentType<any>> = {
    '全部': Layers,
    '开发': Code2,
    '设计': Wand,
    '效率': Pickaxe,
    'AI': Sparkles,
    '其他': Boxes,
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-background/95 backdrop-blur-xl border-t border-border/50',
        'pb-safe', // 使用正确的安全区域类名
        className
      )}
    >
      <div className="px-2">
        <div className="flex items-center justify-around h-20 max-w-sm mx-auto">
          {categories.map((category, index) => {
            const IconComponent = categoryIcons[category] || Boxes;
            const isActive = activeCategory === category;
            
            return (
              <motion.button
                key={category}
                onClick={() => onChange(category)}
                className={cn(
                  'flex flex-col items-center justify-center min-w-0 px-1 py-3 transition-all duration-200',
                  'active:scale-95 relative'
                )}
                whileHover={{ scale: 1.02 }}
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
                {/* 图标 */}
                <div className="relative">
                  <IconComponent 
                    className={cn(
                      'w-6 h-6 transition-all duration-200',
                      isActive ? [
                        'text-primary scale-110'
                      ] : [
                        'text-muted-foreground'
                      ]
                    )}
                  />
                </div>
                
                {/* 分类名称 */}
                <span className={cn(
                  'text-xs font-medium transition-colors duration-200 mt-1 truncate',
                  isActive ? [
                    'text-primary'
                  ] : [
                    'text-muted-foreground'
                  ]
                )}>
                  {category}
                </span>
                
                {/* 激活指示器 - 底部小点 */}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    layoutId="bottom-nav-indicator"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* 顶部分割线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-border/50" />
    </motion.nav>
  );
}
