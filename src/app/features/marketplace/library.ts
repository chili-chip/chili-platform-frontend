import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-library-redirect',
  template: `<p class="note">Opening your library…</p>`,
  styles: `
    .note {
      padding: 3rem 6vw;
      color: var(--muted);
    }
  `,
})
export class LibraryRedirectComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private sent = false;

  constructor() {
    effect(() => {
      if (!this.auth.bootstrapped() || this.sent) {
        return;
      }
      const name = this.auth.currentUser()?.username;
      if (!name) {
        return;
      }
      this.sent = true;
      void this.router.navigate(['/profile', name], {
        queryParams: { tab: 'library', shelf: 'bought' },
        replaceUrl: true,
      });
    });
  }
}
