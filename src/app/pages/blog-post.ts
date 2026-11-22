import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Post } from '../core/models';
import { SiteService, toBlocks } from '../core/site.service';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';
import { CtaBand } from '../shared/cta-band';

@Component({
  selector: 'app-blog-post',
  imports: [RouterLink, PageHero, CtaBand],
  template: `
    @if (post(); as p) {
      <app-page-hero [title]="p.title" [subtitle]="p.excerpt" eyebrow="Blog / News" [crumb]="p.title" />
      <section class="section">
        <div class="container" style="max-width: 820px">
          <p class="muted"><time [attr.datetime]="p.publishedAt">{{ p.publishedAt }}</time> &middot; By {{ site.settings().companyName }}</p>
          @if (p.coverUrl) { <img [src]="p.coverUrl" [alt]="p.title" style="border-radius: 14px; margin-bottom: 28px; width: 100%" /> }
          <article class="prose">
            @for (b of blocks(p.body); track $index) {
              @switch (b.t) {
                @case ('h') { <h2>{{ b.text }}</h2> }
                @case ('p') { <p>{{ b.text }}</p> }
                @case ('ul') { <ul class="check-list">@for (i of b.items; track $index) { <li>{{ i }}</li> }</ul> }
              }
            }
          </article>
          <p style="margin-top: 32px"><a routerLink="/blog">&larr; Back to all articles</a></p>
        </div>
      </section>
      <app-cta-band />
    } @else if (checking()) {
      <app-page-hero title="Loading article..." />
    } @else {
      <app-page-hero title="Article not found" crumb="Not found" />
      <section class="section"><div class="container center"><a class="btn btn--primary" routerLink="/blog">Back to blog</a></div></section>
    }
  `,
})
export class BlogPostPage {
  site = inject(SiteService);
  private seo = inject(SeoService);
  slug = input.required<string>();
  private fetched = signal<Post | null>(null);
  checking = signal(false);
  post = computed(() => this.site.postBySlug(this.slug()) ?? (this.fetched()?.slug === this.slug() ? this.fetched() : null));
  blocks = toBlocks;

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => {
        if (this.site.postBySlug(slug)) return;
        this.checking.set(true);
        this.site.fetchPost(slug).then((p) => {
          this.fetched.set(p);
          this.checking.set(false);
        });
      });
    });
    effect(() => {
      const p = this.post();
      if (!p) {
        this.seo.set({ title: 'Article not found', description: 'This article could not be found.', path: '/blog', noindex: true });
        return;
      }
      this.seo.set({
        title: p.title,
        description: p.excerpt,
        path: `/blog/${p.slug}`,
        image: p.coverUrl || undefined,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: p.title,
          description: p.excerpt,
          datePublished: p.publishedAt,
          author: { '@type': 'Organization', name: this.site.settings().companyName },
          publisher: { '@type': 'Organization', name: this.site.settings().companyName },
        },
      });
    });
  }
}
