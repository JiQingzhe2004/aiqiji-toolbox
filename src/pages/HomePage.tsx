import React, { memo } from 'react';
// 移除 framer-motion 依赖，使用 CSS 动画
import { HeroBannerLite } from '@/components/HeroBannerLite';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SidebarCategoryTabs } from '@/components/SidebarCategoryTabs';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ToolGridLite } from '@/components/ToolGridLite';
import { EmptyState } from '@/components/EmptyState';
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
      <HeroBannerLite />

      {/* 侧边栏分类 - 桌面端滚动显示 */}
      {!isLoading && (
        <SidebarCategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onChange={(category: string) => setActiveCategory(category as any)}
        />
      )}

      {/* 工具区域 */}
      <div
        id="tools-section"
        className="relative z-10 bg-background min-h-screen pt-8 md:pt-12 pb-24 md:pb-24 animate-fade-in"
      >
        <div className="container mx-auto px-4 max-w-7xl">

          {/* 工具网格 */}
          <section className="min-h-[400px] w-full animate-fade-in animate-delay-200">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-fade-in">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <p className="text-muted-foreground">正在加载工具数据...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center animate-fade-in-up">
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
              </div>
            ) : (
              <ToolGridLite
                key={`${activeCategory}-${effectiveSearchQuery}`}
                tools={filteredTools}
                searchQuery={effectiveSearchQuery}
              />
            )}
          </section>

          {/* 统计信息 */}
          {!isLoading && !error && (
            <section className="text-center py-8 md:py-12 mt-8 animate-fade-in animate-delay-300">
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
            </section>
          )}
        </div>
      </div>

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
