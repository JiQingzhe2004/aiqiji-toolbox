import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextAnimate } from '@/components/magicui/text-animate';
import { TypingAnimation } from '@/components/magicui/typing-animation';
import { Ripple } from '@/components/magicui/ripple';
import { FlickeringGrid } from '@/components/magicui/flickering-grid';
import { AuroraText } from '@/components/magicui/aurora-text';

/**
 * 首页全屏壁纸横幅组件
 * 作为首页初始视图，包含视差效果和滚动提示
 */
export function HeroBanner() {
  // 滚动到工具区域
  const scrollToTools = () => {
    const toolsSection = document.getElementById('tools-section');
    if (toolsSection) {
      toolsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Magic UI 波纹背景 */}
      <Ripple
        mainCircleSize={200}
        mainCircleOpacity={0.3}
        numCircles={8}
        className={cn(
          // 暗色主题：更明显的石板色波纹
          "dark:[&>div]:bg-slate-300/20 dark:[&>div]:border-slate-200/40",
          // 浅色主题：更明显的橙色波纹
          "[&>div]:bg-orange-300/25 [&>div]:border-orange-200/50"
        )}
      />

      {/* Magic UI 闪烁网格背景 - 深色主题 */}
      <FlickeringGrid
        className="absolute inset-0 z-0 dark:block hidden"
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        color="rgb(148, 163, 184)" // slate-400
        maxOpacity={0.15}
      />

      {/* Magic UI 闪烁网格背景 - 浅色主题 */}
      <FlickeringGrid
        className="absolute inset-0 z-0 dark:hidden block"
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        color="rgb(251, 146, 60)" // orange-400
        maxOpacity={0.12}
      />

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6 max-w-4xl mx-auto"
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
            Ai <AuroraText>Qiji工具箱</AuroraText>
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
            <TextAnimate 
              animation="blurInUp" 
              by="character" 
              duration={5}
              className="text-lg opacity-80 inline-block mt-2"
            >
              让工作更高效，让创作更便捷
            </TextAnimate>
          </motion.div>

          {/* 统计信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 mt-8"
          >
            {[
              { label: '精选工具', value: '100+' },
              { label: '工具分类', value: '5+' },
              { label: '持续更新', value: '每周' }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <motion.div
                  className={cn(
                    "text-2xl md:text-3xl font-bold bg-clip-text text-transparent",
                    // 暗色主题：石板色渐变
                    "dark:bg-gradient-to-r dark:from-slate-300 dark:to-slate-400",
                    // 浅色主题：橙黄色渐变
                    "bg-gradient-to-r from-orange-500 to-yellow-500"
                  )}
                  animate={{ 
                    scale: [1, 1.1, 1] 
                  }}
                  transition={{ 
                    duration: 2,
                    delay: index * 0.2,
                    repeat: Infinity,
                    repeatType: 'reverse'
                  }}
                >
                  {stat.value}
                </motion.div>
                <div className={cn(
                  "text-sm mt-1",
                  "dark:text-slate-400 text-gray-500"
                )}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center">
        <motion.button
          className="group cursor-pointer"
          onClick={scrollToTools}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          whileHover={{ y: -2 }}
          aria-label="滚动到工具区域"
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
