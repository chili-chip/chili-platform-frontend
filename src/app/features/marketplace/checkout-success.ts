import { Component, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MarketplacePurchase } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SpinnerComponent } from '../../shared/loading';
import { UI } from '../../shared/ui';
import { marketError } from './market-utils';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-marketplace-checkout-success',
  imports: [UI, RouterLink, SpinnerComponent],
  templateUrl: './checkout-success.html',
  styleUrl: './market.scss',
})
export class MarketplaceCheckoutSuccessComponent {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
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
      this.error.set('This payment link is incomplete. Return to the marketplace and try again.');
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
        this.toast.success('Payment confirmed. The game is in your library.');
      },
      error: (err) => {
        this.loading.set(false);
        const message = marketError(err, 'We could not confirm this payment.');
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }
}
