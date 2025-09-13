/**
 * 邮箱配置卡片组件
 * 用于在系统设置中配置邮件服务
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, TestTube, Eye, EyeOff, Save, Loader2, Check, AlertCircle, ShieldCheck, X, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { emailApi } from '@/services/emailApi';
import toast from 'react-hot-toast';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
  email_enabled: boolean;
}

interface EmailConfigCardProps {
  config: EmailConfig;
  onChange: (config: EmailConfig) => void;
  onSave?: () => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmailConfigCard({
  config,
  onChange,
  onSave,
  loading = false,
  className
}: EmailConfigCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingVerification, setTestingVerification] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 验证码验证相关状态
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // 更新配置
  const updateConfig = (key: keyof EmailConfig, value: any) => {
    onChange({
      ...config,
      [key]: value
    });
  };

  // 测试邮箱配置
  const handleTest = async () => {
    if (!config.from_email && !config.smtp_user) {
      toast.error('请先配置发件人邮箱');
      return;
    }

    setTesting(true);
    try {
      const response = await emailApi.sendTestEmail({
        to: config.from_email || config.smtp_user,
        subject: '邮箱配置测试 - AiQiji工具箱',
        text: '这是一封测试邮件，用于验证邮箱配置是否正确。如果您收到这封邮件，说明邮箱配置成功！',
      });
      
      if (response.success) {
        toast.success('测试邮件发送成功！请检查收件箱');
      } else {
        toast.error(`测试邮件发送失败: ${response.error}`);
      }
    } catch (error) {
      toast.error('测试邮件发送失败');
    } finally {
      setTesting(false);
    }
  };

  // 测试验证码发送
  const handleVerificationTest = async () => {
    if (!config.from_email && !config.smtp_user) {
      toast.error('请先配置发件人邮箱');
      return;
    }

    const testEmail = config.from_email || config.smtp_user;
    setTestingVerification(true);
    
    try {
      const response = await emailApi.sendVerificationCode({
        email: testEmail,
        type: 'login',
        template: 'default'
      });
      
      if (response.success) {
        toast.success('验证码发送成功！请检查收件箱', {
          duration: 3000,
        });
        // 发送成功后显示验证模态框
        setVerificationEmail(testEmail);
        setShowVerificationModal(true);
        setVerificationCode('');
      } else {
        toast.error(`验证码发送失败: ${response.error}`);
      }
    } catch (error) {
      toast.error('验证码发送失败');
    } finally {
      setTestingVerification(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error('请输入验证码');
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error('验证码必须是6位数字或大写字母');
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await emailApi.verifyCode({
        email: verificationEmail,
        code: verificationCode.toUpperCase(), // 转换为大写
        type: 'login'
      });
      
      if (response.success) {
        toast.success('验证码验证成功！✅', {
          duration: 4000,
        });
        setShowVerificationModal(false);
        setVerificationCode('');
      } else {
        toast.error(`验证码验证失败: ${response.error || '验证码无效或已过期'}`);
      }
    } catch (error) {
      toast.error('验证码验证失败');
    } finally {
      setVerifyingCode(false);
    }
  };

  // 关闭验证模态框
  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setVerificationCode('');
  };

  // 保存配置
  const handleSave = async () => {
    if (!config.smtp_host || !config.smtp_user) {
      toast.error('请填写必需的配置项');
      return;
    }

    setSaving(true);
    try {
      if (onSave) {
        await onSave();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          邮箱配置
          {config.email_enabled && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Check className="w-4 h-4" />
              已启用
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 启用开关 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">启用邮件功能</Label>
            <p className="text-xs text-muted-foreground">
              启用后可发送验证码、通知等邮件
            </p>
          </div>
          <Switch
            checked={config.email_enabled}
            onCheckedChange={(checked) => updateConfig('email_enabled', checked)}
          />
        </div>

        {config.email_enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* SMTP服务器配置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP服务器 *</Label>
                <Input
                  id="smtp-host"
                  value={config.smtp_host}
                  onChange={(e) => updateConfig('smtp_host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP端口</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={config.smtp_port}
                  onChange={(e) => updateConfig('smtp_port', parseInt(e.target.value) || 587)}
                  placeholder="587"
                />
              </div>
            </div>

            {/* SSL/TLS设置 */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">启用SSL/TLS</Label>
                <p className="text-xs text-muted-foreground">
                  使用安全连接发送邮件
                </p>
              </div>
              <Switch
                checked={config.smtp_secure}
                onCheckedChange={(checked) => updateConfig('smtp_secure', checked)}
              />
            </div>

            {/* 认证信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-user">SMTP用户名 *</Label>
                <Input
                  id="smtp-user"
                  value={config.smtp_user}
                  onChange={(e) => updateConfig('smtp_user', e.target.value)}
                  placeholder="your-email@gmail.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-pass">SMTP密码 *</Label>
                <div className="relative">
                  <Input
                    id="smtp-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={config.smtp_pass}
                    onChange={(e) => updateConfig('smtp_pass', e.target.value)}
                    placeholder="应用专用密码"
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
              </div>
            </div>

            {/* 发件人信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-name">发件人名称</Label>
                <Input
                  id="from-name"
                  value={config.from_name}
                  onChange={(e) => updateConfig('from_name', e.target.value)}
                  placeholder="AiQiji工具箱"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="from-email">发件人邮箱</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={config.from_email}
                  onChange={(e) => updateConfig('from_email', e.target.value)}
                  placeholder="noreply@example.com"
                />
              </div>
            </div>

            {/* 配置说明 */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 text-sm text-blue-700 dark:text-blue-300">
              <h4 className="font-medium mb-2">配置说明：</h4>
              <ul className="space-y-1 text-xs">
                <li>• Gmail: smtp.gmail.com:587, 需要开启两步验证并使用应用专用密码</li>
                <li>• QQ邮箱: smtp.qq.com:587, 需要开启SMTP服务并获取授权码</li>
                <li>• 163邮箱: smtp.163.com:465, 需要开启SMTP服务并设置客户端授权密码</li>
                <li>• 建议使用SSL/TLS加密连接确保安全性</li>
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={testing || testingVerification || !config.smtp_host || !config.smtp_user}
                className="flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4" />
                    测试配置
                  </>
                )}
              </Button>

              <Button
                onClick={handleVerificationTest}
                variant="outline"
                disabled={testing || testingVerification || !config.smtp_host || !config.smtp_user || !config.email_enabled}
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
              >
                {testingVerification ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    测试验证码
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={saving || loading || testing || testingVerification}
                className="flex items-center gap-2"
              >
                {(saving || loading) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    保存配置
                  </>
                )}
              </Button>
            </div>

            {/* 测试说明 */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p><strong>测试配置：</strong>发送基础测试邮件，验证SMTP连接和邮件发送功能</p>
              <p><strong>测试验证码：</strong>发送包含6位验证码(数字+字母)的邮件，验证完整的验证码流程</p>
            </div>
          </motion.div>
        )}
      </CardContent>

      {/* 验证码验证模态框 */}
      <AnimatePresence>
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">验证码校验测试</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseVerificationModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-sm">
                  <p className="text-blue-800 dark:text-blue-200">
                    <strong>测试邮箱：</strong> {verificationEmail}
                  </p>
                  <p className="text-blue-600 dark:text-blue-300 mt-1">
                    验证码已发送到上述邮箱，请查收并在下方输入以测试验证功能。
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-code">验证码</Label>
                  <Input
                    id="verification-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-wider"
                    disabled={verifyingCode}
                  />
                  <p className="text-xs text-muted-foreground">
                    支持数字和大写字母，有效期5分钟
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCloseVerificationModal}
                  disabled={verifyingCode}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={verifyingCode || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {verifyingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      验证中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      验证
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <p><strong>测试说明：</strong></p>
                <p>• 此功能测试完整的验证码生成、发送、验证流程</p>
                <p>• 验证成功表示邮件服务和数据库存储都正常工作</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}
