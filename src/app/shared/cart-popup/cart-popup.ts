import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart-popup',
  imports: [CurrencyPipe, RouterLink],
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cart.hide();
  }

  review(): void {
    if (!this.cart.count()) {
      return;
    }
    this.cart.hide();
    void this.router.navigate(['/store/checkout']);
  }
}
