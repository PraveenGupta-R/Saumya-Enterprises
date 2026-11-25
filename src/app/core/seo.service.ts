import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SiteService } from './site.service';

export interface PageMeta {
  title: string;
  description: string;
  /** path starting with '/', used for canonical + og:url */
  path: string;
  image?: string;
  noindex?: boolean;
  /** schema.org JSON-LD object(s) */
  jsonLd?: object | object[];
  type?: 'website' | 'article' | 'product';
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);
  private site = inject(SiteService);

  set(p: PageMeta): void {
    const s = this.site.settings();
    const base = (s.siteUrl || '').replace(/\/$/, '');
    const url = base + (p.path === '/' ? '/' : p.path);
    const fullTitle = p.title.includes(s.companyName) ? p.title : `${p.title} | ${s.companyName}`;
    const image = p.image ? (p.image.startsWith('http') ? p.image : base + p.image) : base + '/assets/img/red-onion.svg';
    const desc = p.description.slice(0, 300);

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ name: 'robots', content: p.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:type', content: p.type === 'article' ? 'article' : 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:site_name', content: s.companyName });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: desc });
    if (s.searchConsoleToken) {
      this.meta.updateTag({ name: 'google-site-verification', content: s.searchConsoleToken });
    }
    this.setLink('canonical', url);
    this.setJsonLd(p.jsonLd);
  }

  private setLink(rel: string, href: string): void {
    let el = this.doc.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) {
      el = this.doc.createElement('link');
      el.setAttribute('rel', rel);
      this.doc.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  private setJsonLd(data?: object | object[]): void {
    this.doc.head.querySelectorAll('script[data-seo-ld]').forEach((n) => n.remove());
    if (!data) return;
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      const el = this.doc.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-seo-ld', '1');
      // Escape "<" so content can never close the script tag.
      el.text = JSON.stringify(item).replace(/</g, '\\u003c');
      this.doc.head.appendChild(el);
    }
  }

  /** Organization schema reused on the home page. */
  organizationLd(): object {
    const s = this.site.settings();
    const base = (s.siteUrl || '').replace(/\/$/, '');
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: s.companyName,
      url: base,
      logo: base + '/favicon.svg',
      description: s.aboutText.split('\n')[0],
      telephone: s.phone,
      email: s.email,
      founder: { '@type': 'Person', name: s.proprietor },
      foundingDate: String(s.established),
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Gandhi Nagar, Tetari Bazar, Naugarh',
        addressLocality: 'Siddharthnagar',
        addressRegion: 'Uttar Pradesh',
        postalCode: '272207',
        addressCountry: 'IN',
      },
      contactPoint: [
        { '@type': 'ContactPoint', contactType: 'sales', name: s.contactPerson || s.proprietor, telephone: s.phone, availableLanguage: ['English', 'Hindi'] },
      ],
      sameAs: Object.values(s.social).filter(Boolean),
    };
  }

  breadcrumbLd(items: { name: string; path: string }[]): object {
    const base = (this.site.settings().siteUrl || '').replace(/\/$/, '');
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        item: base + it.path,
      })),
    };
  }
}
