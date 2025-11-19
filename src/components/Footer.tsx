import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Github,
  Mail, 
  Coffee, 
  ExternalLink,
  Shield,
  FileText,
  Cookie,
  Users,
  Award
} from 'lucide-react';
import { isMobile, BrowserView, MobileView } from 'react-device-detect';
import { ComicText } from "./magicui/comic-text";
import { AnimatedShinyText } from "./magicui/animated-shiny-text";
import { SEOImage, SEOImagePresets } from '@/components/SEOImage';
// 按需导入社交媒体图标以减少打包体积
import { AiOutlineX, AiOutlineZhihu } from "react-icons/ai";
import { TbBrandWechat } from "react-icons/tb";
import { SiCsdn } from "react-icons/si";
import { RiQqLine } from "react-icons/ri";
import { FaWordpress } from "react-icons/fa";
import { Button } from '@/components/ui/button';
import { SponsorModal } from './SponsorModal';
import { QRCodeTooltip } from './QRCodeTooltip';
import { settingsApi } from '@/services/settingsApi';
import type { WebsiteInfo } from '@/services/settingsApi';
import packageJson from '../../package.json';

type FriendLink = NonNullable<WebsiteInfo['friend_links']>[number];

const FriendLinkIcon: React.FC<{ link: FriendLink }> = ({ link }) => {
  const [iconError, setIconError] = useState(false);
  const fallbackChar = (link.name?.trim()?.charAt(0) || '友').toUpperCase();

  if (!link.icon || iconError) {
    return (
      <div
        className="w-4 h-4 rounded-sm bg-muted text-[10px] font-semibold text-foreground/80 flex items-center justify-center uppercase"
        aria-hidden="true"
      >
        {fallbackChar}
      </div>
    );
  }

  return (
    <SEOImage
      {...SEOImagePresets.friendLinkIcon(link.icon, link.name)}
      className="w-4 h-4 object-contain rounded-sm"
      description={`友情链接：${link.name}的网站图标`}
      onError={() => setIconError(true)}
    />
  );
};

