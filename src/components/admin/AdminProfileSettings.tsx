import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthApi } from '@/services/authApi';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import type { User as UserType } from '@/types/auth';

interface ProfileFormData {
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function AdminProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    email: '',
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<{
    profile?: string;
    password?: string;
  }>({});

  // 加载用户详细信息
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await AuthApi.getProfile();
        if (result.success && result.data) {
          setProfileData({
            email: result.data.email || '',
          });
        }
      } catch (error) {
        console.error('加载个人信息失败:', error);
      }
    };

    loadProfile();
  }, []);

  // 处理个人信息表单变化
  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // 清除错误
    if (errors.profile) {
      setErrors(prev => ({ ...prev, profile: undefined }));
    }
  };

  // 处理密码表单变化
  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // 清除错误
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  // 切换密码可见性
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // 邮箱可以为空
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 验证密码表单
  const validatePasswordForm = (): boolean => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrors(prev => ({ ...prev, password: '请填写所有密码字段' }));
      return false;
    }

    if (newPassword.length < 6) {
      setErrors(prev => ({ ...prev, password: '新密码长度至少为6位' }));
      return false;
    }

    if (newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, password: '新密码和确认密码不一致' }));
      return false;
    }

    if (currentPassword === newPassword) {
      setErrors(prev => ({ ...prev, password: '新密码不能与当前密码相同' }));
      return false;
    }

    return true;
  };

  // 更新个人信息
  const handleUpdateProfile = async () => {
    if (!validateEmail(profileData.email)) {
      setErrors(prev => ({ ...prev, profile: '邮箱格式不正确' }));
      return;
    }

    setLoading(true);
    try {
      const result = await AuthApi.updateProfile(profileData);
      
      if (result.success) {
        toast.success('个人信息更新成功');
      } else {
        setErrors(prev => ({ ...prev, profile: result.message || '更新失败' }));
        toast.error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      setErrors(prev => ({ ...prev, profile: '网络错误，请稍后重试' }));
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await AuthApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.success) {
        toast.success('密码修改成功');
        // 清空密码表单
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setErrors(prev => ({ ...prev, password: result.message || '密码修改失败' }));
        toast.error(result.message || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      setErrors(prev => ({ ...prev, password: '网络错误，请稍后重试' }));
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 用户信息概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            管理员信息
          </CardTitle>
          <CardDescription>
            当前登录的管理员账户信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">用户名</Label>
              <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{user?.username}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">角色</Label>
              <p className="text-sm mt-1 p-2 bg-muted/30 rounded">管理员</p>
            </div>
          </div>
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              用户名 <strong>{user?.username}</strong> 无法修改，这是为了保障系统安全。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 个人信息设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            个人信息
          </CardTitle>
          <CardDescription>
            管理您的个人信息设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              placeholder="请输入邮箱地址（可选）"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              设置邮箱后可以使用邮箱地址登录
            </p>
          </div>

          {errors.profile && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.profile}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                更新中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存信息
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 密码修改 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            修改密码
          </CardTitle>
          <CardDescription>
            为了账户安全，建议定期更换密码
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 当前密码 */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">当前密码</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="请输入当前密码"
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
                disabled={loading}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 新密码 */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">新密码</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="请输入新密码（至少6位）"
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
                disabled={loading}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 确认新密码 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="请再次输入新密码"
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={loading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {errors.password && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.password}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>密码安全提示：</strong>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                <li>密码长度至少6位字符</li>
                <li>建议包含字母、数字和特殊字符</li>
                <li>不要使用过于简单的密码</li>
                <li>定期更换密码以保障安全</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full md:w-auto"
            variant="default"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                修改中...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                修改密码
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminProfileSettings;
