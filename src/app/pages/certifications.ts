import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';
import { IconComponent } from '../shared/icon';
import { CtaBand } from '../shared/cta-band';

const LABEL: Record<string, string> = {
  obtained: 'Obtained',
  applied: 'Application submitted',
  pending: 'To be obtained',
  to_confirm: 'To be confirmed',
  on_shipment: 'At time of shipment',
};

@Component({
  selector: 'app-certifications',
  imports: [RouterLink, PageHero, IconComponent, CtaBand],
  styles: [
    `
      .cert { display: flex; gap: 18px; align-items: flex-start; }
      .cert h3 { margin: 0 0 6px; font-size: 1.1rem; }
      .cert p { margin: 8px 0 0; color: var(--ink-soft); }
      .note { background: var(--gold-100); border-left: 4px solid var(--gold-500); padding: 16px 20px; border-radius: 0 12px 12px 0; }
    `,
  ],
  template: `
    <app-page-hero
      title="Quality & Certifications"
      eyebrow="Compliance"
      subtitle="Transparent information about our registrations and quality approach."
      crumb="Quality & Certifications"
    />

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Registrations</span>
          <h2>Registrations and compliance status</h2>
          <p>We show each registration with its accurate current status. Copies of obtained registrations are available to genuine buyers on request.</p>
        </div>
        <div class="grid grid-2">
          @for (c of site.certifications(); track c.id) {
            <div class="card cert">
              <div class="icon-bubble"><app-icon [name]="c.status === 'obtained' ? 'quality' : 'clock'" /></div>
              <div>
                <h3>{{ c.name }}</h3>
                <span class="badge badge--{{ c.status }}">{{ label(c.status) }}</span>
                @if (c.note) { <p>{{ c.note }}</p> }
              </div>
            </div>
          }
        </div>
        <p class="note" style="margin-top: 28px">
          We update this page only when a registration has been verified. Specific certifications, test reports or documents requested by your
          country can be discussed where available and applicable.
        </p>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container split">
        <div>
          <span class="eyebrow">Quality Approach</span>
          <h2>How we keep onions export-ready</h2>
          <ul class="check-list">
            <li>Careful selection, sorting and grading by size and quality</li>
            <li>Onions free from visible rot and excessive damage</li>
            <li>Clean, suitable packaging in ventilated mesh bags</li>
            <li>Appropriate ventilation during storage and transportation</li>
            <li>Supply in line with applicable export and destination-country requirements</li>
            <li>Phytosanitary certificate arranged for each shipment when required</li>
          </ul>
        </div>
        <div class="card">
          <h3>Ask for documents</h3>
          <p class="muted">Need to verify our registrations before placing an order? Send us a message and we will share the relevant documents.</p>
          <div class="btn-row">
            <a class="btn btn--primary" routerLink="/contact">Contact Us</a>
            <a class="btn btn--wa" [href]="site.waLinkFor('Hello Saumya Enterprises, please share your registration documents.')" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
      </div>
    </section>

    <app-cta-band />
  `,
})
export class CertificationsPage {
  site = inject(SiteService);
  constructor() {
    inject(SeoService).set({
      title: 'Quality & Certifications: IEC, GST and Export Compliance',
      description: 'Registrations and compliance status of Saumya Enterprises: IEC, GST, Udyam, AD Code, APEDA RCMC, FSSAI and phytosanitary certificate arrangements.',
      path: '/quality-certifications',
    });
  }
  label(s: string): string {
    return LABEL[s] ?? s;
  }
}
