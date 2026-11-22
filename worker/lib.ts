import type { Context } from 'hono';

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  NOTIFY_EMAIL?: string;
}
export type AppEnv = { Bindings: Env };
export type Ctx = Context<AppEnv>;

export class HttpError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 429 | 500,
    message: string,
  ) {
    super(message);
  }
}

/* ---------- encoding / crypto ---------- */

const enc = new TextEncoder();

export function b64url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromB64url(s: string): Uint8Array {
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256(data: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(data)));
}

export async function sha256Hex(data: string): Promise<string> {
  return [...(await sha256(data))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string comparison (compares SHA-256 digests so length does not leak). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i]! ^ hb[i]!;
  return diff === 0;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function signToken(secret: string, payload: { email: string; exp: number }): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = b64url(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  return `${body}.${sig}`;
}

export async function verifyToken(secret: string, token: string): Promise<{ email: string; exp: number } | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = b64url(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  if (!(await safeEqual(sig, expected))) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (typeof p.email !== 'string' || typeof p.exp !== 'number' || p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

// Cloudflare Workers caps PBKDF2 at 100,000 iterations.
export const PBKDF2_ITERATIONS = 100_000;

export async function pbkdf2(password: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return b64url(bits);
}

export function randomBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

/* ---------- validation helpers ---------- */

export function str(v: unknown, max: number, field: string, required = false): string {
  let s: string;
  if (v == null) s = '';
  else if (typeof v === 'string') s = v.trim();
  else if (typeof v === 'number') s = String(v);
  else throw new HttpError(400, `${field} must be text`);
  if (required && !s) throw new HttpError(400, `${field} is required`);
  if (s.length > max) throw new HttpError(400, `${field} is too long (max ${max} characters)`);
  return s;
}

export function int(v: unknown, field: string, def = 0): number {
  if (v == null || v === '') return def;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new HttpError(400, `${field} must be a number`);
  return Math.trunc(n);
}

export function bool(v: unknown, def = true): boolean {
  if (v == null) return def;
  return v === true || v === 1 || v === '1' || v === 'true';
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], field: string, def: T): T {
  if (v == null || v === '') return def;
  if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) return v as T;
  throw new HttpError(400, `${field} must be one of: ${allowed.join(', ')}`);
}

export function list<T>(v: unknown, max: number, field: string, map: (item: unknown, i: number) => T | null): T[] {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new HttpError(400, `${field} must be a list`);
  if (v.length > max) throw new HttpError(400, `${field} has too many items (max ${max})`);
  const out: T[] = [];
  v.forEach((item, i) => {
    const m = map(item, i);
    if (m != null) out.push(m);
  });
  return out;
}

export function obj(v: unknown, field: string): Record<string, unknown> {
  if (v == null) return {};
  if (typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, `${field} must be an object`);
  return v as Record<string, unknown>;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function slugField(v: unknown, fallback: string, field = 'slug'): string {
  const s = str(v, 100, field) || slugify(fallback);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
    throw new HttpError(400, `${field} may only contain lowercase letters, numbers and hyphens`);
  }
  return s;
}

export function urlField(v: unknown, field: string): string {
  const s = str(v, 500, field);
  if (s && !/^(\/(?!\/)|https:\/\/)/.test(s)) throw new HttpError(400, `${field} must start with / or https://`);
  return s;
}

export function parseJson<T>(s: unknown, fallback: T): T {
  if (typeof s !== 'string') return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export async function readJson(c: Ctx): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Request body must be a JSON object');
  return body as Record<string, unknown>;
}

export function isUniqueError(e: unknown): boolean {
  return /UNIQUE constraint/i.test(String((e as Error)?.message ?? e));
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- rate limiting ---------- */

export async function clientIpHash(c: Ctx): Promise<string> {
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'local';
  return (await sha256Hex(`${ip}|${c.env.SESSION_SECRET}`)).slice(0, 32);
}

export async function rateCount(db: D1Database, bucket: string, ipHash: string, windowMs: number): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM rate_limits WHERE bucket = ? AND ip_hash = ? AND created_at > ?')
    .bind(bucket, ipHash, Date.now() - windowMs)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function rateHit(db: D1Database, bucket: string, ipHash: string): Promise<void> {
  await db.batch([
    db.prepare('INSERT INTO rate_limits (bucket, ip_hash, created_at) VALUES (?, ?, ?)').bind(bucket, ipHash, Date.now()),
    // opportunistic cleanup of rows older than a day
    db.prepare('DELETE FROM rate_limits WHERE created_at < ?').bind(Date.now() - 86_400_000),
  ]);
}

export async function rateClear(db: D1Database, bucket: string, ipHash: string): Promise<void> {
  await db.prepare('DELETE FROM rate_limits WHERE bucket = ? AND ip_hash = ?').bind(bucket, ipHash).run();
}
