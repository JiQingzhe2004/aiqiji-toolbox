import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Category } from '@/types';

/**
 * 分类标签组件属性接口
 */
interface CategoryTabsProps {
  categories: Category[];
  activeCategory: Category;
  onChange: (category: Category) => void;
  className?: string;
}

/**
 * 分类标签组件
 * 用于展示和切换工具分类
 */
export function CategoryTabs({ 
  categories, 
  activeCategory, 
  onChange, 
  className 
}: CategoryTabsProps) {
  // 检查是否使用flex-wrap布局
  const isFlexWrap = className?.includes('flex-wrap');
  
  if (isFlexWrap) {
    // 平板端使用flex-wrap布局，按钮式样式
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn("flex flex-wrap gap-2", className)}
      >
        {categories.map((category) => (
          <motion.button
            key={category}
            onClick={() => onChange(category)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
              "hover:scale-105 active:scale-95",
              activeCategory === category
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background hover:bg-muted border-border/50 hover:border-border"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {category}
          </motion.button>
        ))}
      </motion.div>
    );
  }

  // 标准网格布局 - 用于其他场景
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn("flex justify-center", className)}
    >
      <Tabs
        value={activeCategory}
        onValueChange={(value) => onChange(value as Category)}
        className="w-full max-w-2xl"
      >
        <TabsList className={cn(
          "grid w-full h-12 p-1",
          // 响应式网格 - 确保正确的列数
          categories.length >= 6 ? "grid-cols-6" :
          categories.length === 5 ? "grid-cols-5" :
          categories.length === 4 ? "grid-cols-4" :
          categories.length === 3 ? "grid-cols-3" :
          "grid-cols-2"
        )}>
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="relative px-4 py-2 text-sm font-medium"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </motion.div>
  );
}
