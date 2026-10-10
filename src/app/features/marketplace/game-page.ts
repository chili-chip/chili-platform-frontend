import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { GameProject, MarketplaceListing } from '../../core/models/platform';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SkeletonDetailComponent, SpinnerComponent } from '../../shared/loading';
import { MarkdownComponent } from '../../shared/markdown';
import { UI } from '../../shared/ui';
import { downloadBitsy } from '../play/bitsy-file';
import { formatPrice, marketError } from './market-utils';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-game-page',
  imports: [UI, MarkdownComponent, RouterLink, SkeletonDetailComponent, SpinnerComponent],
  templateUrl: './game-page.html',
  styleUrl: './market.scss',
})
export class GamePageComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly listing = signal<MarketplaceListing | null>(null);
  readonly game = signal<GameProject | null>(null);
  readonly loading = signal(true);
  readonly buying = signal(false);
  readonly savingRating = signal(false);
  readonly starHover = signal(0);
  readonly pickedStars = signal(0);
  readonly comment = signal('');
  readonly error = signal('');
  readonly priceLabel = formatPrice;
  readonly starChoices = [1, 2, 3, 4, 5];

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

  ratingSummary(listing: MarketplaceListing): string {
    const score = listing.rating_average === null ? '—' : listing.rating_average.toFixed(1);
    const label = listing.rating_count === 1 ? 'rating' : 'ratings';
    return `${score} · ${listing.rating_count} ${label}`;
  }

  filledStars(count: number): string {
    return '★★★★★☆☆☆☆☆'.slice(5 - count, 10 - count);
  }

  canRate(listing: MarketplaceListing): boolean {
    return listing.in_library && listing.my_rating === null && !this.savingRating();
  }

  shownStars(): number {
    return this.starHover() || this.pickedStars();
  }

  rate(listing: MarketplaceListing): void {
    const stars = this.pickedStars();
    if (!this.canRate(listing) || stars < 1) {
      return;
    }
    this.savingRating.set(true);
    this.error.set('');
    this.api.rateMarketplaceListing(listing.slug, stars, this.comment()).subscribe({
      next: (updated) => {
        this.listing.set(updated);
        this.savingRating.set(false);
        this.starHover.set(0);
        this.pickedStars.set(0);
        this.comment.set('');
        this.toast.success('Thanks, your rating was saved.');
      },
      error: (err) => {
        this.savingRating.set(false);
        const message = marketError(err, 'Could not save your rating.');
        this.error.set(message);
        this.toast.error(message);
      },
    });
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
          this.toast.success('Added to your library.');
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
        const message = marketError(err, 'Could not start checkout.');
        this.error.set(message);
        this.toast.error(message);
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
