import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from './admin-api.service';
import { CERT_OPTIONS, UiService, slugify } from './admin-ui';
import { Certification } from '../core/models';

@Component({
  selector: 'adm-certifications',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Certifications &amp; registrations</h1>
        <p class="muted">Shown on the “Quality &amp; Certifications” page of your website.</p>
      </div>
      <button type="button" class="btn primary" (click)="add()">+ Add certification</button>
    </div>

    <div class="notice warn">
      <strong>Important:</strong> Only mark a certificate as <b>Obtained</b> after you have received and checked the actual document.
      Buyers may ask to see it. Use “Applied” or “Pending” until then.
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (items.length === 0) {
      <div class="card"><p class="empty">No certifications yet.</p></div>
    } @else {
      @for (c of items; track c) {
        <div class="card">
          <div class="grid2">
            <label class="field">
              <span>Name *</span>
              <input type="text" [(ngModel)]="c.name" [name]="'n' + $index" placeholder="e.g. APEDA RCMC" />
            </label>
            <label class="field">
              <span>Status</span>
              <select [(ngModel)]="c.status" [name]="'s' + $index">
                @for (o of statusOptions; track o.value) {
                  <option [value]="o.value">{{ o.label }}</option>
                }
              </select>
            </label>
          </div>
          @if (c.status === 'obtained') {
            <p class="notice warn small">This will be shown to visitors as <b>Obtained</b>. Please confirm you hold the verified document.</p>
          }
          <label class="field">
            <span>Note shown to visitors</span>
            <textarea rows="2" [(ngModel)]="c.note" [name]="'t' + $index"></textarea>
          </label>
          <div class="card-foot">
            <label class="check">
              <input type="checkbox" [(ngModel)]="c.published" [name]="'p' + $index" />
              <span>Show on website</span>
            </label>
            <label class="field inline">
              <span>Order</span>
              <input type="number" class="short" [(ngModel)]="c.sort" [name]="'o' + $index" />
            </label>
            <span class="grow"></span>
            <button type="button" class="btn danger ghost" (click)="remove(c)">Delete</button>
            <button type="button" class="btn primary" (click)="save(c)" [disabled]="busy()">Save</button>
          </div>
        </div>
      }
    }
  `,
})
export class CertificationsPage {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  items: Certification[] = [];
  loading = signal(true);
  busy = signal(false);
  statusOptions = CERT_OPTIONS;

  constructor() {
    this.load();
  }

  private async load() {
    try {
      this.items = (await this.api.list<Certification>('certifications')).sort((a, b) => a.sort - b.sort);
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  add() {
    const max = this.items.reduce((m, c) => Math.max(m, c.sort), 0);
    this.items = [{ id: 0, key: '', name: '', status: 'pending', note: '', sort: max + 1, published: true }, ...this.items];
  }

  async save(c: Certification) {
    if (!c.name.trim()) return this.ui.err('Please enter the certification name.');
    if (!c.key) c.key = slugify(c.name);
    const body = { ...c, name: c.name.trim(), sort: Number(c.sort) || 0 };
    this.busy.set(true);
    try {
      if (c.id) {
        await this.api.update('certifications', c.id, body);
      } else {
        const created = await this.api.create<Certification>('certifications', body);
        if (created && created.id) Object.assign(c, created);
        else await this.load();
      }
      this.ui.ok('Saved.');
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.busy.set(false);
    }
    return;
  }

  async remove(c: Certification) {
    if (!c.id) {
      this.items = this.items.filter((x) => x !== c);
      return;
    }
    const yes = await this.ui.confirm({
      title: `Delete “${c.name}”?`,
      message: 'It will be removed from the website. To hide it temporarily, untick “Show on website” instead.',
      okText: 'Delete',
      danger: true,
    });
    if (!yes) return;
    try {
      await this.api.remove('certifications', c.id);
      this.items = this.items.filter((x) => x !== c);
      this.ui.ok('Deleted.');
    } catch (e) {
      this.ui.err((e as Error).message);
    }
  }
}
