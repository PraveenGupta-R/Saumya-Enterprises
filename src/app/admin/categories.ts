import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from './admin-api.service';
import { UiService, slugify } from './admin-ui';
import { Category } from '../core/models';

@Component({
  selector: 'adm-categories',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Product categories</h1>
        <p class="muted">Groups such as Dry Fruits or Spices. Add a new category before adding products of a new kind.</p>
      </div>
      <button type="button" class="btn primary" (click)="add()">+ Add category</button>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (items.length === 0) {
      <div class="card"><p class="empty">No categories yet.</p></div>
    } @else {
      @for (c of items; track c) {
        <div class="card">
          <div class="grid2">
            <label class="field">
              <span>Category name *</span>
              <input type="text" [ngModel]="c.name" (ngModelChange)="onName(c, $event)" [name]="'n' + $index" />
            </label>
            <label class="field">
              <span>Page address (URL)</span>
              <input type="text" [(ngModel)]="c.slug" [name]="'s' + $index" />
            </label>
          </div>
          <label class="field">
            <span>Short description</span>
            <textarea rows="2" [(ngModel)]="c.description" [name]="'d' + $index"></textarea>
          </label>
          <div class="card-foot">
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
export class CategoriesPage {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  items: Category[] = [];
  loading = signal(true);
  busy = signal(false);
  private touched = new WeakSet<Category>();

  constructor() {
    this.load();
  }

  private async load() {
    try {
      this.items = (await this.api.list<Category>('categories')).sort((a, b) => a.sort - b.sort);
      this.items.forEach((c) => this.touched.add(c));
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  add() {
    const max = this.items.reduce((m, c) => Math.max(m, c.sort), 0);
    this.items = [{ id: 0, slug: '', name: '', description: '', sort: max + 1 }, ...this.items];
  }

  onName(c: Category, v: string) {
    c.name = v;
    if (!this.touched.has(c)) c.slug = slugify(v);
  }

  async save(c: Category) {
    if (!c.name.trim()) return this.ui.err('Please enter the category name.');
    if (!c.slug.trim()) c.slug = slugify(c.name);
    const body = { ...c, name: c.name.trim(), sort: Number(c.sort) || 0 };
    this.busy.set(true);
    try {
      if (c.id) {
        await this.api.update('categories', c.id, body);
      } else {
        const created = await this.api.create<Category>('categories', body);
        if (created && created.id) Object.assign(c, created);
        else await this.load();
      }
      this.touched.add(c);
      this.ui.ok('Category saved.');
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.busy.set(false);
    }
    return;
  }

  async remove(c: Category) {
    if (!c.id) {
      this.items = this.items.filter((x) => x !== c);
      return;
    }
    const yes = await this.ui.confirm({
      title: `Delete “${c.name}”?`,
      message: 'Products in this category will stay on the website but will have no category. This cannot be undone.',
      okText: 'Delete category',
      danger: true,
    });
    if (!yes) return;
    try {
      await this.api.remove('categories', c.id);
      this.items = this.items.filter((x) => x !== c);
      this.ui.ok('Category deleted.');
    } catch (e) {
      this.ui.err((e as Error).message);
    }
  }
}
