import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../core/models';
import { SiteService, toBlocks } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PdfService } from '../core/pdf.service';
import { PageHero } from '../shared/page-hero';
import { QuoteForm } from '../shared/quote-form';
import { ProductCard } from '../shared/product-card';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, PageHero, QuoteForm, ProductCard],
  styles: [
    `
      .layout { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: start; }
      @media (max-width: 900px) { .layout { grid-template-columns: 1fr; gap: 28px; } }
      .gallery .main { border-radius: var(--radius); overflow: hidden; border: 1px solid var(--line); background: var(--green-100); box-shadow: var(--shadow-sm); }
      .gallery .main img { width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; }
      .thumbs { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
      .thumbs button { padding: 0; border: 2px solid transparent; border-radius: 10px; overflow: hidden; cursor: pointer; width: 84px; height: 64px; background: var(--green-100); }
      .thumbs button.on { border-color: var(--red-700); }
      .thumbs img { width: 100%; height: 100%; object-fit: cover; }
      .facts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0 24px; }
      .fact { background: var(--white); border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; }
      .fact b { display: block; font-size: .74rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-soft); }
      .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1em; }
      .tag { background: var(--green-100); color: var(--green-800); border-radius: 999px; padding: 6px 14px; font-weight: 600; font-size: .9rem; }
      .tag.premium { background: var(--gold-100); color: #6d4f0b; }
      .block { margin-bottom: 44px; }
      .note { background: var(--gold-100); border-left: 4px solid var(--gold-500); padding: 14px 18px; border-radius: 0 10px 10px 0; font-size: .95rem; }
      .quote-box { background: var(--white); border: 1px solid var(--line); border-radius: 20px; padding: 32px; box-shadow: var(--shadow); }
      @media (max-width: 560px) { .quote-box { padding: 20px; } }
    `,
  ],
  template: `
    @if (product(); as p) {
      <app-page-hero [title]="p.name" [subtitle]="p.shortDesc" eyebrow="Product Profile" [crumb]="p.name" />

      <section class="section">
        <div class="container">
          <div class="layout">
            <div class="gallery">
              <div class="main">
                @if (p.images.length) {
                  <img [src]="p.images[activeImg()] || p.images[0]" [alt]="p.name + ' photo ' + (activeImg() + 1)" width="800" height="600" />
                } @else {
                  <div style="aspect-ratio: 4/3; display: grid; place-items: center; color: var(--ink-soft)">Photo coming soon</div>
                }
              </div>
              @if (p.images.length > 1) {
                <div class="thumbs">
                  @for (img of p.images; track img; let i = $index) {
                    <button type="button" [class.on]="i === activeImg()" (click)="activeImg.set(i)" [attr.aria-label]="'Show photo ' + (i + 1)">
                      <img [src]="img" alt="" loading="lazy" />
                    </button>
                  }
                </div>
              }
            </div>

            <div>
              <span class="badge badge--{{ p.availability }}">{{ availLabel(p) }}</span>
              <h2 style="margin-top: 12px">{{ p.name }}</h2>
              @for (b of blocks(p.description); track $index) {
                @if (b.t === 'p') { <p>{{ b.text }}</p> }
              }
              <div class="facts">
                <div class="fact"><b>Country of origin</b>{{ p.origin || 'India' }}</div>
                <div class="fact"><b>MOQ</b>{{ shortMoq(p.moq) }}</div>
                <div class="fact"><b>Packaging</b>{{ p.packaging.length ? p.packaging[0].name : 'On request' }}</div>
                <div class="fact"><b>Grades</b>{{ p.grades.length ? p.grades.length + ' grades' : 'On request' }}</div>
              </div>
              <div class="btn-row">
                <a class="btn btn--primary" href="#quote">Request a Quote</a>
                <a class="btn btn--wa" [href]="site.waLinkFor(waText(p))" target="_blank" rel="noopener noreferrer">WhatsApp about {{ p.name }}</a>
                <button type="button" class="btn btn--ghost" (click)="download(p)">Product Sheet (PDF)</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      @if (p.specs.length) {
        <section class="section section--alt">
          <div class="container">
            <div class="layout">
              <div class="block">
                <h2>Product specifications</h2>
                <table class="spec-table"><tbody>
                  @for (r of p.specs; track r.label) { <tr><th>{{ r.label }}</th><td>{{ r.value }}</td></tr> }
                </tbody></table>
              </div>
              <div>
                @if (p.sizes.length) {
                  <div class="block">
                    <h2>Available sizes and grades</h2>
                    <table class="spec-table"><tbody>
                      @for (r of p.sizes; track r.name) { <tr><th>{{ r.name }}</th><td>{{ r.range }}</td></tr> }
                    </tbody></table>
                    @if (p.grades.length) {
                      <p style="margin: 18px 0 8px"><strong>Grades</strong></p>
                      <div class="tags">
                        @for (g of p.grades; track g) { <span class="tag" [class.premium]="g.toLowerCase().includes('premium')">{{ g }}</span> }
                      </div>
                    }
                    <p class="muted" style="font-size: .92rem">Indicative size ranges. Final sizing and grading can be customised to buyer specification and destination-market requirements.</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>
      }

      @if (p.packaging.length || p.moq || p.supplyCapacity) {
        <section class="section">
          <div class="container">
            <div class="grid grid-3">
              @if (p.packaging.length) {
                <div class="card">
                  <h3>Packaging options</h3>
                  @for (r of p.packaging; track r.name) { <p><strong>{{ r.name }}:</strong> {{ r.detail }}</p> }
                </div>
              }
              @if (p.moq) { <div class="card"><h3>Minimum order quantity</h3><p>{{ p.moq }}</p></div> }
              @if (p.supplyCapacity) { <div class="card"><h3>Supply capacity</h3><p>{{ p.supplyCapacity }}</p></div> }
            </div>
          </div>
        </section>
      }

      @if (p.qualityStandards.length || p.exportAvailability) {
        <section class="section section--alt">
          <div class="container layout">
            @if (p.qualityStandards.length) {
              <div>
                <h2>Quality standards</h2>
                <ul class="check-list">@for (q of p.qualityStandards; track q) { <li>{{ q }}</li> }</ul>
                <p><a routerLink="/quality-certifications">View our registrations and compliance status &rarr;</a></p>
              </div>
            }
            @if (p.exportAvailability) {
              <div>
                <h2>Export availability</h2>
                <p>{{ p.exportAvailability }}</p>
                <p class="note">Product details, sizes, grades, packaging, quantity and shipment terms are subject to confirmation in the final quotation or sales contract.</p>
              </div>
            }
          </div>
        </section>
      }

      <section class="section" id="quote">
        <div class="container" style="max-width: 880px">
          <div class="section-head">
            <span class="eyebrow">Request a Quote</span>
            <h2>Interested in {{ p.name }}?</h2>
            <p>Contact Saumya Enterprises for pricing, packaging details and shipment discussions.</p>
          </div>
          <div class="quote-box"><app-quote-form [productSlug]="p.slug" /></div>
        </div>
      </section>

      @if (others().length) {
        <section class="section section--alt">
          <div class="container">
            <div class="section-head"><h2>Other products</h2></div>
            <div class="grid grid-2">@for (o of others(); track o.slug) { <app-product-card [product]="o" /> }</div>
          </div>
        </section>
      }
    } @else if (checking()) {
      <app-page-hero title="Loading product..." />
    } @else {
      <app-page-hero title="Product not found" subtitle="This product is not available or may have been removed." crumb="Not found" />
      <section class="section"><div class="container center"><a class="btn btn--primary" routerLink="/products">See all products</a></div></section>
    }
  `,
})
export class ProductDetailPage {
  site = inject(SiteService);
  private seo = inject(SeoService);
  private pdf = inject(PdfService);

