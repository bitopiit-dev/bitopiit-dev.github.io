/**
 * Emails the site owner when a contact message arrives.
 * Uses Resend's HTTPS API because Render's free plan blocks SMTP ports.
 * Does nothing unless RESEND_API_KEY and NOTIFY_EMAIL are set.
 */

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function buildEmail(msg, { to, from, siteUrl }) {
  const subject = `New website message from ${msg.name}${msg.subject ? `: ${msg.subject}` : ''}`.slice(0, 200);
  const text = [
    `From: ${msg.name} <${msg.email}>`,
    msg.subject ? `Subject: ${msg.subject}` : null,
    '',
    msg.message,
    '',
    'Reply to this email to answer the sender directly.',
    siteUrl ? `All messages: ${siteUrl}/admin/` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p style="margin:0 0 4px"><strong>${esc(msg.name)}</strong> &lt;<a href="mailto:${esc(msg.email)}">${esc(msg.email)}</a>&gt;</p>
${msg.subject ? `<p style="margin:0 0 12px;color:#555">Subject: ${esc(msg.subject)}</p>` : ''}
<div style="white-space:pre-wrap;padding:14px 16px;background:#f4f6fa;border-radius:8px">${esc(msg.message)}</div>
<p style="margin:16px 0 0;color:#666;font-size:13px">Reply to this email to answer ${esc(msg.name)} directly.${
    siteUrl ? ` <a href="${esc(siteUrl)}/admin/">Open all messages</a>` : ''
  }</p></div>`;
  return { from, to: [to], reply_to: msg.email, subject, text, html };
}

export async function notifyOwner(msg, env = process.env, fetchImpl = globalThis.fetch) {
  const key = env.RESEND_API_KEY;
  const to = env.NOTIFY_EMAIL;
  if (!key || !to) return { sent: false, reason: 'not-configured' };
  const from = env.NOTIFY_FROM || 'Portfolio <onboarding@resend.dev>';
  const siteUrl = (env.CLIENT_ORIGIN || '').split(',')[0].trim().replace(/\/$/, '');
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(buildEmail(msg, { to, from, siteUrl })),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[notify] Resend returned ${res.status}: ${body.slice(0, 300)}`);
      return { sent: false, reason: `status-${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error('[notify] Could not send email:', e.message);
    return { sent: false, reason: 'error' };
  }
}
