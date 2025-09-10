import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop组件
 * 监听路由变化，在页面切换时自动滚动到顶部
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 页面切换时滚动到顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // 平滑滚动
    });
  }, [pathname]);

  return null;
}
