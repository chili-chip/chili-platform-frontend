import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MarketplaceListing } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { formatPrice, marketError } from './market-utils';

@Component({
  selector: 'app-game-page',
  imports: [RouterLink],
  templateUrl: './game-page.html',
  styleUrl: './market.scss',
})
export class GamePageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly listing = signal<MarketplaceListing | null>(null);
  readonly loading = signal(true);
  readonly buying = signal(false);
  readonly error = signal('');
  readonly priceLabel = formatPrice;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.api.getMarketplaceListing(slug).subscribe({
      next: (listing) => {
        this.listing.set(listing);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(marketError(err, 'This game is not listed.'));
      },
    });
  }

  ownListing(listing: MarketplaceListing): boolean {
    return this.auth.currentUser()?.username === listing.game.owner;
  }

  buy(listing: MarketplaceListing): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { next: `/marketplace/${listing.slug}` } });
      return;
    }
    this.buying.set(true);
    this.error.set('');
    this.api.checkoutListing(listing.slug).subscribe({
      next: (result) => {
        if (result.free || !result.checkout_url) {
          const name = this.auth.currentUser()?.username;
          void this.router.navigate(['/profile', name], {
            queryParams: { tab: 'library', shelf: 'bought' },
          });
          return;
        }
        window.location.assign(result.checkout_url);
      },
      error: (err) => {
        this.buying.set(false);
        this.error.set(marketError(err, 'Could not start checkout.'));
      },
    });
  }
}
