import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from './admin-api.service';
import { UiService, fmtDate } from './admin-ui';
import { Post } from '../core/models';

@Component({
  selector: 'adm-posts-list',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Blog &amp; News</h1>
        <p class="muted">Articles about exports, products and the market help buyers find you on Google.</p>
      </div>
      <a class="btn primary" routerLink="/admin/posts/new">+ Write a post</a>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (items().length === 0) {
      <div class="card"><p class="empty">No posts yet.</p></div>
    } @else {
      <div class="card flush">
        <ul class="list">
          @for (p of items(); track p.id) {
            <li class="prod-row">
              <div class="grow">
                <a [routerLink]="['/admin/posts', p.id]"><strong>{{ p.title }}</strong></a>
                <div class="muted tiny">{{ date(p.publishedAt) }} · /blog/{{ p.slug }}</div>
                <span class="badge" [class]="p.published ? 'av-available' : 'av-unavailable'">{{ p.published ? 'Published' : 'Draft' }}</span>
              </div>
              <div class="row-actions">
                <a class="btn sm" [routerLink]="['/admin/posts', p.id]">Edit</a>
                <button type="button" class="btn sm danger ghost" (click)="remove(p)">Delete</button>
              </div>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class PostsListPage {
  private api = inject(AdminApi);
  private ui = inject(UiService);
  items = signal<Post[]>([]);
  loading = signal(true);
  date = fmtDate;

  constructor() {
    this.load();
  }

  private async load() {
    try {
      const l = await this.api.list<Post>('posts');
      this.items.set([...l].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '')));
    } catch (e) {
      this.ui.err((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async remove(p: Post) {
    const yes = await this.ui.confirm({
      title: `Delete “${p.title}”?`,
      message: 'This post will be removed from the website. This cannot be undone.',
      okText: 'Delete post',
      danger: true,
    });
    if (!yes) return;
    try {
      await this.api.remove('posts', p.id);
      this.items.update((l) => l.filter((x) => x.id !== p.id));
      this.ui.ok('Post deleted.');
    } catch (e) {
      this.ui.err((e as Error).message);
    }
  }
}
