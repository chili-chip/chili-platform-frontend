import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private readonly http = inject(HttpClient);

  /** Emails a confirmation link. The reply is the same whether or not the address is subscribed. */
  subscribe(email: string) {
    return this.http.post<{ detail: string }>(`${environment.apiUrl}/newsletter/subscribe/`, {
      email,
    });
  }

  confirm(token: string) {
    return this.http.post<{ detail: string }>(`${environment.apiUrl}/newsletter/confirm/`, {
      token,
    });
  }

  unsubscribe(token: string) {
    return this.http.post<{ detail: string }>(`${environment.apiUrl}/newsletter/unsubscribe/`, {
      token,
    });
  }
}
