import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ExternalLink, Mail, User, Globe, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CopyButton } from '@/components/CopyButton';
import { settingsApi, type WebsiteInfo } from '@/services/settingsApi';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';
import { animateScroll as scroll } from 'react-scroll';

interface FormData {
  site_name: string;
  site_url: string;
  site_description: string;
  site_icon: string;
  admin_email: string;
  admin_qq: string;
}

interface FriendLinkApplicationFormProps {
  onSuccess?: () => void;
}

export function FriendLinkApplicationForm({ onSuccess }: FriendLinkApplicationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    site_name: '',
    site_url: '',
    site_description: '',
    site_icon: '',
    admin_email: '',
    admin_qq: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo | null>(null);
  const [loadingWebsiteInfo, setLoadingWebsiteInfo] = useState(true);

  // 获取网站信息
  useEffect(() => {
    const fetchWebsiteInfo = async () => {
      try {
        const info = await settingsApi.getWebsiteInfo();
        setWebsiteInfo(info);
      } catch (error) {
        console.error('获取网站信息失败:', error);
        // 设置默认值
        setWebsiteInfo({
          site_name: 'AiQiji工具箱',
          site_url: 'https://aiqiji.com',
          site_icon: '/favicon.ico',
          site_description: '专业的AI工具导航平台，发现最新最好用的AI工具',
          icp_number: '',
          show_icp: false
        });
      } finally {
        setLoadingWebsiteInfo(false);
      }
    };

    fetchWebsiteInfo();
  }, []);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.site_name.trim()) {
      newErrors.site_name = '请输入网站名称';
    }

    if (!formData.site_url.trim()) {
      newErrors.site_url = '请输入网站地址';
    } else {
      try {
        new URL(formData.site_url);
      } catch {
        newErrors.site_url = '请输入有效的网站地址';
      }
    }

    if (!formData.site_description.trim()) {
      newErrors.site_description = '请输入网站描述';
    } else if (formData.site_description.trim().length < 10) {
      newErrors.site_description = '网站描述至少需要10个字符';
    }

    if (formData.site_icon && formData.site_icon.trim()) {
      try {
        new URL(formData.site_icon);
      } catch {
        newErrors.site_icon = '请输入有效的图标地址';
      }
    }

    if (!formData.admin_email.trim()) {
      newErrors.admin_email = '请输入邮箱地址';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.admin_email)) {
        newErrors.admin_email = '请输入有效的邮箱地址';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('请检查表单填写是否正确');
      return;
    }

    setLoading(true);

    try {
      const result = await apiPost('/friend-links/apply', formData);

      if (result.success) {
        setSubmitted(true);
        try {
          // 使用 react-scroll 统一滚动到顶部
          scroll.scrollToTop({ duration: 0, smooth: false });
          scroll.scrollToTop({ containerId: 'app-main', duration: 0, smooth: false });
        } catch {}
        toast.success('友链申请提交成功！');
        onSuccess?.();
      } else {
        toast.error(result.message || '提交失败，请重试');
      }
    } catch (error) {
      console.error('提交友链申请失败:', error);
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 如果已提交成功，显示成功页面
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h3 className="text-2xl font-semibold mb-4">申请提交成功！</h3>
        <p className="text-muted-foreground mb-6">
          我们已收到您的友链申请，将在30天内进行审核。<br />
          审核结果会通过邮箱通知您，请保持邮箱畅通。
        </p>
        <Button
          onClick={() => setSubmitted(false)}
          variant="outline"
        >
          提交新申请
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* 网站信息 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">我们的网站信息</h3>
            <p className="text-sm text-muted-foreground">请将以下信息添加到您的友链页面：</p>
            {loadingWebsiteInfo ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">加载网站信息中...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">网站名称</Label>
                    <p className="text-sm mt-1 font-mono">{websiteInfo?.site_name || 'AiQiji工具箱'}</p>
                  </div>
                  <CopyButton text={websiteInfo?.site_name || 'AiQiji工具箱'} />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">网站地址</Label>
                    <p className="text-sm mt-1 font-mono">{websiteInfo?.site_url || 'https://aiqiji.com'}</p>
                  </div>
                  <CopyButton text={websiteInfo?.site_url || 'https://aiqiji.com'} />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">网站图标</Label>
                    <div className="mt-1">
                      <p className="text-sm font-mono">{websiteInfo?.site_icon || '/favicon.ico'}</p>
                    </div>
                  </div>
                  <CopyButton text={websiteInfo?.site_icon || '/favicon.ico'} />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">网站描述</Label>
                    <p className="text-sm mt-1 font-mono">{websiteInfo?.site_description || '专业的AI工具导航平台，发现最新最好用的AI工具'}</p>
                  </div>
                  <CopyButton text={websiteInfo?.site_description || '专业的AI工具导航平台，发现最新最好用的AI工具'} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 申请表单 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* 网站基本信息 */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">网站信息</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">
                  网站名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={(e) => handleInputChange('site_name', e.target.value)}
                  placeholder="请输入网站名称"
                  className={errors.site_name ? 'border-red-500' : ''}
                />
                {errors.site_name && (
                  <p className="text-sm text-red-500">{errors.site_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_url">
                  网站地址 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="site_url"
                  type="url"
                  value={formData.site_url}
                  onChange={(e) => handleInputChange('site_url', e.target.value)}
                  placeholder="https://example.com"
                  className={errors.site_url ? 'border-red-500' : ''}
                />
                {errors.site_url && (
                  <p className="text-sm text-red-500">{errors.site_url}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_description">
                网站描述 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="site_description"
                value={formData.site_description}
                onChange={(e) => handleInputChange('site_description', e.target.value)}
                placeholder="请简要介绍您的网站内容和特色"
                rows={3}
                className={errors.site_description ? 'border-red-500' : ''}
              />
              {errors.site_description && (
                <p className="text-sm text-red-500">{errors.site_description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_icon">网站图标</Label>
              <Input
                id="site_icon"
                type="url"
                value={formData.site_icon}
                onChange={(e) => handleInputChange('site_icon', e.target.value)}
                placeholder="https://example.com/favicon.ico"
                className={errors.site_icon ? 'border-red-500' : ''}
              />
              {errors.site_icon && (
                <p className="text-sm text-red-500">{errors.site_icon}</p>
              )}
              <p className="text-xs text-muted-foreground">
                建议提供网站图标链接，有助于提升友链展示效果
              </p>
            </div>
          </div>

          {/* 联系人信息 */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">联系人信息</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin_email">
                  邮箱地址 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => handleInputChange('admin_email', e.target.value)}
                  placeholder="your@email.com"
                  className={errors.admin_email ? 'border-red-500' : ''}
                />
                {errors.admin_email && (
                  <p className="text-sm text-red-500">{errors.admin_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_qq">QQ号码（可选）</Label>
                <Input
                  id="admin_qq"
                  value={formData.admin_qq}
                  onChange={(e) => handleInputChange('admin_qq', e.target.value)}
                  placeholder="请输入QQ号码"
                />
              </div>
            </div>

          </div>



          {/* 提交按钮 */}
          <Button
            type="submit"
            variant="blackWhite"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                提交申请
              </>
            )}
          </Button>
          </form>
        </CardContent>
      </Card>

      {/* 申请须知 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>申请须知：</strong>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>网站内容需健康正面，符合相关法律法规</li>
            <li>网站访问速度良好，用户体验佳</li>
            <li>申请有效期为30天，过期将自动失效</li>
            <li>我们会通过邮箱通知审核结果</li>
            <li>遵循互惠互利原则，建议先添加我们的友链</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default FriendLinkApplicationForm;
