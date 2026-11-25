import { Component, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';
import { IconComponent } from '../shared/icon';
import { QuoteForm } from '../shared/quote-form';

@Component({
  selector: 'app-contact',
  imports: [PageHero, IconComponent, QuoteForm],
  styles: [
    `
      .info { display: grid; gap: 18px; }
      .row { display: flex; gap: 16px; align-items: flex-start; }
      .row .icon-bubble { margin: 0; flex: none; }
      .row h3 { margin: 0 0 2px; font-size: 1.05rem; }
      .row > div:last-child { min-width: 0; }
      .row p { margin: 0; color: var(--ink-soft); overflow-wrap: anywhere; }
      .map { border: 0; width: 100%; height: 380px; border-radius: var(--radius); box-shadow: var(--shadow-sm); }
      .box { background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 32px; box-shadow: var(--shadow); }
      @media (max-width: 560px) { .box { padding: 20px; } }
    `,
  ],
  template: `
    <app-page-hero title="Contact Us" eyebrow="Get in Touch" subtitle="Talk to us about pricing, specifications and shipments. We reply quickly on WhatsApp." crumb="Contact" />

    <section class="section">
      <div class="container split" style="align-items: start">
        <div class="info">
          <div class="row"><div class="icon-bubble"><app-icon name="pin" /></div><div><h3>Office location</h3><p>{{ s().companyName }}<br />{{ s().address }}</p></div></div>
          <div class="row"><div class="icon-bubble"><app-icon name="phone" /></div><div><h3>Phone / WhatsApp</h3><p><a [href]="'tel:' + tel()">{{ s().phone }}</a></p></div></div>
          <div class="row"><div class="icon-bubble"><app-icon name="mail" /></div><div><h3>Email</h3><p><a [href]="'mailto:' + s().email">{{ s().email }}</a></p></div></div>
          <div class="row"><div class="icon-bubble"><app-icon name="handshake" /></div><div><h3>International inquiries</h3><p>Contact person: {{ s().contactPerson || s().proprietor }}</p></div></div>
          <div class="row"><div class="icon-bubble"><app-icon name="clock" /></div><div><h3>Business hours</h3><p>{{ s().hours }}</p></div></div>
          <div class="btn-row">
            <a class="btn btn--wa" [href]="site.waLink()" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            <a class="btn btn--ghost" [href]="'tel:' + tel()">Call now</a>
          </div>
        </div>
        <div class="box">
          <h2 style="font-size: 1.5rem">Send us an inquiry</h2>
          <app-quote-form />
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section-head"><h2>Find us</h2><p>{{ s().address }}</p></div>
        <iframe class="map" [src]="mapUrl()" title="Map showing the Saumya Enterprises location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      </div>
    </section>
  `,
})
export class ContactPage {
  site = inject(SiteService);
  private san = inject(DomSanitizer);
  s = this.site.settings;
  tel = computed(() => this.s().phone.replace(/\s/g, ''));
  mapUrl = computed<SafeResourceUrl>(() =>
    this.san.bypassSecurityTrustResourceUrl(`https://www.google.com/maps?q=${encodeURIComponent(this.s().mapQuery)}&output=embed`),
  );
  constructor() {
    inject(SeoService).set({
      title: 'Contact Us',
      description: 'Contact Saumya Enterprises, Tetari Bazar, Siddharthnagar, Uttar Pradesh, India. WhatsApp +91 89229 30911. Open 9 AM to 8 PM daily.',
      path: '/contact',
    });
  }
}
