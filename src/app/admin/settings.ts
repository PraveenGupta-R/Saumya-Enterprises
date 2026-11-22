import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from './admin-api.service';
import { ImageUploader } from './admin-images';
import { DirtyAware, UiService } from './admin-ui';
import { SiteSettings } from '../core/models';

const empty = (): SiteSettings => ({
  companyName: '',
  proprietor: '',
  tagline: '',
  established: new Date().getFullYear(),
  businessType: '',
  businessNature: '',
  aboutText: '',
  warehouse: '',
  address: '',
  phone: '',
  whatsapp: '',
  email: '',
  hours: '',
  mapQuery: '',
  siteUrl: '',
  logoUrl: '',
  social: { facebook: '', instagram: '', linkedin: '', youtube: '', x: '' },
  markets: [],
  gaMeasurementId: '',
  searchConsoleToken: '',
});

@Component({
  selector: 'adm-settings',
  imports: [FormsModule, ImageUploader],
  template: `
    <div class="page-head">
      <div>
        <h1>Company &amp; contact details</h1>
        <p class="muted">These details appear across your website — in the header, footer, contact page and catalogue.</p>
      </div>
      <button type="button" class="btn primary" (click)="save()" [disabled]="saving() || loading()">{{ saving() ? 'Saving…' : 'Save changes' }}</button>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else {
      <div class="card">
        <h2>Company profile</h2>
        <div class="grid2">
          <label class="field"><span>Company name</span><input type="text" [(ngModel)]="m.companyName" name="cn" /></label>
          <label class="field"><span>Proprietor / owner</span><input type="text" [(ngModel)]="m.proprietor" name="pr" /></label>
        </div>
        <label class="field">
          <span>Slogan</span>
          <input type="text" [(ngModel)]="m.tagline" name="tg" />
        </label>
        <div class="grid2">
          <label class="field"><span>Year started</span><input type="number" [(ngModel)]="m.established" name="es" /></label>
          <label class="field"><span>Business type</span><input type="text" [(ngModel)]="m.businessType" name="bt" /></label>
        </div>
        <label class="field"><span>What the business does</span><input type="text" [(ngModel)]="m.businessNature" name="bn" /></label>
        <label class="field"><span>Warehouse</span><input type="text" [(ngModel)]="m.warehouse" name="wh" /></label>
        <label class="field">
          <span>About the company</span>
          <textarea rows="7" [(ngModel)]="m.aboutText" name="about"></textarea>
          <small class="help">Leave a blank line between paragraphs.</small>
        </label>
        <h3>Logo</h3>
        <adm-images [images]="m.logoUrl ? [m.logoUrl] : []" (imagesChange)="m.logoUrl = $event[0] || ''" [multiple]="false" />
        <p class="help">If you do not upload a logo, the default Saumya Enterprises mark is used. A transparent PNG works best.</p>
      </div>

      <div class="card">
        <h2>Contact details</h2>
        <label class="field"><span>Address</span><textarea rows="2" [(ngModel)]="m.address" name="ad"></textarea></label>
        <div class="grid2">
          <label class="field"><span>Phone number (shown to visitors)</span><input type="text" [(ngModel)]="m.phone" name="ph" placeholder="+91 89229 30911" /></label>
          <label class="field">
            <span>WhatsApp number</span>
            <input type="text" [(ngModel)]="m.whatsapp" name="wa" placeholder="918922930911" inputmode="numeric" />
            <small class="help">Digits only, with country code and no + sign. Example: 918922930911</small>
          </label>
        </div>
        <div class="grid2">
          <label class="field"><span>Business email</span><input type="email" [(ngModel)]="m.email" name="em" /></label>
          <label class="field"><span>Business hours</span><input type="text" [(ngModel)]="m.hours" name="hr" /></label>
        </div>
        <label class="field">
          <span>Google Map location</span>
          <input type="text" [(ngModel)]="m.mapQuery" name="mq" />
          <small class="help">Type the address as you would search it on Google Maps.</small>
        </label>
        <label class="field">
          <span>Website address</span>
          <input type="url" [(ngModel)]="m.siteUrl" name="su" placeholder="https://yourdomain.com" />
          <small class="help">The full web address of your site. Used for Google and sharing links.</small>
        </label>
      </div>

      <div class="card">
        <h2>Export markets</h2>
        <p class="help">Countries shown on the Export Markets page. Only list countries as “target” unless you have completed shipments there.</p>
        @for (r of m.markets; track $index) {
          <div class="rep three">
            <input type="text" [(ngModel)]="r.country" [name]="'mc' + $index" placeholder="Country" aria-label="Country" />
            <input type="text" [(ngModel)]="r.region" [name]="'mr' + $index" placeholder="Region (e.g. Middle East)" aria-label="Region" />
            <input type="text" [(ngModel)]="r.note" [name]="'mn' + $index" placeholder="Short note" aria-label="Note" />
            <button type="button" class="icon-btn danger" (click)="m.markets.splice($index, 1)" aria-label="Remove market">✕</button>
          </div>
        }
        <button type="button" class="btn sm" (click)="m.markets.push({ country: '', region: '', note: '' })">+ Add country</button>
      </div>

      <div class="card">
        <h2>Social media</h2>
        <div class="grid2">
          <label class="field"><span>Facebook page</span><input type="url" [(ngModel)]="m.social.facebook" name="fb" placeholder="https://facebook.com/…" /></label>
          <label class="field"><span>Instagram</span><input type="url" [(ngModel)]="m.social.instagram" name="ig" placeholder="https://instagram.com/…" /></label>
          <label class="field"><span>LinkedIn</span><input type="url" [(ngModel)]="m.social.linkedin" name="li" placeholder="https://linkedin.com/…" /></label>
          <label class="field"><span>YouTube</span><input type="url" [(ngModel)]="m.social.youtube" name="yt" placeholder="https://youtube.com/…" /></label>
          <label class="field"><span>X (Twitter)</span><input type="url" [(ngModel)]="m.social.x" name="xx" placeholder="https://x.com/…" /></label>
        </div>
        <p class="help">Leave a box empty to hide that icon.</p>
      </div>

      <div class="card">
        <h2>Google tools</h2>
        <label class="field">
          <span>Google Analytics measurement ID</span>
          <input type="text" [(ngModel)]="m.gaMeasurementId" name="ga" placeholder="G-XXXXXXXXXX" />
          <small class="help">Optional. Find it in Google Analytics → Admin → Data streams.</small>
        </label>
        <label class="field">
          <span>Google Search Console verification code</span>
          <input type="text" [(ngModel)]="m.searchConsoleToken" name="gsc" />
          <small class="help">Optional. Only the code from the “HTML tag” method (the text inside content="…").</small>
        </label>
      </div>

      <div class="savebar">
        <button type="button" class="btn primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save changes' }}</button>
      </div>
    }
  `,
})
export class SettingsPage implements DirtyAware {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  m: SiteSettings = empty();
  loading = signal(true);
  saving = signal(false);
  private snap = '';

