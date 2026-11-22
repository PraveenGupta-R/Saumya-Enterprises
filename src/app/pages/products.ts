import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PdfService } from '../core/pdf.service';
import { PageHero } from '../shared/page-hero';
import { ProductCard } from '../shared/product-card';
import { CtaBand } from '../shared/cta-band';

@Component({
  selector: 'app-products',
  imports: [RouterLink, PageHero, ProductCard, CtaBand],
  template: `
    <app-page-hero
      title="Our Products"
      eyebrow="Export Range"
      subtitle="Fresh Indian onions graded and packed to your specification, with more agricultural products planned."
      crumb="Products"
    />

    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2>Available for export inquiry</h2>
          <p>Only confirmed products are shown as available. Final availability depends on seasonal supply, export policy and destination regulations.</p>
        </div>
        <div class="grid grid-2">
          @for (p of site.availableProducts(); track p.slug) { <app-product-card [product]="p" /> }
        </div>
        <div class="btn-row" style="justify-content: center; margin-top: 32px">
          <button type="button" class="btn btn--green" (click)="catalogue()">Download Product Catalogue (PDF)</button>
          <a class="btn btn--primary" routerLink="/request-a-quote">Request a Quote</a>
        </div>
      </div>
    </section>

    @if (upcomingByCategory().length) {
      <section class="section section--alt">
        <div class="container">
          <div class="section-head">
            <span class="eyebrow">Future Range</span>
            <h2>Planned product expansion</h2>
            <p>These products are not yet available for export. Send an inquiry if you would like us to consider them for your requirement.</p>
          </div>
          <div class="grid grid-3">
            @for (g of upcomingByCategory(); track g.name) {
              <div class="card">
                <h3>{{ g.name }}</h3>
                <ul class="check-list">
                  @for (p of g.items; track p.slug) { <li>{{ p.name }} <span class="badge badge--coming_soon">Coming soon</span></li> }
                </ul>
              </div>
            }
          </div>
        </div>
      </section>
    }

    <app-cta-band />
  `,
})
export class ProductsPage {
  site = inject(SiteService);
  private pdf = inject(PdfService);

  upcomingByCategory = computed(() => {
    const groups = new Map<string, { name: string; items: ReturnType<SiteService['products']> }>();
    for (const p of this.site.upcomingProducts()) {
      const name = this.site.categoryName(p.categoryId) || 'Other products';
      if (!groups.has(name)) groups.set(name, { name, items: [] });
      groups.get(name)!.items.push(p);
    }
    return [...groups.values()];
  });

  constructor() {
    inject(SeoService).set({
      title: 'Our Products: Red Onion & White Onion',
      description: 'Export-quality Indian Red Onion and White Onion with sizes, grades and packaging options. Dry fruits and spices planned. Download our catalogue.',
      path: '/products',
    });
  }
  catalogue(): void {
    void this.pdf.downloadCatalogue();
  }
}
