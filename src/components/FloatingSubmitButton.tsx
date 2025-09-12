import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CirclePlus, Send, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * 悬浮多功能按钮组件
 * 固定在页面右下角，展开后提供多个功能按钮
 */
export function FloatingSubmitButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // 控制透明度
  const navigate = useNavigate();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSubmitTool = () => {
    navigate('/submit-tool');
    setIsExpanded(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // 处理鼠标进入
  const handleMouseEnter = () => {
    setIsVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3000); // 3秒后恢复半透明
  };

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="fixed bottom-24 sm:bottom-6 right-6 z-50">
        {/* 功能按钮组 */}
        <AnimatePresence>
          {isExpanded && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-center">
              {/* 工具分享按钮 */}
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSubmitTool}
                      size="sm"
                      className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white p-0"
                      aria-label="工具分享"
                    >
                      <Send size={40} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-background border shadow-md">
                    <p>工具分享</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              {/* 回到顶部按钮 */}
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={scrollToTop}
                      size="sm"
                      className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-green-500 hover:bg-green-600 text-white p-0"
                      aria-label="回到顶部"
                    >
                      <ArrowUp size={28} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-background border shadow-md">
                    <p>回到顶部</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 主按钮 */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          animate={{
            opacity: isVisible ? 1 : 0.5,
            x: isVisible ? 0 : 24 // 向右移动24px，显示一半
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          <Button
            onClick={toggleExpanded}
            size="sm"
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 aspect-square relative overflow-hidden p-0"
            aria-label={isExpanded ? "关闭菜单" : "展开菜单"}
          >
            <motion.div
              animate={{ 
                rotate: isExpanded ? 405 : 0 
              }}
              transition={{ 
                duration: 0.4, 
                ease: "easeInOut" 
              }}
            >
              <CirclePlus size={40} />
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
