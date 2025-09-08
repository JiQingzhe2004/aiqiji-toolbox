/**
 * 登录弹窗组件
 * 替代独立的登录页面，提供更好的用户体验
 */

import React, { useState } from 'react';
import { X, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
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

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [formData, setFormData] = useState({
    username: '',
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
      <DialogContent className="w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto border-0 shadow-2xl bg-gradient-to-br from-background via-background to-muted/30">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            登录
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-2">
            欢迎回来，请输入您的登录信息
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-1">
          {/* 用户名输入 */}
          <div className="space-y-3">
            <Label htmlFor="username" className="text-sm font-medium text-foreground">
              用户名
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="请输入用户名"
              disabled={isLoading}
              autoComplete="username"
              required
              className="h-12 border-2 border-muted focus:border-primary transition-colors bg-background/50 backdrop-blur-sm"
            />
          </div>

          {/* 密码输入 */}
          <div className="space-y-3">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
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
                className="h-12 pr-12 border-2 border-muted focus:border-primary transition-colors bg-background/50 backdrop-blur-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* 登录按钮 */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  登录
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
