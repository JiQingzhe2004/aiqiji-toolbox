import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Globe, Users, Heart, ArrowLeft, Home, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSEO, SEOPresets } from '@/hooks/useSEO';
import { settingsApi } from '@/services/settingsApi';
import toast from 'react-hot-toast';

interface FriendLink {
  name: string;
  url: string;
  icon?: string;
  description?: string;
}

interface WebsiteInfo {
  site_name: string;
  site_description: string;
  friend_links: FriendLink[] | undefined;
}

export function FriendLinksPage() {
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBackButton, setShowBackButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 设置友情链接页SEO
  useSEO(SEOPresets.friendLinks());

  // 处理滚动时按钮显示/隐藏
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 向下滚动且超过100px时隐藏按钮
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowBackButton(false);
      } 
      // 向上滚动时显示按钮
      else if (currentScrollY < lastScrollY) {
        setShowBackButton(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 处理联系我们点击
  const handleContactUs = () => {
    // 滚动到页面底部
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
    
    // 显示提示信息
    setTimeout(() => {
      toast('请查看页面底部的“联系我们”', {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          borderLeft: '4px solid hsl(var(--primary))',
          fontSize: '14px',
          padding: '12px 16px',
          borderRadius: '8px',
          maxWidth: '90vw',
          wordBreak: 'keep-all'
        },
        icon: '💬'
      });
    }, 800); // 滚动完成后显示提示
  };

  useEffect(() => {
    const fetchWebsiteInfo = async () => {
      try {
        const response = await settingsApi.getWebsiteInfo();
        if (response.success && response.data) {
          setWebsiteInfo(response.data as WebsiteInfo);
        }
      } catch (error) {
        console.error('获取网站信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteInfo();
  }, []);

  // 设置页面SEO
  useEffect(() => {
    if (websiteInfo) {
      const title = `友情链接 - ${websiteInfo.site_name}`;
      const description = `${websiteInfo.site_name}的友情链接页面，展示我们的优质合作伙伴和推荐网站。共收录${websiteInfo.friend_links?.length || 0}个优质站点，涵盖开发工具、设计资源、技术博客等多个领域。`;
      
      document.title = title;
      
      // 更新meta描述
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
      
      // 更新Open Graph标签
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);
      
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) ogDescription.setAttribute('content', description);
      
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', 'https://tools.aiqji.com/friends');
    }
  }, [websiteInfo]);

  // 生成SEO数据
  const seoData = websiteInfo ? {
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `友情链接 - ${websiteInfo.site_name}`,
      "description": `${websiteInfo.site_name}的友情链接页面`,
      "url": "https://tools.aiqji.com/friends",
      "inLanguage": "zh-CN",
      "isPartOf": {
        "@type": "WebSite",
        "name": websiteInfo.site_name,
        "url": "https://tools.aiqji.com"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "首页",
            "item": "https://tools.aiqji.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "友情链接",
            "item": "https://tools.aiqji.com/friends"
          }
        ]
      },
      "mainEntity": {
        "@type": "ItemList",
        "name": "友情链接列表",
        "description": "优质合作伙伴和推荐网站",
        "numberOfItems": websiteInfo.friend_links?.length || 0,
        "itemListElement": (websiteInfo.friend_links || []).map((link, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "WebSite",
            "name": link.name,
            "url": link.url,
            "description": link.description || `友情链接：${link.name}`,
            "image": link.icon
          }
        }))
      }
    }
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const friendLinks = websiteInfo?.friend_links || [];

  return (
    <>
      {/* SEO优化 */}
      {seoData && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(seoData.structuredData)
            }}
          />
        </>
      )}

      <div className="min-h-screen bg-background">
        {/* 固定返回首页按钮 - 顶部Header下方 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: showBackButton ? 1 : 0, 
            x: showBackButton ? 0 : -20,
            scale: showBackButton ? 1 : 0.8
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-20 left-6 z-40"
          style={{ pointerEvents: showBackButton ? 'auto' : 'none' }}
        >
          <Button
            variant="outline"
            size="sm"
            asChild
            className="bg-background/95 backdrop-blur-sm border-border/50 hover:bg-muted shadow-2xl drop-shadow-lg"
          >
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Link>
          </Button>
        </motion.div>

        {/* 页面头部 */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                友情链接
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                感谢以下优秀网站与我们建立友情链接，共同为用户提供更好的服务
              </p>
            </motion.div>
          </div>
        </div>

        {/* 友情链接内容 */}
        <div className="container mx-auto px-4 py-16">
          {friendLinks.length > 0 ? (
            <>
              {/* 统计信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-6 py-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">
                    共收录 <span className="text-primary font-bold">{friendLinks.length}</span> 个优质站点
                  </span>
                </div>
              </motion.div>

              {/* 友情链接网格 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                itemScope
                itemType="https://schema.org/ItemList"
              >
                {friendLinks.map((link, index) => (
                  <motion.article
                    key={`${link.url}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    className="group"
                    itemScope
                    itemType="https://schema.org/WebSite"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer external nofollow"
                      className="block p-6 bg-card border border-border rounded-lg hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group-hover:border-primary/30"
                      title={`访问友情链接：${link.name} - ${link.description || '优质合作伙伴'}`}
                      aria-label={`访问友情链接：${link.name}${link.description ? ` - ${link.description}` : ''}`}
                      data-friend-link={link.name}
                      itemProp="url"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        {link.icon ? (
                          <div className="w-12 h-12 bg-muted/30 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                            <img
                              src={link.icon}
                              alt={link.name}
                              className="w-8 h-8 object-contain rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const container = target.parentElement;
                              if (container) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-6 h-6 text-muted-foreground';
                                fallback.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>';
                                container.appendChild(fallback);
                              }
                            }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center">
                            <ExternalLink className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-semibold text-foreground group-hover:text-primary transition-colors truncate"
                            itemProp="name"
                          >
                            {link.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {new URL(link.url).hostname}
                          </p>
                          {link.description && (
                            <meta itemProp="description" content={link.description} />
                          )}
                        </div>
                      </div>
                      
                      {/* 网站描述 - 固定高度 */}
                      {link.description && (
                        <div className="mt-3 mb-3">
                          <p className="text-sm text-muted-foreground h-5 overflow-hidden leading-5 truncate">
                            {link.description}
                          </p>
                          {link.description.length > 50 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button 
                                  className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Info className="w-3 h-3" />
                                  查看详情
                                </button>
                              </DialogTrigger>
                              <DialogContent 
                                className="max-w-md"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    {link.icon ? (
                                      <div className="w-6 h-6 bg-muted/30 rounded-lg p-1 flex items-center justify-center overflow-hidden">
                                        <img 
                                          src={link.icon} 
                                          alt={link.name}
                                          className="w-4 h-4 object-contain rounded"
                                        />
                                      </div>
                                    ) : (
                                      <Globe className="w-6 h-6 text-muted-foreground" />
                                    )}
                                    {link.name}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 pt-2">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">网站地址</p>
                                    <p className="text-sm break-all">{link.url}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">网站简介</p>
                                    <p className="text-sm leading-relaxed">{link.description}</p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          点击访问
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </a>
                  </motion.article>
                ))}
              </motion.div>

              {/* 申请友链说明 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-16 text-center"
              >
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-8">
                  <Heart className="w-8 h-8 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-4">申请友情链接</h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    如果您希望与我们建立友情链接，可以
                    <Link
                      to="/friend-link-apply"
                      className="text-primary font-semibold hover:text-primary/80 underline underline-offset-2 transition-colors mx-1"
                    >
                      在线申请
                    </Link>
                    或者
                    <button
                      onClick={handleContactUs}
                      className="text-primary font-semibold hover:text-primary/80 underline underline-offset-2 transition-colors mx-1"
                    >
                      联系我们
                    </button>
                    。我们欢迎优质的网站加入我们的友链列表。
                  </p>
                  <div className="flex justify-center mb-6">
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link to="/friend-link-apply" className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        立即申请友链
                      </Link>
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      网站内容健康正面
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      网站访问速度良好
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      互惠互利原则
                    </span>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center py-16"
            >
              <Globe className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-4">暂无友情链接</h2>
              <p className="text-muted-foreground">
                我们正在寻找优质的合作伙伴，敬请期待。
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

export default FriendLinksPage;
