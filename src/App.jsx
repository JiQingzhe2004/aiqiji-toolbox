import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useTheme } from './hooks/useTheme';
import { cn } from './lib/utils';

// 懒加载页面组件以提高性能
const HomePage = lazy(() => import('./pages/HomePage'));
const ExternalLinkPage = lazy(() => import('./pages/ExternalLinkPage'));

/**
 * 加载组件
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

  static getDerivedStateFromError(error) {
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
  const { theme } = useTheme();
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  return (
    <MantineProvider>
      <ErrorBoundary>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* 外链提醒页面 - 独立布局，无Header和Footer */}
              <Route path="/external-link" element={
                <ExternalLinkPage />
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
                      <Route path="*" element={
                        <div className="text-center py-16">
                          <div className="text-6xl mb-4">🔍</div>
                          <h2 className="text-2xl font-semibold mb-2">页面未找到</h2>
                          <p className="text-muted-foreground">
                            抱歉，您访问的页面不存在
                          </p>
                        </div>
                      } />
                    </Routes>
                  </main>
                  
                  <Footer />
                </div>
              } />
            </Routes>
          </Suspense>
        
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
        </Router>
      </ErrorBoundary>
    </MantineProvider>
  );
}

export default App;