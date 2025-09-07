import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, Star, Calendar } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Tool } from '@/types';
import { cn, openExternalLink, formatDate } from '@/lib/utils';

/**
 * ToolCard组件属性接口
 */
interface ToolCardProps {
  tool: Tool;
  searchQuery?: string;
  className?: string;
}

/**
 * 工具卡片组件
 * 包含动画效果、标签显示、操作按钮等功能
 * 符合提示词要求的设计和交互规范
 */
export const ToolCard = memo(function ToolCard({ 
  tool, 
  searchQuery = '', 
  className 
}: ToolCardProps) {
  // 动态获取图标组件 - 使用useMemo缓存
  const IconComponent = useMemo(() => 
    tool.icon in LucideIcons 
      ? (LucideIcons as any)[tool.icon] 
      : LucideIcons.Wrench,
    [tool.icon]
  );

  // 复制链接到剪贴板 - 使用useCallback优化
  const copyLink = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(tool.url);
      // 可以添加toast提示
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, [tool.url]);

  // 打开工具链接 - 使用useCallback优化
  const openTool = useCallback((e: React.MouseEvent) => {
    // 检查是否按住Ctrl/Cmd键
    const newTab = e.ctrlKey || e.metaKey || e.button === 1;
    openExternalLink(tool.url, newTab);
  }, [tool.url]);

  // 高亮匹配文本 - 使用useMemo缓存计算结果
  const highlightedName = useMemo(() => {
    if (!searchQuery.trim()) return tool.name;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = tool.name.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  }, [tool.name, searchQuery]);

  const highlightedDesc = useMemo(() => {
    if (!searchQuery.trim()) return tool.desc;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = tool.desc.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  }, [tool.desc, searchQuery]);

  // 高亮标签函数 - 使用useCallback优化
  const highlightTag = useCallback((tag: string) => {
    if (!searchQuery.trim()) return tag;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = tag.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  }, [searchQuery]);

  return (
    <motion.div
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.2, 
        ease: [0.25, 0.1, 0.25, 1.0] // 更平滑的贝塞尔曲线
      }}
      whileHover={{ 
        scale: 1.02, // 减小缩放比例
        transition: { duration: 0.15, ease: 'easeOut' }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      className={cn(className, 'will-change-transform')} // 添加will-change优化
    >
      <Card 
        className={cn(
          'group h-full cursor-pointer',
          // 移除CSS transition，只使用framer-motion动画
          'shadow-lg hover:shadow-xl',
          'ring-1 ring-transparent hover:ring-violet-500/20',
          'bg-card/50 backdrop-blur-sm border-muted-foreground/10',
          tool.featured && 'ring-violet-500/30'
        )}
        onClick={openTool}
        role="button"
        tabIndex={0}
        aria-label={`打开工具: ${tool.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openTool(e as any);
          }
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* 工具图标 */}
              <motion.div 
                className={cn(
                  'p-2 rounded-xl',
                  'bg-gradient-to-br from-violet-500/10 to-cyan-500/10'
                )}
                whileHover={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(6, 182, 212, 0.2))',
                  transition: { duration: 0.2 }
                }}
              >
                <IconComponent 
                  className="w-6 h-6 text-violet-600 dark:text-violet-400" 
                  role="img"
                  aria-label={`${tool.name}图标`}
                />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg leading-tight">
                  {highlightedName}
                </CardTitle>
                
                {/* 创建时间 */}
                {tool.createdAt && (
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(tool.createdAt)}
                  </div>
                )}
              </div>
            </div>
            
            {/* 推荐标识 */}
            {tool.featured && (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            )}
          </div>
          
          <CardDescription className="text-sm leading-relaxed">
            {highlightedDesc}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-3">
          {/* 标签 */}
          {tool.tags && tool.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tool.tags.map((tag, index) => (
                <span
                  key={index}
                  className={cn(
                    'px-2 py-1 text-xs rounded-lg',
                    'bg-muted text-muted-foreground',
                    'border border-muted-foreground/20'
                  )}
                >
                  {highlightTag(tag)}
                </span>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center space-x-2 w-full">
            {/* 主要操作按钮 */}
            <Button
              className="flex-1"
              onClick={openTool}
              aria-label={`打开 ${tool.name}`}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              打开工具
            </Button>
            
            {/* 复制链接按钮 */}
            <Button
              variant="outline"
              size="icon"
              onClick={copyLink}
              aria-label={`复制 ${tool.name} 的链接`}
              title="复制链接"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>

      </Card>
    </motion.div>
  );
});
