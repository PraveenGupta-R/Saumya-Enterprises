import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import {
  AppEnv, Ctx, HttpError, PBKDF2_ITERATIONS, b64url, clientIpHash, fromB64url, isUniqueError, oneOf,
  parseJson, pbkdf2, randomBytes, rateClear, rateCount, rateHit, readJson, safeEqual, signToken, str, verifyToken,
} from './lib';
import {
  EntityConfig, categories, certifications, inquiryFromRow, posts, products, sanitizeSettings, testimonials,
} from './entities';

export const adminApi = new Hono<AppEnv>();

const COOKIE = 'se_admin';
const SESSION_SECONDS = 7 * 24 * 3600;
const isHttps = (c: Ctx) => new URL(c.req.url).protocol === 'https:';

/* ---------- middleware: CSRF, auth, no-store ---------- */

adminApi.use('*', async (c, next) => {
  const method = c.req.method;
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    if (c.req.header('X-Requested-With') !== 'XMLHttpRequest') throw new HttpError(403, 'Missing X-Requested-With header');
    const origin = c.req.header('Origin');
    if (origin) {
      let host = '';
      try {
        host = new URL(origin).host;
      } catch {
        /* invalid origin */
      }
      if (host !== new URL(c.req.url).host) throw new HttpError(403, 'Cross-origin request blocked');
    }
  }

  const path = new URL(c.req.url).pathname;
  const open = path === '/api/admin/login' || path === '/api/admin/logout';
  if (!open) {
    const token = getCookie(c, COOKIE);
    const session = token ? await verifyToken(c.env.SESSION_SECRET, token) : null;
    if (!session) throw new HttpError(401, 'Please sign in');
  }
  await next();
  c.res.headers.set('Cache-Control', 'no-store');
});

/* ---------- auth ---------- */

interface StoredAuth {
  salt: string;
  hash: string;
  iter: number;
}

async function loadAuth(c: Ctx): Promise<StoredAuth | null> {
  const row = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'admin_auth'").first<{ value: string }>();
  return row ? parseJson<StoredAuth | null>(row.value, null) : null;
}

