import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { apiErrorMessage } from './store-utils';

@Component({
  selector: 'app-checkout-success',
  imports: [RouterLink],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout.scss',
})
export class CheckoutSuccessComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private started = false;

  readonly session_id = input('');
  readonly error = signal('');
  readonly loading = signal(true);

  constructor() {
    effect(() => {
      if (!this.auth.bootstrapped() || this.started) {
        return;
      }
      this.started = true;
      untracked(() => this.completeCheckout());
    });
  }

  private completeCheckout(): void {
    const sessionId =
      this.session_id() || this.route.snapshot.queryParamMap.get('session_id') || '';
    if (!sessionId) {
      this.loading.set(false);
      this.error.set('Missing Checkout session. Return to the store and try again.');
      return;
    }
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { next: `/store/checkout/success?session_id=${sessionId}` },
      });
      return;
    }
    this.api.confirmCheckout(sessionId).subscribe({
      next: (order) => {
        this.cart.clear();
        void this.router.navigate(['/store/orders', order.id], {
          replaceUrl: true,
          queryParams: { paid: '1' },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'Could not confirm this payment.'));
      },
    });
  }
}
