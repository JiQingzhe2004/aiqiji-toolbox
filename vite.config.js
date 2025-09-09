import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
    // 确保 React 全局变量可用
    global: 'globalThis',
  },
  // React 18 配置
  esbuild: {
    jsx: 'automatic',
    target: 'es2020',
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        // 避免被广告拦截器阻止的文件命名
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          // 避免使用 beacon、track、analytics 等敏感词汇
          if (name.includes('beacon') || name.includes('track')) {
            return 'assets/app-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          // 避免使用可能被拦截的文件名
          if (name.includes('beacon') || name.includes('track') || name.includes('analytics')) {
            return 'assets/chunk-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // 简化的代码分割策略
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom'],
          
          // 路由
          'router': ['react-router-dom'],
          
          // UI 组件库
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-progress',
            '@radix-ui/react-aspect-ratio'
          ],
          
          // 动画库
          'animation': ['framer-motion'],
          
          // 图标库
          'icons': ['lucide-react', 'react-icons'],
          
          // 工具库
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // 其他库
          'vendor': ['react-hot-toast', 'react-intersection-observer', 'qrcode', 'mini-svg-data-uri']
        }
      },
      // 外部化依赖 - 对于大型库考虑CDN
      external: [],
    },
    // 使用更安全的压缩配置避免 React 19 问题
    minify: 'esbuild',
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 500,
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 强化 tree-shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
  },
  // 开发服务器优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'react-hot-toast',
      'canvas-confetti',
      'qrcode'
    ],
    // 强制重新构建依赖
    force: false,
    // React 19 兼容性
    esbuildOptions: {
      target: 'es2020',
      jsx: 'automatic',
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