async function storePassword(c: Ctx, password: string): Promise<void> {
  const salt = randomBytes(16);
  const rec: StoredAuth = { salt: b64url(salt), hash: await pbkdf2(password, salt), iter: PBKDF2_ITERATIONS };
  await c.env.DB.prepare("INSERT INTO settings (key, value) VALUES ('admin_auth', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(JSON.stringify(rec))
    .run();
}

async function checkPassword(c: Ctx, password: string): Promise<boolean> {
  const stored = await loadAuth(c);
  if (stored) return safeEqual(await pbkdf2(password, fromB64url(stored.salt), stored.iter), stored.hash);
  // bootstrap: env password; hash it on first success
  const ok = await safeEqual(password, c.env.ADMIN_PASSWORD ?? '');
  if (ok) await storePassword(c, password);
  return ok;
}

adminApi.post('/login', async (c) => {
  const body = await readJson(c);
  const email = str(body['email'], 254, 'email').toLowerCase();
  const password = typeof body['password'] === 'string' ? body['password'] : '';
  const ip = await clientIpHash(c);
  if ((await rateCount(c.env.DB, 'login_fail', ip, 15 * 60_000)) >= 5) {
    throw new HttpError(429, 'Too many failed attempts. Please wait 15 minutes and try again.');
  }
  if (!c.env.ADMIN_EMAIL || !c.env.SESSION_SECRET) throw new HttpError(500, 'Server is not configured (ADMIN_EMAIL / SESSION_SECRET missing)');
  const emailOk = await safeEqual(email, c.env.ADMIN_EMAIL.toLowerCase());
  const passOk = password.length > 0 && (await checkPassword(c, password));
  if (!emailOk || !passOk) {
    await rateHit(c.env.DB, 'login_fail', ip);
    throw new HttpError(401, 'Incorrect email or password');
  }
  await rateClear(c.env.DB, 'login_fail', ip);
  const token = await signToken(c.env.SESSION_SECRET, { email: c.env.ADMIN_EMAIL, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
  setCookie(c, COOKIE, token, { httpOnly: true, sameSite: 'Strict', path: '/', secure: isHttps(c), maxAge: SESSION_SECONDS });
  return c.json({ ok: true, email: c.env.ADMIN_EMAIL });
});

adminApi.post('/logout', (c) => {
  deleteCookie(c, COOKIE, { path: '/', secure: isHttps(c) });
  return c.json({ ok: true });
});

adminApi.get('/me', (c) => c.json({ ok: true, email: c.env.ADMIN_EMAIL }));

adminApi.post('/password', async (c) => {
  const body = await readJson(c);
  const current = typeof body['current'] === 'string' ? body['current'] : '';
  const next = typeof body['next'] === 'string' ? body['next'] : '';
  if (next.length < 10) throw new HttpError(400, 'New password must be at least 10 characters');
  if (next.length > 200) throw new HttpError(400, 'New password is too long');
  if (!(await checkPassword(c, current))) throw new HttpError(403, 'Current password is incorrect');
  await storePassword(c, next);
  return c.json({ ok: true });
});

/* ---------- stats ---------- */

adminApi.get('/stats', async (c) => {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 19) + 'Z';
  const r = await c.env.DB
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM inquiries) AS inquiriesTotal,
        (SELECT COUNT(*) FROM inquiries WHERE status = 'new') AS inquiriesNew,
        (SELECT COUNT(*) FROM inquiries WHERE created_at >= ?) AS inquiriesLast7Days,
        (SELECT COUNT(*) FROM products) AS productsTotal,
        (SELECT COUNT(*) FROM products WHERE published = 1) AS productsPublished,
        (SELECT COUNT(*) FROM posts) AS postsTotal,
        (SELECT COUNT(*) FROM testimonials) AS testimonialsTotal`,
    )
    .bind(since)
    .first();
  return c.json(r);
});

/* ---------- generic CRUD ---------- */

function crud(path: string, cfg: EntityConfig, beforeDelete?: (c: Ctx, id: number) => Promise<void>) {
  const cols = cfg.cols;
  const getRow = (c: Ctx, id: number) => c.env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).bind(id).first();
  const idOf = (c: Ctx) => {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Not found');
    return id;
  };

  adminApi.get(path, async (c) => {
    const { results } = await c.env.DB.prepare(`SELECT * FROM ${cfg.table} ORDER BY ${cfg.order}`).all();
    return c.json(results.map(cfg.fromRow));
  });

  adminApi.get(`${path}/:id`, async (c) => {
    const row = await getRow(c, idOf(c));
    if (!row) throw new HttpError(404, 'Not found');
    return c.json(cfg.fromRow(row));
  });

  adminApi.post(path, async (c) => {
    const body = await readJson(c);
    const clean = await cfg.validate({ ...cfg.defaults(), ...body }, c.env.DB);
    try {
      const row = await c.env.DB
        .prepare(`INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')}) RETURNING *`)
        .bind(...cfg.toParams(clean))
        .first();
      return c.json(cfg.fromRow(row!), 201);
    } catch (e) {
      if (isUniqueError(e)) throw new HttpError(409, cfg.uniqueMessage);
      throw e;
    }
  });

  adminApi.put(`${path}/:id`, async (c) => {
    const id = idOf(c);
    const existing = await getRow(c, id);
    if (!existing) throw new HttpError(404, 'Not found');
    const body = await readJson(c);
    const clean = await cfg.validate({ ...cfg.fromRow(existing), ...body }, c.env.DB);
    try {
      const row = await c.env.DB
        .prepare(`UPDATE ${cfg.table} SET ${cols.map((k) => `${k} = ?`).join(', ')} WHERE id = ? RETURNING *`)
        .bind(...cfg.toParams(clean), id)
        .first();
      return c.json(cfg.fromRow(row!));
    } catch (e) {
      if (isUniqueError(e)) throw new HttpError(409, cfg.uniqueMessage);
      throw e;
    }
  });

  adminApi.delete(`${path}/:id`, async (c) => {
    const id = idOf(c);
    if (!(await getRow(c, id))) throw new HttpError(404, 'Not found');
    if (beforeDelete) await beforeDelete(c, id);
    await c.env.DB.prepare(`DELETE FROM ${cfg.table} WHERE id = ?`).bind(id).run();
    return c.json({ ok: true });
  });
}

crud('/products', products);
crud('/categories', categories, async (c, id) => {
  await c.env.DB.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').bind(id).run();
});
crud('/certifications', certifications);
crud('/posts', posts);
crud('/testimonials', testimonials);

/* ---------- inquiries ---------- */

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'closed'] as const;

