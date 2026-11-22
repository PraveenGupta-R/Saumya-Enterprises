import { Component, inject } from '@angular/core';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';
import { IconComponent } from '../shared/icon';
import { CtaBand } from '../shared/cta-band';

@Component({
  selector: 'app-why-us',
  imports: [PageHero, IconComponent, CtaBand],
  template: `
    <app-page-hero
      title="Why Choose Us"
      eyebrow="Our Promise"
      subtitle="Quality, fair pricing and dependable service for international buyers."
      crumb="Why Choose Us"
    />

    <section class="section">
      <div class="container">
        <div class="grid grid-3">
          @for (r of reasons; track r.title) {
            <div class="card card--hover">
              <div class="icon-bubble"><app-icon [name]="r.icon" /></div>
              <h3>{{ r.title }}</h3>
              <p class="muted">{{ r.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container split">
        <div>
          <span class="eyebrow">Built for B2B</span>
          <h2>Designed around importer needs</h2>
          <p>We understand that importers, wholesalers and distributors need clear specifications, predictable quality and honest communication. That is how we work.</p>
          <ul class="check-list">
            <li>Specifications, grades and packaging confirmed before you commit</li>
            <li>Honest availability: we quote against what we can actually supply</li>
            <li>Flexible order sizes, finalised per buyer requirement</li>
            <li>One accountable contact from inquiry to shipment</li>
            <li>A growing product range so you can source more from one partner</li>
          </ul>
        </div>
        <div class="card" style="background: var(--green-800); color: #fff">
          <h3 style="color: var(--gold-400)">Our commitment</h3>
          <p style="font-family: var(--font-head); font-size: 1.5rem; line-height: 1.4; margin: 0">
            &ldquo;Quality You Can Trust, Service You Can Rely On.&rdquo;
          </p>
        </div>
      </div>
    </section>

    <app-cta-band />
  `,
})
export class WhyUsPage {
  reasons = [
    { icon: 'quality', title: 'Premium quality products', text: 'Fresh onions selected, sorted and graded with a focus on freshness and your requirements.' },
    { icon: 'price', title: 'Competitive prices', text: 'Direct sourcing through our network lets us offer fair bulk pricing without compromising on quality.' },
    { icon: 'ship', title: 'Timely delivery', text: 'We plan packing, documentation and freight so your shipment stays on schedule.' },
    { icon: 'box', title: 'Customised packaging', text: 'Mesh bags from 5 to 50 kg, with labelling and packing tailored to your market and regulations.' },
    { icon: 'chain', title: 'Reliable supply chain', text: 'A sourcing network and third-party warehouse facilities arranged for bulk supply.' },
    { icon: 'support', title: 'Dedicated customer support', text: 'Quick responses on WhatsApp and email, with a named contact for international inquiries.' },
  ];
  constructor() {
    inject(SeoService).set({
      title: 'Why Choose Saumya Enterprises',
      description: 'Premium quality, competitive prices, timely delivery, customised packaging, reliable supply chain and dedicated support for international onion buyers.',
      path: '/why-choose-us',
    });
  }
}
