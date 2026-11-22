import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';
import { CtaBand } from '../shared/cta-band';

@Component({
  selector: 'app-blog',
  imports: [RouterLink, PageHero, CtaBand],
  styles: [
    `
      a.post { display: block; color: inherit; height: 100%; }
      .cover { aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--green-800), var(--green-700)); border-radius: 10px; margin-bottom: 16px; overflow: hidden; display: grid; place-items: center; color: var(--gold-400); font-family: var(--font-head); font-size: 1.1rem; }
      .cover img { width: 100%; height: 100%; object-fit: cover; }
      time { font-size: .82rem; color: var(--ink-soft); }
    `,
  ],
  template: `
    <app-page-hero title="Blog / News" eyebrow="Insights" subtitle="Practical guidance on buying and shipping agricultural products from India." crumb="Blog" />
    <section class="section">
      <div class="container">
        @if (site.posts().length) {
          <div class="grid grid-3">
            @for (p of site.posts(); track p.slug) {
              <a class="post" [routerLink]="['/blog', p.slug]">
                <article class="card card--hover" style="height: 100%">
                  <div class="cover">
                    @if (p.coverUrl) { <img [src]="p.coverUrl" [alt]="p.title" loading="lazy" /> } @else { Saumya Enterprises }
                  </div>
                  <time [attr.datetime]="p.publishedAt">{{ p.publishedAt }}</time>
                  <h3>{{ p.title }}</h3>
                  <p class="muted">{{ p.excerpt }}</p>
                  <strong style="color: var(--red-700)">Read article &rarr;</strong>
                </article>
              </a>
            }
          </div>
        } @else {
          <p class="center muted">No articles yet. Please check back soon.</p>
        }
      </div>
    </section>
    <app-cta-band />
  `,
})
export class BlogPage {
  site = inject(SiteService);
  constructor() {
    inject(SeoService).set({
      title: 'Blog & News: Onion Export Guides',
      description: 'Guides and news on onion sizes and grades, packing and shipping, and export documentation from Saumya Enterprises.',
      path: '/blog',
    });
  }
}
