import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/site.service';

@Component({
  selector: 'app-cta-band',
  imports: [RouterLink],
  styles: [
    `
      .band { background: linear-gradient(120deg, #ffa24d, #ffc07a 70%, #ffd29b); color: var(--green-900); padding: 56px 0; position: relative; overflow: hidden; }
      .band::before { content: ''; position: absolute; left: -60px; bottom: -80px; width: 300px; height: 300px; border-radius: 50%; background: rgba(255,255,255,.28); }
      .in { display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; position: relative; }
      h2 { color: var(--green-900); margin: 0 0 8px; }
      p { margin: 0; color: #4a2c10; max-width: 620px; font-size: 1.05rem; }
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
          <a class="btn btn--green" routerLink="/request-a-quote">Request a Quote</a>
          <a class="btn btn--ghost" [href]="site.waLink()" target="_blank" rel="noopener noreferrer">WhatsApp {{ site.settings().phone }}</a>
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
