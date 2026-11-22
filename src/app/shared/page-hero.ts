import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-hero',
  imports: [RouterLink],
  styles: [
    `
      .hero { background: linear-gradient(135deg, var(--green-900), var(--green-700)); color: #fff; padding: 64px 0 56px; position: relative; overflow: hidden; }
      .hero::after { content: ''; position: absolute; right: -80px; top: -80px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(201,162,75,.28), transparent 68%); }
      h1 { color: #fff; margin-bottom: 12px; }
      p { color: #d4e5db; font-size: 1.1rem; max-width: 720px; margin: 0; }
      .crumbs { font-size: .85rem; margin-bottom: 18px; color: #a9c4b6; }
      .crumbs a { color: var(--gold-400); }
      .eyebrow { color: var(--gold-400); }
    `,
  ],
  template: `
    <section class="hero">
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
