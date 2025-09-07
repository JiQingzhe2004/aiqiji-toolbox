import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Github, Mail, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 页面底部组件
 * 包含版权信息、作者信息、外部链接等
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-auto border-t border-muted-foreground/10 bg-background/50 backdrop-blur-sm"
    >
      <div className="container mx-auto px-4 py-8">
        {/* 主要内容区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* 关于项目 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              AiQiji工具箱
            </h3>
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
                { label: '所有工具', href: '#tools' },
                { label: '开发工具', href: '#dev' },
                { label: '设计工具', href: '#design' },
                { label: 'AI工具', href: '#ai' },
                { label: '使用帮助', href: '#help' },
              ].map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  {link.label}
                </motion.a>
              ))}
            </div>
          </div>

          {/* 联系方式 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">联系我们</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="rounded-xl hover:bg-muted"
                >
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
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
                    href="mailto:contact@aiqiji.com"
                    aria-label="发送邮件"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-muted"
                  title="请我们喝咖啡"
                >
                  <Coffee className="w-5 h-5" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                有好的工具推荐？欢迎联系我们！
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
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <a href="#privacy" className="hover:text-foreground transition-colors">
              隐私政策
            </a>
            <span>•</span>
            <a href="#terms" className="hover:text-foreground transition-colors">
              使用条款
            </a>
            <span>•</span>
            <span>
              Built with React & TypeScript
            </span>
          </div>
        </div>
      </div>
      
      {/* 底部装饰 */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500" />
    </motion.footer>
  );
}
