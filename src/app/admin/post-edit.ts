import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApi } from './admin-api.service';
import { ImageUploader } from './admin-images';
import { DirtyAware, UiService, slugify } from './admin-ui';
import { Post } from '../core/models';

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): Post => ({
  id: 0,
  slug: '',
  title: '',
  excerpt: '',
  body: '',
  coverUrl: '',
  published: false,
  publishedAt: today(),
});

@Component({
  selector: 'adm-post-edit',
  imports: [FormsModule, RouterLink, ImageUploader],
  template: `
    <div class="page-head">
      <div>
        <a routerLink="/admin/posts" class="back">← All posts</a>
        <h1>{{ m.id ? 'Edit post' : 'Write a post' }}</h1>
      </div>
      <button type="button" class="btn primary" (click)="save()" [disabled]="saving() || loading()">{{ saving() ? 'Saving…' : 'Save post' }}</button>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else {
      <div class="card">
        <label class="field">
          <span>Title *</span>
          <input type="text" [ngModel]="m.title" (ngModelChange)="onTitle($event)" name="title" />
        </label>
        <div class="grid2">
          <label class="field">
            <span>Page address (URL)</span>
            <input type="text" [ngModel]="m.slug" (ngModelChange)="onSlug($event)" name="slug" />
            <small class="help">Appears as /blog/{{ m.slug || 'post-title' }}</small>
          </label>
          <label class="field">
            <span>Publish date</span>
            <input type="date" [(ngModel)]="m.publishedAt" name="date" />
          </label>
        </div>
        <label class="field">
          <span>Short summary</span>
          <textarea rows="2" [(ngModel)]="m.excerpt" name="excerpt"></textarea>
          <small class="help">Shown in the blog list and on Google.</small>
        </label>
        <label class="check">
          <input type="checkbox" [(ngModel)]="m.published" name="published" />
          <span>Publish on website (untick to keep it as a draft)</span>
        </label>
      </div>

      <div class="card">
        <h2>Cover photo</h2>
        <adm-images [images]="m.coverUrl ? [m.coverUrl] : []" (imagesChange)="m.coverUrl = $event[0] || ''" [multiple]="false" />
      </div>

      <div class="card">
        <h2>Article</h2>
        <label class="field">
          <span>Text</span>
          <textarea rows="18" [(ngModel)]="m.body" name="body" class="mono"></textarea>
          <small class="help">
            Leave a blank line between paragraphs. Start a line with <code>## </code> for a heading and with <code>- </code> for a bullet point.
          </small>
        </label>
      </div>

      <div class="savebar">
        <a routerLink="/admin/posts" class="btn ghost">Cancel</a>
        <button type="button" class="btn primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save post' }}</button>
      </div>
    }
  `,
})
export class PostEditPage implements DirtyAware {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  m: Post = blank();
  loading = signal(true);
  saving = signal(false);
  private snap = '';
  private slugTouched = false;

  constructor() {
    this.load();
  }

  private async load() {
    const id = this.route.snapshot.paramMap.get('id');
    try {
      if (id) {
        const p = await this.api.one<Post>('posts', id);
        this.m = { ...blank(), ...p };
        this.slugTouched = true;
      }
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.snap = JSON.stringify(this.m);
      this.loading.set(false);
    }
  }

  isDirty() {
    return !this.loading() && JSON.stringify(this.m) !== this.snap;
  }
  @HostListener('window:beforeunload', ['$event'])
  unload(e: BeforeUnloadEvent) {
    if (this.isDirty()) e.preventDefault();
  }

  onTitle(v: string) {
    this.m.title = v;
    if (!this.slugTouched) this.m.slug = slugify(v);
  }
  onSlug(v: string) {
    this.slugTouched = true;
    this.m.slug = slugify(v);
  }

  async save() {
    if (!this.m.title.trim()) return this.ui.err('Please enter a title.');
    if (!this.m.slug) this.m.slug = slugify(this.m.title);
    if (!this.m.publishedAt) this.m.publishedAt = today();
    this.saving.set(true);
    try {
      if (this.m.id) await this.api.update('posts', this.m.id, this.m);
      else await this.api.create('posts', this.m);
      this.snap = JSON.stringify(this.m);
      this.ui.ok('Post saved.');
      await this.router.navigate(['/admin/posts']);
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.saving.set(false);
    }
    return;
  }
}
