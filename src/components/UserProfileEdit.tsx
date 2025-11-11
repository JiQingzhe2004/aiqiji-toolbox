/**
 * 用户资料编辑组件
 * 支持头像上传、昵称修改和带验证码的密码修改
 */

import React, { useState, useRef } from 'react';
import { User, Camera, Lock, Mail, Eye, EyeOff, Shuffle, MessageCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userApi, type UserProfile } from '@/services/userApi';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRandomAvatar, fetchQQAvatar, checkIsQQEmail, fetchCravatarAvatar, avatarService } from '@/services/avatarService';

interface UserProfileEditProps {
  user: UserProfile;
  onUpdate?: (updatedUser: UserProfile) => void;
}

export function UserProfileEdit({ user, onUpdate }: UserProfileEditProps) {
  const { updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 基本信息状态
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // 头像上传状态
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // 头像选择状态
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  
  // 邮箱修改状态
  const [newEmail, setNewEmail] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  // 密码修改状态
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // 处理头像选择
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      toast.error('头像文件大小不能超过2MB');
      return;
    }

    setAvatarFile(file);
    
    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 上传头像
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    setIsUploadingAvatar(true);
    try {
      const response = await userApi.uploadAvatar(avatarFile);
      
      if (response.success && response.data) {
        setAvatarPreview(response.data.avatar_url);
        setAvatarFile(null);
        setPendingAvatarUrl(null); // 清除待保存的头像
        toast.success('头像上传成功');
        
        // 清除头像缓存，确保重新加载
        avatarService.clearCache();
        
        // 更新用户信息
        const updatedUser = { ...user, avatar_url: response.data.avatar_url };
        onUpdate?.(updatedUser);
        updateUser({ 
          avatar_url: response.data.avatar_url 
        });
      } else {
        toast.error(response.message || '头像上传失败');
      }
    } catch (error) {
      toast.error('头像上传失败');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 获取随机头像
  const handleGetRandomAvatar = async () => {
    setIsGeneratingAvatar(true);
    try {
      const randomAvatarUrl = await fetchRandomAvatar();
      setPendingAvatarUrl(randomAvatarUrl);
      setAvatarPreview(randomAvatarUrl);
      setAvatarFile(null); // 清除文件上传
      toast.success('已生成随机头像，请点击"保存头像"确认');
    } catch (error) {
      toast.error('获取随机头像失败');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // 获取QQ头像
  const handleGetQQAvatar = async () => {
    if (!user.email || !checkIsQQEmail(user.email)) {
      toast.error('请使用QQ邮箱登录后再试');
      return;
    }

    setIsGeneratingAvatar(true);
    try {
      const qqAvatarUrl = fetchQQAvatar(user.email);
      setPendingAvatarUrl(qqAvatarUrl);
      setAvatarPreview(qqAvatarUrl);
      setAvatarFile(null); // 清除文件上传
      toast.success('已获取QQ头像，请点击"保存头像"确认');
    } catch (error) {
      toast.error('获取QQ头像失败');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // 保存头像URL
  const handleSaveAvatarUrl = async () => {
    if (!pendingAvatarUrl) return;

    setIsSavingAvatar(true);
    try {
      const response = await userApi.saveAvatarUrl(pendingAvatarUrl);
      
      if (response.success && response.data) {
        setPendingAvatarUrl(null);
        toast.success('头像保存成功');
        
        // 清除头像缓存，确保重新加载
        avatarService.clearCache();
        
        // 更新用户信息
        const updatedUser = { ...user, avatar_url: response.data.avatar_url };
        onUpdate?.(updatedUser);
        updateUser({ 
          avatar_url: response.data.avatar_url 
        });
      } else {
        toast.error(response.message || '头像保存失败');
      }
    } catch (error) {
      toast.error('头像保存失败');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // 取消头像选择
  const handleCancelAvatarSelection = () => {
    setPendingAvatarUrl(null);
    setAvatarPreview(user.avatar_url || null);
    setAvatarFile(null);
  };

  // 更新基本信息
  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error('昵称不能为空');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await userApi.updateProfile({
        display_name: displayName.trim()
      });

      if (response.success && response.data) {
        toast.success('资料更新成功');
        onUpdate?.(response.data);
        updateUser({ 
          display_name: response.data.display_name 
        });
      } else {
        toast.error(response.message || '资料更新失败');
      }
    } catch (error) {
      toast.error('资料更新失败');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const response = await userApi.requestPasswordChangeCode();
      
      if (response.success) {
        toast.success('验证码已发送到您的邮箱');
        setCodeSent(true);
      } else {
        toast.error(response.message || '发送验证码失败');
      }
    } catch (error) {
      toast.error('发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!newEmail.trim()) {
      toast.error('请输入新邮箱地址');
      return;
    }

    // 严格验证邮箱格式
    const strictEmailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
    if (!strictEmailRegex.test(newEmail)) {
      toast.error('邮箱格式不符合规范，请检查是否有拼写错误');
      return;
    }

    // 检查常见的邮箱拼写错误
    const commonTypos = [
      { wrong: '@gmial.com', correct: '@gmail.com' },
      { wrong: '@gmai.com', correct: '@gmail.com' },
      { wrong: '@163.con', correct: '@163.com' },
      { wrong: '@qq.con', correct: '@qq.com' },
      { wrong: '@126.con', correct: '@126.com' },
      { wrong: '@outlok.com', correct: '@outlook.com' },
      { wrong: '@hotmial.com', correct: '@hotmail.com' }
    ];

    for (const typo of commonTypos) {
      if (newEmail.toLowerCase().endsWith(typo.wrong)) {
        toast.error(`邮箱地址可能有误，您是否想输入 ${newEmail.replace(new RegExp(typo.wrong + '$', 'i'), typo.correct)}？`);
        return;
      }
    }

    setIsSendingEmailCode(true);
    try {
      const response = await userApi.requestEmailChangeCode(newEmail);
      
      if (response.success) {
        toast.success('验证码已发送到新邮箱，请注意查收（包括垃圾邮件箱）');
        setEmailCodeSent(true);
      } else {
        toast.error(response.message || '发送验证码失败');
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || '发送验证码失败';
      toast.error(errorMsg);
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  // 修改邮箱
  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !emailVerificationCode.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    // 二次确认，防止用户输错邮箱
    const confirmed = window.confirm(
      `请确认新邮箱地址是否正确：\n\n${newEmail}\n\n验证码将发送到此邮箱，如果邮箱地址有误，您将无法收到验证码。\n\n确认无误后点击"确定"继续。`
    );
    
    if (!confirmed) {
      return;
    }

    setIsChangingEmail(true);
    try {
      const response = await userApi.changeEmail({
        newEmail,
        verificationCode: emailVerificationCode
      });

      if (response.success && response.data) {
        toast.success('邮箱修改成功');
        // 重置表单
        setNewEmail('');
        setEmailVerificationCode('');
        setEmailCodeSent(false);
        
        // 更新用户信息
        const updatedUser = { ...user, email: response.data.email };
        onUpdate?.(updatedUser);
        updateUser({ 
          email: response.data.email 
        });
      } else {
        toast.error(response.message || '邮箱修改失败');
      }
    } catch (error) {
      toast.error('邮箱修改失败');
    } finally {
      setIsChangingEmail(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    // 验证输入
    if (!currentPassword || !newPassword || !verificationCode) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('新密码长度至少6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('新密码与确认密码不匹配');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await userApi.changePassword({
        currentPassword,
        newPassword,
        verificationCode
      });

      if (response.success) {
        toast.success('密码修改成功');
        // 重置表单
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setVerificationCode('');
        setCodeSent(false);
      } else {
        toast.error(response.message || '密码修改失败');
      }
    } catch (error) {
      toast.error('密码修改失败');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 头像设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            头像设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-xl">
                {user.display_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 flex-1">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || isGeneratingAvatar}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  选择头像
                </Button>
                {avatarFile && (
                  <Button
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? '上传中...' : '上传头像'}
                  </Button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetRandomAvatar}
                  disabled={isGeneratingAvatar || isSavingAvatar}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {isGeneratingAvatar ? '生成中...' : '随机头像'}
                </Button>
                {user.email && checkIsQQEmail(user.email) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetQQAvatar}
                    disabled={isGeneratingAvatar || isSavingAvatar}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {isGeneratingAvatar ? '获取中...' : 'QQ头像'}
                  </Button>
                )}
              </div>
              {pendingAvatarUrl && (
                <div className="flex gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">预览头像</p>
                    <p className="text-xs text-muted-foreground">请确认是否保存这个头像</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveAvatarUrl}
                      disabled={isSavingAvatar}
                    >
                      {isSavingAvatar ? '保存中...' : '保存头像'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelAvatarSelection}
                      disabled={isSavingAvatar}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                支持 JPG、PNG、GIF 格式，文件大小不超过 2MB
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">当前邮箱</Label>
              <Input
                id="email"
                value={user.email && user.email.trim() ? user.email : '未绑定邮箱'}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">昵称</Label>
              <div className="relative">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="请输入昵称"
                  maxLength={100}
                  className="pr-12"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile || displayName === user.display_name}
                  title="保存昵称"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 邮箱修改 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            修改邮箱
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEmail">新邮箱地址</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="请输入新的邮箱地址"
            />
            <p className="text-xs text-muted-foreground">
              请仔细核对邮箱地址，验证码将发送到此邮箱
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailVerificationCode">邮箱验证码</Label>
            <div className="flex gap-2">
              <Input
                id="emailVerificationCode"
                value={emailVerificationCode}
                onChange={(e) => setEmailVerificationCode(e.target.value)}
                placeholder="请输入邮箱验证码"
                maxLength={6}
              />
              <Button
                variant="outline"
                onClick={handleSendEmailCode}
                disabled={isSendingEmailCode || !newEmail.trim()}
              >
                {isSendingEmailCode ? '发送中...' : emailCodeSent ? '重新发送' : '发送验证码'}
              </Button>
            </div>
            {emailCodeSent && (
              <p className="text-xs text-muted-foreground">
                验证码已发送到 <strong>{newEmail}</strong>，请查收邮件（包括垃圾邮件箱）
              </p>
            )}
          </div>

          <Button
            onClick={handleChangeEmail}
            disabled={isChangingEmail || !newEmail.trim() || !emailVerificationCode.trim()}
            className="w-full"
          >
            {isChangingEmail ? '修改中...' : '修改邮箱'}
          </Button>
        </CardContent>
      </Card>

      {/* 密码修改 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            修改密码
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">当前密码</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword.current ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">新密码</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword.new ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPassword.confirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="verificationCode">邮箱验证码</Label>
            <div className="flex gap-2">
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="请输入邮箱验证码"
                maxLength={6}
              />
              <Button
                variant="outline"
                onClick={handleSendCode}
                disabled={isSendingCode || !user.email}
              >
                {isSendingCode ? '发送中...' : codeSent ? '重新发送' : '发送验证码'}
              </Button>
            </div>
            {!user.email && (
              <p className="text-sm text-destructive">
                您还没有绑定邮箱，无法修改密码
              </p>
            )}
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !user.email}
            className="w-full"
          >
            {isChangingPassword ? '修改中...' : '修改密码'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
