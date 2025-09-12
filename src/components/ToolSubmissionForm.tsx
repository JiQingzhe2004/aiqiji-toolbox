import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Plus, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react';
import { toolSubmissionApi } from '@/services/toolSubmissionApi';
import toast from 'react-hot-toast';

interface ToolSubmissionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = ['AI', '效率', '设计', '开发', '其他'];

export function ToolSubmissionForm({ onSuccess, onCancel }: ToolSubmissionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    category: [] as string[],
    tags: [] as string[],
    icon_url: '',
    submitter_name: '',
    submitter_email: '',
    submitter_contact: ''
  });

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 处理表单字段变化
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 处理分类选择
  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 处理图标文件上传
  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }

      // 检查文件大小 (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('图片文件不能超过2MB');
        return;
      }

      setIconFile(file);
      
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 移除图标文件
  const handleRemoveIconFile = () => {
    setIconFile(null);
    setIconPreview(null);
  };

  // 表单验证
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('工具名称不能为空');
    if (!formData.description.trim() || formData.description.length < 10) {
      errors.push('工具描述不能为空且至少10个字符');
    }
    if (!formData.url.trim()) errors.push('工具链接不能为空');
    if (formData.category.length === 0) errors.push('请至少选择一个分类');

    // 验证URL格式
    try {
      const url = formData.url.includes('://') ? formData.url : `https://${formData.url}`;
      new URL(url);
    } catch {
      errors.push('请输入有效的URL');
    }

    // 验证邮箱格式（如果填写了）
    if (formData.submitter_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.submitter_email)) {
      errors.push('请输入有效的邮箱地址');
    }

    return errors;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);

    try {
      await toolSubmissionApi.submitTool(formData, iconFile || undefined);
      setSubmitSuccess(true);
      toast.success('工具提交成功！我们会尽快审核');
      
      // 延迟执行成功回调
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || '提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 如果提交成功，显示成功页面
  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">提交成功！</h2>
        <p className="text-muted-foreground mb-6">
          感谢您的工具推荐！我们会尽快审核并添加到工具库中。
        </p>
        <Button onClick={onSuccess}>
          继续浏览
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            推荐工具
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            发现了好用的工具？推荐给更多人使用！我们会仔细审核每个提交。
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">工具名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="例如：ChatGPT"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">工具描述 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="详细描述这个工具的功能和特点（至少10个字符）"
                  rows={4}
                  minLength={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">工具链接 *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>

            {/* 分类和标签 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">分类和标签</h3>
              
              <div className="space-y-2">
                <Label>分类 * (至少选择一个)</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(category => (
                    <Badge
                      key={category}
                      variant={formData.category.includes(category) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>标签 (可选)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="添加标签"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 图标设置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">图标设置</h3>
              <p className="text-sm text-muted-foreground">
                提供工具图标链接或上传图标文件，管理员会根据需要调整图标样式。
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="icon_url">自定义图标链接</Label>
                <Input
                  id="icon_url"
                  type="url"
                  value={formData.icon_url}
                  onChange={(e) => handleChange('icon_url', e.target.value)}
                  placeholder="https://example.com/icon.png"
                />
                <p className="text-xs text-muted-foreground">
                  请提供高质量的图标链接，支持 PNG、JPG、SVG 格式
                </p>
              </div>

              <div className="space-y-2">
                <Label>上传图标文件</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconFileChange}
                    className="hidden"
                    id="icon-upload"
                  />
                  <label
                    htmlFor="icon-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-input rounded-md cursor-pointer hover:bg-muted/50"
                  >
                    <Upload className="w-4 h-4" />
                    选择文件
                  </label>
                  {iconPreview && (
                    <div className="flex items-center gap-2">
                      <img src={iconPreview} alt="图标预览" className="w-8 h-8 object-cover rounded" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveIconFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  支持 PNG、JPG、SVG 格式，文件大小不超过 2MB
                </p>
              </div>
            </div>

            {/* 联系信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">联系信息 (可选)</h3>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    提供联系信息有助于我们在审核过程中与您沟通，所有信息都会保密处理。
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="submitter_name">姓名</Label>
                    <Input
                      id="submitter_name"
                      value={formData.submitter_name}
                      onChange={(e) => handleChange('submitter_name', e.target.value)}
                      placeholder="您的姓名"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="submitter_email">邮箱</Label>
                    <Input
                      id="submitter_email"
                      type="email"
                      value={formData.submitter_email}
                      onChange={(e) => handleChange('submitter_email', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="submitter_contact">其他联系方式</Label>
                    <Input
                      id="submitter_contact"
                      value={formData.submitter_contact}
                      onChange={(e) => handleChange('submitter_contact', e.target.value)}
                      placeholder="QQ、微信等"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-4 pt-6">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  取消
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    提交工具
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
