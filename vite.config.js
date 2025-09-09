import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        // 手动分割代码块 - 更精细的分割策略
        manualChunks: (id) => {
          // React 核心 - 更精确的匹配
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          
          // 路由
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Radix UI 按组件分割
          if (id.includes('@radix-ui/react-dialog')) {
            return 'radix-dialog';
          }
          if (id.includes('@radix-ui/react-tooltip')) {
            return 'radix-tooltip';
          }
          if (id.includes('@radix-ui')) {
            return 'radix-other';
          }
          
          // 动画库
          if (id.includes('framer-motion')) {
            return 'animation';
          }
          
          // 图标库
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          if (id.includes('react-icons')) {
            return 'social-icons';
          }
          
          // QR码和特效
          if (id.includes('qrcode') || id.includes('canvas-confetti')) {
            return 'qr-effects';
          }
          
          // 工具库
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'utils';
          }
          
          // 其他第三方库
          if (id.includes('react-hot-toast') || id.includes('react-intersection-observer')) {
            return 'vendor';
          }
          
          // node_modules 中的其他库
          if (id.includes('node_modules')) {
            return 'vendor-misc';
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
        // 移除console
        drop_console: true,
        drop_debugger: true,
        // 移除未使用的代码
        dead_code: true,
        // 压缩条件表达式
        conditionals: true,
        // 移除未使用的函数
        unused: true,
        // 压缩布尔值
        booleans: true,
        // 优化if语句
        if_return: true,
        // 合并变量
        join_vars: true,
        // 移除无用的代码
        side_effects: false
      },
      mangle: {
        // 混淆变量名
        toplevel: true,
        safari10: true
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
      'lucide-react'
    ]
  }
})
