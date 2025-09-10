import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SidebarCategoryTabs } from '@/components/SidebarCategoryTabs';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ToolGrid } from '@/components/ToolGrid';
import { EmptyState } from '@/components/EmptyState';
import { ThanksSection } from '@/components/ThanksSection';
import { useTools } from '@/hooks/useTools';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * 主页组件属性接口
 */
interface HomePageProps {
  searchQuery?: string;
}

/**
 * 主页组件
 * 包含搜索、分类、工具展示等核心功能
 */
const HomePage = memo(function HomePage({ searchQuery: globalSearchQuery = '' }: HomePageProps) {
  const {
    filteredTools,
    categories,
    activeCategory,
    isLoading,
    error,
    setActiveCategory,
  } = useTools(globalSearchQuery);

  // 使用全局搜索查询，如果存在的话
  const effectiveSearchQuery = globalSearchQuery;

  return (
    <div className="relative">
      {/* 首页全屏壁纸横幅 */}
      <HeroBanner />

      {/* 侧边栏分类 - 桌面端滚动显示 */}
      {!isLoading && (
        <SidebarCategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onChange={(category: string) => setActiveCategory(category as any)}
        />
      )}

      {/* 工具区域 */}
      <motion.div
        id="tools-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-background dark:bg-black min-h-screen pt-8 md:pt-12 pb-8 md:pb-12"
      >
        <div className="container mx-auto px-4 max-w-7xl">
          {/* 平板端分类标签 - 在md到xl之间显示 */}
          {!isLoading && (
            <div className="hidden md:block xl:hidden sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-muted-foreground/10 mb-8 -mx-4 px-4 py-4">
              <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                onChange={(category: string) => setActiveCategory(category as any)}
                className="flex"
              />
            </div>
          )}

          {/* 工具网格 */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="min-h-[400px] w-full"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                  <p className="text-muted-foreground">正在加载工具数据...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center"
                >
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <h2 className="text-xl font-semibold">加载失败</h2>
                  <p className="text-muted-foreground max-w-md">
                    无法加载工具数据：{error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors"
                  >
                    重新加载
                  </button>
                </motion.div>
              ) : (
                <ToolGrid
                  key={`${activeCategory}-${effectiveSearchQuery}`}
                  tools={filteredTools}
                  searchQuery={effectiveSearchQuery}
                />
              )}
            </AnimatePresence>
          </motion.section>

          {/* 统计信息 */}
          {!isLoading && !error && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center py-8 md:py-12 mt-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gradient">
                    {filteredTools.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    当前显示工具
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gradient">
                    {categories.length - 1}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    工具分类
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gradient">
                    约80%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    免费
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* 感谢支持部分 */}
          {!isLoading && !error && <ThanksSection />}
        </div>
      </motion.div>

      {/* 底部固定分类导航 - 移动端显示 */}
      {!isLoading && (
        <BottomNavigation
          categories={categories}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
          className="md:hidden"
        />
      )}
    </div>
  );
});

export default HomePage;
