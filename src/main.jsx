import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 安全的主题初始化
const initializeTheme = () => {
  try {
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
  } catch (error) {
    console.warn('主题初始化失败:', error);
    // 设置默认主题
    document.documentElement.classList.add('light');
  }
};

// 安全的应用初始化
const initializeApp = () => {
  try {
    initializeTheme();
    
    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Root element not found');
    }
    
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('应用初始化失败:', error);
    // 显示错误信息而不是白屏
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-size: 48px; margin-bottom: 16px;">😵</div>
          <h1 style="color: #dc2626; margin-bottom: 8px;">应用加载失败</h1>
          <p style="color: #6b7280; margin-bottom: 16px;">请刷新页面重试，或联系技术支持</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">刷新页面</button>
        </div>
      `;
    }
  }
};

initializeApp();
