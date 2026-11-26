import { Hono } from 'hono';
import {
  AppEnv, HttpError, clientIpHash, parseJson, rateCount, rateHit, readJson, str,
} from './lib';
import { EntityConfig, categories, certifications, inquiryFromRow, posts, products, testimonials } from './entities';
import { sendInquiryEmails } from './email';
import { sendInquiryWhatsApp } from './whatsapp';

export const publicApi = new Hono<AppEnv>();

const CACHE = 'public, max-age=30';

publicApi.use('*', async (c, next) => {
  await next();
  if (c.req.method === 'GET' && c.res.status === 200 && !c.res.headers.has('Cache-Control')) {
    c.res.headers.set('Cache-Control', CACHE);
  }
});

function listRoute(path: string, cfg: EntityConfig) {
  publicApi.get(path, async (c) => {
    const where = cfg.publishedCol ? `WHERE ${cfg.publishedCol} = 1` : '';
    const { results } = await c.env.DB.prepare(`SELECT * FROM ${cfg.table} ${where} ORDER BY ${cfg.order}`).all();
    return c.json(results.map(cfg.fromRow));
  });
}

listRoute('/categories', categories);
listRoute('/products', products);
listRoute('/certifications', certifications);
listRoute('/posts', posts);
listRoute('/testimonials', testimonials);

for (const [path, cfg] of [['/products/:slug', products], ['/posts/:slug', posts]] as const) {
  publicApi.get(path, async (c) => {
    const row = await c.env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE slug = ? AND published = 1`).bind(c.req.param('slug')).first();
    if (!row) throw new HttpError(404, 'Not found');
    return c.json(cfg.fromRow(row));
  });
}

publicApi.get('/settings', async (c) => {
  const row = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
  return c.json(parseJson(row?.value, {}));
});

/* ---------- inquiries ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

publicApi.post('/inquiries', async (c) => {
  const body = await readJson(c);

  // honeypot: pretend success so bots learn nothing
  if (typeof body['website'] === 'string' && body['website'].trim() !== '') return c.json({ ok: true, id: 0 });

  const name = str(body['name'], 120, 'Name', true);
  const email = str(body['email'], 254, 'Email', true).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address');
  const country = str(body['country'], 100, 'Country', true);
  const company = str(body['company'], 160, 'Company');
  // accept any normal way of writing a number (spaces, dots, dashes, brackets, slashes); keep + and digits only
  const whatsappRaw = str(body['whatsapp'], 40, 'WhatsApp number');
  const whatsapp = whatsappRaw.replace(/[^\d+]/g, '');
  // the mobile number is mandatory: it is how the owner contacts the buyer directly
  if (!/^\+?\d{6,15}$/.test(whatsapp)) {
    throw new HttpError(400, whatsappRaw ? 'Please enter a valid mobile number with country code, for example +971 50 123 4567' : 'Please enter your WhatsApp / mobile number so we can contact you directly');
  }
  const quantity = str(body['quantity'], 120, 'Quantity');
  const message = str(body['message'], 4000, 'Message');
  if (!quantity && !message) throw new HttpError(400, 'Please tell us the required quantity or your product requirements');
  const productSlug = str(body['productSlug'], 100, 'productSlug');

  const db = c.env.DB;
  const ip = await clientIpHash(c);
  if ((await rateCount(db, 'inquiry', ip, 3_600_000)) >= 8) {
    throw new HttpError(429, 'Too many inquiries from your connection. Please try again later or contact us on WhatsApp.');
  }

  let productName = '';
  if (productSlug) {
    const p = await db.prepare('SELECT name FROM products WHERE slug = ? AND published = 1').bind(productSlug).first<{ name: string }>();
    productName = p?.name ?? '';
  }

  const saved = await db
    .prepare(
      `INSERT INTO inquiries (product_slug, product_name, name, company, country, email, whatsapp, quantity, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .bind(productName ? productSlug : '', productName, name, company, country, email, whatsapp, quantity, message)
    .first();
  const q = inquiryFromRow(saved!);
  await rateHit(db, 'inquiry', ip);

  const site = await db.prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
  const companyName = parseJson<{ companyName?: string }>(site?.value, {}).companyName || 'Saumya Enterprises';
  const mail = { id: q['id'] as number, productName, name, company, country, email, whatsapp, quantity, message };
  c.executionCtx.waitUntil(Promise.allSettled([sendInquiryEmails(c.env, companyName, mail), sendInquiryWhatsApp(c.env, companyName, mail)]));
  return c.json({ ok: true, id: q['id'] }, 201);
});

/* ---------- media ---------- */

publicApi.get('/media/:key', async (c) => {
  const key = c.req.param('key');
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key)) throw new HttpError(404, 'Not found');
  const obj = await c.env.MEDIA.get(key);
  if (!obj) throw new HttpError(404, 'Not found');
  const type = key.endsWith('.png') ? 'image/png' : key.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return new Response(obj.body as ReadableStream, {
    headers: {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(obj.size),
    },
  });
});
