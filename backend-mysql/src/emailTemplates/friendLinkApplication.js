/**
 * 友链申请邮件模板（管理员通知 + 申请人回执）
 * 使用精美HTML模板，兼容主流邮件客户端
 */

/**
 * 管理员通知邮件
 */
export function getAdminNotificationEmail({ application, siteName = 'AiQiji工具箱', siteUrl = '' }) {
  const subject = `新友链申请：${application.site_name}`;
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
    .divider { height:1px; background:linear-gradient(90deg,transparent,#e5e7eb,transparent); margin:22px 0; }
    .muted { color:#6b7280; font-size:12px; }
    .footer { background:#f8fafc; border-top:1px solid #e5e7eb; color:#64748b; padding:16px 28px; font-size:12px; text-align:center; }
    .brand a { color:#0ea5e9; text-decoration:none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>收到新的友链申请</h1>
      <div class="badge">待处理</div>
    </div>
    <div class="content">
      <div class="section">
        <div class="item"><div class="label">网站名称</div><div class="value">${escapeHtml(application.site_name)}</div></div>
        <div class="item"><div class="label">网站地址</div><div class="value"><a href="${escapeAttr(application.site_url)}" target="_blank" style="color:#0ea5e9;text-decoration:none;">${escapeHtml(application.site_url)}</a></div></div>
        <div class="item"><div class="label">网站图标</div><div class="value">${application.site_icon ? escapeHtml(application.site_icon) : '-'}</div></div>
        <div class="item"><div class="label">网站描述</div><div class="value">${escapeHtml(application.site_description)}</div></div>
        <div class="item"><div class="label">申请邮箱</div><div class="value">${escapeHtml(application.admin_email)}</div></div>
        ${application.admin_qq ? `<div class="item"><div class="label">申请人QQ</div><div class="value">${escapeHtml(application.admin_qq)}</div></div>` : ''}
      </div>

      <div class="divider"></div>
      <p class="muted">此邮件用于提醒管理员及时处理友链申请，请登录后台进行审核操作。</p>
    </div>
    <div class="footer">
      <div class="brand">— ${escapeHtml(siteName)}</div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

/**
 * 申请人回执邮件
 */
export function getApplicantReceiptEmail({ application, siteName = 'AiQiji工具箱', siteUrl = '' }) {
  const subject = `${siteName} - 友链申请已接收`;
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
    .header { background:linear-gradient(135deg,#0ea5e9,#22c55e); color:#fff; padding:28px 28px; position:relative; }
    .header h1 { margin:0; font-size:20px; font-weight:700; letter-spacing:.2px; }
    .sub { opacity:.9; font-size:13px; margin-top:6px; }
    .content { padding:28px; }
    .section { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin:14px 0; }
    .item { display:flex; gap:10px; margin:10px 0; font-size:14px; }
    .label { min-width:88px; color:#6b7280; }
    .value { color:#111827; word-break:break-all; }
    .divider { height:1px; background:linear-gradient(90deg,transparent,#e5e7eb,transparent); margin:22px 0; }
    .muted { color:#6b7280; font-size:12px; }
    .footer { background:#f8fafc; border-top:1px solid #e5e7eb; color:#64748b; padding:16px 28px; font-size:12px; text-align:center; }
    .brand a { color:#0ea5e9; text-decoration:none; }
    .cta { margin-top:14px; }
    .btn { display:inline-block; padding:10px 14px; border-radius:10px; color:#fff; background:#0ea5e9; text-decoration:none; font-weight:600; font-size:13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>我们已收到您的友链申请</h1>
      <div class="sub">感谢与 <strong>${escapeHtml(siteName)}</strong> 互换友情链接，我们将尽快审核。</div>
    </div>
    <div class="content">
      <p>以下是您提交的信息：</p>
      <div class="section">
        <div class="item"><div class="label">网站名称</div><div class="value">${escapeHtml(application.site_name)}</div></div>
        <div class="item"><div class="label">网站地址</div><div class="value"><a href="${escapeAttr(application.site_url)}" target="_blank" style="color:#0ea5e9;text-decoration:none;">${escapeHtml(application.site_url)}</a></div></div>
        <div class="item"><div class="label">网站图标</div><div class="value">${application.site_icon ? escapeHtml(application.site_icon) : '-'}</div></div>
        <div class="item"><div class="label">网站描述</div><div class="value">${escapeHtml(application.site_description)}</div></div>
      </div>
      <div class="divider"></div>
      <p class="muted">我们通常会在 <strong>30天内</strong> 完成审核，并通过此邮箱通知您审核结果。如有补充信息或合作意向，欢迎直接回复本邮件与我们联系。</p>
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

export function getAdminDecisionEmail({ application, siteName = 'AiQiji工具箱', siteUrl = '', decision = 'approved', note = '' }) {
  const isApproved = decision === 'approved';
  const subject = `友链申请已${isApproved ? '通过' : '拒绝'}：${application.site_name}`;
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
    .header { background:linear-gradient(135deg,${isApproved ? '#22c55e,#16a34a' : '#ef4444,#b91c1c'}); color:#fff; padding:28px 28px; position:relative; }
    .header h1 { margin:0; font-size:20px; font-weight:700; letter-spacing:.2px; }
    .badge { display:inline-block; padding:4px 10px; font-size:12px; color:#0f172a; background:#e2e8f0; border-radius:999px; margin-top:10px; font-weight:600; }
    .content { padding:28px; }
    .section { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin:14px 0; }
    .item { display:flex; gap:10px; margin:10px 0; font-size:14px; }
    .label { min-width:88px; color:#6b7280; }
    .value { color:#111827; word-break:break-all; }
    .divider { height:1px; background:linear-gradient(90deg,transparent,#e5e7eb,transparent); margin:22px 0; }
    .muted { color:#6b7280; font-size:12px; }
    .footer { background:#f8fafc; border-top:1px solid #e5e7eb; color:#64748b; padding:16px 28px; font-size:12px; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>友链申请已${isApproved ? '通过' : '拒绝'}</h1>
      <div class="badge">${escapeHtml(application.site_name)}</div>
    </div>
    <div class="content">
      <div class="section">
        <div class="item"><div class="label">网站名称</div><div class="value">${escapeHtml(application.site_name)}</div></div>
        <div class="item"><div class="label">网站地址</div><div class="value"><a href="${escapeAttr(application.site_url)}" target="_blank" style="color:#0ea5e9;text-decoration:none;">${escapeHtml(application.site_url)}</a></div></div>
        <div class="item"><div class="label">申请邮箱</div><div class="value">${escapeHtml(application.admin_email)}</div></div>
        ${application.admin_qq ? `<div class="item"><div class="label">申请人QQ</div><div class="value">${escapeHtml(application.admin_qq)}</div></div>` : ''}
      </div>
      ${note ? `<div class="section"><div class="item"><div class="label">处理备注</div><div class="value">${escapeHtml(note)}</div></div></div>` : ''}
      <div class="divider"></div>
      <p class="muted">此邮件用于记录本次审核操作。</p>
    </div>
    <div class="footer">
      <div class="brand">— ${escapeHtml(siteName)}</div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

export function getApplicantDecisionEmail({ application, siteName = 'AiQiji工具箱', siteUrl = '', decision = 'approved', note = '' }) {
  const isApproved = decision === 'approved';
  const subject = `${siteName} - 您的友链申请已${isApproved ? '通过' : '被拒绝'}`;
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
    .header { background:linear-gradient(135deg,${isApproved ? '#22c55e,#16a34a' : '#ef4444,#b91c1c'}); color:#fff; padding:28px 28px; position:relative; }
    .header h1 { margin:0; font-size:20px; font-weight:700; letter-spacing:.2px; }
    .sub { opacity:.9; font-size:13px; margin-top:6px; }
    .content { padding:28px; }
    .section { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin:14px 0; }
    .item { display:flex; gap:10px; margin:10px 0; font-size:14px; }
    .label { min-width:88px; color:#6b7280; }
    .value { color:#111827; word-break:break-all; }
    .divider { height:1px; background:linear-gradient(90deg,transparent,#e5e7eb,transparent); margin:22px 0; }
    .muted { color:#6b7280; font-size:12px; }
    .footer { background:#f8fafc; border-top:1px solid #e5e7eb; color:#64748b; padding:16px 28px; font-size:12px; text-align:center; }
    .cta { margin-top:14px; }
    .btn { display:inline-block; padding:10px 14px; border-radius:10px; color:#fff; background:${isApproved ? '#22c55e' : '#ef4444'}; text-decoration:none; font-weight:600; font-size:13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>您的友链申请已${isApproved ? '通过' : '被拒绝'}</h1>
      <div class="sub">${isApproved ? '恭喜！我们已批准您的友链申请。' : '很抱歉，本次友链申请未能通过审核。'}</div>
    </div>
    <div class="content">
      <div class="section">
        <div class="item"><div class="label">网站名称</div><div class="value">${escapeHtml(application.site_name)}</div></div>
        <div class="item"><div class="label">网站地址</div><div class="value"><a href="${escapeAttr(application.site_url)}" target="_blank" style="color:#0ea5e9;text-decoration:none;">${escapeHtml(application.site_url)}</a></div></div>
      </div>
      ${note ? `<div class="section"><div class="item"><div class="label">审核说明</div><div class="value">${escapeHtml(note)}</div></div></div>` : ''}
      <div class="divider"></div>
      <p class="muted">如有疑问或补充信息，您可以直接回复本邮件与我们联系。</p>
      ${siteUrl ? `<div class="cta"><a class="btn" href="${escapeAttr(siteUrl)}" target="_blank">${isApproved ? '访问本站' : '返回网站'}</a></div>` : ''}
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
  // 在属性中使用的转义（保留 http/https/: 等必要字符）
  return escapeHtml(str);
}
