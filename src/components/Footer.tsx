import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Github, 
  Mail, 
  Coffee, 
  Code,
  Brain,
  ExternalLink,
  Shield,
  FileText
} from 'lucide-react';
import { ComicText } from "./magicui/comic-text";
import {  AiOutlineX, AiOutlineZhihu } from "react-icons/ai";
import { TbBrandWechat } from "react-icons/tb";
import { SiCsdn } from "react-icons/si";
import { RiQqLine } from "react-icons/ri";
import { FaWordpress } from "react-icons/fa";
import { Button } from '@/components/ui/button';
import { SponsorModal } from './SponsorModal';
import { QRCodeTooltip } from './QRCodeTooltip';

/**
 * 页面底部组件
 * 包含版权信息、作者信息、外部链接等
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);

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
            为开发者、设计师和效率工具爱好者精心收集的工具导航站点
          </p>
        </div>
        
        {/* 主要内容区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* 关于项目 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="AiQiji工具箱"
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
                AiQiji工具箱
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

          {/* 快速链接 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">快速链接</h3>
            <div className="space-y-2">
              {[
                { label: 'AiQiji博客', href: 'https://aiqji.com', icon: FileText },
                { label: 'CS-Explorer', href: 'https://cs.aiqji.cn/', icon: Code },
                { label: 'AiQiji智能博客插件', href: 'https://wpai.aiqji.com/', icon: Brain },
              ].map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  {...(link.href.startsWith('http') ? {
                    target: '_blank',
                    rel: 'noopener noreferrer'
                  } : {})}
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </motion.a>
              ))}
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
              </div>
              
              <p className="text-xs text-muted-foreground">
                有好的工具推荐或技术交流？欢迎通过以上方式联系我们！
              </p>
            </div>
          </div>
        </div>

        {/* 分割线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent mb-6" />

        {/* 版权信息 */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {currentYear} AiQiji工具箱. All rights reserved.
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <a href="#privacy" className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <Shield className="w-3 h-3" />
                <span>隐私政策</span>
              </a>
              <span>•</span>
              <a href="#terms" className="flex items-center space-x-1 hover:text-foreground transition-colors">
                <FileText className="w-3 h-3" />
                <span>使用条款</span>
              </a>
            </div>
            <div className="flex items-center space-x-1">
              <Code className="w-3 h-3" />
              <span>React + TypeScript</span>
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
