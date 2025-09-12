import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Zap } from 'lucide-react';
import { SEOImage, SEOImagePresets } from '@/components/SEOImage';

/**
 * 感谢支持组件
 * 展示对项目提供支持的服务和平台
 */
export function ThanksSection() {

  const supporters = [
    {
      name: 'Cloudflare',
      description: '全球CDN加速与安全防护',
      iconUrl: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/cloudflare-color.png',
      url: 'https://www.cloudflare.com',
      color: 'text-orange-500',
      bgGradient: 'from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      iconBg: 'bg-white dark:bg-gray-800',
      isThemed: false
    },
    {
      name: 'Google',
      description: 'AI技术与云计算服务',
      iconUrl: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/google-color.png',
      url: 'https://about.google/',
      color: 'text-blue-600',
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      iconBg: 'bg-white dark:bg-gray-800',
      isThemed: false
    },
    {
      name: 'GitHub',
      description: '代码托管与版本控制',
      iconUrl: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/github.png',
      url: 'https://github.com/JiQingzhe2004',
      color: 'text-gray-700 dark:text-gray-300',
      bgGradient: 'from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20',
      iconBg: 'bg-white dark:bg-gray-800',
      isThemed: false
    }
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="py-6 md:py-8"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* 支持者卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4">
          {supporters.map((supporter, index) => (
            <motion.a
              key={supporter.name}
              href={supporter.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                group relative overflow-hidden rounded-3xl border border-border/50
                bg-gradient-to-br ${supporter.bgGradient}
                hover:border-border hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-violet-500/50
              `}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.4 + index * 0.15,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* 卡片内容 */}
              <div className="relative p-4 md:p-6">
                <div className="flex items-center space-x-4">
                  {/* 图标容器 */}
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-xl 
                    ${supporter.iconBg}
                    flex items-center justify-center shadow-lg
                    group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
                    p-2
                  `}>
                    <SEOImage 
                      src={supporter.iconUrl as string} 
                      alt={`${supporter.name} - 支持企业Logo`}
                      title={`感谢 ${supporter.name} 的支持`}
                      description={`${supporter.name}: ${supporter.description}`}
                      className="w-8 h-8 object-contain"
                      keywords={[supporter.name, '支持', '企业', 'logo']}
                      imageType="logo"
                      loading="lazy"
                      onError={(e) => {
                        // 如果图片加载失败，显示文字备用
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center justify-center w-8 h-8 border border-gray-300 rounded';
                          fallback.textContent = supporter.name.substring(0, 2);
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  
                  {/* 文本内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`text-lg font-bold ${supporter.color} group-hover:scale-105 transition-transform duration-300`}>
                        {supporter.name}
                      </h3>
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {supporter.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* 悬停效果光晕 */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-cyan-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:via-cyan-500/5 group-hover:to-violet-500/5 transition-all duration-500 rounded-3xl" />
            </motion.a>
          ))}
        </div>

        {/* 底部标识 */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-muted/30 border border-border/30">
            <Zap className="w-4 h-4 text-violet-500" />
            <span className="text-sm text-muted-foreground">
            用心做好导航，感谢以上伙伴一路陪伴！
            </span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
