import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { AdminApi } from './admin-api.service';
import { Availability, CertStatus, InquiryStatus } from '../core/models';

export interface Toast {
  id: number;
  message: string;
  kind: 'ok' | 'err';
}
export interface ConfirmOptions {
  title: string;
  message: string;
  okText?: string;
  danger?: boolean;
}
interface ConfirmState extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

/** Toasts + confirmation dialog shared by all admin pages. */
@Injectable({ providedIn: 'root' })
export class UiService {
  toasts = signal<Toast[]>([]);
  dialog = signal<ConfirmState | null>(null);
  private n = 0;

  ok(message: string) {
    this.push(message, 'ok');
  }
  err(message: string) {
    this.push(message, 'err');
  }
  dismiss(id: number) {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
  confirm(opts: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => this.dialog.set({ ...opts, resolve }));
  }
  answer(v: boolean) {
    const d = this.dialog();
    this.dialog.set(null);
    d?.resolve(v);
  }
  private push(message: string, kind: 'ok' | 'err') {
    const id = ++this.n;
    this.toasts.update((t) => [...t, { id, message, kind }]);
    setTimeout(() => this.dismiss(id), kind === 'err' ? 6500 : 3500);
  }
}

export const adminGuard: CanActivateFn = async () => {
  if (isPlatformServer(inject(PLATFORM_ID))) return true;
  const api = inject(AdminApi);
  const router = inject(Router);
  try {
    await api.get('/api/admin/me', true);
    return true;
  } catch {
    return router.createUrlTree(['/admin/login']);
  }
};

export interface DirtyAware {
  isDirty(): boolean;
}
export const leaveGuard: CanDeactivateFn<DirtyAware> = (c) =>
  !c.isDirty() ||
  inject(UiService).confirm({
    title: 'Leave without saving?',
    message: 'You have changes that are not saved yet. If you leave now they will be lost.',
    okText: 'Leave page',
    danger: true,
  });

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function fmtDate(s: string): string {
  if (!s) return '';
  let t = s.includes('T') ? s : s.replace(' ', 'T');
  if (t.length > 10 && !/(Z|[+-]\d\d:?\d\d)$/i.test(t)) t += 'Z';
  const d = new Date(t);
  if (isNaN(d.getTime())) return s;
  const opts: Intl.DateTimeFormatOptions =
    t.length <= 10
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' };
  return d.toLocaleString('en-IN', opts);
}

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: 'Available now',
  coming_soon: 'Coming soon',
  unavailable: 'Not available',
};
export const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: 'available', label: AVAILABILITY_LABELS.available },
  { value: 'coming_soon', label: AVAILABILITY_LABELS.coming_soon },
  { value: 'unavailable', label: AVAILABILITY_LABELS.unavailable },
];

export const CERT_LABELS: Record<CertStatus, string> = {
  obtained: 'Obtained',
  applied: 'Applied (waiting)',
  pending: 'Pending / to be obtained',
  to_confirm: 'To be confirmed',
  on_shipment: 'Arranged at shipment',
};
export const CERT_OPTIONS: { value: CertStatus; label: string }[] = (Object.keys(CERT_LABELS) as CertStatus[]).map(
  (value) => ({ value, label: CERT_LABELS[value] }),
);

export const INQUIRY_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quote sent',
  won: 'Order won',
  closed: 'Closed',
};
export const INQUIRY_OPTIONS: { value: InquiryStatus; label: string }[] = (
  Object.keys(INQUIRY_LABELS) as InquiryStatus[]
).map((value) => ({ value, label: INQUIRY_LABELS[value] }));
