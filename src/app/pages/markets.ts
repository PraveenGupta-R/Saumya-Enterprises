import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';
import { IconComponent } from '../shared/icon';
import { CtaBand } from '../shared/cta-band';

@Component({
  selector: 'app-markets',
  imports: [RouterLink, PageHero, IconComponent, CtaBand],
  styles: [
    `
      .m { display: flex; flex-direction: column; gap: 6px; }
      .m .code { width: 54px; height: 54px; border-radius: 14px; background: var(--green-800); color: var(--gold-400); display: grid; place-items: center; font-weight: 700; letter-spacing: .06em; margin-bottom: 10px; }
      .note { background: var(--gold-100); border-left: 4px solid var(--gold-500); padding: 16px 20px; border-radius: 0 12px 12px 0; }
    `,
  ],
  template: `
    <app-page-hero
      title="Export Markets"
      eyebrow="Global Reach"
      subtitle="We are building relationships with importers, wholesalers and distributors in our target markets."
      crumb="Export Markets"
    />

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Target Markets</span>
          <h2>Where we are looking to supply</h2>
          <p>Our initial focus markets for Indian Red Onion and White Onion.</p>
        </div>
        <div class="grid grid-4">
          @for (m of s().markets; track m.country) {
            <div class="card card--hover m">
              <div class="code">{{ m.country.slice(0, 2).toUpperCase() }}</div>
              <h3 style="margin: 0">{{ m.country }}</h3>
              <span class="muted" style="font-size: .88rem">{{ m.region }}</span>
              <p style="margin: 8px 0 0">{{ m.note }}</p>
            </div>
          }
        </div>
        <p class="note" style="margin-top: 32px">
          <strong>Please note:</strong> These are our target markets. Availability for each destination is subject to seasonal supply, prevailing
          government export policy and the import regulations of the destination country at the time of order.
        </p>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Export Capabilities</span>
          <h2>How we support international buyers</h2>
          <p>Actual shipping capabilities and commercial terms are confirmed separately for each order.</p>
        </div>
        <div class="grid grid-3">
          @for (c of caps; track c.title) {
            <div class="card">
              <div class="icon-bubble"><app-icon [name]="c.icon" /></div>
              <h3>{{ c.title }}</h3>
              <p class="muted">{{ c.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container center">
        <h2>Looking to import from India to another country?</h2>
        <p class="lead" style="max-width: 640px; margin-inline: auto">
          If your market is not listed, send us an inquiry. We will tell you honestly whether we can support it.
        </p>
        <a class="btn btn--primary" routerLink="/contact">Contact Us</a>
      </div>
    </section>

    <app-cta-band />
  `,
})
export class MarketsPage {
  s = inject(SiteService).settings;
  caps = [
    { icon: 'box', title: 'International bulk orders', text: 'Container-load and bulk quantities, with order size agreed per buyer.' },
    { icon: 'doc', title: 'Export documentation support', text: 'Help with the paperwork that accompanies an export shipment.' },
    { icon: 'ship', title: 'Sea freight & road transport', text: 'Sea freight and road transportation, where applicable to the destination.' },
    { icon: 'price', title: 'FOB & CIF quotations', text: 'FOB and CIF quotation options, where available.' },
    { icon: 'chain', title: 'Logistics coordination', text: 'Coordination with freight forwarders and logistics partners.' },
    { icon: 'label', title: 'Private labelling', text: 'Custom labelling and branding, subject to availability.' },
  ];
  constructor() {
    inject(SeoService).set({
      title: 'Export Markets: UAE, Bangladesh, Malaysia, Nepal',
      description: 'Saumya Enterprises targets onion export to the UAE, Bangladesh, Malaysia and Nepal. Bulk orders, FOB/CIF quotations and logistics coordination.',
      path: '/export-markets',
    });
  }
}
