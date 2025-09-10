import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/fontawesome' // 导入 Font Awesome 配置
import App from './App.jsx'

// 初始化主题
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('aiqiji:theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = savedTheme || systemTheme;
  
  document.documentElement.classList.add(theme);
  
  // 设置meta标签颜色
  const metaTheme = document.querySelector('meta[name="theme-color"]') || 
    (() => {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
      return meta;
    })();
  
  metaTheme.content = theme === 'dark' ? '#071027' : '#ffffff';
};

initializeTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
