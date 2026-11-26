import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../core/models';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  styles: [
    `
      a.card-link { display: block; color: inherit; height: 100%; }
      .card { padding: 0; overflow: hidden; height: 100%; display: flex; flex-direction: column; }
      .img { aspect-ratio: 4 / 3; background: var(--green-100); overflow: hidden; }
      .img img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
      .card:hover .img img { transform: scale(1.05); }
      .body { padding: 22px 24px 26px; display: flex; flex-direction: column; flex: 1; gap: 8px; }
      h3 { margin: 0; }
      p { color: var(--ink-soft); margin: 0; flex: 1; }
      .more { font-weight: 600; color: var(--red-700); margin-top: 10px; }
    `,
  ],
  template: `
    <a class="card-link" [routerLink]="['/products', product().slug]">
      <article class="card card--hover">
        <div class="img">
          @if (product().images.length) {
            <img [src]="product().images[0]" [alt]="product().name" loading="lazy" />
          }
        </div>
        <div class="body">
          <span class="badge badge--{{ product().availability }}">{{ label() }}</span>
          <h3>{{ product().name }}</h3>
          <p>{{ product().shortDesc }}</p>
          <span class="more">{{ product().availability === 'available' ? 'View specifications' : 'Ask about this product' }} &rarr;</span>
        </div>
      </article>
    </a>
  `,
})
export class ProductCard {
  product = input.required<Product>();
  label() {
    const a = this.product().availability;
    return a === 'available' ? 'Available for export' : a === 'coming_soon' ? 'Coming soon' : 'Currently unavailable';
  }
}
