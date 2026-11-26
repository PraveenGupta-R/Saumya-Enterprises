import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { IconComponent } from '../shared/icon';
import { ProductCard } from '../shared/product-card';
import { CtaBand } from '../shared/cta-band';
import { AnimatedName } from '../shared/animated-name';

/** Banner photos shown until others are uploaded in the admin panel (Settings > Home page banner photos). */
const DEFAULT_SLIDES = [
  '/assets/hero/photo-1-truck.jpg',
  '/assets/hero/photo-2-warehouse.jpg',
  '/assets/hero/photo-3-ship.jpg',
];

/** Which part of each photo stays in view when the screen is narrow (phones crop the sides). */
const FOCUS: Record<string, string> = { 'photo-1-truck': '56% 50%', 'photo-2-warehouse': '50% 50%', 'photo-3-ship': '42% 50%' };

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgClass, IconComponent, ProductCard, CtaBand, AnimatedName],
  styles: [
    `
      .hero { position: relative; min-height: min(82vh, 760px); display: flex; align-items: center; overflow: hidden; background: #ffe3c2; color: var(--ink); }
      .media { position: absolute; inset: 0; }
      .slides { position: absolute; inset: 0; overflow: hidden; }
      /* carousel: pictures slide in from the right, one after another, with a slow zoom */
      .slide { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: translateX(100%); filter: saturate(.82) brightness(1.04); }
      .slide.on, .slide.prev { transition: transform 2.4s cubic-bezier(.45, 0, .2, 1); }
      .slide.on { transform: none; animation: kenburns 16s ease-out forwards; }
      .slide.prev { transform: translateX(-100%); scale: 1.07; }
      @keyframes kenburns { from { scale: 1; } to { scale: 1.07; } }
      /* soft cream wash so the pictures sit lightly behind the text */
      .veil { position: absolute; inset: 0; background: linear-gradient(95deg, rgba(255,250,244,.96) 0%, rgba(255,247,238,.9) 36%, rgba(255,243,230,.62) 62%, rgba(255,243,230,.4) 100%); }
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
      /* Tablets and small windows */
      @media (max-width: 900px) {
        .hero { min-height: min(80vh, 700px); }
        .hero-in { padding-block: 40px 76px; }
        .hero-copy { max-width: 64%; }
        .veil { background: linear-gradient(95deg, rgba(255,250,244,.97) 0%, rgba(255,247,238,.94) 54%, rgba(255,243,230,.66) 76%, rgba(255,243,230,.46) 100%); }
        .emblem { height: 104px; }
        .hero h1 { font-size: clamp(2rem, 6.4vw, 3.3rem); }
        .hero .lead, .hero .tag { max-width: none; }
      }
      /* Phones: the photo fills the banner behind the text, as a light wash */
      @media (max-width: 600px) {
        .hero { min-height: 0; align-items: flex-start; }
        .hero-in { padding-block: 28px 64px; }
        .hero-copy { max-width: none; }
        .veil { background: linear-gradient(to bottom, rgba(255,250,244,.8) 0%, rgba(255,248,238,.72) 45%, rgba(255,248,238,.78) 100%); }
        .dots { bottom: 12px; }
        .brandrow { gap: 14px; flex-wrap: nowrap; }
        .emblem { height: 84px; }
        .welcome { font-size: .9rem; padding: 6px 14px; margin-bottom: 8px; }
        .hero h1 { font-size: 2.15rem; }
        .tag { font-size: 1.1rem; }
        .hero p.lead { font-size: 1rem; margin-bottom: 20px; }
        .hero .btn-row .btn { flex: 1 1 100%; }
        .chips { gap: 8px; margin-top: 18px; }
        .chip { font-size: .82rem; padding: 7px 12px; }
      }      @media (prefers-reduced-motion: reduce) { .slide.on { animation: none; } .emblem { animation: none; } }
      .trust { background: #fff; border-bottom: 1px solid var(--line); }
      .trust .container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding-block: 26px; }
      .trust .item { text-align: center; padding: 6px; }
      .trust .num { font-family: var(--font-head); font-size: 1.7rem; color: var(--red-700); font-weight: 700; line-height: 1.1; }
      .trust .lbl { font-size: .85rem; color: var(--ink-soft); }
      @media (max-width: 760px) { .trust .container { grid-template-columns: repeat(2, 1fr); } }
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
      .soon-title { text-align: center; margin: 44px 0 18px; }
      .soon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
      .soon-card { display: flex; flex-direction: column; gap: 8px; align-items: center; text-align: center; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 12px 18px; color: var(--ink); box-shadow: var(--shadow-sm); transition: transform .2s, box-shadow .2s; }
      .soon-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); color: var(--ink); }
      .soon-card img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 10px; background: #fff; }
      .soon-name { font-family: var(--font-head); font-weight: 700; font-size: 1.08rem; color: var(--green-800); }
      @media (max-width: 900px) { .soon-grid { grid-template-columns: repeat(2, 1fr); } }
    `,
  ],
  template: `
    <section class="hero" aria-roledescription="carousel" aria-label="Saumya Enterprises highlights" (touchstart)="touchStart($event)" (touchend)="touchEnd($event)" (mouseenter)="paused = true" (mouseleave)="paused = false" (focusin)="paused = true" (focusout)="paused = false">
      <div class="media">
      <div class="slides" aria-hidden="true">
        @for (src of slides(); track src; let i = $index) {
          <picture>@if (mobileSrc(src); as ms) {<source media="(max-width: 700px)" [attr.srcset]="ms" />}<img class="slide" [ngClass]="state(i)" [style.object-position]="pos(src)" [src]="src" alt="" width="1600" height="900" [attr.fetchpriority]="i === 0 ? 'high' : null" [attr.loading]="i === 0 ? 'eager' : 'lazy'" /></picture>
        }      </div>
      <div class="veil"></div>
      </div>
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
            <span class="chip"><app-icon name="check" [size]="16" /> From India's Farms to the World</span>
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
        @if (soonPhoto().length) {
          <h3 class="soon-title">Coming soon to our range</h3>
          <div class="soon-grid">
            @for (p of soonPhoto(); track p.slug) {
              <a class="soon-card" [routerLink]="['/products', p.slug]">
                <img [src]="p.images[0]" [alt]="p.name" loading="lazy" width="500" height="333" />
                <span class="soon-name">{{ p.name }}</span>
                <span class="badge badge--coming_soon">Coming soon</span>
              </a>
            }
          </div>
        }
        @if (soonNoPhoto().length) {
          <p class="center muted" style="margin-top: 24px">
            Also planned: {{ soonNoPhoto() }}. <a routerLink="/products">See all products</a>
          </p>
        } @else {
          <p class="center" style="margin-top: 24px"><a routerLink="/products">See all products</a></p>
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

  /** smaller copy of the built-in photos for phones */
  mobileSrc(src: string): string {
    return /^\/assets\/hero\/photo-\d-[a-z]+\.jpg$/.test(src) ? src.replace('.jpg', '-m.jpg') : '';
  }
  /** keeps the important part of each photo in view on narrow screens */
  pos(src: string): string {
    const hit = Object.keys(FOCUS).find((k) => src.includes(k));
    return hit ? FOCUS[hit] : 'center';
  }
  /** carousel position of slide i: on (visible), prev (just left), next (waiting on the right) */
  state(i: number): string {
    const n = this.slides().length;
    const p = (i - this.idx() + n) % n;
    return p === 0 ? 'on' : p === n - 1 && n > 2 ? 'prev' : 'next';
  }
  /** true while the pointer or keyboard focus is inside the banner */
  paused = false;
  private x0 = 0;
  touchStart(e: TouchEvent): void {
    this.x0 = e.changedTouches[0].clientX;
  }
  /** swipe left / right to change the picture */
  touchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.x0;
    const n = this.slides().length;
    if (Math.abs(dx) > 50 && n > 1) this.go((this.idx() + (dx < 0 ? 1 : n - 1)) % n);
  }

  go(i: number): void {
    this.idx.set(i);
    this.restart();
  }
  private restart(): void {
    clearInterval(this.timer);
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.timer = setInterval(() => {
      if (document.hidden || this.paused) return; // stays still while the visitor hovers or tabs through the banner
      this.idx.update((i) => (i + 1) % Math.max(1, this.slides().length));
    }, 9000);
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
        'Saumya Enterprises exports fresh Indian Red and White Onion to importers and distributors. Bulk orders, custom packing, export documents. Request a quote.',
      path: '/',
      jsonLd: this.seo.organizationLd(),
    });
  }

  firstPara(): string {
    return this.s().aboutText.split('\n')[0];
  }
  soonPhoto = computed(() => this.site.upcomingProducts().filter((p) => p.images.length));
  soonNoPhoto = computed(() => this.site.upcomingProducts().filter((p) => !p.images.length).map((p) => p.name).join(', '));
  upcomingNames(): string {
    return this.site.upcomingProducts().map((p) => p.name).join(', ');
  }
}
