import { Component, DOCUMENT, PLATFORM_ID, effect, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SiteService } from './core/site.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private site = inject(SiteService);
  private doc = inject(DOCUMENT);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private gaLoaded = false;

  constructor() {
    if (this.isBrowser) {
      void this.site.refresh();
    }
    // Google Analytics is only loaded when a Measurement ID has been saved in the admin panel.
    effect(() => {
      const id = this.site.settings().gaMeasurementId?.trim();
      if (!this.isBrowser || this.gaLoaded || !id || !/^(G|UA|AW)-[A-Z0-9-]+$/i.test(id)) return;
      this.gaLoaded = true;
      const s = this.doc.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      this.doc.head.appendChild(s);
      const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
      w.dataLayer = w.dataLayer || [];
      w.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments);
      };
      w.gtag('js', new Date());
      w.gtag('config', id);
    });
  }
}
