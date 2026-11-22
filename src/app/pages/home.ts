import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { IconComponent } from '../shared/icon';
import { ProductCard } from '../shared/product-card';
import { CtaBand } from '../shared/cta-band';

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, ProductCard, CtaBand],
  styles: [
    `
      .hero { position: relative; background: radial-gradient(1200px 500px at 85% -10%, rgba(201,162,75,.28), transparent 60%), linear-gradient(135deg, var(--green-900) 0%, var(--green-800) 55%, var(--green-700) 100%); color: #fff; padding: 84px 0 96px; overflow: hidden; }
      .hero h1 { color: #fff; font-size: clamp(2.2rem, 5.2vw, 3.9rem); margin-bottom: 18px; }
      .hero h1 em { color: var(--gold-400); font-style: normal; }
      .hero p.lead { color: #d4e5db; max-width: 560px; margin-bottom: 30px; }
      .hero-img { border-radius: 24px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,.35); border: 6px solid rgba(255,255,255,.12); transform: rotate(1.5deg); }
      .hero-img img { width: 100%; height: auto; }
      .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; }
      .chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; font-size: .88rem; color: #e8f1ec; }
      .trust { background: #fff; border-bottom: 1px solid var(--line); }
      .trust .container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding-block: 26px; }
      .trust .item { text-align: center; padding: 6px; }
      .trust .num { font-family: var(--font-head); font-size: 1.7rem; color: var(--red-700); font-weight: 700; line-height: 1.1; }
      .trust .lbl { font-size: .85rem; color: var(--ink-soft); }
      @media (max-width: 760px) { .trust .container { grid-template-columns: repeat(2, 1fr); } .hero { padding: 56px 0 64px; } .hero-img { transform: none; } }
      .steps { counter-reset: s; display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; }
      .step { position: relative; text-align: center; padding: 8px; }
      .step::before { counter-increment: s; content: counter(s); display: grid; place-items: center; width: 52px; height: 52px; margin: 0 auto 14px; border-radius: 50%; background: var(--gold-500); color: var(--green-900); font-weight: 700; font-size: 1.15rem; }
      .step h3 { color: #fff; font-size: 1.05rem; margin-bottom: 6px; }
      .step p { font-size: .9rem; color: #c9dcd2; margin: 0; }
      @media (max-width: 900px) { .steps { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 520px) { .steps { grid-template-columns: 1fr; } }
      .quote { font-family: var(--font-head); font-size: clamp(1.4rem, 3vw, 2rem); color: var(--green-800); text-align: center; max-width: 820px; margin: 0 auto; }
      .quote span { color: var(--red-700); }
      .post { display: block; color: inherit; height: 100%; }
      .post h3 { margin-bottom: 8px; }
      .post time { font-size: .82rem; color: var(--ink-soft); }
      .market { display: flex; gap: 14px; align-items: flex-start; }
      .market .flag { width: 44px; height: 44px; border-radius: 12px; background: var(--gold-100); color: var(--red-700); display: grid; place-items: center; font-weight: 700; flex: none; }
      .tcard p { font-style: italic; }
    `,
  ],
  template: `
    <section class="hero">
      <div class="container split">
        <div>
          <span class="eyebrow" style="color: var(--gold-400)">Indian Agricultural Exporter</span>
          <h1>Welcome to <em>{{ s().companyName }}</em><br />Your Trusted Export Partner</h1>
          <p class="lead">
            Premium Indian Red Onion and White Onion for importers, wholesalers and distributors. Graded to your specification, packed for export and supported with documentation.
          </p>
          <div class="btn-row">
            <a class="btn btn--gold" routerLink="/request-a-quote">Request a Quote</a>
            <a class="btn btn--ghost-light" routerLink="/products">View Products</a>
          </div>
          <div class="chips">
            <span class="chip"><app-icon name="check" [size]="16" /> IEC registered exporter</span>
            <span class="chip"><app-icon name="check" [size]="16" /> Bulk &amp; private-label inquiries</span>
            <span class="chip"><app-icon name="check" [size]="16" /> Made in India</span>
          </div>
        </div>
        <div class="hero-img"><img src="/assets/img/red-onion.svg" alt="Fresh Indian red onions" width="800" height="600" fetchpriority="high" /></div>
      </div>
    </section>

    <section class="trust" aria-label="At a glance">
      <div class="container">
        <div class="item"><div class="num">India</div><div class="lbl">Country of origin</div></div>
        <div class="item"><div class="num">{{ s().established }}</div><div class="lbl">Established</div></div>
        <div class="item"><div class="num">{{ site.availableProducts().length }}</div><div class="lbl">Products ready for inquiry</div></div>
        <div class="item"><div class="num">{{ s().markets.length }}</div><div class="lbl">Target export markets</div></div>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div>
          <span class="eyebrow">About {{ s().companyName }}</span>
          <h2>An India-based export and trading company built on trust</h2>
          <p>{{ firstPara() }}</p>
          <p>Whether you are looking for bulk sourcing, private labelling (subject to availability) or reliable export solutions, we are here to meet your business needs with professionalism and integrity.</p>
          <a class="btn btn--green" routerLink="/about">Learn more about us</a>
        </div>
        <ul class="check-list card">
          <li>Premium quality products, selected, sorted and graded</li>
          <li>Competitive prices for bulk buyers</li>
          <li>Timely delivery planning with logistics coordination</li>
          <li>Customised packaging to your market requirements</li>
          <li>Reliable supply chain through our sourcing network</li>
          <li>Dedicated customer support on WhatsApp and email</li>
        </ul>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Our Products</span>
          <h2>Fresh onions, ready for export</h2>
          <p>Currently available for export inquiries. More products are planned as our range grows.</p>
        </div>
        <div class="grid grid-2">
          @for (p of site.availableProducts(); track p.slug) {
            <app-product-card [product]="p" />
          }
        </div>
        @if (site.upcomingProducts().length) {
          <p class="center muted" style="margin-top: 28px">
            Planned future range: {{ upcomingNames() }}. <a routerLink="/products">See all products</a>
          </p>
        }
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Why Choose Us</span>
          <h2>What you can expect when you work with us</h2>
        </div>
        <div class="grid grid-3">
          @for (f of features; track f.title) {
            <div class="card card--hover">
              <div class="icon-bubble"><app-icon [name]="f.icon" /></div>
              <h3>{{ f.title }}</h3>
              <p class="muted">{{ f.text }}</p>
            </div>
          }
        </div>
        <p class="center" style="margin-top: 28px"><a class="btn btn--ghost" routerLink="/why-choose-us">More reasons to choose us</a></p>
      </div>
    </section>

    <section class="section section--dark">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">How It Works</span>
          <h2>From inquiry to shipment</h2>
          <p>A clear, simple process for international buyers.</p>
        </div>
        <div class="steps">
          <div class="step"><h3>Send inquiry</h3><p>Share product, quantity and destination.</p></div>
          <div class="step"><h3>Specifications</h3><p>We confirm size, grade and packing.</p></div>
          <div class="step"><h3>Quotation</h3><p>FOB or CIF quotation where available.</p></div>
          <div class="step"><h3>Packing &amp; docs</h3><p>Grading, packing and export paperwork.</p></div>
          <div class="step"><h3>Shipment</h3><p>Logistics coordination to your port.</p></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Export Markets</span>
          <h2>Where we are looking to supply</h2>
          <p>We are building relationships with importers in these target markets.</p>
        </div>
        <div class="grid grid-4">
          @for (m of s().markets; track m.country) {
            <div class="card market">
              <div class="flag">{{ m.country.slice(0, 2).toUpperCase() }}</div>
              <div><h3 style="margin: 0 0 4px; font-size: 1.05rem">{{ m.country }}</h3><span class="muted" style="font-size: .88rem">{{ m.region }}</span></div>
            </div>
          }
        </div>
        <p class="center" style="margin-top: 28px"><a class="btn btn--ghost" routerLink="/export-markets">Export markets &amp; capabilities</a></p>
      </div>
    </section>

    @if (site.testimonials().length) {
      <section class="section section--alt">
        <div class="container">
          <div class="section-head"><span class="eyebrow">Testimonials</span><h2>What buyers say</h2></div>
          <div class="grid grid-3">
            @for (t of site.testimonials(); track t.id) {
              <div class="card tcard">
                <p>&ldquo;{{ t.text }}&rdquo;</p>
                <strong>{{ t.name }}</strong><br /><span class="muted">{{ t.company }}{{ t.company && t.country ? ', ' : '' }}{{ t.country }}</span>
              </div>
            }
          </div>
        </div>
      </section>
    }

    @if (site.posts().length) {
      <section class="section section--alt">
        <div class="container">
          <div class="section-head"><span class="eyebrow">Blog / News</span><h2>Export insights</h2></div>
          <div class="grid grid-3">
            @for (p of site.posts().slice(0, 3); track p.slug) {
              <a class="post" [routerLink]="['/blog', p.slug]">
                <article class="card card--hover" style="height: 100%">
                  <time>{{ p.publishedAt }}</time>
                  <h3>{{ p.title }}</h3>
                  <p class="muted">{{ p.excerpt }}</p>
                  <strong style="color: var(--red-700)">Read more &rarr;</strong>
                </article>
              </a>
            }
          </div>
        </div>
      </section>
    }

    <section class="section">
      <div class="container"><p class="quote">&ldquo;<span>Quality You Can Trust,</span> Service You Can Rely On.&rdquo;</p></div>
    </section>

    <app-cta-band />
  `,
})
export class HomePage {
  site = inject(SiteService);
  private seo = inject(SeoService);
  s = this.site.settings;

