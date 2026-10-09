import type { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, effect, inject, Injector } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from './core/services/auth.service';
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
    ToastHostComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private legalPrompt: Promise<DialogRef<unknown, unknown>> | null = null;

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

  constructor() {
    // The legal prompt blocks the site until accepted, so it cannot be dismissed.
    // Loaded on demand: most visits never need it.
    effect(() => {
      if (this.needsLegalAcceptance()) {
        this.legalPrompt ??= this.openLegalPrompt();
      } else if (this.legalPrompt) {
        void this.legalPrompt.then((ref) => ref.close());
        this.legalPrompt = null;
      }
    });
  }

  private async openLegalPrompt(): Promise<DialogRef<unknown, unknown>> {
    const [{ UiDialogService }, { LegalPromptComponent }] = await Promise.all([
      import('./shared/ui/dialog'),
      import('./features/legal/legal-prompt'),
    ]);
    return this.injector.get(UiDialogService).open<unknown, unknown, unknown>(LegalPromptComponent, {
      disableClose: true,
      autoFocus: 'dialog',
      width: '32rem',
    });
  }
}
