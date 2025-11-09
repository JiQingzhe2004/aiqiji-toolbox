/**
 * 意见反馈提交成功邮件模板（用户通知）
 * 使用精美HTML模板，兼容主流邮件客户端
 */

/**
 * 用户提交成功通知邮件
 */
export function getUserFeedbackSuccessEmail({ feedback, siteName = 'AiQiji工具箱', siteUrl = '' }) {
  const subject = `${siteName} - 您的意见反馈已提交成功`;
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
    .header { background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff; padding:28px 28px; position:relative; }
    .header h1 { margin:0; font-size:20px; font-weight:700; letter-spacing:.2px; }
    .sub { opacity:.9; font-size:13px; margin-top:6px; }
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
    .cta { margin-top:14px; }
    .btn { display:inline-block; padding:10px 14px; border-radius:10px; color:#fff; background:#22c55e; text-decoration:none; font-weight:600; font-size:13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>您的意见反馈已提交成功</h1>
      <div class="sub">感谢您对 <strong>${escapeHtml(siteName)}</strong> 的关注和支持</div>
    </div>
    <div class="content">
      <p>您好 ${escapeHtml(feedback.name)}，</p>
      <p>我们已收到您的意见反馈，感谢您花费宝贵的时间为我们提供意见和建议。</p>
      
      <div class="section">
        <div class="item"><div class="label">反馈主题</div><div class="value">${escapeHtml(feedback.subject)}</div></div>
        <div class="item"><div class="label">提交时间</div><div class="value">${formatDate(feedback.submitted_at)}</div></div>
      </div>
      
      <div class="content-text">${escapeHtml(feedback.content)}</div>

      <div class="divider"></div>
      <p class="muted">我们会认真对待每一条反馈，并尽快处理您的意见。如有需要，我们可能会通过此邮箱与您联系。</p>
      ${siteUrl ? `<div class="cta"><a class="btn" href="${escapeAttr(siteUrl)}" target="_blank">访问 ${escapeHtml(siteName)}</a></div>` : ''}
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

function escapeAttr(str = '') {
  return escapeHtml(str);
}

// 格式化日期
function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

