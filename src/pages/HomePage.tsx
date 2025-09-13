import React, { memo, useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroBanner } from '@/components/HeroBanner';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SidebarCategoryTabs } from '@/components/SidebarCategoryTabs';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ToolGrid } from '@/components/ToolGrid';
import { EmptyState } from '@/components/EmptyState';
import { ThanksSection } from '@/components/ThanksSection';
import { SearchBar } from '@/components/SearchBar';
import { useTools } from '@/hooks/useTools';
import { useSEO, SEOPresets } from '@/hooks/useSEO';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * 主页组件属性接口
 */
interface HomePageProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

/**
 * 主页组件
 * 包含搜索、分类、工具展示等核心功能
 */
const HomePage = memo(function HomePage({ searchQuery: globalSearchQuery = '', onClearSearch }: HomePageProps) {
  // 内部搜索状态管理
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '全部';

  // 使用内部搜索或全局搜索查询
  const effectiveSearchQuery = internalSearchQuery || globalSearchQuery;

  const {
    filteredTools,
    categories,
    activeCategory,
    isLoading,
    error,
    setActiveCategory,
  } = useTools(effectiveSearchQuery);

  // 处理搜索查询变化
  const handleSearchChange = (value: string) => {
    setInternalSearchQuery(value);
  };

  // 清除搜索
  const handleClearSearch = () => {
    setInternalSearchQuery('');
    if (onClearSearch) {
      onClearSearch();
    }
  };

  // 工具区域的引用
  const toolsSectionRef = useRef<HTMLDivElement>(null);

  // 根据URL参数设置激活的分类
  useEffect(() => {
    if (categoryParam !== activeCategory) {
      setActiveCategory(categoryParam as any);
    }
  }, [categoryParam, activeCategory, setActiveCategory]);

  // 动态设置SEO，根据分类参数
  const currentCategory = categoryParam === '全部' ? '' : categoryParam;
  const seoConfig = currentCategory 
    ? {
        title: `${currentCategory}工具 - AiQiji工具箱`,
        description: `精选${currentCategory}类工具，提升工作效率。发现最好用的${currentCategory}工具，让工作更高效。`,
        keywords: [`${currentCategory}`, '工具', '效率', `${currentCategory}工具箱`],
        canonicalUrl: `/?category=${encodeURIComponent(currentCategory)}`,
      }
    : SEOPresets.homePage();
  
  useSEO(seoConfig);

  // 当搜索查询变化且有搜索内容时，自动滚动到工具区域
  useEffect(() => {
    if (effectiveSearchQuery && toolsSectionRef.current && !isLoading) {
      // 使用setTimeout给DOM更新一些时间
      const timer = setTimeout(() => {
        if (toolsSectionRef.current) {
          // 滚动到工具区域顶部，位于顶部栏下方
          const offsetTop = toolsSectionRef.current.offsetTop;
          // 减去顶部栏高度(约64px)
          const scrollPosition = Math.max(0, offsetTop - 64);
          
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 100); // 延迟100ms，等待内容更新
      
      return () => clearTimeout(timer);
    }
  }, [effectiveSearchQuery, isLoading]);

  // 分类切换后滚动到工具区域顶部（与搜索一致）
  const scrollToToolsSection = () => {
    if (!toolsSectionRef.current) return;
    const offsetTop = toolsSectionRef.current.offsetTop;
    const scrollPosition = Math.max(0, offsetTop - 64);
    window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
  };

  // 处理分类切换（更新URL参数）
  const handleCategoryChange = (category: string) => {
    if (category === '全部') {
      // 移除category参数，回到首页
      setSearchParams({});
    } else {
      // 设置category参数
      setSearchParams({ category });
    }
    
    // 滚动到工具区域
    setTimeout(() => scrollToToolsSection(), 100);
  };

  return (
    <div className="relative">
      {/* 首页全屏壁纸横幅 */}
      <HeroBanner />

      {/* Sticky 搜索栏 - 滚动时停在顶部 */}
      <div className="sticky top-0 z-40 bg-background/95 dark:bg-black/95 backdrop-blur-md border-b border-border/30 shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <SearchBar
              value={effectiveSearchQuery}
              onChange={handleSearchChange}
              className="w-full h-12 text-base"
              placeholder="搜索你需要的工具..."
            />
            {effectiveSearchQuery && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-sm text-center text-muted-foreground"
              >
                搜索 "<span className="font-medium text-primary">{effectiveSearchQuery}</span>" 找到 {filteredTools.length} 个工具
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>

      {/* 侧边栏分类 - 桌面端滚动显示 */}
      {!isLoading && (
        <SidebarCategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onChange={handleCategoryChange}
        />
      )}

      {/* 工具区域 */}
      <motion.div
        ref={toolsSectionRef}
        id="tools-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-background dark:bg-black min-h-screen pt-8 md:pt-12 pb-8 md:pb-12"
      >
        <div className="container mx-auto px-4 max-w-7xl">
          {/* 平板端分类标签 */}
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden md:block xl:hidden mb-8"
            >
              <div className="flex justify-center">
                <CategoryTabs
                  categories={categories}
                  activeCategory={activeCategory}
                  onChange={handleCategoryChange}
                  className="flex-wrap justify-center"
                />
              </div>
            </motion.div>
          )}

          {/* 动态页面标题 - 当有分类参数时显示 */}
          {currentCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {currentCategory}工具
                </span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                精选{currentCategory}类工具，让你的工作更高效
              </p>
            </motion.div>
          )}

          {/* 平板端分类标签已移动到搜索框下方 */}

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
                  onClearSearch={handleClearSearch}
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
                    {currentCategory ? `${currentCategory}工具` : '当前显示工具'}
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
          onChange={handleCategoryChange}
          className="md:hidden"
        />
      )}
    </div>
  );
});

export default HomePage;
