import { Env } from './lib';

/**
 * OPTIONAL: pushes every new inquiry to the owner's WhatsApp automatically, as numbered points,
 * through Meta's WhatsApp Business Cloud API. It is switched on only when all three of these are set
 * (see worker/README.md for the one-time Meta setup):
 *   WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_NOTIFY_TO  (+ optional WHATSAPP_TEMPLATE)
 * Without them the inquiry is still saved (and e-mailed if configured). It never throws.
 */

interface InquiryWa {
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

const oneLine = (v: string, max: number) => (v ?? '').replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

export function inquiryPoints(q: InquiryWa): string[] {
  const rows: [string, string][] = [
    ['Name', oneLine(q.name, 120)],
    ['Company', oneLine(q.company, 160)],
    ['Country', oneLine(q.country, 100)],
    ['Product', oneLine(q.productName, 120)],
    ['Required quantity', oneLine(q.quantity, 120)],
    ['Email', oneLine(q.email, 160)],
    ['WhatsApp number', oneLine(q.whatsapp, 40)],
    ['Requirements', oneLine(q.message, 700)],
  ];
  return rows.filter(([, v]) => v).map(([k, v], i) => `${i + 1}. ${k}: ${v}`);
}

export async function sendInquiryWhatsApp(env: Env, companyName: string, q: InquiryWa): Promise<void> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_NOTIFY_TO) return;
  try {
    const points = inquiryPoints(q);
    const to = env.WHATSAPP_NOTIFY_TO.replace(/\D/g, '');
    const payload = env.WHATSAPP_TEMPLATE
      ? {
          // Template messages reach the owner at any time. Parameters cannot contain line breaks, so points are joined with " | ".
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: env.WHATSAPP_TEMPLATE,
            language: { code: env.WHATSAPP_TEMPLATE_LANG || 'en' },
            components: [{ type: 'body', parameters: [{ type: 'text', text: `#${q.id} | ${points.join(' | ')}`.slice(0, 1000) }] }],
          },
        }
      : {
          // Plain text is delivered only while the owner has messaged the business number in the last 24 hours.
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: [`*New inquiry #${q.id} – ${oneLine(companyName, 80)}*`, '', ...points].join('\n') },
        };
    const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID)}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error('[whatsapp] API error', res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    console.error('[whatsapp] failed', e);
  }
}
