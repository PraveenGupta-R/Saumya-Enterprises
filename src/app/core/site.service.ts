import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import seedJson from '../../../seed/seed.json';
import {
  Category,
  Certification,
  InquiryInput,
  Post,
  Product,
  SeedData,
  SiteSettings,
  Testimonial,
} from './models';

const seed = seedJson as unknown as SeedData;

function seedCategories(): Category[] {
  return seed.categories.map((c, i) => ({ ...c, id: i + 1 }));
}
function seedProducts(): Product[] {
  const cats = seedCategories();
  return seed.products.map((p, i) => {
    const { categorySlug, ...rest } = p;
    return { ...rest, id: i + 1, categoryId: cats.find((c) => c.slug === categorySlug)?.id ?? null };
  });
}

/**
 * Holds all public content. State starts from the bundled seed (so prerendered HTML and the
 * first browser paint are identical, which keeps hydration clean) and is refreshed from the API
 * in the browser, so edits made in the admin panel show up.
 */
@Injectable({ providedIn: 'root' })
export class SiteService {
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly settings = signal<SiteSettings>(seed.settings);
  readonly categories = signal<Category[]>(seedCategories());
  readonly products = signal<Product[]>(seedProducts());
  readonly certifications = signal<Certification[]>(seed.certifications.map((c, i) => ({ ...c, id: i + 1 })));
  readonly posts = signal<Post[]>(seed.posts.map((p, i) => ({ ...p, id: i + 1 })).sort(byDateDesc));
  readonly testimonials = signal<Testimonial[]>(seed.testimonials.map((t, i) => ({ ...t, id: i + 1 })));
  readonly loaded = signal(false);
  /** Pre-filled text for the floating WhatsApp button; product pages override it. */
  readonly waContext = signal('Hello Saumya Enterprises, I would like to know more about your export products.');

  readonly availableProducts = computed(() => this.products().filter((p) => p.availability === 'available'));
  readonly upcomingProducts = computed(() => this.products().filter((p) => p.availability !== 'available'));
  readonly waLink = computed(() => `https://wa.me/${this.settings().whatsapp}`);

  private started = false;

  /** Refresh from the API (browser only). Failures keep the bundled content. */
  async refresh(): Promise<void> {
    if (!this.isBrowser || this.started) return;
    this.started = true;
    const get = async <T>(url: string): Promise<T | null> => {
      try {
        return await firstValueFrom(this.http.get<T>(url));
      } catch {
        return null;
      }
    };
    const [settings, categories, products, certs, posts, testimonials] = await Promise.all([
      get<SiteSettings>('/api/settings'),
      get<Category[]>('/api/categories'),
      get<Product[]>('/api/products'),
      get<Certification[]>('/api/certifications'),
      get<Post[]>('/api/posts'),
      get<Testimonial[]>('/api/testimonials'),
    ]);
    if (settings && settings.companyName) this.settings.set({ ...seed.settings, ...settings });
    if (categories) this.categories.set(categories);
    if (products) this.products.set(products);
    if (certs) this.certifications.set(certs);
    if (posts) this.posts.set([...posts].sort(byDateDesc));
    if (testimonials) this.testimonials.set(testimonials);
    this.loaded.set(true);
  }

  productBySlug(slug: string): Product | undefined {
    return this.products().find((p) => p.slug === slug);
  }

  async fetchProduct(slug: string): Promise<Product | null> {
    if (!this.isBrowser) return null;
    try {
      return await firstValueFrom(this.http.get<Product>(`/api/products/${encodeURIComponent(slug)}`));
    } catch {
      return null;
    }
  }

  postBySlug(slug: string): Post | undefined {
    return this.posts().find((p) => p.slug === slug);
  }

  async fetchPost(slug: string): Promise<Post | null> {
    if (!this.isBrowser) return null;
    try {
      return await firstValueFrom(this.http.get<Post>(`/api/posts/${encodeURIComponent(slug)}`));
    } catch {
      return null;
    }
  }

  categoryName(id: number | null): string {
    return this.categories().find((c) => c.id === id)?.name ?? '';
  }

  async submitInquiry(input: InquiryInput): Promise<{ ok: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.post('/api/inquiries', input));
      return { ok: true };
    } catch (e: unknown) {
      const err = e as { error?: { error?: string }; status?: number };
      const status = err?.status ?? 0;
      let msg = err?.error?.error; // the server explains validation problems itself, e.g. "Please enter a valid email address"
      if (!msg) {
        msg =
          status === 429
            ? 'Too many inquiries were sent from this connection. Please try again in a while.'
            : status === 0 || status === 404 || status >= 500
              ? 'Our inquiry service could not be reached just now, so nothing was saved.'
              : 'We could not send your inquiry just now.';
      }
      return { ok: false, error: msg };
    }
  }

  waLinkFor(text: string): string {
    return `https://wa.me/${this.settings().whatsapp}?text=${encodeURIComponent(text)}`;
  }
}

function byDateDesc(a: Post, b: Post): number {
  return (b.publishedAt || '').localeCompare(a.publishedAt || '');
}

export type RichBlock = { t: 'h'; text: string } | { t: 'p'; text: string } | { t: 'ul'; items: string[] };

/** Turns plain admin-authored text into safe blocks (no innerHTML needed). */
export function toBlocks(text: string): RichBlock[] {
  const out: RichBlock[] = [];
  const lines = (text || '').replace(/\r/g, '').split('\n');
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) out.push({ t: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push({ t: 'ul', items: list });
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
    } else if (line.startsWith('## ')) {
      flushPara();
      flushList();
      out.push({ t: 'h', text: line.slice(3) });
    } else if (line.startsWith('- ')) {
      flushPara();
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out;
}
