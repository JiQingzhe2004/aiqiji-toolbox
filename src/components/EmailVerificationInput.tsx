/**
 * 邮箱验证码输入组件
 * 提供发送验证码和验证功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { emailApi, type SendVerificationCodeRequest } from '@/services/emailApi';
import toast from 'react-hot-toast';

interface EmailVerificationInputProps {
  /** 邮箱地址 */
  email: string;
  /** 验证码类型 */
  type: 'register' | 'login' | 'reset_password' | 'email_change' | 'feedback';
  /** 验证码值 */
  value: string;
  /** 验证码变化回调 */
  onChange: (code: string) => void;
  /** 验证成功回调 */
  onVerified?: (verified: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义样式 */
  className?: string;
  /** 标签文本 */
  label?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否显示验证状态 */
  showStatus?: boolean;
}

export function EmailVerificationInput({
  email,
  type,
  value,
  onChange,
  onVerified,
  disabled = false,
  className,
  label = '验证码',
  placeholder = '请输入6位验证码(数字或大写字母)',
  showStatus = true
}: EmailVerificationInputProps) {
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string>('');

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (!email || !email.includes('@')) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const request: SendVerificationCodeRequest = {
        email,
        type,
      };

      const response = await emailApi.sendVerificationCode(request);
      
      if (response.success) {
        toast.success('验证码发送成功，请检查邮箱');
        setCountdown(60); // 60秒倒计时
      } else {
        const errorMsg = response.error || '发送验证码失败';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = '发送验证码失败，请稍后重试';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSendingCode(false);
    }
  }, [email, type]);

  // 验证码输入变化
  const handleCodeChange = useCallback((code: string) => {
    // 限制只能输入数字和大写字母，自动转换为大写
    const validCode = code.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6);
    onChange(validCode);
    setError('');
    
    // 更新验证状态（基于输入长度，不进行实际验证）
    if (validCode.length === 6) {
      setVerified(true);
      onVerified?.(true);
    } else {
      setVerified(false);
      onVerified?.(false);
    }
  }, [onChange, onVerified]);

  // 重新发送验证码
  const handleResend = useCallback(() => {
    setCountdown(0);
    handleSendCode();
  }, [handleSendCode]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="verification-code" className="text-sm font-medium">
          {label}
        </Label>
      )}
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="verification-code"
            type="text"
            maxLength={6}
            value={value}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'pr-10 text-center font-mono tracking-wider',
              verified && 'border-green-500',
              error && 'border-red-500'
            )}
          />
          
          {/* 验证状态图标 */}
          <AnimatePresence>
            {showStatus && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {verified && !error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </motion.div>
                )}
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={countdown > 0 ? handleResend : handleSendCode}
          disabled={disabled || sendingCode || !email}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          {sendingCode ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              发送中
            </>
          ) : countdown > 0 ? (
            <>
              <RefreshCw className="w-4 h-4" />
              {countdown}s
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              发送验证码
            </>
          )}
        </Button>
      </div>
      
      {/* 错误信息 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm text-red-500"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 帮助提示 */}
      {!error && (
        <p className="text-xs text-muted-foreground">
          {verified 
            ? `验证码已输入完整，有效期5分钟` 
            : `验证码将发送到 ${email}，支持数字和大写字母`
          }
        </p>
      )}
    </div>
  );
}
