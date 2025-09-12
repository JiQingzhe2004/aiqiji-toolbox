/**
 * 简化的图片编辑组件
 * 专注于图片预览、尺寸调整和横向排版
 */

import React, { useState, useCallback } from 'react';
import { 
  Edit3, 
  Copy, 
  ExternalLink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SEOImage } from '@/components/SEOImage';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ImageEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: string;
  onThemeChange?: (theme: string) => void;
  toolName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'left' | 'center' | 'right';
  onLayoutChange?: (layout: 'left' | 'center' | 'right') => void;
  imageSize?: 'small' | 'medium' | 'large';
  onImageSizeChange?: (size: 'small' | 'medium' | 'large') => void;
}

export function ImageEditor({ 
  value, 
  onChange, 
  theme = 'auto',
  onThemeChange,
  toolName = '工具',
  className,
  size = 'md',
  layout = 'center',
  onLayoutChange,
  imageSize = 'medium',
  onImageSizeChange
}: ImageEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [imageError, setImageError] = useState(false);

  // 尺寸配置
  const sizeConfig = {
    sm: { container: 'h-20', preview: 'w-16 h-16' },
    md: { container: 'h-28', preview: 'w-20 h-20' },
    lg: { container: 'h-36', preview: 'w-28 h-28' }
  };

  // 图片尺寸配置
  const imageSizeConfig = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20', 
    large: 'w-28 h-28'
  };

  const currentSize = sizeConfig[size];
  const currentImageSize = imageSizeConfig[imageSize];

  // 处理图片链接更新
  const handleUrlSubmit = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue !== value) {
      onChange(trimmedValue);
      toast.success('图片链接已更新');
    }
    setIsEditing(false);
    setImageError(false);
  }, [editValue, value, onChange]);

  // 处理图片复制
  const handleCopyUrl = useCallback(async () => {
    if (!value) return;
    
    try {
      await navigator.clipboard.writeText(value);
      toast.success('图片链接已复制');
    } catch (error) {
      toast.error('复制失败');
    }
  }, [value]);

  // 处理图片在新窗口打开
  const handleOpenImage = useCallback(() => {
    if (!value) return;
    window.open(value, '_blank', 'noopener,noreferrer');
  }, [value]);

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, [value]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* 图片预览区域 */}
      <div className={cn("relative border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 transition-colors hover:border-muted-foreground/40", currentSize.container)}>
        <div className={cn(
          "h-full flex items-center",
          layout === 'left' && "justify-start",
          layout === 'center' && "justify-center", 
          layout === 'right' && "justify-end"
        )}>
          {value ? (
            <div 
              className={cn(
                "relative rounded-lg overflow-hidden border bg-background shadow-sm cursor-pointer hover:shadow-md transition-all duration-200",
                currentImageSize
              )}
              onClick={() => {
                setIsEditing(true);
                setEditValue(value);
              }}
            >
              {!imageError ? (
                <SEOImage
                  src={value}
                  alt={`${toolName} 图标`}
                  className={cn(
                    "w-full h-full object-contain",
                    // 主题适配
                    theme === 'auto-dark' || theme === 'auto' || theme === 'dark' ? "dark:invert" : "",
                    theme === 'auto-light' || theme === 'light' ? "invert dark:invert-0" : ""
                  )}
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/30">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ) : (
            <div 
              className={cn(
                "border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors",
                currentImageSize
              )}
              onClick={() => {
                setIsEditing(true);
                setEditValue('');
              }}
            >
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* 编辑区域 */}
      {isEditing && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <Label>图片链接</Label>
          <div className="space-y-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="https://example.com/image.png"
              type="url"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editValue.trim()) {
                  handleUrlSubmit();
                }
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditValue(value);
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(value);
                }}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleUrlSubmit}
                disabled={!editValue.trim()}
              >
                {value ? "保存更改" : "添加图片"}
              </Button>
              {value && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  复制
                </Button>
              )}
              {value && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenImage}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  查看
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 控制面板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 图片大小控制 */}
        {onImageSizeChange && (
          <div className="space-y-2">
            <Label className="text-sm">图片大小</Label>
            <div className="flex gap-1">
              <Button
                variant={imageSize === 'small' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onImageSizeChange('small')}
                className="flex-1"
              >
                <Minimize2 className="w-3 h-3 mr-1" />
                小
              </Button>
              <Button
                variant={imageSize === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onImageSizeChange('medium')}
                className="flex-1"
              >
                中
              </Button>
              <Button
                variant={imageSize === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onImageSizeChange('large')}
                className="flex-1"
              >
                <Maximize2 className="w-3 h-3 mr-1" />
                大
              </Button>
            </div>
          </div>
        )}

        {/* 横向排版控制 */}
        {onLayoutChange && (
          <div className="space-y-2">
            <Label className="text-sm">横向排版</Label>
            <div className="flex gap-1">
              <Button
                variant={layout === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLayoutChange('left')}
                className="flex-1"
              >
                <AlignLeft className="w-3 h-3 mr-1" />
                左
              </Button>
              <Button
                variant={layout === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLayoutChange('center')}
                className="flex-1"
              >
                <AlignCenter className="w-3 h-3 mr-1" />
                中
              </Button>
              <Button
                variant={layout === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLayoutChange('right')}
                className="flex-1"
              >
                <AlignRight className="w-3 h-3 mr-1" />
                右
              </Button>
            </div>
          </div>
        )}

        {/* 主题控制 */}
        {onThemeChange && (
          <div className="space-y-2">
            <Label className="text-sm">显示主题</Label>
            <Select value={theme} onValueChange={onThemeChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动</SelectItem>
                <SelectItem value="auto-light">浅色图标</SelectItem>
                <SelectItem value="auto-dark">深色图标</SelectItem>
                <SelectItem value="light">强制浅色</SelectItem>
                <SelectItem value="dark">强制深色</SelectItem>
                <SelectItem value="none">保持原色</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 快捷操作 */}
      {!isEditing && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(true);
              setEditValue(value);
            }}
            className="flex-1"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {value ? "编辑链接" : "添加图片"}
          </Button>
          
          {value && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenImage}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}