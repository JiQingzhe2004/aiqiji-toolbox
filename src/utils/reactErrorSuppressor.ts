/**
 * React 19 与某些第三方库的兼容性问题临时解决方案
 * 抑制 flushSync 警告，直到库更新修复
 */

let originalConsoleWarn: typeof console.warn;

export function suppressFlushSyncWarnings() {
  if (typeof window !== 'undefined' && !originalConsoleWarn) {
    originalConsoleWarn = console.warn;
    
    console.warn = (...args: any[]) => {
      // 检查是否是 flushSync 相关的警告
      const message = args[0];
      if (
        typeof message === 'string' && 
        message.includes('flushSync was called from inside a lifecycle method')
      ) {
        // 在开发环境下，我们可以选择性地显示这些警告
        if (process.env.NODE_ENV === 'development') {
          // 可以选择显示简化的警告或完全忽略
          // originalConsoleWarn('TipTap/React 19 兼容性警告已被抑制');
          return;
        }
        return; // 生产环境下完全忽略
      }
      
      // 其他警告正常显示
      originalConsoleWarn.apply(console, args);
    };
  }
}

export function restoreConsoleWarn() {
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn;
    originalConsoleWarn = undefined as any;
  }
}
