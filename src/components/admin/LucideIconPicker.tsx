/**
 * Lucide图标选择器组件
 * 优化版本：增强弹窗交互体验
 */

import React, { useState, useMemo } from 'react';
import { Search, X, Grid3X3, List, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 图标分类配置
const ICON_CATEGORIES = {
  '全部': [],
  '箭头': ['Arrow', 'Chevron', 'Move', 'Corner'],
  '文件': ['File', 'Folder', 'Document', 'Page'],
  '界面': ['Menu', 'Settings', 'Home', 'User', 'Profile'],
  '媒体': ['Play', 'Pause', 'Stop', 'Music', 'Video', 'Image'],
  '通信': ['Mail', 'Message', 'Phone', 'Chat'],
  '商务': ['Building', 'Briefcase', 'Calculator', 'Chart'],
  '工具': ['Tool', 'Wrench', 'Gear', 'Cog'],
  '自然': ['Sun', 'Moon', 'Cloud', 'Tree', 'Leaf'],
  '形状': ['Circle', 'Square', 'Triangle', 'Star', 'Heart'],
  '设备': ['Monitor', 'Phone', 'Tablet', 'Laptop', 'Camera'],
  '交通': ['Car', 'Plane', 'Train', 'Bike', 'Ship'],
};

// 获取所有Lucide图标
const getAllLucideIcons = () => {
  const icons: Record<string, React.ComponentType<any>> = {};
  Object.keys(LucideIcons).forEach(key => {
    const Icon = (LucideIcons as any)[key];
    if (typeof Icon === 'function' && key !== 'createLucideIcon') {
      icons[key] = Icon;
    }
  });
  return icons;
};

// 根据分类过滤图标
const filterIconsByCategory = (icons: Record<string, React.ComponentType<any>>, category: string) => {
  if (category === '全部') return Object.entries(icons);
  
  const keywords = ICON_CATEGORIES[category as keyof typeof ICON_CATEGORIES] || [];
  return Object.entries(icons).filter(([iconName]) =>
    keywords.some(keyword => iconName.toLowerCase().includes(keyword.toLowerCase()))
  );
};

interface LucideIconPickerProps {
  selectedIcon?: string;
  onSelect: (iconName: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LucideIconPicker({ selectedIcon, onSelect, open, onOpenChange }: LucideIconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const allIcons = useMemo(() => getAllLucideIcons(), []);

  // 过滤图标
  const filteredIcons = useMemo(() => {
    let icons = filterIconsByCategory(allIcons, selectedCategory);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(([name]) =>
        name.toLowerCase().includes(query)
      );
    }
    
    return icons;
  }, [allIcons, selectedCategory, searchQuery]);

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
    onOpenChange(false);
    setSearchQuery('');
    setSelectedCategory('全部');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
    setSelectedCategory('全部');
    setHoveredIcon(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>选择Lucide图标</span>
            {selectedIcon && (
              <Badge variant="outline" className="flex items-center gap-1">
                {(() => {
                  const SelectedIconComponent = (LucideIcons as any)[selectedIcon];
                  return SelectedIconComponent ? <SelectedIconComponent className="w-3 h-3" /> : null;
                })()}
                {selectedIcon}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 工具栏 */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索图标名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 分类选择 */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ICON_CATEGORIES).map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* 视图模式切换 */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 悬停预览 */}
          {hoveredIcon && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <div className="w-8 h-8 flex items-center justify-center bg-background rounded border">
                {(() => {
                  const HoveredIconComponent = (LucideIcons as any)[hoveredIcon];
                  return HoveredIconComponent ? <HoveredIconComponent className="w-6 h-6" /> : null;
                })()}
              </div>
              <div>
                <p className="font-medium">{hoveredIcon}</p>
                <p className="text-xs text-muted-foreground">点击选择此图标</p>
              </div>
            </div>
          )}

          {/* 图标展示区 */}
          <div className="overflow-y-auto max-h-[400px] border rounded-lg">
            {filteredIcons.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>未找到匹配的图标</p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-2 p-4">
                {filteredIcons.map(([iconName, IconComponent]) => (
                  <button
                    key={iconName}
                    onClick={() => handleIconSelect(iconName)}
                    onMouseEnter={() => setHoveredIcon(iconName)}
                    onMouseLeave={() => setHoveredIcon(null)}
                    className={cn(
                      "group p-2 rounded-lg border-2 transition-all duration-200",
                      "flex flex-col items-center gap-1 text-xs",
                      "hover:scale-105 hover:shadow-md hover:bg-muted/50",
                      "min-h-[60px]",
                      selectedIcon === iconName
                        ? "border-primary bg-primary/10 shadow-md scale-105"
                        : "border-transparent hover:border-border"
                    )}
                    title={iconName}
                  >
                    <div className="relative flex items-center justify-center w-8 h-8">
                      {IconComponent && (
                        <IconComponent className={cn(
                          "w-5 h-5 transition-all duration-200",
                          selectedIcon === iconName ? "text-primary" : "group-hover:text-primary"
                        )} />
                      )}
                      {selectedIcon === iconName && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <span className="truncate w-full text-center text-[10px] opacity-60 group-hover:opacity-100 transition-opacity leading-tight">
                      {iconName}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {filteredIcons.map(([iconName, IconComponent]) => (
                  <button
                    key={iconName}
                    onClick={() => handleIconSelect(iconName)}
                    onMouseEnter={() => setHoveredIcon(iconName)}
                    onMouseLeave={() => setHoveredIcon(null)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-left transition-colors",
                      "hover:bg-muted/50",
                      selectedIcon === iconName
                        ? "bg-primary/10 border-r-2 border-primary"
                        : ""
                    )}
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      {IconComponent && (
                        <IconComponent className={cn(
                          "w-5 h-5",
                          selectedIcon === iconName ? "text-primary" : ""
                        )} />
                      )}
                    </div>
                    <span className="font-medium">{iconName}</span>
                    {selectedIcon === iconName && (
                      <Badge variant="secondary" className="ml-auto">已选中</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 状态栏 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
            <span>
              显示 {filteredIcons.length} / {Object.keys(allIcons).length} 个图标
              {selectedCategory !== '全部' && ` · ${selectedCategory}分类`}
            </span>
            <div className="flex items-center gap-2">
              <span>视图:</span>
              <Badge variant="outline" className="text-xs">
                {viewMode === 'grid' ? '网格' : '列表'}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
