"use client";

import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import type React from "react";

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

interface HighlighterProps {
  children: React.ReactNode;
  action?: AnnotationAction;
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
  isView?: boolean;
}

export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(elementRef, {
    once: true,
    margin: "-10%",
  });

  // If isView is false, always show. If isView is true, wait for inView
  const shouldShow = !isView || isInView;

  useEffect(() => {
    if (!shouldShow) return;

    const element = elementRef.current;
    if (!element) return;

    // 简化的高亮效果，不依赖rough-notation
    element.style.transition = `all ${animationDuration}ms ease-in-out`;
    
    switch (action) {
      case 'highlight':
        element.style.backgroundColor = color;
        element.style.padding = `${padding}px`;
        element.style.borderRadius = '4px';
        break;
      case 'underline':
        element.style.borderBottom = `${strokeWidth}px solid ${color}`;
        break;
      case 'box':
        element.style.border = `${strokeWidth}px solid ${color}`;
        element.style.padding = `${padding}px`;
        element.style.borderRadius = '4px';
        break;
      case 'strike-through':
        element.style.textDecoration = 'line-through';
        element.style.textDecorationColor = color;
        element.style.textDecorationThickness = `${strokeWidth}px`;
        break;
      default:
        element.style.backgroundColor = color;
        element.style.padding = `${padding}px`;
        element.style.borderRadius = '4px';
    }

    return () => {
      if (element) {
        element.style.backgroundColor = '';
        element.style.border = '';
        element.style.borderBottom = '';
        element.style.textDecoration = '';
        element.style.padding = '';
        element.style.borderRadius = '';
      }
    };
  }, [
    shouldShow,
    action,
    color,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
  ]);

  return (
    <span ref={elementRef} className="relative inline-block bg-transparent">
      {children}
    </span>
  );
}