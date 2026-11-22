import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AdminApi } from './admin-api.service';

@Component({
  selector: 'adm-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell" [class.open]="open()">
      <header class="topbar">
        <button type="button" class="menu-btn" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <strong>Saumya Admin</strong>
        <a class="btn sm ghost light" href="/" target="_blank" rel="noopener">View site</a>
      </header>

      <aside class="side">
        <div class="brand">
          <span class="brand-mark">S</span>
          <span>Saumya Enterprises<small>Website admin</small></span>
        </div>
        <nav aria-label="Admin menu">
          @for (n of nav; track n.path) {
            <a [routerLink]="n.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: n.path === '/admin' }">
              <span class="ico" aria-hidden="true">{{ n.icon }}</span>{{ n.label }}
            </a>
          }
        </nav>
        <div class="side-foot">
          <a href="/" target="_blank" rel="noopener"><span class="ico" aria-hidden="true">🌐</span>View website</a>
          <button type="button" (click)="logout()"><span class="ico" aria-hidden="true">🚪</span>Log out</button>
        </div>
      </aside>
      <div class="backdrop" (click)="open.set(false)"></div>

      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminShell {
  private router = inject(Router);
  private api = inject(AdminApi);
  open = signal(false);

  nav = [
    { path: '/admin', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/inquiries', label: 'Inquiries', icon: '📩' },
    { path: '/admin/products', label: 'Products', icon: '🧅' },
    { path: '/admin/categories', label: 'Categories', icon: '🗂️' },
    { path: '/admin/certifications', label: 'Certifications', icon: '✅' },
    { path: '/admin/posts', label: 'Blog & News', icon: '📰' },
    { path: '/admin/testimonials', label: 'Testimonials', icon: '💬' },
    { path: '/admin/settings', label: 'Company & Contact', icon: '⚙️' },
    { path: '/admin/password', label: 'Change password', icon: '🔑' },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.open.set(false));
  }

  async logout() {
    try {
      await this.api.post('/api/admin/logout', {}, true);
    } catch {
      /* ignore – we leave anyway */
    }
    this.router.navigate(['/admin/login']);
  }
}
