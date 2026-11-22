import { Routes } from '@angular/router';
import { AdminRoot } from './admin-root';
import { adminGuard, leaveGuard } from './admin-ui';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminRoot,
    children: [
      { path: 'login', loadComponent: () => import('./login').then((m) => m.LoginPage) },
      {
        path: '',
        loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
        canActivate: [adminGuard],
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./dashboard').then((m) => m.DashboardPage) },
          { path: 'inquiries', loadComponent: () => import('./inquiries').then((m) => m.InquiriesPage) },
          { path: 'products', loadComponent: () => import('./products-list').then((m) => m.ProductsListPage) },
          {
            path: 'products/new',
            loadComponent: () => import('./product-edit').then((m) => m.ProductEditPage),
            canDeactivate: [leaveGuard],
          },
          {
            path: 'products/:id',
            loadComponent: () => import('./product-edit').then((m) => m.ProductEditPage),
            canDeactivate: [leaveGuard],
          },
          { path: 'categories', loadComponent: () => import('./categories').then((m) => m.CategoriesPage) },
          { path: 'certifications', loadComponent: () => import('./certifications').then((m) => m.CertificationsPage) },
          { path: 'posts', loadComponent: () => import('./posts-list').then((m) => m.PostsListPage) },
          {
            path: 'posts/new',
            loadComponent: () => import('./post-edit').then((m) => m.PostEditPage),
            canDeactivate: [leaveGuard],
          },
          {
            path: 'posts/:id',
            loadComponent: () => import('./post-edit').then((m) => m.PostEditPage),
            canDeactivate: [leaveGuard],
          },
          { path: 'testimonials', loadComponent: () => import('./testimonials').then((m) => m.TestimonialsPage) },
          {
            path: 'settings',
            loadComponent: () => import('./settings').then((m) => m.SettingsPage),
            canDeactivate: [leaveGuard],
          },
          { path: 'password', loadComponent: () => import('./password').then((m) => m.PasswordPage) },
          { path: '**', redirectTo: '' },
        ],
      },
    ],
  },
];