async function queryInquiries(c: Ctx) {
  const status = c.req.query('status');
  const q = (c.req.query('q') ?? '').trim().slice(0, 100);
  const where: string[] = [];
  const params: unknown[] = [];
  if (status) {
    where.push('status = ?');
    params.push(oneOf(status, STATUSES, 'status', 'new'));
  }
  if (q) {
    const cols = ['name', 'company', 'email', 'country', 'product_name', 'message'];
    where.push('(' + cols.map((k) => `${k} LIKE ? ESCAPE '\\'`).join(' OR ') + ')');
    const like = `%${q.replace(/[\\%_]/g, (m) => '\\' + m)}%`;
    cols.forEach(() => params.push(like));
  }
  const sql = `SELECT * FROM inquiries ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC, id DESC LIMIT 2000`;
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return results.map(inquiryFromRow);
}

adminApi.get('/inquiries', async (c) => c.json(await queryInquiries(c)));

const csvCell = (v: unknown) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

adminApi.get('/inquiries.csv', async (c) => {
  const rows = await queryInquiries(c);
  const head = ['ID', 'Date (UTC)', 'Status', 'Product', 'Name', 'Company', 'Country', 'Email', 'WhatsApp', 'Quantity', 'Message', 'Notes'];
  const lines = [head.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push([r['id'], r['createdAt'], r['status'], r['productName'], r['name'], r['company'], r['country'], r['email'], r['whatsapp'], r['quantity'], r['message'], r['notes']].map(csvCell).join(','));
  }
  return new Response('﻿' + lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});

adminApi.get('/inquiries/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM inquiries WHERE id = ?').bind(Number(c.req.param('id'))).first();
  if (!row) throw new HttpError(404, 'Not found');
  return c.json(inquiryFromRow(row));
});

adminApi.put('/inquiries/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await readJson(c);
  const existing = await c.env.DB.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();
  if (!existing) throw new HttpError(404, 'Not found');
  const status = oneOf(body['status'], STATUSES, 'status', existing['status'] as (typeof STATUSES)[number]);
  const notes = 'notes' in body ? str(body['notes'], 4000, 'notes') : (existing['notes'] as string);
  const row = await c.env.DB.prepare('UPDATE inquiries SET status = ?, notes = ? WHERE id = ? RETURNING *').bind(status, notes, id).first();
  return c.json(inquiryFromRow(row!));
});

adminApi.delete('/inquiries/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const r = await c.env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();
  if (!r.meta.changes) throw new HttpError(404, 'Not found');
  return c.json({ ok: true });
});

/* ---------- settings ---------- */

adminApi.get('/settings', async (c) => {
  const row = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
  return c.json(parseJson(row?.value, {}));
});

adminApi.put('/settings', async (c) => {
  const body = await readJson(c);
  const row = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
  const clean = sanitizeSettings(parseJson(row?.value, {}), body);
  await c.env.DB.prepare("INSERT INTO settings (key, value) VALUES ('site', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(JSON.stringify(clean))
    .run();
  return c.json(clean);
});

/* ---------- media upload ---------- */

const MAX_UPLOAD = 5 * 1024 * 1024;

function detectImage(b: Uint8Array): { ext: 'jpg' | 'png' | 'webp'; type: string } | null {
  if (b.length > 12) {
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
      return { ext: 'png', type: 'image/png' };
    }
    const tag = (o: number, s: string) => [...s].every((ch, i) => b[o + i] === ch.charCodeAt(0));
    if (tag(0, 'RIFF') && tag(8, 'WEBP')) return { ext: 'webp', type: 'image/webp' };
  }
  return null;
}

adminApi.post('/media', async (c) => {
  const len = Number(c.req.header('Content-Length') ?? 0);
  if (len > MAX_UPLOAD + 100_000) throw new HttpError(413, 'Image is too large (max 5 MB)');
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw new HttpError(400, 'Upload must be multipart/form-data with a "file" field');
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new HttpError(400, 'No file was uploaded (field name must be "file")');
  if (file.size > MAX_UPLOAD) throw new HttpError(413, 'Image is too large (max 5 MB)');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);
  if (!kind) throw new HttpError(415, 'Only JPEG, PNG or WebP images are allowed');
  const key = `${crypto.randomUUID()}.${kind.ext}`;
  await c.env.MEDIA.put(key, bytes, { httpMetadata: { contentType: kind.type } });
  return c.json({ url: `/api/media/${key}` }, 201);
});

// Remove an uploaded file by key (optional housekeeping used by the admin UI)
adminApi.delete('/media/:key', async (c) => {
  const key = c.req.param('key');
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key)) throw new HttpError(400, 'Invalid key');
  await c.env.MEDIA.delete(key);
  return c.json({ ok: true });
});
