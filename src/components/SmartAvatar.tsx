/**
 * 智能头像组件
 * 自动处理多种头像来源，提供优雅的降级策略
 */

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { avatarService } from '@/services/avatarService';
import { cn } from '@/lib/utils';

interface SmartAvatarProps {
  user: {
    avatar_url?: string;
    email?: string;
    username?: string;
    display_name?: string;
  };
  size?: number;
  className?: string;
  fallbackClassName?: string;
}

export function SmartAvatar({ 
  user, 
  size = 200, 
  className,
  fallbackClassName 
}: SmartAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // 获取头像URL
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        setIsLoading(true);
        const url = await avatarService.getAvatarUrl(user, size);
        setAvatarUrl(url);
      } catch (error) {
        console.error('加载头像失败:', error);
        // 即使发生错误，avatarService也会返回字母头像，所以不需要特殊处理
      } finally {
        setIsLoading(false);
      }
    };

    loadAvatar();
  }, [user.avatar_url, user.email, user.username, user.display_name, size]);

  // 生成文字头像的字母和颜色（用于Fallback）
  const getLetterAndColor = () => {
    const letter = (user.display_name || user.username || 'U').charAt(0).toUpperCase();
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    const colorIndex = (user.username || '').charCodeAt(0) % colors.length;
    return { letter, color: colors[colorIndex] };
  };

  const { letter, color } = getLetterAndColor();

  return (
    <Avatar className={cn('transition-all duration-200', className)}>
      {!isLoading && avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          className="object-cover"
        />
      )}
      <AvatarFallback 
        className={cn(
          'font-semibold text-white transition-all duration-200',
          color,
          fallbackClassName
        )}
      >
        {isLoading ? (
          <div className="animate-pulse bg-gray-300 w-full h-full rounded-full" />
        ) : (
          letter
        )}
      </AvatarFallback>
    </Avatar>
  );
}
