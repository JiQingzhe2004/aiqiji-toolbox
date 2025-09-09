"use client";

import React, { useEffect, useState, useRef } from "react";
// Mantine依赖已移除，使用原生HTML元素
import { TextCursor } from "lucide-react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  component?: React.ElementType;
  startOnView?: boolean;
  size?: string;
  weight?: string | number;
  loop?: boolean;
  pauseDuration?: number;
  deleteDuration?: number;
}

export function TypingAnimation({
  children,
  className,
  duration = 100,
  delay = 0,
  component = "div",
  startOnView = false,
  size = "xl",
  weight = 500,
  loop = false,
  pauseDuration = 2000,
  deleteDuration = 50,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isVisible, setIsVisible] = useState(!startOnView);
  const elementRef = useRef<any>(null);

  useEffect(() => {
    if (!startOnView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!isVisible) return;

    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    const startAnimation = () => {
      if (!isActive) return;

      let currentIndex = 0;
      let isTyping = true;
      
      const animate = () => {
        if (!isActive) return;

        if (isTyping) {
          // 打字阶段
          if (currentIndex <= children.length) {
            setDisplayedText(children.slice(0, currentIndex));
            currentIndex++;
            timeoutId = setTimeout(animate, duration);
          } else {
            // 打字完成，如果需要循环，等待后开始删除
            if (loop) {
              timeoutId = setTimeout(() => {
                isTyping = false;
                animate();
              }, pauseDuration);
            }
          }
        } else {
          // 删除阶段
          if (currentIndex > 0) {
            currentIndex--;
            setDisplayedText(children.slice(0, currentIndex));
            timeoutId = setTimeout(animate, deleteDuration);
          } else {
            // 删除完成，重新开始打字
            isTyping = true;
            timeoutId = setTimeout(animate, delay);
          }
        }
      };

      timeoutId = setTimeout(animate, delay);
    };

    startAnimation();

    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [children, duration, delay, isVisible, loop, pauseDuration, deleteDuration]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "inline-block",
        size === "xl" && "text-xl",
        size === "lg" && "text-lg", 
        size === "md" && "text-base",
        size === "sm" && "text-sm",
        className
      )}
      style={{ 
        display: "inline-block",
        fontWeight: weight 
      }}
    >
      {displayedText}
      <TextCursor 
        size={size === "xl" ? 24 : size === "lg" ? 20 : 16} 
        style={{ 
          animation: "blink 0.8s steps(2, start) infinite", 
          display: "inline",
          marginLeft: "2px",
          verticalAlign: "text-bottom"
        }} 
      />
      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
