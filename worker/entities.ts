import {
  HttpError, bool, int, list, obj, oneOf, parseJson, slugField, str, urlField, slugify,
} from './lib';

type Row = Record<string, unknown>;
type Json = Record<string, any>;

export interface EntityConfig {
  table: string;
  /** DB columns (excluding id), in the order returned by toParams */
  cols: string[];
  /** ORDER BY clause for lists */
  order: string;
  /** column holding the published flag, if any */
  publishedCol?: string;
  /** column used for public single lookup (slug) */
  slugCol?: string;
  uniqueMessage: string;
  fromRow(r: Row): Json;
  /** merged = existing (or defaults) overlaid with request body. Returns clean object. */
  validate(merged: Json, db: D1Database): Promise<Json> | Json;
  toParams(o: Json): unknown[];
  defaults(): Json;
}

const b = (v: unknown) => v === 1 || v === true;

/* ---------------- categories ---------------- */
export const categories: EntityConfig = {
  table: 'categories',
  cols: ['slug', 'name', 'description', 'sort'],
  order: 'sort, id',
  slugCol: 'slug',
  uniqueMessage: 'A category with this slug already exists.',
  defaults: () => ({ slug: '', name: '', description: '', sort: 0 }),
  fromRow: (r) => ({ id: r['id'], slug: r['slug'], name: r['name'], description: r['description'], sort: r['sort'] }),
  validate: (m) => {
    const name = str(m['name'], 120, 'name', true);
    return { slug: slugField(m['slug'], name), name, description: str(m['description'], 500, 'description'), sort: int(m['sort'], 'sort') };
  },
  toParams: (o) => [o['slug'], o['name'], o['description'], o['sort']],
};

/* ---------------- products ---------------- */
const AVAIL = ['available', 'coming_soon', 'unavailable'] as const;

export const products: EntityConfig = {
  table: 'products',
  cols: [
    'slug', 'category_id', 'name', 'short_desc', 'description', 'origin', 'availability', 'specs', 'sizes', 'grades',
    'packaging', 'moq', 'supply_capacity', 'quality_standards', 'export_availability', 'images', 'seo_title',
    'seo_description', 'sort', 'published',
  ],
  order: 'sort, id',
  publishedCol: 'published',
  slugCol: 'slug',
  uniqueMessage: 'A product with this slug already exists. Please choose a different name or slug.',
  defaults: () => ({
    slug: '', categoryId: null, name: '', shortDesc: '', description: '', origin: 'India', availability: 'available',
    specs: [], sizes: [], grades: [], packaging: [], moq: '', supplyCapacity: '', qualityStandards: [],
    exportAvailability: '', images: [], seoTitle: '', seoDescription: '', sort: 0, published: true,
  }),
  fromRow: (r) => ({
    id: r['id'],
    slug: r['slug'],
    categoryId: r['category_id'] ?? null,
    name: r['name'],
    shortDesc: r['short_desc'],
    description: r['description'],
    origin: r['origin'],
    availability: r['availability'],
    specs: parseJson(r['specs'], []),
    sizes: parseJson(r['sizes'], []),
    grades: parseJson(r['grades'], []),
    packaging: parseJson(r['packaging'], []),
    moq: r['moq'],
    supplyCapacity: r['supply_capacity'],
    qualityStandards: parseJson(r['quality_standards'], []),
    exportAvailability: r['export_availability'],
    images: parseJson(r['images'], []),
    seoTitle: r['seo_title'],
    seoDescription: r['seo_description'],
    sort: r['sort'],
    published: b(r['published']),
  }),
  validate: async (m, db) => {
    const name = str(m['name'], 160, 'name', true);
    let categoryId: number | null = null;
    if (m['categoryId'] != null && m['categoryId'] !== '') {
      categoryId = int(m['categoryId'], 'categoryId');
      const ok = await db.prepare('SELECT 1 AS x FROM categories WHERE id = ?').bind(categoryId).first();
      if (!ok) throw new HttpError(400, 'Selected category does not exist');
    }
    const pair = (a: string, bKey: string, field: string) => (item: unknown) => {
      const o = obj(item, field);
      const x = str(o[a], 200, `${field} ${a}`);
      const y = str(o[bKey], 1000, `${field} ${bKey}`);
      return x || y ? { [a]: x, [bKey]: y } : null;
    };
    const strList = (v: unknown, field: string, max = 40, len = 500) =>
      list(v, max, field, (i) => str(i, len, field) || null);
    return {
      slug: slugField(m['slug'], name),
      categoryId,
      name,
      shortDesc: str(m['shortDesc'], 500, 'shortDesc'),
      description: str(m['description'], 10000, 'description'),
      origin: str(m['origin'], 100, 'origin') || 'India',
      availability: oneOf(m['availability'], AVAIL, 'availability', 'available'),
      specs: list(m['specs'], 40, 'specs', pair('label', 'value', 'specs')),
      sizes: list(m['sizes'], 20, 'sizes', pair('name', 'range', 'sizes')),
      grades: strList(m['grades'], 'grades', 20, 120),
      packaging: list(m['packaging'], 20, 'packaging', pair('name', 'detail', 'packaging')),
      moq: str(m['moq'], 1000, 'moq'),
      supplyCapacity: str(m['supplyCapacity'], 2000, 'supplyCapacity'),
      qualityStandards: strList(m['qualityStandards'], 'qualityStandards'),
      exportAvailability: str(m['exportAvailability'], 2000, 'exportAvailability'),
      images: list(m['images'], 20, 'images', (i) => urlField(i, 'image') || null),
      seoTitle: str(m['seoTitle'], 200, 'seoTitle'),
      seoDescription: str(m['seoDescription'], 400, 'seoDescription'),
      sort: int(m['sort'], 'sort'),
      published: bool(m['published']),
    };
  },
  toParams: (o) => [
    o['slug'], o['categoryId'], o['name'], o['shortDesc'], o['description'], o['origin'], o['availability'],
    JSON.stringify(o['specs']), JSON.stringify(o['sizes']), JSON.stringify(o['grades']), JSON.stringify(o['packaging']),
    o['moq'], o['supplyCapacity'], JSON.stringify(o['qualityStandards']), o['exportAvailability'],
    JSON.stringify(o['images']), o['seoTitle'], o['seoDescription'], o['sort'], o['published'] ? 1 : 0,
  ],
};

