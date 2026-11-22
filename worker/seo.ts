import { Env, escapeHtml, parseJson } from './lib';

const STATIC_PAGES = [
  '/', '/about', '/products', '/export-markets', '/quality-certifications', '/why-choose-us',
  '/infrastructure-logistics', '/blog', '/contact', '/request-a-quote',
];

async function siteBase(env: Env, request: Request): Promise<string> {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
  const configured = parseJson<{ siteUrl?: string }>(row?.value, {}).siteUrl?.replace(/\/+$/, '');
  return configured || new URL(request.url).origin;
}

export async function robotsTxt(env: Env, request: Request): Promise<Response> {
  const base = await siteBase(env, request);
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

export async function sitemapXml(env: Env, request: Request): Promise<Response> {
  const base = await siteBase(env, request);
  const [prods, posts] = await Promise.all([
    env.DB.prepare("SELECT slug FROM products WHERE published = 1 AND availability = 'available' ORDER BY sort, id").all<{ slug: string }>(),
    env.DB.prepare('SELECT slug, published_at FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC').all<{ slug: string; published_at: string }>(),
  ]);
  const url = (path: string, lastmod?: string) =>
    `  <url><loc>${escapeHtml(base + path)}</loc>${lastmod ? `<lastmod>${escapeHtml(lastmod)}</lastmod>` : ''}</url>`;
  const lines = [
    ...STATIC_PAGES.map((p) => url(p)),
    ...prods.results.map((p) => url(`/products/${p.slug}`)),
    ...posts.results.map((p) => url(`/blog/${p.slug}`, p.published_at || undefined)),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
