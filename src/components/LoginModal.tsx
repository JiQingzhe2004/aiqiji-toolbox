/**
 * 登录弹窗组件
 * 替代独立的登录页面，提供更好的用户体验
 */

import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [formData, setFormData] = useState({
    username: '', // 支持用户名或邮箱
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('请填写完整的登录信息');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(formData.username, formData.password);
      
      if (success) {
        toast.success('登录成功！正在跳转到管理界面...');
        onOpenChange(false);
        // 重置表单
        setFormData({ username: '', password: '' });
        setShowPassword(false);
        // 自动跳转到管理员界面
        setTimeout(() => {
          window.location.href = '/admin';
        }, 500); // 延迟500ms让用户看到成功提示
      } else {
        toast.error('用户名或密码错误');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // 重置表单状态
    setFormData({ username: '', password: '' });
    setShowPassword(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "w-[92vw] sm:w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto",
        "border border-border bg-background sm:rounded-xl",
        "shadow-lg"
      )}>

        <DialogHeader className="relative text-center pb-4 pt-2">

          {/* 图标区域 */}
          <div className="mx-auto w-14 h-14 bg-muted/40 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>

          {/* 标题 */}
          <div>
            <DialogTitle className="text-2xl font-semibold text-foreground mb-1">
              管理员登录
            </DialogTitle>
            <p className="text-muted-foreground text-xs leading-relaxed">
              欢迎回来，请输入您的登录信息以访问管理面板
            </p>
          </div>
        </DialogHeader>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-5 px-2 pb-4"
        >
          {/* 用户名输入 */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              用户名/邮箱
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="请输入用户名或邮箱地址"
              disabled={isLoading}
              autoComplete="username"
              required
              className={cn("h-11 rounded-lg text-sm")}
            />
          </div>

          {/* 密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              密码
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="请输入密码"
                disabled={isLoading}
                autoComplete="current-password"
                required
                className={cn("h-11 pr-10 rounded-lg text-sm")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 登录按钮 */}
          <div className="pt-2">
            <Button
              type="submit"
              className={cn("w-full h-11 rounded-lg text-sm font-medium")}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 登录中...</span>
              ) : (
                <span className="inline-flex items-center gap-2"><LogIn className="w-4 h-4" /> 立即登录</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
