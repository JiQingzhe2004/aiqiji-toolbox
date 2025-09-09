import React from 'react';
import { ChevronDown, Sparkles, Dot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TypingAnimation } from '@/components/magicui/typing-animation';
import { Ripple } from '@/components/magicui/ripple';
import { AuroraText } from '@/components/magicui/aurora-text';

/**
 * 轻量级英雄横幅组件
 * 使用CSS动画替代framer-motion，减少打包体积
 */
export function HeroBannerLite() {
  // 滚动到工具区域
  const scrollToTools = () => {
    const toolsSection = document.getElementById('tools-section');
    if (toolsSection) {
      const headerHeight = 80; // Header高度
      const targetPosition = toolsSection.offsetTop - headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  // 统计数据
  const stats = [
    { label: '精选工具', value: '200+' },
    { label: '活跃用户', value: '10K+' },
    { label: '好评率', value: '99%' }
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-black/[0.02]" />
      
      {/* 涟漪效果 */}
      <Ripple
        mainCircleSize={210}
        mainCircleOpacity={0.24}
        numCircles={8}
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white_50%,transparent_80%)]"
      />

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
          {/* Logo图标 */}
          <div className="relative inline-block animate-logo-float">
            <img 
              src="/logo.png" 
              alt="AiQiji工具箱"
              className="w-20 h-20 mx-auto object-contain drop-shadow-lg"
              onError={(e) => {
                // 如果图片加载失败，显示默认图标
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl shadow-xl animate-logo-float"></div>';
              }}
            />
            {/* 发光效果 */}
            <div className={cn(
              "absolute inset-0 rounded-2xl opacity-20 blur-xl -z-10",
              "dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-700",
              "bg-gradient-to-br from-orange-300 to-yellow-400"
            )} />
          </div>

          {/* 主标题 - Aurora文字效果 */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter animate-fade-in-up animate-delay-200">
            Ai
            <span className="inline-block mx-0.5 animate-pulse">
              <Dot size={48} className="md:size-16 text-primary inline" />
            </span>
            <AuroraText>Qiji工具箱</AuroraText>
          </h1>

          {/* 副标题 - 带文字动画效果 */}
          <div className="space-y-4 animate-fade-in-up animate-delay-400">
            <TypingAnimation
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              duration={50}
            >
              为开发者、设计师和效率工具爱好者精心收集的工具导航站点
            </TypingAnimation>
            <p className={cn(
              "text-sm md:text-base max-w-xl mx-auto",
              "dark:text-slate-400 text-gray-500"
            )}>
              让工作更高效，让创作更便捷 ✨
            </p>
          </div>

          {/* 统计信息 */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 animate-fade-in-up animate-delay-600">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className={cn(
                  "text-2xl md:text-3xl font-bold bg-clip-text text-transparent",
                  "dark:bg-gradient-to-r dark:from-slate-200 dark:to-slate-400",
                  "bg-gradient-to-r from-gray-700 to-gray-900"
                )}>
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
        </div>
      </div>

      {/* 滚动提示 */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center">
        <button
          className="group cursor-pointer animate-fade-in-up animate-delay-800"
          onClick={scrollToTools}
        >
          <div className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-foreground transition-colors duration-300">
            <span className="text-sm font-medium">
              探索工具
            </span>
            <div className="animate-bounce">
              <ChevronDown className={cn(
                "w-6 h-6 transition-all duration-300 group-hover:scale-110",
                "dark:text-slate-400 text-gray-500 group-hover:text-primary"
              )} />
            </div>
          </div>
        </button>
      </div>

    </section>
  );
}
