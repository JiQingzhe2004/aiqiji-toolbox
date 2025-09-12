import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Highlighter } from '@/components/magicui/highlighter';
import { useSEO, SEOPresets } from '@/hooks/useSEO';

/**
 * 外链跳转提醒页面
 * 在打开外部链接前显示安全提醒
 */
export default function ExternalLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const url = searchParams.get('url');
  const name = searchParams.get('name') || '外部工具';
  const iconUrl = searchParams.get('icon');
  const returnUrl = searchParams.get('return') || '/';

  // 设置外部链接页SEO
  useSEO(SEOPresets.externalLink(name));

  useEffect(() => {
    if (!url) {
      // 如果没有URL参数，返回首页
      window.close();
      return;
    }
  }, [url]);

  // 确认跳转
  const handleConfirm = () => {
    if (url) {
      window.location.href = url;
    }
  };

  // 取消跳转
  const handleCancel = () => {
    if (returnUrl && returnUrl !== '/') {
      // 如果有返回URL，跳转回去
      navigate(returnUrl);
    } else {
      // 否则关闭窗口
      window.close();
    }
  };

  // 如果没有URL，显示错误
  if (!url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">参数错误</h1>
          <p className="text-muted-foreground mb-4">缺少必要的跳转参数</p>
          <Button 
            onClick={() => window.close()} 
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            关闭页面
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center w-full px-4 bg-gradient-to-br from-background via-muted/10 to-background relative overflow-hidden">
      {/* 静态线条背景 */}
      <div className="absolute inset-0 opacity-5">
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 800"
        >
          <path
            d="M0,400 Q300,200 600,400 T1200,400"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-foreground"
          />
          <path
            d="M0,300 Q400,100 800,300 T1200,300"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className="text-foreground"
          />
          <path
            d="M0,500 Q200,300 400,500 T800,500 T1200,500"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className="text-foreground"
          />
        </svg>
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-lg w-full relative z-20"
      >
        <Card className="p-8 shadow-xl border-0 bg-background/80 backdrop-blur-[1px] relative z-20">
          {/* 头部图标 */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white mb-4 overflow-hidden"
            >
              {iconUrl ? (
                <img 
                  src={iconUrl} 
                  alt={`${name} logo`}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    // 如果图片加载失败，显示默认图标
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <ExternalLink className={`w-8 h-8 ${iconUrl ? 'hidden fallback-icon' : ''}`} />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground">外部链接跳转</h1>
          </div>

          {/* 内容区域 */}
          <div className="space-y-6">
            {/* 工具信息 */}
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">您即将访问外部工具：</p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold text-foreground text-lg">{name}</p>
                <p className="text-sm text-muted-foreground mt-1 break-all">{url}</p>
              </div>
            </div>

            {/* 安全提醒 */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">安全提醒</p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    您即将离开本站访问
                    <Highlighter action="highlight" color="#87CEEB">
                      外部链接
                    </Highlighter>
                    ，请确认该
                    <Highlighter action="underline" color="#4A90E2">
                      链接来源可信
                    </Highlighter>
                    。我们不对外部网站的安全性和内容负责。-
                    <Highlighter action="underline" color="#20B2AA">
                      AiQiji
                    </Highlighter>
                  </p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                取消
              </Button>
              
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                确认访问
              </Button>
            </div>

            {/* 底部说明 */}
            <p className="text-xs text-center text-muted-foreground">
              点击"确认访问"将在当前页面打开外部链接
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
