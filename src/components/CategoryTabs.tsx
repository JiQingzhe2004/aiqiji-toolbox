import React from 'react';
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
  return (
    <div className={cn("flex justify-center animate-fade-in-up animate-delay-200", className)}>
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
    </div>
  );
}
