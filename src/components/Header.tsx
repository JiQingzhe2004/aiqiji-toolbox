import React from 'react';
import { motion } from 'framer-motion';
import { Github, Sparkles, Search } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { AnimatedThemeToggler } from './magicui/animated-theme-toggler';
import { Button } from '@/components/ui/button';

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
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-muted-foreground/10 bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo区域 */}
        <motion.div
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
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
          
          {/* 站点名称 */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              AiQiji工具箱
            </h1>
            <span className="text-xs text-muted-foreground hidden sm:block">
              效率工具导航站
            </span>
          </div>
        </motion.div>

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
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                // 反馈功能 - 发送邮件到开发者邮箱
                window.open('mailto:jqz1215@qq.com?subject=AiQiji工具箱反馈&body=感谢您的反馈！请在此处写下您的建议或问题：', '_blank');
              }}
            >
              反馈
            </Button>
          </div>
        </div>
      </div>
      
      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </motion.header>
  );
}
