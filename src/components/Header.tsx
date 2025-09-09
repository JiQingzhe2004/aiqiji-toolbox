import React, { useState } from 'react';
// 移除 framer-motion，使用 CSS 动画替代
import { Github, Sparkles, Search, LogIn, Settings, MailCheck } from '@/lib/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { LoginModal } from './LoginModal';
import { useAuth } from '@/contexts/AuthContext';

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
  const navigate = useNavigate();
  const location = useLocation();

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
  return (
    <>
    <header
      className="sticky top-0 z-50 w-full border-b border-muted-foreground/10 bg-background/80 backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo区域 */}
        <div
          className="flex items-center space-x-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
          onClick={handleTitleClick}
        >
          {/* Logo图标 */}
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="AiQiji工具箱"
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              AiQiji·工具箱
            </h1>
            <span className="text-xs text-muted-foreground">
              效率工具导航站
            </span>
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center space-x-2">
          {/* 搜索栏 - 移至右侧 */}
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
          <ThemeToggle />
          
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
        </div>
      </div>
      
      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </header>

    {/* 登录弹窗 */}
    <LoginModal 
      open={showLoginModal} 
      onOpenChange={setShowLoginModal} 
    />
  </>
  );
}
