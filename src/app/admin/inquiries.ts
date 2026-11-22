import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from './admin-api.service';
import { UiService, fmtDate, INQUIRY_LABELS, INQUIRY_OPTIONS } from './admin-ui';
import { Inquiry, InquiryStatus } from '../core/models';

@Component({
  selector: 'adm-inquiries',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Buyer inquiries</h1>
        <p class="muted">Requests sent from your website. Tap one to see the details and reply.</p>
      </div>
      <a class="btn" href="/api/admin/inquiries.csv" download="saumya-inquiries.csv">⬇ Download all (CSV / Excel)</a>
    </div>

    <div class="toolbar">
      <input type="search" placeholder="Search name, company, country, email…" [ngModel]="q()" (ngModelChange)="q.set($event)" aria-label="Search inquiries" />
      <select [ngModel]="status()" (ngModelChange)="status.set($event)" aria-label="Filter by status">
        <option value="">All statuses</option>
        @for (o of statusOptions; track o.value) {
          <option [value]="o.value">{{ o.label }}</option>
        }
      </select>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (filtered().length === 0) {
      <div class="card"><p class="empty">{{ items().length ? 'No inquiries match your search.' : 'No inquiries yet.' }}</p></div>
    } @else {
      <div class="card flush">
        <ul class="list">
          @for (i of filtered(); track i.id) {
            <li>
              <button type="button" class="row-link" (click)="open(i)">
                <span class="grow">
                  <strong>{{ i.name }}</strong>
                  @if (i.company) { <span class="muted"> · {{ i.company }}</span> }
                  <br />
                  <span class="muted">{{ i.country }} · {{ i.productName || 'General inquiry' }}@if (i.quantity) { · {{ i.quantity }} }</span>
                  <br />
                  <span class="tiny muted">{{ date(i.createdAt) }}</span>
                </span>
                <span class="badge" [class]="'st-' + i.status">{{ label(i.status) }}</span>
              </button>
            </li>
          }
        </ul>
      </div>
    }

    @if (sel(); as s) {
      <div class="drawer-back" (click)="close()"></div>
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Inquiry details">
        <div class="drawer-head">
          <h2>Inquiry from {{ s.name }}</h2>
          <button type="button" class="icon-btn" (click)="close()" aria-label="Close">✕</button>
        </div>
        <div class="drawer-body">
          <dl class="kv">
            <dt>Received</dt><dd>{{ date(s.createdAt) }}</dd>
            <dt>Product</dt><dd>{{ s.productName || s.productSlug || 'General inquiry' }}</dd>
            <dt>Buyer</dt><dd>{{ s.name }}</dd>
            <dt>Company</dt><dd>{{ s.company || '—' }}</dd>
            <dt>Country</dt><dd>{{ s.country || '—' }}</dd>
            <dt>Email</dt><dd><a [href]="'mailto:' + s.email">{{ s.email }}</a></dd>
            <dt>WhatsApp</dt><dd>{{ s.whatsapp || '—' }}</dd>
            <dt>Quantity</dt><dd>{{ s.quantity || '—' }}</dd>
            <dt>Message</dt><dd class="pre">{{ s.message || '—' }}</dd>
          </dl>

          <div class="quick">
            @if (waLink(s)) {
              <a class="btn primary" [href]="waLink(s)" target="_blank" rel="noopener">Reply on WhatsApp</a>
            }
            <a class="btn" [href]="'mailto:' + s.email + '?subject=' + encode('Your inquiry – Saumya Enterprises')">Reply by email</a>
          </div>

          <label class="field">
            <span>Status</span>
            <select [(ngModel)]="s.status" name="status">
              @for (o of statusOptions; track o.value) {
                <option [value]="o.value">{{ o.label }}</option>
              }
            </select>
            <small class="help">Keep track of where this buyer is in your process.</small>
          </label>
          <label class="field">
            <span>Your private notes</span>
            <textarea rows="4" [(ngModel)]="s.notes" name="notes" placeholder="Only you can see these notes."></textarea>
          </label>
        </div>
        <div class="drawer-foot">
          <button type="button" class="btn danger ghost" (click)="remove(s)">Delete</button>
          <span class="grow"></span>
          <button type="button" class="btn primary" (click)="save(s)" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
        </div>
      </aside>
    }
  `,
})
export class InquiriesPage {
  private api = inject(AdminApi);
  private ui = inject(UiService);

  items = signal<Inquiry[]>([]);
  loading = signal(true);
  saving = signal(false);
  q = signal('');
  status = signal('');
  sel = signal<Inquiry | null>(null);
  statusOptions = INQUIRY_OPTIONS;
  date = fmtDate;
  label = (s: InquiryStatus) => INQUIRY_LABELS[s] ?? s;
  encode = encodeURIComponent;

  filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const st = this.status();
    return this.items()
      .filter((i) => !st || i.status === st)
      .filter(
        (i) =>
          !q ||
          [i.name, i.company, i.country, i.email, i.productName, i.message].some((v) => (v || '').toLowerCase().includes(q)),
      )
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  });

  constructor() {
    this.load();
  }

  private async load() {
    try {
      this.items.set(await this.api.list<Inquiry>('inquiries'));
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  open(i: Inquiry) {
    this.sel.set({ ...i });
  }
  close() {
    this.sel.set(null);
  }

  waLink(i: Inquiry): string {
    const digits = (i.whatsapp || '').replace(/\D/g, '');
    if (digits.length < 8) return '';
    const text = `Hello ${i.name}, thank you for your inquiry to Saumya Enterprises.`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }

  async save(s: Inquiry) {
    this.saving.set(true);
    try {
      await this.api.update('inquiries', s.id, { status: s.status, notes: s.notes ?? '' });
      this.items.update((list) => list.map((x) => (x.id === s.id ? { ...x, status: s.status, notes: s.notes } : x)));
      this.ui.ok('Inquiry updated.');
      this.close();
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  async remove(s: Inquiry) {
    const yes = await this.ui.confirm({
      title: 'Delete this inquiry?',
      message: `The inquiry from ${s.name} will be permanently deleted. This cannot be undone.`,
      okText: 'Delete',
      danger: true,
    });
    if (!yes) return;
    try {
      await this.api.remove('inquiries', s.id);
      this.items.update((list) => list.filter((x) => x.id !== s.id));
      this.ui.ok('Inquiry deleted.');
      this.close();
    } catch (e) {
      this.ui.err((e as Error).message);
    }
  }
}
