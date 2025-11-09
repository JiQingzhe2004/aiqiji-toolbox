/**
 * 意见反馈邮件模板（管理员通知）
 * 使用精美HTML模板，兼容主流邮件客户端
 */

/**
 * 管理员通知邮件
 */
export function getAdminFeedbackEmail({ feedback, siteName = 'AiQiji工具箱', siteUrl = '' }) {
  const subject = `新意见反馈：${feedback.subject}`;
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f6f7fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,'Helvetica Neue',Helvetica,sans-serif; color:#1f2937; }
    .container { max-width:640px; margin:32px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.06); }
    .header { background:linear-gradient(135deg,#0f172a,#334155); color:#fff; padding:28px 28px; position:relative; }
    .header h1 { margin:0; font-size:20px; font-weight:700; letter-spacing:.2px; }
    .badge { display:inline-block; padding:4px 10px; font-size:12px; color:#0f172a; background:#e2e8f0; border-radius:999px; margin-top:10px; font-weight:600; }
    .content { padding:28px; }
    .section { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin:14px 0; }
    .item { display:flex; gap:10px; margin:10px 0; font-size:14px; }
    .label { min-width:88px; color:#6b7280; }
    .value { color:#111827; word-break:break-all; }
    .content-text { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin:14px 0; white-space:pre-wrap; word-wrap:break-word; color:#111827; font-size:14px; line-height:1.6; }
    .divider { height:1px; background:linear-gradient(90deg,transparent,#e5e7eb,transparent); margin:22px 0; }
    .muted { color:#6b7280; font-size:12px; }
    .footer { background:#f8fafc; border-top:1px solid #e5e7eb; color:#64748b; padding:16px 28px; font-size:12px; text-align:center; }
    .brand a { color:#0ea5e9; text-decoration:none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>收到新的意见反馈</h1>
      <div class="badge">待处理</div>
    </div>
    <div class="content">
      <div class="section">
        <div class="item"><div class="label">反馈主题</div><div class="value">${escapeHtml(feedback.subject)}</div></div>
        <div class="item"><div class="label">反馈人</div><div class="value">${escapeHtml(feedback.name)}</div></div>
        <div class="item"><div class="label">联系邮箱</div><div class="value">${escapeHtml(feedback.email)}</div></div>
      </div>
      
      <div class="content-text">${escapeHtml(feedback.content)}</div>

      <div class="divider"></div>
      <p class="muted">此邮件用于提醒管理员及时处理用户反馈，请根据反馈内容进行相应处理。</p>
    </div>
    <div class="footer">
      <div class="brand">— ${escapeHtml(siteName)}</div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

// 简单HTML转义，避免模板注入
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

