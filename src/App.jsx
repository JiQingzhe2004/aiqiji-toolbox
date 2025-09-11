import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// MantineProvider已移除，减少打包体积
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import CookieConsent from './components/CookieConsent';

// 懒加载页面组件以提高性能
import HomePage from './pages/HomePage'; // 首页不懒加载，立即可用
const ExternalLinkPage = lazy(() => import('./pages/ExternalLinkPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const FriendLinksPage = lazy(() => import('./pages/FriendLinksPage'));
const FriendLinkApplicationPage = lazy(() => import('./pages/FriendLinkApplicationPage'));


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
 * 主应用组件
 * 包含路由、主题、错误边界等核心功能
 */
function App() {
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  return (
    <AuthProvider>
        <ErrorBoundary>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* 外链提醒页面 - 独立布局，无Header和Footer */}
              <Route path="/external-link" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ExternalLinkPage />
                </Suspense>
              } />
              
              {/* 管理页面 - 需要管理员权限 */}
              <Route path="/admin" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                </Suspense>
              } />
              
              {/* 主站页面 - 带Header和Footer */}
              <Route path="/*" element={
                <div className="min-h-screen flex flex-col">
                  <Header 
                    searchValue={globalSearchQuery}
                    onSearchChange={setGlobalSearchQuery}
                  />
                  
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={
                        <HomePage searchQuery={globalSearchQuery} />
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
                      <Route path="*" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <NotFoundPage />
                        </Suspense>
                      } />
                    </Routes>
                  </main>
                  
                  <Footer />
                </div>
              } />
            </Routes>
        
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
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;