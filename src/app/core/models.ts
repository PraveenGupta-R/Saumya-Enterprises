/**
 * Shared data contract between the Angular app (public site + admin panel)
 * and the Cloudflare Worker API (worker/). All JSON on the wire is camelCase.
 * The Worker maps these to snake_case D1 columns.
 */

export type Availability = 'available' | 'coming_soon' | 'unavailable';
export type CertStatus = 'obtained' | 'applied' | 'pending' | 'to_confirm' | 'on_shipment';
export type InquiryStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'closed';

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  sort: number;
}

export interface SpecRow {
  label: string;
  value: string;
}
export interface SizeRow {
  name: string;
  range: string;
}
export interface PackagingRow {
  name: string;
  detail: string;
}

export interface Product {
  id: number;
  slug: string;
  categoryId: number | null;
  name: string;
  /** one-line summary used on cards and in meta description fallback */
  shortDesc: string;
  /** long description, plain text; blank line = new paragraph */
  description: string;
  origin: string;
  availability: Availability;
  specs: SpecRow[];
  sizes: SizeRow[];
  grades: string[];
  packaging: PackagingRow[];
  moq: string;
  supplyCapacity: string;
  qualityStandards: string[];
  exportAvailability: string;
  /** image URLs: either '/assets/img/...' (bundled) or '/api/media/<key>' (uploaded) */
  images: string[];
  seoTitle: string;
  seoDescription: string;
  sort: number;
  published: boolean;
}

export interface Certification {
  id: number;
  key: string;
  name: string;
  status: CertStatus;
  note: string;
  sort: number;
  published: boolean;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  /** plain text body: blank line = paragraph, "## " = heading, "- " = bullet */
  body: string;
  coverUrl: string;
  published: boolean;
  /** ISO date (YYYY-MM-DD) */
  publishedAt: string;
}

export interface Testimonial {
  id: number;
  name: string;
  company: string;
  country: string;
  text: string;
  published: boolean;
  sort: number;
}

export interface MarketRow {
  country: string;
  /** e.g. 'Middle East' */
  region: string;
  note: string;
}

export interface SiteSettings {
  companyName: string;
  proprietor: string;
  /** person buyers deal with for international inquiries */
  contactPerson: string;
  tagline: string;
  established: number;
  businessType: string;
  businessNature: string;
  aboutText: string;
  warehouse: string;
  address: string;
  phone: string;
  /** digits only with country code, e.g. 918922930911 */
  whatsapp: string;
  email: string;
  hours: string;
  mapQuery: string;
  siteUrl: string;
  logoUrl: string;
  /** optional hero slideshow photos; when empty the bundled illustrated slides are used */
  heroImages: string[];
  social: { facebook: string; instagram: string; linkedin: string; youtube: string; x: string };
  markets: MarketRow[];
  gaMeasurementId: string;
  searchConsoleToken: string;
}

export interface InquiryInput {
  productSlug?: string;
  name: string;
  company: string;
  country: string;
  email: string;
  whatsapp: string;
  quantity: string;
  message: string;
  /** honeypot: must be empty */
  website?: string;
}

export interface Inquiry extends Omit<InquiryInput, 'website'> {
  id: number;
  productName: string;
  status: InquiryStatus;
  notes: string;
  createdAt: string;
}

export interface AdminStats {
  inquiriesTotal: number;
  inquiriesNew: number;
  inquiriesLast7Days: number;
  productsTotal: number;
  productsPublished: number;
  postsTotal: number;
  testimonialsTotal: number;
}

export type SeedProduct = Omit<Product, 'id' | 'categoryId'> & { categorySlug: string };

export interface SeedData {
  settings: SiteSettings;
  categories: Omit<Category, 'id'>[];
  products: SeedProduct[];
  certifications: Omit<Certification, 'id'>[];
  posts: Omit<Post, 'id'>[];
  testimonials: Omit<Testimonial, 'id'>[];
}
