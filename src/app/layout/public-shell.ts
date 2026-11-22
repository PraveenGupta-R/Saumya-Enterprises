import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SiteService } from '../core/site.service';
import { PdfService } from '../core/pdf.service';

@Component({
  selector: 'app-public-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [
    `
      :host { display: block; }
      .topbar { background: var(--green-900); color: #cfe0d6; font-size: 0.85rem; }
      .topbar .container { display: flex; justify-content: space-between; gap: 16px; padding-block: 8px; flex-wrap: wrap; }
      .topbar a { color: #e8f1ec; display: inline-block; padding: 8px 0; margin: -8px 0; min-height: 32px; overflow-wrap: anywhere; }
      .topbar a:hover { color: var(--gold-400); }
      .topbar .group { display: flex; gap: 22px; flex-wrap: wrap; }
      header.main { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,.97); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
      .bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 76px; }
      .brand { display: flex; align-items: center; gap: 12px; color: var(--green-800); }
      .brand:hover { color: var(--green-800); }
      .brand img.logo { height: 48px; width: auto; }
      .brand .mark { width: 46px; height: 46px; flex: none; }
      .brand .name { font-family: var(--font-head); font-weight: 700; font-size: 1.25rem; line-height: 1.1; letter-spacing: .01em; }
      .brand .sub { display: block; font-family: var(--font-body); font-weight: 600; font-size: .64rem; letter-spacing: .22em; color: var(--red-700); margin-top: 3px; }
      nav.desktop { display: flex; align-items: center; gap: 2px; }
      nav.desktop > a, .dd > a { padding: 10px 11px; font-weight: 600; font-size: .93rem; color: var(--ink); border-radius: 8px; white-space: nowrap; display: block; }
      nav.desktop > a:hover, .dd > a:hover, nav.desktop a.active { color: var(--red-700); background: var(--red-100); }
      .dd { position: relative; }
      .dd .menu { display: none; position: absolute; top: 100%; left: 0; min-width: 210px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow); padding: 8px; }
      .dd:hover .menu, .dd:focus-within .menu { display: block; }
      .dd .menu a { display: block; padding: 9px 12px; border-radius: 8px; font-weight: 500; font-size: .93rem; color: var(--ink); }
      .dd .menu a:hover { background: var(--green-100); color: var(--green-800); }
      .cta { margin-left: 8px; }
      .burger { display: none; background: none; border: 0; padding: 10px; cursor: pointer; border-radius: 8px; color: var(--green-800); }
      .burger svg { width: 28px; height: 28px; }
      .drawer { display: none; border-top: 1px solid var(--line); background: #fff; padding: 10px 20px 22px; max-height: calc(100vh - 76px); max-height: calc(100dvh - 76px); overflow-y: auto; }
      .drawer a { display: block; padding: 13px 4px; font-weight: 600; color: var(--ink); border-bottom: 1px solid var(--line); }
      .drawer a.sub { padding-left: 20px; font-weight: 500; color: var(--ink-soft); }
      .drawer .btn { margin-top: 16px; width: 100%; }
      .brand { white-space: nowrap; flex: none; }
      @media (max-width: 1240px) {
        nav.desktop { display: none; }
        .burger { display: block; }
        .drawer.open { display: block; }
      }
      @media (max-width: 600px) { .topbar .hide-sm { display: none; } .brand .name { font-size: 1.1rem; } }

      footer { background: var(--green-900); color: #c4d6cc; padding: 64px 0 0; margin-top: 0; }
      footer h4 { color: #fff; font-family: var(--font-body); font-size: .9rem; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 16px; }
      footer a { color: #c4d6cc; }
      footer a:hover { color: var(--gold-400); }
      footer ul { list-style: none; padding: 0; margin: 0; }
      footer li { margin-bottom: 9px; }
      .foot-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1.2fr; gap: 40px; }
      @media (max-width: 900px) { .foot-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 560px) { .foot-grid { grid-template-columns: 1fr; gap: 28px; } }
      .foot-brand .name { font-family: var(--font-head); color: #fff; font-size: 1.4rem; font-weight: 700; margin-bottom: 10px; display: block; }
      .legal { border-top: 1px solid rgba(255,255,255,.12); margin-top: 48px; padding: 20px 0 28px; font-size: .84rem; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .social { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
      .social a { border: 1px solid rgba(255,255,255,.25); border-radius: 999px; padding: 6px 14px; font-size: .85rem; }
      footer li a { display: inline-block; padding: 4px 0; overflow-wrap: anywhere; }
      .dl { background: none; border: 0; color: #c4d6cc; padding: 6px 0; min-height: 32px; cursor: pointer; font: inherit; text-align: left; }
      .dl:hover { color: var(--gold-400); }

      .wa-fab { position: fixed; right: 18px; bottom: 18px; z-index: 60; display: flex; align-items: center; gap: 10px; background: #1faa59; color: #fff; padding: 13px 18px 13px 14px; border-radius: 999px; box-shadow: 0 8px 24px rgba(0,0,0,.28); font-weight: 600; }
      .wa-fab:hover { background: #178a47; color: #fff; transform: translateY(-2px); }
      .wa-fab svg { width: 28px; height: 28px; flex: none; }
      @media (max-width: 560px) { .wa-fab span { display: none; } .wa-fab { padding: 14px; } }
    `,
  ],
  template: `
    <div class="topbar">
      <div class="container">
        <div class="group">
          <a [href]="tel()">&#9742; {{ s().phone }}</a>
          <a [href]="'mailto:' + s().email" class="hide-sm">&#9993; {{ s().email }}</a>
        </div>
        <div class="group">
          <span class="hide-sm">Open {{ s().hours }}</span>
          <span>Export inquiries welcome worldwide</span>
        </div>
      </div>
    </div>

    <header class="main">
      <div class="container bar">
        <a routerLink="/" class="brand" aria-label="Saumya Enterprises home">
          @if (s().logoUrl) {
            <img class="logo" [src]="s().logoUrl" [alt]="s().companyName + ' logo'" />
          } @else {
            <svg class="mark" viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill="#0f3d2e" />
              <path d="M32 11c2 3 3 6 5 8 9 5 12 17 5 23-4 4-14 4-18 0-7-6-4-18 5-23 2-2 3-5 3-8z" fill="#c9a24b" />
              <path d="M32 15c-5 10-6 22-2 31M32 15c5 10 6 22 2 31" stroke="#0f3d2e" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round" />
              <path d="M32 11c-1-3 0-6 3-8" stroke="#c9a24b" stroke-width="2.5" fill="none" stroke-linecap="round" />
            </svg>
          }
          <span>
            <span class="name">{{ s().companyName }}</span>
            <span class="sub">EXPORT &amp; TRADING</span>
          </span>
        </a>

        <nav class="desktop" aria-label="Main">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/about" routerLinkActive="active">About</a>
          <div class="dd">
            <a routerLink="/products" routerLinkActive="active">Products &#9662;</a>
            <div class="menu">
              <a routerLink="/products/red-onion">Red Onion</a>
              <a routerLink="/products/white-onion">White Onion</a>
              <a routerLink="/products">All products</a>
            </div>
          </div>
          <a routerLink="/export-markets" routerLinkActive="active">Export Markets</a>
          <a routerLink="/quality-certifications" routerLinkActive="active">Quality</a>
          <a routerLink="/why-choose-us" routerLinkActive="active">Why Us</a>
          <a routerLink="/infrastructure-logistics" routerLinkActive="active">Logistics</a>
          <a routerLink="/blog" routerLinkActive="active">Blog</a>
          <a routerLink="/contact" routerLinkActive="active">Contact</a>
          <a routerLink="/request-a-quote" class="btn btn--primary btn--sm cta">Request a Quote</a>
        </nav>

        <button class="burger" type="button" (click)="menu.set(!menu())" [attr.aria-expanded]="menu()" aria-label="Toggle menu">
          @if (menu()) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          }
        </button>
      </div>
      <div class="drawer" [class.open]="menu()">
        <a routerLink="/">Home</a>
        <a routerLink="/about">About Us</a>
        <a routerLink="/products">Our Products</a>
        <a class="sub" routerLink="/products/red-onion">Red Onion</a>
        <a class="sub" routerLink="/products/white-onion">White Onion</a>
        <a routerLink="/export-markets">Export Markets</a>
        <a routerLink="/quality-certifications">Quality &amp; Certifications</a>
        <a routerLink="/why-choose-us">Why Choose Us</a>
        <a routerLink="/infrastructure-logistics">Infrastructure &amp; Logistics</a>
        <a routerLink="/blog">Blog / News</a>
        <a routerLink="/contact">Contact Us</a>
        <a routerLink="/request-a-quote" class="btn btn--primary">Request a Quote</a>
      </div>
    </header>

    <main id="main"><router-outlet /></main>

    <footer>
      <div class="container">
        <div class="foot-grid">
          <div class="foot-brand">
            <span class="name">{{ s().companyName }}</span>
            <p>{{ s().tagline }}</p>
            <p>Merchant exporter and trader of agricultural products from India.</p>
            <div class="social">
              @if (s().social.facebook) { <a [href]="s().social.facebook" target="_blank" rel="noopener noreferrer">Facebook</a> }
              @if (s().social.instagram) { <a [href]="s().social.instagram" target="_blank" rel="noopener noreferrer">Instagram</a> }
              @if (s().social.linkedin) { <a [href]="s().social.linkedin" target="_blank" rel="noopener noreferrer">LinkedIn</a> }
              @if (s().social.youtube) { <a [href]="s().social.youtube" target="_blank" rel="noopener noreferrer">YouTube</a> }
              @if (s().social.x) { <a [href]="s().social.x" target="_blank" rel="noopener noreferrer">X</a> }
            </div>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a routerLink="/about">About Us</a></li>
              <li><a routerLink="/why-choose-us">Why Choose Us</a></li>
              <li><a routerLink="/quality-certifications">Quality &amp; Certifications</a></li>
              <li><a routerLink="/infrastructure-logistics">Infrastructure &amp; Logistics</a></li>
              <li><a routerLink="/blog">Blog / News</a></li>
            </ul>
          </div>
          <div>
            <h4>Products &amp; Markets</h4>
            <ul>
              <li><a routerLink="/products/red-onion">Red Onion</a></li>
              <li><a routerLink="/products/white-onion">White Onion</a></li>
              <li><a routerLink="/products">All Products</a></li>
              <li><a routerLink="/export-markets">Export Markets</a></li>
              <li><a routerLink="/request-a-quote">Request a Quote</a></li>
              <li><button class="dl" type="button" (click)="catalogue()">Download Catalogue (PDF)</button></li>
              <li><button class="dl" type="button" (click)="profile()">Download Company Profile (PDF)</button></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>{{ s().address }}</li>
              <li><a [href]="tel()">{{ s().phone }}</a></li>
              <li><a [href]="'mailto:' + s().email">{{ s().email }}</a></li>
              <li>{{ s().hours }}</li>
              <li><a routerLink="/contact">Map &amp; directions</a></li>
            </ul>
          </div>
        </div>
        <div class="legal">
          <span>&copy; {{ year }} {{ s().companyName }}. All rights reserved. Proprietor: {{ s().proprietor }}.</span>
          <span>Product details and terms are subject to confirmation in the final quotation or sales contract.</span>
        </div>
      </div>
    </footer>

    <a class="wa-fab" [href]="site.waLinkFor(waText())" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
      <svg viewBox="0 0 32 32" fill="#fff" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.5c0 2.4.7 4.7 1.9 6.600L3 29l7.100-2.100c1.800 1 3.800 1.500 5.900 1.500 7 0 12.700-5.600 12.700-12.500S23 3 16 3zm0 22.800c-1.900 0-3.700-.5-5.300-1.500l-.4-.2-4.200 1.200 1.300-4-.3-.4a10 10 0 0 1-1.600-5.400C5.500 9.900 10.200 5.300 16 5.300s10.500 4.600 10.500 10.200S21.800 25.800 16 25.800zm5.700-7.500c-.3-.2-1.900-.9-2.200-1s-.5-.2-.7.200-.8 1-1 1.200-.4.200-.7.100a8.600 8.600 0 0 1-4.300-3.700c-.3-.6.300-.5.900-1.700.1-.2 0-.4 0-.5l-1-2.300c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.100-.8.400s-1 1-1 2.400 1 2.800 1.200 3c.1.200 2 3.100 4.900 4.300 1.800.8 2.500.8 3.400.7.5-.1 1.700-.7 1.900-1.400s.2-1.200.2-1.300-.3-.2-.6-.4z" /></svg>
      <span>WhatsApp us</span>
    </a>
  `,
})
export class PublicShell {
  site = inject(SiteService);
  private pdf = inject(PdfService);
  private router = inject(Router);
  s = this.site.settings;
  menu = signal(false);
  tel = computed(() => 'tel:' + this.s().phone.replace(/\s/g, ''));
  year = new Date().getFullYear();
  waText = this.site.waContext;
  private defaultWa = this.site.waContext();

  constructor() {
    // Reset when navigation starts; product pages then set their own text while activating.
    this.router.events.pipe(filter((e) => e instanceof NavigationStart)).subscribe(() => {
      this.menu.set(false);
      this.site.waContext.set(this.defaultWa);
    });
  }

  @HostListener('window:keydown.escape')
  close(): void {
    this.menu.set(false);
  }

  catalogue(): void {
    void this.pdf.downloadCatalogue();
  }
  profile(): void {
    void this.pdf.downloadProfile();
  }
}

