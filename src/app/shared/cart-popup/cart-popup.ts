import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay } from '@angular/cdk/overlay';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { UiButton } from '../ui/button';
import { UiQuantity } from '../ui/quantity';

@Component({
  selector: 'app-cart-popup',
  imports: [CdkConnectedOverlay, CdkTrapFocus, CurrencyPipe, RouterLink, UiButton, UiQuantity],
  templateUrl: './cart-popup.html',
  styleUrl: './cart-popup.scss',
})
export class CartPopupComponent {
  readonly cart = inject(CartService);
  private readonly router = inject(Router);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.cart.hide();
      }
    });
  }

  /** Below the cart button, right-aligned; flips to left-aligned when there is no room. */
  readonly positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 11 },
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 11 },
  ];

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cart.hide();
    }
  }

  review(): void {
    if (!this.cart.count()) {
      return;
    }
    this.cart.hide();
    void this.router.navigate(['/store/checkout']);
  }
}
