import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { GameProject, MarketplaceListing } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { downloadBitsy } from '../play/bitsy-file';
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
  readonly game = signal<GameProject | null>(null);
  readonly loading = signal(true);
  readonly buying = signal(false);
  readonly error = signal('');
  readonly priceLabel = formatPrice;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGame(Number(id));
      return;
    }
    this.loadListing(this.route.snapshot.paramMap.get('slug') ?? '');
  }

  inLibrary(): boolean {
    return this.listing()?.in_library === true || this.game()?.in_library === true;
  }

  playId(): number | null {
    return this.listing()?.game.id ?? this.game()?.id ?? null;
  }

  ownerName(): string {
    return this.listing()?.game.owner ?? this.game()?.owner ?? '';
  }

  ownReleased(): boolean {
    const name = this.auth.currentUser()?.username;
    if (!name || name !== this.ownerName()) {
      return false;
    }
    const copy = this.game();
    if (copy) {
      return copy.released;
    }
    return this.listing() !== null;
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

  download(): void {
    const id = this.playId();
    if (!id) {
      return;
    }
    const fallback = this.listing()?.game.slug ?? this.game()?.slug ?? 'game';
    this.error.set('');
    this.api.getGame(id).subscribe({
      next: (loaded) => {
        if (!loaded.data) {
          this.error.set('This game has no Bitsy file.');
          return;
        }
        downloadBitsy(loaded.slug || fallback, loaded.data);
      },
      error: (err) => this.error.set(marketError(err, 'Could not download this game.')),
    });
  }

  private loadGame(id: number): void {
    this.api.getGame(id).subscribe({
      next: (game) => {
        if (game.listing_slug) {
          void this.router.navigate(['/marketplace', game.listing_slug], { replaceUrl: true });
          return;
        }
        this.game.set(game);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(marketError(err, 'This game is not available.'));
      },
    });
  }

  private loadListing(slug: string): void {
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
}
