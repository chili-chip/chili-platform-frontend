import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CartPopupComponent } from '../cart-popup/cart-popup';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, CartPopupComponent],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeaderComponent {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
