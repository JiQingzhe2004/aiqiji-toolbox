/**
 * SEO 优化 Hook
 * 提供页面级别的 SEO 管理功能
 */

import { useEffect } from 'react';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  canonicalUrl?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  articleSection?: string;
  articleTags?: string[];
}

export function useSEO(config: SEOConfig) {
  useEffect(() => {
    // 设置页面标题
    if (config.title) {
      document.title = config.title;
    }

    // 设置meta描述
    if (config.description) {
      const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', config.description);
      if (!document.querySelector('meta[name="description"]')) {
        document.head.appendChild(metaDescription);
      }
    }

    // 设置关键词
    if (config.keywords && config.keywords.length > 0) {
      const metaKeywords = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', config.keywords.join(', '));
      if (!document.querySelector('meta[name="keywords"]')) {
        document.head.appendChild(metaKeywords);
      }
    }

    // 设置 Open Graph 标签
    const setOGMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    if (config.title) {
      setOGMeta('og:title', config.title);
    }
    
    if (config.description) {
      setOGMeta('og:description', config.description);
    }
    
    setOGMeta('og:url', window.location.href);
    setOGMeta('og:type', 'website');
    
    if (config.ogImage) {
      setOGMeta('og:image', config.ogImage);
      if (config.ogImageAlt) {
        setOGMeta('og:image:alt', config.ogImageAlt);
      }
    }

    // 设置 Twitter Card
    const setTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setTwitterMeta('twitter:card', 'summary_large_image');
    
    if (config.title) {
      setTwitterMeta('twitter:title', config.title);
    }
    
    if (config.description) {
      setTwitterMeta('twitter:description', config.description);
    }
    
    if (config.ogImage) {
      setTwitterMeta('twitter:image', config.ogImage);
      if (config.ogImageAlt) {
        setTwitterMeta('twitter:image:alt', config.ogImageAlt);
      }
    }

    // 设置 canonical URL
    if (config.canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', config.canonicalUrl);
    }

    // 设置作者信息
    if (config.author) {
      const metaAuthor = document.querySelector('meta[name="author"]') || document.createElement('meta');
      metaAuthor.setAttribute('name', 'author');
      metaAuthor.setAttribute('content', config.author);
      if (!document.querySelector('meta[name="author"]')) {
        document.head.appendChild(metaAuthor);
      }
    }

    // 设置文章时间信息（如果是文章类型）
    if (config.publishedTime) {
      setOGMeta('article:published_time', config.publishedTime);
    }
    
    if (config.modifiedTime) {
      setOGMeta('article:modified_time', config.modifiedTime);
    }
    
    if (config.articleSection) {
      setOGMeta('article:section', config.articleSection);
    }
    
    if (config.articleTags && config.articleTags.length > 0) {
      config.articleTags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.setAttribute('content', tag);
        document.head.appendChild(meta);
      });
    }

    // 清理函数（组件卸载时移除设置的标签）
    return () => {
      // 注意：实际使用中可能不需要清理，因为用户通常会导航到其他页面
      // 这里保留清理逻辑以防特殊需求
    };
  }, [config]);
}

// 默认SEO图片
const DEFAULT_OG_IMAGE = '/web-app-manifest-512x512.png';

// 预设的 SEO 配置
export const SEOPresets = {
  toolDetail: (toolName: string, description: string, iconUrl?: string) => ({
    title: `${toolName} - 工具详情 | AiQiji工具箱`,
    description: `${description} - 在AiQiji工具箱发现更多优质工具。`,
    keywords: [toolName, '工具', '在线工具', '效率工具', 'AiQiji'],
    ogImage: iconUrl || DEFAULT_OG_IMAGE,
    ogImageAlt: `${toolName} - ${description}`,
    canonicalUrl: window.location.href,
    author: 'AiQiji Team',
  }),

  homePage: () => ({
    title: 'AiQiji工具箱 - 专业工具导航平台',
    description: '为开发者、设计师、产品经理和效率工具爱好者精心收集的工具导航站点，发现最新最好用的在线工具。',
    keywords: ['工具导航', '开发者工具', '设计师工具', 'AI工具', '效率工具', '在线工具', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'AiQiji工具箱 - 专业工具导航平台',
    canonicalUrl: `${window.location.origin}/`,
    author: 'AiQiji Team',
  }),

  friendLinks: () => ({
    title: '友情链接 - AiQiji工具箱',
    description: '与优秀的网站和工具平台建立友情链接，共同为用户提供更好的服务体验。',
    keywords: ['友情链接', '合作伙伴', '工具网站', '资源分享', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: '友情链接 - AiQiji工具箱',
    canonicalUrl: `${window.location.origin}/friends`,
    author: 'AiQiji Team',
  }),

  friendLinkApplication: () => ({
    title: '友链申请 - AiQiji工具箱',
    description: '申请与AiQiji工具箱建立友情链接，加入我们的合作伙伴网络。',
    keywords: ['友链申请', '友情链接申请', '合作申请', '网站合作', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: '友链申请 - AiQiji工具箱',
    canonicalUrl: `${window.location.origin}/friends/apply`,
    author: 'AiQiji Team',
  }),

  toolSubmission: () => ({
    title: '工具提交 - AiQiji工具箱',
    description: '向AiQiji工具箱提交您的优质工具，让更多用户发现和使用。',
    keywords: ['工具提交', '工具推荐', '工具收录', '网站提交', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: '工具提交 - AiQiji工具箱',
    canonicalUrl: `${window.location.origin}/submit`,
    author: 'AiQiji Team',
  }),

  privacyPolicy: () => ({
    title: '隐私政策 - AiQiji工具箱',
    description: 'AiQiji工具箱隐私政策，了解我们如何保护您的个人信息和数据安全。',
    keywords: ['隐私政策', '数据保护', '用户隐私', '信息安全', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: '隐私政策 - AiQiji工具箱',
    canonicalUrl: `${window.location.origin}/privacy`,
    author: 'AiQiji Team',
  }),

  termsOfService: () => ({
    title: '使用条款 - AiQiji工具箱',
    description: 'AiQiji工具箱使用条款，了解服务条款和用户协议。',
    keywords: ['使用条款', '服务条款', '用户协议', '法律声明', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: '使用条款 - AiQiji工具箱',
    canonicalUrl: `${window.location.origin}/terms`,
    author: 'AiQiji Team',
  }),

  notFound: () => ({
    title: '页面未找到 - AiQiji工具箱',
    description: '抱歉，您访问的页面不存在。请返回首页浏览我们的优质工具。',
    keywords: ['404', '页面未找到', '错误页面', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: '页面未找到 - AiQiji工具箱',
    canonicalUrl: `${window.location.origin}/`,
    author: 'AiQiji Team',
  }),

  adminPanel: () => ({
    title: '管理面板 - AiQiji工具箱',
    description: 'AiQiji工具箱管理面板，管理工具、友链和网站设置。',
    keywords: ['管理面板', '后台管理', '网站管理', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: '管理面板 - AiQiji工具箱',
    canonicalUrl: `${window.location.origin}/admin`,
    author: 'AiQiji Team',
  }),

  externalLink: (toolName?: string) => ({
    title: `${toolName ? `${toolName} - ` : ''}外部链接跳转 - AiQiji工具箱`,
    description: `即将为您跳转到${toolName || '外部网站'}，请注意网站安全。`,
    keywords: ['外部链接', '跳转提醒', '安全提示', 'AiQiji'],
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${toolName ? `${toolName} - ` : ''}外部链接跳转`,
    canonicalUrl: `${window.location.origin}/external-link`,
    author: 'AiQiji Team',
  }),
};
