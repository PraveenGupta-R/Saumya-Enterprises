import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from './admin-api.service';
import { AVAILABILITY_LABELS, UiService } from './admin-ui';
import { Category, Product } from '../core/models';

@Component({
  selector: 'adm-products-list',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Products</h1>
        <p class="muted">Everything you sell to overseas buyers. Only products marked “Show on website” are visible to visitors.</p>
      </div>
      <a class="btn primary" routerLink="/admin/products/new">+ Add product</a>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (items().length === 0) {
      <div class="card"><p class="empty">No products yet. Click “Add product” to create your first one.</p></div>
    } @else {
      <div class="card flush">
        <ul class="list prod-list">
          @for (p of items(); track p.id) {
            <li class="prod-row">
              <a class="thumb" [routerLink]="['/admin/products', p.id]">
                @if (p.images[0]) { <img [src]="p.images[0]" alt="" loading="lazy" /> } @else { <span>No photo</span> }
              </a>
              <div class="grow">
                <a [routerLink]="['/admin/products', p.id]"><strong>{{ p.name }}</strong></a>
                <div class="muted tiny">{{ catName(p.categoryId) }} · /products/{{ p.slug }}</div>
                <span class="badge" [class]="'av-' + p.availability">{{ avail[p.availability] }}</span>
              </div>
              <label class="switch" title="Show this product on the website">
                <input type="checkbox" [checked]="p.published" (change)="togglePublished(p)" />
                <span class="track"></span>
                <span class="sw-lbl">Show on website</span>
              </label>
              <label class="sortbox" title="Lower numbers appear first">
                <span class="tiny muted">Order</span>
                <input type="number" [value]="p.sort" (change)="setSort(p, $event)" aria-label="Display order" />
              </label>
              <div class="row-actions">
                <a class="btn sm" [routerLink]="['/admin/products', p.id]">Edit</a>
                <button type="button" class="btn sm danger ghost" (click)="remove(p)">Delete</button>
              </div>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class ProductsListPage {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  items = signal<Product[]>([]);
  cats = signal<Category[]>([]);
  loading = signal(true);
  avail = AVAILABILITY_LABELS;

  constructor() {
    this.load();
  }

  private async load() {
    try {
      const [p, c] = await Promise.all([this.api.list<Product>('products'), this.api.list<Category>('categories')]);
      this.items.set([...p].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)));
      this.cats.set(c);
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  catName(id: number | null): string {
    return this.cats().find((c) => c.id === id)?.name ?? 'No category';
  }

  private async patch(p: Product, change: Partial<Product>) {
    const next = { ...p, ...change };
    try {
      await this.api.update('products', p.id, next);
      this.items.update((l) => l.map((x) => (x.id === p.id ? next : x)).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)));
      this.ui.ok('Saved.');
    } catch (e) {
      this.ui.err((e as Error).message);
      this.items.update((l) => [...l]); // refresh checkbox state
    }
  }

  togglePublished(p: Product) {
    return this.patch(p, { published: !p.published });
  }

  setSort(p: Product, ev: Event) {
    const n = Number((ev.target as HTMLInputElement).value);
    if (Number.isFinite(n) && n !== p.sort) return this.patch(p, { sort: Math.round(n) });
    return;
  }

  async remove(p: Product) {
    const yes = await this.ui.confirm({
      title: `Delete “${p.name}”?`,
      message: 'This product and its page will be removed from the website. This cannot be undone. (To hide it temporarily, switch off “Show on website” instead.)',
      okText: 'Delete product',
      danger: true,
    });
    if (!yes) return;
    try {
      await this.api.remove('products', p.id);
      this.items.update((l) => l.filter((x) => x.id !== p.id));
      this.ui.ok('Product deleted.');
    } catch (e) {
      this.ui.err((e as Error).message);
    }
  }
}
