import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApi } from './admin-api.service';
import { ImageUploader } from './admin-images';
import { AVAILABILITY_OPTIONS, DirtyAware, UiService, slugify } from './admin-ui';
import { Category, Product } from '../core/models';

const blank = (): Product => ({
  id: 0,
  slug: '',
  categoryId: null,
  name: '',
  shortDesc: '',
  description: '',
  origin: 'India',
  availability: 'available',
  specs: [],
  sizes: [],
  grades: [],
  packaging: [],
  moq: '',
  supplyCapacity: '',
  qualityStandards: [],
  exportAvailability: '',
  images: [],
  seoTitle: '',
  seoDescription: '',
  sort: 100,
  published: true,
});

@Component({
  selector: 'adm-product-edit',
  imports: [FormsModule, RouterLink, ImageUploader],
  template: `
    <div class="page-head">
      <div>
        <a routerLink="/admin/products" class="back">← All products</a>
        <h1>{{ m.id ? 'Edit product' : 'Add a product' }}</h1>
      </div>
      <button type="button" class="btn primary" (click)="save()" [disabled]="saving() || loading()">
        {{ saving() ? 'Saving…' : 'Save product' }}
      </button>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else {
      <div class="card">
        <h2>Basic details</h2>
        <label class="field">
          <span>Product name *</span>
          <input type="text" [ngModel]="m.name" (ngModelChange)="onName($event)" name="name" placeholder="e.g. Fresh Red Onion" />
        </label>
        <div class="grid2">
          <label class="field">
            <span>Page address (URL)</span>
            <input type="text" [ngModel]="m.slug" (ngModelChange)="onSlug($event)" name="slug" />
            <small class="help">Appears as /products/{{ m.slug || 'product-name' }}. Created automatically from the name.</small>
          </label>
          <label class="field">
            <span>Category</span>
            <select [(ngModel)]="m.categoryId" name="cat">
              <option [ngValue]="null">No category</option>
              @for (c of cats(); track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
          </label>
        </div>
        <div class="grid2">
          <label class="field">
            <span>Is this product available to buyers?</span>
            <select [(ngModel)]="m.availability" name="avail">
              @for (o of availOptions; track o.value) {
                <option [value]="o.value">{{ o.label }}</option>
              }
            </select>
            <small class="help">Only products marked “Available now” are shown as currently available for export.</small>
          </label>
          <label class="field">
            <span>Country of origin</span>
            <input type="text" [(ngModel)]="m.origin" name="origin" />
          </label>
        </div>
        <label class="check">
          <input type="checkbox" [(ngModel)]="m.published" name="published" />
          <span>Show this product on the website</span>
        </label>
        <label class="field">
          <span>Display order</span>
          <input type="number" [(ngModel)]="m.sort" name="sort" class="short" />
          <small class="help">Lower numbers appear first in the product list.</small>
        </label>
      </div>

      <div class="card">
        <h2>Photos</h2>
        <adm-images [(images)]="m.images" />
      </div>

      <div class="card">
        <h2>Description</h2>
        <label class="field">
          <span>Short summary</span>
          <textarea rows="2" [(ngModel)]="m.shortDesc" name="short"></textarea>
          <small class="help">One or two sentences, shown on product cards.</small>
        </label>
        <label class="field">
          <span>Full description</span>
          <textarea rows="7" [(ngModel)]="m.description" name="desc"></textarea>
          <small class="help">Leave a blank line between paragraphs.</small>
        </label>
      </div>

      <div class="card">
        <h2>Specifications</h2>
        <p class="help">Facts about the product, such as Colour, Shape, Taste, Shelf life.</p>
        @for (r of m.specs; track $index) {
          <div class="rep">
            <input type="text" [(ngModel)]="r.label" [name]="'sl' + $index" placeholder="Name (e.g. Colour)" aria-label="Specification name" />
            <input type="text" [(ngModel)]="r.value" [name]="'sv' + $index" placeholder="Value (e.g. Red to deep purple)" aria-label="Specification value" />
            <button type="button" class="icon-btn danger" (click)="m.specs.splice($index, 1)" aria-label="Remove row">✕</button>
          </div>
        }
        <button type="button" class="btn sm" (click)="m.specs.push({ label: '', value: '' })">+ Add specification</button>
      </div>

      <div class="card">
        <h2>Sizes &amp; grades</h2>
        <p class="help">Available sizes, for example Small — 25–40 mm.</p>
        @for (r of m.sizes; track $index) {
          <div class="rep">
            <input type="text" [(ngModel)]="r.name" [name]="'zn' + $index" placeholder="Size name (e.g. Medium)" aria-label="Size name" />
            <input type="text" [(ngModel)]="r.range" [name]="'zr' + $index" placeholder="Range (e.g. 40–55 mm)" aria-label="Size range" />
            <button type="button" class="icon-btn danger" (click)="m.sizes.splice($index, 1)" aria-label="Remove row">✕</button>
          </div>
        }
        <button type="button" class="btn sm" (click)="m.sizes.push({ name: '', range: '' })">+ Add size</button>

        <h3>Grades</h3>
        <div class="chips">
          @for (g of m.grades; track $index) {
            <span class="chip">{{ g }}<button type="button" (click)="m.grades.splice($index, 1)" aria-label="Remove grade">✕</button></span>
          }
        </div>
        <div class="rep">
          <input type="text" [(ngModel)]="newGrade" name="newGrade" placeholder="Type a grade, e.g. Premium Export Grade" (keydown.enter)="addGrade($event)" />
          <button type="button" class="btn sm" (click)="addGrade()">Add grade</button>
        </div>
      </div>

      <div class="card">
        <h2>Packaging</h2>
        @for (r of m.packaging; track $index) {
          <div class="rep">
            <input type="text" [(ngModel)]="r.name" [name]="'pn' + $index" placeholder="Type (e.g. Mesh bags)" aria-label="Packaging type" />
            <input type="text" [(ngModel)]="r.detail" [name]="'pd' + $index" placeholder="Details (e.g. 5 kg, 10 kg, 25 kg)" aria-label="Packaging details" />
            <button type="button" class="icon-btn danger" (click)="m.packaging.splice($index, 1)" aria-label="Remove row">✕</button>
          </div>
        }
        <button type="button" class="btn sm" (click)="m.packaging.push({ name: '', detail: '' })">+ Add packaging option</button>
      </div>

      <div class="card">
        <h2>Trade details</h2>
        <label class="field">
          <span>Minimum order quantity (MOQ)</span>
          <textarea rows="2" [(ngModel)]="m.moq" name="moq"></textarea>
        </label>
        <label class="field">
          <span>Supply capacity</span>
          <textarea rows="3" [(ngModel)]="m.supplyCapacity" name="supply"></textarea>
        </label>
        <label class="field">
          <span>Export availability</span>
          <textarea rows="3" [(ngModel)]="m.exportAvailability" name="export"></textarea>
          <small class="help">Do not claim shipments you have not made. Say “inquiries welcome” for target markets.</small>
        </label>

        <h3>Quality standards</h3>
        @for (q of m.qualityStandards; track $index) {
          <div class="rep one">
            <input type="text" [ngModel]="q" (ngModelChange)="m.qualityStandards[$index] = $event" [name]="'q' + $index" aria-label="Quality point" />
            <button type="button" class="icon-btn danger" (click)="m.qualityStandards.splice($index, 1)" aria-label="Remove row">✕</button>
          </div>
        }
        <button type="button" class="btn sm" (click)="m.qualityStandards.push('')">+ Add quality point</button>
      </div>

      <div class="card">
        <h2>Google search (SEO)</h2>
        <p class="help">Optional. Leave empty to use the product name and summary automatically.</p>
        <label class="field">
          <span>Search title</span>
          <input type="text" [(ngModel)]="m.seoTitle" name="seot" maxlength="70" />
          <small class="help">{{ m.seoTitle.length }}/70 characters</small>
        </label>
        <label class="field">
          <span>Search description</span>
          <textarea rows="2" [(ngModel)]="m.seoDescription" name="seod" maxlength="170"></textarea>
          <small class="help">{{ m.seoDescription.length }}/170 characters</small>
        </label>
      </div>

      <div class="savebar">
        <a routerLink="/admin/products" class="btn ghost">Cancel</a>
        <button type="button" class="btn primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save product' }}</button>
      </div>
    }
  `,
})
export class ProductEditPage implements DirtyAware {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  m: Product = blank();
  cats = signal<Category[]>([]);
  loading = signal(true);
  saving = signal(false);
  availOptions = AVAILABILITY_OPTIONS;
  newGrade = '';
  private snap = '';
  private slugTouched = false;

