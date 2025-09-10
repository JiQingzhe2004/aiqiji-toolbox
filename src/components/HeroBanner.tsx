import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles, Dot } from 'lucide-react';
import { isMobile, isTablet, isDesktop, osName, browserName, deviceType } from 'react-device-detect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { findIconDefinition, IconLookup } from '@fortawesome/fontawesome-svg-core';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TypingAnimation } from '@/components/magicui/typing-animation';
import { AuroraText } from '@/components/magicui/aurora-text';

/**
 * 根据操作系统返回对应的品牌图标
 */
const getDeviceIcon = () => {
  const os = osName.toLowerCase();
  
  let iconLookup: IconLookup;
  
  if (os.includes('ios') || os.includes('mac')) {
    iconLookup = { prefix: 'fab', iconName: 'apple' };
  } else if (os.includes('android')) {
    iconLookup = { prefix: 'fab', iconName: 'android' };
  } else if (os.includes('windows')) {
    iconLookup = { prefix: 'fab', iconName: 'microsoft' };
  } else if (os.includes('linux')) {
    iconLookup = { prefix: 'fab', iconName: 'linux' };
  } else {
    // 默认根据设备类型返回
    iconLookup = isMobile 
      ? { prefix: 'fab', iconName: 'android' }
      : { prefix: 'fab', iconName: 'microsoft' };
  }
  
  return findIconDefinition(iconLookup);
};

/**
 * 根据浏览器返回对应的品牌图标
 */
const getBrowserIcon = () => {
  const browser = browserName.toLowerCase();
  
  let iconLookup: IconLookup;
  
  if (browser.includes('firefox')) {
    iconLookup = { prefix: 'fab', iconName: 'firefox' };
  } else if (browser.includes('chrome')) {
    iconLookup = { prefix: 'fab', iconName: 'chrome' };
  } else if (browser.includes('safari')) {
    iconLookup = { prefix: 'fab', iconName: 'safari' };
  } else if (browser.includes('edge')) {
    iconLookup = { prefix: 'fab', iconName: 'edge' };
  } else {
    // 其他浏览器显示IE图标
    iconLookup = { prefix: 'fab', iconName: 'internet-explorer' };
  }
  
  return findIconDefinition(iconLookup);
};

/**
 * 获取中文设备类型
 */
const getDeviceTypeChinese = () => {
  if (isMobile) {
    return '移动设备';
  } else if (isTablet) {
    return '平板设备';
  } else if (isDesktop) {
    return '桌面设备';
  } else {
    // 根据deviceType英文值转换
    const type = deviceType?.toLowerCase();
    switch (type) {
      case 'mobile':
        return '移动设备';
      case 'tablet':
        return '平板设备';
      case 'desktop':
      case 'browser':
        return '桌面设备';
      default:
        return '未知设备';
    }
  }
};

/**
 * 根据设备类型返回对应的设备类型图标
 */
const getDeviceTypeIcon = () => {
  if (isMobile) {
    // 移动设备图标 - 使用solid样式
    const iconLookup: IconLookup = { prefix: 'fas', iconName: 'mobile-button' };
    return findIconDefinition(iconLookup);
  } else {
    // 桌面设备图标 - 使用solid样式
    const iconLookup: IconLookup = { prefix: 'fas', iconName: 'desktop' };
    return findIconDefinition(iconLookup);
  }
};

/**
 * 首页全屏壁纸横幅组件
 * 作为首页初始视图，包含视差效果和滚动提示
 */
