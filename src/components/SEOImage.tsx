/**
 * SEO 优化的图片组件
 * 提供完整的图片 SEO 功能，包括 alt、title、结构化数据等
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SEOImageProps {
  src: string;
  alt: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'sync' | 'async' | 'auto';
  sizes?: string;
  srcSet?: string;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  // SEO 相关属性
  itemProp?: string;
  caption?: string;
  description?: string;
  keywords?: string[];
  // 结构化数据
  structuredData?: boolean;
  imageType?: 'logo' | 'screenshot' | 'icon' | 'product' | 'article';
}

export function SEOImage({
  src,
  alt,
  title,
  width,
  height,
  className,
  loading = 'lazy',
  decoding = 'async',
  sizes,
  srcSet,
  onLoad,
  onError,
  itemProp,
  caption,
  description,
  keywords = [],
  structuredData = false,
  imageType = 'icon',
  ...props
}: SEOImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // 处理图片加载成功
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // 处理图片加载失败
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    onError?.(e);
  };

  // 生成结构化数据
  useEffect(() => {
    if (structuredData && isLoaded && imgRef.current) {
      const imageStructuredData = {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        "url": src,
        "caption": caption || alt,
        "description": description || alt,
        "width": width,
        "height": height,
        ...(keywords.length > 0 && { "keywords": keywords.join(', ') }),
        "contentUrl": src,
        "thumbnailUrl": src,
        "encodingFormat": getImageFormat(src),
        "uploadDate": new Date().toISOString(),
        "license": "https://creativecommons.org/licenses/by/4.0/", // 可根据实际情况调整
      };

      // 创建或更新结构化数据脚本
      const scriptId = `image-structured-data-${src.replace(/[^a-zA-Z0-9]/g, '-')}`;
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = scriptId;
        document.head.appendChild(script);
      }
      
      script.textContent = JSON.stringify(imageStructuredData, null, 2);
    }
  }, [structuredData, isLoaded, src, alt, caption, description, keywords, width, height]);

  // 获取图片格式
  const getImageFormat = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    const formatMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon'
    };
    return formatMap[extension || ''] || 'image/jpeg';
  };

  // 如果加载失败，显示占位符
  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground rounded",
          className
        )}
        style={{ width, height }}
        title={title || alt}
      >
        <span className="text-xs text-center p-2">图片加载失败</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      title={title || alt}
      width={width}
      height={height}
      className={cn(
        "transition-opacity duration-300",
        isLoaded ? "opacity-100" : "opacity-0",
        className
      )}
      loading={loading}
      decoding={decoding}
      sizes={sizes}
      srcSet={srcSet}
      onLoad={handleLoad}
      onError={handleError}
      itemProp={itemProp}
      // SEO 相关属性
      data-image-type={imageType}
      data-keywords={keywords.join(',')}
      {...props}
    />
  );
}

// 预设的图片配置
export const SEOImagePresets = {
  toolIcon: (src: string, toolName: string, toolDescription?: string) => ({
    src,
    alt: `${toolName} - 工具图标`,
    title: `${toolName}${toolDescription ? ` - ${toolDescription}` : ''}`,
    loading: 'eager' as const,
    decoding: 'sync' as const,
    structuredData: true,
    imageType: 'icon' as const,
    keywords: [toolName, '工具', '图标', 'icon'],
    width: 200,
    height: 200,
  }),
  
  websiteLogo: (src: string, siteName: string) => ({
    src,
    alt: `${siteName} - 网站Logo`,
    title: siteName,
    loading: 'eager' as const,
    decoding: 'sync' as const,
    structuredData: true,
    imageType: 'logo' as const,
    keywords: [siteName, 'logo', '网站', '标志'],
    itemProp: 'logo',
  }),
  
  friendLinkIcon: (src: string, siteName: string) => ({
    src,
    alt: `${siteName} - 友链图标`,
    title: siteName,
    loading: 'lazy' as const,
    structuredData: false,
    imageType: 'icon' as const,
    keywords: [siteName, '友情链接', '图标'],
  }),
};
