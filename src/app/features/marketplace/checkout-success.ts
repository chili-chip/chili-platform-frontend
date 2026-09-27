import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MarketplacePurchase } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { marketError } from './market-utils';

@Component({
  selector: 'app-marketplace-checkout-success',
  imports: [RouterLink],
  templateUrl: './checkout-success.html',
  styleUrl: './market.scss',
})
export class MarketplaceCheckoutSuccessComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private started = false;

  readonly purchase = signal<MarketplacePurchase | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    effect(() => {
      if (!this.auth.bootstrapped() || this.started) {
        return;
      }
      this.started = true;
      untracked(() => this.confirm());
    });
  }

  private confirm(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id') ?? '';
    if (!sessionId) {
      this.loading.set(false);
      this.error.set('Missing Checkout session.');
      return;
    }
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { next: `/marketplace/checkout/success?session_id=${sessionId}` },
      });
      return;
    }
    this.api.confirmMarketplaceCheckout(sessionId).subscribe({
      next: (purchase) => {
        this.purchase.set(purchase);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(marketError(err, 'Could not confirm this payment.'));
      },
    });
  }
}
