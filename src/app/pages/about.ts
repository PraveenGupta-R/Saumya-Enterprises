import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PdfService } from '../core/pdf.service';
import { PageHero } from '../shared/page-hero';
import { IconComponent } from '../shared/icon';
import { CtaBand } from '../shared/cta-band';

@Component({
  selector: 'app-about',
  imports: [RouterLink, PageHero, IconComponent, CtaBand],
  template: `
    <app-page-hero
      title="About Saumya Enterprises"
      eyebrow="Our Story"
      subtitle="An India-based export and trading company connecting global buyers with quality agricultural products."
      crumb="About Us"
    />

    <section class="section">
      <div class="container split">
        <div class="prose">
          @for (p of paras(); track $index) { <p [class.lead]="$index === 0">{{ p }}</p> }
          <p>
            We focus on quality, competitive pricing, timely delivery and long-term business relationships. Whether you need bulk sourcing,
            private labelling (subject to availability) or dependable export support, we aim to serve every buyer with professionalism and integrity.
          </p>
          <div class="btn-row">
            <a class="btn btn--primary" routerLink="/request-a-quote">Request a Quote</a>
            <button class="btn btn--ghost" type="button" (click)="profile()">Download Company Profile (PDF)</button>
          </div>
        </div>
        <table class="spec-table">
          <tbody>
            <tr><th>Company</th><td>{{ s().companyName }}</td></tr>
            <tr><th>Proprietor</th><td>{{ s().proprietor }}</td></tr>
            <tr><th>Established</th><td>{{ s().established }}</td></tr>
            <tr><th>Business type</th><td>{{ s().businessType }}</td></tr>
            <tr><th>Business nature</th><td>{{ s().businessNature }}</td></tr>
            <tr><th>Registered location</th><td>{{ s().address }}</td></tr>
            <tr><th>Warehouse</th><td>{{ s().warehouse }}</td></tr>
            <tr><th>Business hours</th><td>{{ s().hours }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">What We Do</span>
          <h2>From farm network to your port</h2>
          <p>We act as the dependable link between Indian growers and international importers.</p>
        </div>
        <div class="grid grid-4">
          @for (w of work; track w.title) {
            <div class="card">
              <div class="icon-bubble"><app-icon [name]="w.icon" /></div>
              <h3>{{ w.title }}</h3>
              <p class="muted">{{ w.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Our Values</span>
          <h2>The principles behind every shipment</h2>
        </div>
        <div class="grid grid-3">
          <div class="card"><h3>Quality first</h3><p class="muted">Careful selection, sorting and grading so that what we offer matches what you ordered.</p></div>
          <div class="card"><h3>Honest communication</h3><p class="muted">We confirm availability, specifications and terms clearly, and only promise what we can deliver.</p></div>
          <div class="card"><h3>Long-term relationships</h3><p class="muted">We aim to be a supplier you can return to season after season.</p></div>
        </div>
      </div>
    </section>

    <section class="section section--dark">
      <div class="container split">
        <div>
          <span class="eyebrow">Growing With You</span>
          <h2>A multi-product export platform</h2>
          <p>
            We began with Red Onion and White Onion. As we grow, we plan to add dry fruits (cashew, almonds, pistachios, raisins, makhana), spices
            (turmeric, red chilli, coriander, cumin) and other agricultural commodities, so buyers can source more from one trusted partner.
          </p>
          <a class="btn btn--gold" routerLink="/products">See our product range</a>
        </div>
        <ul class="check-list" style="color: #e8f1ec">
          <li>Fresh vegetables: Red Onion, White Onion</li>
          <li>Dry fruits (planned)</li>
          <li>Spices (planned)</li>
          <li>Other agricultural commodities (planned)</li>
        </ul>
      </div>
    </section>

    <app-cta-band />
  `,
})
export class AboutPage {
  private site = inject(SiteService);
  private pdf = inject(PdfService);
  s = this.site.settings;
  work = [
    { icon: 'sprout', title: 'Sourcing', text: 'Fresh produce sourced from selected farms and traders across India.' },
    { icon: 'scale', title: 'Sorting & grading', text: 'Graded by size and quality to your buyer specification.' },
    { icon: 'box', title: 'Packing', text: 'Ventilated mesh bags and custom packing configurations.' },
    { icon: 'doc', title: 'Documentation & logistics', text: 'Export paperwork support and freight coordination.' },
  ];
  constructor() {
    inject(SeoService).set({
      title: 'About Us',
      description: 'Saumya Enterprises is an India-based merchant exporter and trader of agricultural products, started in 2024 in Siddharthnagar, Uttar Pradesh.',
      path: '/about',
    });
  }
  paras(): string[] {
    return this.s().aboutText.split(/\n+/).filter(Boolean);
  }
  profile(): void {
    void this.pdf.downloadProfile();
  }
}
