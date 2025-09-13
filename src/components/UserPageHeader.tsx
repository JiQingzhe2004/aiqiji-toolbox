/**
 * 用户页面专用顶部栏组件
 * 简洁的设计，专注于用户页面功能
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Settings, User, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedThemeToggler } from './magicui/animated-theme-toggler';
import { LoginModal } from './LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi, type WebsiteInfo } from '@/services/settingsApi';
import { SEOImage, SEOImagePresets } from '@/components/SEOImage';
import { getAvatarUrl } from '@/services/avatarService';

interface UserPageHeaderProps {
  currentUsername?: string;
  userInfo?: {
    display_name?: string;
    avatar_url?: string;
  };
}

export function UserPageHeader({ currentUsername, userInfo }: UserPageHeaderProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo | null>(null);

  // 获取网站信息
  useEffect(() => {
    const fetchWebsiteInfo = async () => {
      try {
        const info = await settingsApi.getPublicWebsiteInfo();
        setWebsiteInfo(info);
      } catch (error) {
        console.error('获取网站信息失败:', error);
        // 设置默认值
        setWebsiteInfo({
          site_name: 'AiQiji工具箱',
          site_url: 'https://aiqiji.com',
          site_icon: '/favicon.ico',
          site_description: '专业的AI工具导航平台',
          icp_number: '',
          show_icp: false
        });
      }
    };

    fetchWebsiteInfo();
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-muted-foreground/10"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* 左侧：Logo和导航 */}
          <div className="flex items-center space-x-4">
            {/* 首页按钮 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoHome}
              className="rounded-xl hover:bg-muted"
              title="返回首页"
            >
              <Home className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <motion.div
              className="flex items-center space-x-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogoClick}
            >
              <div className="relative">
                <SEOImage
                  {...SEOImagePresets.websiteLogo(
                    websiteInfo?.site_icon || "/logo.png",
                    websiteInfo?.site_name || "AiQiji工具箱"
                  )}
                  className="w-8 h-8 object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg"></div>';
                  }}
                />
              </div>
              
              <div className="hidden sm:flex flex-col">
                <div className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  {websiteInfo?.site_name || "AiQiji·工具箱"}
                </div>
              </div>
            </motion.div>

            {/* 当前页面标识 */}
            {currentUsername && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>/</span>
                <User className="w-4 h-4" />
                <span>{currentUsername}</span>
              </div>
            )}
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center space-x-2">
            {/* 返回按钮 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="rounded-xl hover:bg-muted"
              title="返回上一页"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* 用户状态 */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {isAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs hidden sm:flex"
                    onClick={() => {
                      window.location.href = '/admin';
                    }}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    管理
                  </Button>
                ) : (
                  // 普通用户显示头像和昵称
                  (() => {
                    const displayName = user?.display_name || user?.username || '用户';
                    const avatarInitial = displayName.charAt(0).toUpperCase();
                    const avatarUrl = userInfo?.avatar_url ? getAvatarUrl(userInfo.avatar_url) : user?.avatar_url ? getAvatarUrl(user.avatar_url) : undefined;
                    
                    return (
                      <div className="hidden sm:flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {avatarInitial}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground max-w-16 truncate">
                          {displayName}
                        </span>
                      </div>
                    );
                  })()
                )}

                {/* 退出登录按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleLogout}
                  title="退出登录"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  退出
                </Button>

                {/* 移动端用户按钮 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden rounded-xl hover:bg-muted"
                  onClick={() => {
                    if (isAdmin) {
                      window.location.href = '/admin';
                    } else {
                      if (user?.username) {
                        window.location.href = `/user?username=${user.username}`;
                      }
                    }
                  }}
                  aria-label={isAdmin ? "管理" : "个人中心"}
                >
                  {isAdmin ? <Settings className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="w-3 h-3 mr-1" />
                登录
              </Button>
            )}

            {/* 主题切换器 */}
            <AnimatedThemeToggler />
          </div>
        </div>

        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </motion.header>

      {/* 登录弹窗 */}
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </>
  );
}
