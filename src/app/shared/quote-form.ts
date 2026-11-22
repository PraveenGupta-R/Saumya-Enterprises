import { Component, inject, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SiteService } from '../core/site.service';

@Component({
  selector: 'app-quote-form',
  imports: [FormsModule],
  template: `
    @if (done()) {
      <div class="alert alert--ok" role="status">
        <strong>Thank you, your inquiry has been received.</strong><br />
        Our team will respond with details and pricing as soon as possible. For a faster reply you can also message us on
        <a [href]="site.waLinkFor(waMessage())" target="_blank" rel="noopener noreferrer">WhatsApp</a>.
      </div>
    } @else {
      <form (ngSubmit)="submit()" #f="ngForm" novalidate>
        @if (error()) { <div class="alert alert--err" role="alert">{{ error() }}</div> }
        <div class="form-grid">
          <div class="field">
            <label for="q-name">Your name *</label>
            <input id="q-name" name="name" [(ngModel)]="m.name" required maxlength="120" autocomplete="name" />
          </div>
          <div class="field">
            <label for="q-company">Company name</label>
            <input id="q-company" name="company" [(ngModel)]="m.company" maxlength="160" autocomplete="organization" />
          </div>
          <div class="field">
            <label for="q-country">Country *</label>
            <input id="q-country" name="country" [(ngModel)]="m.country" required maxlength="80" autocomplete="country-name" />
          </div>
          <div class="field">
            <label for="q-product">Product</label>
            <select id="q-product" name="productSlug" [(ngModel)]="m.productSlug">
              <option value="">Select a product</option>
              @for (p of site.products(); track p.slug) {
                <option [value]="p.slug">{{ p.name }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="q-email">Email address *</label>
            <input id="q-email" name="email" type="email" [(ngModel)]="m.email" required maxlength="160" autocomplete="email" />
          </div>
          <div class="field">
            <label for="q-wa">WhatsApp number (with country code)</label>
            <input id="q-wa" name="whatsapp" type="tel" [(ngModel)]="m.whatsapp" maxlength="30" placeholder="e.g. +971 50 123 4567" autocomplete="tel" />
          </div>
          <div class="field full">
            <label for="q-qty">Required quantity *</label>
            <input id="q-qty" name="quantity" [(ngModel)]="m.quantity" required maxlength="80" placeholder="e.g. 1 x 20ft container / 25 metric tons" />
          </div>
          <div class="field full">
            <label for="q-msg">Product requirements and message</label>
            <textarea id="q-msg" name="message" [(ngModel)]="m.message" maxlength="3000" placeholder="Size / grade, packaging, destination port, delivery timeline, Incoterm (FOB / CIF)..."></textarea>
          </div>
          <div class="hp" aria-hidden="true">
            <label>Leave this empty <input name="website" [(ngModel)]="m.website" tabindex="-1" autocomplete="off" /></label>
          </div>
        </div>
        @if (tried() && invalid()) { <p class="err" style="color: var(--red-700)">Please fill in all fields marked with *.</p> }
        <div class="btn-row" style="margin-top: 18px">
          <button class="btn btn--primary" type="submit" [disabled]="sending()">
            {{ sending() ? 'Sending...' : 'Send Inquiry' }}
          </button>
          <a class="btn btn--wa" [href]="site.waLinkFor(waMessage())" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
        </div>
        <p class="muted" style="font-size: .85rem; margin-top: 14px">
          Your details are used only to respond to your inquiry. Prices and terms are confirmed in the final quotation.
        </p>
      </form>
    }
  `,
})
export class QuoteForm {
  site = inject(SiteService);
  productSlug = input('');
  done = signal(false);
  sending = signal(false);
  error = signal('');
  tried = signal(false);
  m = { name: '', company: '', country: '', productSlug: '', email: '', whatsapp: '', quantity: '', message: '', website: '' };

  constructor() {
    effect(() => {
      const s = this.productSlug();
      if (s) this.m.productSlug = s;
    });
  }

  waMessage(): string {
    const p = this.site.productBySlug(this.m.productSlug);
    return `Hello Saumya Enterprises, I would like a quote${p ? ' for ' + p.name : ''}${this.m.quantity ? ' (' + this.m.quantity + ')' : ''}.`;
  }

  invalid(): boolean {
    const { name, country, email, quantity } = this.m;
    return !name.trim() || !country.trim() || !quantity.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  }

  async submit(): Promise<void> {
    this.tried.set(true);
    this.error.set('');
    if (this.invalid()) return;
    this.sending.set(true);
    const res = await this.site.submitInquiry({
      productSlug: this.m.productSlug || undefined,
      name: this.m.name.trim(),
      company: this.m.company.trim(),
      country: this.m.country.trim(),
      email: this.m.email.trim(),
      whatsapp: this.m.whatsapp.trim(),
      quantity: this.m.quantity.trim(),
      message: this.m.message.trim(),
      website: this.m.website,
    });
    this.sending.set(false);
    if (res.ok) this.done.set(true);
    else this.error.set(res.error || 'Something went wrong.');
  }
}
