import { Component, computed, input } from '@angular/core';

const PATHS: Record<string, string> = {
  quality: 'M12 3l7 3v5c0 5-3 8.500-7 10-4-1.500-7-5-7-10V6l7-3zM8.500 12l2.500 2.500L15.500 10',
  price: 'M3 12V4h8l10 10-8 8L3 12zM7.500 8.500h.01',
  ship: 'M3 17l2 3h14l2-3-9-3-9 3zM12 14V6m0 0l4 3h-4M7 14l1-5h8l1 5',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
  chain: 'M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1',
  support: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1v-4zM20 14h-3v5h2a1 1 0 0 0 1-1v-4zM17 19c0 1.500-2 2-5 2',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  doc: 'M7 3h7l5 5v13H7V3zM14 3v5h5M10 13h6M10 17h6',
  truck: 'M2 6h11v10H2V6zM13 10h4l3 3v3h-7M6.500 19a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3zM16.500 19a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3z',
  warehouse: 'M3 10l9-6 9 6v10H3V10zM8 20v-6h8v6M8 17h8',
  leaf: 'M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19c3-5 6-8 10-10',
  check: 'M5 12.500l4.500 4.500L19 7.500',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  pin: 'M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21zM12 12a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z',
  phone: 'M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z',
  mail: 'M3 6h18v12H3V6zM3 7l9 7 9-7',
  handshake: 'M2 12l4-4 4 1 3-2 4 2 5 3-3 3-3-1-3 3-4-1-3 2-4-3zM6 8l-2 2',
  star: 'M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9L12 3z',
  lock: 'M6 11h12v10H6V11zM8 11V8a4 4 0 0 1 8 0v3M12 15v2',
  label: 'M4 4h8l8 8-8 8-8-8V4zM8 8h.01',
  scale: 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z',
  sprout: 'M12 21v-9M12 12C12 8 9 6 5 6c0 4 3 6 7 6zM12 14c0-3 2-5 6-5 0 3-2 5-6 5z',
};

@Component({
  selector: 'app-icon',
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" [style.width.px]="size()" [style.height.px]="size()"><path [attr.d]="d()" /></svg>`,
  styles: [':host { display: inline-flex; } svg { display: block; }'],
})
export class IconComponent {
  name = input.required<string>();
  size = input(26);
  d = computed(() => PATHS[this.name()] ?? PATHS['check']);
}
