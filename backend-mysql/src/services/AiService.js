import OpenAI from 'openai';
import { SettingsService } from './SettingsService.js';

export class AiService {
  constructor() {
    this.settingsService = new SettingsService();
    this.client = null;
  }

  async getClient() {
    if (this.client) return this.client;
    const enabled = await this.settingsService.getSettingValue('ai_enabled');
    if (!enabled) throw new Error('AI 未启用');
    const apiKey = await this.settingsService.getSettingValue('ai_api_key');
    const baseURL = (await this.settingsService.getSettingValue('ai_base_url')) || 'https://open.bigmodel.cn/api/paas/v4';
    if (!apiKey) throw new Error('未配置 AI API Key');
    this.client = new OpenAI({ apiKey, baseURL });
    return this.client;
  }

  async getModel() {
    return (await this.settingsService.getSettingValue('ai_model')) || 'glm-4.5';
  }

  buildSystemPrompt(siteName) {
    const currentYear = new Date().getFullYear();
    return `你是专业邮件HTML生成专家。将用户文本转为精美的营销/通知邮件HTML。

【输出格式】
- 直接输出HTML代码，首字符<，末字符>
- 禁止markdown语法和代码块标签（如\`\`\`html）

【视觉设计】
- 现代简约风格，色彩和谐有层次
- 行高1.5-1.6，段落间距适中
- 圆角8-12px，细腻阴影（box-shadow: 0 2px 10px rgba(0,0,0,0.05)）
- 留白充足，避免拥挤

【结构要求】
- 头部：品牌标识"${siteName || 'AiQiji·工具箱'}"
- 主体：标题 + 内容区 + 分隔线
- 页脚：版权信息"© ${currentYear} ${siteName || 'AiQiji·工具箱'}"
- 使用语义化标签：<header>、<main>、<section>、<footer>

【技术规范】
- 所有样式用内联style属性
- 兼容Outlook/Gmail/Apple Mail
- 使用table+div混合布局
- 颜色用十六进制，背景可用rgba
- 禁止按钮、链接、地址信息

立即输出HTML：`;
  }

  async renderEmailHTML({ subject, text }) {
    const client = await this.getClient();
    const model = await this.getModel();
    const siteName = (await this.settingsService.getSettingValue('site_name')) || 'AiQiji工具箱';
    const sys = this.buildSystemPrompt(siteName);
    const user = `主题：${subject || '通知'}\n内容：\n${text || ''}`;
    try {
      const resp = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user }
        ],
        temperature: 0.7
      });
      const html = resp.choices?.[0]?.message?.content || '';
      if (!html.includes('<html')) throw new Error('AI 未返回有效HTML');
      return { success: true, html };
    } catch (e) {
      return { success: false, message: e?.message || 'AI 生成失败' };
    }
  }

  /**
   * 流式渲染邮件HTML
   * @param {Object} params - 参数对象
   * @param {string} params.subject - 邮件主题
   * @param {string} params.text - 邮件文本内容
   * @returns {AsyncGenerator} 返回流式生成器
   */
  async *renderEmailHTMLStream({ subject, text }) {
    // 并行获取所有配置，减少等待时间
    const [client, model, siteName] = await Promise.all([
      this.getClient(),
      this.getModel(),
      this.settingsService.getSettingValue('site_name').then(name => name || 'AiQiji工具箱')
    ]);
    
    const sys = this.buildSystemPrompt(siteName);
    const user = `主题：${subject || '通知'}\n内容：\n${text || ''}`;
    
    try {
      const stream = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        stream: true,
        stream_options: {
          include_usage: false
        }
      });
      
      for await (const chunk of stream) {
        // 检查是否有思考链内容（reasoning）
        const reasoning = chunk.choices?.[0]?.delta?.reasoning_content || '';
        if (reasoning) {
          yield { type: 'thinking', content: reasoning };
        }
        
        // 检查是否有实际内容
        const content = chunk.choices?.[0]?.delta?.content || '';
        if (content) {
          yield { type: 'content', content };
        }
      }
    } catch (e) {
      console.error('[AiService] AI生成失败:', e);
      throw new Error(e?.message || 'AI 生成失败');
    }
  }

  async testConnection({ baseURL, apiKey, model } = {}) {
    try {
      const client = new OpenAI({
        apiKey: apiKey || (await this.settingsService.getSettingValue('ai_api_key')),
        baseURL: baseURL || (await this.settingsService.getSettingValue('ai_base_url')) || 'https://open.bigmodel.cn/api/paas/v4'
      });
      const mdl = model || (await this.getModel());
      const start = Date.now();
      await client.chat.completions.create({
        model: mdl,
        messages: [
          { role: 'system', content: '你是健康检查助手。' },
          { role: 'user', content: 'ping' }
        ],
        max_tokens: 5,
        temperature: 0
      });
      const latency = Date.now() - start;
      return { ok: true, latency_ms: latency };
    } catch (e) {
      return { ok: false, message: e?.message || 'AI 测试失败' };
    }
  }
}

export default AiService;
