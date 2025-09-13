import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingSubmitButtonProps {
  // 工具详情页面特有的功能
  onGoBack?: () => void;
  onCopyLink?: () => Promise<void>;
  onShowQRCode?: () => void;
  toolName?: string;
}

/**
 * 悬浮多功能按钮组件
 * 固定在页面右下角，展开后提供多个功能按钮
 */
export function FloatingSubmitButton({
  onGoBack,
  onCopyLink,
  onShowQRCode,
  toolName
}: FloatingSubmitButtonProps = {}) {
  const scrollToTop = () => {
    try {
      // 标准window滚动
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 备用方案：直接设置滚动位置
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // 滚动main元素（如果存在且有滚动位置）
      const mainContent = document.querySelector('main');
      if (mainContent && mainContent.scrollTop > 0) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // 滚动所有可滚动元素
      const scrollableElements = document.querySelectorAll('[class*="overflow"], [style*="overflow"]');
      scrollableElements.forEach((el) => {
        if (el.scrollTop > 0) {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
      
      // 滚动侧边栏内容区域
      const sidebarContent = document.querySelector('[class*="flex-1"]');
      if (sidebarContent && sidebarContent.scrollTop > 0) {
        sidebarContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      // 静默处理错误，避免影响用户体验
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={scrollToTop}
                size="sm"
                className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground p-0"
                aria-label="回到顶部"
              >
                <ArrowUp size={20} />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent 
            side="left" 
            className="bg-popover text-popover-foreground border border-border shadow-md px-3 py-1.5 text-sm font-medium"
            sideOffset={5}
          >
            <p>回到顶部</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
