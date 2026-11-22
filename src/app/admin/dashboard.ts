import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from './admin-api.service';
import { UiService, fmtDate, INQUIRY_LABELS } from './admin-ui';
import { AdminStats, Inquiry } from '../core/models';

@Component({
  selector: 'adm-dashboard',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Welcome back</h1>
        <p class="muted">Here is what is happening on your website.</p>
      </div>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else {
      @if (stats(); as s) {
        <div class="stats">
          <a class="stat" routerLink="/admin/inquiries">
            <span class="num">{{ s.inquiriesNew }}</span>
            <span class="lbl">New inquiries</span>
          </a>
          <a class="stat" routerLink="/admin/inquiries">
            <span class="num">{{ s.inquiriesLast7Days }}</span>
            <span class="lbl">Inquiries in last 7 days</span>
          </a>
          <a class="stat" routerLink="/admin/inquiries">
            <span class="num">{{ s.inquiriesTotal }}</span>
            <span class="lbl">Total inquiries</span>
          </a>
          <a class="stat" routerLink="/admin/products">
            <span class="num">{{ s.productsPublished }}<small> / {{ s.productsTotal }}</small></span>
            <span class="lbl">Products shown on website</span>
          </a>
          <a class="stat" routerLink="/admin/posts">
            <span class="num">{{ s.postsTotal }}</span>
            <span class="lbl">Blog &amp; news posts</span>
          </a>
          <a class="stat" routerLink="/admin/testimonials">
            <span class="num">{{ s.testimonialsTotal }}</span>
            <span class="lbl">Testimonials</span>
          </a>
        </div>
      }

      <div class="card">
        <div class="card-head">
          <h2>Latest inquiries</h2>
          <a routerLink="/admin/inquiries" class="btn sm ghost">See all</a>
        </div>
        @if (recent().length === 0) {
          <p class="empty">No inquiries yet. When a buyer sends a request from your website, it will appear here.</p>
        } @else {
          <ul class="list">
            @for (i of recent(); track i.id) {
              <li>
                <a routerLink="/admin/inquiries" class="row-link">
                  <span class="grow">
                    <strong>{{ i.name }}</strong>
                    @if (i.company) { <span class="muted"> · {{ i.company }}</span> }
                    <br />
                    <span class="muted">{{ i.country }} · {{ i.productName || 'General inquiry' }} · {{ date(i.createdAt) }}</span>
                  </span>
                  <span class="badge" [class]="'st-' + i.status">{{ label(i.status) }}</span>
                </a>
              </li>
            }
          </ul>
        }
      </div>

      <h2 class="section-title">Quick actions</h2>
      <div class="quick">
        <a routerLink="/admin/products/new" class="btn primary">+ Add a product</a>
        <a routerLink="/admin/posts/new" class="btn">+ Write a blog post</a>
        <a routerLink="/admin/certifications" class="btn">Update certifications</a>
        <a routerLink="/admin/settings" class="btn">Update contact details</a>
      </div>
    }
  `,
})
export class DashboardPage {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  loading = signal(true);
  stats = signal<AdminStats | null>(null);
  recent = signal<Inquiry[]>([]);
  date = fmtDate;
  label = (s: Inquiry['status']) => INQUIRY_LABELS[s] ?? s;

  constructor() {
    this.load();
  }

  private async load() {
    try {
      const [s, inq] = await Promise.all([
        this.api.get<AdminStats>('/api/admin/stats'),
        this.api.list<Inquiry>('inquiries'),
      ]);
      this.stats.set(s);
      this.recent.set(
        [...inq].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5),
      );
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
