/**
 * 用户个人主页
 * 显示用户的基本信息
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Shield, 
  Clock, 
  Loader2,
  UserX,
  Home,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SmartAvatar } from '@/components/SmartAvatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileEdit } from '@/components/UserProfileEdit';
import { userApi, type UserProfile } from '@/services/userApi';
import toast from 'react-hot-toast';

interface UserInfo {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  last_login_success?: string;
  profile?: {
    display_name?: string;
    bio?: string;
    location?: string;
    website?: string;
    avatar?: string;
  };
}

export default function UserPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const username = searchParams.get('username') || searchParams.get('user') || searchParams.get('name');
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 判断是否是当前用户自己的页面
  const isOwnProfile = isAuthenticated && currentUser && username === currentUser.username;

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // 准备请求头，如果已登录则包含Authorization头
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        const token = localStorage.getItem('auth_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/auth/user/${encodeURIComponent(username)}`,
          {
            method: 'GET',
            headers
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUserInfo(data.data);
          } else {
            setNotFound(true);
          }
        } else if (response.status === 404) {
          setNotFound(true);
        } else {
          throw new Error('获取用户信息失败');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        toast.error('获取用户信息失败');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [username]);

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 获取角色显示
  const getRoleDisplay = (role: string) => {
    const roleMap = {
      admin: { label: '管理员', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      user: { label: '用户', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
    };
    return roleMap[role as keyof typeof roleMap] || roleMap.user;
  };

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      active: { label: '活跃', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      inactive: { label: '非活跃', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      banned: { label: '已封禁', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.inactive;
  };

  // 加载状态
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">正在加载用户信息...</p>
          </div>
        </div>
      </div>
    );
  }

  // 用户不存在
  if (notFound || !userInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <UserX className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">用户不存在</h1>
            <p className="text-muted-foreground mb-4">
              {username ? `用户 "${username}" 不存在或已被删除` : '未指定用户名'}
            </p>
            {!username && (
              <div className="bg-muted/30 p-4 rounded-lg mb-6 text-sm">
                <p className="font-medium mb-2">用法示例：</p>
                <p className="text-muted-foreground">
                  访问用户页面：<code className="bg-background px-2 py-1 rounded">/user?username=admin</code>
                </p>
              </div>
            )}
            <Button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              返回首页
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const roleDisplay = getRoleDisplay(userInfo.role);
  const statusDisplay = getStatusDisplay(userInfo.status);

  // 转换用户信息格式给 UserProfileEdit 组件使用
  const userProfileData: UserProfile = {
    id: userInfo.id,
    username: userInfo.username,
    email: userInfo.email || '', // 后端已修复，如果是本人会返回email
    display_name: userInfo.profile?.display_name,
    avatar_url: userInfo.profile?.avatar,
    avatar_file: undefined,
    role: userInfo.role as 'admin' | 'user',
    status: userInfo.status as 'active' | 'inactive' | 'banned',
    created_at: userInfo.created_at,
    updated_at: userInfo.created_at
  };

  // 处理用户信息更新
  const handleUserUpdate = (updatedUser: UserProfile) => {
    setUserInfo(prev => prev ? {
      ...prev,
      profile: {
        ...prev.profile,
        display_name: updatedUser.display_name,
        avatar: updatedUser.avatar_url
      }
    } : null);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* 页面标题栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isOwnProfile ? '个人中心' : `${userInfo.profile?.display_name || userInfo.username} 的资料`}
              </h1>
              <p className="text-muted-foreground">
                {isOwnProfile ? '管理您的个人信息和账户设置' : '查看用户公开信息'}
              </p>
            </div>
          </div>
          
          {/* 编辑按钮 - 只在自己的资料页面显示 */}
          {isOwnProfile && (
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? '取消编辑' : '编辑资料'}
            </Button>
          )}
        </div>

        {/* 编辑模式 */}
        {isEditing && isOwnProfile ? (
          <>
            <UserProfileEdit 
              user={userProfileData}
              onUpdate={handleUserUpdate}
            />
            
            {/* 账户信息 - 编辑模式下也显示，但不可编辑 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  账户信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">用户名</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{userInfo.username}</span>
                    </div>
                  </div>
                  
                  {userInfo.email && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">邮箱</p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{userInfo.email}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">角色</p>
                    <Badge className={cn('text-xs w-fit', roleDisplay.color)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {roleDisplay.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">状态</p>
                    <Badge variant="outline" className={cn('text-xs w-fit', statusDisplay.color)}>
                      {statusDisplay.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">注册时间</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(userInfo.created_at)}</span>
                    </div>
                  </div>
                  
                  {userInfo.last_login_success && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">最后登录</p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(userInfo.last_login_success)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* 查看模式 */
          <>
            {/* 头像区域 - 居中显示 */}
            <div className="flex justify-center mb-8">
              <SmartAvatar
                user={{
                  avatar_url: userInfo.profile?.avatar,
                  email: userInfo.email,
                  username: userInfo.username,
                  display_name: userInfo.profile?.display_name
                }}
                size={120}
                className="w-32 h-32 border-4 border-background shadow-xl"
                fallbackClassName="text-4xl"
              />
            </div>

            {/* 用户基本信息卡片 */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {/* 用户名和昵称 */}
                  <div>
                    <h1 className="text-2xl font-bold mb-1">
                      {userInfo.profile?.display_name || userInfo.username}
                    </h1>
                    {userInfo.profile?.display_name && (
                      <p className="text-muted-foreground">@{userInfo.username}</p>
                    )}
                  </div>

                  {/* 角色和状态徽章 */}
                  <div className="flex justify-center gap-2">
                    <Badge className={cn('text-xs', roleDisplay.color)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {roleDisplay.label}
                    </Badge>
                    <Badge className={cn('text-xs', statusDisplay.color)}>
                      {statusDisplay.label}
                    </Badge>
                  </div>
                  
                  {/* 注册时间 */}
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>加入于 {formatDate(userInfo.created_at)}</span>
                    </div>
                  </div>

                  {/* 邮箱信息（如果可见） */}
                  {userInfo.email && (isOwnProfile || currentUser?.role === 'admin') && (
                    <div className="flex justify-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{userInfo.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 个人简介卡片 */}
            {userInfo.profile?.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>个人简介</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    {userInfo.profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 其他联系信息 */}
            {(userInfo.profile?.location || userInfo.profile?.website) && (
              <Card>
                <CardHeader>
                  <CardTitle>联系信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  
                    {userInfo.profile?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{userInfo.profile.location}</span>
                      </div>
                    )}
                    
                    {userInfo.profile?.website && (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        <a 
                          href={userInfo.profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {userInfo.profile.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

        {/* 账户信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              账户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">用户名</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{userInfo.username}</span>
                </div>
              </div>
              
              {/* 邮箱仅在用户自己的页面或管理员身份时显示 */}
              {userInfo.email && (isOwnProfile || currentUser?.role === 'admin') && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">邮箱</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{userInfo.email}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-sm font-medium">角色</p>
                <Badge className={cn('text-xs w-fit', roleDisplay.color)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {roleDisplay.label}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">状态</p>
                <Badge variant="outline" className={cn('text-xs w-fit', statusDisplay.color)}>
                  {statusDisplay.label}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">注册时间</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(userInfo.created_at)}</span>
                </div>
              </div>
              
              {/* 最后登录时间仅在用户自己的页面或管理员身份时显示 */}
              {userInfo.last_login_success && (isOwnProfile || currentUser?.role === 'admin') && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">最后登录</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(userInfo.last_login_success)}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </motion.div>
    </div>
  );
}


