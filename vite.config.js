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
        
        // 手动分割代码块 - 更精细的分割策略
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom'],
          
          // 路由相关
          'router': ['react-router-dom'],
          
          // Radix UI 组件
          'radix-ui': [
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
          
          // 动画和特效
          'animation': ['framer-motion', 'canvas-confetti'],
          
          // 图标库
          'icons': ['lucide-react', 'react-icons'],
          
          // QR码相关
          'qr-utils': ['qrcode'],
          
          // 工具库
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // 其他第三方库
          'vendor': ['react-hot-toast', 'react-intersection-observer', 'mini-svg-data-uri']
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
