import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { ExternalLink, Copy, Star, Calendar, CheckCircle, TabletSmartphone, ShieldBan, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import { Confetti, type ConfettiRef } from '@/components/magicui/confetti';
import { QRCodeModal } from './QRCodeModal';
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
 * 智能标签组件 - 根据容器宽度动态显示标签
 */
const SmartTags = memo(function SmartTags({ tags }: { tags: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleTags, setVisibleTags] = useState<string[]>([]);
  const [hiddenTags, setHiddenTags] = useState<string[]>([]);

  useEffect(() => {
    if (!containerRef.current || !tags.length) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    
    // 创建临时测量元素
    const measureTag = (text: string) => {
      const temp = document.createElement('span');
      temp.className = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-secondary/60 text-secondary-foreground whitespace-nowrap';
      temp.textContent = text;
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      temp.style.pointerEvents = 'none';
      document.body.appendChild(temp);
      const width = temp.offsetWidth + 6; // 6px for gap
      document.body.removeChild(temp);
      return width;
    };

    let currentWidth = 0;
    const visible: string[] = [];
    const hidden: string[] = [];
    
    // 为 "+N" 标签预留空间（估算）
    const plusTagWidth = 40; // 估算 "+N" 标签的宽度
    const availableWidth = containerWidth - plusTagWidth;

    for (let i = 0; i < tags.length; i++) {
      const tagWidth = measureTag(tags[i]);
      
      if (currentWidth + tagWidth <= availableWidth || i === 0) {
        // 至少显示一个标签，即使超出宽度
        visible.push(tags[i]);
        currentWidth += tagWidth;
      } else {
        hidden.push(...tags.slice(i));
        break;
      }
    }

    // 如果所有标签都能放下，就不需要 "+N" 标签
    if (hidden.length === 0) {
      // 重新计算，不预留 "+N" 标签空间
      currentWidth = 0;
      visible.length = 0;
      
      for (let i = 0; i < tags.length; i++) {
        const tagWidth = measureTag(tags[i]);
        
        if (currentWidth + tagWidth <= containerWidth) {
          visible.push(tags[i]);
          currentWidth += tagWidth;
        } else {
          hidden.push(...tags.slice(i));
          break;
        }
      }
    }

    setVisibleTags(visible);
    setHiddenTags(hidden);
  }, [tags]);

  if (!tags.length) return null;

  return (
    <div ref={containerRef} className="flex flex-wrap gap-1.5 min-h-[28px]">
      {visibleTags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-secondary/60 text-secondary-foreground hover:bg-secondary transition-colors whitespace-nowrap"
        >
          {tag}
        </span>
      ))}
      {hiddenTags.length > 0 && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-help whitespace-nowrap">
                +{hiddenTags.length}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border shadow-md max-w-xs">
              <div className="flex flex-wrap gap-1 justify-center">
                {hiddenTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded bg-secondary/80 text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
});

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
  const [showQRModal, setShowQRModal] = useState(false);

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
          
          {/* 主图标/Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative p-4 rounded-2xl bg-background/70 backdrop-blur-md border border-border/50 shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
              {getToolIconUrl(tool) ? (
                <img 
                  src={getToolIconUrl(tool)} 
                  alt={`${tool.name} logo`}
                  className={cn(
                    "h-8 w-8 object-contain rounded-sm",
                    // 主题适配逻辑：根据图标原始颜色类型进行适配
                    (tool.logoTheme === 'auto-dark' || tool.logoTheme === 'auto' || tool.logoTheme === 'dark' || !tool.logoTheme) && "dark:invert", // 深色图标
                    (tool.logoTheme === 'auto-light' || tool.logoTheme === 'light') && "invert dark:invert-0", // 浅色图标
                    // none: 不添加任何样式，保持原色
                  )}
                  onError={(e) => {
                    // 如果logo加载失败，显示备用图标
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              {/* 图标功能已移除，使用图片或默认样式 */}
            </div>
          </div>
          
          {/* 推荐标识和状态标识 */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {tool.featured && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-yellow-50 rounded-full text-xs font-medium shadow-sm">
                <Star className="w-3 h-3 fill-current" />
                推荐
              </div>
            )}
            {/* 状态标识 */}
            {tool.status !== 'active' && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 backdrop-blur-sm rounded-full text-xs font-medium shadow-sm",
                tool.status === 'inactive' && "bg-red-500/90 text-red-50",
                tool.status === 'maintenance' && "bg-yellow-600/90 text-yellow-50"
              )}>
                {tool.status === 'inactive' ? (
                  <>
                    <ShieldBan className="w-3 h-3" />
                    停用
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3 h-3" />
                    维护
                  </>
                )}
              </div>
            )}
          </div>
          
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
                side="top" 
                className="max-w-xs p-3 bg-popover text-popover-foreground border border-border shadow-md"
              >
                <p className="text-sm">{tool.description || tool.desc}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 智能标签 */}
        {tool.tags && tool.tags.length > 0 && (
          <SmartTags tags={tool.tags} />
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
              className={cn(
                "w-full",
                tool.status === 'inactive' && "opacity-50 cursor-not-allowed"
              )}
              hoverText={
                tool.status === 'active' 
                  ? `打开${tool.name}` 
                  : tool.status === 'inactive' 
                    ? '工具已停用' 
                    : `打开${tool.name}（维护）`
              }
              onClick={(e) => {
                e.stopPropagation();
                if (tool.status === 'inactive') {
                  // 只有停用的工具禁止访问
                  toast.error('该工具已停用', {
                    duration: 2000,
                    position: 'bottom-center'
                  });
                } else {
                  // 正常和维护的工具都可以访问
                  if (tool.status === 'maintenance') {
                    // 维护工具给予提示但仍可访问
                    toast('该工具正在维护，可能存在功能不稳定', {
                      duration: 3000,
                      position: 'bottom-center',
                      style: {
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        border: '1px solid hsl(var(--warning))',
                        borderLeft: '4px solid hsl(var(--warning))'
                      },
                      icon: '⚠️'
                    });
                  }
                  openTool(e);
                }
              }}
            >
              {tool.status === 'active' ? '打开工具' : 
               tool.status === 'inactive' ? '已停用' : '打开工具'}
            </InteractiveHoverButton>
          </div>
          
          {/* 二维码按钮 */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  disabled={tool.status === 'inactive'}
                  className={cn(
                    "rounded-full aspect-square w-10 h-10 transition-all duration-200",
                    tool.status !== 'inactive' 
                      ? "hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:scale-105"
                      : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tool.status !== 'inactive') {
                      setShowQRModal(true);
                    }
                  }}
                  aria-label={`查看 ${tool.name} 的二维码`}
                >
                  <TabletSmartphone size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border shadow-md">
                <p className="text-sm">
                  {tool.status === 'inactive' ? '工具已停用' : 
                   tool.status === 'maintenance' ? '显示二维码（维护）' : '显示二维码'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* 复制链接按钮 */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  disabled={tool.status === 'inactive'}
                  className={cn(
                    "rounded-full aspect-square w-10 h-10 transition-all duration-200",
                    tool.status !== 'inactive' 
                      ? "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-105"
                      : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tool.status !== 'inactive') {
                      copyLink(e);
                    }
                  }}
                  aria-label={`复制 ${tool.name} 的链接`}
                >
                  <Copy size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-popover text-popover-foreground border border-border shadow-md">
                <p className="text-sm">
                  {tool.status === 'inactive' ? '工具已停用' : 
                   tool.status === 'maintenance' ? '复制链接（维护）' : '复制链接'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
    
    {/* 二维码弹框 */}
    <QRCodeModal
      isOpen={showQRModal}
      onClose={() => setShowQRModal(false)}
      toolName={tool.name}
      toolUrl={tool.url}
      toolDescription={tool.description || tool.desc}
    />
    </>
  );
});