  features = [
    { icon: 'quality', title: 'Premium quality products', text: 'Careful selection, sorting and grading, with onions free from visible rot and excessive damage.' },
    { icon: 'price', title: 'Competitive prices', text: 'Direct sourcing through our network helps us offer fair, competitive bulk pricing.' },
    { icon: 'ship', title: 'Timely delivery', text: 'Packing, documentation and freight coordination planned around your shipment schedule.' },
    { icon: 'box', title: 'Customised packaging', text: 'Mesh bags from 5 kg to 50 kg, with labelling and packing configured to your market.' },
    { icon: 'chain', title: 'Reliable supply chain', text: 'Bulk supply arrangements through our sourcing network and third-party warehouse facilities.' },
    { icon: 'support', title: 'Dedicated support', text: 'A single point of contact for inquiries, quotations and shipment questions.' },
  ];

  constructor() {
    this.seo.set({
      title: 'Indian Red & White Onion Exporter | Saumya Enterprises',
      description:
        'Saumya Enterprises exports fresh Indian Red Onion and White Onion to importers and distributors. Bulk orders, custom packaging and export documentation support. Request a quote.',
      path: '/',
      jsonLd: this.seo.organizationLd(),
    });
  }

  firstPara(): string {
    return this.s().aboutText.split('\n')[0];
  }
  upcomingNames(): string {
    return this.site.upcomingProducts().map((p) => p.name).join(', ');
  }
}
