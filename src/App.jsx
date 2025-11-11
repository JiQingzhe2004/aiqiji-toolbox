import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// MantineProvider已移除，减少打包体积
import { Toaster } from 'react-hot-toast';
import { AppSidebar } from './components/sidebar/AppSidebar';
import { Footer } from './components/Footer';
import { FloatingSubmitButton } from './components/FloatingSubmitButton';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import CookieConsent from './components/CookieConsent';
import { AnimatedThemeToggler } from './components/magicui/animated-theme-toggler';

// 懒加载页面组件以提高性能
import HomePage from './pages/HomePage'; // 首页不懒加载，立即可用
import UserPage from './pages/UserPage'; // 用户页面不懒加载，避免加载问题
const ExternalLinkPage = lazy(() => import('./pages/ExternalLinkPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const FriendLinksPage = lazy(() => import('./pages/FriendLinksPage'));
const FriendLinkApplicationPage = lazy(() => import('./pages/FriendLinkApplicationPage'));
const ToolSubmissionPage = lazy(() => import('./pages/ToolSubmissionPage'));
const ToolDetailPage = lazy(() => import('./pages/ToolDetailPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const RevokeEmailChange = lazy(() => import('./pages/RevokeEmailChange'));

/**
 * 简单加载组件 - 用于其他场景
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/**
 * 错误边界组件
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">出现了一些问题</h2>
          <p className="text-muted-foreground mb-4">页面遇到了意外错误，请刷新页面重试</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 用户页面包装组件 - 避免懒加载问题
 */
function UserPageWrapper() {
  return <UserPage />;
}

/**
 * 应用内容组件 - 需要在 Router 内部使用 useLocation
 */
function AppContent() {
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const location = useLocation();
  
  // 检测是否在工具详情页面
  const isToolDetailPage = location.pathname.startsWith('/tool/');
  // 检测是否在管理员页面
  const isAdminPage = location.pathname.startsWith('/admin');
  // 检测是否在用户页面
  const isUserPage = location.pathname.startsWith('/user');

  return (
    <Routes>
      {/* 外链提醒页面 - 独立布局，无侧边栏 */}
      <Route path="/external-link" element={
        <Suspense fallback={<LoadingSpinner />}>
          <ExternalLinkPage />
        </Suspense>
      } />
      
      {/* 撤销邮箱变更页面 - 独立布局，无侧边栏 */}
      <Route path="/auth/revoke-email-change" element={
        <Suspense fallback={<LoadingSpinner />}>
          <RevokeEmailChange />
        </Suspense>
      } />
      
      
      {/* 其他页面使用 Sidebar 布局 */}
      <Route path="*" element={
        <AppSidebar>
          <div className="flex flex-col min-h-full">
            <main className="flex-1">
              <Routes>
                <Route path="/" element={
                  <HomePage 
                    searchQuery={globalSearchQuery} 
                    onClearSearch={() => setGlobalSearchQuery('')}
                  />
                } />
                
                {/* 用户页面 - 现在使用侧边栏布局 */}
                <Route path="/user" element={<UserPageWrapper />} />
                
                {/* 管理页面 - 需要管理员权限 */}
                <Route path="/admin" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProtectedRoute requireAdmin={true}>
                      <AdminPage />
                    </ProtectedRoute>
                  </Suspense>
                } />
                
                <Route path="/privacy" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <PrivacyPage />
                  </Suspense>
                } />
                <Route path="/terms" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <TermsPage />
                  </Suspense>
                } />
                <Route path="/friends" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <FriendLinksPage />
                  </Suspense>
                } />
                <Route path="/friend-link-apply" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <FriendLinkApplicationPage />
                  </Suspense>
                } />
                <Route path="/submit-tool" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ToolSubmissionPage />
                  </Suspense>
                } />
                <Route path="/tool/:toolId" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ToolDetailPage />
                  </Suspense>
                } />
                <Route path="/feedback" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <FeedbackPage />
                  </Suspense>
                } />
                <Route path="*" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <NotFoundPage />
                  </Suspense>
                } />
              </Routes>
            </main>
            
            {/* Footer - 管理员页面和用户页面不显示 */}
            {!isAdminPage && !isUserPage && <Footer />}
            
            {/* 悬浮提交工具按钮 - 工具详情页面有自己的按钮 */}
            {!isToolDetailPage && <FloatingSubmitButton />}
          </div>
        </AppSidebar>
      } />
    </Routes>
  );
}

/**
 * 主应用组件
 * 包含路由、主题、错误边界等核心功能
 */
function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
        
        {/* Toast 提示组件 */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            },
          }}
        />
        
        {/* Cookie同意横幅 */}
        <CookieConsent />
        
        {/* 桌面端右上角主题切换按钮 */}
        <div className="fixed top-4 right-4 z-[60] hidden md:block">
          <AnimatedThemeToggler />
        </div>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;