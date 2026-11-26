import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-hero',
  imports: [RouterLink],
  styles: [
    `
      .hero { background: linear-gradient(120deg, #fff1de 0%, #ffdcb4 55%, #ffc88b 100%); color: var(--ink); padding: 64px 0 56px; position: relative; overflow: hidden; border-bottom: 2px solid rgba(245, 138, 37, .28); }
      .hero::after { content: ''; position: absolute; right: -90px; top: -90px; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.65), transparent 68%); }
      .wm { position: absolute; right: 5%; top: 50%; height: 210%; max-height: 360px; transform: translateY(-50%); opacity: .13; pointer-events: none; }
      h1 { color: var(--green-900); margin-bottom: 12px; }
      p { color: #5a4636; font-size: 1.1rem; max-width: 720px; margin: 0; }
      .crumbs { font-size: .85rem; margin-bottom: 18px; color: #7a5a3f; }
      .crumbs a { color: #8a3d05; font-weight: 600; }
      .eyebrow { color: #8a3d05; }
      @media (max-width: 640px) { .wm { display: none; } .hero { padding: 44px 0 40px; } }
    `,
  ],
  template: `
    <section class="hero">
      <img class="wm" src="/assets/logo/logo-orange.png" alt="" width="313" height="401" />
      <div class="container" style="position: relative; z-index: 1">
        <nav class="crumbs" aria-label="Breadcrumb"><a routerLink="/">Home</a> / {{ crumb() || title() }}</nav>
        @if (eyebrow()) { <span class="eyebrow">{{ eyebrow() }}</span> }
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p>{{ subtitle() }}</p> }
        <ng-content />
      </div>
    </section>
  `,
})
export class PageHero {
  title = input.required<string>();
  subtitle = input('');
  eyebrow = input('');
  crumb = input('');
}
