import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';

@Component({
  selector: 'app-cta-band',
  imports: [RouterLink],
  styles: [
    `
      .band { background: linear-gradient(120deg, var(--red-700), #6d1229); color: #fff; padding: 56px 0; }
      .in { display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
      h2 { color: #fff; margin: 0 0 8px; }
      p { margin: 0; color: #f6dfe4; max-width: 620px; }
    `,
  ],
  template: `
    <section class="band">
      <div class="container in">
        <div>
          <h2>{{ title() }}</h2>
          <p>{{ text() }}</p>
        </div>
        <div class="btn-row">
          <a class="btn btn--gold" routerLink="/request-a-quote">Request a Quote</a>
          <a class="btn btn--ghost-light" [href]="site.waLink()" target="_blank" rel="noopener noreferrer">WhatsApp {{ site.settings().phone }}</a>
        </div>
      </div>
    </section>
  `,
})
export class CtaBand {
  site = inject(SiteService);
  title = input('Looking for a reliable onion supplier from India?');
  text = input('Tell us your product, quantity and destination. We will come back with specifications, packaging options and a quotation.');
}