/* ---------------- certifications ---------------- */
const CERT = ['obtained', 'applied', 'pending', 'to_confirm', 'on_shipment'] as const;

export const certifications: EntityConfig = {
  table: 'certifications',
  cols: ['key', 'name', 'status', 'note', 'sort', 'published'],
  order: 'sort, id',
  publishedCol: 'published',
  uniqueMessage: 'A certification with this key already exists.',
  defaults: () => ({ key: '', name: '', status: 'pending', note: '', sort: 0, published: true }),
  fromRow: (r) => ({ id: r['id'], key: r['key'], name: r['name'], status: r['status'], note: r['note'], sort: r['sort'], published: b(r['published']) }),
  validate: (m) => {
    const name = str(m['name'], 160, 'name', true);
    return {
      key: slugField(m['key'], name, 'key'),
      name,
      status: oneOf(m['status'], CERT, 'status', 'pending'),
      note: str(m['note'], 1000, 'note'),
      sort: int(m['sort'], 'sort'),
      published: bool(m['published']),
    };
  },
  toParams: (o) => [o['key'], o['name'], o['status'], o['note'], o['sort'], o['published'] ? 1 : 0],
};

/* ---------------- posts ---------------- */
export const posts: EntityConfig = {
  table: 'posts',
  cols: ['slug', 'title', 'excerpt', 'body', 'cover_url', 'published', 'published_at'],
  order: 'published_at DESC, id DESC',
  publishedCol: 'published',
  slugCol: 'slug',
  uniqueMessage: 'A post with this slug already exists. Please change the title or slug.',
  defaults: () => ({ slug: '', title: '', excerpt: '', body: '', coverUrl: '', published: true, publishedAt: new Date().toISOString().slice(0, 10) }),
  fromRow: (r) => ({
    id: r['id'], slug: r['slug'], title: r['title'], excerpt: r['excerpt'], body: r['body'], coverUrl: r['cover_url'],
    published: b(r['published']), publishedAt: r['published_at'],
  }),
  validate: (m) => {
    const title = str(m['title'], 200, 'title', true);
    const publishedAt = str(m['publishedAt'], 10, 'publishedAt') || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) throw new HttpError(400, 'publishedAt must be a date (YYYY-MM-DD)');
    return {
      slug: slugField(m['slug'], title),
      title,
      excerpt: str(m['excerpt'], 500, 'excerpt'),
      body: str(m['body'], 50000, 'body'),
      coverUrl: urlField(m['coverUrl'], 'coverUrl'),
      published: bool(m['published']),
      publishedAt,
    };
  },
  toParams: (o) => [o['slug'], o['title'], o['excerpt'], o['body'], o['coverUrl'], o['published'] ? 1 : 0, o['publishedAt']],
};

