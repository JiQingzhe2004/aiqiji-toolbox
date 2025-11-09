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
    return `你是邮件排版助手，请把用户的纯文本内容包装成规范的营销/通知邮件HTML。
要求：
- 只输出 <html>...</html> 完整HTML，内联样式即可。
- 使用简洁现代风格，含头部标题、内容区、分隔、页脚说明。
- 样式现代化，使用最新的HTML5语义化标签，要美观好看，有质感，边角尽量使用圆角。
- 不要使用md的代码片段输出，不要出现``````这样的代码片段，不要使用markdown语法，只输出html。 
- 尽量适配邮件客户端（避免外链CSS与复杂布局）。
- 网站名称：${siteName || 'AiQiji·工具箱'}`;
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
