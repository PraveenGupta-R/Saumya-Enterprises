import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { PageHero } from '../shared/page-hero';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, PageHero],
  template: `
    <app-page-hero title="Page not found" subtitle="The page you are looking for does not exist or has moved." crumb="404" />
    <section class="section">
      <div class="container center">
        <div class="btn-row" style="justify-content: center">
          <a class="btn btn--primary" routerLink="/">Go to home page</a>
          <a class="btn btn--ghost" routerLink="/products">View products</a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundPage {
  constructor() {
    inject(SeoService).set({ title: 'Page not found', description: 'Page not found.', path: '/404', noindex: true });
  }
}