/**
 * 页面底部组件
 * 包含版权信息、作者信息、外部链接等
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [websiteInfo, setWebsiteInfo] = useState<WebsiteInfo | null>(null);

  // 获取网站信息
  useEffect(() => {
    const fetchWebsiteInfo = async () => {
      try {
        const info = await settingsApi.getWebsiteInfo();
        setWebsiteInfo(info);
      } catch (error) {
        console.error('获取网站信息失败:', error);
        // 设置默认值
        setWebsiteInfo({
          site_name: 'AiQiji工具箱',
          site_url: 'https://aiqiji.com',
          site_icon: '/favicon.ico',
          site_description: '为开发者、设计师和效率工具爱好者精心收集的工具导航站点',
          icp_number: '',
          show_icp: false
        });
      }
    };

    fetchWebsiteInfo();
  }, []);

  // 加载51.la数据统计脚本
  useEffect(() => {
    const script = document.createElement('script');
    script.id = 'LA-DATA-WIDGET';
    script.crossOrigin = 'anonymous';
    script.charset = 'UTF-8';
    script.src = 'https://v6-widget.51.la/v6/3NQ4sGiyrhidvRH8/quote.js?theme=0&f=12&display=0,1,0,0,0,0,0,1';
    
    const container = document.getElementById('la-data-widget-container');
    if (container) {
      container.appendChild(script);
    }

    // 清理函数
    return () => {
      const existingScript = document.getElementById('LA-DATA-WIDGET');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <>
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-auto border-t border-muted-foreground/10 bg-background/50 backdrop-blur-sm pb-20 md:pb-0"
    >
      <div className="container mx-auto px-4 py-12">
        {/* 顶部大标题 */}
        <div className="text-center mb-12">
          <div className="mb-4">
            {/* 手机端使用较小字体，桌面端使用大字体 */}
            <div className="block md:hidden">
              <ComicText fontSize={3}>AiQiji·Tools</ComicText>
            </div>
            <div className="hidden md:block">
              <ComicText fontSize={5}>AiQiji·Tools</ComicText>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {websiteInfo?.site_description || '为开发者、设计师和效率工具爱好者精心收集的工具导航站点'}
          </p>
        </div>
        
        {/* 主要内容区 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* 关于项目 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <SEOImage 
                {...SEOImagePresets.websiteLogo(
                  websiteInfo?.site_icon || "/logo.png", 
                  websiteInfo?.site_name || "AiQiji工具箱"
                )}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // 如果图片加载失败，显示备用图标
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center';
                  fallback.innerHTML = '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>';
                  target.parentElement!.appendChild(fallback);
                }}
              />
              <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
                {websiteInfo?.site_name || 'AiQiji工具箱'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              为开发者、设计师和效率工具爱好者精心收集的工具导航站点。
              让工作更高效，让创作更便捷。
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
              <span>by AiQiji Team</span>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">联系我们</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-muted"
                  title="请我们喝咖啡"
                  onClick={() => setIsSponsorModalOpen(true)}
                >
                  <Coffee className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-xl hover:bg-muted"
                >
                  <a
                    href="https://github.com/JiQingzhe2004"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub - JiQingzhe2004"
                    title="查看GitHub仓库"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-xl hover:bg-muted"
                >
                  <a
                    href="mailto:jqz1215@qq.com"
                    aria-label="发送邮件"
                    title="发送邮件到 jqz1215@qq.com"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-xl hover:bg-muted"
                >
                  <a
                    href="https://x.com/aiqiji"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="关注X (Twitter)"
                    title="关注X (Twitter)"
                  >
                    <AiOutlineX className="w-5 h-5" />
                  </a>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-xl hover:bg-muted"
                >
                  <a
                    href="https://www.zhihu.com/people/aiqji"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="关注知乎"
                    title="关注知乎"
                  >
                    <AiOutlineZhihu className="w-5 h-5" />
                  </a>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-xl hover:bg-muted"
                >
                  <a
                    href="https://blog.csdn.net/j304028273"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="关注CSDN博客"
                    title="关注CSDN博客"
                  >
                    <SiCsdn className="w-5 h-5" />
                  </a>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-xl hover:bg-muted"
                >
                  <a
                    href="https://aiqji.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="访问AiQiji博客"
                    title="访问AiQiji博客"
                  >
                    <FaWordpress className="w-5 h-5" />
                  </a>
                </Button>
                
<MobileView>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="rounded-xl hover:bg-muted"
                  >
                    <a
                      href="https://qm.qq.com/q/qgHLoJ6vke"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="添加QQ好友"
                      title="添加QQ好友"
                    >
                      <RiQqLine className="w-5 h-5" />
                    </a>
                  </Button>
                </MobileView>
                <BrowserView>
                  <QRCodeTooltip
                    url="https://qm.qq.com/q/qgHLoJ6vke"
                    title="添加QQ好友"
                    position="top"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl hover:bg-muted"
                      aria-label="添加QQ好友"
                      title="悬停查看QQ二维码"
                    >
                      <RiQqLine className="w-5 h-5" />
                    </Button>
                  </QRCodeTooltip>
                </BrowserView>
                
<MobileView>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="rounded-xl hover:bg-muted"
                  >
                    <a
                      href="https://u.wechat.com/MB9BaFGvZO39R3MpoQ165dk?s=3"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="添加微信好友"
                      title="添加微信好友"
                    >
                      <TbBrandWechat className="w-5 h-5" />
                    </a>
                  </Button>
                </MobileView>
                <BrowserView>
                  <QRCodeTooltip
                    url="https://u.wechat.com/MB9BaFGvZO39R3MpoQ165dk?s=3"
                    title="添加微信好友"
                    position="top"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl hover:bg-muted"
                      aria-label="添加微信好友"
                      title="悬停查看微信二维码"
                    >
                      <TbBrandWechat className="w-5 h-5" />
                    </Button>
                  </QRCodeTooltip>
                </BrowserView>
              </div>
              
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  有好的工具推荐或技术交流？欢迎通过以上方式联系我们！
                </p>
                {/* 51.la数据统计 */}
                <div id="la-data-widget-container"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 友情链接 - SEO优化版本 */}
        {Array.isArray(websiteInfo?.friend_links) && websiteInfo!.friend_links.length > 0 && (
          <>
            {/* 友情链接结构化数据 */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  "name": websiteInfo?.site_name || "AiQiji工具箱",
                  "url": window.location.origin,
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": `${window.location.origin}/?search={search_term_string}`
                    },
                    "query-input": "required name=search_term_string"
                  },
                  "relatedLink": websiteInfo.friend_links.map((link: any) => ({
                    "@type": "URL",
                    "url": link.url,
                    "name": link.name,
                    "description": `友情链接：${link.name}`
                  }))
                })
              }}
            />
            <section className="mb-6" aria-label="友情链接">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-medium text-foreground text-sm">友情链接</h3>
                <Link 
                  to="/friends" 
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  查看更多
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <nav className="flex items-start flex-wrap gap-3 text-sm text-muted-foreground" role="navigation" aria-label="友情链接导航">
              {websiteInfo!.friend_links.map((link, idx) => (
                <a
                  key={`${link.url}-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer external"
                  className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 hover:text-foreground transition-colors"
                  title={`访问 ${link.name}`}
                  aria-label={`访问友情链接：${link.name}`}
                >
                  <FriendLinkIcon link={link} />
                  <span>{link.name}</span>
                </a>
              ))}
            </nav>
          </section>
          </>
        )}

        {/* 分割线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent mb-6" />

        {/* 版权信息 */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          {/* 桌面端布局 - 保持原有样式 */}
          <div className="hidden sm:flex flex-row justify-between items-center w-full">
            {/* 左侧：版权信息 */}
            <div className="flex flex-row items-center space-x-3">
              <div className="text-sm text-muted-foreground">
                © {currentYear} {websiteInfo?.site_name || 'AiQiji工具箱'}. All rights reserved.
              </div>
              <div className="flex items-center">
                <AnimatedShinyText className="text-xs font-medium">
                  ✨ 工具箱版本 · v{packageJson.version}
                </AnimatedShinyText>
              </div>
            </div>
            
            {/* 中间：备案号显示 */}
            {websiteInfo?.show_icp && websiteInfo?.icp_number && (
              <motion.a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Award className="w-3 h-3" />
                {websiteInfo.icp_number}
              </motion.a>
            )}
            
            {/* 右侧：政策链接 */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <Shield className="w-3 h-3" />
                <span>隐私政策</span>
              </Link>
              <span>•</span>
              <Link to="/friends" className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <Users className="w-3 h-3" />
                <span>友情链接</span>
              </Link>
              <span>•</span>
              <Link to="/terms" className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <FileText className="w-3 h-3" />
                <span>使用条款</span>
              </Link>
              <span>•</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('cookie-consent');
                  localStorage.removeItem('cookie-consent-date');
                  window.location.reload();
                }}
                className="flex items-center space-x-1 hover:text-foreground transition-colors"
              >
                <Cookie className="w-3 h-3" />
                <span>Cookie设置</span>
              </button>
            </div>
          </div>

          {/* 手机端布局 - 新的垂直堆叠布局 */}
          <div className="flex sm:hidden flex-col items-center space-y-3 w-full text-center">
            {/* 第一行：备案信息 */}
            {websiteInfo?.show_icp && websiteInfo?.icp_number && (
              <motion.a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Award className="w-3 h-3" />
                {websiteInfo.icp_number}
              </motion.a>
            )}
            
            {/* 第二行：工具箱版本和Cookie */}
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <AnimatedShinyText className="text-xs font-medium">
                  ✨ 工具箱版本 · v{packageJson.version}
                </AnimatedShinyText>
              </div>
              <span>•</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('cookie-consent');
                  localStorage.removeItem('cookie-consent-date');
                  window.location.reload();
                }}
                className="flex items-center space-x-1 hover:text-foreground transition-colors"
              >
                <Cookie className="w-3 h-3" />
                <span>Cookie</span>
              </button>
            </div>
            
            {/* 第三行：隐私政策、友情链接、使用条款 */}
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <Shield className="w-3 h-3" />
                <span>隐私政策</span>
              </Link>
              <span>•</span>
              <Link to="/friends" className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <Users className="w-3 h-3" />
                <span>友情链接</span>
              </Link>
              <span>•</span>
              <Link to="/terms" className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <FileText className="w-3 h-3" />
                <span>使用条款</span>
              </Link>
            </div>
            
            {/* 第四行：版权信息 */}
            <div className="text-sm text-muted-foreground">
              © {currentYear} {websiteInfo?.site_name || 'AiQiji工具箱'}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
    
    {/* 赞助弹窗 */}
    <SponsorModal 
      isOpen={isSponsorModalOpen} 
      onClose={() => setIsSponsorModalOpen(false)} 
    />
  </>
  );
}
