import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';

export interface ConfettiRef {
  fire: () => void;
}

interface ConfettiProps {
  className?: string;
}

/**
 * 轻量级彩带组件 - 使用CSS动画替代canvas-confetti
 * 体积减少约15KB
 */
export const ConfettiLite = forwardRef<ConfettiRef, ConfettiProps>(
  ({ className }, ref) => {
    const [isActive, setIsActive] = useState(false);

    const fire = useCallback(() => {
      setIsActive(true);
      // 3秒后自动隐藏
      setTimeout(() => setIsActive(false), 3000);
    }, []);

    useImperativeHandle(ref, () => ({
      fire,
    }), [fire]);

    if (!isActive) return null;

    return (
      <div className={`confetti-container ${className || ''}`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="confetti-piece" />
        ))}
      </div>
    );
  }
);

ConfettiLite.displayName = 'ConfettiLite';
