import { Injectable, inject } from '@angular/core';
import type { jsPDF } from 'jspdf';
import { Certification, Product, SiteSettings } from './models';
import { SiteService } from './site.service';

const GREEN: [number, number, number] = [6, 27, 30];
const RED: [number, number, number] = [180, 80, 10];
const GOLD: [number, number, number] = [245, 138, 37];
const INK: [number, number, number] = [42, 28, 18];
const SOFT: [number, number, number] = [107, 90, 76];

const STATUS_TEXT: Record<string, string> = {
  obtained: 'Obtained',
  applied: 'Applied - awaiting confirmation',
  pending: 'To be obtained',
  to_confirm: 'To be confirmed',
  on_shipment: 'Arranged at time of shipment',
};

class Page {
  y = 0;
  /** data URL of the cream logo, shown on cover pages */
  logo: string | null = null;
  readonly w = 210;
  readonly m = 18;
  readonly bottom = 280;
  constructor(public doc: jsPDF, private s: SiteSettings) {}

  newPage(first = false): void {
    if (!first) this.doc.addPage();
    this.doc.setFillColor(...GREEN);
    this.doc.rect(0, 0, this.w, 16, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text(this.s.companyName.toUpperCase(), this.m, 10.5);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text('Export & Trading | India', this.w - this.m, 10.5, { align: 'right' });
    this.doc.setFillColor(...GOLD);
    this.doc.rect(0, 16, this.w, 1.2, 'F');
    this.y = 30;
    this.footer();
  }

  private footer(): void {
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...SOFT);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `${this.s.phone}  |  ${this.s.email}  |  ${this.s.siteUrl.replace(/^https?:\/\//, '')}`,
      this.w / 2,
      290,
      { align: 'center' },
    );
  }

  ensure(h: number): void {
    if (this.y + h > this.bottom) this.newPage();
  }

  h1(text: string): void {
    this.ensure(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(20);
    this.doc.setTextColor(...GREEN);
    this.doc.text(text, this.m, this.y);
    this.y += 9;
  }

  h2(text: string): void {
    this.ensure(14);
    this.y += 3;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12.5);
    this.doc.setTextColor(...RED);
    this.doc.text(text, this.m, this.y);
    this.doc.setDrawColor(...GOLD);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.m, this.y + 1.8, this.m + 22, this.y + 1.8);
    this.y += 7;
  }

  para(text: string, size = 10.5, color = INK): void {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
    const lines = this.doc.splitTextToSize(text, this.w - this.m * 2) as string[];
    for (const ln of lines) {
      this.ensure(6);
      this.doc.text(ln, this.m, this.y);
      this.y += 5.2;
    }
    this.y += 1.5;
  }

  bullets(items: string[]): void {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10.5);
    for (const it of items) {
      const lines = this.doc.splitTextToSize(it, this.w - this.m * 2 - 6) as string[];
      this.ensure(lines.length * 5.2 + 1);
      this.doc.setTextColor(...RED);
      this.doc.text('-', this.m + 1, this.y);
      this.doc.setTextColor(...INK);
      lines.forEach((ln, i) => this.doc.text(ln, this.m + 6, this.y + i * 5.2));
      this.y += lines.length * 5.2 + 0.8;
    }
    this.y += 1.5;
  }

  rows(rows: [string, string][]): void {
    const colW = 52;
    const valW = this.w - this.m * 2 - colW - 4;
    this.doc.setFontSize(10);
    rows.forEach((r, idx) => {
      const lines = this.doc.splitTextToSize(r[1], valW) as string[];
      const h = Math.max(7.5, lines.length * 5 + 3);
      this.ensure(h);
      if (idx % 2 === 0) {
        this.doc.setFillColor(255, 238, 219);
        this.doc.rect(this.m, this.y - 5, this.w - this.m * 2, h, 'F');
      }
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...GREEN);
      this.doc.text(r[0], this.m + 2, this.y);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...INK);
      lines.forEach((ln, i) => this.doc.text(ln, this.m + colW, this.y + i * 5));
      this.y += h;
    });
    this.y += 3;
  }
}

@Injectable({ providedIn: 'root' })
export class PdfService {
  private site = inject(SiteService);

