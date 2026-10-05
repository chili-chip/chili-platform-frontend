import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { apiErrorMessage, productBlurb, productCover, unwrapList } from './store-utils';

@Component({
  selector: 'app-checkout-review',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './checkout-review.html',
  styleUrl: './checkout-review.scss',
})
export class CheckoutReviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  readonly paying = signal(false);
  readonly error = signal('');
  readonly blurb = productBlurb;
  readonly cover = productCover;

  ngOnInit(): void {
    this.api.listProducts().subscribe({
      next: (payload) => this.cart.reconcile(unwrapList(payload)),
      error: () => undefined,
    });
  }

  pay(): void {
    if (!this.cart.count() || this.paying()) {
      return;
    }
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { next: '/store/checkout' } });
      return;
    }
    this.paying.set(true);
    this.error.set('');
    this.api.createCheckout(this.cart.checkoutPayload()).subscribe({
      next: (session) => {
        window.location.assign(session.checkout_url);
      },
      error: (err) => {
        this.paying.set(false);
        this.error.set(apiErrorMessage(err, 'Checkout failed. Try again in a moment.'));
      },
    });
  }
}
