import { Component, ViewEncapsulation, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { UiService } from './admin-ui';

/** Root of the /admin area: global styles, toasts and the confirm dialog. */
@Component({
  selector: 'adm-root',
  imports: [RouterOutlet],
  encapsulation: ViewEncapsulation.None,
  styleUrl: './admin.css',
  host: { class: 'adm' },
  template: `
    <router-outlet />

    <div class="toasts" aria-live="polite">
      @for (t of ui.toasts(); track t.id) {
        <div class="toast" [class.err]="t.kind === 'err'" (click)="ui.dismiss(t.id)" role="status">{{ t.message }}</div>
      }
    </div>

    @if (ui.dialog(); as d) {
      <div class="modal-back" (click)="ui.answer(false)">
        <div class="modal" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
          <h2>{{ d.title }}</h2>
          <p>{{ d.message }}</p>
          <div class="modal-actions">
            <button type="button" class="btn ghost" (click)="ui.answer(false)">Cancel</button>
            <button type="button" class="btn" [class.danger]="d.danger" [class.primary]="!d.danger" (click)="ui.answer(true)">
              {{ d.okText || 'OK' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminRoot {
  ui = inject(UiService);
  constructor() {
    inject(Title).setTitle('Admin – Saumya Enterprises');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
