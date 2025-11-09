import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { animateScroll as scroll } from 'react-scroll';

/**
 * ScrollToTop组件
 * 监听路由变化，在页面切换时自动滚动到顶部
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 使用 react-scroll 统一滚动到顶部
    try {
      // 窗口滚动到顶部（立即）
      scroll.scrollToTop({ duration: 0, smooth: false });
      // 主内容容器滚动到顶部（如果存在）
      scroll.scrollToTop({ containerId: 'app-main', duration: 0, smooth: false });
    } catch {}
  }, [pathname]);

  return null;
}
