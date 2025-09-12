/**
 * 管理页面工具表单组件 - 全屏版本
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Star, Trash2, X, Loader2 } from 'lucide-react';
import { preprocessFormData } from '@/utils/dataValidator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ImageEditor } from './ImageEditor';
import toast from 'react-hot-toast';
import { toolsApi } from '@/services/toolsApi';
import type { Tool } from '@/types';
import { cn } from '@/lib/utils';

interface AdminToolFormProps {
  tool?: Tool;
  onSave: (tool: Partial<Tool>) => void;
  onClose: () => void;
  saving?: boolean;
}

export function AdminToolForm({ tool, onSave, onClose, saving = false }: AdminToolFormProps) {
  const [formData, setFormData] = useState({
    id: tool?.id || '',
    name: tool?.name || '',
    description: tool?.description || '',
    content: tool?.content || '',
    icon_url: tool?.icon_url || '',
    icon_theme: tool?.icon_theme || 'auto',
    icon_layout: (tool as any)?.icon_layout || 'center',
    icon_size: (tool as any)?.icon_size || 'medium',
    categories: tool?.category ? (Array.isArray(tool.category) ? tool.category : [tool.category]) : [] as string[],
    url: tool?.url || '',
    featured: tool?.featured || false,
    status: tool?.status || 'active',
    sort_order: tool?.sort_order || 0,
    tags: tool?.tags || [] as string[],
    needs_vpn: tool?.needs_vpn || false,
  });

  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['AI', '效率', '设计', '开发', '其他'];

  // 锁定背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const processedResult = preprocessFormData({
        ...formData,
        category: formData.categories
      });

      // 检查验证结果
      if (!processedResult.validation.isValid) {
        toast.error(`数据验证失败: ${processedResult.validation.errors.join(', ')}`);
        return;
      }

      onSave(processedResult.data);
    } catch (error) {
      console.error('提交失败:', error);
      toast.error(error instanceof Error ? error.message : '提交失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold hidden md:block">
              {tool ? '编辑工具' : '添加工具'}
            </h1>
            <h1 className="text-lg font-semibold md:hidden truncate">
              {tool ? tool.name : '添加工具'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving || uploading}
          >
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving || uploading}
            className="min-w-[100px]"
            form="tool-form"
          >
            {(saving || uploading) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {saving ? '提交中...' : uploading ? '上传中...' : tool ? '保存修改' : '添加工具'}
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <form id="tool-form" onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>工具名称 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入工具名称"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>工具ID *</Label>
              <Input
                value={formData.id}
                placeholder="系统自动生成的工具ID"
                required
                readOnly={true}
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                工具ID由系统自动生成，无需手动填写
              </p>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>工具链接 *</Label>
              <Input
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com"
                type="url"
                required
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>简短描述 *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请输入工具的简短描述"
                rows={3}
                required
              />
            </div>
          </div>

          {/* 图标设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">图标设置</h3>
            
            <div className="space-y-4">
              <ImageEditor
                value={formData.icon_url}
                onChange={(value) => handleInputChange('icon_url', value)}
                theme={formData.icon_theme}
                onThemeChange={(theme) => handleInputChange('icon_theme', theme)}
                layout={formData.icon_layout as 'left' | 'center' | 'right'}
                onLayoutChange={(layout) => handleInputChange('icon_layout', layout)}
                imageSize={formData.icon_size as 'small' | 'medium' | 'large'}
                onImageSizeChange={(size) => handleInputChange('icon_size', size)}
                toolName={formData.name || '工具'}
                size="lg"
              />
              
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">图标使用说明</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 点击图标预览区域可以编辑图片链接</li>
                  <li>• 使用"图片大小"调整图标显示尺寸</li>
                  <li>• 使用"横向排版"调整图标在容器中的位置</li>
                  <li>• 使用"显示主题"调整图标在不同主题下的显示效果</li>
                  <li>• 推荐使用正方形图标，尺寸建议 200x200 像素以上</li>
                  <li>• SVG格式图标在缩放时效果最佳</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 分类和标签 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">分类和标签</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>分类</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={formData.categories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>标签</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 w-4 h-4"
                        onClick={() => handleRemoveTag(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="输入标签"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 高级设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">高级设置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>推荐工具</Label>
                  <p className="text-sm text-muted-foreground">
                    推荐的工具会在首页显示推荐标记
                  </p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleInputChange('featured', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>需要VPN</Label>
                  <p className="text-sm text-muted-foreground">
                    标记该工具是否需要VPN访问
                  </p>
                </div>
                <Switch
                  checked={formData.needs_vpn}
                  onCheckedChange={(checked) => handleInputChange('needs_vpn', checked)}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>工具状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                  <SelectItem value="maintenance">维护</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
