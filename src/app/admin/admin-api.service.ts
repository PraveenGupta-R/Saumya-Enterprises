import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export type Resource = 'products' | 'categories' | 'certifications' | 'posts' | 'testimonials' | 'inquiries';

/** Thin wrapper around HttpClient for the admin API. All calls are same-origin with cookies. */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly headers = new HttpHeaders({ 'X-Requested-With': 'XMLHttpRequest' });
  private get opts() {
    return { headers: this.headers, withCredentials: true };
  }

  get<T>(url: string, quiet = false): Promise<T> {
    return this.run(this.http.get<T>(url, this.opts), quiet);
  }
  post<T>(url: string, body: unknown, quiet = false): Promise<T> {
    return this.run(this.http.post<T>(url, body, this.opts), quiet);
  }
  put<T>(url: string, body: unknown): Promise<T> {
    return this.run(this.http.put<T>(url, body, this.opts), false);
  }
  delete<T = unknown>(url: string): Promise<T> {
    return this.run(this.http.delete<T>(url, this.opts), false);
  }

  list<T>(res: Resource): Promise<T[]> {
    return this.get<T[]>(`/api/admin/${res}`);
  }
  one<T>(res: Resource, id: number | string): Promise<T> {
    return this.get<T>(`/api/admin/${res}/${id}`);
  }
  create<T>(res: Resource, body: unknown): Promise<T> {
    return this.post<T>(`/api/admin/${res}`, body);
  }
  update<T>(res: Resource, id: number, body: unknown): Promise<T> {
    return this.put<T>(`/api/admin/${res}/${id}`, body);
  }
  remove(res: Resource, id: number): Promise<unknown> {
    return this.delete(`/api/admin/${res}/${id}`);
  }

  /** Upload one image; returns its public URL (e.g. /api/media/abc.jpg). */
  async upload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const r = await this.run(this.http.post<{ url: string }>('/api/admin/media', fd, this.opts), false);
    return r.url;
  }

  private async run<T>(obs: Observable<T>, quiet: boolean): Promise<T> {
    try {
      return await firstValueFrom(obs);
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      if (status === 401 && !quiet) {
        this.router.navigate(['/admin/login']);
      }
      throw new ApiError(this.message(e, status), status);
    }
  }

  private message(e: unknown, status: number): string {
    if (e instanceof HttpErrorResponse) {
      const body = e.error as unknown;
      if (body && typeof body === 'object' && 'error' in body) {
        const m = (body as { error: unknown }).error;
        if (typeof m === 'string' && m) return m;
      }
      if (status === 0) return 'Cannot reach the server. Please check your internet connection.';
      if (status === 401) return 'Please log in again.';
      if (status === 413) return 'That file is too large.';
      if (status >= 500) return 'Something went wrong on the server. Please try again.';
      return `Request failed (${status}).`;
    }
    return e instanceof Error ? e.message : 'Unexpected error.';
  }
}
