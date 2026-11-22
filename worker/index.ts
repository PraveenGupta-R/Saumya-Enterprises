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

async function serveAssets(request: Request, env: Env): Promise<Response> {
  const res = await env.ASSETS.fetch(request);
  if (res.status !== 404 || request.method !== 'GET') return res;
  const url = new URL(request.url);
  const last = url.pathname.split('/').pop() ?? '';
  const wantsHtml = (request.headers.get('Accept') ?? '').includes('text/html');
  // Unknown route (e.g. a product/post created later in admin, or /admin/*): serve the client-rendered shell.
  if (wantsHtml && !last.includes('.')) {
    const shell = await env.ASSETS.fetch(new Request(new URL('/index.csr.html', url), { headers: request.headers }));
    if (shell.ok) return new Response(shell.body, { status: 200, headers: shell.headers });
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
