import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSEO, SEOPresets } from '@/hooks/useSEO';
import FriendLinkApplicationForm from '@/components/FriendLinkApplicationForm';

export function FriendLinkApplicationPage() {
  // 设置友链申请页SEO
  useSEO(SEOPresets.friendLinkApplication());

  return (
    <>
      {/* SEO结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "友链申请 - AiQiji工具箱",
            "description": "申请与AiQiji工具箱建立友情链接",
            "url": `${window.location.origin}/friend-link-apply`,
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "首页",
                  "item": window.location.origin
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "友情链接",
                  "item": `${window.location.origin}/friends`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "友链申请",
                  "item": `${window.location.origin}/friend-link-apply`
                }
              ]
            }
          })
        }}
      />

      <div className="min-h-screen bg-background">
        {/* 固定返回按钮 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-6 z-40"
        >
          <Button
            variant="outline"
            size="sm"
            asChild
            className="bg-background/95 backdrop-blur-sm border-border/50 hover:bg-muted shadow-lg"
          >
            <Link to="/friends" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回友链页面
            </Link>
          </Button>
        </motion.div>

        {/* 申请表单区域 */}
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <FriendLinkApplicationForm />
          </motion.div>

          {/* 友链标准说明 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16"
          >
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-8">
              <div className="text-center mb-8">
                <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">友链标准</h2>
                <p className="text-muted-foreground">
                  为了维护良好的友链生态，我们制定了以下友链标准
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <h3 className="font-semibold mb-2">内容健康</h3>
                  <p className="text-sm text-muted-foreground">
                    网站内容积极正面，符合相关法律法规，无不良信息
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-semibold">⚡</span>
                  </div>
                  <h3 className="font-semibold mb-2">访问稳定</h3>
                  <p className="text-sm text-muted-foreground">
                    网站访问速度良好，稳定性高，用户体验佳
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 font-semibold">🤝</span>
                  </div>
                  <h3 className="font-semibold mb-2">互惠互利</h3>
                  <p className="text-sm text-muted-foreground">
                    遵循友链互换原则，建议先添加我们的友链
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-orange-600 font-semibold">📱</span>
                  </div>
                  <h3 className="font-semibold mb-2">移动适配</h3>
                  <p className="text-sm text-muted-foreground">
                    网站支持移动设备访问，响应式设计优先
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 font-semibold">🎯</span>
                  </div>
                  <h3 className="font-semibold mb-2">主题相关</h3>
                  <p className="text-sm text-muted-foreground">
                    网站主题与工具、技术、效率等领域相关更佳
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-teal-600 font-semibold">📈</span>
                  </div>
                  <h3 className="font-semibold mb-2">持续更新</h3>
                  <p className="text-sm text-muted-foreground">
                    网站内容定期更新，保持活跃度和新鲜感
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 联系方式 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <div className="bg-card border border-border rounded-lg p-8">
              <ExternalLink className="w-8 h-8 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-4">需要帮助？</h2>
              <p className="text-muted-foreground mb-6">
                如果您在申请过程中遇到任何问题，或者有特殊的合作需求，欢迎直接联系我们。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/friends">
                    查看现有友链
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => {
                  // 滚动到页面底部联系我们
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                  });
                }}>
                  联系我们
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default FriendLinkApplicationPage;
