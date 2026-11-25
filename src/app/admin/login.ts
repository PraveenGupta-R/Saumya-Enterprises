import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminApi } from './admin-api.service';

@Component({
  selector: 'adm-login',
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand dark"><img class="brand-logo" src="/assets/logo/logo-dark-bold.png" alt="" width="34" height="44" /><span>Saumya Enterprises</span></div>
        <h1>Owner login</h1>
        <p class="muted">Sign in to manage your website, products and buyer inquiries.</p>

        <form (ngSubmit)="go()">
          <label class="field">
            <span>Email address</span>
            <input name="email" type="email" autocomplete="username" [(ngModel)]="email" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input name="password" type="password" autocomplete="current-password" [(ngModel)]="password" required />
          </label>
          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }
          <button type="submit" class="btn primary block" [disabled]="busy() || !email || !password">
            {{ busy() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <p class="help center"><a href="/">← Back to website</a></p>
      </div>
    </div>
  `,
})
export class LoginPage {
  private api = inject(AdminApi);
  private router = inject(Router);
  email = '';
  password = '';
  busy = signal(false);
  error = signal('');

  constructor() {
    // Already signed in? Go straight to the dashboard.
    this.api
      .get('/api/admin/me', true)
      .then(() => this.router.navigate(['/admin']))
      .catch(() => undefined);
  }

  async go() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.post('/api/admin/login', { email: this.email.trim(), password: this.password }, true);
      await this.router.navigate(['/admin']);
    } catch (e) {
      this.error.set((e as Error).message || 'Login failed.');
    } finally {
      this.busy.set(false);
    }
  }
}
