import { Component, inject, input, model, signal } from '@angular/core';
import { AdminApi } from './admin-api.service';
import { UiService } from './admin-ui';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/** Photo manager: upload, reorder and remove images. Two-way bound list of URLs. */
@Component({
  selector: 'adm-images',
  template: `
    <div class="imgs">
      @for (u of images(); track u; let i = $index) {
        <div class="img-tile">
          <img [src]="u" alt="Photo {{ i + 1 }}" loading="lazy" />
          @if (multiple() && i === 0) {
            <span class="img-main">Main photo</span>
          }
          <div class="img-actions">
            @if (multiple()) {
              <button type="button" (click)="move(i, -1)" [disabled]="i === 0" aria-label="Move earlier" title="Move earlier">‹</button>
              <button type="button" (click)="move(i, 1)" [disabled]="i === images().length - 1" aria-label="Move later" title="Move later">›</button>
            }
            <button type="button" class="danger" (click)="remove(i)" aria-label="Remove photo" title="Remove photo">✕</button>
          </div>
        </div>
      }
      @if (multiple() || images().length === 0) {
        <label class="img-add" [class.busy]="busy()">
          <input type="file" accept="image/jpeg,image/png,image/webp" [multiple]="multiple()" (change)="pick($event)" [disabled]="busy()" />
          <span>{{ busy() ? 'Uploading…' : multiple() ? '+ Add photos' : '+ Add photo' }}</span>
        </label>
      }
    </div>
    <p class="help">JPG, PNG or WebP, up to 5 MB each.@if (multiple()) { The first photo is the main photo shown on cards. }</p>
  `,
})
export class ImageUploader {
  images = model<string[]>([]);
  multiple = input(true);

  private api = inject(AdminApi);
  private ui = inject(UiService);
  busy = signal(false);

  async pick(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const files = Array.from(el.files ?? []);
    el.value = '';
    if (!files.length) return;
    this.busy.set(true);
    try {
      for (const f of files) {
        if (!ALLOWED.includes(f.type)) {
          this.ui.err(`"${f.name}" is not a JPG, PNG or WebP image.`);
          continue;
        }
        if (f.size > MAX_BYTES) {
          this.ui.err(`"${f.name}" is larger than 5 MB.`);
          continue;
        }
        try {
          const url = await this.api.upload(f);
          this.images.set(this.multiple() ? [...this.images(), url] : [url]);
        } catch (e) {
          this.ui.err(`Could not upload "${f.name}": ${(e as Error).message}`);
        }
      }
    } finally {
      this.busy.set(false);
    }
  }

  move(i: number, d: number) {
    const a = [...this.images()];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    this.images.set(a);
  }

  remove(i: number) {
    this.images.set(this.images().filter((_, k) => k !== i));
  }
}
