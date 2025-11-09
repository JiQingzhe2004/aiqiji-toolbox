/**
 * 主应用侧边栏组件
 * 基于 Aceternity 设计理念，集成用户登录功能和导航
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  Sparkles, 
  Users, 
  Link, 
  PlusCircle, 
  Settings, 
  User, 
  Heart,
  LogIn, 
  LogOut, 
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  MailCheck,
  Database,
  BarChart3,
  FileSpreadsheet,
  Send
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SmartAvatar } from '@/components/SmartAvatar';
import { Separator } from '@/components/ui/separator';
import { SearchBar } from '@/components/SearchBar';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';
import { LoginModal } from '@/components/LoginModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi, type WebsiteInfo } from '@/services/settingsApi';
import { SEOImage, SEOImagePresets } from '@/components/SEOImage';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  requireAuth?: boolean;
  adminOnly?: boolean;
  external?: boolean;
}

const navigationItems: NavigationItem[] = [
  { id: 'home', label: '首页', icon: Home, href: '/' },
  { id: 'favorites', label: '我的收藏', icon: Heart, href: '/me/favorites', requireAuth: true },
  { id: 'submit', label: '提交工具', icon: PlusCircle, href: '/submit-tool' },
  { id: 'friends', label: '友情链接', icon: Link, href: '/friends' },
];

// 底部管理员按钮
const adminButtonItem: NavigationItem = { id: 'admin', label: '管理后台', icon: Settings, href: '/admin', requireAuth: true, adminOnly: true };

// 管理员页面专用导航项
const adminNavigationItems: NavigationItem[] = [
  { id: 'home', label: '返回首页', icon: Home, href: '/' },
  { id: 'admin-tools', label: '工具管理', icon: Database, href: '/admin' },
  { id: 'admin-import', label: '批量导入', icon: FileSpreadsheet, href: '/admin?tab=import' },
  { id: 'admin-stats', label: '统计数据', icon: BarChart3, href: '/admin?tab=stats' },
  { id: 'admin-submissions', label: '工具提交', icon: Send, href: '/admin?tab=submissions' },
  { id: 'admin-email', label: '邮件发送', icon: MailCheck, href: '/admin?tab=email' },
  { id: 'admin-friendlinks', label: '友链管理', icon: Link, href: '/admin?tab=friendlinks' },
  { id: 'admin-users', label: '用户管理', icon: Users, href: '/admin?tab=users' },
  { id: 'admin-settings', label: '系统设置', icon: Settings, href: '/admin?tab=settings' },
  { id: 'admin-profile', label: '个人设置', icon: User, href: '/admin?tab=profile' },
];

export function AppSidebar({ children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo | null>(null);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 检测是否在管理员页面
  const isAdminPage = location.pathname.startsWith('/admin');

  // 获取网站信息
  useEffect(() => {
    const fetchWebsiteInfo = async () => {
      try {
        const info = await settingsApi.getPublicWebsiteInfo();
        setWebsiteInfo(info);
      } catch (error) {
        console.error('获取网站信息失败:', error);
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

  // 检测屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理导航点击
  const handleNavigation = (item: NavigationItem) => {
    if (item.requireAuth && !isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (item.adminOnly && !isAdmin) {
      return;
    }

    if (item.external) {
      window.open(item.href, '_blank', 'noopener noreferrer');
    } else {
      if (item.id === 'favorites') {
        if (user?.username) {
          navigate(`/user?username=${user.username}&section=favorites`);
        } else {
          setShowLoginModal(true);
          return;
        }
      } else {
        navigate(item.href);
      }
      setIsMobileOpen(false);
    }
  };

  // 处理用户中心点击
  const handleUserCenter = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (user?.username) {
      navigate(`/user?username=${user.username}`);
      setIsMobileOpen(false);
    }
  };

  const handleFavorites = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (user?.username) {
      navigate(`/user?username=${user.username}&section=favorites`);
      setIsMobileOpen(false);
    }
  };

  // 处理退出登录
  const handleLogout = async () => {
    await logout();
    setIsMobileOpen(false);
    navigate('/'); // 重定向到首页
  };

  // 获取当前用户信息
  const getCurrentUser = () => {
    if (!isAuthenticated || !user) {
      return null;
    }
    
    const currentUser = {
      displayName: user.display_name || user.username || '用户',
      username: user.username || '',
      email: user.email || '',
      avatar_url: user.avatar_url || undefined,
      isAdmin
    };
    
    return currentUser;
  };

  const currentUser = getCurrentUser();

  // 判断路径是否激活
  const isPathActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    
    // 处理管理员页面的query参数路由
    if (path.includes('?tab=')) {
      const [basePath, tabParam] = path.split('?tab=');
      if (location.pathname === basePath) {
        const urlParams = new URLSearchParams(location.search);
        const currentTab = urlParams.get('tab');
        return currentTab === tabParam;
      }
      return false;
    }
    
    // 特殊处理管理员页面的工具管理路径
    if (path === '/admin' && location.pathname === '/admin') {
      const urlParams = new URLSearchParams(location.search);
      const currentTab = urlParams.get('tab');
      // 只有当没有tab参数或者tab参数为tools时，工具管理才是激活状态
      return !currentTab || currentTab === 'tools';
    }
    
    return location.pathname.startsWith(path);
  };

  // 根据当前页面选择导航项
  const currentNavItems = isAdminPage && isAdmin ? adminNavigationItems : navigationItems;
  
  // 过滤导航项
  const filteredNavItems = currentNavItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-auto md:h-screen bg-background overflow-visible md:overflow-hidden">
      {/* 移动端侧边栏 */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            
            {/* 移动端侧边栏 */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 z-50 h-full w-80 bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col shadow-xl lg:hidden pt-safe"
            >
              {/* 移动端顶部区域 */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                {/* Logo区域 */}
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => { navigate('/'); setIsMobileOpen(false); }}
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

                  {/* 我的收藏按钮 - 独占一行 */}
                  <div className={cn(
                    "flex",
                    isCollapsed ? "justify-center" : "w-full"
                  )}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 p-0"
                            onClick={handleFavorites}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
                          sideOffset={5}
                        >
                          <p>我的收藏</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleFavorites}
                      >
                        <Heart className="w-4 h-4" />
                        <AnimatePresence mode="wait">
                          <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="ml-2"
                          >
                            我的收藏
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      {websiteInfo?.site_name || "AiQiji·工具箱"}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {websiteInfo?.site_description || "效率工具导航站"}
                    </span>
                  </div>
                </div>

                {/* 关闭按钮 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-lg"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>


              {/* 移动端导航区域 */}
              <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                <nav className="space-y-2 px-4">
                  {filteredNavItems.map((item, index) => {
                    const isActive = isPathActive(item.href);
                    const IconComponent = item.icon;

                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start h-10 px-3",
                          isActive && "bg-primary/90 text-primary-foreground shadow-sm"
                        )}
                        onClick={() => handleNavigation(item)}
                      >
                        <IconComponent className="w-4 h-4 mr-3" />
                        <span className="truncate">{item.label}</span>
                      </Button>
                    );
                  })}
                </nav>
              </div>

              {/* 移动端底部区域 */}
              <div className="border-t border-border/50 p-4 space-y-4">
                {/* 管理后台按钮 */}
                {isAuthenticated && isAdmin && !isAdminPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleNavigation(adminButtonItem)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    管理后台
                  </Button>
                )}

                {/* 用户区域 */}
                {isAuthenticated ? (
                  <div className="space-y-2">
                    {currentUser && (
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                        <SmartAvatar
                          user={{
                            avatar_url: currentUser.avatar_url,
                            email: currentUser.email,
                            username: currentUser.username,
                            display_name: currentUser.displayName
                          }}
                          size={32}
                          className="w-8 h-8"
                          fallbackClassName="text-sm font-medium"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {currentUser.displayName}
                          </div>
                          {currentUser.isAdmin && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Shield className="w-3 h-3" />
                              <span>管理员</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 个人中心按钮 - 独占一行 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleUserCenter}
                    >
                      <User className="w-4 h-4 mr-2" />
                      个人中心
                    </Button>

                    {/* 我的收藏按钮 - 独占一行 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleFavorites}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      我的收藏
                    </Button>
                    
                    {/* 退出按钮 - 独占一行 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => { setShowLoginModal(true); setIsMobileOpen(false); }}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    登录 / 注册
                  </Button>
                )}

                {/* 操作按钮区域 - 移动端也改为独行显示 */}
                <div className="space-y-2">
                  {/* 意见反馈按钮 */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/feedback');
                      setIsMobileOpen(false);
                    }}
                  >
                    <MailCheck className="w-4 h-4 mr-2" />
                    意见反馈
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 侧边栏 */}
      <motion.aside
        initial={false}
        animate={{ 
          x: 0,
          width: isCollapsed ? 80 : 280 
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'relative z-50 h-full bg-card/50 backdrop-blur-xl border-r border-border/50',
          'flex flex-col shadow-lg lg:shadow-none',
          isCollapsed ? 'w-20' : 'w-72',
          // 移动端隐藏，桌面端显示
          'hidden lg:flex'
        )}
      >
        {/* 顶部Logo区域 */}
        <div className="p-4 border-b border-border/50 flex items-center justify-center">
          <motion.div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="flex flex-col"
                >
                  <div className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    {websiteInfo?.site_name || "AiQiji·工具箱"}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {websiteInfo?.site_description || "效率工具导航站"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>


          {/* 导航区域 */}
          <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
            <nav className="space-y-2 px-4">
              {filteredNavItems.map((item, index) => {
                const isActive = isPathActive(item.href);
                const IconComponent = item.icon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                              "w-full h-10 px-0 justify-center mb-2",
                              isActive && "bg-primary/90 text-primary-foreground shadow-sm"
                            )}
                            onClick={() => handleNavigation(item)}
                          >
                            <IconComponent className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
                          sideOffset={5}
                        >
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start h-10 px-3",
                          isActive && "bg-primary/90 text-primary-foreground shadow-sm"
                        )}
                        onClick={() => handleNavigation(item)}
                      >
                        <IconComponent className="w-4 h-4 mr-3" />
                        <AnimatePresence mode="wait">
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </nav>
          </div>

          {/* 底部区域 */}
          <div className="border-t border-border/50 p-4 space-y-3">

            {/* 用户区域 */}
            <AnimatePresence mode="wait">
              {isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* 用户信息显示 */}
                  {currentUser && (
                    <div className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center" : "space-x-3"
                    )}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SmartAvatar
                              user={{
                                avatar_url: currentUser.avatar_url,
                                email: currentUser.email,
                                username: currentUser.username,
                                display_name: currentUser.displayName
                              }}
                              size={32}
                              className="w-8 h-8 flex-shrink-0"
                              fallbackClassName="text-sm font-medium"
                            />
                          </TooltipTrigger>
                          <TooltipContent 
                            side="right" 
                            className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-2"
                            sideOffset={5}
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{currentUser.displayName}</p>
                              {currentUser.isAdmin && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <Shield className="w-3 h-3" />
                                  <span>管理员</span>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <>
                          <SmartAvatar
                            user={{
                              avatar_url: currentUser.avatar_url,
                              email: currentUser.email,
                              username: currentUser.username,
                              display_name: currentUser.displayName
                            }}
                            size={32}
                            className="w-8 h-8 flex-shrink-0"
                            fallbackClassName="text-sm font-medium"
                          />
                          <AnimatePresence mode="wait">
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="flex-1 min-w-0"
                            >
                              <div className="text-sm font-medium truncate">
                                {currentUser.displayName}
                              </div>
                              {currentUser.isAdmin && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <Shield className="w-3 h-3" />
                                  <span>管理员</span>
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  )}

                  {/* 管理后台按钮 - 在用户信息下面 */}
                  {isAdmin && !isAdminPage && (
                    <div className={cn(
                      "flex",
                      isCollapsed ? "justify-center" : "w-full"
                    )}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-10 h-10 p-0"
                              onClick={() => handleNavigation(adminButtonItem)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="right" 
                            className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
                            sideOffset={5}
                          >
                            <p>管理后台</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleNavigation(adminButtonItem)}
                        >
                          <Settings className="w-4 h-4" />
                          <AnimatePresence mode="wait">
                            <motion.span
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -5 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="ml-2"
                            >
                              管理后台
                            </motion.span>
                          </AnimatePresence>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* 个人中心按钮 - 独占一行 */}
                  <div className={cn(
                    "flex",
                    isCollapsed ? "justify-center" : "w-full"
                  )}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 p-0"
                            onClick={handleUserCenter}
                          >
                            <User className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
                          sideOffset={5}
                        >
                          <p>个人中心</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleUserCenter}
                      >
                        <User className="w-4 h-4" />
                        <AnimatePresence mode="wait">
                          <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="ml-2"
                          >
                            个人中心
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    )}
                  </div>

                  {/* 退出登录按钮 - 独占一行 */}
                  <div className={cn(
                    "flex",
                    isCollapsed ? "justify-center" : "w-full"
                  )}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                            onClick={handleLogout}
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
                          sideOffset={5}
                        >
                          <p>退出登录</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        <AnimatePresence mode="wait">
                          <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="ml-2"
                          >
                            退出
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* 登录/注册按钮 - 独占一行并加边框 */}
                  <div className={cn(
                    "flex",
                    isCollapsed ? "justify-center" : "w-full"
                  )}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 p-0"
                          onClick={() => setShowLoginModal(true)}
                        >
                            <LogIn className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
                          sideOffset={5}
                        >
                          <p>登录 / 注册</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setShowLoginModal(true)}
                      >
                        <LogIn className="w-4 h-4" />
                        <AnimatePresence mode="wait">
                          <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="ml-2"
                          >
                            登录 / 注册
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 操作按钮区域 - 每个按钮独占一行 */}
            <div className="space-y-3">
              {/* 意见反馈按钮 */}
              <div className={cn(
                "flex",
                isCollapsed ? "justify-center" : "w-full"
              )}>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 p-0"
                        onClick={() => navigate('/feedback')}
                      >
                        <MailCheck className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
                      sideOffset={5}
                    >
                      <p>意见反馈</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate('/feedback')}
                  >
                    <MailCheck className="w-4 h-4" />
                    <AnimatePresence mode="wait">
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="ml-2"
                      >
                        意见反馈
                      </motion.span>
                    </AnimatePresence>
                  </Button>
                )}
              </div>

            </div>

          </div>
          
          {/* 侧边栏折叠/展开按钮 - 融入侧边栏设计 */}
          <motion.div
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4, type: "spring", stiffness: 300 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={cn(
                    'relative w-6 h-12 group',
                    'bg-card/95 backdrop-blur-md hover:bg-card',
                    'border border-l-0 border-border/50 hover:border-primary/30',
                    'rounded-r-xl shadow-lg hover:shadow-xl',
                    'transition-all duration-300 ease-out',
                    'flex items-center justify-center',
                    'hover:bg-gradient-to-r hover:from-card hover:to-card/90',
                    'active:scale-95'
                  )}
                  whileHover={{ x: 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-primary/10 rounded-r-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* 图标 */}
                  <motion.div
                    animate={{ 
                      rotateY: isCollapsed ? 0 : 180,
                      x: isCollapsed ? 1 : -1
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <PanelLeftOpen className={cn(
                      "w-3.5 h-3.5 transition-colors duration-200",
                      "text-muted-foreground group-hover:text-primary"
                    )} />
                  </motion.div>
                  
                  {/* 左侧连接线 - 让按钮看起来是侧边栏的一部分 */}
                  <div className={cn(
                    "absolute left-0 top-2 bottom-2 w-px",
                    "bg-gradient-to-b from-transparent via-border/30 to-transparent"
                  )} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
                sideOffset={8}
              >
                <p>{isCollapsed ? "展开侧边栏" : "收起侧边栏"}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
      </motion.aside>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden md:overflow-hidden overflow-visible">
        {/* 移动端顶部栏 */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] border-b border-border/50 bg-background/80 backdrop-blur-md min-h-[64px] sticky top-0 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <SEOImage
              {...SEOImagePresets.websiteLogo(
                websiteInfo?.site_icon || "/logo.png",
                websiteInfo?.site_name || "AiQiji工具箱"
              )}
              className="w-6 h-6 object-contain rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded"></div>';
              }}
            />
            <span className="font-semibold text-sm">
              {websiteInfo?.site_name || "AiQiji工具箱"}
            </span>
          </div>

          {/* 手机端主题切换按钮 */}
          <AnimatedThemeToggler />
        </div>

        {/* 主内容 */}
        <main id="app-main" className="flex-1 overflow-visible md:overflow-auto">
          {children}
        </main>
      </div>

      {/* 登录弹窗 */}
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
      </div>
    </TooltipProvider>
  );
}
