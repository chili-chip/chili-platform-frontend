import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DOCS_URL } from '../../core/socials';
import { CartPopupComponent } from '../cart-popup/cart-popup';
import { ToastService } from '../../core/services/toast.service';
import { UiButton } from '../ui/button';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, CartPopupComponent, UiButton],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeaderComponent {
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);
  readonly siteUrl = DOCS_URL;

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  signOut(): void {
    this.closeMenu();
    this.auth.logout();
    this.toast.success('Signed out.');
  }
}
