import { Env, escapeHtml } from './lib';

interface InquiryMail {
  id: number;
  productName: string;
  name: string;
  company: string;
  country: string;
  email: string;
  whatsapp: string;
  quantity: string;
  message: string;
}

async function send(env: Env, to: string, subject: string, html: string, replyTo?: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) console.error('Resend error', res.status, (await res.text()).slice(0, 300));
}

const row = (k: string, v: string) =>
  `<tr><td style="padding:6px 12px;color:#555;vertical-align:top"><b>${escapeHtml(k)}</b></td><td style="padding:6px 12px">${escapeHtml(v || '-').replace(/\n/g, '<br>')}</td></tr>`;

/** Sends owner notification + buyer confirmation. Never throws. */
export async function sendInquiryEmails(env: Env, companyName: string, q: InquiryMail): Promise<void> {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.NOTIFY_EMAIL) {
    console.log(`[email] not configured; inquiry #${q.id} saved only`);
    return;
  }
  try {
    const owner = `<h2 style="font-family:Arial">New inquiry #${q.id}</h2>
<table style="font-family:Arial;font-size:14px;border-collapse:collapse">
${row('Product', q.productName)}${row('Name', q.name)}${row('Company', q.company)}${row('Country', q.country)}
${row('Email', q.email)}${row('WhatsApp', q.whatsapp)}${row('Quantity', q.quantity)}${row('Message', q.message)}
</table>`;
    const buyer = `<div style="font-family:Arial;font-size:14px;line-height:1.5">
<p>Dear ${escapeHtml(q.name)},</p>
<p>Thank you for contacting ${escapeHtml(companyName)}. We have received your inquiry${q.productName ? ` about <b>${escapeHtml(q.productName)}</b>` : ''} and will reply as soon as possible, normally within one business day.</p>
<p>Your reference number is <b>#${q.id}</b>.</p>
<p>Regards,<br>${escapeHtml(companyName)}</p></div>`;
    await Promise.allSettled([
      send(env, env.NOTIFY_EMAIL, `New inquiry #${q.id}${q.productName ? ' – ' + q.productName : ''} from ${q.name} (${q.country})`, owner, q.email),
      send(env, q.email, `We received your inquiry – ${companyName}`, buyer),
    ]);
  } catch (e) {
    console.error('[email] failed', e);
  }
}
