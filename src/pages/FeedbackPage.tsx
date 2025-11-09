import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSEO, SEOPresets } from '@/hooks/useSEO';
import FeedbackForm from '@/components/FeedbackForm';

export function FeedbackPage() {
  // 设置意见反馈页SEO
  useSEO({
    title: '意见反馈 - AiQiji工具箱',
    description: '提交您的意见和反馈，帮助我们改进AiQiji工具箱',
    keywords: ['意见反馈', '用户反馈', '建议', '问题反馈', 'AiQiji']
  });

  return (
    <>
      {/* SEO结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "意见反馈 - AiQiji工具箱",
            "description": "提交您的意见和反馈，帮助我们改进AiQiji工具箱",
            "url": `${window.location.origin}/feedback`,
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
                  "name": "意见反馈",
                  "item": `${window.location.origin}/feedback`
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
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Link>
          </Button>
        </motion.div>

        {/* 反馈表单区域 */}
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6"
            >
              <MessageSquare className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              意见反馈
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              您的意见对我们非常重要，我们会认真对待每一条反馈，并持续改进我们的服务
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <FeedbackForm />
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default FeedbackPage;

