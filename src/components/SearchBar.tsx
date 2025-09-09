import React, { useState, useEffect, useRef } from 'react';
// 移除 framer-motion，使用 CSS 动画替代
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * SearchBar组件属性接口
 */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * 搜索栏组件
 * 支持聚焦展开动画、清空功能、回车提交
 * 符合提示词要求：聚焦时从220px展开到360px，持续180ms
 */
export function SearchBar({ 
  value, 
  onChange, 
  placeholder = '搜索工具',
  className 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // ESC 清空搜索
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
        if (value) {
          onChange('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, value, onChange]);

  // 清空搜索
  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // 回车处理 - 可以在这里添加搜索提交逻辑
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // 目前只是触发一次搜索，可以根据需要扩展
      inputRef.current?.blur();
    }
  };

  return (
<<<<<<< HEAD
    <motion.div
      className={cn('relative', className)}
      initial={{ width: className?.includes('flex-1') ? '100%' : 220 }}
      animate={{ width: className?.includes('flex-1') ? '100%' : (isFocused ? 360 : 220) }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
=======
    <div
      className={cn(
        'relative transition-all duration-180 ease-out',
        isFocused ? 'w-[360px]' : 'w-[220px]',
        className
      )}
>>>>>>> 79ce046bf5cc80a86f044c6d4dc6ef0ab034430c
    >
      <div className="relative">
        {/* 搜索图标 */}
        <Search 
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none",
            className?.includes('flex-1') ? 'left-2' : 'left-3'
          )}
          role="img"
          aria-label="搜索图标"
          style={{ 
            filter: 'none',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased'
          }}
        />
        
        {/* 输入框 */}
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={cn(
            'bg-background/80 border-muted-foreground/20',
            // 完全移除所有聚焦边框效果
            'focus:ring-0 focus:ring-offset-0 focus:border-muted-foreground/20 focus:outline-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-muted-foreground/20 focus-visible:outline-none',
            'active:ring-0 active:ring-offset-0 active:outline-none',
            'outline-none',
            'transition-all duration-180',
            // 移动端flex-1模式下减少padding
            className?.includes('flex-1') ? 'pl-8 pr-8' : 'pl-10 pr-10'
          )}
          style={{
            outline: 'none',
            boxShadow: 'none'
          }}
          aria-label="搜索工具"
          aria-describedby="search-help"
        />
        
        {/* 清空按钮 */}
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-muted",
              className?.includes('flex-1') ? 'right-0.5' : 'right-1'
            )}
            aria-label="清空搜索"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        
        {/* 键盘提示 */}
        {!isFocused && !value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-muted text-muted-foreground rounded border">
              ⌘+K或Ctrl+K
            </kbd>
          </div>
        )}
      </div>
      
      {/* 无障碍说明文本 */}
      <div id="search-help" className="sr-only">
        使用此搜索框可以按名称、描述或标签查找工具。按下Ctrl+K或Cmd+K可快速聚焦。
      </div>
    </div>
  );
}