  constructor() {
    this.load();
  }

  private async load() {
    try {
      const s = await this.api.get<SiteSettings>('/api/settings');
      const e = empty();
      this.m = { ...e, ...s, social: { ...e.social, ...(s.social ?? {}) }, markets: s.markets ?? [] };
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.snap = JSON.stringify(this.m);
      this.loading.set(false);
    }
  }

  isDirty() {
    return !this.loading() && JSON.stringify(this.m) !== this.snap;
  }
  @HostListener('window:beforeunload', ['$event'])
  unload(e: BeforeUnloadEvent) {
    if (this.isDirty()) e.preventDefault();
  }

  async save() {
    const body: SiteSettings = {
      ...this.m,
      established: Number(this.m.established) || 0,
      whatsapp: this.m.whatsapp.replace(/\D/g, ''),
      siteUrl: this.m.siteUrl.trim().replace(/\/+$/, ''),
      gaMeasurementId: this.m.gaMeasurementId.trim(),
      markets: this.m.markets.filter((r) => r.country.trim()),
    };
    this.saving.set(true);
    try {
      const saved = await this.api.put<SiteSettings>('/api/admin/settings', body);
      this.m = saved && saved.companyName ? { ...empty(), ...saved, social: { ...empty().social, ...saved.social } } : body;
      this.snap = JSON.stringify(this.m);
      this.ui.ok('Details saved. They are now live on your website.');
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }
}