export function HeroBanner() {
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const deviceInfoRef = useRef<HTMLDivElement>(null);
  
  // 点击任意位置关闭弹出框
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // 如果点击的是设备图标本身，不关闭弹出框（让onClick处理）
      const target = event.target as Element;
      const isDeviceIcon = deviceInfoRef.current?.querySelector('.cursor-pointer')?.contains(target);
      
      if (!isDeviceIcon && showDeviceInfo) {
        setShowDeviceInfo(false);
      }
    }

    if (showDeviceInfo) {
      // 使用 setTimeout 确保当前的点击事件处理完成后再添加监听器
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClick);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClick);
      };
    }
  }, [showDeviceInfo]);
  
  // 滚动到工具区域
  const scrollToTools = () => {
    const toolsSection = document.getElementById('tools-section');
    
    if (toolsSection) {
      // 使用自定义偏移量，让工具区域标题有更好的显示位置
      const headerHeight = 50; // 增加偏移量，给工具区域留更多顶部空间
      const elementTop = toolsSection.offsetTop - headerHeight;
      
      window.scrollTo({
        top: Math.max(0, elementTop),
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative h-[calc(100vh-80px)] md:h-screen w-full overflow-hidden bg-white dark:bg-black">
      {/* 网格背景 */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      
      {/* 径向渐变遮罩 - 创建中心亮、周围暗的效果 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 py-8 md:py-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-4 md:space-y-6 max-w-4xl mx-auto"
        >
          {/* Logo图标 */}
          <motion.div
            className="relative inline-block"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <img 
              src="/logo.png" 
              alt="AiQiji工具箱"
              className="w-20 h-20 mx-auto object-contain drop-shadow-lg"
              onError={(e) => {
                // 如果图片加载失败，显示默认图标
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl shadow-xl"></div>';
              }}
            />
            {/* 发光效果 */}
            <div className={cn(
              "absolute inset-0 rounded-2xl opacity-20 blur-xl -z-10",
              // 暗色主题：石板色发光
              "dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-700",
              // 浅色主题：橙黄色发光
              "bg-gradient-to-br from-orange-500 to-yellow-500"
            )} />
          </motion.div>

          {/* 主标题 - Aurora文字效果 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter"
          >
            Ai
            <motion.span
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.1, 0.8]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mx-0.5"
            >
              <Dot size={48} className="md:size-16 text-primary inline" />
            </motion.span>
            <AuroraText>Qiji工具箱</AuroraText>
          </motion.h1>

          {/* 副标题 - 带文字动画效果 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={cn(
              "text-xl md:text-2xl leading-relaxed text-center",
              // 暗色主题
              "dark:text-slate-300",
              // 浅色主题
              "text-gray-600"
            )}
          >
            <TypingAnimation
              duration={80}
              delay={800}
              startOnView={true}
              component="div"
              size="xl"
              weight={500}
              className="block"
              loop={true}
              pauseDuration={3000}
              deleteDuration={40}
            >
              为开发者、设计师和效率工具爱好者精心收集的工具导航站点
            </TypingAnimation>
            <br />
            <div className="text-lg opacity-80 inline-block mt-2">
              让工作更高效，让创作更便捷
            </div>
          </motion.div>

          {/* 统计信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-4 md:mt-8 space-y-4 md:space-y-6"
          >
            {/* 第一行：主要统计信息 */}
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { label: '精选工具', value: '20+' },
                { label: '工具分类', value: '5+' },
                { label: '持续更新', value: '持续中' }
              ].map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div
                    className={cn(
                      "text-2xl md:text-3xl font-bold bg-clip-text text-transparent",
                      // 暗色主题：石板色渐变
                      "dark:bg-gradient-to-r dark:from-slate-300 dark:to-slate-400",
                      // 浅色主题：橙黄色渐变
                      "bg-gradient-to-r from-orange-500 to-yellow-500"
                    )}
                  >
                    {stat.value}
                  </div>
                  <div className={cn(
                    "text-sm mt-1",
                    "dark:text-slate-400 text-gray-500"
                  )}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* 第二行：设备信息 */}
            <div className="flex justify-center relative" ref={deviceInfoRef}>
              {isMobile ? (
                // 手机端：点击显示/隐藏信息
                <>
                  <div 
                    className="cursor-pointer hover:scale-110 transition-transform duration-200 flex items-center gap-3"
                    onClick={() => setShowDeviceInfo(!showDeviceInfo)}
                  >
                    {/* 设备类型图标 */}
                    <FontAwesomeIcon 
                      icon={getDeviceTypeIcon()} 
                      className={cn(
                        "w-8 h-8 md:w-10 md:h-10",
                        "dark:text-slate-300 text-orange-500"
                      )}
                    />
                    {/* 分隔符 */}
                    <span className={cn(
                      "text-lg md:text-xl font-medium",
                      "dark:text-slate-400 text-orange-400"
                    )}>
                      +
                    </span>
                    {/* 系统图标 */}
                    <FontAwesomeIcon 
                      icon={getDeviceIcon()} 
                      className={cn(
                        "w-8 h-8 md:w-10 md:h-10",
                        "dark:text-slate-300 text-orange-500"
                      )}
                    />
                    {/* 分隔符 */}
                    <span className={cn(
                      "text-lg md:text-xl font-medium",
                      "dark:text-slate-400 text-orange-400"
                    )}>
                      +
                    </span>
                    {/* 浏览器图标 */}
                    <FontAwesomeIcon 
                      icon={getBrowserIcon()} 
                      className={cn(
                        "w-8 h-8 md:w-10 md:h-10",
                        "dark:text-slate-300 text-orange-500"
                      )}
                    />
                  </div>
                  {/* 手机端信息显示 - 悬浮弹出框 */}
                  {showDeviceInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full mt-3 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-3 max-w-xs z-50 left-1/2 transform -translate-x-1/2"
                    >
                      <div className="space-y-1 text-sm">
                        <div className="font-medium text-center">设备与浏览器信息</div>
                        <div className="space-y-0.5 text-xs">
                          <div>操作系统: {osName}</div>
                          <div>浏览器: {browserName}</div>
                          <div>设备类型: {getDeviceTypeChinese()}</div>
                          <div>屏幕尺寸: {typeof window !== 'undefined' ? `${window.innerWidth} × ${window.innerHeight}` : '未知'}</div>
                        </div>
                      </div>
                      {/* 小三角形指示器 */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-popover border-l border-t border-border rotate-45"></div>
                    </motion.div>
                  )}
                </>
              ) : (
                // 桌面端：保持Tooltip
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-pointer hover:scale-110 transition-transform duration-200 flex items-center gap-3">
                        {/* 设备类型图标 */}
                        <FontAwesomeIcon 
                          icon={getDeviceTypeIcon()} 
                          className={cn(
                            "w-8 h-8 md:w-10 md:h-10",
                            "dark:text-slate-300 text-orange-500"
                          )}
                        />
                        {/* 分隔符 */}
                        <span className={cn(
                          "text-lg md:text-xl font-medium",
                          "dark:text-slate-400 text-orange-400"
                        )}>
                          +
                        </span>
                        {/* 系统图标 */}
                        <FontAwesomeIcon 
                          icon={getDeviceIcon()} 
                          className={cn(
                            "w-8 h-8 md:w-10 md:h-10",
                            "dark:text-slate-300 text-orange-500"
                          )}
                        />
                        {/* 分隔符 */}
                        <span className={cn(
                          "text-lg md:text-xl font-medium",
                          "dark:text-slate-400 text-orange-400"
                        )}>
                          +
                        </span>
                        {/* 浏览器图标 */}
                        <FontAwesomeIcon 
                          icon={getBrowserIcon()} 
                          className={cn(
                            "w-8 h-8 md:w-10 md:h-10",
                            "dark:text-slate-300 text-orange-500"
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="bottom" 
                      className="bg-popover text-popover-foreground border border-border shadow-md max-w-xs"
                    >
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">设备与浏览器信息</div>
                        <div className="space-y-0.5 text-xs">
                          <div>操作系统: {osName}</div>
                          <div>浏览器: {browserName}</div>
                          <div>设备类型: {getDeviceTypeChinese()}</div>
                          <div>屏幕尺寸: {typeof window !== 'undefined' ? `${window.innerWidth} × ${window.innerHeight}` : '未知'}</div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center z-30">
        <motion.button
          className="group cursor-pointer p-4 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          onClick={scrollToTools}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          whileHover={{ y: -2 }}
          aria-label="滚动到工具区域"
          style={{ zIndex: 1000 }}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <span className={cn(
              "text-sm font-medium text-center whitespace-nowrap",
              "dark:text-slate-400 text-gray-600",
              "dark:group-hover:text-slate-300 group-hover:text-orange-500 transition-colors duration-200"
            )}>
              探索工具
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className={cn(
                "p-2 rounded-full border transition-colors duration-200 flex items-center justify-center",
                // 暗色主题：石板色边框
                "dark:border-slate-600/30 dark:group-hover:border-slate-400/50",
                // 浅色主题：橙色边框
                "border-orange-300/30 group-hover:border-orange-500/50"
              )}
            >
              <ChevronDown className={cn(
                "w-5 h-5",
                "dark:text-slate-400 text-gray-600",
                "dark:group-hover:text-slate-300 group-hover:text-orange-500 transition-colors duration-200"
              )} />
            </motion.div>
          </div>
        </motion.button>
      </div>

    </section>
  );
}
