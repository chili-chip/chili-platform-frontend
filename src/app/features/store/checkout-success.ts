import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { SpinnerComponent } from '../../shared/loading';
import { apiErrorMessage } from './store-utils';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-checkout-success',
  imports: [RouterLink, SpinnerComponent],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout.scss',
})
export class CheckoutSuccessComponent {
  private readonly toast = inject(ToastService);
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
      this.error.set('This payment link is incomplete. Return to the store and try again.');
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
        this.toast.success('Payment confirmed. Thank you for your order!');
        void this.router.navigate(['/store/orders', order.id], {
          replaceUrl: true,
          queryParams: { paid: '1' },
        });
      },
      error: (err) => {
        this.loading.set(false);
        const message = apiErrorMessage(err, 'We could not confirm this payment.');
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }
}
