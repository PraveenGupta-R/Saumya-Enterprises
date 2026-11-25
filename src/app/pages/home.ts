import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { IconComponent } from '../shared/icon';
import { ProductCard } from '../shared/product-card';
import { CtaBand } from '../shared/cta-band';
import { AnimatedName } from '../shared/animated-name';

/** Built-in illustrated slides, used until real photos are uploaded in the admin panel. */
const DEFAULT_SLIDES = [
  '/assets/hero/slide-1-onions.svg',
  '/assets/hero/slide-2-bags.svg',
  '/assets/hero/slide-3-ship.svg',
  '/assets/hero/slide-4-routes.svg',
  '/assets/hero/slide-5-truck.svg',
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, IconComponent, ProductCard, CtaBand, AnimatedName],
  styles: [
    `
      .hero { position: relative; min-height: min(82vh, 760px); display: flex; align-items: center; overflow: hidden; background: #ffe3c2; color: var(--ink); }
      .slides { position: absolute; inset: 0; }
      .slide { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 70% center; opacity: 0; transform: scale(1); transition: opacity 1.4s ease; }
      .slide.on { opacity: 1; animation: kenburns 9s ease-out forwards; }
      @keyframes kenburns { from { transform: scale(1); } to { transform: scale(1.08); } }
      .veil { position: absolute; inset: 0; background: linear-gradient(95deg, rgba(255,250,244,.97) 0%, rgba(255,246,235,.92) 34%, rgba(255,238,218,.55) 58%, rgba(255,238,218,0) 82%); }
      .hero-in { position: relative; z-index: 2; padding-block: 56px 88px; }
      .hero-copy { max-width: 920px; }
      .brandrow { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; margin-bottom: 8px; }
      .brandtext { min-width: 0; }
      .emblem { height: clamp(116px, 13vw, 176px); width: auto; animation: float 6s ease-in-out infinite; }
      @keyframes float { 50% { transform: translateY(-8px); } }
      .welcome { display: inline-block; background: var(--orange); color: var(--green-900); font-weight: 700; letter-spacing: .06em; padding: 9px 22px; border-radius: 6px; font-size: 1.05rem; margin-bottom: 14px; animation: slidein .8s .1s both ease-out; }
      @keyframes slidein { from { opacity: 0; transform: translateX(-24px); } }
      .hero h1 { --an-base: var(--green-900); --an-wave: #e8730f; font-size: clamp(2.4rem, 5.5vw, 4.7rem); line-height: 1.05; margin: 0; letter-spacing: -.01em; }
      .hero .lead, .hero .tag { max-width: 600px; }
      .tag { font-family: var(--font-head); font-size: clamp(1.15rem, 2.4vw, 1.6rem); color: var(--red-700); margin: 0 0 14px; font-style: italic; animation: slidein .8s 1.3s both ease-out; }
      .hero p.lead { color: #4d3a2b; max-width: 560px; margin-bottom: 28px; animation: slidein .8s 1.5s both ease-out; }
      .hero .btn-row { animation: slidein .8s 1.7s both ease-out; }
      .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
      .chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid rgba(180,80,10,.3); background: rgba(255,255,255,.65); border-radius: 999px; font-size: .88rem; color: var(--green-800); }
      .dots { position: absolute; z-index: 3; left: 0; right: 0; bottom: 22px; display: flex; justify-content: center; gap: 4px; }
      .dots button { width: 34px; height: 34px; padding: 0; border: 0; background: none; cursor: pointer; display: grid; place-items: center; }
      .dots button::before { content: ''; width: 12px; height: 12px; border-radius: 50%; background: rgba(12,45,49,.28); transition: all .3s; }
      .dots button.on::before { background: var(--orange); width: 30px; border-radius: 8px; }
      @media (max-width: 760px) {
        .veil { background: linear-gradient(180deg, rgba(255,250,244,.93) 0%, rgba(255,243,228,.88) 55%, rgba(255,238,218,.7) 100%); }
        .hero { min-height: 0; }
        .hero-in { padding-block: 36px 80px; }
        .slide { object-position: 78% center; }
      }
      @media (prefers-reduced-motion: reduce) { .slide.on { animation: none; } .emblem { animation: none; } }
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
    <section class="hero" aria-roledescription="carousel" aria-label="Saumya Enterprises highlights">
      <div class="slides" aria-hidden="true">
        @for (src of slides(); track src; let i = $index) {
          <img class="slide" [class.on]="i === idx()" [src]="src" alt="" width="1600" height="900" [attr.fetchpriority]="i === 0 ? 'high' : null" [attr.loading]="i === 0 ? 'eager' : 'lazy'" />
        }
      </div>
      <div class="veil"></div>
      <div class="container hero-in">
        <div class="hero-copy">
          <div class="brandrow">
            <img class="emblem" [src]="logo()" [alt]="s().companyName + ' emblem'" width="150" height="192" />
            <div class="brandtext">
              <span class="welcome">Welcome To</span>
              <h1><app-animated-name [text]="s().companyName" /></h1>
            </div>
          </div>
          <p class="tag">Your Trusted Indian Export Partner</p>
          <p class="lead">
            Premium Indian Red Onion and White Onion for importers, wholesalers and distributors. Graded to your specification, packed for export and supported with documentation.
          </p>
          <div class="btn-row">
            <a class="btn btn--primary" routerLink="/request-a-quote">Request a Quote</a>
            <a class="btn btn--ghost" routerLink="/products">View Products</a>
          </div>
          <div class="chips">
            <span class="chip"><app-icon name="check" [size]="16" /> IEC registered exporter</span>
            <span class="chip"><app-icon name="check" [size]="16" /> Bulk &amp; private-label inquiries</span>
            <span class="chip"><app-icon name="check" [size]="16" /> Made in India</span>
          </div>
        </div>
      </div>
      @if (slides().length > 1) {
        <div class="dots">
          @for (src of slides(); track src; let i = $index) {
            <button type="button" [class.on]="i === idx()" (click)="go(i)" [attr.aria-label]="'Show slide ' + (i + 1)"></button>
          }
        </div>
      }
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

  slides = computed(() => (this.s().heroImages?.length ? this.s().heroImages : DEFAULT_SLIDES));
  logo = computed(() => this.s().logoUrl || '/assets/logo/logo-orange.png');
  idx = signal(0);
  private timer: ReturnType<typeof setInterval> | undefined;

  go(i: number): void {
    this.idx.set(i);
    this.restart();
  }
  private restart(): void {
    clearInterval(this.timer);
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.timer = setInterval(() => {
      if (document.hidden) return;
      this.idx.update((i) => (i + 1) % Math.max(1, this.slides().length));
    }, 5500);
  }

  features = [
    { icon: 'quality', title: 'Premium quality products', text: 'Careful selection, sorting and grading, with onions free from visible rot and excessive damage.' },
    { icon: 'price', title: 'Competitive prices', text: 'Direct sourcing through our network helps us offer fair, competitive bulk pricing.' },
    { icon: 'ship', title: 'Timely delivery', text: 'Packing, documentation and freight coordination planned around your shipment schedule.' },
    { icon: 'box', title: 'Customised packaging', text: 'Mesh bags from 5 kg to 50 kg, with labelling and packing configured to your market.' },
    { icon: 'chain', title: 'Reliable supply chain', text: 'Bulk supply arrangements through our sourcing network and third-party warehouse facilities.' },
    { icon: 'support', title: 'Dedicated support', text: 'A single point of contact for inquiries, quotations and shipment questions.' },
  ];

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => this.restart());
    destroy.onDestroy(() => clearInterval(this.timer));
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