/* ---------------- testimonials ---------------- */
export const testimonials: EntityConfig = {
  table: 'testimonials',
  cols: ['name', 'company', 'country', 'text', 'published', 'sort'],
  order: 'sort, id',
  publishedCol: 'published',
  uniqueMessage: 'Duplicate testimonial.',
  defaults: () => ({ name: '', company: '', country: '', text: '', published: true, sort: 0 }),
  fromRow: (r) => ({ id: r['id'], name: r['name'], company: r['company'], country: r['country'], text: r['text'], published: b(r['published']), sort: r['sort'] }),
  validate: (m) => ({
    name: str(m['name'], 120, 'name', true),
    company: str(m['company'], 160, 'company'),
    country: str(m['country'], 100, 'country'),
    text: str(m['text'], 2000, 'text', true),
    published: bool(m['published']),
    sort: int(m['sort'], 'sort'),
  }),
  toParams: (o) => [o['name'], o['company'], o['country'], o['text'], o['published'] ? 1 : 0, o['sort']],
};

/* ---------------- inquiries (read mapper only) ---------------- */
export function inquiryFromRow(r: Row): Json {
  return {
    id: r['id'], productSlug: r['product_slug'], productName: r['product_name'], name: r['name'], company: r['company'],
    country: r['country'], email: r['email'], whatsapp: r['whatsapp'], quantity: r['quantity'], message: r['message'],
    status: r['status'], notes: r['notes'], createdAt: r['created_at'],
  };
}

/* ---------------- site settings ---------------- */
export function sanitizeSettings(existing: Json, body: Json): Json {
  const m = { ...existing, ...body };
  const social = { ...(existing['social'] ?? {}), ...obj(body['social'], 'social') } as Json;
  const websiteUrl = str(m['siteUrl'], 200, 'siteUrl');
  if (websiteUrl && !/^https?:\/\/[^\s]+$/.test(websiteUrl)) throw new HttpError(400, 'siteUrl must start with http:// or https://');
  const gaId = str(m['gaMeasurementId'], 40, 'gaMeasurementId');
  if (gaId && !/^[A-Za-z0-9-]+$/.test(gaId)) throw new HttpError(400, 'gaMeasurementId looks invalid (e.g. G-XXXXXXXXXX)');
  const logoUrl = urlField(m['logoUrl'], 'logoUrl');
  const socialUrl = (k: string) => {
    const s = str(social[k], 300, `social.${k}`);
    if (s && !/^https?:\/\/[^\s]+$/.test(s)) throw new HttpError(400, `social.${k} must be a full link starting with https://`);
    return s;
  };
  return {
    companyName: str(m['companyName'], 120, 'companyName', true),
    proprietor: str(m['proprietor'], 120, 'proprietor'),
    tagline: str(m['tagline'], 200, 'tagline'),
    established: int(m['established'], 'established', 2024),
    businessType: str(m['businessType'], 200, 'businessType'),
    businessNature: str(m['businessNature'], 300, 'businessNature'),
    aboutText: str(m['aboutText'], 8000, 'aboutText'),
    warehouse: str(m['warehouse'], 300, 'warehouse'),
    address: str(m['address'], 400, 'address'),
    phone: str(m['phone'], 40, 'phone'),
    whatsapp: str(m['whatsapp'], 20, 'whatsapp').replace(/\D/g, ''),
    email: str(m['email'], 200, 'email'),
    hours: str(m['hours'], 120, 'hours'),
    mapQuery: str(m['mapQuery'], 300, 'mapQuery'),
    siteUrl: websiteUrl.replace(/\/+$/, ''),
    logoUrl,
    social: { facebook: socialUrl('facebook'), instagram: socialUrl('instagram'), linkedin: socialUrl('linkedin'), youtube: socialUrl('youtube'), x: socialUrl('x') },
    markets: list(m['markets'], 40, 'markets', (i) => {
      const o = obj(i, 'markets');
      const country = str(o['country'], 100, 'market country');
      if (!country) return null;
      return { country, region: str(o['region'], 100, 'market region'), note: str(o['note'], 400, 'market note') };
    }),
    gaMeasurementId: gaId,
    searchConsoleToken: str(m['searchConsoleToken'], 200, 'searchConsoleToken'),
  };
}

export { slugify };
