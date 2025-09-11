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
    tags: tool?.tags || [] as string[],
  });

  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['AI', '效率', '设计', '开发', '其他'];

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 锁定背景滚动
  useEffect(() => {
    // 锁定body滚动
    document.body.style.overflow = 'hidden';
    
    return () => {
      // 恢复body滚动
      document.body.style.overflow = 'unset';
    };
  }, []);

  // 处理表单字段变化
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 切换分类选择
  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // 添加标签
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (formData.tags.includes(newTag.trim())) {
      toast.error('标签已存在');
      return;
    }
      setFormData(prev => ({
        ...prev,
      tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
  };

  // 移除标签
  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片文件不能超过2MB');
      return;
    }

    setSelectedFile(file);
    
    // 创建预览URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      setUploading(true);
      
      const response = await toolsApi.uploadIcon(file);
      
      if (response.success && response.data?.url) {
        handleInputChange('icon_url', response.data.url);
        toast.success('图标上传成功');
    } else {
        toast.error('图标上传失败');
      }
    } catch (error) {
      console.error('图标上传失败:', error);
      toast.error('图标上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      // 验证必填字段
      if (!formData.name || !formData.url || formData.categories.length === 0) {
        toast.error('请填写所有必填字段');
        return;
      }

      // 验证描述长度
      if (formData.description.length < 10) {
        toast.error('工具描述至少需要10个字符');
        return;
      }

      if (formData.description.length > 1000) {
        toast.error('工具描述不能超过1000个字符');
        return;
      }

      // 准备提交数据
      const finalFormData = {
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
      };

      // 数据预处理和验证
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

  // 手机端渲染
  const renderMobileForm = () => (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
      <div className="sticky top-0 bg-background z-10 p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={saving || uploading}
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {tool ? '编辑工具' : '添加工具'}
          </h2>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 pb-24 space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
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
          {formData.id && (
            <div className="space-y-2">
              <Label>工具ID</Label>
              <Input
                value={formData.id}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                系统自动生成的唯一标识符，不可编辑
              </p>
            </div>
          )}
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <Label>工具描述 *</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="简要描述这个工具的功能和特点（至少10个字符）"
            className="min-h-[100px] resize-none"
            required
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formData.description.length}/1000 字符</span>
            {formData.description.length < 10 && (
              <span className="text-destructive">至少需要10个字符</span>
            )}
            {formData.description.length > 1000 && (
              <span className="text-destructive">超出最大长度限制</span>
            )}
          </div>
        </div>

        {/* 图标上传 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>工具图标</Label>
            <div className="space-y-3">
              {/* 图标预览 */}
              {(previewUrl || formData.icon_url) && (
                <div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-lg">
                  <div className="w-16 h-16 bg-blue-200 rounded-lg flex items-center justify-center p-2">
                    <img
                      src={previewUrl || formData.icon_url}
                      alt="图标预览"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary">
                      {previewUrl ? '本地文件' : '外链图标'}
                    </Badge>
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
                      className="p-1 h-auto hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="ml-1 text-xs">删除</span>
                    </Button>
                  </div>
                </div>
              )}
              
              {/* 上传按钮和外链输入框 */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || saving}
                  className="flex items-center gap-2 !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-gray-800 dark:hover:!bg-gray-100 !border-black dark:!border-white flex-shrink-0"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? '上传中' : '上传'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Input
                  type="url"
                  value={formData.icon_url}
                  onChange={(e) => {
                    handleInputChange('icon_url', e.target.value);
                    // 清除本地文件预览
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl('');
                      setSelectedFile(null);
                    }
                  }}
                  placeholder="或输入图标外链地址"
                  disabled={uploading || saving}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>图标主题</Label>
            <Select
              value={formData.icon_theme}
              onValueChange={(value) => handleInputChange('icon_theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
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
                variant={formData.categories.includes(category) ? "default" : "outline"}
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
              placeholder="输入标签名称"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={handleAddTag} 
              variant="outline"
              className="flex-shrink-0 px-4"
            >
              添加
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 其他设置 */}
        <div className="grid grid-cols-3 gap-3">
          {/* 状态 */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium flex-shrink-0">状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger className="h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
                <SelectItem value="maintenance">维护</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 权重 */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium flex-shrink-0">权重</Label>
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              max="999"
              className="h-8 flex-1"
            />
          </div>

          {/* 推荐 */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium flex-shrink-0">推荐</Label>
            <Switch
              id="featured-mobile"
              checked={formData.featured}
              onCheckedChange={(checked) => handleInputChange('featured', checked)}
            />
          </div>
        </div>
      </form>

      {/* 固定底部按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <Button 
          variant="ghost"
          type="submit" 
          onClick={handleSubmit}
          disabled={saving || uploading || !formData.name || !formData.url || formData.categories.length === 0 || formData.description.length < 10}
          className="w-full !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-gray-800 dark:hover:!bg-gray-100"
        >
          {(saving || uploading) && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {saving ? '提交中...' : uploading ? '上传中...' : tool ? '保存修改' : '添加工具'}
        </Button>
      </div>
    </div>
  );

  // 桌面端渲染  
  const renderDesktopForm = () => (
    <Dialog open={true} onOpenChange={() => !saving && !uploading && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {tool ? '编辑工具' : '添加工具'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            {formData.id && (
              <div className="space-y-2 lg:col-span-2">
                <Label>工具ID</Label>
                <Input
                  value={formData.id}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  系统自动生成的唯一标识符，不可编辑
                </p>
              </div>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label>工具描述 *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="简要描述这个工具的功能和特点（至少10个字符）"
              className="min-h-[100px] resize-none"
              required
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formData.description.length}/1000 字符</span>
              {formData.description.length < 10 && (
                <span className="text-destructive">至少需要10个字符</span>
              )}
              {formData.description.length > 1000 && (
                <span className="text-destructive">超出最大长度限制</span>
              )}
            </div>
          </div>

          {/* 图标上传 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>工具图标</Label>
              <div className="space-y-3">
                {/* 图标预览 */}
                {(previewUrl || formData.icon_url) && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-16 h-16 bg-blue-200 rounded-lg flex items-center justify-center p-2">
                      <img
                        src={previewUrl || formData.icon_url}
                        alt="图标预览"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary">
                        {previewUrl ? '本地文件' : '外链图标'}
                      </Badge>
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
                        className="p-1 h-auto hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="ml-1 text-xs">删除</span>
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* 上传按钮和外链输入框 */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || saving}
                    className="flex items-center gap-2 !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-gray-800 dark:hover:!bg-gray-100 !border-black dark:!border-white flex-shrink-0"
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
                  <Input
                    type="url"
                    value={formData.icon_url}
                    onChange={(e) => {
                      handleInputChange('icon_url', e.target.value);
                      // 清除本地文件预览
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl('');
                        setSelectedFile(null);
                      }
                    }}
                    placeholder="或输入图标外链地址"
                    disabled={uploading || saving}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>图标主题</Label>
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
                  variant={formData.categories.includes(category) ? "default" : "outline"}
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
                placeholder="输入标签名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleAddTag} 
                variant="outline"
                className="flex-shrink-0 px-4"
              >
                添加
              </Button>
            </div>
            {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="ml-1 hover:text-destructive"
                    >
                  <X className="w-3 h-3" />
                    </button>
                </Badge>
              ))}
              </div>
            )}
          </div>

          {/* 其他设置 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200]">
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

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <Label htmlFor="featured" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                推荐工具
              </Label>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={saving || uploading}
            >
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

  return isMobile ? renderMobileForm() : renderDesktopForm();
}