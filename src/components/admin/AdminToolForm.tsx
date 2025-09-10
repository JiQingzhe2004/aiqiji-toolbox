/**
 * 管理页面工具表单组件 - 简化版（移除图标功能）
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { toolsApi } from '@/services/toolsApi';
import type { Tool } from '@/types';
import { cn, generateToolId } from '@/lib/utils';

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
    icon_url: tool?.icon_url || '',
    icon_theme: tool?.icon_theme || 'auto',
    categories: tool?.category ? (Array.isArray(tool.category) ? tool.category : [tool.category]) : [] as string[], // 支持多分类
    url: tool?.url || '',
    featured: tool?.featured || false,
    status: tool?.status || 'active',
    sort_order: tool?.sort_order || 0,
    tags: tool?.tags || [],
  });

  const [newTag, setNewTag] = useState('');
  const [recentlyDeletedTag, setRecentlyDeletedTag] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['AI', '效率', '设计', '开发', '其他'];

  // 处理输入变化
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 处理分类选择
  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // 清理blob URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 添加标签
  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setRecentlyDeletedTag(tagToRemove);
    setTimeout(() => setRecentlyDeletedTag(null), 3000);
  };

  // 恢复标签
  const restoreTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setRecentlyDeletedTag(null);
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    setSelectedFile(file);
    
    // 创建blob URL用于预览，但不设置到icon_url字段（该字段用于外链）
    const blobUrl = URL.createObjectURL(file);
    
    // 清理之前的预览URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(blobUrl);
    
    // 清空icon_url字段，因为现在使用的是本地文件
    handleInputChange('icon_url', '');
    
    console.log('文件已选择，创建预览URL:', blobUrl);
  };

  // 实际上传文件的函数
  const uploadSelectedFile = async (file: File): Promise<string> => {
    const uploadResult = await toolsApi.uploadIcon(file);
    
    if (uploadResult.success && uploadResult.data?.url) {
      return uploadResult.data.url;
    } else {
      throw new Error(uploadResult.message || '上传失败');
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 前端验证
    if (formData.description.length < 10) {
      toast.error('工具描述至少需要10个字符');
      return;
    }
    
    if (formData.description.length > 1000) {
      toast.error('工具描述不能超过1000个字符');
      return;
    }
    
    try {
      setUploading(true);
      
      let finalFormData = { ...formData };
      
      // 如果有选择的文件，则先上传文件
      if (selectedFile) {
        console.log('正在上传图标文件...');
        const uploadedUrl = await uploadSelectedFile(selectedFile);
        finalFormData.icon_url = uploadedUrl;
        console.log('图标上传成功:', uploadedUrl);
        
        // 清理预览URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl('');
        }
        setSelectedFile(null);
      }
      
      // 预处理表单数据
      const processedData = preprocessFormData(finalFormData);
      
      // 生成ID（如果是新工具）
      const submitData = {
        ...processedData.data,
        id: processedData.data.id || generateToolId(processedData.data.name),
        category: processedData.data.categories.length > 0 ? processedData.data.categories : ['其他'], // 发送完整的分类数组
      };
      
      // 如果icon_url为空，则不发送该字段，避免后端验证失败
      if (!finalFormData.icon_url || finalFormData.icon_url.trim() === '') {
        // 不包含icon_url字段
        const { icon_url, ...dataWithoutIconUrl } = submitData;
        onSave(dataWithoutIconUrl);
      } else {
        onSave(submitData);
      }
      
    } catch (error) {
      console.error('提交失败:', error);
      toast.error(error instanceof Error ? error.message : '提交失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => !saving && !uploading && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tool ? '编辑工具' : '添加工具'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>工具名称 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="输入工具名称"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>工具链接 *</Label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

            <div className="space-y-2">
              <Label>工具描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="简要描述这个工具的功能和特点（至少10个字符）"
                rows={3}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {formData.description.length < 10 && formData.description.length > 0 && (
                    <span className="text-destructive">至少需要10个字符</span>
                  )}
                  {formData.description.length >= 10 && (
                    <span className="text-green-600">描述长度合适</span>
                  )}
                </span>
                <span>{formData.description.length}/1000</span>
              </div>
            </div>

          {/* 图标上传 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>工具图标</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || saving}
                  className="flex items-center gap-2 !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-gray-800 dark:hover:!bg-gray-100 !border-black dark:!border-white"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? '上传中...' : '上传图标'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {/* 图标预览 */}
                {(previewUrl || formData.icon_url) && (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center p-2">
                      <img
                        src={previewUrl || formData.icon_url}
                        alt="图标预览"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Badge variant="secondary">
                      {previewUrl ? '本地文件' : '外链图标'}
                    </Badge>
                    {(previewUrl || formData.icon_url) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (previewUrl) {
                            URL.revokeObjectURL(previewUrl);
                            setPreviewUrl('');
                            setSelectedFile(null);
                          }
                          handleInputChange('icon_url', '');
                        }}
                        className="p-2 hover:bg-destructive hover:text-destructive-foreground min-h-[32px] min-w-[32px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <Input
                value={formData.icon_url}
                onChange={(e) => handleInputChange('icon_url', e.target.value)}
                placeholder="或直接输入图标URL"
              />
            </div>
            
            {/* 图标主题选择 */}
            <div className="space-y-2">
              <Label>图标主题适配</Label>
              <Select
                value={formData.icon_theme}
                onValueChange={(value) => handleInputChange('icon_theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">自动适配</SelectItem>
                  <SelectItem value="auto-light">自动适配（偏亮色）</SelectItem>
                  <SelectItem value="auto-dark">自动适配（偏暗色）</SelectItem>
                  <SelectItem value="light">浅色图标</SelectItem>
                  <SelectItem value="dark">深色图标</SelectItem>
                  <SelectItem value="none">保持原色</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                控制图标在不同主题下的显示效果。自动适配会根据当前主题自动调整图标颜色。
              </p>
            </div>
          </div>

          {/* 分类选择 */}
          <div className="space-y-2">
            <Label>工具分类 *</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  type="button"
                  variant={formData.categories.includes(category) ? "solidCancel" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "transition-colors",
                    formData.categories.includes(category) 
                      ? "!bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-gray-800 dark:hover:!bg-gray-100" 
                      : ""
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
            {formData.categories.length === 0 && (
              <p className="text-sm text-destructive">请至少选择一个分类</p>
            )}
          </div>

          {/* 标签管理 */}
          <div className="space-y-2">
            <Label>工具标签</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="添加标签"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline" className="!bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-gray-800 dark:hover:!bg-gray-100 !border-black dark:!border-white min-w-[80px] px-6">
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
            {recentlyDeletedTag && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>已删除标签: {recentlyDeletedTag}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => restoreTag(recentlyDeletedTag)}
                  className="text-xs h-auto p-1"
                >
                  撤销
                </Button>
              </div>
            )}
          </div>

          {/* 其他设置 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <Label className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                推荐工具
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                  <SelectItem value="maintenance">维护</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>排序权重</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="999"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving || uploading}>
              取消
            </Button>
            <Button 
              variant="ghost"
              type="submit" 
              disabled={saving || uploading || !formData.name || !formData.url || formData.categories.length === 0 || formData.description.length < 10}
              className="min-w-[100px] !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-gray-800 dark:hover:!bg-gray-100"
            >
              {(saving || uploading) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {saving ? '提交中...' : uploading ? '上传中...' : tool ? '保存修改' : '添加工具'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}