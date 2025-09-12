/**
 * 动态 Sitemap 生成器
 * 根据数据库中的工具和页面自动生成 sitemap.xml
 */

import type { Tool } from '@/types';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
    license?: string;
  }>;
}

export class SitemapGenerator {
  private baseUrl: string;
  private urls: SitemapUrl[] = [];

  constructor(baseUrl = 'https://tools.aiqji.com') {
    this.baseUrl = baseUrl;
    this.initializeStaticPages();
  }

  // 初始化静态页面
  private initializeStaticPages() {
    const staticPages: SitemapUrl[] = [
      {
        loc: '/',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 1.0,
        images: [{
          loc: '/logo.png',
          caption: 'AiQiji工具箱',
          title: '专业工具导航平台'
        }]
      },
      {
        loc: '/friends',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        loc: '/friend-link-apply',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.6
      },
      {
        loc: '/privacy',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.3
      },
      {
        loc: '/terms',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.3
      }
    ];

    this.urls = staticPages;
  }

  // 添加工具页面
  addToolPages(tools: Tool[]) {
    const toolUrls: SitemapUrl[] = tools
      .filter(tool => tool.status === 'active') // 只包含已激活的工具
      .map(tool => ({
        loc: `/tool/${tool.id}`,
        lastmod: tool.updated_at ? new Date(tool.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'weekly' as const,
        priority: 0.7,
        images: tool.icon_url ? [{
          loc: tool.icon_url,
          caption: `${tool.name} logo`,
          title: `${tool.name} - ${tool.description || '专业工具'}`,
          license: 'https://creativecommons.org/licenses/by/4.0/'
        }] : undefined
      }));

    this.urls.push(...toolUrls);
  }

  // 添加分类页面
  addCategoryPages(categories: string[]) {
    const categoryUrls: SitemapUrl[] = categories.map(category => ({
      loc: `/?category=${encodeURIComponent(category)}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily' as const,
      priority: 0.8
    }));

    this.urls.push(...categoryUrls);
  }

  // 生成 XML sitemap
  generateXML(): string {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
        http://www.google.com/schemas/sitemap-image/1.1
        http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">`;

    const urlElements = this.urls.map(url => {
      let urlXml = `
  <url>
    <loc>${this.baseUrl}${url.loc}</loc>`;

      if (url.lastmod) {
        urlXml += `
    <lastmod>${url.lastmod}</lastmod>`;
      }

      if (url.changefreq) {
        urlXml += `
    <changefreq>${url.changefreq}</changefreq>`;
      }

      if (url.priority !== undefined) {
        urlXml += `
    <priority>${url.priority}</priority>`;
      }

      // 添加图片信息
      if (url.images && url.images.length > 0) {
        url.images.forEach(image => {
          urlXml += `
    <image:image>
      <image:loc>${image.loc.startsWith('http') ? image.loc : this.baseUrl + image.loc}</image:loc>`;
          
          if (image.caption) {
            urlXml += `
      <image:caption><![CDATA[${image.caption}]]></image:caption>`;
          }
          
          if (image.title) {
            urlXml += `
      <image:title><![CDATA[${image.title}]]></image:title>`;
          }
          
          if (image.license) {
            urlXml += `
      <image:license>${image.license}</image:license>`;
          }
          
          urlXml += `
    </image:image>`;
        });
      }

      urlXml += `
  </url>`;

      return urlXml;
    }).join('');

    return `${xmlHeader}${urlElements}
</urlset>`;
  }

  // 生成 robots.txt
  generateRobotsTxt(): string {
    return `# AiQiji工具箱 - 机器人访问规则
# 网站: ${this.baseUrl}
# 更新时间: ${new Date().toISOString().split('T')[0]}

User-agent: *
Allow: /

# 网站地图位置
Sitemap: ${this.baseUrl}/sitemap.xml

# 禁止爬取的目录和文件
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /node_modules/
Disallow: /src/
Disallow: /dist/assets/
Disallow: /uploads/
Disallow: /*.json$
Disallow: /*?utm_*
Disallow: /*?ref=*
Disallow: /external-link*

# 允许爬取的重要页面和参数
Allow: /
Allow: /friends
Allow: /friend-link-apply
Allow: /privacy
Allow: /terms
Allow: /tool/
Allow: /?search=*
Allow: /?category=*
Allow: /favicon.ico
Allow: /robots.txt
Allow: /sitemap.xml
Allow: /manifest.json
Allow: /logo.png

# 针对不同搜索引擎的特殊规则
User-agent: Googlebot
Crawl-delay: 1

User-agent: Bingbot
Crawl-delay: 1

User-agent: Baiduspider
Crawl-delay: 2

User-agent: 360Spider
Crawl-delay: 2

User-agent: Sogou web spider
Crawl-delay: 2

# 阻止恶意爬虫
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /`;
  }

  // 获取所有 URL
  getUrls(): SitemapUrl[] {
    return this.urls;
  }

  // 清空 URLs
  clear() {
    this.urls = [];
    this.initializeStaticPages();
  }
}

// 导出单例实例
export const sitemapGenerator = new SitemapGenerator();
