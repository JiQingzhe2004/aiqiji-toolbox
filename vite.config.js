import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // React相关
          'react-vendor': ['react', 'react-dom'],
          // 路由
          'router': ['react-router-dom'],
          // UI组件库
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tooltip', 
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch'
          ],
          // 动画库
          'animation': ['framer-motion'],
          // 工具库
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          // 图标库（大幅减少）
          'icons': ['lucide-react'],
          // 其他第三方库
          'vendor': [
            'react-hot-toast',
            'react-intersection-observer', 
            'qrcode',
            'canvas-confetti'
          ]
        }
      }
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
      }
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 500,
    // 启用CSS代码分割
    cssCodeSplit: true,
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
