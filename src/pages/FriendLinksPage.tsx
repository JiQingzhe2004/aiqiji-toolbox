import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Globe, Users, Heart, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

  // 设置页面标题和描述
  useEffect(() => {
    document.title = `友情链接 - ${websiteInfo?.site_name || 'AiQiji工具箱'}`;
    
    // 添加meta描述
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${websiteInfo?.site_name || 'AiQiji工具箱'}的友情链接页面，展示我们的合作伙伴和推荐网站。`);
    }
  }, [websiteInfo]);

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
      {/* SEO结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `友情链接 - ${websiteInfo?.site_name || 'AiQiji工具箱'}`,
            "description": `${websiteInfo?.site_name || 'AiQiji工具箱'}的友情链接页面`,
            "url": `${window.location.origin}/friends`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": friendLinks.length,
              "itemListElement": friendLinks.map((link, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "WebSite",
                  "name": link.name,
                  "url": link.url,
                  "description": link.description || `友情链接：${link.name}`
                }
              }))
            }
          })
        }}
      />

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
              >
                {friendLinks.map((link, index) => (
                  <motion.article
                    key={`${link.url}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    className="group"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer external"
                      className="block p-6 bg-card border border-border rounded-lg hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group-hover:border-primary/30"
                      title={`访问 ${link.name}`}
                      aria-label={`访问友情链接：${link.name}`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        {link.icon ? (
                          <img
                            src={link.icon}
                            alt={link.name}
                            className="w-12 h-12 object-contain rounded-lg bg-muted/30 p-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center';
                                fallback.innerHTML = '<svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center">
                            <ExternalLink className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {link.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {new URL(link.url).hostname}
                          </p>
                        </div>
                      </div>
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
                    如果您希望与我们建立友情链接，欢迎
                    <button
                      onClick={handleContactUs}
                      className="text-primary font-semibold hover:text-primary/80 underline underline-offset-2 transition-colors mx-1"
                    >
                      联系我们
                    </button>
                    。我们欢迎优质的网站加入我们的友链列表。
                  </p>
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
