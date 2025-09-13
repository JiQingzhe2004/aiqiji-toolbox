/**
 * 用户注册对话框组件
 * 使用邮件验证码进行用户注册
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { EmailVerificationInput } from './EmailVerificationInput';
import { emailApi } from '@/services/emailApi';
import toast from 'react-hot-toast';

interface UserRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (user: any) => void;
  onSwitchToLogin?: () => void;
}

interface RegisterForm {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

export function UserRegisterDialog({
  open,
  onOpenChange,
  onSuccess,
  onSwitchToLogin
}: UserRegisterDialogProps) {
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  
  // 邮箱和用户名检查状态
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'exists' | 'invalid'>('idle');
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<'idle' | 'checking' | 'available' | 'exists' | 'invalid'>('idle');
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 检查邮箱是否已存在
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailCheckStatus('invalid');
      return;
    }

    setEmailCheckStatus('checking');
    
    try {
      const result = await emailApi.checkEmailExists({ email });
      if (result.success && result.data) {
        setEmailCheckStatus(result.data.exists ? 'exists' : 'available');
      } else {
        setEmailCheckStatus('invalid');
      }
    } catch (error) {
      console.error('检查邮箱失败:', error);
      setEmailCheckStatus('invalid');
    }
  }, []);

  // 检查用户名是否已存在
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameCheckStatus('invalid');
      return;
    }

    setUsernameCheckStatus('checking');
    
    try {
      const result = await emailApi.checkUsernameExists({ username });
      if (result.success && result.data) {
        setUsernameCheckStatus(result.data.exists ? 'exists' : 'available');
      } else {
        setUsernameCheckStatus('invalid');
      }
    } catch (error) {
      console.error('检查用户名失败:', error);
      setUsernameCheckStatus('invalid');
    }
  }, []);

  // 更新表单字段
  const updateField = useCallback((field: keyof RegisterForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // 实时检查邮箱和用户名
    if (field === 'email') {
      setEmailCheckStatus('idle');
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      emailCheckTimeoutRef.current = setTimeout(() => {
        if (value.trim()) {
          checkEmailAvailability(value.trim());
        }
      }, 500); // 500ms 防抖
    }

    if (field === 'username') {
      setUsernameCheckStatus('idle');
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
      usernameCheckTimeoutRef.current = setTimeout(() => {
        if (value.trim()) {
          checkUsernameAvailability(value.trim());
        }
      }, 500); // 500ms 防抖
    }
  }, [errors, checkEmailAvailability, checkUsernameAvailability]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterForm> = {};

    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    } else if (emailCheckStatus === 'exists') {
      newErrors.email = '该邮箱已被注册';
    } else if (emailCheckStatus === 'checking') {
      toast.error('正在检查邮箱，请稍候');
      return false;
    } else if (emailCheckStatus !== 'available') {
      newErrors.email = '请输入有效且未被注册的邮箱';
    }

    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    } else if (formData.username.length > 20) {
      newErrors.username = '用户名不能超过20个字符';
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和中文';
    } else if (usernameCheckStatus === 'exists') {
      newErrors.username = '该用户名已被占用';
    } else if (usernameCheckStatus === 'checking') {
      toast.error('正在检查用户名，请稍候');
      return false;
    } else if (usernameCheckStatus !== 'available') {
      newErrors.username = '请输入有效且未被占用的用户名';
    }

    if (!formData.displayName) {
      newErrors.displayName = '请输入昵称';
    } else if (formData.displayName.length < 1) {
      newErrors.displayName = '昵称不能为空';
    } else if (formData.displayName.length > 50) {
      newErrors.displayName = '昵称不能超过50个字符';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少8个字符';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码必须包含大小写字母和数字';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致';
    }

    if (!formData.verificationCode) {
      newErrors.verificationCode = '请输入验证码';
    } else if (formData.verificationCode.length !== 6) {
      newErrors.verificationCode = '验证码必须是6位数字或大写字母';
    }

    if (!emailVerified) {
      toast.error('请先验证邮箱');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理注册
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);
    
    try {
      // 调用注册API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          displayName: formData.displayName,
          password: formData.password,
          verificationCode: formData.verificationCode
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('注册成功！');
        onSuccess?.(result.data?.user);
        onOpenChange(false);
        // 重置表单
        setFormData({
          email: '',
          username: '',
          displayName: '',
          password: '',
          confirmPassword: '',
          verificationCode: ''
        });
        setEmailVerified(false);
        setErrors({});
        setEmailCheckStatus('idle');
        setUsernameCheckStatus('idle');
      } else {
        toast.error(result.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      toast.error('注册失败，请稍后重试');
    } finally {
      setIsRegistering(false);
    }
  }, [formData, emailVerified, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            用户注册
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleRegister} className="space-y-6 py-4">
          {/* 邮箱输入 */}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址 *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="请输入邮箱地址"
                className={cn(
                  'pl-10 pr-10',
                  errors.email && 'border-red-500',
                  emailCheckStatus === 'available' && 'border-green-500',
                  emailCheckStatus === 'exists' && 'border-red-500'
                )}
                required
              />
              {/* 邮箱检查状态图标 */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailCheckStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
                {emailCheckStatus === 'available' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {emailCheckStatus === 'exists' && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {errors.email && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
            {!errors.email && emailCheckStatus === 'available' && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                该邮箱可以使用
              </p>
            )}
            {!errors.email && emailCheckStatus === 'exists' && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                该邮箱已被注册
              </p>
            )}
          </div>

          {/* 邮箱验证码 - 只有邮箱可用时才允许发送 */}
          <EmailVerificationInput
            email={formData.email}
            type="register"
            value={formData.verificationCode}
            onChange={(code) => updateField('verificationCode', code)}
            onVerified={setEmailVerified}
            label="邮箱验证码 *"
            disabled={emailCheckStatus !== 'available'}
          />

          {/* 用户名输入 */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名 *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="请输入用户名"
                className={cn(
                  'pl-10 pr-10',
                  errors.username && 'border-red-500',
                  usernameCheckStatus === 'available' && 'border-green-500',
                  usernameCheckStatus === 'exists' && 'border-red-500'
                )}
                required
              />
              {/* 用户名检查状态图标 */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameCheckStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
                {usernameCheckStatus === 'available' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {usernameCheckStatus === 'exists' && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {errors.username && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.username}
              </p>
            )}
            {!errors.username && usernameCheckStatus === 'available' && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                该用户名可以使用
              </p>
            )}
            {!errors.username && usernameCheckStatus === 'exists' && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                该用户名已被占用
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20个字符，支持字母、数字、下划线和中文
            </p>
          </div>

          {/* 昵称输入 */}
          <div className="space-y-2">
            <Label htmlFor="displayName">昵称 *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                placeholder="请输入昵称"
                className={cn(
                  'pl-10',
                  errors.displayName && 'border-red-500'
                )}
                required
              />
            </div>
            {errors.displayName && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.displayName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              1-50个字符，将作为你的显示名称
            </p>
          </div>

          {/* 密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="password">密码 *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="请输入密码"
                className={cn(
                  'pl-10 pr-10',
                  errors.password && 'border-red-500'
                )}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              至少8个字符，包含大小写字母和数字
            </p>
          </div>

          {/* 确认密码 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码 *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="请再次输入密码"
                className={cn(
                  'pl-10 pr-10',
                  errors.confirmPassword && 'border-red-500'
                )}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
              disabled={isRegistering || !emailVerified || emailCheckStatus !== 'available' || usernameCheckStatus !== 'available'}
              className="w-full"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  注册中...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  立即注册
                </>
              )}
            </Button>
            
            {onSwitchToLogin && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSwitchToLogin}
                className="w-full"
              >
                已有账号？立即登录
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
