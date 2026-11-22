import { Component, inject } from '@angular/core';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';
import { IconComponent } from '../shared/icon';
import { CtaBand } from '../shared/cta-band';

@Component({
  selector: 'app-logistics',
  imports: [PageHero, IconComponent, CtaBand],
  styles: [
    `
      .flow { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; counter-reset: f; }
      .flow > div { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 20px 16px; text-align: center; position: relative; }
      .flow > div::before { counter-increment: f; content: counter(f); display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--red-700); color: #fff; font-weight: 700; margin: 0 auto 10px; }
      .flow h3 { font-size: 1rem; margin-bottom: 4px; }
      .flow p { font-size: .88rem; margin: 0; color: var(--ink-soft); }
      @media (max-width: 900px) { .flow { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 520px) { .flow { grid-template-columns: 1fr; } }
      .note { background: var(--gold-100); border-left: 4px solid var(--gold-500); padding: 16px 20px; border-radius: 0 12px 12px 0; }
    `,
  ],
  template: `
    <app-page-hero
      title="Infrastructure & Logistics"
      eyebrow="Supply Chain"
      subtitle="Sourcing, storage, packing and freight coordination for export shipments."
      crumb="Infrastructure & Logistics"
    />

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Our Infrastructure</span>
          <h2>Asset-light, flexible and scalable</h2>
          <p>We work through a sourcing network and third-party facilities, so we can scale supply to each order.</p>
        </div>
        <div class="grid grid-3">
          <div class="card"><div class="icon-bubble"><app-icon name="warehouse" /></div><h3>Warehousing</h3><p class="muted">{{ s().warehouse }} used for storage and grading before dispatch, with appropriate ventilation.</p></div>
          <div class="card"><div class="icon-bubble"><app-icon name="sprout" /></div><h3>Sourcing network</h3><p class="muted">Produce from selected farms and trading partners, subject to seasonal availability.</p></div>
          <div class="card"><div class="icon-bubble"><app-icon name="box" /></div><h3>Packing</h3><p class="muted">Ventilated mesh bags of 5, 10, 20, 25 and 50 kg, plus custom labelling and packing on request.</p></div>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Our Process</span>
          <h2>From order to delivery</h2>
        </div>
        <div class="flow">
          <div><h3>Order confirmed</h3><p>Specifications, quantity and terms agreed.</p></div>
          <div><h3>Sorting &amp; grading</h3><p>Onions sorted to the agreed size and grade.</p></div>
          <div><h3>Packing</h3><p>Packed in ventilated bags with your labelling.</p></div>
          <div><h3>Documentation</h3><p>Export documents prepared; phytosanitary certificate where required.</p></div>
          <div><h3>Dispatch</h3><p>Loaded and moved by road, sea or both as applicable.</p></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Logistics</span>
          <h2>Transport and freight coordination</h2>
        </div>
        <div class="grid grid-3">
          <div class="card"><div class="icon-bubble"><app-icon name="ship" /></div><h3>Sea freight</h3><p class="muted">Containerised shipments to overseas ports, where applicable to the destination.</p></div>
          <div class="card"><div class="icon-bubble"><app-icon name="truck" /></div><h3>Road transportation</h3><p class="muted">Road movement within India and to neighbouring markets such as Nepal, where applicable.</p></div>
          <div class="card"><div class="icon-bubble"><app-icon name="chain" /></div><h3>Freight forwarding</h3><p class="muted">Coordination with freight forwarders and logistics partners, including FOB and CIF options where available.</p></div>
        </div>
        <p class="note" style="margin-top: 28px">Actual shipping methods, transit times and commercial terms are confirmed in the quotation for each order.</p>
      </div>
    </section>

    <app-cta-band title="Planning a shipment?" text="Share your destination, quantity and timeline and we will confirm the best logistics option." />
  `,
})
export class LogisticsPage {
  s = inject(SiteService).settings;
  constructor() {
    inject(SeoService).set({
      title: 'Infrastructure & Logistics',
      description: 'Warehousing, packing, export documentation and freight coordination for onion export shipments by sea and road from India.',
      path: '/infrastructure-logistics',
    });
  }
}
