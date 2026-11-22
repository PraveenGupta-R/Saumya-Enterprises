import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';
import { QuoteForm } from '../shared/quote-form';
import { IconComponent } from '../shared/icon';

@Component({
  selector: 'app-quote',
  imports: [PageHero, QuoteForm, IconComponent],
  styles: [
    `
      .box { background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 32px; box-shadow: var(--shadow); }
      @media (max-width: 560px) { .box { padding: 20px; } }
      .qlayout { align-items: start; grid-template-columns: 1.3fr 0.7fr; }
      @media (max-width: 980px) { .qlayout { grid-template-columns: minmax(0, 1fr); } }
      ul { list-style: none; padding: 0; }
      li { display: flex; gap: 12px; margin-bottom: 14px; }
      li app-icon { color: var(--green-700); }
    `,
  ],
  template: `
    <app-page-hero title="Request a Quote" eyebrow="Bulk Inquiries" subtitle="Tell us what you need. We will reply with specifications, packaging options and pricing." crumb="Request a Quote" />
    <section class="section">
      <div class="container split qlayout">
        <div class="box"><app-quote-form [productSlug]="product" /></div>
        <aside>
          <h3>What happens next?</h3>
          <ul>
            <li><app-icon name="check" [size]="22" /><span>We review your requirement and confirm availability.</span></li>
            <li><app-icon name="check" [size]="22" /><span>We share specifications, packaging options and a quotation (FOB or CIF where available).</span></li>
            <li><app-icon name="check" [size]="22" /><span>Once terms are agreed, we arrange grading, packing, documents and shipment.</span></li>
          </ul>
          <div class="card">
            <h3 style="font-size: 1.05rem">Prefer to talk?</h3>
            <p class="muted">{{ s().phone }} (WhatsApp)<br />{{ s().hours }}</p>
            <a class="btn btn--wa btn--sm" [href]="site.waLink()" target="_blank" rel="noopener noreferrer">WhatsApp us</a>
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class QuotePage {
  site = inject(SiteService);
  s = this.site.settings;
  product = inject(ActivatedRoute).snapshot.queryParamMap.get('product') ?? '';
  constructor() {
    inject(SeoService).set({
      title: 'Request a Quote',
      description: 'Request a quotation for Indian Red Onion or White Onion. Share your quantity, grade and destination and we will reply with pricing and packaging details.',
      path: '/request-a-quote',
    });
  }
}