  slug = input.required<string>();
  activeImg = signal(0);
  private fetched = signal<Product | null>(null);
  checking = signal(false);

  product = computed(() => this.site.productBySlug(this.slug()) ?? (this.fetched()?.slug === this.slug() ? this.fetched() : null));
  others = computed(() => this.site.availableProducts().filter((p) => p.slug !== this.slug()).slice(0, 2));

  constructor() {
    // Products added later in the admin panel are not in the bundled data: fetch them from the API.
    effect(() => {
      const slug = this.slug();
      untracked(() => {
        this.activeImg.set(0);
        if (this.site.productBySlug(slug)) return;
        this.checking.set(true);
        this.site.fetchProduct(slug).then((p) => {
          this.fetched.set(p);
          this.checking.set(false);
        });
      });
    });

    effect(() => {
      const p = this.product();
      if (!p) {
        this.seo.set({ title: 'Product not found', description: 'This product could not be found.', path: '/products', noindex: true });
        return;
      }
      this.site.waContext.set(this.waText(p));
      const image = p.images[0];
      this.seo.set({
        title: p.seoTitle || `${p.name} Exporter from India`,
        description: p.seoDescription || p.shortDesc,
        path: `/products/${p.slug}`,
        image,
        noindex: p.availability !== 'available',
        type: 'product',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: p.name,
            description: p.shortDesc,
            image: p.images.map((i) => (i.startsWith('http') ? i : (this.site.settings().siteUrl || '').replace(/\/$/, '') + i)),
            countryOfOrigin: p.origin || 'India',
            brand: { '@type': 'Brand', name: this.site.settings().companyName },
          },
          this.seo.breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
            { name: p.name, path: `/products/${p.slug}` },
          ]),
        ],
      });
    });
  }

  blocks = toBlocks;
  availLabel(p: Product): string {
    return p.availability === 'available' ? 'Available for export inquiry' : p.availability === 'coming_soon' ? 'Coming soon' : 'Currently unavailable';
  }
  shortMoq(m: string): string {
    if (!m) return 'On request';
    return m.startsWith('As per buyer') ? 'As per buyer requirement' : m.length > 40 ? m.slice(0, 38) + '…' : m;
  }
  waText(p: Product): string {
    return `Hello Saumya Enterprises, I am interested in ${p.name}. Please share pricing and availability.`;
  }
  download(p: Product): void {
    void this.pdf.downloadProduct(p);
  }
}
