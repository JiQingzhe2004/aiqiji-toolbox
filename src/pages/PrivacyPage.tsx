import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Cookie, BarChart3, Database, Mail, Calendar } from 'lucide-react';

/**
 * 隐私政策页面
 */
export default function PrivacyPage() {
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
              <Shield className="w-16 h-16 text-violet-500" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              隐私政策
            </h1>
            <p className="text-muted-foreground">
              最后更新日期：{currentDate}
            </p>
          </div>

          {/* 政策内容 */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            
            {/* 引言 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="w-6 h-6 text-violet-500" />
                引言
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                AiQiji工具箱（以下简称"我们"）非常重视您的隐私保护。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。
                使用我们的服务即表示您同意本隐私政策的条款。
              </p>
            </section>

            {/* 信息收集 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Database className="w-6 h-6 text-violet-500" />
                我们收集的信息
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium">自动收集的信息</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 访问日志：IP地址、浏览器类型、访问时间、页面访问记录</li>
                  <li>• 设备信息：操作系统、屏幕分辨率、设备类型</li>
                  <li>• 使用统计：页面浏览量、点击行为、停留时间</li>
                </ul>

                <h3 className="text-xl font-medium">主动提供的信息</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 联系信息：当您主动联系我们时提供的邮箱地址</li>
                  <li>• 反馈内容：您提交的意见建议或问题报告</li>
                  <li>• 偏好设置：主题选择、语言设置等个性化偏好</li>
                </ul>
              </div>
            </section>

            {/* 信息使用 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-violet-500" />
                信息使用目的
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>服务提供</strong>：确保网站正常运行和功能实现</li>
                <li>• <strong>用户体验优化</strong>：分析使用模式，改进网站设计和功能</li>
                <li>• <strong>安全保障</strong>：检测和防范恶意活动、保护网站安全</li>
                <li>• <strong>技术支持</strong>：响应用户咨询和技术问题</li>
                <li>• <strong>法律合规</strong>：遵守适用的法律法规要求</li>
              </ul>
            </section>

            {/* 第三方服务 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Cookie className="w-6 h-6 text-violet-500" />
                第三方服务和Cookie
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium">我们使用的第三方服务</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Google Analytics</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      用于网站流量分析和用户行为统计
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Cloudflare</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      提供CDN加速和安全防护服务
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-medium">Cookie使用说明</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>必要Cookie</strong>：确保网站基本功能正常工作</li>
                  <li>• <strong>分析Cookie</strong>：帮助我们了解网站使用情况</li>
                  <li>• <strong>功能Cookie</strong>：记住您的偏好设置</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  您可以通过浏览器设置管理Cookie，或通过我们的Cookie偏好设置进行控制。
                </p>
              </div>
            </section>

            {/* 信息保护 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="w-6 h-6 text-violet-500" />
                信息安全保护
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 采用HTTPS加密传输，保护数据传输安全</li>
                <li>• 实施访问控制，限制内部人员访问权限</li>
                <li>• 定期安全审计，及时发现和修复潜在风险</li>
                <li>• 数据备份保护，防止意外丢失</li>
                <li>• 遵循最小必要原则，只收集必要的信息</li>
              </ul>
            </section>

            {/* 用户权利 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">您的权利</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">访问权</h3>
                  <p className="text-sm text-muted-foreground">
                    您有权了解我们收集了您的哪些个人信息
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">更正权</h3>
                  <p className="text-sm text-muted-foreground">
                    您有权要求我们更正不准确的个人信息
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">删除权</h3>
                  <p className="text-sm text-muted-foreground">
                    在特定条件下，您有权要求删除个人信息
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">反对权</h3>
                  <p className="text-sm text-muted-foreground">
                    您有权反对某些数据处理活动
                  </p>
                </div>
              </div>
            </section>

            {/* 联系我们 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Mail className="w-6 h-6 text-violet-500" />
                联系我们
              </h2>
              <p className="text-muted-foreground">
                如果您对本隐私政策有任何疑问，或希望行使您的隐私权利，请通过以下方式联系我们：
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>邮箱：</strong> jqz1215@qq.com<br/>
                  <strong>网站：</strong> https://aiqji.com<br/>
                  <strong>响应时间：</strong> 我们将在收到请求后30个工作日内回复
                </p>
              </div>
            </section>

            {/* 政策更新 */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-violet-500" />
                政策更新
              </h2>
              <p className="text-muted-foreground">
                我们可能会不时更新本隐私政策。重大变更时，我们会通过网站公告或其他适当方式通知您。
                请定期查看本页面以了解最新的隐私政策。
              </p>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
