import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CirclePlus, Send, ArrowUp, ArrowLeft, Copy, QrCode, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Confetti, type ConfettiRef } from '@/components/magicui/confetti';
import toast from 'react-hot-toast';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // 控制透明度
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);
  
  // 检测是否在工具详情页面
  const isToolDetailPage = location.pathname.startsWith('/tool/');

  const handleSubmitTool = () => {
    navigate('/submit-tool');
    setIsExpanded(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsExpanded(false);
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
    setIsExpanded(false);
  };

  const handleCopyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onCopyLink) return;
    
    try {
      await onCopyLink();
      
      // 使用 setTimeout 避免 flushSync 错误
      setTimeout(() => {
        // 触发彩带效果
        confettiRef.current?.fire({
          particleCount: 30,
          spread: 60,
          origin: { 
            x: (e.clientX) / window.innerWidth, 
            y: (e.clientY) / window.innerHeight 
          },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42'],
          shapes: ['circle', 'square'],
          startVelocity: 25,
          decay: 0.95,
          ticks: 150
        });
        
        toast.success('链接已复制到剪贴板！', {
          duration: 2000,
          position: 'bottom-center',
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
          icon: React.createElement(CheckCircle, { 
            className: "w-5 h-5 text-green-500" 
          }),
        });
      }, 0);
    } catch (err) {
      console.error('复制失败:', err instanceof Error ? err.message : String(err));
      setTimeout(() => {
        toast.error('复制失败');
      }, 0);
    }
    setIsExpanded(false);
  };

  const handleShowQRCode = () => {
    if (onShowQRCode) {
      onShowQRCode();
    }
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
      // 如果按钮是展开状态，先收回展开的按钮
      if (isExpanded) {
        // 使用 requestAnimationFrame 避免 flushSync 错误
        requestAnimationFrame(() => {
          setIsExpanded(false);
          // 等待按钮收回动画完成后再收回主按钮
          setTimeout(() => {
            requestAnimationFrame(() => {
              setIsVisible(false);
            });
          }, 300); // 等待 AnimatePresence 的 exit 动画完成
        });
      } else {
        // 如果没有展开，直接收回主按钮
        requestAnimationFrame(() => {
          setIsVisible(false);
        });
      }
    }, 3000); // 3秒后开始收回逻辑
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
    <>
      <Confetti ref={confettiRef} />
      <TooltipProvider>
        <div className={`fixed right-6 z-50 ${isToolDetailPage ? 'bottom-6' : 'bottom-24 sm:bottom-6'}`}>
          {/* 功能按钮组 */}
          <AnimatePresence>
            {isExpanded && (
              <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-center">
                {isToolDetailPage && onGoBack ? (
                  // 工具详情页面的按钮
                  <>
                    {/* 返回按钮 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: 20 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleGoBack}
                            size="sm"
                            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gray-500 hover:bg-gray-600 text-white p-0"
                            aria-label="返回上页"
                          >
                            <ArrowLeft size={20} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-background border shadow-md">
                          <p>返回上页</p>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>

                    {/* 复制链接按钮 */}
                    {onCopyLink && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0, y: 20 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleCopyClick}
                              size="sm"
                              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white p-0"
                              aria-label="复制链接"
                            >
                              <Copy size={20} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-background border shadow-md">
                            <p>复制链接</p>
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    )}

                    {/* 二维码按钮 */}
                    {onShowQRCode && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0, y: 20 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleShowQRCode}
                              size="sm"
                              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-purple-500 hover:bg-purple-600 text-white p-0"
                              aria-label="分享二维码"
                            >
                              <QrCode size={20} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-background border shadow-md">
                            <p>分享二维码</p>
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    )}

                    {/* 回到顶部按钮 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: 20 }}
                      transition={{ duration: 0.3, delay: 0.25 }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={scrollToTop}
                            size="sm"
                            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-green-500 hover:bg-green-600 text-white p-0"
                            aria-label="回到顶部"
                          >
                            <ArrowUp size={20} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-background border shadow-md">
                          <p>回到顶部</p>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  </>
                ) : (
                  // 其他页面的按钮
                  <>
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
                            <Send size={20} />
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
                            <ArrowUp size={20} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-background border shadow-md">
                          <p>回到顶部</p>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  </>
                )}
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
              <CirclePlus size={24} />
            </motion.div>
          </Button>
        </motion.div>
        </div>
      </TooltipProvider>
    </>
  );
}
