import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, Star, Calendar, CheckCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { Confetti, type ConfettiRef } from '@/components/magicui/confetti';
import * as AspectRatio from '@radix-ui/react-aspect-ratio';
import toast from 'react-hot-toast';
import type { Tool } from '@/types';
import { cn, openExternalLinkWithWarning, formatDate } from '@/lib/utils';
import { getToolIconUrl } from '@/utils/imageUtils';

/**
 * MagicCard组件属性接口
 */
interface MagicCardProps {
  tool: Tool;
  searchQuery?: string;
  className?: string;
}

/**
 * Magic UI风格的工具卡片组件
 * 实现类似图片中的发光边框和悬停效果
 */
export const MagicCard = memo(function MagicCard({ 
  tool, 
  searchQuery = '', 
  className 
}: MagicCardProps) {
  const confettiRef = React.useRef<ConfettiRef>(null);
  // 动态获取图标组件
  const IconComponent = useMemo(() => 
    tool.icon && tool.icon in LucideIcons 
      ? (LucideIcons as any)[tool.icon] 
      : LucideIcons.Wrench,
    [tool.icon]
  );

  // 复制链接功能
  const copyLink = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(tool.url);
      
      // 触发彩带效果
      confettiRef.current?.fire({
        particleCount: 30,
        spread: 60,
        origin: { 
          x: (e.clientX) / window.innerWidth, 
          y: (e.clientY) / window.innerHeight 
        },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42'],
        shapes: ['circle', 'square'],
        startVelocity: 25,
        decay: 0.95,
        ticks: 150
      });
      
      // 显示成功提示
      toast.success('链接已复制到剪贴板！', {
        duration: 2000,
        position: 'bottom-center',
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        icon: React.createElement(CheckCircle, { 
          className: "w-5 h-5 text-green-500" 
        }),
      });
      
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案：选择文本
      const textArea = document.createElement('textarea');
      textArea.value = tool.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // 即使降级方案也触发彩带效果
      confettiRef.current?.fire({
        particleCount: 20,
        spread: 45,
        origin: { 
          x: (e.clientX) / window.innerWidth, 
          y: (e.clientY) / window.innerHeight 
        },
        colors: ['#26ccff', '#a25afd'],
        startVelocity: 20
      });
      
      // 显示成功提示
      toast.success('链接已复制到剪贴板！', {
        duration: 2000,
        position: 'bottom-center',
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        icon: React.createElement(CheckCircle, { 
          className: "w-5 h-5 text-green-500" 
        }),
      });
    }
  }, [tool.url, tool.name]);

  // 打开工具链接
  const openTool = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openExternalLinkWithWarning(tool.url, tool.name);
  }, [tool.url, tool.name]);

  // 高亮匹配文本
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
    const description = tool.description || tool.desc || '';
    if (!searchQuery.trim()) return description;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = description.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  }, [tool.description, tool.desc, searchQuery]);

  return (
    <>
      <Confetti ref={confettiRef} />
      <Card className="overflow-hidden group">
      {/* Radix AspectRatio 确保图片区域完美比例 */}
      <AspectRatio.Root ratio={16 / 9}>
        <div className="relative w-full h-full bg-gradient-to-br from-background/5 via-muted/30 to-muted/60 overflow-hidden">
          {/* 背景图案 */}
          <DotPattern 
            className="text-muted-foreground/25" 
            width={12} 
            height={12} 
            cr={0.5}
          />
          
          {/* 径向渐变遮罩 - 创建中心亮、周围暗的效果 */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/40" />
          
          {/* 主图标/Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative p-4 rounded-2xl bg-background/70 backdrop-blur-md border border-border/50 shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
              {getToolIconUrl(tool) ? (
                <img 
                  src={getToolIconUrl(tool)} 
                  alt={`${tool.name} logo`}
                  className={cn(
                    "h-8 w-8 object-contain rounded-sm",
                    // 主题适配逻辑
                    (tool.logoTheme === 'invert') && "invert",
                    (tool.logoTheme === 'auto') && "dark:invert",
                    (!tool.logoTheme || tool.logoTheme === 'auto') && "dark:invert"
                  )}
                  onError={(e) => {
                    // 如果logo加载失败，显示备用图标
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <IconComponent 
                className={`h-9 w-9 text-foreground ${getToolIconUrl(tool) ? 'hidden' : ''}`} 
              />
            </div>
          </div>
          
          {/* 推荐标识 */}
          {tool.featured && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-yellow-50 rounded-full text-xs font-medium shadow-sm">
                <Star className="w-3 h-3 fill-current" />
                推荐
              </div>
            </div>
          )}
          
          {/* Hover 效果 */}
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </AspectRatio.Root>

      {/* 内容区域 */}
      <div className="p-4 space-y-3">
        <div>
          <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {highlightedName}
          </CardTitle>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardDescription className="text-sm mt-1 h-12 leading-6 line-clamp-2 cursor-help">
                  {highlightedDesc}
                </CardDescription>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="max-w-xs p-3 bg-popover text-popover-foreground border border-border shadow-md"
              >
                <p className="text-sm">{tool.description || tool.desc}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 标签 */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tool.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-secondary/60 text-secondary-foreground hover:bg-secondary transition-colors"
              >
                {tag}
              </span>
            ))}
            {tool.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                +{tool.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 时间信息 */}
        {(tool.created_at || tool.createdAt) && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1.5" />
            {formatDate((tool.created_at || tool.createdAt)!)}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 group/button">
            <InteractiveHoverButton 
              className="w-full"
              hoverText={`打开${tool.name}`}
              onClick={(e) => {
                e.stopPropagation();
                openTool(e);
              }}
            >
              打开工具
            </InteractiveHoverButton>
          </div>
          <motion.div
            whileHover={{ 
              scale: 1.1,
              rotate: 15,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ 
              scale: 0.95,
              transition: { duration: 0.1 }
            }}
          >
            <Button
              size="icon"
              variant="outline"
              className="rounded-full aspect-square w-10 h-10 transition-colors duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary"
              onClick={(e) => {
                e.stopPropagation();
                copyLink(e);
              }}
              aria-label={`复制 ${tool.name} 的链接`}
              title="复制链接"
            >
              <motion.div
                whileHover={{ 
                  rotate: -15,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
              >
                <Copy size={16} />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>
    </Card>
    </>
  );
});
