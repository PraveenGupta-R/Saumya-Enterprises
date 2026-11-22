import { RenderMode, ServerRoute } from '@angular/ssr';
import seed from '../../seed/seed.json';

// Only products / posts that exist in the seed are prerendered. Anything added later
// through the admin panel is rendered in the browser (the Worker serves index.csr.html).
const productSlugs = seed.products.filter((p) => p.availability === 'available' && p.published).map((p) => p.slug);
const postSlugs = seed.posts.filter((p) => p.published).map((p) => p.slug);

export const serverRoutes: ServerRoute[] = [
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  {
    path: 'products/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => productSlugs.map((slug) => ({ slug })),
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => postSlugs.map((slug) => ({ slug })),
  },
  { path: 'red-onion', renderMode: RenderMode.Client },
  { path: 'white-onion', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
