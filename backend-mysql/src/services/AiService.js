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

  /**
   * 生成邮件主题
   */
  async generateSubject(content) {
    const client = await this.getClient();
    const model = await this.getModel();
    
    const prompt = `请根据以下邮件内容，生成一个简洁、吸引人的邮件主题。要求：
- 主题长度控制在15-30个字符
- 突出邮件核心内容
- 语气专业且友好
- 直接输出主题文字，不要加引号或其他符号

邮件内容：
${content}`;

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    });

    const subject = completion.choices[0]?.message?.content?.trim() || '邮件通知';
    return subject;
  }

  buildSystemPrompt(siteName, mode = 'html') {
    const currentYear = new Date().getFullYear();
    
    if (mode === 'text') {
      return `你是专业邮件文案编写专家。将用户的要点转为结构清晰、语气专业的纯文本邮件。

【输出要求】
- 直接输出纯文本内容，不要HTML标签
- 不要markdown语法（如**、##等）
- 使用简单的文本格式：换行、空行分段

【结构要求】
- 开头：简短问候语
- 主体：清晰表达核心内容，分段合理
- 结尾：礼貌用语 + 签名行

【语气风格】
- 专业且友好
- 简洁明了，避免冗余
- 符合邮件礼仪

立即输出纯文本邮件：`;
    }
    
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
   * 流式渲染邮件HTML或纯文本
   * @param {Object} params - 参数对象
   * @param {string} params.subject - 邮件主题
   * @param {string} params.text - 邮件文本内容
   * @param {string} params.mode - 生成模式：'html' 或 'text'
   * @returns {AsyncGenerator} 返回流式生成器
   */
  async *renderEmailHTMLStream({ subject, text, mode = 'html' }) {
    // 并行获取所有配置，减少等待时间
    const [client, model, siteName] = await Promise.all([
      this.getClient(),
      this.getModel(),
      this.settingsService.getSettingValue('site_name').then(name => name || 'AiQiji工具箱')
    ]);
    
    const sys = this.buildSystemPrompt(siteName, mode);
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
