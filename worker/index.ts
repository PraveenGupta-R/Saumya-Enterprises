import { Hono } from 'hono';
import { AppEnv, Env, HttpError } from './lib';
import { adminApi } from './admin';
import { publicApi } from './public';
import { robotsTxt, sitemapXml } from './seo';

const api = new Hono<AppEnv>();

api.route('/api/admin', adminApi);
api.route('/api', publicApi);

api.notFound((c) => c.json({ error: 'Not found' }, 404));
api.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
  console.error('Unhandled error', err);
  return c.json({ error: 'Something went wrong. Please try again.' }, 500);
});

function withSecurityHeaders(res: Response, https: boolean): Response {
  const out = new Response(res.body, res);
  out.headers.set('X-Content-Type-Options', 'nosniff');
  out.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  out.headers.set('X-Frame-Options', 'SAMEORIGIN');
  out.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (https) out.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return out;
}

/** Pages the Angular app knows about (they are prerendered, so normally the assets serve them directly). */
const KNOWN_PAGES = new Set([
  '/', '/about', '/products', '/export-markets', '/quality-certifications', '/why-choose-us',
  '/infrastructure-logistics', '/blog', '/contact', '/request-a-quote', '/red-onion', '/white-onion',
]);

/** Does this path point at something real? Products and posts added later in the admin panel are not prerendered. */
async function routeExists(path: string, env: Env): Promise<boolean> {
  const p = path.length > 1 ? path.replace(/\/+$/, '') : path;
  if (KNOWN_PAGES.has(p) || p === '/admin' || p.startsWith('/admin/')) return true;
  const m = /^\/(products|blog)\/([a-z0-9-]+)$/.exec(p);
  if (!m) return false;
  const table = m[1] === 'products' ? 'products' : 'posts';
  const row = await env.DB.prepare(`SELECT 1 AS ok FROM ${table} WHERE slug = ? AND published = 1`).bind(m[2]).first();
  return !!row;
}

async function serveAssets(request: Request, env: Env): Promise<Response> {
  const res = await env.ASSETS.fetch(request);
  if (res.status !== 404 || request.method !== 'GET') return res;
  const url = new URL(request.url);
  const last = url.pathname.split('/').pop() ?? '';
  const wantsHtml = (request.headers.get('Accept') ?? '').includes('text/html');
  // Not a prerendered file. For page requests, serve the client-rendered shell: with a normal 200 when the page is real
  // (a product/post created later in admin, or /admin/*), and with a true 404 status when it is not, so that search
  // engines do not index made-up addresses ("soft 404"). The shell still shows the friendly "page not found" screen.
  if (wantsHtml && !last.includes('.')) {
    const shell = await env.ASSETS.fetch(new Request(new URL('/index.csr.html', url), { headers: request.headers }));
    if (shell.ok) {
      const exists = await routeExists(url.pathname, env);
      const headers = new Headers(shell.headers);
      if (!exists) headers.set('X-Robots-Tag', 'noindex');
      return new Response(shell.body, { status: exists ? 200 : 404, headers });
    }
  }
  return res;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let res: Response;
    if (url.pathname.startsWith('/api/')) res = await api.fetch(request, env, ctx);
    else if (request.method === 'GET' && url.pathname === '/sitemap.xml') res = await sitemapXml(env, request);
    else if (request.method === 'GET' && url.pathname === '/robots.txt') res = await robotsTxt(env, request);
    else res = await serveAssets(request, env);
    return withSecurityHeaders(res, url.protocol === 'https:');
  },
} satisfies ExportedHandler<Env>;
