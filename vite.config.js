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
  // React 19 兼容性配置
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // 确保 JSX 正确转换
    jsx: 'automatic',
    jsxDev: false,
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
        
        // 更激进的代码分割策略
        manualChunks: (id) => {
          // React 核心库
          if (id.includes('react/') || id.includes('react-dom/')) {
            return 'react-vendor';
          }
          
          // 路由相关
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Radix UI 组件 - 按使用频率分组
          if (id.includes('@radix-ui/react-dialog') || 
              id.includes('@radix-ui/react-tooltip') || 
              id.includes('@radix-ui/react-alert-dialog')) {
            return 'radix-core';
          }
          if (id.includes('@radix-ui')) {
            return 'radix-other';
          }
          
          // 动画库
          if (id.includes('framer-motion')) {
            return 'animation';
          }
          
          // 图标库 - 分离大小不同的图标库
          if (id.includes('lucide-react')) {
            return 'lucide-icons';
          }
          if (id.includes('react-icons')) {
            return 'social-icons';
          }
          
          // QR码相关
          if (id.includes('qrcode')) {
            return 'qr-utils';
          }
          
          // 工具库
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'utils';
          }
          
          // 大型第三方库单独分包
          if (id.includes('react-hot-toast')) {
            return 'toast';
          }
          if (id.includes('react-intersection-observer')) {
            return 'intersection-observer';
          }
          
          // 其他小型库
          if (id.includes('mini-svg-data-uri')) {
            return 'svg-utils';
          }
          
          // 其他 node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      },
      // 外部化依赖 - 对于大型库考虑CDN
      external: [],
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console (生产环境)
        drop_console: true,
        drop_debugger: true,
        // 移除未使用的代码
        dead_code: true,
        // 压缩条件表达式
        conditionals: true,
        // 移除未使用的函数 - 保守设置避免 React 19 问题
        unused: false,
        // 压缩布尔值
        booleans: true,
        // 优化if语句
        if_return: true,
        // 合并变量 - 保守设置
        join_vars: false,
        // 保留副作用以确保 React hooks 正常工作
        side_effects: true,
        // 避免过度优化导致 React 问题
        pure_funcs: [],
        // 保留函数名以便调试
        keep_fnames: true,
      },
      mangle: {
        // 混淆变量名 - 保守设置
        toplevel: false,
        safari10: true,
        // 保留 React 相关的函数名
        reserved: ['React', 'ReactDOM', 'useState', 'useEffect', 'useLayoutEffect', 'useContext']
      },
      format: {
        // 保留注释中的重要信息
        comments: /^!/,
      }
    },
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
  
  // 确保正确的模块解析
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // React 19 兼容性
    dedupe: ['react', 'react-dom'],
    conditions: ['import', 'module', 'browser', 'default'],
  },
})