  private async create(): Promise<{ doc: jsPDF; page: Page; s: SiteSettings }> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const s = this.site.settings();
    const page = new Page(doc, s);
    page.logo = await this.loadDataUrl('/assets/logo/logo-light-bold.png');
    return { doc, page, s };
  }

  private async loadDataUrl(url: string): Promise<string | null> {
    try {
      const blob = await (await fetch(url)).blob();
      return await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    } catch {
      return null; // the PDF is still produced, just without the emblem
    }
  }

  private cover(page: Page, s: SiteSettings, title: string, subtitle: string): void {
    const { doc } = page;
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, 210, 297, 'F');
    if (page.logo) doc.addImage(page.logo, 'PNG', 18, 24, 39, 50);
    doc.setFillColor(...GOLD);
    doc.rect(18, 98, 26, 1.6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    doc.text(s.companyName.toUpperCase(), 18, 90);
    doc.setFontSize(22);
    doc.setTextColor(...GOLD);
    doc.text(title, 18, 118);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(225, 238, 230);
    (doc.splitTextToSize(subtitle, 160) as string[]).forEach((l, i) => doc.text(l, 18, 130 + i * 6));
    doc.setFontSize(10.5);
    doc.text(`Proprietor: ${s.proprietor}`, 18, 240);
    doc.text(`${s.phone}  |  WhatsApp: +${s.whatsapp}`, 18, 247);
    doc.text(s.email, 18, 254);
    (doc.splitTextToSize(s.address, 170) as string[]).forEach((l, i) => doc.text(l, 18, 261 + i * 5.5));
    page.newPage();
  }

  async downloadCatalogue(): Promise<void> {
    const { doc, page, s } = await this.create();
    const products = this.site.availableProducts();
    this.cover(page, s, 'Product Catalogue', 'Fresh agricultural products from India for importers, wholesalers and distributors.');
    page.h1('Products available for export');
    page.para(
      'Product details, sizes, grades, packaging, quantity and shipment terms are subject to confirmation in the final quotation or sales contract. Availability depends on seasonal supply, government export policy and destination-country import regulations.',
      10,
      SOFT,
    );
    products.forEach((p, i) => {
      if (i > 0) page.newPage();
      this.productSection(page, p);
    });
    const up = this.site.upcomingProducts();
    if (up.length) {
      page.ensure(30);
      page.h2('Planned future range');
      page.para('Not yet available for export. Inquiries are welcome: ' + up.map((p) => p.name).join(', ') + '.');
    }
    page.h2('Request a quote');
    page.para(`WhatsApp / Phone: ${s.phone}   |   Email: ${s.email}`);
    doc.save('Saumya-Enterprises-Product-Catalogue.pdf');
  }

  async downloadProduct(p: Product): Promise<void> {
    const { doc, page, s } = await this.create();
    page.newPage(true);
    this.productSection(page, p);
    page.h2('Request a quote');
    page.para(`WhatsApp / Phone: ${s.phone}   |   Email: ${s.email}`);
    doc.save(`Saumya-Enterprises-${p.slug}.pdf`);
  }

  private productSection(page: Page, p: Product): void {
    page.h1(p.name);
    page.para(`Country of origin: ${p.origin || 'India'}`, 10, SOFT);
    page.para(p.description.replace(/\n+/g, ' '));
    if (p.specs.length) {
      page.h2('Specifications');
      page.rows(p.specs.map((r) => [r.label, r.value]));
    }
    if (p.sizes.length) {
      page.h2('Available sizes');
      page.rows(p.sizes.map((r) => [r.name, r.range]));
    }
    if (p.grades.length) {
      page.h2('Grades');
      page.para(p.grades.join('  |  '));
    }
    if (p.packaging.length) {
      page.h2('Packaging options');
      page.rows(p.packaging.map((r) => [r.name, r.detail]));
    }
    if (p.moq) {
      page.h2('Minimum order quantity');
      page.para(p.moq);
    }
    if (p.supplyCapacity) {
      page.h2('Supply capacity');
      page.para(p.supplyCapacity);
    }
    if (p.qualityStandards.length) {
      page.h2('Quality standards');
      page.bullets(p.qualityStandards);
    }
    if (p.exportAvailability) {
      page.h2('Export availability');
      page.para(p.exportAvailability);
    }
  }

  async downloadProfile(): Promise<void> {
    const { doc, page, s } = await this.create();
    this.cover(page, s, 'Company Profile', s.tagline);
    page.h1('About us');
    s.aboutText.split(/\n+/).forEach((t) => page.para(t));
    page.h2('Business details');
    page.rows([
      ['Company', s.companyName],
      ['Proprietor', s.proprietor],
      ['Established', String(s.established)],
      ['Business type', s.businessType],
      ['Nature of business', s.businessNature],
      ['Warehouse', s.warehouse],
      ['Registered location', s.address],
      ['Business hours', s.hours],
    ]);
    page.h2('Products');
    page.bullets(this.site.availableProducts().map((p) => `${p.name} - ${p.shortDesc}`));
    page.h2('Target export markets');
    page.bullets(s.markets.map((m) => `${m.country} (${m.region})`));
    page.para('These are our target markets; availability is subject to seasonal supply, government export policy and destination import regulations.', 9.5, SOFT);
    page.h2('Registrations and compliance');
    page.rows(this.site.certifications().map((c: Certification): [string, string] => [c.name, STATUS_TEXT[c.status] ?? c.status]));
    page.h2('Contact');
    page.rows([
      ['Contact person', s.contactPerson || s.proprietor],
      ['Phone / WhatsApp', s.phone],
      ['Email', s.email],
      ['Website', s.siteUrl],
    ]);
    doc.save('Saumya-Enterprises-Company-Profile.pdf');
  }
}
