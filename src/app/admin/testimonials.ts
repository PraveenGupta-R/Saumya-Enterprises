import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from './admin-api.service';
import { UiService } from './admin-ui';
import { Testimonial } from '../core/models';

@Component({
  selector: 'adm-testimonials',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Customer testimonials</h1>
        <p class="muted">Add reviews only from real buyers who have given permission. The section stays hidden until you publish one.</p>
      </div>
      <button type="button" class="btn primary" (click)="add()">+ Add testimonial</button>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (items.length === 0) {
      <div class="card"><p class="empty">No testimonials yet. That is fine — add one when a buyer is happy to be quoted.</p></div>
    } @else {
      @for (t of items; track t) {
        <div class="card">
          <label class="field">
            <span>What the customer said *</span>
            <textarea rows="3" [(ngModel)]="t.text" [name]="'x' + $index"></textarea>
          </label>
          <div class="grid3">
            <label class="field">
              <span>Customer name *</span>
              <input type="text" [(ngModel)]="t.name" [name]="'n' + $index" />
            </label>
            <label class="field">
              <span>Company</span>
              <input type="text" [(ngModel)]="t.company" [name]="'c' + $index" />
            </label>
            <label class="field">
              <span>Country</span>
              <input type="text" [(ngModel)]="t.country" [name]="'k' + $index" />
            </label>
          </div>
          <div class="card-foot">
            <label class="check">
              <input type="checkbox" [(ngModel)]="t.published" [name]="'p' + $index" />
              <span>Show on website</span>
            </label>
            <label class="field inline">
              <span>Order</span>
              <input type="number" class="short" [(ngModel)]="t.sort" [name]="'o' + $index" />
            </label>
            <span class="grow"></span>
            <button type="button" class="btn danger ghost" (click)="remove(t)">Delete</button>
            <button type="button" class="btn primary" (click)="save(t)" [disabled]="busy()">Save</button>
          </div>
        </div>
      }
    }
  `,
})
export class TestimonialsPage {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  items: Testimonial[] = [];
  loading = signal(true);
  busy = signal(false);

  constructor() {
    this.load();
  }

  private async load() {
    try {
      this.items = (await this.api.list<Testimonial>('testimonials')).sort((a, b) => a.sort - b.sort);
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  add() {
    const max = this.items.reduce((m, c) => Math.max(m, c.sort), 0);
    this.items = [{ id: 0, name: '', company: '', country: '', text: '', published: false, sort: max + 1 }, ...this.items];
  }

  async save(t: Testimonial) {
    if (!t.name.trim() || !t.text.trim()) return this.ui.err('Please enter the customer name and what they said.');
    const body = { ...t, sort: Number(t.sort) || 0 };
    this.busy.set(true);
    try {
      if (t.id) {
        await this.api.update('testimonials', t.id, body);
      } else {
        const created = await this.api.create<Testimonial>('testimonials', body);
        if (created && created.id) Object.assign(t, created);
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

  async remove(t: Testimonial) {
    if (!t.id) {
      this.items = this.items.filter((x) => x !== t);
      return;
    }
    const yes = await this.ui.confirm({
      title: 'Delete this testimonial?',
      message: `The testimonial from ${t.name} will be permanently deleted.`,
      okText: 'Delete',
      danger: true,
    });
    if (!yes) return;
    try {
      await this.api.remove('testimonials', t.id);
      this.items = this.items.filter((x) => x !== t);
      this.ui.ok('Deleted.');
    } catch (e) {
      this.ui.err((e as Error).message);
    }
  }
}
