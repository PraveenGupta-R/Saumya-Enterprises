import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from './admin-api.service';
import { UiService } from './admin-ui';

@Component({
  selector: 'adm-password',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Change password</h1>
        <p class="muted">Choose a strong password that you do not use anywhere else.</p>
      </div>
    </div>
    <div class="card narrow">
      <form (ngSubmit)="go()">
        <label class="field">
          <span>Current password</span>
          <input type="password" name="cur" autocomplete="current-password" [(ngModel)]="current" />
        </label>
        <label class="field">
          <span>New password</span>
          <input type="password" name="new" autocomplete="new-password" [(ngModel)]="next" />
          <small class="help">At least 10 characters. A mix of letters, numbers and symbols is best.</small>
        </label>
        <label class="field">
          <span>Repeat new password</span>
          <input type="password" name="rep" autocomplete="new-password" [(ngModel)]="repeat" />
        </label>
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
        <button type="submit" class="btn primary" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Change password' }}</button>
      </form>
    </div>
  `,
})
export class PasswordPage {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  current = '';
  next = '';
  repeat = '';
  busy = signal(false);
  error = signal('');

  async go() {
    this.error.set('');
    if (!this.current) return this.error.set('Please enter your current password.');
    if (this.next.length < 10) return this.error.set('The new password must be at least 10 characters.');
    if (this.next !== this.repeat) return this.error.set('The two new passwords do not match.');
    this.busy.set(true);
    try {
      await this.api.post('/api/admin/password', { current: this.current, next: this.next });
      this.current = this.next = this.repeat = '';
      this.ui.ok('Password changed.');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
    return;
  }
}
