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
  UserX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserPageHeader } from '@/components/UserPageHeader';
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
  const username = searchParams.get('username') || searchParams.get('user') || searchParams.get('name');
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/auth/user/${encodeURIComponent(username)}`
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
      <div className="min-h-screen bg-background">
        <UserPageHeader currentUsername={username || undefined} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">正在加载用户信息...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 用户不存在
  if (notFound || !userInfo) {
    return (
      <div className="min-h-screen bg-background">
        <UserPageHeader currentUsername={username || undefined} />
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
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const roleDisplay = getRoleDisplay(userInfo.role);
  const statusDisplay = getStatusDisplay(userInfo.status);

  return (
    <div className="min-h-screen bg-background">
      {/* 专用顶部栏 */}
      <UserPageHeader currentUsername={username || undefined} />
      
      {/* 页面内容 */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >

        {/* 用户基本信息卡片 */}
        <Card>
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              {/* 头像区域 */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>

              {/* 基本信息 */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">
                      {userInfo.profile?.display_name || userInfo.username}
                    </h1>
                    <Badge className={cn('text-xs', roleDisplay.color)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {roleDisplay.label}
                    </Badge>
                    <Badge className={cn('text-xs', statusDisplay.color)}>
                      {statusDisplay.label}
                    </Badge>
                  </div>
                  
                  {/* 注册时间 */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>加入于 {formatDate(userInfo.created_at)}</span>
                  </div>
                  
                  {userInfo.username !== (userInfo.profile?.display_name || userInfo.username) && (
                    <p className="text-muted-foreground">@{userInfo.username}</p>
                  )}
                </div>

                {/* 个人简介 */}
                {userInfo.profile?.bio && (
                  <p className="text-foreground leading-relaxed">
                    {userInfo.profile.bio}
                  </p>
                )}

                {/* 联系信息 */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {userInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{userInfo.email}</span>
                    </div>
                  )}
                  
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 账户信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              账户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userInfo.last_login_success && (
              <div className="space-y-1">
                <p className="text-sm font-medium">最后登录</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(userInfo.last_login_success)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}


