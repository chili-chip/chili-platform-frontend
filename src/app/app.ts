import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { LegalPromptComponent } from './features/legal/legal-prompt';
import { RouteProgressComponent } from './shared/loading';
import { SiteFooterComponent } from './shared/site-footer/site-footer';
import { SiteHeaderComponent } from './shared/site-header/site-header';
import { ToastHostComponent } from './shared/toast/toast-host';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouteProgressComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
    LegalPromptComponent,
    ToastHostComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly isCreator = computed(() => this.url().startsWith('/creator'));

  readonly needsLegalAcceptance = computed(() => {
    const path = this.url().split('?')[0];
    if (path === '/terms' || path === '/privacy' || path === '/seller-terms') {
      return false;
    }
    if (!this.auth.bootstrapped() || !this.auth.isAuthenticated()) {
      return false;
    }
    const user = this.auth.currentUser();
    if (!user) {
      return false;
    }
    return !user.terms_accepted_at || !user.privacy_accepted_at;
  });
}
