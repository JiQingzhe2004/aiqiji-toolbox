import React from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Scale, Users, Globe, Calendar } from 'lucide-react';
import packageJson from '../../package.json';

/**
 * 使用条款页面
 */
export default function TermsPage() {
  const currentDate = new Date().toLocaleDateString('zh-CN');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* 页面标题 */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <FileText className="w-16 h-16 text-violet-500" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              使用条款
            </h1>
            <p className="text-muted-foreground">
              最后更新日期：{currentDate}
            </p>
          </div>

          {/* 条款内容 */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            
            {/* 接受条款 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Scale className="w-6 h-6 text-violet-500" />
                接受条款
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                欢迎使用AiQiji工具箱。通过访问和使用本网站，您同意遵守以下使用条款。
                如果您不同意这些条款，请不要使用本网站。我们保留随时修改这些条款的权利。
              </p>
            </section>

            {/* 服务描述 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Globe className="w-6 h-6 text-violet-500" />
                服务描述
              </h2>
              <p className="text-muted-foreground">
                AiQiji工具箱是一个免费的工具导航网站，为开发者、设计师和效率工具爱好者提供：
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 精心整理的工具和资源链接</li>
                <li>• 分类浏览和搜索功能</li>
                <li>• 工具评价和推荐</li>
                <li>• 相关技术文章和教程</li>
                <li>• 社区交流和分享平台</li>
              </ul>
            </section>

            {/* 使用规则 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Users className="w-6 h-6 text-violet-500" />
                使用规则
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-green-600">✅ 允许的使用</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 个人学习和研究目的</li>
                  <li>• 商业项目中的工具发现和使用</li>
                  <li>• 分享和推荐给他人</li>
                  <li>• 提供反馈和建议</li>
                  <li>• 合理的自动化访问（遵循robots.txt）</li>
                </ul>

                <h3 className="text-xl font-medium text-red-600">❌ 禁止的行为</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 进行任何非法活动</li>
                  <li>• 上传恶意软件或病毒</li>
                  <li>• 尝试未经授权访问系统</li>
                  <li>• 过度的自动化请求（DDoS攻击）</li>
                  <li>• 复制网站内容用于商业目的</li>
                  <li>• 发布虚假或误导性信息</li>
                  <li>• 侵犯他人知识产权</li>
                </ul>
              </div>
            </section>

            {/* 知识产权 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">知识产权</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">网站内容</h3>
                <p className="text-muted-foreground">
                  本网站的设计、布局、图标、文案等原创内容归AiQiji团队所有。
                  工具链接和描述信息主要来源于公开渠道，我们努力确保信息的准确性。
                </p>

                <h3 className="text-lg font-medium">第三方内容</h3>
                <p className="text-muted-foreground">
                  本网站包含指向第三方网站的链接。这些链接仅为方便用户提供，
                  我们不对第三方网站的内容、隐私政策或做法负责。
                </p>

                <h3 className="text-lg font-medium">用户贡献</h3>
                <p className="text-muted-foreground">
                  您提交给我们的任何建议、反馈或内容，您授予我们使用、修改和展示这些内容的权利。
                </p>
              </div>
            </section>

            {/* 免责声明 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                免责声明
              </h2>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-2">
                  重要提醒
                </h3>
                <ul className="space-y-2 text-amber-700 dark:text-amber-300 text-sm">
                  <li>• 本网站按"现状"提供，不提供任何明示或暗示的保证</li>
                  <li>• 我们不保证网站服务的连续性、准确性或无错误</li>
                  <li>• 第三方工具的功能、安全性和可用性由其提供商负责</li>
                  <li>• 使用第三方工具的风险完全由用户承担</li>
                  <li>• 我们不对因使用本网站或相关工具造成的任何损失负责</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium">数据准确性</h3>
              <p className="text-muted-foreground">
                我们努力保持工具信息的准确性和时效性，但无法保证所有信息都是最新的。
                建议用户在使用任何工具前，自行验证其功能和安全性。
              </p>
            </section>

            {/* 隐私和数据 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">隐私和数据保护</h2>
              <p className="text-muted-foreground">
                您的隐私对我们很重要。请查看我们的
                <a href="/privacy" className="text-violet-600 hover:text-violet-700 underline mx-1">
                  隐私政策
                </a>
                了解我们如何收集、使用和保护您的信息。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded">
                  <h4 className="font-medium text-sm">数据收集</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    仅收集必要的使用统计和分析数据
                  </p>
                </div>
                <div className="p-3 border rounded">
                  <h4 className="font-medium text-sm">数据安全</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    采用行业标准的安全措施保护数据
                  </p>
                </div>
              </div>
            </section>

            {/* 服务变更 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">服务变更和终止</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 我们保留随时修改、暂停或终止服务的权利</li>
                <li>• 重大变更会提前通过网站公告通知用户</li>
                <li>• 您可以随时停止使用我们的服务</li>
                <li>• 违反使用条款的用户可能被禁止访问</li>
              </ul>
            </section>

            {/* 适用法律 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">适用法律</h2>
              <p className="text-muted-foreground">
                本使用条款受中华人民共和国法律管辖。任何争议将通过友好协商解决，
                协商不成的，提交有管辖权的人民法院裁决。
              </p>
            </section>

            {/* 联系信息 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">联系我们</h2>
              <p className="text-muted-foreground">
                如果您对这些使用条款有任何疑问，请联系我们：
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>邮箱：</strong> jqz1215@qq.com<br/>
                  <strong>网站：</strong> https://aiqji.com<br/>
                  <strong>地址：</strong> 中国
                </p>
              </div>
            </section>

            {/* 条款更新 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-violet-500" />
                条款更新
              </h2>
              <p className="text-muted-foreground">
                我们可能会定期更新这些使用条款以反映服务变更或法律要求。
                更新后的条款将在本页面发布，重大变更会通过适当方式通知用户。
                继续使用本网站即表示您接受更新后的条款。
              </p>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <strong>生效日期：</strong>2025年9月9日<br/>
                <strong>版本：</strong>{packageJson.version}
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
