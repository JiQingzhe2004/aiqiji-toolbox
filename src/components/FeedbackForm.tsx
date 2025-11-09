import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle, AlertCircle, MessageSquare, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { feedbackApi } from '@/services/feedbackApi';
import { EmailVerificationInput } from '@/components/EmailVerificationInput';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface FormData {
  name: string;
  email: string;
  subject: string;
  content: string;
  verification_code: string;
}

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: user?.display_name || user?.username || '',
    email: user?.email || '',
    subject: '',
    content: '',
    verification_code: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [verificationCodeVerified, setVerificationCodeVerified] = useState(false);

  // 验证验证码
  const verifyCode = async (code: string, email: string) => {
    if (code.length !== 6) {
      return false;
    }

    try {
      const { emailApi } = await import('@/services/emailApi');
      // 确保验证码是大写的
      const upperCode = code.toUpperCase();
      const verifyResult = await emailApi.verifyCode({
        email: email,
        code: upperCode,
        type: 'feedback'
      });

      if (verifyResult.success) {
        setVerificationCodeVerified(true);
        setErrors(prev => ({ ...prev, verification_code: undefined }));
        return true;
      } else {
        setVerificationCodeVerified(false);
        setErrors(prev => ({ ...prev, verification_code: verifyResult.error || '验证码无效或已过期' }));
        return false;
      }
    } catch (error: any) {
      console.error('验证码验证失败:', error);
      setVerificationCodeVerified(false);
      setErrors(prev => ({ ...prev, verification_code: error.message || '验证码验证失败' }));
      return false;
    }
  };

  // 当验证码输入完整时，自动验证
  useEffect(() => {
    // 只有在验证码长度为6且邮箱存在且未验证时才验证
    if (formData.verification_code.length === 6 && formData.email && !verificationCodeVerified) {
      const timer = setTimeout(async () => {
        // 检查验证码是否仍然有效（用户可能已经修改了）
        const currentCode = formData.verification_code;
        if (currentCode.length === 6 && formData.email) {
          try {
            await verifyCode(currentCode, formData.email);
          } catch (error) {
            // 静默处理错误，避免在用户还在输入时显示错误
            console.error('自动验证失败:', error);
          }
        }
      }, 1000); // 延迟1秒，避免用户还在输入
      
      return () => clearTimeout(timer);
    } else if (formData.verification_code.length < 6) {
      // 如果验证码长度不足，重置验证状态
      setVerificationCodeVerified(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.verification_code, formData.email]);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入您的姓名';
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '请输入有效的邮箱地址';
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = '请输入反馈主题';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = '主题至少需要3个字符';
    }

    if (!formData.content.trim()) {
      newErrors.content = '请输入反馈内容';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = '反馈内容至少需要10个字符';
    }

    if (!formData.verification_code.trim()) {
      newErrors.verification_code = '请输入验证码';
    } else if (formData.verification_code.trim().length !== 6) {
      newErrors.verification_code = '验证码必须是6位';
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

    // 验证验证码
    if (!verificationCodeVerified) {
      const isValid = await verifyCode(formData.verification_code, formData.email);
      if (!isValid) {
        toast.error('请先验证邮箱验证码');
        return;
      }
    }

    setLoading(true);

    try {
      // 确保验证码是大写的
      const submitData = {
        ...formData,
        verification_code: formData.verification_code.toUpperCase()
      };
      const result = await feedbackApi.submitFeedback(submitData);

      if (result.success) {
        setSubmitted(true);
        toast.success('意见反馈提交成功！');
        onSuccess?.();
      } else {
        toast.error(result.message || '提交失败，请重试');
      }
    } catch (error: any) {
      console.error('提交意见反馈失败:', error);
      toast.error(error.message || '网络错误，请稍后重试');
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
    // 如果邮箱变化，重置验证码验证状态
    if (field === 'email') {
      setVerificationCodeVerified(false);
      setFormData(prev => ({ ...prev, verification_code: '' }));
    }
    // 如果验证码变化，重置验证状态
    if (field === 'verification_code') {
      setVerificationCodeVerified(false);
    }
  };

  // 处理验证码变化
  const handleVerificationCodeChange = (code: string) => {
    handleInputChange('verification_code', code);
    // 如果验证码长度不足6位，重置验证状态
    if (code.length !== 6) {
      setVerificationCodeVerified(false);
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
        <h3 className="text-2xl font-semibold mb-4">反馈提交成功！</h3>
        <p className="text-muted-foreground mb-6">
          感谢您的反馈！我们已经收到您的意见，并会认真对待每一条反馈。<br />
          提交成功的确认邮件已发送到您的邮箱，请查收。
        </p>
        <Button
          onClick={() => {
            setSubmitted(false);
            setVerificationCodeVerified(false);
            setFormData({
              name: user?.display_name || user?.username || '',
              email: user?.email || '',
              subject: '',
              content: '',
              verification_code: ''
            });
          }}
          variant="outline"
        >
          提交新反馈
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* 反馈表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            意见反馈
          </CardTitle>
          <CardDescription>
            您的意见对我们非常重要，我们会认真对待每一条反馈
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    姓名 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="请输入您的姓名"
                      className={`pl-9 ${errors.name ? 'border-red-500' : ''}`}
                      disabled={isAuthenticated && !!user?.display_name}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    邮箱地址 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      className={`pl-9 ${errors.email ? 'border-red-500' : ''}`}
                      disabled={isAuthenticated && !!user?.email}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                  {isAuthenticated && user?.email && (
                    <p className="text-xs text-muted-foreground">
                      已自动使用您的登录邮箱
                    </p>
                  )}
                </div>
              </div>

              {/* 邮箱验证码 */}
              {formData.email && (
                <div className="space-y-2">
                  <EmailVerificationInput
                    email={formData.email}
                    type="feedback"
                    value={formData.verification_code}
                    onChange={handleVerificationCodeChange}
                    onVerified={(verified) => {
                      setVerificationCodeVerified(verified);
                    }}
                    disabled={loading}
                    label="邮箱验证码"
                    placeholder="请输入6位验证码"
                  />
                  {errors.verification_code && (
                    <p className="text-sm text-red-500">{errors.verification_code}</p>
                  )}
                  {verificationCodeVerified && formData.verification_code.length === 6 && (
                    <p className="text-sm text-green-600">✓ 验证码验证成功</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject">
                  反馈主题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="请简要描述您的反馈主题"
                  className={errors.subject ? 'border-red-500' : ''}
                />
                {errors.subject && (
                  <p className="text-sm text-red-500">{errors.subject}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  反馈内容 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="请详细描述您的意见或建议..."
                  rows={8}
                  className={errors.content ? 'border-red-500' : ''}
                />
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  请尽可能详细地描述您的问题或建议，这将帮助我们更好地改进
                </p>
              </div>
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              variant="default"
              className="w-full"
              disabled={loading || !verificationCodeVerified}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  提交反馈
                </>
              )}
            </Button>
            {!verificationCodeVerified && formData.verification_code.length === 6 && (
              <p className="text-sm text-yellow-600 text-center">
                请先验证邮箱验证码
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 反馈须知 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>反馈须知：</strong>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>提交反馈前需要通过邮箱验证码验证</li>
            <li>我们会认真对待每一条反馈，并尽快处理</li>
            <li>请提供真实有效的联系方式，以便我们与您沟通</li>
            <li>反馈内容请保持文明礼貌，禁止发布违法违规信息</li>
            <li>提交成功后，我们会发送确认邮件到您的邮箱</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default FeedbackForm;
