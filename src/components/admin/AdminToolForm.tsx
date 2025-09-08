/**
 * 管理页面工具表单组件
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Star, Palette, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { LucideIconPicker } from './LucideIconPicker';
import { toolsApi } from '@/services/toolsApi';
import type { Tool } from '@/types';
import { cn, generateToolId } from '@/lib/utils';

interface AdminToolFormProps {
  tool: Tool | null;
  onSave: (tool: Partial<Tool>) => void;
  onClose: () => void;
}

export function AdminToolForm({ tool, onSave, onClose }: AdminToolFormProps) {
  const [formData, setFormData] = useState({
    id: tool?.id || '',
    name: tool?.name || '',
    description: tool?.description || '',
    icon: tool?.icon || '',
    icon_url: tool?.icon_url || '',
    icon_theme: tool?.icon_theme || 'auto',
    categories: tool?.category ? [tool.category] : [] as string[], // 支持多分类
    url: tool?.url || '',
    featured: tool?.featured || false,
    status: tool?.status || 'active',
    sort_order: tool?.sort_order || 0,
    tags: tool?.tags || [],
  });

  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['AI', '效率', '设计', '开发', '其他'];
  const iconThemes = [
    { value: 'auto', label: '纯色' },
    { value: 'light', label: '彩色' },
    { value: 'dark', label: '其他' },
  ];

  // 自动生成ID当名称改变时
  useEffect(() => {
    if (!tool && formData.name && !formData.id) {
      const generatedId = generateToolId(formData.name);
      setFormData(prev => ({ ...prev, id: generatedId }));
    }
  }, [formData.name, tool]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 处理分类多选
  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category)
    }));
  };

  // 获取选中的图标组件
  const SelectedIconComponent = formData.icon && typeof (LucideIcons as any)[formData.icon] === 'function'
    ? (LucideIcons as any)[formData.icon] 
    : null;

  // 调试日志
  React.useEffect(() => {
    if (formData.icon) {
      console.log('选中的图标:', formData.icon);
      console.log('图标组件存在:', !!SelectedIconComponent);
      console.log('LucideIcons中的图标:', formData.icon in LucideIcons);
    }
  }, [formData.icon, SelectedIconComponent]);

  // 清理blob URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型和大小
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB限制
      alert('图片文件大小不能超过5MB');
      return;
    }

    // 创建blob URL用于预览，但不设置到icon_url字段（该字段用于外链）
    const blobUrl = URL.createObjectURL(file);
    
    // 保存文件引用和预览URL，用于后续上传
    setSelectedFile(file);
    setPreviewUrl(blobUrl);
    
    // 清空icon_url字段，因为现在使用的是本地文件
    handleInputChange('icon_url', '');
    
    console.log('文件已选择，创建预览URL:', blobUrl);
  };

  // 实际上传文件的函数
  const uploadSelectedFile = async (file: File): Promise<string> => {
    const uploadResult = await toolsApi.uploadIcon(file);
    
    if (uploadResult.success && uploadResult.data?.url) {
      // 将相对路径转换为完整URL以通过后端验证
      const relativeUrl = uploadResult.data.url;
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3001';
      const fullUrl = `${baseUrl}${relativeUrl}`;
      return fullUrl;
    } else {
      throw new Error(uploadResult.message || '上传失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 前端验证
    if (formData.description.length < 10) {
      alert('描述至少需要10个字符');
      return;
    }
    
    if (formData.description.length > 1000) {
      alert('描述不能超过1000个字符');
      return;
    }
    
    if (!formData.url) {
      alert('请填写工具链接');
      return;
    }
    
    if (formData.categories.length === 0) {
      alert('请至少选择一个分类');
      return;
    }
    
    setUploading(true);
    
    try {
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
      
      // 转换多分类为单分类（取第一个，兼容后端）
      const submitData: any = {
        ...finalFormData,
        category: finalFormData.categories[0] || '其他', // 后端期望单个分类
        // 保留原始多分类信息在tags中
        tags: [...finalFormData.tags, ...finalFormData.categories.slice(1)] // 额外分类作为标签
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
      
      let errorMessage = '提交失败，请重试';
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = '请先登录后再提交';
        } else if (error.message.includes('Validation')) {
          errorMessage = '数据验证失败，请检查输入内容';
        } else {
          errorMessage = `提交失败: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tool ? '编辑工具' : '添加工具'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">工具名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="工具名称"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id">工具ID *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                placeholder="将根据工具名称自动生成"
                disabled={!!tool}
                required
              />
              {!tool && (
                <p className="text-xs text-muted-foreground">
                  ID将根据工具名称自动生成，您也可以手动修改
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">工具描述 *</Label>
              <div className="space-y-2">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="详细描述工具的功能和特点（至少10个字符）..."
                  rows={3}
                  required
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={formData.description.length < 10 ? 'text-destructive' : ''}>
                    {formData.description.length < 10 ? `还需 ${10 - formData.description.length} 个字符` : '长度符合要求'}
                  </span>
                  <span className={formData.description.length > 1000 ? 'text-destructive' : ''}>
                    {formData.description.length}/1000
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">工具链接 *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

          {/* 图标设置 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lucide图标</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIconPicker(true)}
                  className="flex items-center gap-2 border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  <Search className="w-4 h-4" />
                  选择图标
                </Button>
                
                {/* 图标预览 */}
                {formData.icon && (
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/50">
                    {SelectedIconComponent ? (
                      <SelectedIconComponent className="w-5 h-5 text-primary" />
                    ) : (
                      <div className="w-5 h-5 bg-muted rounded flex items-center justify-center text-xs">?</div>
                    )}
                    <span className="text-sm font-medium">{formData.icon}</span>
                    <Badge variant="secondary" className="text-xs">
                      {SelectedIconComponent ? '已加载' : '未找到'}
                    </Badge>
                  </div>
                )}
              </div>
              <Input
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                placeholder="或直接输入图标名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_theme">图标为</Label>
              <div className="flex gap-4">
                {iconThemes.map((theme) => (
                  <label key={theme.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="icon_theme"
                      value={theme.value}
                      checked={formData.icon_theme === theme.value}
                      onChange={(e) => handleInputChange('icon_theme', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{theme.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>自定义图标</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? '上传中...' : '上传图标'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {/* 图标预览 - 优先显示本地文件预览，其次显示外链图标 */}
                {(previewUrl || formData.icon_url) && (
                  <div className="flex items-center gap-2">
                    <img
                      src={previewUrl || formData.icon_url}
                      alt="图标预览"
                      className={cn(
                        "w-8 h-8 object-contain rounded border",
                        // 主题适配逻辑 - 与主页保持一致
                        (formData.icon_theme === 'auto') && "dark:invert",
                        (!formData.icon_theme || formData.icon_theme === 'auto') && "dark:invert"
                      )}
                    />
                    {previewUrl && (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          本地文件
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl);
                              setPreviewUrl('');
                            }
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          ✕
                        </Button>
                      </>
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
          </div>

          {/* 分类选择（支持多选） */}
          <div className="space-y-2">
            <Label>工具分类 *</Label>
            <div className="grid grid-cols-3 gap-4">
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.categories.includes(category)}
                    onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
            {formData.categories.length === 0 && (
              <p className="text-xs text-red-500">请至少选择一个分类</p>
            )}
          </div>

          {/* 状态和排序 */}
          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                  <SelectItem value="maintenance">维护中</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">排序权重</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          {/* 精选开关 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => handleInputChange('featured', checked)}
            />
            <Label htmlFor="featured" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              精选工具
            </Label>
          </div>

          {/* 标签管理 */}
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex items-center gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="输入标签"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleAddTag} 
                size="sm"
                className="shrink-0 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                添加
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
            >
              取消
            </Button>
            <Button 
              type="submit"
              disabled={formData.categories.length === 0 || uploading}
              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {selectedFile ? '上传中...' : '提交中...'}
                </>
              ) : (
                tool ? '更新' : '创建'
              )}
            </Button>
          </div>
        </form>

        {/* Lucide图标选择器 */}
        <LucideIconPicker
          selectedIcon={formData.icon}
          onSelect={(iconName) => handleInputChange('icon', iconName)}
          open={showIconPicker}
          onOpenChange={setShowIconPicker}
        />
      </DialogContent>
    </Dialog>
  );
}