  constructor() {
    this.load();
  }

  private async load() {
    const id = this.route.snapshot.paramMap.get('id');
    try {
      this.cats.set(await this.api.list<Category>('categories'));
      if (id) {
        const p = await this.api.one<Product>('products', id);
        this.m = { ...blank(), ...p };
        this.slugTouched = true;
      }
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.mark();
      this.loading.set(false);
    }
  }

  private mark() {
    this.snap = JSON.stringify(this.m);
  }
  isDirty() {
    return !this.loading() && JSON.stringify(this.m) !== this.snap;
  }
  @HostListener('window:beforeunload', ['$event'])
  unload(e: BeforeUnloadEvent) {
    if (this.isDirty()) e.preventDefault();
  }

  onName(v: string) {
    this.m.name = v;
    if (!this.slugTouched) this.m.slug = slugify(v);
  }
  onSlug(v: string) {
    this.slugTouched = true;
    this.m.slug = slugify(v);
  }

  addGrade(ev?: Event) {
    ev?.preventDefault();
    const g = this.newGrade.trim();
    if (g) this.m.grades.push(g);
    this.newGrade = '';
  }

  async save() {
    if (!this.m.name.trim()) return this.ui.err('Please enter the product name.');
    if (!this.m.slug.trim()) this.m.slug = slugify(this.m.name);
    if (!this.m.slug) return this.ui.err('Please enter a page address for this product.');
    this.addGrade();
    const body: Product = {
      ...this.m,
      name: this.m.name.trim(),
      specs: this.m.specs.filter((r) => r.label.trim() || r.value.trim()),
      sizes: this.m.sizes.filter((r) => r.name.trim() || r.range.trim()),
      packaging: this.m.packaging.filter((r) => r.name.trim() || r.detail.trim()),
      qualityStandards: this.m.qualityStandards.map((q) => q.trim()).filter(Boolean),
      sort: Number(this.m.sort) || 0,
    };
    this.saving.set(true);
    try {
      if (this.m.id) await this.api.update('products', this.m.id, body);
      else await this.api.create('products', body);
      this.m = body;
      this.mark();
      this.ui.ok('Product saved.');
      await this.router.navigate(['/admin/products']);
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.saving.set(false);
    }
    return;
  }
}
