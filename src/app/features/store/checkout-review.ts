import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { StoreDeliveryOption } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import {
  apiErrorMessage,
  deliveryFee,
  deliveryWhere,
  productBlurb,
  productCover,
  unwrapList,
} from './store-utils';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-checkout-review',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './checkout-review.html',
  styleUrl: './checkout-review.scss',
})
export class CheckoutReviewComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  readonly paying = signal(false);
  readonly error = signal('');
  readonly blurb = productBlurb;
  readonly cover = productCover;
  readonly where = deliveryWhere;

  readonly deliveryOptions = signal<StoreDeliveryOption[]>([]);
  readonly deliveryLoading = signal(true);
  readonly deliverySlug = signal('');

  readonly delivery = computed(() =>
    this.deliveryOptions().find((option) => option.slug === this.deliverySlug()),
  );

  /** Fee in cents for the chosen option; null while nothing is chosen. */
  readonly deliveryCents = computed(() => {
    const option = this.delivery();
    if (option) {
      return deliveryFee(option, this.cart.totalCents());
    }
    return this.deliveryOptions().length ? null : 0;
  });

  fee(option: StoreDeliveryOption): number {
    return deliveryFee(option, this.cart.totalCents());
  }

  readonly totalCents = computed(() => this.cart.totalCents() + (this.deliveryCents() ?? 0));

  ngOnInit(): void {
    this.api.listDeliveryOptions().subscribe({
      next: (rows) => {
        this.deliveryOptions.set(rows);
        if (rows.length) {
          this.deliverySlug.set(rows[0].slug);
        }
        this.deliveryLoading.set(false);
      },
      error: () => {
        this.deliveryOptions.set([]);
        this.deliveryLoading.set(false);
      },
    });
    this.api.listProducts().subscribe({
      next: (payload) => this.cart.reconcile(unwrapList(payload)),
      error: () => undefined,
    });
  }

  pay(): void {
    if (!this.cart.count() || this.paying()) {
      return;
    }
    if (this.deliveryOptions().length && !this.delivery()) {
      this.error.set('Choose a delivery option.');
      return;
    }
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { next: '/store/checkout' } });
      return;
    }
    this.paying.set(true);
    this.error.set('');
    this.api.createCheckout(this.cart.checkoutPayload(), this.delivery()?.slug).subscribe({
      next: (session) => {
        window.location.assign(session.checkout_url);
      },
      error: (err) => {
        this.paying.set(false);
        const message = apiErrorMessage(err, 'Checkout failed. Try again in a moment.');
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }
}
