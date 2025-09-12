/**
 * 网站图标优化工具
 * 提供图标抓取、优化、缓存等功能
 */

interface IconInfo {
  url: string;
  type: 'favicon' | 'apple-touch-icon' | 'og-image' | 'manifest-icon';
  size?: string;
  format?: string;
}

export class IconOptimizer {
  private cache = new Map<string, IconInfo[]>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 从网站获取所有可用的图标
   */
  async extractIconsFromWebsite(websiteUrl: string): Promise<IconInfo[]> {
    try {
      // 检查缓存
      const cacheKey = this.getCacheKey(websiteUrl);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const icons: IconInfo[] = [];
      const domain = new URL(websiteUrl).origin;

      // 1. 尝试获取 favicon.ico
      const faviconUrl = `${domain}/favicon.ico`;
      if (await this.checkImageExists(faviconUrl)) {
        icons.push({
          url: faviconUrl,
          type: 'favicon',
          format: 'ico'
        });
      }

      // 2. 尝试解析 HTML 中的图标链接
      try {
        const htmlIcons = await this.parseHTMLIcons(websiteUrl);
        icons.push(...htmlIcons);
      } catch (error) {
        console.warn('Failed to parse HTML icons:', error);
      }

      // 3. 尝试获取 manifest.json 中的图标
      try {
        const manifestIcons = await this.parseManifestIcons(domain);
        icons.push(...manifestIcons);
      } catch (error) {
        console.warn('Failed to parse manifest icons:', error);
      }

      // 4. 按优先级排序
      const sortedIcons = this.sortIconsByPriority(icons);

      // 缓存结果
      this.setCache(cacheKey, sortedIcons);

      return sortedIcons;
    } catch (error) {
      console.error('Failed to extract icons from website:', error);
      return [];
    }
  }

  /**
   * 解析 HTML 中的图标链接
   */
  private async parseHTMLIcons(websiteUrl: string): Promise<IconInfo[]> {
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IconBot/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const icons: IconInfo[] = [];
    const domain = new URL(websiteUrl).origin;

    // 解析 link 标签
    const linkRegex = /<link[^>]*(?:rel=["'](?:icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed)["'])[^>]*>/gi;
    const hrefRegex = /href=["']([^"']+)["']/i;
    const sizesRegex = /sizes=["']([^"']+)["']/i;
    const typeRegex = /type=["']([^"']+)["']/i;
    const relRegex = /rel=["']([^"']+)["']/i;

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const linkTag = match[0];
      const hrefMatch = hrefRegex.exec(linkTag);
      const sizesMatch = sizesRegex.exec(linkTag);
      const typeMatch = typeRegex.exec(linkTag);
      const relMatch = relRegex.exec(linkTag);

      if (hrefMatch) {
        let iconUrl = hrefMatch[1];
        
        // 处理相对路径
        if (iconUrl.startsWith('/')) {
          iconUrl = domain + iconUrl;
        } else if (!iconUrl.startsWith('http')) {
          iconUrl = new URL(iconUrl, websiteUrl).href;
        }

        const iconType = relMatch?.[1]?.includes('apple') ? 'apple-touch-icon' : 'favicon';

        icons.push({
          url: iconUrl,
          type: iconType,
          size: sizesMatch?.[1],
          format: this.getFormatFromUrl(iconUrl) || typeMatch?.[1]
        });
      }
    }

    // 解析 meta 标签中的 og:image
    const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
    const ogImageMatch = ogImageRegex.exec(html);
    if (ogImageMatch) {
      let ogImageUrl = ogImageMatch[1];
      if (ogImageUrl.startsWith('/')) {
        ogImageUrl = domain + ogImageUrl;
      } else if (!ogImageUrl.startsWith('http')) {
        ogImageUrl = new URL(ogImageUrl, websiteUrl).href;
      }

      icons.push({
        url: ogImageUrl,
        type: 'og-image',
        format: this.getFormatFromUrl(ogImageUrl)
      });
    }

    return icons;
  }

  /**
   * 解析 manifest.json 中的图标
   */
  private async parseManifestIcons(domain: string): Promise<IconInfo[]> {
    const manifestUrl = `${domain}/manifest.json`;
    
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const manifest = await response.json();
      const icons: IconInfo[] = [];

      if (manifest.icons && Array.isArray(manifest.icons)) {
        manifest.icons.forEach((icon: any) => {
          let iconUrl = icon.src;
          if (iconUrl.startsWith('/')) {
            iconUrl = domain + iconUrl;
          }

          icons.push({
            url: iconUrl,
            type: 'manifest-icon',
            size: icon.sizes,
            format: icon.type
          });
        });
      }

      return icons;
    } catch (error) {
      throw new Error(`Failed to fetch manifest: ${error}`);
    }
  }

  /**
   * 按优先级排序图标
   */
  private sortIconsByPriority(icons: IconInfo[]): IconInfo[] {
    const priorityOrder = {
      'apple-touch-icon': 1,
      'manifest-icon': 2,
      'favicon': 3,
      'og-image': 4
    };

    return icons.sort((a, b) => {
      const aPriority = priorityOrder[a.type] || 999;
      const bPriority = priorityOrder[b.type] || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // 同类型的按尺寸排序，优先选择较大的
      const aSize = this.parseSizeString(a.size);
      const bSize = this.parseSizeString(b.size);

      return bSize - aSize;
    });
  }

  /**
   * 检查图片是否存在
   */
  private async checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok && (response.headers.get('content-type')?.startsWith('image/') || false);
    } catch {
      return false;
    }
  }

  /**
   * 从 URL 获取图片格式
   */
  private getFormatFromUrl(url: string): string | undefined {
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
    const formatMap: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon'
    };
    return formatMap[extension || ''];
  }

  /**
   * 解析尺寸字符串
   */
  private parseSizeString(size?: string): number {
    if (!size) return 0;
    const match = size.match(/(\d+)x(\d+)/);
    if (match) {
      return parseInt(match[1]) * parseInt(match[2]);
    }
    return 0;
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(websiteUrl: string): string {
    return `icons_${new URL(websiteUrl).hostname}`;
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): IconInfo[] | null {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // 尝试从 localStorage 获取
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        if (Date.now() - data.timestamp < this.CACHE_DURATION) {
          this.cache.set(key, data.icons);
          return data.icons;
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // 忽略 localStorage 错误
    }

    return null;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, icons: IconInfo[]): void {
    this.cache.set(key, icons);

    // 同时存储到 localStorage
    try {
      localStorage.setItem(key, JSON.stringify({
        icons,
        timestamp: Date.now()
      }));
    } catch {
      // 忽略 localStorage 错误
    }
  }

  /**
   * 清理过期缓存
   */
  clearExpiredCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('icons_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          if (Date.now() - data.timestamp >= this.CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });
  }
}

// 导出单例实例
export const iconOptimizer = new IconOptimizer();
