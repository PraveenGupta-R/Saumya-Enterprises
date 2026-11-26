/** Builds the point-wise inquiry text that is sent to WhatsApp (and mirrored by worker/whatsapp.ts). */

export interface InquiryFields {
  name: string;
  company: string;
  country: string;
  product: string;
  quantity: string;
  email: string;
  whatsapp: string;
  message: string;
}

/** One line of text: no line breaks, no WhatsApp formatting characters, trimmed and length-limited. */
function clean(v: string, max = 300): string {
  return (v ?? '').replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function inquiryPoints(d: InquiryFields): string[] {
  const rows: [string, string][] = [
    ['Name', clean(d.name, 120)],
    ['Company', clean(d.company, 160)],
    ['Country', clean(d.country, 100)],
    ['Product', clean(d.product, 120)],
    ['Required quantity', clean(d.quantity, 120)],
    ['Email', clean(d.email, 160)],
    ['WhatsApp number', clean(d.whatsapp, 40)],
    ['Requirements', clean(d.message, 700)],
  ];
  return rows.filter(([, v]) => v).map(([k, v], i) => `${i + 1}. ${k}: ${v}`);
}

export function inquiryWhatsAppText(companyName: string, d: InquiryFields): string {
  return [`*New inquiry for ${clean(companyName, 80)}*`, '', ...inquiryPoints(d), '', '_Sent from the website_'].join('\n');
}
