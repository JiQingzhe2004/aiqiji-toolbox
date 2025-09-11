import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Sparkles, Search, LogIn, Settings, MailCheck, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { AnimatedThemeToggler } from './magicui/animated-theme-toggler';
import { Button } from '@/components/ui/button';
import { LoginModal } from './LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi, type WebsiteInfo } from '@/services/settingsApi';

/**
 * Header组件属性接口
 */
interface HeaderProps {
  onSearchChange?: (query: string) => void;
  searchValue?: string;
}

/**
 * 页面头部组件
 * 包含Logo、搜索栏、主题切换、外部链接等功能
 * 符合提示词要求的设计规范
 */
export function Header({ onSearchChange, searchValue = '' }: HeaderProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [hideBorder, setHideBorder] = useState(false);
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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
          site_description: '专业的AI工具导航平台，发现最新最好用的AI工具',
          icp_number: '',
          show_icp: false
        });
      }
    };

    fetchWebsiteInfo();
  }, []);

  // 处理标题点击事件
  const handleTitleClick = () => {
    if (location.pathname === '/') {
      // 如果已经在首页，滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 如果不在首页，导航到首页
      navigate('/');
    }
  };

  // 移动端搜索展开时自动聚焦
  useEffect(() => {
    if (showMobileSearch) {
      // 延迟聚焦，确保动画完成
      setTimeout(() => {
        const searchInput = document.querySelector('.md\\:hidden .relative input');
        if (searchInput) {
          (searchInput as HTMLInputElement).focus();
        }
      }, 200);
    }
  }, [showMobileSearch]);

  // 监听滚动，检测分类栏是否与顶部栏接触
  useEffect(() => {
    const handleScroll = () => {
      // 只在平板端（md到xl之间）检测
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1280;
      if (!isTablet || location.pathname !== '/') {
        setHideBorder(false);
        return;
      }

      // 检测滚动位置
      // 当滚动超过工具区域开始位置时，分类栏就会贴到顶部栏下方
      const toolsSection = document.getElementById('tools-section');
      if (toolsSection) {
        const rect = toolsSection.getBoundingClientRect();
        // 当工具区域顶部到达顶部栏底部位置时，分类栏就贴住了顶部栏
        const shouldHideBorder = rect.top <= 64; // 64px是顶部栏的高度
        setHideBorder(shouldHideBorder);
      }
    };

    // 初始检查
    handleScroll();

    // 添加滚动和窗口大小变化监听
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [location.pathname]);

  // ESC键关闭移动端搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMobileSearch) {
        setShowMobileSearch(false);
      }
    };

    if (showMobileSearch) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showMobileSearch]);

  // 点击外部区域关闭移动端搜索
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMobileSearch) {
        const target = e.target as HTMLElement;
        // 检查点击是否在搜索区域外部
        const searchContainer = document.querySelector('.mobile-search-container');
        if (searchContainer && !searchContainer.contains(target)) {
          setShowMobileSearch(false);
        }
      }
    };

    if (showMobileSearch) {
      // 延迟添加监听器，避免立即关闭
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMobileSearch]);

  return (
    <>
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md relative"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* 动态边框 */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-muted-foreground/10"
        initial={{ opacity: 1 }}
        animate={{ opacity: hideBorder ? 0 : 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo区域 - 在搜索模式下有动画隐藏 */}
        <motion.div
          className="flex items-center space-x-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTitleClick}
          initial={false}
          animate={{ 
            opacity: showMobileSearch ? 0 : 1,
            x: showMobileSearch ? -20 : 0,
            pointerEvents: showMobileSearch ? 'none' : 'auto'
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {/* Logo图标 */}
          <div className="relative">
            <img 
              src={websiteInfo?.site_icon || "/logo.png"} 
              alt={websiteInfo?.site_name || "AiQiji工具箱"}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // 如果图片加载失败，显示默认图标
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl"></div>';
              }}
            />
          </div>
          
          {/* 站点名称 - 移动端隐藏 */}
          <div className="flex-col hidden sm:flex">
            <div className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {websiteInfo?.site_name || "AiQiji·工具箱"}
            </div>
            <span className="text-xs text-muted-foreground">
              {websiteInfo?.site_description || "效率工具导航站"}
            </span>
          </div>
        </motion.div>

        {/* 移动端搜索展开模式 */}
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'calc(100% - 2rem)' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mobile-search-container absolute left-4 flex items-center md:hidden"
          >
            <SearchBar
              value={searchValue}
              onChange={onSearchChange || (() => {})}
              className="flex-1"
              placeholder="搜索工具..."
            />
          </motion.div>
        )}

        {/* 右侧操作区 - 在搜索模式下有动画隐藏 */}
        <motion.div 
          className="flex items-center space-x-2"
          initial={false}
          animate={{ 
            opacity: showMobileSearch ? 0 : 1,
            x: showMobileSearch ? 20 : 0,
            pointerEvents: showMobileSearch ? 'none' : 'auto'
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {/* 桌面端搜索栏 */}
          <SearchBar
            value={searchValue}
            onChange={onSearchChange || (() => {})}
            className="w-64 hidden md:block"
          />
          
          {/* 移动端搜索按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-2xl hover:bg-muted"
            onClick={() => setShowMobileSearch(true)}
            aria-label="搜索"
          >
            <Search className="w-5 h-5" />
          </Button>
          
          {/* 移动端登录/管理按钮 */}
          {isAuthenticated && isAdmin ? (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-2xl hover:bg-muted"
              onClick={() => {
                window.location.href = '/admin';
              }}
              aria-label="管理"
            >
              <Settings className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-2xl hover:bg-muted"
              onClick={() => {
                setShowLoginModal(true);
              }}
              aria-label="登录"
            >
              <LogIn className="w-5 h-5" />
            </Button>
          )}

          {/* 动画主题切换器 */}
          <AnimatedThemeToggler />
          
          {/* Github链接 */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-2xl hover:bg-muted"
          >
            <a
              href="https://github.com/JiQingzhe2004"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="查看GitHub仓库 - JiQingzhe2004"
              title="GitHub - JiQingzhe2004"
            >
              <Github className="w-5 h-5" />
            </a>
          </Button>
          
          {/* 更多操作按钮（可扩展） */}
          <div className="hidden md:flex items-center space-x-2">
            {/* 根据登录状态显示不同按钮 */}
            {isAuthenticated && isAdmin ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  // 在当前标签页跳转到管理页面，不新开标签页
                  window.location.href = '/admin';
                }}
              >
                <Settings className="w-3 h-3 mr-1" />
                管理
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  // 显示登录弹窗而不是跳转页面
                  setShowLoginModal(true);
                }}
              >
                <LogIn className="w-3 h-3 mr-1" />
                登录
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                // 反馈功能 - 发送邮件到开发者邮箱
                window.open('mailto:jqz1215@qq.com?subject=AiQiji工具箱反馈&body=感谢您的反馈！请在此处写下您的建议或问题：', '_blank');
              }}
            >
              <MailCheck className="w-3 h-3 mr-1" />
              反馈
            </Button>
          </div>
        </motion.div>
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