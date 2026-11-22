import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    loadComponent: () => import('./layout/public-shell').then((m) => m.PublicShell),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home').then((m) => m.HomePage) },
      { path: 'about', loadComponent: () => import('./pages/about').then((m) => m.AboutPage) },
      { path: 'products', loadComponent: () => import('./pages/products').then((m) => m.ProductsPage) },
      { path: 'products/:slug', loadComponent: () => import('./pages/product-detail').then((m) => m.ProductDetailPage) },
      { path: 'red-onion', redirectTo: 'products/red-onion', pathMatch: 'full' },
      { path: 'white-onion', redirectTo: 'products/white-onion', pathMatch: 'full' },
      { path: 'export-markets', loadComponent: () => import('./pages/markets').then((m) => m.MarketsPage) },
      { path: 'quality-certifications', loadComponent: () => import('./pages/certifications').then((m) => m.CertificationsPage) },
      { path: 'why-choose-us', loadComponent: () => import('./pages/why-us').then((m) => m.WhyUsPage) },
      { path: 'infrastructure-logistics', loadComponent: () => import('./pages/logistics').then((m) => m.LogisticsPage) },
      { path: 'blog', loadComponent: () => import('./pages/blog').then((m) => m.BlogPage) },
      { path: 'blog/:slug', loadComponent: () => import('./pages/blog-post').then((m) => m.BlogPostPage) },
      { path: 'contact', loadComponent: () => import('./pages/contact').then((m) => m.ContactPage) },
      { path: 'request-a-quote', loadComponent: () => import('./pages/quote').then((m) => m.QuotePage) },
      { path: '**', loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage) },
    ],
  },
];
