import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedThemeToggler } from './magicui/animated-theme-toggler';

/**
 * 动画主题切换器演示组件
 * 展示不同尺寸和变体的主题切换器
 */
export function AnimatedThemeTogglerDemo() {
  return (
    <div className="space-y-8 p-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gradient">
          动画主题切换器演示
        </h2>
        <p className="text-muted-foreground">
          Magic UI风格的流畅主题切换体验
        </p>
      </div>

      {/* 基本用法 */}
      <motion.div
        className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-card border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="text-lg font-semibold">基本用法</h3>
        <AnimatedThemeToggler />
        <p className="text-sm text-muted-foreground text-center">
          点击切换主题，享受流畅的过渡动画
        </p>
      </motion.div>

      {/* 不同尺寸 */}
      <motion.div
        className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-card border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold">不同尺寸</h3>
        <div className="flex items-center space-x-4">
          <AnimatedThemeToggler className="scale-75" />
          <AnimatedThemeToggler />
          <AnimatedThemeToggler className="scale-125" />
          <AnimatedThemeToggler className="scale-150" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          通过className调整尺寸
        </p>
      </motion.div>

      {/* 特性说明 */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
          <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">
            🌞 浅色主题
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 温暖的橙黄色渐变</li>
            <li>• 太阳图标动画</li>
            <li>• 发光粒子效果</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-500/10 to-slate-700/10 border border-slate-500/20">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
            🌙 深色主题
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 优雅的石板色渐变</li>
            <li>• 月亮图标动画</li>
            <li>• 微妙的高光效果</li>
          </ul>
        </div>
      </motion.div>

      {/* 技术特性 */}
      <motion.div
        className="p-6 rounded-2xl bg-card border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4">✨ 技术特性</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-violet-600 dark:text-violet-400 mb-2">
              流畅动画
            </h4>
            <p className="text-muted-foreground">
              基于Framer Motion的弹簧动画系统
            </p>
          </div>
          <div>
            <h4 className="font-medium text-cyan-600 dark:text-cyan-400 mb-2">
              View Transitions
            </h4>
            <p className="text-muted-foreground">
              支持现代浏览器的原生过渡API
            </p>
          </div>
          <div>
            <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">
              可访问性
            </h4>
            <p className="text-muted-foreground">
              完整的键盘导航和屏幕阅读器支持
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
